import { Invoice } from '../models/Invoice.js';
import { Customer } from '../models/Customer.js';
import { BusinessProfile } from '../models/BusinessProfile.js';
import { Payment } from '../models/Payment.js';
import { calculateInvoiceTotals, deriveInvoiceStatus } from '../utils/calculationEngine.js';
import { generateInvoicePDF } from '../services/pdfService.js';
import { logAuditEvent } from '../services/auditService.js';

// Helper to generate a sequential unique invoice number for a user
const generateNextInvoiceNumber = async (ownerId) => {
  const count = await Invoice.countDocuments({ ownerId });
  const year = new Date().getFullYear();
  const month = String(new Date().getMonth() + 1).padStart(2, '0');
  const sequence = String(count + 1).padStart(4, '0');
  let invoiceNumber = `INV-${year}${month}-${sequence}`;

  // Ensure uniqueness
  let exists = await Invoice.findOne({ ownerId, invoiceNumber });
  let offset = 1;
  while (exists) {
    invoiceNumber = `INV-${year}${month}-${String(count + 1 + offset).padStart(4, '0')}`;
    exists = await Invoice.findOne({ ownerId, invoiceNumber });
    offset++;
  }

  return invoiceNumber;
};

export const getInvoices = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page || '1', 10));
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit || '20', 10)));
    const { status, search, startDate, endDate, sort = '-createdAt' } = req.query;

    const query = { ownerId: req.user._id };

    if (status && status !== 'all') {
      query.paymentStatus = status;
    }

    if (search) {
      query.$or = [
        { invoiceNumber: { $regex: search, $options: 'i' } },
        { 'customerSnapshot.name': { $regex: search, $options: 'i' } }
      ];
    }

    if (startDate || endDate) {
      query.issueDate = {};
      if (startDate) query.issueDate.$gte = new Date(startDate);
      if (endDate) query.issueDate.$lte = new Date(endDate);
    }

    const total = await Invoice.countDocuments(query);
    const invoices = await Invoice.find(query)
      .populate('customerId', 'name email phone')
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit);

    // Refresh dynamically derived statuses (e.g. check if became overdue)
    const now = new Date();
    const updatedInvoices = invoices.map((inv) => {
      const derived = deriveInvoiceStatus(inv, now);
      if (derived !== inv.paymentStatus) {
        inv.paymentStatus = derived;
        // background update without blocking
        Invoice.updateOne({ _id: inv._id }, { paymentStatus: derived }).exec();
      }
      return inv;
    });

    res.status(200).json({
      success: true,
      data: updatedInvoices,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getInvoiceById = async (req, res, next) => {
  try {
    const invoice = await Invoice.findOne({
      _id: req.params.id,
      ownerId: req.user._id
    }).populate('customerId', 'name email phone billingAddress city state postalCode country taxId');

    if (!invoice) {
      return res.status(404).json({
        error: {
          code: 'INVOICE_NOT_FOUND',
          message: 'Invoice not found or unauthorized.'
        }
      });
    }

    // Refresh status if overdue
    const derived = deriveInvoiceStatus(invoice);
    if (derived !== invoice.paymentStatus) {
      invoice.paymentStatus = derived;
      await invoice.save();
    }

    const payments = await Payment.find({
      invoiceId: invoice._id,
      ownerId: req.user._id
    }).sort({ paymentDate: -1 });

    res.status(200).json({
      success: true,
      data: invoice,
      payments
    });
  } catch (error) {
    next(error);
  }
};

export const createInvoice = async (req, res, next) => {
  try {
    const {
      customerId,
      dueDate,
      currency = 'INR',
      items = [],
      discountType = 'percentage',
      discountValue = 0,
      taxRate = 0,
      additionalCharges = 0,
      notes = '',
      terms = '',
      issueImmediately = false
    } = req.body;

    let customer = null;
    let customerSnapshot = {};
    if (customerId) {
      customer = await Customer.findOne({ _id: customerId, ownerId: req.user._id });
      if (!customer) {
        return res.status(400).json({
          error: {
            code: 'INVALID_CUSTOMER',
            message: 'Selected customer not found or does not belong to you.'
          }
        });
      }
      customerSnapshot = {
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        billingAddress: customer.billingAddress,
        city: customer.city,
        state: customer.state,
        postalCode: customer.postalCode,
        country: customer.country,
        taxId: customer.taxId
      };
    }

    const businessProfile = await BusinessProfile.findOne({ ownerId: req.user._id });
    const sellerSnapshot = businessProfile
      ? {
          businessName: businessProfile.businessName,
          email: businessProfile.email,
          phone: businessProfile.phone,
          address: businessProfile.address,
          city: businessProfile.city,
          state: businessProfile.state,
          postalCode: businessProfile.postalCode,
          country: businessProfile.country,
          taxId: businessProfile.taxId,
          logoUrl: businessProfile.logoUrl
        }
      : {
          businessName: req.user.name,
          email: req.user.email
        };

    // Calculate totals server-side
    const calculation = calculateInvoiceTotals(items, {
      discountType,
      discountValue,
      taxRate,
      additionalCharges,
      amountPaid: 0
    });

    const invoiceNumber = await generateNextInvoiceNumber(req.user._id);

    const calcDueDate = dueDate ? new Date(dueDate) : new Date(Date.now() + 15 * 24 * 60 * 60 * 1000);

    const lifecycleState = issueImmediately ? 'issued' : 'draft';
    const paymentStatus = issueImmediately
      ? deriveInvoiceStatus({ lifecycleState: 'issued', dueDate: calcDueDate, balanceDue: calculation.balanceDue, amountPaid: 0 })
      : 'draft';

    const invoice = await Invoice.create({
      ownerId: req.user._id,
      customerId: customer ? customer._id : undefined,
      invoiceNumber,
      lifecycleState,
      issueDate: new Date(),
      dueDate: calcDueDate,
      currency: (currency || businessProfile?.defaultCurrency || 'INR').toUpperCase(),
      sellerSnapshot,
      customerSnapshot,
      items: calculation.items,
      subtotal: calculation.subtotal,
      discountType: calculation.discountType,
      discountValue: calculation.discountValue,
      discountAmount: calculation.discountAmount,
      taxRate: Number(taxRate) || 0,
      taxTotal: calculation.taxTotal,
      additionalCharges: calculation.additionalCharges,
      grandTotal: calculation.grandTotal,
      amountPaid: 0,
      balanceDue: calculation.balanceDue,
      paymentStatus,
      notes: notes || businessProfile?.invoiceNotes || '',
      terms: terms || businessProfile?.defaultPaymentTerms || '',
      issuedAt: issueImmediately ? new Date() : undefined
    });

    if (issueImmediately) {
      await logAuditEvent({
        actorId: req.user._id,
        actorEmail: req.user.email,
        actorRole: req.user.role,
        action: 'INVOICE_ISSUED',
        targetType: 'Invoice',
        targetId: invoice._id,
        metadata: { invoiceNumber: invoice.invoiceNumber, grandTotal: invoice.grandTotal }
      });
    }

    res.status(201).json({
      success: true,
      message: issueImmediately ? 'Invoice issued successfully.' : 'Invoice draft saved successfully.',
      data: invoice
    });
  } catch (error) {
    next(error);
  }
};

export const updateInvoice = async (req, res, next) => {
  try {
    const invoice = await Invoice.findOne({
      _id: req.params.id,
      ownerId: req.user._id
    });

    if (!invoice) {
      return res.status(404).json({
        error: {
          code: 'INVOICE_NOT_FOUND',
          message: 'Invoice not found or unauthorized.'
        }
      });
    }

    if (invoice.lifecycleState !== 'draft') {
      return res.status(400).json({
        error: {
          code: 'INVOICE_NOT_EDITABLE',
          message: 'Issued or void invoices cannot be modified directly. Please create an adjustment or void.'
        }
      });
    }

    const {
      customerId,
      dueDate,
      currency,
      items,
      discountType,
      discountValue,
      taxRate,
      additionalCharges,
      notes,
      terms
    } = req.body;

    if (customerId) {
      const customer = await Customer.findOne({ _id: customerId, ownerId: req.user._id });
      if (!customer) {
        return res.status(400).json({
          error: {
            code: 'INVALID_CUSTOMER',
            message: 'Selected customer not found or unauthorized.'
          }
        });
      }
      invoice.customerId = customer._id;
      invoice.customerSnapshot = {
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        billingAddress: customer.billingAddress,
        city: customer.city,
        state: customer.state,
        postalCode: customer.postalCode,
        country: customer.country,
        taxId: customer.taxId
      };
    }

    if (dueDate) invoice.dueDate = new Date(dueDate);
    if (currency) invoice.currency = currency.toUpperCase();
    if (notes !== undefined) invoice.notes = notes;
    if (terms !== undefined) invoice.terms = terms;

    const itemsToCalculate = items !== undefined ? items : invoice.items;
    const discountTypeToCalc = discountType !== undefined ? discountType : invoice.discountType;
    const discountValToCalc = discountValue !== undefined ? discountValue : invoice.discountValue;
    const taxRateToCalc = taxRate !== undefined ? taxRate : invoice.taxRate;
    const additionalChargesToCalc = additionalCharges !== undefined ? additionalCharges : invoice.additionalCharges;

    const calculation = calculateInvoiceTotals(itemsToCalculate, {
      discountType: discountTypeToCalc,
      discountValue: discountValToCalc,
      taxRate: taxRateToCalc,
      additionalCharges: additionalChargesToCalc,
      amountPaid: invoice.amountPaid || 0
    });

    invoice.items = calculation.items;
    invoice.subtotal = calculation.subtotal;
    invoice.discountType = calculation.discountType;
    invoice.discountValue = calculation.discountValue;
    invoice.discountAmount = calculation.discountAmount;
    invoice.taxRate = Number(taxRateToCalc) || 0;
    invoice.taxTotal = calculation.taxTotal;
    invoice.additionalCharges = calculation.additionalCharges;
    invoice.grandTotal = calculation.grandTotal;
    invoice.balanceDue = calculation.balanceDue;

    await invoice.save();

    res.status(200).json({
      success: true,
      message: 'Invoice draft updated successfully.',
      data: invoice
    });
  } catch (error) {
    next(error);
  }
};

export const issueInvoice = async (req, res, next) => {
  try {
    const invoice = await Invoice.findOne({
      _id: req.params.id,
      ownerId: req.user._id
    });

    if (!invoice) {
      return res.status(404).json({
        error: {
          code: 'INVOICE_NOT_FOUND',
          message: 'Invoice not found or unauthorized.'
        }
      });
    }

    if (invoice.lifecycleState !== 'draft') {
      return res.status(400).json({
        error: {
          code: 'ALREADY_ISSUED',
          message: `Invoice is already in '${invoice.lifecycleState}' state.`
        }
      });
    }

    if (!invoice.items || invoice.items.length === 0) {
      return res.status(400).json({
        error: {
          code: 'NO_ITEMS',
          message: 'Cannot issue an invoice without any line items.'
        }
      });
    }

    // Refresh seller snapshot
    const businessProfile = await BusinessProfile.findOne({ ownerId: req.user._id });
    if (businessProfile) {
      invoice.sellerSnapshot = {
        businessName: businessProfile.businessName,
        email: businessProfile.email,
        phone: businessProfile.phone,
        address: businessProfile.address,
        city: businessProfile.city,
        state: businessProfile.state,
        postalCode: businessProfile.postalCode,
        country: businessProfile.country,
        taxId: businessProfile.taxId,
        logoUrl: businessProfile.logoUrl
      };
    }

    // Refresh customer snapshot if customerId is set
    if (invoice.customerId) {
      const customer = await Customer.findOne({ _id: invoice.customerId, ownerId: req.user._id });
      if (customer) {
        invoice.customerSnapshot = {
          name: customer.name,
          email: customer.email,
          phone: customer.phone,
          billingAddress: customer.billingAddress,
          city: customer.city,
          state: customer.state,
          postalCode: customer.postalCode,
          country: customer.country,
          taxId: customer.taxId
        };
      }
    }

    invoice.lifecycleState = 'issued';
    invoice.issuedAt = new Date();
    invoice.paymentStatus = deriveInvoiceStatus({
      lifecycleState: 'issued',
      dueDate: invoice.dueDate,
      balanceDue: invoice.balanceDue,
      amountPaid: invoice.amountPaid
    });

    await invoice.save();

    await logAuditEvent({
      actorId: req.user._id,
      actorEmail: req.user.email,
      actorRole: req.user.role,
      action: 'INVOICE_ISSUED',
      targetType: 'Invoice',
      targetId: invoice._id,
      metadata: { invoiceNumber: invoice.invoiceNumber, grandTotal: invoice.grandTotal }
    });

    res.status(200).json({
      success: true,
      message: 'Invoice issued successfully.',
      data: invoice
    });
  } catch (error) {
    next(error);
  }
};

export const voidInvoice = async (req, res, next) => {
  try {
    const invoice = await Invoice.findOne({
      _id: req.params.id,
      ownerId: req.user._id
    });

    if (!invoice) {
      return res.status(404).json({
        error: {
          code: 'INVOICE_NOT_FOUND',
          message: 'Invoice not found or unauthorized.'
        }
      });
    }

    if (invoice.lifecycleState === 'void') {
      return res.status(400).json({
        error: {
          code: 'ALREADY_VOID',
          message: 'Invoice is already voided.'
        }
      });
    }

    if (invoice.lifecycleState === 'draft') {
      return res.status(400).json({
        error: {
          code: 'CANNOT_VOID_DRAFT',
          message: 'Draft invoices can be deleted instead of voided.'
        }
      });
    }

    invoice.lifecycleState = 'void';
    invoice.paymentStatus = 'void';
    invoice.voidedAt = new Date();

    await invoice.save();

    await logAuditEvent({
      actorId: req.user._id,
      actorEmail: req.user.email,
      actorRole: req.user.role,
      action: 'INVOICE_VOIDED',
      targetType: 'Invoice',
      targetId: invoice._id,
      reason: req.body.reason || 'User cancelled invoice'
    });

    res.status(200).json({
      success: true,
      message: 'Invoice has been voided.',
      data: invoice
    });
  } catch (error) {
    next(error);
  }
};

export const deleteInvoice = async (req, res, next) => {
  try {
    const invoice = await Invoice.findOne({
      _id: req.params.id,
      ownerId: req.user._id
    });

    if (!invoice) {
      return res.status(404).json({
        error: {
          code: 'INVOICE_NOT_FOUND',
          message: 'Invoice not found or unauthorized.'
        }
      });
    }

    if (invoice.lifecycleState !== 'draft') {
      return res.status(400).json({
        error: {
          code: 'CANNOT_DELETE_ISSUED',
          message: 'Issued or void invoices cannot be permanently deleted. Please use the void action to preserve audit trail.'
        }
      });
    }

    await Invoice.deleteOne({ _id: invoice._id });

    res.status(200).json({
      success: true,
      message: 'Draft invoice deleted successfully.'
    });
  } catch (error) {
    next(error);
  }
};

export const downloadInvoicePDF = async (req, res, next) => {
  try {
    const invoice = await Invoice.findOne({
      _id: req.params.id,
      ownerId: req.user._id
    });

    if (!invoice) {
      return res.status(404).json({
        error: {
          code: 'INVOICE_NOT_FOUND',
          message: 'Invoice not found or unauthorized.'
        }
      });
    }

    const pdfBuffer = await generateInvoicePDF(invoice);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="Invoice-${invoice.invoiceNumber}.pdf"`
    );
    res.send(pdfBuffer);
  } catch (error) {
    next(error);
  }
};
