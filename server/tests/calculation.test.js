import { describe, it } from 'node:test';
import assert from 'node:assert';
import { calculateInvoiceTotals, deriveInvoiceStatus, round2 } from '../src/utils/calculationEngine.js';

describe('Invoice Calculation Engine Tests', () => {
  it('should match the specification example accurately', () => {
    // Spec Example:
    // Service A: 2 × 1,000 = 2,000
    // Service B: 1 × 500 = 500
    // Subtotal = 2,500
    // Discount = 10% = 250
    // Taxable Amount = 2,250
    // Tax = 18% = 405
    // Grand Total = 2,655
    // Payment Received = 1,000
    // Balance Due = 1,655

    const items = [
      { description: 'Service A', quantity: 2, unitPrice: 1000, taxRate: 0 },
      { description: 'Service B', quantity: 1, unitPrice: 500, taxRate: 0 }
    ];

    const result = calculateInvoiceTotals(items, {
      discountType: 'percentage',
      discountValue: 10,
      taxRate: 18,
      amountPaid: 1000
    });

    assert.strictEqual(result.subtotal, 2500);
    assert.strictEqual(result.discountAmount, 250);
    assert.strictEqual(result.taxableAmount, 2250);
    assert.strictEqual(result.taxTotal, 405);
    assert.strictEqual(result.grandTotal, 2655);
    assert.strictEqual(result.amountPaid, 1000);
    assert.strictEqual(result.balanceDue, 1655);
  });

  it('should handle zero quantities and negative input gracefully without negative totals', () => {
    const items = [
      { description: 'Zero Qty', quantity: 0, unitPrice: 50 },
      { description: 'Negative Qty', quantity: -5, unitPrice: 100 }
    ];

    const result = calculateInvoiceTotals(items, {
      discountValue: 20
    });

    assert.strictEqual(result.subtotal, 0);
    assert.strictEqual(result.discountAmount, 0);
    assert.strictEqual(result.grandTotal, 0);
    assert.strictEqual(result.balanceDue, 0);
  });

  it('should cap fixed discounts at subtotal to prevent negative totals', () => {
    const items = [
      { description: 'Service', quantity: 1, unitPrice: 100 }
    ];

    const result = calculateInvoiceTotals(items, {
      discountType: 'fixed',
      discountValue: 150 // Greater than subtotal
    });

    assert.strictEqual(result.subtotal, 100);
    assert.strictEqual(result.discountAmount, 100);
    assert.strictEqual(result.taxableAmount, 0);
    assert.strictEqual(result.grandTotal, 0);
  });

  it('should round numbers accurately to two decimal places', () => {
    assert.strictEqual(round2(10.254), 10.25);
    assert.strictEqual(round2(10.256), 10.26);
    assert.strictEqual(round2(1.005), 1.01);
  });
});

describe('Invoice Status Derivation Tests', () => {
  it('should return draft if lifecycleState is draft', () => {
    const status = deriveInvoiceStatus({
      lifecycleState: 'draft',
      dueDate: new Date(Date.now() - 10000),
      balanceDue: 100,
      amountPaid: 0
    });
    assert.strictEqual(status, 'draft');
  });

  it('should return void if lifecycleState is void', () => {
    const status = deriveInvoiceStatus({
      lifecycleState: 'void',
      dueDate: new Date(Date.now() - 10000),
      balanceDue: 100,
      amountPaid: 0
    });
    assert.strictEqual(status, 'void');
  });

  it('should return paid if balanceDue is 0 and amountPaid > 0', () => {
    const status = deriveInvoiceStatus({
      lifecycleState: 'issued',
      dueDate: new Date(),
      balanceDue: 0,
      amountPaid: 500
    });
    assert.strictEqual(status, 'paid');
  });

  it('should return overdue if dueDate is in the past and balanceDue > 0', () => {
    const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const status = deriveInvoiceStatus({
      lifecycleState: 'issued',
      dueDate: pastDate,
      balanceDue: 200,
      amountPaid: 0
    });
    assert.strictEqual(status, 'overdue');
  });

  it('should return partially_paid if balanceDue > 0 and amountPaid > 0 and dueDate in future', () => {
    const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const status = deriveInvoiceStatus({
      lifecycleState: 'issued',
      dueDate: futureDate,
      balanceDue: 200,
      amountPaid: 100
    });
    assert.strictEqual(status, 'partially_paid');
  });
});
