import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { connectDB } from '../config/db.js';
import { User } from '../models/User.js';
import { BusinessProfile } from '../models/BusinessProfile.js';
import { Customer } from '../models/Customer.js';
import { Invoice } from '../models/Invoice.js';
import { Payment } from '../models/Payment.js';
import { AuditLog } from '../models/AuditLog.js';
import { calculateInvoiceTotals, deriveInvoiceStatus } from './calculationEngine.js';

dotenv.config();

const seed = async () => {
  await connectDB();
  console.log('[Seed] Connected to database. Preparing seeding...');

  const adminEmail = (process.env.ADMIN_EMAIL || 'admin@invoicehub.local').toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@InvoiceHub2026';
  const adminName = process.env.ADMIN_NAME || 'System Administrator';

  // Check or provision Admin
  let admin = await User.findOne({ email: adminEmail });
  if (!admin) {
    const passwordHash = await User.hashPassword(adminPassword);
    admin = await User.create({
      name: adminName,
      email: adminEmail,
      passwordHash,
      role: 'admin',
      status: 'active'
    });
    console.log(`[Seed] Provisioned Admin: ${adminEmail}`);
  } else {
    console.log(`[Seed] Admin already exists: ${adminEmail}`);
  }

  // Provision Demo User
  const demoEmail = 'demo@invoicehub.local';
  const demoPassword = 'Password@123';
  let demoUser = await User.findOne({ email: demoEmail });

  if (!demoUser) {
    const passwordHash = await User.hashPassword(demoPassword);
    demoUser = await User.create({
      name: 'Alex Morgan',
      email: demoEmail,
      passwordHash,
      role: 'user',
      status: 'active'
    });
    console.log(`[Seed] Provisioned Demo User: ${demoEmail}`);

    // Create Business Profile for Demo User
    await BusinessProfile.create({
      ownerId: demoUser._id,
      businessName: 'Apex Cloud Solutions Inc.',
      email: 'billing@apexcloud.io',
      phone: '+91 98765 43210',
      address: '742 Evergreen Terrace, Suite 400',
      city: 'San Francisco',
      state: 'CA',
      postalCode: '94105',
      country: 'United States',
      taxId: '',
      defaultCurrency: 'INR',
      defaultPaymentTerms: 'Net 30',
      invoiceNotes: 'Thank you for choosing Apex Cloud Solutions!'
    });

    // Create Sample Customers for Demo User
    const customer1 = await Customer.create({
      ownerId: demoUser._id,
      name: 'Acme Global Enterprises',
      email: 'accounts@acmeglobal.com',
      phone: '+91 98111 22334',
      billingAddress: '100 Market St, Fl 12',
      city: 'San Francisco',
      state: 'CA',
      postalCode: '94103',
      country: 'United States',
      taxId: ''
    });

    const customer2 = await Customer.create({
      ownerId: demoUser._id,
      name: 'TechForward Labs',
      email: 'finance@techforward.dev',
      phone: '+91 98222 33445',
      billingAddress: '350 5th Avenue',
      city: 'New York',
      state: 'NY',
      postalCode: '10118',
      country: 'United States',
      taxId: ''
    });

    // Create Sample Invoices for Demo User
    // 1. Issued & Paid invoice
    const items1 = [
      { description: 'Cloud Infrastructure Architecture Consulting', quantity: 20, unitPrice: 150, taxRate: 10 }
    ];
    const calc1 = calculateInvoiceTotals(items1, { discountType: 'percentage', discountValue: 5, amountPaid: 2850 });
    const inv1 = await Invoice.create({
      ownerId: demoUser._id,
      customerId: customer1._id,
      invoiceNumber: 'INV-202610-0001',
      lifecycleState: 'issued',
      issueDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      dueDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
      currency: 'INR',
      sellerSnapshot: {
        businessName: 'Apex Cloud Solutions Inc.',
        email: 'billing@apexcloud.io',
        address: '742 Evergreen Terrace, Suite 400',
        city: 'San Francisco',
        state: 'CA',
        postalCode: '94105',
        country: 'United States'
      },
      customerSnapshot: {
        name: customer1.name,
        email: customer1.email,
        billingAddress: customer1.billingAddress,
        city: customer1.city,
        state: customer1.state,
        country: customer1.country
      },
      items: calc1.items,
      subtotal: calc1.subtotal,
      discountType: calc1.discountType,
      discountValue: calc1.discountValue,
      discountAmount: calc1.discountAmount,
      taxTotal: calc1.taxTotal,
      grandTotal: calc1.grandTotal,
      amountPaid: 2850,
      balanceDue: 0,
      paymentStatus: 'paid',
      issuedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    });

    await Payment.create({
      ownerId: demoUser._id,
      invoiceId: inv1._id,
      amount: 2850,
      currency: 'USD',
      paymentDate: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
      method: 'Bank Transfer',
      reference: 'WIRE-99281-OK',
      createdBy: demoUser._id
    });

    // 2. Issued & Partially Paid invoice (Service A & B from spec: Subtotal 2500, discount 10%, taxable 2250, tax 18%, grand 2655, paid 1000, balance 1655)
    const items2 = [
      { description: 'Service A', quantity: 2, unitPrice: 1000, taxRate: 0 },
      { description: 'Service B', quantity: 1, unitPrice: 500, taxRate: 0 }
    ];
    const calc2 = calculateInvoiceTotals(items2, { discountType: 'percentage', discountValue: 10, taxRate: 18, amountPaid: 1000 });
    const inv2 = await Invoice.create({
      ownerId: demoUser._id,
      customerId: customer2._id,
      invoiceNumber: 'INV-202610-0002',
      lifecycleState: 'issued',
      issueDate: new Date(),
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      currency: 'INR',
      sellerSnapshot: {
        businessName: 'Apex Cloud Solutions Inc.',
        email: 'billing@apexcloud.io'
      },
      customerSnapshot: {
        name: customer2.name,
        email: customer2.email
      },
      items: calc2.items,
      subtotal: calc2.subtotal,
      discountType: calc2.discountType,
      discountValue: calc2.discountValue,
      discountAmount: calc2.discountAmount,
      taxRate: 18,
      taxTotal: calc2.taxTotal,
      grandTotal: calc2.grandTotal,
      amountPaid: 1000,
      balanceDue: 1655,
      paymentStatus: 'partially_paid',
      issuedAt: new Date()
    });

    await Payment.create({
      ownerId: demoUser._id,
      invoiceId: inv2._id,
      amount: 1000,
      currency: 'INR',
      paymentDate: new Date(),
      method: 'UPI',
      reference: 'UPI-771829038',
      createdBy: demoUser._id
    });

    // 3. Draft invoice
    const items3 = [
      { description: 'Monthly Retainer - Maintenance', quantity: 1, unitPrice: 1200, taxRate: 0 }
    ];
    const calc3 = calculateInvoiceTotals(items3, { discountValue: 0, amountPaid: 0 });
    await Invoice.create({
      ownerId: demoUser._id,
      customerId: customer1._id,
      invoiceNumber: 'INV-202610-0003',
      lifecycleState: 'draft',
      issueDate: new Date(),
      dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
      currency: 'USD',
      items: calc3.items,
      subtotal: calc3.subtotal,
      grandTotal: calc3.grandTotal,
      amountPaid: 0,
      balanceDue: calc3.balanceDue,
      paymentStatus: 'draft'
    });

    console.log('[Seed] Created sample business profile, customers, and invoices.');
  }

  console.log('[Seed] Seeding completed successfully!');
  await mongoose.disconnect();
  process.exit(0);
};

seed().catch((err) => {
  console.error('[Seed Error]', err);
  process.exit(1);
});
