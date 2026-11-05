import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import app from '../src/app.js';
import { config } from '../src/config/env.js';
import { User } from '../src/models/User.js';
import { Customer } from '../src/models/Customer.js';
import { Invoice } from '../src/models/Invoice.js';
import { Payment } from '../src/models/Payment.js';

let server;
let baseUrl;
let userAToken;
let userBToken;
let adminToken;
let suspendedUserToken;

let userA;
let userB;
let adminUser;
let suspendedUser;

let userBCustomer;
let userBInvoice;

describe('Critical Security and Multi-User Isolation Tests', () => {
  before(async () => {
    // Connect to test database
    const testDbUri = process.env.MONGODB_TEST_URI || 'mongodb://127.0.0.1:27017/invoicehub_test';
    await mongoose.connect(testDbUri);

    // Clean test collections
    await User.deleteMany({});
    await Customer.deleteMany({});
    await Invoice.deleteMany({});
    await Payment.deleteMany({});

    // Start ephemeral server
    server = app.listen(0);
    const port = server.address().port;
    baseUrl = `http://127.0.0.1:${port}/api/v1`;

    // Create User A
    userA = await User.create({
      name: 'Alice User',
      email: 'alice@test.com',
      passwordHash: await User.hashPassword('Password123!'),
      role: 'user',
      status: 'active'
    });
    userAToken = jwt.sign({ id: userA._id, role: userA.role }, config.jwtSecret);

    // Create User B
    userB = await User.create({
      name: 'Bob User',
      email: 'bob@test.com',
      passwordHash: await User.hashPassword('Password123!'),
      role: 'user',
      status: 'active'
    });
    userBToken = jwt.sign({ id: userB._id, role: userB.role }, config.jwtSecret);

    // Create Admin
    adminUser = await User.create({
      name: 'Admin User',
      email: 'admin@test.com',
      passwordHash: await User.hashPassword('AdminPassword123!'),
      role: 'admin',
      status: 'active'
    });
    adminToken = jwt.sign({ id: adminUser._id, role: adminUser.role }, config.jwtSecret);

    // Create Suspended User
    suspendedUser = await User.create({
      name: 'Suspended User',
      email: 'suspended@test.com',
      passwordHash: await User.hashPassword('Password123!'),
      role: 'user',
      status: 'suspended'
    });
    suspendedUserToken = jwt.sign({ id: suspendedUser._id, role: suspendedUser.role }, config.jwtSecret);

    // Create User B's Customer
    userBCustomer = await Customer.create({
      ownerId: userB._id,
      name: 'Bob Secret Client',
      email: 'secret@client.com'
    });

    // Create User B's Invoice
    userBInvoice = await Invoice.create({
      ownerId: userB._id,
      customerId: userBCustomer._id,
      invoiceNumber: 'INV-BOB-001',
      lifecycleState: 'issued',
      issueDate: new Date(),
      dueDate: new Date(Date.now() + 86400000),
      currency: 'USD',
      items: [
        { description: 'Classified Consulting', quantity: 1, unitPrice: 500, lineSubtotal: 500, lineTotal: 500 }
      ],
      subtotal: 500,
      grandTotal: 500,
      amountPaid: 0,
      balanceDue: 500,
      paymentStatus: 'unpaid'
    });
  });

  after(async () => {
    if (server) server.close();
    await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
  });

  it('1. User A cannot retrieve User B invoice (404/Isolated)', async () => {
    const res = await fetch(`${baseUrl}/invoices/${userBInvoice._id}`, {
      headers: { Authorization: `Bearer ${userAToken}` }
    });
    assert.strictEqual(res.status, 404);
  });

  it('2. User A cannot edit or delete User B invoice', async () => {
    const editRes = await fetch(`${baseUrl}/invoices/${userBInvoice._id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userAToken}`
      },
      body: JSON.stringify({ notes: 'Hacked by User A' })
    });
    assert.strictEqual(editRes.status, 404);

    const deleteRes = await fetch(`${baseUrl}/invoices/${userBInvoice._id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${userAToken}` }
    });
    assert.strictEqual(deleteRes.status, 404);
  });

  it('3. User A cannot download User B invoice PDF', async () => {
    const res = await fetch(`${baseUrl}/invoices/${userBInvoice._id}/pdf`, {
      headers: { Authorization: `Bearer ${userAToken}` }
    });
    assert.strictEqual(res.status, 404);
  });

  it('4. User A cannot record a payment against User B invoice', async () => {
    const res = await fetch(`${baseUrl}/invoices/${userBInvoice._id}/payments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userAToken}`
      },
      body: JSON.stringify({ amount: 100, method: 'Cash' })
    });
    assert.strictEqual(res.status, 404);
  });

  it('5. User A cannot retrieve User B customer information', async () => {
    const res = await fetch(`${baseUrl}/customers/${userBCustomer._id}`, {
      headers: { Authorization: `Bearer ${userAToken}` }
    });
    assert.strictEqual(res.status, 404);
  });

  it('6. Regular user cannot access admin endpoints (403 Forbidden)', async () => {
    const res = await fetch(`${baseUrl}/admin/dashboard`, {
      headers: { Authorization: `Bearer ${userAToken}` }
    });
    assert.strictEqual(res.status, 403);
  });

  it('7. Regular user cannot escalate their role via profile updates', async () => {
    const res = await fetch(`${baseUrl}/users/me`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userAToken}`
      },
      body: JSON.stringify({ name: 'Alice Hacker', role: 'admin' })
    });
    assert.strictEqual(res.status, 200);

    const check = await User.findById(userA._id);
    assert.strictEqual(check.role, 'user');
  });

  it('8. Suspended user is rejected from protected operations (403)', async () => {
    const res = await fetch(`${baseUrl}/dashboard/summary`, {
      headers: { Authorization: `Bearer ${suspendedUserToken}` }
    });
    assert.strictEqual(res.status, 403);
    const body = await res.json();
    assert.strictEqual(body.error.code, 'ACCOUNT_SUSPENDED');
  });

  it('9. Client cannot forge invoice totals (server recalculates)', async () => {
    const fakePayload = {
      items: [{ description: 'Item 1', quantity: 2, unitPrice: 100 }],
      grandTotal: 1, // Attacker tries to pay $1 instead of $200
      balanceDue: 1
    };

    const res = await fetch(`${baseUrl}/invoices`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userAToken}`
      },
      body: JSON.stringify(fakePayload)
    });

    assert.strictEqual(res.status, 201);
    const body = await res.json();
    assert.strictEqual(body.data.grandTotal, 200);
    assert.strictEqual(body.data.balanceDue, 200);
  });

  it('10. Overpayment is rejected to protect financial integrity', async () => {
    // userBInvoice has balanceDue 500. Attempt payment of 600
    const res = await fetch(`${baseUrl}/invoices/${userBInvoice._id}/payments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userBToken}`
      },
      body: JSON.stringify({ amount: 600, method: 'Cash' })
    });

    assert.strictEqual(res.status, 400);
    const body = await res.json();
    assert.strictEqual(body.error.code, 'OVERPAYMENT_REJECTED');
  });

  it('11. Unauthorized requests cannot access dashboard statistics (401)', async () => {
    const res = await fetch(`${baseUrl}/dashboard/summary`);
    assert.strictEqual(res.status, 401);
  });

  it('12. Admin can access admin dashboard and metrics', async () => {
    const res = await fetch(`${baseUrl}/admin/dashboard`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.ok(body.data.users.total >= 4);
  });
});
