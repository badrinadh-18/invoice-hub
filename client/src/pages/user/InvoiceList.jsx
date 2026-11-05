import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText,
  PlusCircle,
  Search,
  Filter,
  Download,
  CreditCard,
  Edit2,
  Trash2,
  Ban,
  Eye,
  Calendar,
  AlertTriangle
} from 'lucide-react';
import api from '../../services/api';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import PaymentModal from '../../components/invoices/PaymentModal';
import { formatCurrency, formatDate } from '../../utils/formatters';
import toast from 'react-hot-toast';

export default function InvoiceList() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Action states
  const [paymentInvoice, setPaymentInvoice] = useState(null);
  const [voidTarget, setVoidTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      let url = `/invoices?page=${page}&limit=10&search=${encodeURIComponent(search)}`;
      if (statusFilter !== 'all') {
        url += `&status=${statusFilter}`;
      }
      const res = await api.get(url);
      setInvoices(res.data.data);
      setTotalPages(res.data.pagination.totalPages || 1);
      setTotalCount(res.data.pagination.total || 0);
    } catch (err) {
      toast.error('Failed to load invoices.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, [page, search, statusFilter]);

  const handleVoidInvoice = async () => {
    if (!voidTarget) return;
    try {
      setActionLoading(true);
      await api.post(`/invoices/${voidTarget._id}/void`, { reason: 'User marked as void' });
      toast.success('Invoice voided successfully.');
      setVoidTarget(null);
      fetchInvoices();
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Failed to void invoice.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteDraft = async () => {
    if (!deleteTarget) return;
    try {
      setActionLoading(true);
      await api.delete(`/invoices/${deleteTarget._id}`);
      toast.success('Draft invoice removed.');
      setDeleteTarget(null);
      fetchInvoices();
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Failed to delete invoice.');
    } finally {
      setActionLoading(false);
    }
  };

  const statuses = [
    { label: 'All', value: 'all' },
    { label: 'Draft', value: 'draft' },
    { label: 'Unpaid', value: 'unpaid' },
    { label: 'Partially Paid', value: 'partially_paid' },
    { label: 'Paid', value: 'paid' },
    { label: 'Overdue', value: 'overdue' },
    { label: 'Void', value: 'void' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Invoice Records</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Manage your draft, issued, and settled bills ({totalCount} total).
          </p>
        </div>

        <Link to="/invoices/new">
          <Button variant="primary" icon={PlusCircle}>
            Create Invoice
          </Button>
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <Card noPadding className="p-4 space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search by invoice number or customer name..."
              className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-slate-300 focus:border-brand-700 focus:ring-1 focus:ring-brand-700 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
            {statuses.map((s) => (
              <button
                key={s.value}
                onClick={() => {
                  setStatusFilter(s.value);
                  setPage(1);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                  statusFilter === s.value
                    ? 'bg-brand-700 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Invoice Table */}
      <Card noPadding>
        {loading ? (
          <div className="py-12">
            <LoadingSpinner text="Loading invoice records..." />
          </div>
        ) : invoices.length > 0 ? (
          <div>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-700">
                <thead className="bg-slate-50/70 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="px-5 py-3">Invoice Number</th>
                    <th className="px-5 py-3">Customer</th>
                    <th className="px-5 py-3">Issue Date</th>
                    <th className="px-5 py-3">Due Date</th>
                    <th className="px-5 py-3 text-right">Grand Total</th>
                    <th className="px-5 py-3 text-right">Balance Due</th>
                    <th className="px-5 py-3 text-center">Status</th>
                    <th className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {invoices.map((inv) => (
                    <tr key={inv._id} className="hover:bg-slate-50/80 transition">
                      <td className="px-5 py-3.5 font-semibold text-slate-900 whitespace-nowrap">
                        <Link to={`/invoices/${inv._id}`} className="hover:text-brand-700">
                          {inv.invoiceNumber}
                        </Link>
                      </td>
                      <td className="px-5 py-3.5 text-slate-800 font-medium">
                        {inv.customerSnapshot?.name || inv.customerId?.name || 'Customer'}
                      </td>
                      <td className="px-5 py-3.5 text-slate-500 whitespace-nowrap">
                        {formatDate(inv.issueDate)}
                      </td>
                      <td className="px-5 py-3.5 text-slate-500 whitespace-nowrap">
                        {formatDate(inv.dueDate)}
                      </td>
                      <td className="px-5 py-3.5 text-right font-semibold text-slate-900 whitespace-nowrap">
                        {formatCurrency(inv.grandTotal, inv.currency)}
                      </td>
                      <td className="px-5 py-3.5 text-right font-medium text-amber-700 whitespace-nowrap">
                        {formatCurrency(inv.balanceDue, inv.currency)}
                      </td>
                      <td className="px-5 py-3.5 text-center whitespace-nowrap">
                        <StatusBadge status={inv.paymentStatus} />
                      </td>
                      <td className="px-5 py-3.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* View details */}
                          <Link
                            to={`/invoices/${inv._id}`}
                            className="p-1.5 text-slate-500 hover:text-brand-700 hover:bg-slate-100 rounded-lg transition"
                            title="View Invoice"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>

                          {/* PDF download (only if issued) */}
                          {inv.lifecycleState === 'issued' && (
                            <a
                              href={`${api.defaults.baseURL}/invoices/${inv._id}/pdf`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 text-slate-500 hover:text-brand-700 hover:bg-slate-100 rounded-lg transition"
                              title="Download PDF"
                            >
                              <Download className="w-4 h-4" />
                            </a>
                          )}

                          {/* Record payment (only if issued and balance > 0) */}
                          {inv.lifecycleState === 'issued' && inv.balanceDue > 0 && (
                            <button
                              onClick={() => setPaymentInvoice(inv)}
                              className="p-1.5 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition"
                              title="Record Payment"
                            >
                              <CreditCard className="w-4 h-4" />
                            </button>
                          )}

                          {/* Edit (only if draft) */}
                          {inv.lifecycleState === 'draft' && (
                            <Link
                              to={`/invoices/${inv._id}/edit`}
                              className="p-1.5 text-slate-500 hover:text-brand-700 hover:bg-slate-100 rounded-lg transition"
                              title="Edit Draft"
                            >
                              <Edit2 className="w-4 h-4" />
                            </Link>
                          )}

                          {/* Delete (only if draft) */}
                          {inv.lifecycleState === 'draft' && (
                            <button
                              onClick={() => setDeleteTarget(inv)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                              title="Delete Draft"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}

                          {/* Void (only if issued) */}
                          {inv.lifecycleState === 'issued' && (
                            <button
                              onClick={() => setVoidTarget(inv)}
                              className="p-1.5 text-slate-400 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition"
                              title="Void Invoice"
                            >
                              <Ban className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card List View */}
            <div className="md:hidden divide-y divide-slate-100">
              {invoices.map((inv) => (
                <div key={inv._id} className="p-3.5 space-y-2.5 hover:bg-slate-50/70 transition">
                  <div className="flex items-center justify-between">
                    <Link
                      to={`/invoices/${inv._id}`}
                      className="font-bold text-sm text-brand-700 hover:underline flex items-center gap-1.5"
                    >
                      {inv.invoiceNumber}
                    </Link>
                    <StatusBadge status={inv.paymentStatus} />
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-800 truncate max-w-[65%]">
                      {inv.customerSnapshot?.name || inv.customerId?.name || 'Customer'}
                    </span>
                    <span className="text-slate-500">
                      Due: {formatDate(inv.dueDate)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-slate-50">
                    <div>
                      <p className="text-[11px] text-slate-400">Total</p>
                      <p className="font-bold text-sm text-slate-900">
                        {formatCurrency(inv.grandTotal, inv.currency)}
                      </p>
                    </div>

                    {inv.balanceDue > 0 && (
                      <div className="text-right">
                        <p className="text-[11px] text-amber-600">Balance Due</p>
                        <p className="font-bold text-sm text-amber-700">
                          {formatCurrency(inv.balanceDue, inv.currency)}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Mobile Actions Toolbar */}
                  <div className="flex items-center justify-end gap-1.5 pt-1">
                    <Link
                      to={`/invoices/${inv._id}`}
                      className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition"
                    >
                      View
                    </Link>

                    {inv.lifecycleState === 'issued' && (
                      <a
                        href={`${api.defaults.baseURL}/invoices/${inv._id}/pdf`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 transition"
                        title="Download PDF"
                      >
                        <Download className="w-4 h-4" />
                      </a>
                    )}

                    {inv.lifecycleState === 'issued' && inv.balanceDue > 0 && (
                      <button
                        onClick={() => setPaymentInvoice(inv)}
                        className="px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1"
                      >
                        <CreditCard className="w-3.5 h-3.5" />
                        Pay
                      </button>
                    )}

                    {inv.lifecycleState === 'draft' && (
                      <Link
                        to={`/invoices/${inv._id}/edit`}
                        className="px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-brand-50 text-brand-700 border border-brand-200"
                      >
                        Edit
                      </Link>
                    )}

                    {inv.lifecycleState === 'draft' && (
                      <button
                        onClick={() => setDeleteTarget(inv)}
                        className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}

                    {inv.lifecycleState === 'issued' && (
                      <button
                        onClick={() => setVoidTarget(inv)}
                        className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg"
                        title="Void"
                      >
                        <Ban className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span>
                  Page {page} of {totalPages}
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => setPage(page - 1)}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={page >= totalPages}
                    onClick={() => setPage(page + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="p-8">
            <EmptyState
              icon={FileText}
              title={search || statusFilter !== 'all' ? 'No matching invoices' : 'No Invoices Yet'}
              description={
                search || statusFilter !== 'all'
                  ? 'No invoice records match your current filter parameters.'
                  : 'Start billing your clients by issuing your first invoice now.'
              }
              actionLabel={search || statusFilter !== 'all' ? 'Reset Filters' : 'Create First Invoice'}
              actionIcon={PlusCircle}
              onAction={() => {
                if (search || statusFilter !== 'all') {
                  setSearch('');
                  setStatusFilter('all');
                } else {
                  window.location.href = '/invoices/new';
                }
              }}
            />
          </div>
        )}
      </Card>

      {/* Payment Recording Modal */}
      <PaymentModal
        isOpen={!!paymentInvoice}
        onClose={() => setPaymentInvoice(null)}
        invoice={paymentInvoice}
        onSuccess={fetchInvoices}
      />

      {/* Void Confirmation Modal */}
      <Modal
        isOpen={!!voidTarget}
        onClose={() => setVoidTarget(null)}
        title="Void Invoice"
        subtitle={`Invoice ${voidTarget?.invoiceNumber}`}
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-xs sm:text-sm">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-amber-900">Irreversible Action</p>
              Are you sure you want to void this invoice? Voiding marks the bill as invalidated while preserving its record in the audit trail.
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setVoidTarget(null)}>
              Cancel
            </Button>
            <Button variant="danger" loading={actionLoading} onClick={handleVoidInvoice}>
              Confirm Void
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Draft Confirmation Modal */}
      <Modal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete Draft"
        subtitle={`Draft ${deleteTarget?.invoiceNumber}`}
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            Are you sure you want to permanently delete this unissued draft invoice? This cannot be undone.
          </p>
          <div className="flex items-center justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setDeleteTarget(null)}>
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
