import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  ShieldCheck,
  FileSpreadsheet,
  DollarSign,
  AlertOctagon,
  History,
  ArrowRight,
  TrendingUp,
  UserCheck
} from 'lucide-react';
import api from '../../services/api';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { formatCurrency, formatDate } from '../../utils/formatters';

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAdminMetrics = async () => {
      try {
        setLoading(true);
        const res = await api.get('/admin/dashboard');
        setData(res.data.data);
      } catch (err) {
        console.error('Failed to load admin metrics:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAdminMetrics();
  }, []);

  if (loading) {
    return (
      <div className="py-16">
        <LoadingSpinner size="large" text="Loading system metrics..." />
      </div>
    );
  }

  const users = data?.users || {};
  const invoices = data?.invoices || {};
  const recentActivity = data?.recentActivity || [];

  return (
    <div className="space-y-8">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            System Administration Overview
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Real-time aggregate platform statistics and security governance.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link to="/admin/users">
            <Button variant="secondary" icon={Users} size="sm">
              Manage Users
            </Button>
          </Link>
          <Link to="/admin/audit-logs">
            <Button variant="secondary" icon={History} size="sm">
              Audit Logs
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Registered Users</span>
            <Users className="w-4 h-4 text-brand-700" />
          </div>
          <p className="text-2xl font-bold text-slate-900">{users.total || 0}</p>
          <div className="flex items-center gap-2 mt-2 text-xs text-slate-500">
            <span className="text-emerald-600 font-semibold">{users.active || 0} Active</span>
            <span>•</span>
            <span className="text-rose-600 font-semibold">{users.suspended || 0} Suspended</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Invoices</span>
            <FileSpreadsheet className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-2xl font-bold text-slate-900">{invoices.total || 0}</p>
          <div className="mt-2 text-xs text-brand-700 font-medium">
            {invoices.issued || 0} issued across all tenants
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">System Billing Total</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-bold text-slate-900">
            {formatCurrency(invoices.aggregateAmount || 0)}
          </p>
          <div className="mt-2 text-xs text-slate-500">
            Excludes voided records
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Collected Funds</span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-bold text-emerald-600">
            {formatCurrency(invoices.aggregatePaid || 0)}
          </p>
          <div className="mt-2 text-xs text-slate-500">
            Outstanding: {formatCurrency(invoices.aggregateOutstanding || 0)}
          </div>
        </div>
      </div>

      {/* Recent System Activity / Audit Feed */}
      <Card
        title="Recent System Audit Events"
        subtitle="Immutable security trail of administrative, user, and financial actions"
        action={
          <Link
            to="/admin/audit-logs"
            className="text-xs font-semibold text-brand-700 hover:text-brand-900 inline-flex items-center gap-1"
          >
            All Audit Records
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        }
        noPadding
      >
        {recentActivity.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-700">
              <thead className="bg-slate-50 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3">Timestamp</th>
                  <th className="px-5 py-3">Actor</th>
                  <th className="px-5 py-3">Action</th>
                  <th className="px-5 py-3">Target</th>
                  <th className="px-5 py-3">Reason / Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-xs">
                {recentActivity.map((log) => (
                  <tr key={log._id} className="hover:bg-slate-50 transition">
                    <td className="px-5 py-3 text-slate-500 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="px-5 py-3 text-slate-800 font-sans font-medium">
                      {log.actorEmail} ({log.actorRole})
                    </td>
                    <td className="px-5 py-3 font-semibold text-brand-800">
                      {log.action}
                    </td>
                    <td className="px-5 py-3 text-slate-600">
                      {log.targetType} {log.targetId ? `(${log.targetId.substring(0, 8)}...)` : ''}
                    </td>
                    <td className="px-5 py-3 text-slate-500 font-sans">
                      {log.reason || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center text-sm text-slate-400">
            No audit records captured yet.
          </div>
        )}
      </Card>
    </div>
  );
}
