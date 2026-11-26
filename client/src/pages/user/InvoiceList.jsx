import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText,
  PlusCircle,
  Search,
  Download,
  CreditCard,
  Edit2,
  Trash2,
  Ban,
  Eye,
  AlertTriangle,
  MessageCircle
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
import { downloadInvoicePdf } from '../../utils/downloadPdf';
import { shareViaWhatsApp } from '../../utils/whatsappShare';
import toast from 'react-hot-toast';

export default function InvoiceList() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Action states
  const [paymentInvoice, setPaymentInvoice] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      let url = `/invoices?page=${page}&limit=10&search=${encodeURIComponent(search)}`;
      if (statusFilter !== 'all') {
        url += `&status=${statusFilter}`;
      }
      if (typeFilter !== 'all') {
        url += `&type=${typeFilter}`;
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
  }, [page, search, statusFilter, typeFilter]);

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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Invoice Records</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Manage your draft, issued, and settled bills ({totalCount} total).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link to="/invoices/new?type=sale">
            <Button variant="primary" icon={PlusCircle}>
              New Sale
            </Button>
          </Link>
          <Link to="/invoices/new?type=purchase">
            <Button
              variant="secondary"
              icon={PlusCircle}
              className="border-emerald-600 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
            >
              New Purchase
            </Button>
          </Link>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <Card noPadding className="p-4 space-y-3">
        {/* Bill Type Selector Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3 overflow-x-auto">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider mr-1">Type:</span>
          {[
            { label: 'All Bills', value: 'all' },
            { label: '🏷️ Sales Only', value: 'sale' },
            { label: '📦 Purchases Only', value: 'purchase' }
          ].map((t) => (
            <button
              key={t.value}
              onClick={() => {
                setTypeFilter(t.value);
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                typeFilter === t.value
                  ? t.value === 'purchase'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-brand-700 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

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
              placeholder="Search by invoice number, company, or customer name..."
              className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:border-brand-700 focus:ring-1 focus:ring-brand-700 focus:outline-none"
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
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${statusFilter === s.value
                    ? 'bg-brand-700 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
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
              <table className="w-full text-left text-sm text-slate-700 dark:text-slate-300">
                <thead className="bg-slate-50/70 dark:bg-slate-800/60 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="px-5 py-3">Number / Type</th>
                    <th className="px-5 py-3">Customer / Company</th>
                    <th className="px-5 py-3">Issue Date</th>
                    <th className="px-5 py-3">Due Date</th>
                    <th className="px-5 py-3 text-right">Grand Total</th>
                    <th className="px-5 py-3 text-right">Balance Due</th>
                    <th className="px-5 py-3 text-center">Status</th>
                    <th className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {invoices.map((inv) => (
                    <tr key={inv._id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition">
                      <td className="px-5 py-3.5 font-semibold text-slate-900 dark:text-white whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Link to={`/invoices/${inv._id}`} className="hover:text-brand-700 dark:hover:text-brand-400">
                            {inv.invoiceNumber}
                          </Link>
                          {inv.invoiceType === 'purchase' ? (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                              PUR
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-brand-50 dark:bg-brand-950/80 text-brand-700 dark:text-brand-300 border border-brand-200 dark:border-brand-800">
                              SALE
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-slate-800 dark:text-slate-200 font-medium">
                        <div>
                          <p>{inv.customerSnapshot?.name || inv.customerId?.name || (inv.invoiceType === 'purchase' ? 'Company Name' : 'Customer')}</p>
                          {inv.customerSnapshot?.phone && (
                            <p className="text-[11px] text-slate-400 dark:text-slate-500">{inv.customerSnapshot.phone}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                        {formatDate(inv.issueDate)}
                      </td>
                      <td className="px-5 py-3.5 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                        {formatDate(inv.dueDate)}
                      </td>
                      <td className="px-5 py-3.5 text-right font-semibold text-slate-900 dark:text-white whitespace-nowrap">
                        {formatCurrency(inv.grandTotal, inv.currency)}
                      </td>
                      <td className="px-5 py-3.5 text-right font-medium text-amber-700 dark:text-amber-400 whitespace-nowrap">
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
                            className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-brand-700 dark:hover:text-brand-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
                            title="View Invoice"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>

                          {/* WhatsApp share */}
                          <button
                            onClick={() => shareViaWhatsApp(inv)}
                            className="p-1.5 text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-lg transition"
                            title="Share via WhatsApp"
                          >
                            <MessageCircle className="w-4 h-4" />
                          </button>

                          {/* PDF download (only if issued) */}
                          {inv.lifecycleState === 'issued' && (
                            <button
                              onClick={() => downloadInvoicePdf(inv._id, inv.invoiceNumber)}
                              className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-brand-700 dark:hover:text-brand-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
                              title="Download PDF"
                            >
                              <Download className="w-4 h-4" />
                            </button>
                          )}

                          {/* Record payment (only if issued and balance > 0) */}
                          {inv.lifecycleState === 'issued' && inv.balanceDue > 0 && (
                            <button
                              onClick={() => setPaymentInvoice(inv)}
                              className="p-1.5 text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-lg transition"
                              title="Record Payment"
                            >
                              <CreditCard className="w-4 h-4" />
                            </button>
                          )}

                          {/* Edit (available for all active invoices) */}
                          {inv.lifecycleState !== 'void' && (
                            <Link
                              to={`/invoices/${inv._id}/edit`}
                              className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-brand-700 dark:hover:text-brand-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
                              title="Edit Invoice"
                            >
                              <Edit2 className="w-4 h-4" />
                            </Link>
                          )}

                          {/* Delete (only if draft) */}
                          {inv.lifecycleState === 'draft' && (
                            <button
                              onClick={() => setDeleteTarget(inv)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition"
                              title="Delete Draft"
                            >
                              <Trash2 className="w-4 h-4" />
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
            <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-800">
              {invoices.map((inv) => (
                <div key={inv._id} className="p-3.5 space-y-2.5 hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Link
                        to={`/invoices/${inv._id}`}
                        className="font-bold text-sm text-brand-700 dark:text-brand-400 hover:underline flex items-center gap-1.5"
                      >
                        {inv.invoiceNumber}
                      </Link>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                        inv.invoiceType === 'purchase'
                          ? 'bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                          : 'bg-brand-50 dark:bg-brand-950/80 text-brand-700 dark:text-brand-300 border-brand-200 dark:border-brand-800'
                      }`}>
                        {inv.invoiceType === 'purchase' ? 'Purchase' : 'Sale'}
                      </span>
                    </div>
                    <StatusBadge status={inv.paymentStatus} />
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[65%]">
                      {inv.invoiceType === 'purchase' ? '🏢 ' : '👤 '}
                      {inv.customerSnapshot?.name || inv.customerId?.name || (inv.invoiceType === 'purchase' ? 'Company Name' : 'Customer')}
                    </span>
                    <span className="text-slate-500 dark:text-slate-400">
                      Due: {formatDate(inv.dueDate)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-slate-50 dark:border-slate-800">
                    <div>
                      <p className="text-[11px] text-slate-400 dark:text-slate-500">Total</p>
                      <p className="font-bold text-sm text-slate-900 dark:text-white">
                        {formatCurrency(inv.grandTotal, inv.currency)}
                      </p>
                    </div>

                    {inv.balanceDue > 0 && (
                      <div className="text-right">
                        <p className="text-[11px] text-amber-600 dark:text-amber-400">Balance Due</p>
                        <p className="font-bold text-sm text-amber-700 dark:text-amber-300">
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

                    {/* WhatsApp share */}
                    <button
                      onClick={() => shareViaWhatsApp(inv)}
                      className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 transition"
                      title="Share via WhatsApp"
                    >
                      <MessageCircle className="w-4 h-4" />
                    </button>

                    {inv.lifecycleState === 'issued' && (
                      <button
                        onClick={() => downloadInvoicePdf(inv._id, inv.invoiceNumber)}
                        className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 transition"
                        title="Download PDF"
                      >
                        <Download className="w-4 h-4" />
                      </button>
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

                    {inv.lifecycleState !== 'void' && (
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

                    {/* WhatsApp share */}
                    <button
                      onClick={() => shareViaWhatsApp(inv)}
                      className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 transition"
                      title="Share via WhatsApp"
                    >
                      <MessageCircle className="w-4 h-4" />
                    </button>
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
                  navigate('/invoices/new');
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
