import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText,
  DollarSign,
  Clock,
  AlertCircle,
  PlusCircle,
  UserPlus,
  ArrowRight,
  TrendingUp,
  Download,
  CreditCard,
  Building2,
  Receipt
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import api from '../../services/api';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { downloadInvoicePdf } from '../../utils/downloadPdf';

const STATUS_COLORS = {
  paid: '#10B981', // emerald
  partially_paid: '#3B82F6', // blue
  unpaid: '#F59E0B', // amber
  overdue: '#EF4444', // rose
  draft: '#94A3B8', // slate
  void: '#64748B' // gray
};

export default function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [monthlyStats, setMonthlyStats] = useState([]);
  const [statusDistribution, setStatusDistribution] = useState([]);
  const [recentInvoices, setRecentInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const [sumRes, monthRes, distRes, invRes] = await Promise.all([
          api.get('/dashboard/summary'),
          api.get('/dashboard/monthly-stats'),
          api.get('/dashboard/invoice-status'),
          api.get('/invoices?limit=5&sort=-createdAt')
        ]);

        setSummary(sumRes.data.data);
        setMonthlyStats(monthRes.data.data);
        setStatusDistribution(distRes.data.data.filter((d) => d.count > 0));
        setRecentInvoices(invRes.data.data);
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="py-16">
        <LoadingSpinner size="large" text="Loading your financial metrics..." />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page Title & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Business Overview</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Real-time billing analytics, active receivables, and recent invoicing activity.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link to="/invoices/new">
            <Button variant="primary" icon={PlusCircle} size="sm">
              New Invoice
            </Button>
          </Link>
          <Link to="/customers">
            <Button variant="secondary" icon={UserPlus} size="sm">
              Add Customer
            </Button>
          </Link>
          <Link to="/business-profile">
            <Button variant="secondary" icon={Building2} size="sm">
              Settings
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-2.5 sm:gap-4">
        {/* Total Invoices */}
        <div className="bg-white p-3.5 sm:p-5 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1.5 sm:mb-2">
            <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider">Invoices</span>
            <FileText className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-xl sm:text-2xl font-bold text-slate-900">{summary?.totalInvoices || 0}</p>
          <span className="text-[11px] sm:text-xs text-slate-500 mt-0.5 inline-block truncate max-w-full">
            {summary?.draftCount || 0} drafts
          </span>
        </div>

        {/* Total Invoiced */}
        <div className="bg-white p-3.5 sm:p-5 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1.5 sm:mb-2">
            <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider">Invoiced</span>
            <TrendingUp className="w-4 h-4 text-brand-700" />
          </div>
          <p className="text-xl sm:text-2xl font-bold text-slate-900 truncate">
            {formatCurrency(summary?.totalInvoicedAmount || 0)}
          </p>
          <span className="text-[11px] sm:text-xs text-brand-700 font-medium mt-0.5 inline-block">
            Net total
          </span>
        </div>

        {/* Amount Paid */}
        <div className="bg-white p-3.5 sm:p-5 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1.5 sm:mb-2">
            <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider">Collected</span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-xl sm:text-2xl font-bold text-emerald-600 truncate">
            {formatCurrency(summary?.totalAmountPaid || 0)}
          </p>
          <span className="text-[11px] sm:text-xs text-emerald-700 font-medium mt-0.5 inline-block">
            Cleared
          </span>
        </div>

        {/* Outstanding Balance */}
        <div className="bg-white p-3.5 sm:p-5 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1.5 sm:mb-2">
            <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider">Receivables</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-xl sm:text-2xl font-bold text-amber-600 truncate">
            {formatCurrency(summary?.outstandingBalance || 0)}
          </p>
          <span className="text-[11px] sm:text-xs text-slate-500 mt-0.5 inline-block">
            Balance due
          </span>
        </div>

        {/* Overdue (Spans full width on 2-col mobile) */}
        <div className="col-span-2 lg:col-span-1 bg-white p-3.5 sm:p-5 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1.5 sm:mb-2">
            <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider">Overdue</span>
            <AlertCircle className="w-4 h-4 text-rose-500" />
          </div>
          <p className="text-xl sm:text-2xl font-bold text-rose-600">{summary?.overdueCount || 0}</p>
          <span className="text-[11px] sm:text-xs text-rose-700 font-medium mt-0.5 inline-block">
            Needs attention
          </span>
        </div>
      </div>

      {/* Analytics Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Billing Trend Chart (2 cols) */}
        <div className="lg:col-span-2">
          <Card
            title="Monthly Billing Performance"
            subtitle="Authoritative comparison of total invoiced vs payments received (Last 6 Months)"
          >
            <div className="h-72 w-full pt-4">
              {monthlyStats.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyStats} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis dataKey="name" stroke="#64748B" fontSize={12} tickLine={false} />
                    <YAxis stroke="#64748B" fontSize={12} tickLine={false} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0F172A', color: '#fff', borderRadius: '8px', border: 'none', fontSize: '12px' }}
                      formatter={(val) => [formatCurrency(val), '']}
                    />
                    <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                    <Bar dataKey="invoiced" name="Invoiced Amount" fill="#0F766E" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="paid" name="Payment Received" fill="#10B981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-400 text-sm">
                  No billing history available yet.
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Invoice Status Distribution (1 col) */}
        <div>
          <Card
            title="Invoice Status Breakdown"
            subtitle="Current portfolio distribution by status"
          >
            <div className="h-72 w-full flex flex-col justify-center items-center">
              {statusDistribution.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height="70%">
                    <PieChart>
                      <Pie
                        data={statusDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={75}
                        paddingAngle={4}
                        dataKey="count"
                        nameKey="status"
                      >
                        {statusDistribution.map((entry) => (
                          <Cell
                            key={entry.status}
                            fill={STATUS_COLORS[entry.status] || '#94A3B8'}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ backgroundColor: '#0F172A', color: '#fff', borderRadius: '8px', border: 'none', fontSize: '12px' }}
                        formatter={(val, name, item) => [`${val} invoices (${formatCurrency(item.payload.amount)})`, item.payload.status.toUpperCase()]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  {/* Legend below */}
                  <div className="flex flex-wrap justify-center gap-x-3 gap-y-1 mt-2 text-xs text-slate-600">
                    {statusDistribution.map((entry) => (
                      <span key={entry.status} className="flex items-center gap-1.5 capitalize">
                        <span
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: STATUS_COLORS[entry.status] || '#94A3B8' }}
                        />
                        {entry.status.replace('_', ' ')} ({entry.count})
                      </span>
                    ))}
                  </div>
                </>
              ) : (
                <div className="text-center text-slate-400 text-sm">
                  No active invoices created yet.
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Recent Invoices */}
      <Card
        title="Recent Invoices"
        subtitle="Your most recently generated invoices"
        action={
          <Link
            to="/invoices"
            className="text-xs font-semibold text-brand-700 hover:text-brand-900 inline-flex items-center gap-1"
          >
            View All
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        }
        noPadding
      >
        {recentInvoices.length > 0 ? (
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
                  {recentInvoices.map((inv) => (
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
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            to={`/invoices/${inv._id}`}
                            className="px-2.5 py-1 text-xs font-medium rounded border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition"
                          >
                            View
                          </Link>
                          {inv.lifecycleState === 'issued' && (
                            <button
                              onClick={() => downloadInvoicePdf(inv._id, inv.invoiceNumber)}
                              className="p-1 text-slate-400 hover:text-brand-700 transition"
                              title="Download PDF"
                            >
                              <Download className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card List View (Clean & Responsive) */}
            <div className="md:hidden divide-y divide-slate-100">
              {recentInvoices.map((inv) => (
                <div key={inv._id} className="p-3.5 hover:bg-slate-50/70 transition space-y-2">
                  <div className="flex items-center justify-between">
                    <Link
                      to={`/invoices/${inv._id}`}
                      className="font-bold text-sm text-brand-700"
                    >
                      {inv.invoiceNumber}
                    </Link>
                    <StatusBadge status={inv.paymentStatus} />
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-800 truncate max-w-[60%]">
                      {inv.customerSnapshot?.name || inv.customerId?.name || 'Customer'}
                    </span>
                    <span className="text-slate-500">
                      Due: {formatDate(inv.dueDate)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <div>
                      <p className="text-xs text-slate-400">Total</p>
                      <p className="font-bold text-sm text-slate-900">
                        {formatCurrency(inv.grandTotal, inv.currency)}
                      </p>
                    </div>

                    {inv.balanceDue > 0 && (
                      <div className="text-right">
                        <p className="text-xs text-amber-600">Balance</p>
                        <p className="font-bold text-sm text-amber-700">
                          {formatCurrency(inv.balanceDue, inv.currency)}
                        </p>
                      </div>
                    )}

                    <div className="flex items-center gap-1.5">
                      <Link
                        to={`/invoices/${inv._id}`}
                        className="px-2.5 py-1 text-xs font-semibold rounded-md bg-slate-100 text-slate-700 hover:bg-brand-50 hover:text-brand-700 transition"
                      >
                        View
                      </Link>
                      {inv.lifecycleState === 'issued' && (
                        <button
                          onClick={() => downloadInvoicePdf(inv._id, inv.invoiceNumber)}
                          className="p-1.5 text-slate-400 hover:text-brand-700 transition"
                          title="Download PDF"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="p-8">
            <EmptyState
              icon={Receipt}
              title="No Invoices Issued Yet"
              description="Create your first invoice to start billing your customers and tracking payments."
              actionLabel="Create First Invoice"
              actionIcon={PlusCircle}
              onAction={() => window.location.href = '/invoices/new'}
            />
          </div>
        )}
      </Card>
    </div>
  );
}
