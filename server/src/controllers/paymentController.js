import { Payment } from '../models/Payment.js';
import { Invoice } from '../models/Invoice.js';
import { round2, deriveInvoiceStatus } from '../utils/calculationEngine.js';
import { logAuditEvent } from '../services/auditService.js';

export const getInvoicePayments = async (req, res, next) => {
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

    const payments = await Payment.find({
      invoiceId: invoice._id,
      ownerId: req.user._id
    }).sort({ paymentDate: -1 });

    res.status(200).json({
      success: true,
      data: payments
    });
  } catch (error) {
    next(error);
  }
};

export const recordPayment = async (req, res, next) => {
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

    if (invoice.lifecycleState !== 'issued') {
      return res.status(400).json({
        error: {
          code: 'INVALID_INVOICE_STATE',
          message: `Cannot record payment for an invoice with lifecycle '${invoice.lifecycleState}'. Invoice must be issued.`
        }
      });
    }

    const amount = round2(Number(req.body.amount) || 0);
    if (amount <= 0) {
      return res.status(400).json({
        error: {
          code: 'INVALID_AMOUNT',
          message: 'Payment amount must be greater than zero.'
        }
      });
    }

    if (amount > invoice.balanceDue) {
      return res.status(400).json({
        error: {
          code: 'OVERPAYMENT_REJECTED',
          message: `Payment amount (${amount}) exceeds the outstanding balance due (${invoice.balanceDue}).`
        }
      });
    }

    const {
      method = 'Bank Transfer',
      paymentDate = new Date(),
      reference = '',
      notes = ''
    } = req.body;

    const payment = await Payment.create({
      ownerId: req.user._id,
      invoiceId: invoice._id,
      amount,
      currency: invoice.currency,
      paymentDate: new Date(paymentDate),
      method,
      reference,
      notes,
      status: 'completed',
      createdBy: req.user._id
    });

    // Update invoice financial balance
    invoice.amountPaid = round2(invoice.amountPaid + amount);
    invoice.balanceDue = round2(Math.max(0, invoice.grandTotal - invoice.amountPaid));
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
      action: 'PAYMENT_RECORDED',
      targetType: 'Payment',
      targetId: payment._id,
      metadata: {
        invoiceId: invoice._id,
        invoiceNumber: invoice.invoiceNumber,
        amount,
        balanceRemaining: invoice.balanceDue
      }
    });

    res.status(201).json({
      success: true,
      message: 'Payment recorded successfully.',
      data: {
        payment,
        invoice: {
          id: invoice._id,
          amountPaid: invoice.amountPaid,
          balanceDue: invoice.balanceDue,
          paymentStatus: invoice.paymentStatus
        }
      }
    });
  } catch (error) {
    next(error);
  }
};
