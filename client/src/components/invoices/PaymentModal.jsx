import React, { useState } from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import api from '../../services/api';
import { formatCurrency } from '../../utils/formatters';
import toast from 'react-hot-toast';

export default function PaymentModal({ isOpen, onClose, invoice, onSuccess }) {
  const [amount, setAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [method, setMethod] = useState('Bank Transfer');
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  if (!invoice) return null;

  const handleMaxAmount = () => {
    setAmount(String(invoice.balanceDue));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const numAmount = Number(amount);

    if (numAmount <= 0) {
      toast.error('Payment amount must be greater than zero.');
      return;
    }

    if (numAmount > invoice.balanceDue) {
      toast.error(`Payment amount cannot exceed the balance due of ${formatCurrency(invoice.balanceDue, invoice.currency)}.`);
      return;
    }

    try {
      setLoading(true);
      await api.post(`/invoices/${invoice._id}/payments`, {
        amount: numAmount,
        paymentDate,
        method,
        reference,
        notes
      });

      toast.success('Payment successfully recorded!');
      onSuccess?.();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Failed to record payment.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Record Payment"
      subtitle={`Invoice ${invoice.invoiceNumber} • Outstanding Balance: ${formatCurrency(invoice.balanceDue, invoice.currency)}`}
      maxWidth="max-w-md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
              Payment Amount ({invoice.currency}) *
            </label>
            <button
              type="button"
              onClick={handleMaxAmount}
              className="text-xs font-medium text-brand-700 hover:text-brand-800"
            >
              Pay Full ({formatCurrency(invoice.balanceDue, invoice.currency)})
            </button>
          </div>
          <input
            type="number"
            step="0.01"
            min="0.01"
            max={invoice.balanceDue}
            required
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-brand-700 focus:ring-1 focus:ring-brand-700 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
            Payment Date *
          </label>
          <input
            type="date"
            required
            value={paymentDate}
            onChange={(e) => setPaymentDate(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-brand-700 focus:ring-1 focus:ring-brand-700 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
            Payment Method *
          </label>
          <select
            value={method}
            onChange={(e) => setMethod(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-brand-700 focus:ring-1 focus:ring-brand-700 focus:outline-none bg-white"
          >
            <option value="Bank Transfer">Bank Transfer / Wire</option>
            <option value="Cash">Cash</option>
            <option value="UPI">UPI</option>
            <option value="Card">Credit / Debit Card</option>
            <option value="Cheque">Cheque</option>
            <option value="Other">Other</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
            Transaction Reference / Cheque No. (Optional)
          </label>
          <input
            type="text"
            value={reference}
            onChange={(e) => setReference(e.target.value)}
            placeholder="e.g. TXN-9948201 or Check #402"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-brand-700 focus:ring-1 focus:ring-brand-700 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
            Payment Notes (Optional)
          </label>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Internal notes or confirmation details..."
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-brand-700 focus:ring-1 focus:ring-brand-700 focus:outline-none"
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={loading}>
            Confirm Payment
          </Button>
        </div>
      </form>
    </Modal>
  );
}
