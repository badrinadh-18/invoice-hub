import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save, Info, Sun, Moon, Lock, KeyRound, Eye, EyeOff, AlertTriangle, Trash2 } from 'lucide-react';
import api from '../../services/api';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

export default function BusinessProfile() {
  const { theme, isDark, setTheme } = useTheme();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [updatingPassword, setUpdatingPassword] = useState(false);

  // Account deletion state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [deletingAccount, setDeletingAccount] = useState(false);

  const [formData, setFormData] = useState({
    businessName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    postalCode: '',
    country: '',
    taxId: '',
    logoUrl: '',
    defaultCurrency: 'INR',
    defaultPaymentTerms: 'Net 15',
    invoiceNotes: 'Thank you for your business!'
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const res = await api.get('/business-profile');
        if (res.data?.data) {
          setFormData({
            businessName: res.data.data.businessName || '',
            email: res.data.data.email || '',
            phone: res.data.data.phone || '',
            address: res.data.data.address || '',
            city: res.data.data.city || '',
            state: res.data.data.state || '',
            postalCode: res.data.data.postalCode || '',
            country: res.data.data.country || '',
            taxId: res.data.data.taxId || '',
            logoUrl: res.data.data.logoUrl || '',
            defaultCurrency: res.data.data.defaultCurrency || 'INR',
            defaultPaymentTerms: res.data.data.defaultPaymentTerms || 'Net 15',
            invoiceNotes: res.data.data.invoiceNotes || 'Thank you for your business!'
          });
        }
      } catch (err) {
        console.error('Failed to load business profile:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.businessName.trim()) {
      toast.error('Business name is required.');
      return;
    }

    try {
      setSaving(true);
      await api.post('/business-profile', formData);
      toast.success('Business profile saved successfully!');
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Failed to save business profile.');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (!currentPassword) {
      toast.error('Please enter your current password.');
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      toast.error('New password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match.');
      return;
    }

    try {
      setUpdatingPassword(true);
      const res = await api.put('/auth/change-password', {
        currentPassword,
        newPassword
      });
      toast.success(res.data?.message || 'Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      toast.error(err.response?.data?.error?.message || err.response?.data?.message || 'Failed to update password.');
    } finally {
      setUpdatingPassword(false);
    }
  };

  const handleDeleteAccount = async (e) => {
    e.preventDefault();
    try {
      setDeletingAccount(true);
      await api.delete('/users/me', {
        data: {
          password: deletePassword,
          confirmation: deleteConfirmation
        }
      });
      toast.success('Your account has been permanently deleted.');
      setShowDeleteModal(false);
      await logout();
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Failed to delete account.');
    } finally {
      setDeletingAccount(false);
    }
  };

  if (loading) {
    return (
      <div className="py-16">
        <LoadingSpinner text="Loading business settings..." />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Settings & Business Profile</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
          Manage your business defaults, invoice header information, and app display settings.
        </p>
      </div>

      {/* Display & Theme Settings */}
      <Card title="Display & Appearance" subtitle="Choose your preferred visual theme for InvoiceHub">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              Color Theme
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Switch between Light and Dark interface modes across all screens and forms.
            </p>
          </div>

          <div className="inline-flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={() => setTheme('light')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition ${
                !isDark
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              <Sun className="w-4 h-4 text-amber-500" />
              Light Mode
            </button>
            <button
              type="button"
              onClick={() => setTheme('dark')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition ${
                isDark
                  ? 'bg-slate-900 text-white shadow-sm border border-slate-700'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              <Moon className="w-4 h-4 text-brand-400" />
              Dark Mode
            </button>
          </div>
        </div>
      </Card>

      <div className="bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 rounded-xl p-4 flex items-start gap-3 text-xs sm:text-sm text-teal-900 dark:text-teal-200">
        <Info className="w-5 h-5 text-teal-700 dark:text-teal-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-teal-900 dark:text-teal-100">Immutable Audit Snapshots: </span>
          When an invoice is issued, InvoiceHub captures a snapshot of these seller details.
          Future changes to your profile will automatically apply to new invoices without altering your past issued records.
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card title="Company Information" subtitle="Your legal or trading business details">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Business / Company Name *
              </label>
              <input
                type="text"
                name="businessName"
                required
                value={formData.businessName}
                onChange={handleChange}
                placeholder="e.g. Apex Global Solutions LLC"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-brand-700 focus:ring-1 focus:ring-brand-700 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Billing Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="billing@company.com"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-brand-700 focus:ring-1 focus:ring-brand-700 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Phone Number
              </label>
              <div className="relative flex rounded-lg shadow-sm">
                <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-sm font-medium select-none">
                  🇮🇳 +91
                </span>
                <input
                  type="tel"
                  name="phone"
                  value={
                    formData.phone?.startsWith('+91')
                      ? formData.phone.slice(3).trimStart()
                      : (formData.phone || '')
                  }
                  onChange={(e) => {
                    const raw = e.target.value.replace(/^\+91\s*/, '');
                    setFormData((prev) => ({
                      ...prev,
                      phone: raw ? `+91 ${raw}` : ''
                    }));
                  }}
                  placeholder="98765 43210"
                  className="w-full rounded-r-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-brand-700 focus:ring-1 focus:ring-brand-700 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Tax Identification Number (VAT/GST/EIN) (Optional)
              </label>
              <input
                type="text"
                name="taxId"
                value={formData.taxId}
                onChange={handleChange}
                placeholder="e.g. 27AAAAA0000A1Z5 (GSTIN) or leave blank"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-brand-700 focus:ring-1 focus:ring-brand-700 focus:outline-none"
              />
              <p className="text-[11px] text-slate-400 mt-1">Optional. Leave empty if your business is not GST/tax registered.</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Logo URL (Optional)
              </label>
              <input
                type="url"
                name="logoUrl"
                value={formData.logoUrl}
                onChange={handleChange}
                placeholder="https://example.com/logo.png"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-brand-700 focus:ring-1 focus:ring-brand-700 focus:outline-none"
              />
            </div>
          </div>
        </Card>

        <Card title="Physical / Mailing Address" subtitle="Appears as seller address on printed invoices">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Street Address
              </label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder="100 Innovation Way, Suite 400"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-brand-700 focus:ring-1 focus:ring-brand-700 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                City
              </label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleChange}
                placeholder="San Francisco"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-brand-700 focus:ring-1 focus:ring-brand-700 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                State / Province
              </label>
              <input
                type="text"
                name="state"
                value={formData.state}
                onChange={handleChange}
                placeholder="California"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-brand-700 focus:ring-1 focus:ring-brand-700 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Postal Code
              </label>
              <input
                type="text"
                name="postalCode"
                value={formData.postalCode}
                onChange={handleChange}
                placeholder="94105"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-brand-700 focus:ring-1 focus:ring-brand-700 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Country
              </label>
              <input
                type="text"
                name="country"
                value={formData.country}
                onChange={handleChange}
                placeholder="United States"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-brand-700 focus:ring-1 focus:ring-brand-700 focus:outline-none"
              />
            </div>
          </div>
        </Card>

        <Card title="Billing Defaults" subtitle="Pre-fill defaults when creating new invoices">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Default Currency
              </label>
              <select
                name="defaultCurrency"
                value={formData.defaultCurrency}
                onChange={handleChange}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 px-3 py-2 text-sm text-slate-900 dark:text-white focus:border-brand-700 focus:ring-1 focus:ring-brand-700 focus:outline-none bg-white dark:bg-slate-800"
              >
                <option value="INR">INR — Indian Rupee (₹)</option>
                <option value="USD">USD — US Dollar ($)</option>
                <option value="EUR">EUR — Euro (€)</option>
                <option value="GBP">GBP — British Pound (£)</option>
                <option value="CAD">CAD — Canadian Dollar ($)</option>
                <option value="AUD">AUD — Australian Dollar ($)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Default Payment Terms
              </label>
              <input
                type="text"
                name="defaultPaymentTerms"
                value={formData.defaultPaymentTerms}
                onChange={handleChange}
                placeholder="e.g. Net 15, Net 30, Due on Receipt"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-brand-700 focus:ring-1 focus:ring-brand-700 focus:outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Default Invoice Notes & Instructions
              </label>
              <textarea
                name="invoiceNotes"
                rows={3}
                value={formData.invoiceNotes}
                onChange={handleChange}
                placeholder="Wire transfer instructions, check payment details, or thank you note..."
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-brand-700 focus:ring-1 focus:ring-brand-700 focus:outline-none"
              />
            </div>
          </div>
        </Card>

        <div className="flex justify-end gap-3 pt-2">
          <Button
            type="submit"
            variant="primary"
            size="md"
            loading={saving}
            icon={Save}
            className="w-full sm:w-auto"
          >
            Save Business Profile
          </Button>
        </div>
      </form>

      {/* Account Security & Password Change */}
      <Card title="Account Security" subtitle="Update your account login password">
        <form onSubmit={handlePasswordChange} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Current Password *
              </label>
              <div className="relative">
                <input
                  type={showCurrentPass ? 'text' : 'password'}
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 pr-10 px-3 py-2 text-sm text-slate-900 dark:text-white bg-white dark:bg-slate-800 focus:border-brand-700 focus:ring-1 focus:ring-brand-700 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPass(!showCurrentPass)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  {showCurrentPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                New Password *
              </label>
              <div className="relative">
                <input
                  type={showNewPass ? 'text' : 'password'}
                  required
                  minLength={6}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min 6 characters"
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 pr-10 px-3 py-2 text-sm text-slate-900 dark:text-white bg-white dark:bg-slate-800 focus:border-brand-700 focus:ring-1 focus:ring-brand-700 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPass(!showNewPass)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Confirm New Password *
              </label>
              <div className="relative">
                <input
                  type={showConfirmPass ? 'text' : 'password'}
                  required
                  minLength={6}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat new password"
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 pr-10 px-3 py-2 text-sm text-slate-900 dark:text-white bg-white dark:bg-slate-800 focus:border-brand-700 focus:ring-1 focus:ring-brand-700 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPass(!showConfirmPass)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  {showConfirmPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-1">
            <Button
              type="submit"
              variant="secondary"
              size="md"
              loading={updatingPassword}
              icon={KeyRound}
              className="w-full sm:w-auto"
            >
              Update Password
            </Button>
          </div>
        </form>
      </Card>

      {/* Danger Zone: Delete Account */}
      <Card
        title="Danger Zone"
        subtitle="Permanently delete your account and all associated records"
        className="border-rose-200 dark:border-rose-900/60"
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 rounded-xl bg-rose-50/80 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-bold text-rose-900 dark:text-rose-200">
                Delete Account & Data
              </h4>
              <p className="text-xs text-rose-700 dark:text-rose-300 mt-0.5 leading-relaxed">
                Permanently deletes your business profile, customers, invoice history, and login account. This action cannot be reversed.
              </p>
            </div>
          </div>
          <Button
            type="button"
            variant="danger"
            size="md"
            icon={Trash2}
            onClick={() => {
              setDeletePassword('');
              setDeleteConfirmation('');
              setShowDeleteModal(true);
            }}
            className="shrink-0 w-full sm:w-auto"
          >
            Delete Account
          </Button>
        </div>
      </Card>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Account Confirmation"
        subtitle="Permanent & Irreversible"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleDeleteAccount} className="space-y-4">
          <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/60 text-rose-800 dark:text-rose-200 text-xs sm:text-sm space-y-1.5">
            <p className="font-bold flex items-center gap-1.5 text-rose-900 dark:text-rose-100">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              Warning: All data will be permanently erased
            </p>
            <p className="text-xs text-rose-700 dark:text-rose-300 leading-relaxed">
              This will permanently delete your account (<strong className="font-semibold">{user?.email}</strong>), business profile, customers list, and all issued invoices.
            </p>
          </div>

          {user?.authProvider === 'google' ? (
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Type <span className="font-mono text-rose-600 font-bold">DELETE</span> to confirm *
              </label>
              <input
                type="text"
                required
                value={deleteConfirmation}
                onChange={(e) => setDeleteConfirmation(e.target.value)}
                placeholder="DELETE"
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 px-3 py-2 text-sm text-slate-900 dark:text-white bg-white dark:bg-slate-800 focus:border-rose-600 focus:ring-1 focus:ring-rose-600 focus:outline-none"
              />
            </div>
          ) : (
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Confirm Your Current Password *
              </label>
              <input
                type="password"
                required
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                placeholder="Enter password to confirm"
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 px-3 py-2 text-sm text-slate-900 dark:text-white bg-white dark:bg-slate-800 focus:border-rose-600 focus:ring-1 focus:ring-rose-600 focus:outline-none"
              />
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowDeleteModal(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="danger"
              loading={deletingAccount}
              icon={Trash2}
            >
              Permanently Delete
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
