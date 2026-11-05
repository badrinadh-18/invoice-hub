import React, { useState, useEffect } from 'react';
import { Building2, Save, Info, CheckCircle2 } from 'lucide-react';
import api from '../../services/api';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import toast from 'react-hot-toast';

export default function BusinessProfile() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Business Profile & Defaults</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          These details are automatically stamped onto your invoice headers and PDF documents.
        </p>
      </div>

      <div className="bg-teal-50 border border-teal-200 rounded-xl p-4 flex items-start gap-3 text-xs sm:text-sm text-teal-900">
        <Info className="w-5 h-5 text-teal-700 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-teal-900">Immutable Audit Snapshots: </span>
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
                <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-slate-300 bg-slate-50 text-slate-700 text-sm font-medium select-none">
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
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-brand-700 focus:ring-1 focus:ring-brand-700 focus:outline-none bg-white"
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
          >
            Save Business Profile
          </Button>
        </div>
      </form>
    </div>
  );
}
