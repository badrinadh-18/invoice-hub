/**
 * Decimal-safe arithmetic and financial calculation helper
 */

export const round2 = (val) => {
  return Math.round((Number(val) + Number.EPSILON) * 100) / 100;
};

/**
 * Calculates line items and invoice totals authoritatively on the server.
 *
 * @param {Array} items - Array of item objects { description, quantity, unitPrice, taxRate }
 * @param {Object} options - { discountType: 'percentage' | 'fixed', discountValue: number, taxRate: number, additionalCharges: number, amountPaid: number }
 */
export const calculateInvoiceTotals = (items = [], options = {}) => {
  const {
    discountType = 'percentage',
    discountValue = 0,
    taxRate: overallTaxRate = 0,
    additionalCharges = 0,
    amountPaid = 0
  } = options;

  let subtotal = 0;

  const processedItems = items.map((item) => {
    const qty = Math.max(0, Number(item.quantity) || 0);
    const unitPrice = Math.max(0, Number(item.unitPrice) || 0);
    const lineSubtotal = round2(qty * unitPrice);
    const lineTaxRate = Number(item.taxRate) || 0;
    const lineTax = round2((lineSubtotal * lineTaxRate) / 100);
    const lineTotal = round2(lineSubtotal + lineTax);

    subtotal = round2(subtotal + lineSubtotal);

    return {
      description: item.description?.trim() || '',
      quantity: qty,
      unitPrice: unitPrice,
      taxRate: lineTaxRate,
      lineSubtotal,
      lineTax,
      lineTotal
    };
  });

  // Calculate discount
  let discountAmount = 0;
  const numDiscountValue = Math.max(0, Number(discountValue) || 0);
  if (discountType === 'percentage') {
    const clampedPct = Math.min(100, numDiscountValue);
    discountAmount = round2((subtotal * clampedPct) / 100);
  } else {
    // Fixed amount
    discountAmount = round2(Math.min(subtotal, numDiscountValue));
  }

  const taxableAmount = round2(Math.max(0, subtotal - discountAmount));

  // If items didn't have individual tax rates or an overall tax rate is supplied
  // We compute total tax from items if any have taxRate > 0, otherwise from overallTaxRate
  let taxTotal = 0;
  const hasItemTaxes = processedItems.some((it) => it.taxRate > 0);
  if (hasItemTaxes) {
    // Proportional discount applied to items or sum of item taxes
    // Standard model: sum of line taxes scaled by (1 - discountRatio)
    const discountRatio = subtotal > 0 ? (subtotal - discountAmount) / subtotal : 0;
    taxTotal = round2(
      processedItems.reduce((acc, it) => acc + (it.lineTax * discountRatio), 0)
    );
  } else if (overallTaxRate > 0) {
    taxTotal = round2((taxableAmount * overallTaxRate) / 100);
  }

  const numAdditionalCharges = Math.max(0, Number(additionalCharges) || 0);
  const grandTotal = round2(taxableAmount + taxTotal + numAdditionalCharges);

  const numAmountPaid = round2(Math.max(0, Number(amountPaid) || 0));
  const balanceDue = round2(Math.max(0, grandTotal - numAmountPaid));

  return {
    items: processedItems,
    subtotal,
    discountType,
    discountValue: numDiscountValue,
    discountAmount,
    taxableAmount,
    taxTotal,
    additionalCharges: numAdditionalCharges,
    grandTotal,
    amountPaid: numAmountPaid,
    balanceDue
  };
};

/**
 * Derives payment status for an invoice.
 * Lifecycle states: 'draft', 'issued', 'void'
 * Status values: 'draft', 'unpaid', 'partially_paid', 'paid', 'overdue', 'void'
 */
export const deriveInvoiceStatus = (invoice, referenceDate = new Date()) => {
  const { lifecycleState, dueDate, balanceDue, amountPaid } = invoice;

  if (lifecycleState === 'draft') return 'draft';
  if (lifecycleState === 'void') return 'void';

  if (balanceDue <= 0 && amountPaid > 0) {
    return 'paid';
  }

  const isPastDue = dueDate && new Date(dueDate).getTime() < new Date(referenceDate).getTime();

  if (isPastDue && balanceDue > 0) {
    return 'overdue';
  }

  if (amountPaid > 0 && balanceDue > 0) {
    return 'partially_paid';
  }

  return 'unpaid';
};
