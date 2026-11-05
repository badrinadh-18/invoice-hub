import React, { useState, useEffect } from 'react';
import {
  History,
  Search,
  Filter,
  Shield,
  Clock,
  UserCheck,
  CreditCard,
  FileText
} from 'lucide-react';
import api from '../../services/api';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import toast from 'react-hot-toast';

export default function AdminAuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      let url = `/admin/audit-logs?page=${page}&limit=20`;
      if (actionFilter) {
        url += `&action=${encodeURIComponent(actionFilter)}`;
      }
      const res = await api.get(url);
      setLogs(res.data.data);
      setTotalPages(res.data.pagination.totalPages || 1);
      setTotalCount(res.data.pagination.total || 0);
    } catch (err) {
      toast.error('Failed to load audit logs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page, actionFilter]);

  const actions = [
    { label: 'All Actions', value: '' },
    { label: 'User Registered', value: 'USER_REGISTERED' },
    { label: 'User Logged In', value: 'USER_LOGGED_IN' },
    { label: 'Status Updated', value: 'USER_STATUS_UPDATED' },
    { label: 'Invoice Issued', value: 'INVOICE_ISSUED' },
    { label: 'Invoice Voided', value: 'INVOICE_VOIDED' },
    { label: 'Payment Recorded', value: 'PAYMENT_RECORDED' },
  ];

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            System Security Audit Logs
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Tamper-evident trail of security, identity, and financial operations ({totalCount} total entries).
          </p>
        </div>
      </div>

      {/* Action Filters */}
      <Card noPadding className="p-4">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          {actions.map((act) => (
            <button
              key={act.value}
              onClick={() => {
                setActionFilter(act.value);
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                actionFilter === act.value
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {act.label}
            </button>
          ))}
        </div>
      </Card>

      {/* Logs Table */}
      <Card noPadding>
        {loading ? (
          <div className="py-12">
            <LoadingSpinner text="Querying audit records..." />
          </div>
        ) : logs.length > 0 ? (
          <div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-700">
                <thead className="bg-slate-50 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="px-5 py-3">Timestamp</th>
                    <th className="px-5 py-3">Actor / Role</th>
                    <th className="px-5 py-3">Action</th>
                    <th className="px-5 py-3">Target Entity</th>
                    <th className="px-5 py-3">Details / Reason</th>
                    <th className="px-5 py-3 text-right">IP Address</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono text-xs">
                  {logs.map((log) => (
                    <tr key={log._id} className="hover:bg-slate-50/80 transition">
                      <td className="px-5 py-3.5 text-slate-500 whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td className="px-5 py-3.5 font-sans">
                        <div className="font-semibold text-slate-900">{log.actorEmail}</div>
                        <div className="text-[11px] text-slate-400 capitalize">{log.actorRole}</div>
                      </td>
                      <td className="px-5 py-3.5 font-bold text-brand-800 whitespace-nowrap">
                        {log.action}
                      </td>
                      <td className="px-5 py-3.5 text-slate-600 whitespace-nowrap">
                        <span className="font-sans font-semibold text-slate-800">{log.targetType}</span>
                        {log.targetId && (
                          <span className="text-slate-400 block text-[11px]">
                            {log.targetId}
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 font-sans text-slate-600">
                        {log.reason || (log.metadata && Object.keys(log.metadata).length > 0 ? JSON.stringify(log.metadata) : '-')}
                      </td>
                      <td className="px-5 py-3.5 text-right text-slate-400 whitespace-nowrap">
                        {log.ip || '127.0.0.1'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-sans">
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
          <div className="p-8 text-center text-sm text-slate-400">
            No audit log entries found.
          </div>
        )}
      </Card>
    </div>
  );
}
