import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Shield,
  UserCheck,
  UserX,
  AlertOctagon,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import api from '../../services/api';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { formatDate } from '../../utils/formatters';
import toast from 'react-hot-toast';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Status Change Modal
  const [selectedUser, setSelectedUser] = useState(null);
  const [newStatus, setNewStatus] = useState('active');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      let url = `/admin/users?page=${page}&limit=10&search=${encodeURIComponent(search)}`;
      if (statusFilter !== 'all') {
        url += `&status=${statusFilter}`;
      }
      const res = await api.get(url);
      setUsers(res.data.data);
      setTotalPages(res.data.pagination.totalPages || 1);
      setTotalCount(res.data.pagination.total || 0);
    } catch (err) {
      toast.error('Failed to load user directory.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [page, search, statusFilter]);

  const handleOpenStatusModal = (user, status) => {
    setSelectedUser(user);
    setNewStatus(status);
    setReason('');
  };

  const handleConfirmStatusChange = async (e) => {
    e.preventDefault();
    if (!selectedUser) return;

    try {
      setSubmitting(true);
      await api.patch(`/admin/users/${selectedUser.id}/status`, {
        status: newStatus,
        reason: reason.trim() || undefined
      });
      toast.success(`User status changed to ${newStatus}.`);
      setSelectedUser(null);
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Failed to update user status.');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'active':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'inactive':
        return 'bg-slate-100 text-slate-700 border-slate-200';
      case 'suspended':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            User Accounts & Access Control
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Administer registered tenant accounts, review roles, and manage access statuses ({totalCount} total).
          </p>
        </div>
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
              placeholder="Search user by full name or email address..."
              className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-slate-300 focus:border-brand-700 focus:ring-1 focus:ring-brand-700 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2">
            {['all', 'active', 'inactive', 'suspended'].map((s) => (
              <button
                key={s}
                onClick={() => {
                  setStatusFilter(s);
                  setPage(1);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition ${
                  statusFilter === s
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Users Table */}
      <Card noPadding>
        {loading ? (
          <div className="py-12">
            <LoadingSpinner text="Loading registered accounts..." />
          </div>
        ) : users.length > 0 ? (
          <div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-700">
                <thead className="bg-slate-50 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="px-5 py-3">User Details</th>
                    <th className="px-5 py-3">Role</th>
                    <th className="px-5 py-3">Invoices</th>
                    <th className="px-5 py-3">Joined Date</th>
                    <th className="px-5 py-3 text-center">Status</th>
                    <th className="px-5 py-3 text-right">Account Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50/80 transition">
                      <td className="px-5 py-3.5">
                        <div className="font-semibold text-slate-900">{u.name}</div>
                        <div className="text-xs text-slate-500 font-mono">{u.email}</div>
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold uppercase ${
                            u.role === 'admin'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {u.role}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-slate-600 font-medium">
                        {u.invoiceCount || 0}
                      </td>
                      <td className="px-5 py-3.5 text-slate-500 text-xs whitespace-nowrap">
                        {formatDate(u.createdAt)}
                      </td>
                      <td className="px-5 py-3.5 text-center whitespace-nowrap">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold border uppercase ${getStatusBadge(
                            u.status
                          )}`}
                        >
                          {u.status}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {u.status !== 'active' && (
                            <button
                              onClick={() => handleOpenStatusModal(u, 'active')}
                              className="px-2.5 py-1 text-xs font-medium rounded border border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 transition"
                            >
                              Activate
                            </button>
                          )}
                          {u.status === 'active' && (
                            <button
                              onClick={() => handleOpenStatusModal(u, 'inactive')}
                              className="px-2.5 py-1 text-xs font-medium rounded border border-slate-300 bg-slate-50 text-slate-700 hover:bg-slate-100 transition"
                            >
                              Deactivate
                            </button>
                          )}
                          {u.status !== 'suspended' && (
                            <button
                              onClick={() => handleOpenStatusModal(u, 'suspended')}
                              className="px-2.5 py-1 text-xs font-medium rounded border border-rose-300 bg-rose-50 text-rose-800 hover:bg-rose-100 transition"
                            >
                              Suspend
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
          <div className="p-8 text-center text-sm text-slate-400">
            No matching users found.
          </div>
        )}
      </Card>

      {/* Status Modification Modal */}
      <Modal
        isOpen={!!selectedUser}
        onClose={() => setSelectedUser(null)}
        title={`Change Status: ${selectedUser?.name}`}
        subtitle={`Target status: ${newStatus.toUpperCase()}`}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleConfirmStatusChange} className="space-y-4">
          <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-xs sm:text-sm">
            <span className="font-semibold block mb-1">Administrative Audit Action</span>
            You are changing the account status of <span className="font-bold">{selectedUser?.email}</span> from{' '}
            <span className="uppercase font-semibold">{selectedUser?.status}</span> to{' '}
            <span className="uppercase font-semibold text-brand-800">{newStatus}</span>.
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Audit Reason (Optional)
            </label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Terms violation or user request"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-brand-700 focus:ring-1 focus:ring-brand-700 focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setSelectedUser(null)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant={newStatus === 'suspended' ? 'danger' : 'primary'}
              loading={submitting}
            >
              Confirm Status Change
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
