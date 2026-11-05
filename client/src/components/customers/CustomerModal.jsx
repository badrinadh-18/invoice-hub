import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import api from '../../services/api';
import toast from 'react-hot-toast';

export default function CustomerModal({ isOpen, onClose, customer, onSuccess }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    billingAddress: '',
    city: '',
    state: '',
    postalCode: '',
    country: '',
    taxId: '',
    notes: ''
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (customer) {
      setFormData({
        name: customer.name || '',
        email: customer.email || '',
        phone: customer.phone || '',
        billingAddress: customer.billingAddress || '',
        city: customer.city || '',
        state: customer.state || '',
        postalCode: customer.postalCode || '',
        country: customer.country || '',
        taxId: customer.taxId || '',
        notes: customer.notes || ''
      });
    } else {
      setFormData({
        name: '',
        email: '',
        phone: '',
        billingAddress: '',
        city: '',
        state: '',
        postalCode: '',
        country: '',
        taxId: '',
        notes: ''
      });
    }
  }, [customer, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Customer name is required.');
      return;
    }

    try {
      setLoading(true);
      if (customer?._id) {
        await api.put(`/customers/${customer._id}`, formData);
        toast.success('Customer updated successfully!');
      } else {
        await api.post('/customers', formData);
        toast.success('Customer created successfully!');
      }
      onSuccess?.();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Failed to save customer.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={customer ? 'Edit Customer' : 'Add New Customer'}
      subtitle="Customer information used for invoice generation and billing records"
      maxWidth="max-w-2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Customer / Company Name *
            </label>
            <input
              type="text"
              name="name"
              required
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g. Acme Corporation"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-brand-700 focus:ring-1 focus:ring-brand-700 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Email Address
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="billing@acme.com"
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

          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Billing Address
            </label>
            <input
              type="text"
              name="billingAddress"
              value={formData.billingAddress}
              onChange={handleChange}
              placeholder="123 Corporate Blvd, Suite 200"
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
              State / Region
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
              placeholder="94103"
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

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Tax ID / GSTIN (Optional)
            </label>
            <input
              type="text"
              name="taxId"
              value={formData.taxId}
              onChange={handleChange}
              placeholder="e.g. 27ABCDE1234F1Z5 (Optional)"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-brand-700 focus:ring-1 focus:ring-brand-700 focus:outline-none"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Internal Notes (Optional)
            </label>
            <textarea
              name="notes"
              rows={2}
              value={formData.notes}
              onChange={handleChange}
              placeholder="Special instructions or contact preferences..."
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-brand-700 focus:ring-1 focus:ring-brand-700 focus:outline-none"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={loading}>
            {customer ? 'Update Customer' : 'Save Customer'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
