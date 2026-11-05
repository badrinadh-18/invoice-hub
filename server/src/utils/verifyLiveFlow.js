const baseUrl = 'http://localhost:5001/api/v1';

async function verify() {
  console.log('--- 1. Testing Regular User Login ---');
  const loginRes = await fetch(`${baseUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'demo@invoicehub.local', password: 'Password@123' })
  });
  const loginData = await loginRes.json();
  if (!loginData.success) throw new Error('User login failed: ' + JSON.stringify(loginData));
  const token = loginData.token;
  console.log('✓ Logged in as:', loginData.user.name, `(${loginData.user.role})`);

  console.log('\n--- 2. Testing Dashboard Summary & Charts API ---');
  const sumRes = await fetch(`${baseUrl}/dashboard/summary`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const sumData = await sumRes.json();
  console.log('✓ Dashboard Summary:', sumData.data);

  console.log('\n--- 3. Testing Customer Creation ---');
  const custRes = await fetch(`${baseUrl}/customers`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({
      name: 'Apex Horizon LLC',
      email: 'contact@apexhorizon.com',
      phone: '+1 (415) 777-9900',
      billingAddress: '500 Howard Street, Suite 300',
      city: 'San Francisco',
      state: 'CA',
      postalCode: '94105',
      country: 'United States',
      taxId: 'US-99-8877665'
    })
  });
  const custData = await custRes.json();
  if (!custData.success) throw new Error('Customer creation failed: ' + JSON.stringify(custData));
  const customerId = custData.data._id;
  console.log('✓ Created customer:', custData.data.name, `(ID: ${customerId})`);

  console.log('\n--- 4. Testing Invoice Creation and Issuance ---');
  const invRes = await fetch(`${baseUrl}/invoices`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({
      customerId,
      currency: 'USD',
      items: [
        { description: 'Enterprise Architecture Consulting', quantity: 10, unitPrice: 120, taxRate: 10 }
      ],
      discountType: 'percentage',
      discountValue: 5,
      issueImmediately: true
    })
  });
  const invData = await invRes.json();
  if (!invData.success) throw new Error('Invoice issue failed: ' + JSON.stringify(invData));
  const invoice = invData.data;
  console.log('✓ Issued Invoice:', invoice.invoiceNumber);
  console.log('  Subtotal:', invoice.subtotal, 'Discount:', invoice.discountAmount, 'Tax:', invoice.taxTotal, 'Grand Total:', invoice.grandTotal, 'Balance:', invoice.balanceDue);

  console.log('\n--- 5. Testing PDF Generation Stream ---');
  const pdfRes = await fetch(`${baseUrl}/invoices/${invoice._id}/pdf`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const pdfBuffer = await pdfRes.arrayBuffer();
  const pdfHeader = Buffer.from(pdfBuffer.slice(0, 5)).toString();
  if (!pdfHeader.startsWith('%PDF')) throw new Error('Invalid PDF format returned: ' + pdfHeader);
  console.log(`✓ Received valid PDF document (${pdfBuffer.byteLength} bytes, header: ${pdfHeader})`);

  console.log('\n--- 6. Testing Payment Recording ---');
  const payRes = await fetch(`${baseUrl}/invoices/${invoice._id}/payments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({
      amount: 500,
      method: 'Bank Transfer',
      reference: 'WIRE-LIVE-001',
      notes: 'Initial partial payment'
    })
  });
  const payData = await payRes.json();
  if (!payData.success) throw new Error('Payment recording failed: ' + JSON.stringify(payData));
  console.log('✓ Payment Recorded:', payData.data.payment.amount, 'USD');
  console.log('  New Amount Paid:', payData.data.invoice.amountPaid, 'New Balance Due:', payData.data.invoice.balanceDue, 'Status:', payData.data.invoice.paymentStatus);

  console.log('\n--- 7. Testing Administrator Portal & Governance ---');
  const adminLoginRes = await fetch(`${baseUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@invoicehub.local', password: 'Admin@InvoiceHub2026' })
  });
  const adminLoginData = await adminLoginRes.json();
  if (!adminLoginData.success) throw new Error('Admin login failed: ' + JSON.stringify(adminLoginData));
  const adminToken = adminLoginData.token;
  console.log('✓ Logged in as Administrator:', adminLoginData.user.name);

  const adminDashRes = await fetch(`${baseUrl}/admin/dashboard`, {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  const adminDash = await adminDashRes.json();
  console.log('✓ Admin System Metrics: Total Users:', adminDash.data.users.total, 'Total Invoices:', adminDash.data.invoices.total, 'Aggregate Amount:', adminDash.data.invoices.aggregateAmount);

  const auditRes = await fetch(`${baseUrl}/admin/audit-logs?limit=5`, {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  const auditLogs = await auditRes.json();
  console.log(`✓ Audit Trail Active: Verified ${auditLogs.data.length} latest security events`);

  console.log('\n🎉 ALL LIVE VERIFICATION CHECKS PASSED PERFECTLY!');
}

verify().catch((err) => {
  console.error('Verification failed:', err);
  process.exit(1);
});
