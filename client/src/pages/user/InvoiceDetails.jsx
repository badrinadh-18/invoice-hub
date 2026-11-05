import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Printer,
  Download,
  CreditCard,
  Ban,
  ArrowLeft,
  Edit2,
  Trash2,
  Send,
  Building2,
  Users,
  CheckCircle2,
  Receipt,
  Calendar,
  AlertTriangle
} from 'lucide-react';
import api from '../../services/api';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import PaymentModal from '../../components/invoices/PaymentModal';
import { formatCurrency, formatDate } from '../../utils/formatters';
import toast from 'react-hot-toast';

export default function InvoiceDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [invoice, setInvoice] = useState(null);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals & Action states
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [voidModalOpen, setVoidModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchInvoice = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/invoices/${id}`);
      setInvoice(res.data.data);
      setPayments(res.data.payments || []);
    } catch (err) {
      toast.error('Failed to load invoice details.');
      navigate('/invoices');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoice();
  }, [id]);

  const handlePrint = () => {
    window.print();
  };

  const handleIssueInvoice = async () => {
    try {
      setActionLoading(true);
      await api.post(`/invoices/${id}/issue`);
      toast.success('Invoice issued successfully!');
      fetchInvoice();
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Failed to issue invoice.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleVoidInvoice = async () => {
    try {
      setActionLoading(true);
      await api.post(`/invoices/${id}/void`, { reason: 'User cancelled invoice' });
      toast.success('Invoice marked as void.');
      setVoidModalOpen(false);
      fetchInvoice();
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Failed to void invoice.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteDraft = async () => {
    try {
      setActionLoading(true);
      await api.delete(`/invoices/${id}`);
      toast.success('Draft invoice deleted.');
      navigate('/invoices');
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Failed to delete invoice.');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="py-16">
        <LoadingSpinner size="large" text="Loading invoice..." />
      </div>
    );
  }

  if (!invoice) return null;

  const seller = invoice.sellerSnapshot || {};
  const customer = invoice.customerSnapshot || {};
  const isDraft = invoice.lifecycleState === 'draft';
  const isIssued = invoice.lifecycleState === 'issued';
  const isVoid = invoice.lifecycleState === 'void';

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Action Bar (Hidden when printing) */}
      <div className="no-print flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <Link
            to="/invoices"
            className="p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                {invoice.invoiceNumber}
              </h1>
              <StatusBadge status={invoice.paymentStatus} />
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Created {formatDate(invoice.createdAt)}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Print */}
          <Button variant="secondary" icon={Printer} size="sm" onClick={handlePrint}>
            Print
          </Button>

          {/* PDF Download */}
          {isIssued && (
            <a
              href={`${api.defaults.baseURL}/invoices/${invoice._id}/pdf`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="secondary" icon={Download} size="sm">
                PDF
              </Button>
            </a>
          )}

          {/* Record Payment */}
          {isIssued && invoice.balanceDue > 0 && (
            <Button
              variant="primary"
              icon={CreditCard}
              size="sm"
              onClick={() => setPaymentModalOpen(true)}
            >
              Record Payment
            </Button>
          )}

          {/* Issue Draft */}
          {isDraft && (
            <Button
              variant="primary"
              icon={Send}
              size="sm"
              loading={actionLoading}
              onClick={handleIssueInvoice}
            >
              Issue Invoice
            </Button>
          )}

          {/* Edit Draft */}
          {isDraft && (
            <Link to={`/invoices/${invoice._id}/edit`}>
              <Button variant="secondary" icon={Edit2} size="sm">
                Edit Draft
              </Button>
            </Link>
          )}

          {/* Delete Draft */}
          {isDraft && (
            <Button
              variant="danger"
              icon={Trash2}
              size="sm"
              onClick={() => setDeleteModalOpen(true)}
            >
              Delete
            </Button>
          )}

          {/* Void Issued */}
          {isIssued && (
            <Button
              variant="secondary"
              icon={Ban}
              size="sm"
              onClick={() => setVoidModalOpen(true)}
            >
              Void
            </Button>
          )}
        </div>
      </div>

      {/* Branded Printable Invoice Card */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 sm:p-10 print-card space-y-8">
        {/* Document Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start gap-6 border-b border-slate-100 pb-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-brand-700 flex items-center justify-center text-white">
                <Receipt className="w-4 h-4" />
              </div>
              <span className="font-extrabold text-xl text-slate-900 tracking-tight">
                INVOICE<span className="text-brand-700">HUB</span>
              </span>
            </div>
            <h2 className="text-lg font-bold text-slate-900">
              {seller.businessName || 'Business Name'}
            </h2>
            <div className="text-xs text-slate-500 space-y-0.5 mt-1">
              {seller.address && <p>{seller.address}</p>}
              {(seller.city || seller.state || seller.postalCode) && (
                <p>{`${seller.city || ''} ${seller.state || ''} ${seller.postalCode || ''}`.trim()}</p>
              )}
              {seller.country && <p>{seller.country}</p>}
              {seller.email && <p>Email: {seller.email}</p>}
              {seller.phone && <p>Phone: {seller.phone}</p>}
              {seller.taxId && <p>Tax ID: {seller.taxId}</p>}
            </div>
          </div>

          <div className="sm:text-right">
            <span className="text-xs uppercase tracking-widest font-bold text-brand-700 block mb-1">
              INVOICE
            </span>
            <p className="text-2xl font-extrabold text-slate-900">{invoice.invoiceNumber}</p>

            <div className="mt-3 text-xs text-slate-600 space-y-1">
              <div className="flex sm:justify-end gap-2">
                <span className="text-slate-400">Issue Date:</span>
                <span className="font-semibold text-slate-800">{formatDate(invoice.issueDate)}</span>
              </div>
              <div className="flex sm:justify-end gap-2">
                <span className="text-slate-400">Due Date:</span>
                <span className="font-semibold text-slate-800">{formatDate(invoice.dueDate)}</span>
              </div>
              <div className="flex sm:justify-end gap-2">
                <span className="text-slate-400">Currency:</span>
                <span className="font-semibold text-slate-800">{invoice.currency}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bill To Customer Section */}
        <div className="border-b border-slate-100 pb-6">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1.5">
            Bill To:
          </span>
          <h3 className="text-base font-bold text-slate-900">
            {customer.name || 'Valued Customer'}
          </h3>
          <div className="text-xs text-slate-500 space-y-0.5 mt-1">
            {customer.billingAddress && <p>{customer.billingAddress}</p>}
            {(customer.city || customer.state || customer.postalCode) && (
              <p>{`${customer.city || ''} ${customer.state || ''} ${customer.postalCode || ''}`.trim()}</p>
            )}
            {customer.country && <p>{customer.country}</p>}
            {customer.email && <p>Email: {customer.email}</p>}
            {customer.phone && <p>Phone: {customer.phone}</p>}
            {customer.taxId && <p>Tax ID: {customer.taxId}</p>}
          </div>
        </div>

        {/* Line Items Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-700">
            <thead className="bg-slate-50 text-xs font-semibold text-slate-500 uppercase tracking-wider border-y border-slate-200">
              <tr>
                <th className="px-4 py-3">Description</th>
                <th className="px-4 py-3 text-right">Quantity</th>
                <th className="px-4 py-3 text-right">Unit Price</th>
                <th className="px-4 py-3 text-right">Tax Rate</th>
                <th className="px-4 py-3 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {invoice.items?.map((item, index) => (
                <tr key={index}>
                  <td className="px-4 py-3 font-medium text-slate-900">{item.description}</td>
                  <td className="px-4 py-3 text-right text-slate-600">{item.quantity}</td>
                  <td className="px-4 py-3 text-right text-slate-600">
                    {formatCurrency(item.unitPrice, invoice.currency)}
                  </td>
                  <td className="px-4 py-3 text-right text-slate-500">
                    {item.taxRate > 0 ? `${item.taxRate}%` : '-'}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-slate-900">
                    {formatCurrency(item.lineSubtotal, invoice.currency)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals Breakdown */}
        <div className="flex justify-end pt-4">
          <div className="w-full sm:w-72 space-y-2 text-xs sm:text-sm">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal:</span>
              <span className="font-semibold text-slate-900">
                {formatCurrency(invoice.subtotal, invoice.currency)}
              </span>
            </div>

            {invoice.discountAmount > 0 && (
              <div className="flex justify-between text-slate-600">
                <span>
                  Discount ({invoice.discountType === 'percentage' ? `${invoice.discountValue}%` : 'Fixed'}):
                </span>
                <span className="text-rose-600 font-medium">
                  -{formatCurrency(invoice.discountAmount, invoice.currency)}
                </span>
              </div>
            )}

            {invoice.taxTotal > 0 && (
              <div className="flex justify-between text-slate-600">
                <span>Tax Total:</span>
                <span className="font-semibold text-slate-900">
                  +{formatCurrency(invoice.taxTotal, invoice.currency)}
                </span>
              </div>
            )}

            {invoice.additionalCharges > 0 && (
              <div className="flex justify-between text-slate-600">
                <span>Other Charges:</span>
                <span className="font-semibold text-slate-900">
                  +{formatCurrency(invoice.additionalCharges, invoice.currency)}
                </span>
              </div>
            )}

            <div className="border-t border-slate-200 pt-2 flex justify-between font-bold text-base text-slate-900">
              <span>Grand Total:</span>
              <span className="text-brand-700">
                {formatCurrency(invoice.grandTotal, invoice.currency)}
              </span>
            </div>

            <div className="flex justify-between text-slate-600">
              <span>Amount Paid:</span>
              <span className="font-semibold text-emerald-600">
                {formatCurrency(invoice.amountPaid, invoice.currency)}
              </span>
            </div>

            <div className="bg-teal-50 border border-teal-200 p-2.5 rounded-lg flex justify-between font-bold text-sm text-teal-900">
              <span>Balance Due:</span>
              <span className="text-brand-800">
                {formatCurrency(invoice.balanceDue, invoice.currency)}
              </span>
            </div>
          </div>
        </div>

        {/* Notes & Terms */}
        {(invoice.notes || invoice.terms) && (
          <div className="border-t border-slate-100 pt-6 text-xs text-slate-500 space-y-3">
            {invoice.notes && (
              <div>
                <span className="font-semibold text-slate-700 uppercase tracking-wider block mb-0.5">
                  Payment Instructions & Notes:
                </span>
                <p className="whitespace-pre-line text-slate-600">{invoice.notes}</p>
              </div>
            )}
            {invoice.terms && (
              <div>
                <span className="font-semibold text-slate-700 uppercase tracking-wider block mb-0.5">
                  Terms & Conditions:
                </span>
                <p className="whitespace-pre-line text-slate-600">{invoice.terms}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Payment History Card */}
      {isIssued && (
        <div className="no-print">
          <Card
            title="Payment History"
            subtitle="Authoritative audit of all payments recorded against this invoice"
            noPadding
          >
            {payments.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-700">
                  <thead className="bg-slate-50 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="px-5 py-3">Date</th>
                      <th className="px-5 py-3">Method</th>
                      <th className="px-5 py-3">Reference</th>
                      <th className="px-5 py-3 text-right">Amount</th>
                      <th className="px-5 py-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {payments.map((p) => (
                      <tr key={p._id}>
                        <td className="px-5 py-3 text-slate-900 font-medium">
                          {formatDate(p.paymentDate)}
                        </td>
                        <td className="px-5 py-3 text-slate-700">{p.method}</td>
                        <td className="px-5 py-3 text-slate-500 text-xs font-mono">
                          {p.reference || '-'}
                        </td>
                        <td className="px-5 py-3 text-right font-semibold text-emerald-700">
                          {formatCurrency(p.amount, p.currency)}
                        </td>
                        <td className="px-5 py-3 text-center">
                          <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                            {p.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-6 text-center text-sm text-slate-400">
                No payments recorded yet. Click "Record Payment" above to register funds.
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Payment Recording Modal */}
      <PaymentModal
        isOpen={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        invoice={invoice}
        onSuccess={fetchInvoice}
      />

      {/* Void Confirmation Modal */}
      <Modal
        isOpen={voidModalOpen}
        onClose={() => setVoidModalOpen(false)}
        title="Void Invoice"
        subtitle={`Invoice ${invoice.invoiceNumber}`}
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-xs sm:text-sm">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-amber-900">Confirm Invalidation</p>
              Are you sure you want to void this invoice? This action cannot be reversed.
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setVoidModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" loading={actionLoading} onClick={handleVoidInvoice}>
              Confirm Void
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Draft Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Delete Draft"
        subtitle={`Draft ${invoice.invoiceNumber}`}
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            Are you sure you want to permanently delete this unissued draft invoice?
          </p>
          <div className="flex items-center justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setDeleteModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" loading={actionLoading} onClick={handleDeleteDraft}>
              Delete Draft
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
