import React, { useState, useEffect } from 'react';
import { Search, Eye, ExternalLink, Trash2, Building, Receipt, Users, Shield, Calendar, Mail, AlertTriangle, CheckCircle, RefreshCw, UserPlus, ShieldAlert, KeyRound } from 'lucide-react';
import api from '../../services/api';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { formatDate, formatCurrency } from '../../utils/formatters';
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

  // View & Access Modal
  const [viewingUser, setViewingUser] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [accessingWorkspace, setAccessingWorkspace] = useState(false);

  // Admin Delete Modal
  const [deletingUser, setDeletingUser] = useState(null);
  const [deletingLoading, setDeletingLoading] = useState(false);

  // Create User / Admin Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createFormData, setCreateFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'admin'
  });
  const [creatingUser, setCreatingUser] = useState(false);
  const [roleChanging, setRoleChanging] = useState(false);

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

  const handleViewUser = async (user) => {
    setViewingUser(user);
    setLoadingDetails(true);
    try {
      const res = await api.get(`/admin/users/${user.id}`);
      setViewingUser(res.data.data);
    } catch (err) {
      toast.error('Failed to load detailed profile.');
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleAccessWorkspace = async (userId) => {
    try {
      setAccessingWorkspace(true);
      const res = await api.post(`/admin/users/${userId}/access`);
      const { token, user } = res.data;

      // Save token and session into storage to impersonate / access workspace
      localStorage.setItem('invoicehub_token', token);
      localStorage.setItem('invoicehub_user', JSON.stringify(user));
      toast.success(`Accessing workspace as ${user.name}...`);

      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 500);
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Failed to access user workspace.');
      setAccessingWorkspace(false);
    }
  };

  const handleDeleteUser = async (e) => {
    e.preventDefault();
    if (!deletingUser) return;

    try {
      setDeletingLoading(true);
      await api.delete(`/admin/users/${deletingUser.id}`);
      toast.success(`User account ${deletingUser.email} deleted.`);
      setDeletingUser(null);
      if (viewingUser?.id === deletingUser.id) {
        setViewingUser(null);
      }
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Failed to delete user.');
    } finally {
      setDeletingLoading(false);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      setCreatingUser(true);
      await api.post('/admin/users', createFormData);
      toast.success(`${createFormData.role === 'admin' ? 'Administrator' : 'User'} created successfully!`);
      setShowCreateModal(false);
      setCreateFormData({ name: '', email: '', password: '', role: 'admin' });
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Failed to create account.');
    } finally {
      setCreatingUser(false);
    }
  };

  const handleToggleRole = async (targetUser) => {
    const newRole = targetUser.role === 'admin' ? 'user' : 'admin';
    try {
      setRoleChanging(true);
      await api.patch(`/admin/users/${targetUser.id || targetUser._id}/role`, { role: newRole });
      toast.success(`Role updated to ${newRole}.`);
      setViewingUser((prev) => (prev ? { ...prev, role: newRole } : null));
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Failed to update role.');
    } finally {
      setRoleChanging(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'active':
        return 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
      case 'inactive':
        return 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700';
      case 'suspended':
        return 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800';
      default:
        return 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700';
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            User Accounts & Access Control
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Administer registered tenant accounts, inspect business profiles, and manage access statuses ({totalCount} total).
          </p>
        </div>
        <Button
          type="button"
          variant="primary"
          icon={UserPlus}
          onClick={() => setShowCreateModal(true)}
          className="shrink-0"
        >
          Create Admin / User
        </Button>
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
              className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:border-brand-700 focus:ring-1 focus:ring-brand-700 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto">
            {['all', 'active', 'inactive', 'suspended'].map((s) => (
              <button
                key={s}
                onClick={() => {
                  setStatusFilter(s);
                  setPage(1);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition shrink-0 ${
                  statusFilter === s
                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
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
              <table className="w-full text-left text-sm text-slate-700 dark:text-slate-300">
                <thead className="bg-slate-50 dark:bg-slate-800/80 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="px-5 py-3">User Details</th>
                    <th className="px-5 py-3">Role</th>
                    <th className="px-5 py-3">Invoices</th>
                    <th className="px-5 py-3">Joined Date</th>
                    <th className="px-5 py-3 text-center">Status</th>
                    <th className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition">
                      <td className="px-5 py-3.5">
                        <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                          <span>{u.name}</span>
                          {u.role === 'admin' && (
                            <span className="px-1.5 py-0.2 rounded text-[10px] font-bold uppercase bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700">
                              Admin
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 font-mono">{u.email}</div>
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold uppercase ${
                            u.role === 'admin'
                              ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          {u.role}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-slate-600 dark:text-slate-300 font-medium">
                        {u.invoiceCount || 0}
                      </td>
                      <td className="px-5 py-3.5 text-slate-500 dark:text-slate-400 text-xs whitespace-nowrap">
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
                          {/* View & Access Details Button */}
                          <button
                            onClick={() => handleViewUser(u)}
                            className="px-2.5 py-1 text-xs font-semibold rounded-lg border border-brand-300 dark:border-brand-700 bg-brand-50 dark:bg-brand-950/50 text-brand-700 dark:text-brand-300 hover:bg-brand-100 dark:hover:bg-brand-900/60 transition inline-flex items-center gap-1"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>View & Access</span>
                          </button>

                          {/* Quick Status Toggles */}
                          {u.status !== 'active' && (
                            <button
                              onClick={() => handleOpenStatusModal(u, 'active')}
                              className="px-2 py-1 text-xs font-medium rounded-lg border border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition"
                            >
                              Activate
                            </button>
                          )}
                          {u.status === 'active' && (
                            <button
                              onClick={() => handleOpenStatusModal(u, 'inactive')}
                              className="px-2 py-1 text-xs font-medium rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
                            >
                              Deactivate
                            </button>
                          )}
                          {u.status !== 'suspended' && (
                            <button
                              onClick={() => handleOpenStatusModal(u, 'suspended')}
                              className="px-2 py-1 text-xs font-medium rounded-lg border border-rose-300 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/60 transition"
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
              <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
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

      {/* Comprehensive View & Access User Modal */}
      <Modal
        isOpen={!!viewingUser}
        onClose={() => setViewingUser(null)}
        title={viewingUser ? `User Profile: ${viewingUser.name}` : 'User Profile'}
        subtitle={viewingUser?.email || ''}
        maxWidth="max-w-2xl"
      >
        {loadingDetails ? (
          <div className="py-8">
            <LoadingSpinner text="Retrieving detailed user records..." />
          </div>
        ) : viewingUser ? (
          <div className="space-y-5">
            {/* User Overview Badges */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80">
                <span className="text-[11px] font-semibold text-slate-500 uppercase block">Account Role</span>
                <span className="text-sm font-bold text-slate-900 dark:text-white capitalize">{viewingUser.role}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80">
                <span className="text-[11px] font-semibold text-slate-500 uppercase block">Status</span>
                <span className={`text-xs font-bold uppercase inline-block mt-0.5 px-2 py-0.5 rounded border ${getStatusBadge(viewingUser.status)}`}>
                  {viewingUser.status}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80">
                <span className="text-[11px] font-semibold text-slate-500 uppercase block">Invoices</span>
                <span className="text-sm font-bold text-slate-900 dark:text-white">{viewingUser.stats?.invoiceCount || 0}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80">
                <span className="text-[11px] font-semibold text-slate-500 uppercase block">Customers</span>
                <span className="text-sm font-bold text-slate-900 dark:text-white">{viewingUser.stats?.customerCount || 0}</span>
              </div>
            </div>

            {/* Business Profile Details */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
              <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Building className="w-4 h-4 text-brand-600" />
                Business Organization Details
              </h4>
              {viewingUser.businessProfile ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs text-slate-600 dark:text-slate-300 pt-1">
                  <div>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">Company Name: </span>
                    {viewingUser.businessProfile.businessName || '—'}
                  </div>
                  <div>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">Billing Email: </span>
                    {viewingUser.businessProfile.email || viewingUser.email}
                  </div>
                  <div>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">Phone: </span>
                    {viewingUser.businessProfile.phone || '—'}
                  </div>
                  <div>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">Tax ID / GSTIN: </span>
                    {viewingUser.businessProfile.taxId || '—'}
                  </div>
                  <div className="sm:col-span-2">
                    <span className="font-semibold text-slate-800 dark:text-slate-200">Address: </span>
                    {[viewingUser.businessProfile.address, viewingUser.businessProfile.city, viewingUser.businessProfile.state, viewingUser.businessProfile.country].filter(Boolean).join(', ') || '—'}
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-500 italic pt-1">No custom business profile configured yet.</p>
              )}
            </div>

            {/* Financial Summary */}
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200">
              <span className="text-xs font-semibold">Total Invoiced Volume:</span>
              <span className="text-base font-extrabold text-emerald-700 dark:text-emerald-300">
                {formatCurrency(viewingUser.stats?.totalInvoiced || 0)}
              </span>
            </div>

            {/* Recent Invoices List */}
            {viewingUser.recentInvoices && viewingUser.recentInvoices.length > 0 && (
              <div>
                <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Receipt className="w-4 h-4 text-slate-500" />
                  Recent Invoices
                </h4>
                <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
                  {viewingUser.recentInvoices.map((inv) => (
                    <div key={inv._id} className="p-2.5 px-3 flex items-center justify-between text-xs hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <div>
                        <span className="font-bold text-slate-900 dark:text-white font-mono">{inv.invoiceNumber}</span>
                        <span className="text-slate-500 ml-2">({inv.customerSnapshot?.name || 'Customer'})</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-800 dark:text-slate-200">{formatCurrency(inv.grandTotal)}</span>
                        <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                          {inv.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons in Modal */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap gap-2 justify-between">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setDeletingUser(viewingUser)}
                  className="px-3 py-2 text-xs font-semibold rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition inline-flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete
                </button>
                <button
                  type="button"
                  disabled={roleChanging}
                  onClick={() => handleToggleRole(viewingUser)}
                  className={`px-3 py-2 text-xs font-semibold rounded-lg transition inline-flex items-center gap-1.5 border ${
                    viewingUser.role === 'admin'
                      ? 'border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                      : 'border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 hover:bg-amber-100'
                  }`}
                >
                  <Shield className="w-3.5 h-3.5" />
                  <span>{viewingUser.role === 'admin' ? 'Demote to User' : 'Promote to Admin'}</span>
                </button>
              </div>

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setViewingUser(null)}
                >
                  Close
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  icon={ExternalLink}
                  loading={accessingWorkspace}
                  onClick={() => handleAccessWorkspace(viewingUser.id)}
                >
                  Access Workspace
                </Button>
              </div>
            </div>
          </div>
        ) : null}
      </Modal>

      {/* Status Modification Modal */}
      <Modal
        isOpen={!!selectedUser}
        onClose={() => setSelectedUser(null)}
        title={`Change Status: ${selectedUser?.name}`}
        subtitle={`Target status: ${newStatus.toUpperCase()}`}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleConfirmStatusChange} className="space-y-4">
          <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-xl border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs sm:text-sm">
            <span className="font-semibold block mb-1">Administrative Audit Action</span>
            You are changing the account status of <span className="font-bold">{selectedUser?.email}</span> from{' '}
            <span className="uppercase font-semibold">{selectedUser?.status}</span> to{' '}
            <span className="uppercase font-semibold text-brand-800 dark:text-brand-300">{newStatus}</span>.
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
              Audit Reason (Optional)
            </label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Terms violation or user request"
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 px-3 py-2 text-sm text-slate-900 dark:text-white bg-white dark:bg-slate-800 focus:border-brand-700 focus:ring-1 focus:ring-brand-700 focus:outline-none"
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

      {/* Admin Delete User Confirmation Modal */}
      <Modal
        isOpen={!!deletingUser}
        onClose={() => setDeletingUser(null)}
        title={`Delete User: ${deletingUser?.name}`}
        subtitle={deletingUser?.email}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleDeleteUser} className="space-y-4">
          <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-800 dark:text-rose-200 text-xs sm:text-sm space-y-1.5">
            <p className="font-bold flex items-center gap-1 text-rose-900 dark:text-rose-100">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              Permanent Administrative Deletion
            </p>
            <p className="text-xs text-rose-700 dark:text-rose-300 leading-relaxed">
              This will permanently delete <strong className="font-semibold">{deletingUser?.email}</strong> and completely erase all their invoices, customers, and business profiles.
            </p>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setDeletingUser(null)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="danger"
              icon={Trash2}
              loading={deletingLoading}
            >
              Delete User
            </Button>
          </div>
        </form>
      </Modal>

      {/* Create New Admin / User Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create New Account"
        subtitle="Provision a new Administrator or Standard Tenant account"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleCreateUser} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Account Role *
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setCreateFormData((prev) => ({ ...prev, role: 'admin' }))}
                className={`py-2 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                  createFormData.role === 'admin'
                    ? 'border-amber-400 bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 shadow-xs'
                    : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <Shield className="w-3.5 h-3.5 text-amber-600" />
                Administrator
              </button>
              <button
                type="button"
                onClick={() => setCreateFormData((prev) => ({ ...prev, role: 'user' }))}
                className={`py-2 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                  createFormData.role === 'user'
                    ? 'border-brand-500 bg-brand-50 dark:bg-brand-950/40 text-brand-900 dark:text-brand-200 shadow-xs'
                    : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <Users className="w-3.5 h-3.5 text-brand-600" />
                Standard User
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Full Name *
            </label>
            <input
              type="text"
              required
              value={createFormData.name}
              onChange={(e) => setCreateFormData((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="e.g. Operations Admin"
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 px-3 py-2 text-sm text-slate-900 dark:text-white bg-white dark:bg-slate-800 focus:border-brand-600 focus:ring-1 focus:ring-brand-600 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Email Address *
            </label>
            <input
              type="email"
              required
              value={createFormData.email}
              onChange={(e) => setCreateFormData((prev) => ({ ...prev, email: e.target.value }))}
              placeholder="admin@invoicehub.local"
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 px-3 py-2 text-sm text-slate-900 dark:text-white bg-white dark:bg-slate-800 focus:border-brand-600 focus:ring-1 focus:ring-brand-600 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Password (min. 6 characters) *
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={createFormData.password}
              onChange={(e) => setCreateFormData((prev) => ({ ...prev, password: e.target.value }))}
              placeholder="••••••••••••"
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 px-3 py-2 text-sm text-slate-900 dark:text-white bg-white dark:bg-slate-800 focus:border-brand-600 focus:ring-1 focus:ring-brand-600 focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowCreateModal(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={creatingUser}
            >
              Create Account
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
