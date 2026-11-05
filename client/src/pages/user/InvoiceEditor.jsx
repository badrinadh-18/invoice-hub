import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import {
  Plus,
  Trash2,
  Save,
  Send,
  ArrowLeft,
  Building2,
  Users,
  AlertCircle,
  Calendar,
  DollarSign
} from 'lucide-react';
import api from '../../services/api';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { formatCurrency } from '../../utils/formatters';
import toast from 'react-hot-toast';

export default function InvoiceEditor() {
  const { id } = useParams(); // If present, editing draft
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [businessProfile, setBusinessProfile] = useState(null);

  // Form State
  const [customerId, setCustomerId] = useState('');
  const [issueDate, setIssueDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 15);
    return d.toISOString().split('T')[0];
  });
  const [currency, setCurrency] = useState('INR');
  const [discountType, setDiscountType] = useState('percentage');
  const [discountValue, setDiscountValue] = useState(0);
  const [overallTaxRate, setOverallTaxRate] = useState(0);
  const [additionalCharges, setAdditionalCharges] = useState(0);
  const [notes, setNotes] = useState('');
  const [terms, setTerms] = useState('');

  // Line items
  const [items, setItems] = useState([
    { description: '', quantity: 1, unitPrice: 0, taxRate: 0 }
  ]);

  // Load initial data
  useEffect(() => {
    const initData = async () => {
      try {
        setLoading(true);
        const [custRes, profRes] = await Promise.all([
          api.get('/customers?limit=100'),
          api.get('/business-profile')
        ]);

        setCustomers(custRes.data.data || []);
        const profile = profRes.data.data;
        setBusinessProfile(profile);

        if (profile) {
          setCurrency(profile.defaultCurrency || 'INR');
          setTerms(profile.defaultPaymentTerms || 'Net 15');
          setNotes(profile.invoiceNotes || 'Thank you for your business!');
        }

        // If editing existing draft invoice
        if (id) {
          const invRes = await api.get(`/invoices/${id}`);
          const inv = invRes.data.data;

          if (inv.lifecycleState !== 'draft') {
            toast.error('Only draft invoices can be edited.');
            navigate(`/invoices/${id}`);
            return;
          }

          setCustomerId(inv.customerId?._id || inv.customerId || '');
          if (inv.issueDate) setIssueDate(new Date(inv.issueDate).toISOString().split('T')[0]);
          if (inv.dueDate) setDueDate(new Date(inv.dueDate).toISOString().split('T')[0]);
          setCurrency(inv.currency || 'INR');
          setDiscountType(inv.discountType || 'percentage');
          setDiscountValue(inv.discountValue || 0);
          setOverallTaxRate(inv.taxRate || 0);
          setAdditionalCharges(inv.additionalCharges || 0);
          setNotes(inv.notes || '');
          setTerms(inv.terms || '');
          if (inv.items && inv.items.length > 0) {
            setItems(inv.items.map((it) => ({
              description: it.description || '',
              quantity: it.quantity || 1,
              unitPrice: it.unitPrice || 0,
              taxRate: it.taxRate || 0
            })));
          }
        }
      } catch (err) {
        toast.error('Failed to load initial invoice data.');
      } finally {
        setLoading(false);
      }
    };

    initData();
  }, [id, navigate]);

  // Line item handlers
  const handleAddItem = () => {
    setItems((prev) => [
      ...prev,
      { description: '', quantity: 1, unitPrice: 0, taxRate: 0 }
    ]);
  };

  const handleRemoveItem = (index) => {
    if (items.length <= 1) {
      toast.error('An invoice requires at least one line item.');
      return;
    }
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleItemChange = (index, field, value) => {
    setItems((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  // Client-Side Calculations (Live preview matching calculationEngine)
  const round2 = (val) => Math.round((Number(val) + Number.EPSILON) * 100) / 100;

  const subtotal = round2(
    items.reduce((sum, item) => {
      const qty = Math.max(0, Number(item.quantity) || 0);
      const price = Math.max(0, Number(item.unitPrice) || 0);
      return sum + qty * price;
    }, 0)
  );

  let discountAmount = 0;
  const numDiscountVal = Math.max(0, Number(discountValue) || 0);
  if (discountType === 'percentage') {
    discountAmount = round2((subtotal * Math.min(100, numDiscountVal)) / 100);
  } else {
    discountAmount = round2(Math.min(subtotal, numDiscountVal));
  }

  const taxableAmount = round2(Math.max(0, subtotal - discountAmount));

  // Tax calculation
  let taxTotal = 0;
  const hasItemTaxes = items.some((it) => (Number(it.taxRate) || 0) > 0);
  if (hasItemTaxes) {
    const discountRatio = subtotal > 0 ? (subtotal - discountAmount) / subtotal : 0;
    taxTotal = round2(
      items.reduce((acc, it) => {
        const qty = Math.max(0, Number(it.quantity) || 0);
        const price = Math.max(0, Number(it.unitPrice) || 0);
        const rate = Number(it.taxRate) || 0;
        const lineTax = (qty * price * rate) / 100;
        return acc + lineTax * discountRatio;
      }, 0)
    );
  } else if (overallTaxRate > 0) {
    taxTotal = round2((taxableAmount * Number(overallTaxRate)) / 100);
  }

  const numAdditional = Math.max(0, Number(additionalCharges) || 0);
  const grandTotal = round2(taxableAmount + taxTotal + numAdditional);

  // Form submission (Save draft or Issue immediately)
  const handleSubmit = async (issueImmediately) => {
    if (issueImmediately && !customerId) {
      toast.error('Please select a customer before issuing the invoice.');
      return;
    }

    const invalidItem = items.find((it) => !it.description.trim() || Number(it.quantity) <= 0);
    if (invalidItem) {
      toast.error('All line items must have a valid description and positive quantity.');
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        customerId: customerId || undefined,
        dueDate,
        currency,
        items: items.map((it) => ({
          description: it.description.trim(),
          quantity: Number(it.quantity) || 1,
          unitPrice: Number(it.unitPrice) || 0,
          taxRate: Number(it.taxRate) || 0
        })),
        discountType,
        discountValue: Number(discountValue) || 0,
        taxRate: Number(overallTaxRate) || 0,
        additionalCharges: Number(additionalCharges) || 0,
        notes,
        terms,
        issueImmediately
      };

      if (id) {
        // Updating existing draft
        await api.put(`/invoices/${id}`, payload);
        if (issueImmediately) {
          await api.post(`/invoices/${id}/issue`);
          toast.success('Invoice issued successfully!');
        } else {
          toast.success('Draft invoice updated successfully!');
        }
        navigate(`/invoices/${id}`);
      } else {
        // Creating new invoice
        const res = await api.post('/invoices', payload);
        toast.success(issueImmediately ? 'Invoice issued successfully!' : 'Invoice draft saved!');
        navigate(`/invoices/${res.data.data._id}`);
      }
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Failed to save invoice.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="py-16">
        <LoadingSpinner text="Preparing invoice editor..." />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <Link
            to="/invoices"
            className="p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              {id ? 'Edit Draft Invoice' : 'Create New Invoice'}
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Fill in customer information, dynamic line items, and payment terms.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="secondary"
            icon={Save}
            loading={submitting}
            onClick={() => handleSubmit(false)}
          >
            Save Draft
          </Button>
          <Button
            variant="primary"
            icon={Send}
            loading={submitting}
            onClick={() => handleSubmit(true)}
          >
            Issue Invoice
          </Button>
        </div>
      </div>

      {/* Invoice Meta Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Customer & Dates (2 Cols) */}
        <div className="lg:col-span-2 space-y-6">
          <Card title="Bill To Customer" subtitle="Select the client for this bill">
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Customer *
                </label>
                <div className="flex gap-2">
                  <select
                    value={customerId}
                    onChange={(e) => setCustomerId(e.target.value)}
                    className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-brand-700 focus:ring-1 focus:ring-brand-700 focus:outline-none bg-white"
                  >
                    <option value="">-- Choose an existing customer --</option>
                    {customers.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.name} {c.email ? `(${c.email})` : ''}
                      </option>
                    ))}
                  </select>
                  <Link to="/customers">
                    <Button variant="secondary" size="md">
                      + Add New
                    </Button>
                  </Link>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Issue Date
                  </label>
                  <input
                    type="date"
                    value={issueDate}
                    onChange={(e) => setIssueDate(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-brand-700 focus:ring-1 focus:ring-brand-700 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Payment Due Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-brand-700 focus:ring-1 focus:ring-brand-700 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Currency & Seller Snapshot Info (1 Col) */}
        <div>
          <Card title="Billing Settings" subtitle="Currency and terms">
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Currency
                </label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-brand-700 focus:ring-1 focus:ring-brand-700 focus:outline-none bg-white font-medium"
                >
                  <option value="INR">INR (₹)</option>
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                  <option value="CAD">CAD ($)</option>
                  <option value="AUD">AUD ($)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Payment Terms
                </label>
                <input
                  type="text"
                  value={terms}
                  onChange={(e) => setTerms(e.target.value)}
                  placeholder="e.g. Net 15, Due on Receipt"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-brand-700 focus:ring-1 focus:ring-brand-700 focus:outline-none"
                />
              </div>

              <div className="pt-2 text-xs text-slate-500 bg-slate-50 p-3 rounded-lg border border-slate-200">
                <span className="font-semibold text-slate-700 block mb-0.5">Seller Branding:</span>
                {businessProfile?.businessName ? (
                  <p className="text-slate-600">{businessProfile.businessName}</p>
                ) : (
                  <p className="text-amber-700">No company profile configured. Please setup your profile in Settings.</p>
                )}
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Dynamic Line Items Card */}
      <Card
        title="Invoice Line Items"
        subtitle="Add services or goods with itemized quantities and rates"
        action={
          <Button variant="secondary" size="sm" icon={Plus} onClick={handleAddItem}>
            Add Line Item
          </Button>
        }
        noPadding
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-700">
            <thead className="bg-slate-50 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 min-w-[220px]">Item Description *</th>
                <th className="px-4 py-3 w-28 text-right">Qty</th>
                <th className="px-4 py-3 w-36 text-right">Unit Price</th>
                <th className="px-4 py-3 w-28 text-right">Tax (%)</th>
                <th className="px-4 py-3 w-36 text-right">Line Total</th>
                <th className="px-4 py-3 w-12 text-center"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((item, index) => {
                const qty = Math.max(0, Number(item.quantity) || 0);
                const price = Math.max(0, Number(item.unitPrice) || 0);
                const lineTotal = round2(qty * price);

                return (
                  <tr key={index} className="hover:bg-slate-50/50">
                    <td className="px-4 py-2.5">
                      <input
                        type="text"
                        required
                        value={item.description}
                        onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                        placeholder="e.g. Website Development or Consulting"
                        className="w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-sm text-slate-900 focus:border-brand-700 focus:ring-1 focus:ring-brand-700 focus:outline-none"
                      />
                    </td>
                    <td className="px-4 py-2.5">
                      <input
                        type="number"
                        min="0.01"
                        step="any"
                        required
                        value={item.quantity}
                        onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                        className="w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-sm text-slate-900 text-right focus:border-brand-700 focus:ring-1 focus:ring-brand-700 focus:outline-none"
                      />
                    </td>
                    <td className="px-4 py-2.5">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        required
                        value={item.unitPrice}
                        onChange={(e) => handleItemChange(index, 'unitPrice', e.target.value)}
                        className="w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-sm text-slate-900 text-right focus:border-brand-700 focus:ring-1 focus:ring-brand-700 focus:outline-none"
                      />
                    </td>
                    <td className="px-4 py-2.5">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.5"
                        value={item.taxRate}
                        onChange={(e) => handleItemChange(index, 'taxRate', e.target.value)}
                        className="w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-sm text-slate-900 text-right focus:border-brand-700 focus:ring-1 focus:ring-brand-700 focus:outline-none"
                      />
                    </td>
                    <td className="px-4 py-2.5 text-right font-semibold text-slate-900 whitespace-nowrap">
                      {formatCurrency(lineTotal, currency)}
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(index)}
                        className="p-1 text-slate-400 hover:text-rose-600 transition"
                        title="Remove Item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Adjustments & Totals Breakdown Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Notes & Terms */}
        <div className="space-y-4">
          <Card title="Notes & Instructions" subtitle="Instructions for payment or wire transfer">
            <textarea
              rows={4}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Please send payment to Account #... Thank you!"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-brand-700 focus:ring-1 focus:ring-brand-700 focus:outline-none"
            />
          </Card>
        </div>

        {/* Financial Summary Box */}
        <div>
          <Card title="Financial Calculations" subtitle="Server-authoritative calculation preview">
            <div className="space-y-3 text-sm">
              <div className="flex justify-between py-1 text-slate-600">
                <span>Subtotal:</span>
                <span className="font-semibold text-slate-900">{formatCurrency(subtotal, currency)}</span>
              </div>

              {/* Discount inputs */}
              <div className="flex items-center justify-between gap-3 py-1">
                <span className="text-slate-600 text-xs">Discount:</span>
                <div className="flex items-center gap-2">
                  <select
                    value={discountType}
                    onChange={(e) => setDiscountType(e.target.value)}
                    className="text-xs rounded border border-slate-300 py-1 px-2 bg-white"
                  >
                    <option value="percentage">% Pct</option>
                    <option value="fixed">Fixed</option>
                  </select>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={discountValue}
                    onChange={(e) => setDiscountValue(e.target.value)}
                    className="w-20 text-right text-xs rounded border border-slate-300 py-1 px-2"
                  />
                  <span className="text-rose-600 font-medium text-xs w-24 text-right">
                    -{formatCurrency(discountAmount, currency)}
                  </span>
                </div>
              </div>

              {/* Overall Tax rate if items have 0% */}
              {!hasItemTaxes && (
                <div className="flex items-center justify-between gap-3 py-1">
                  <span className="text-slate-600 text-xs">Tax Rate (%):</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.5"
                      value={overallTaxRate}
                      onChange={(e) => setOverallTaxRate(e.target.value)}
                      className="w-20 text-right text-xs rounded border border-slate-300 py-1 px-2"
                    />
                    <span className="text-slate-800 font-medium text-xs w-24 text-right">
                      +{formatCurrency(taxTotal, currency)}
                    </span>
                  </div>
                </div>
              )}

              {hasItemTaxes && (
                <div className="flex justify-between py-1 text-slate-600">
                  <span>Itemized Tax Total:</span>
                  <span className="font-semibold text-slate-900">+{formatCurrency(taxTotal, currency)}</span>
                </div>
              )}

              {/* Additional Charges */}
              <div className="flex items-center justify-between gap-3 py-1">
                <span className="text-slate-600 text-xs">Other Charges / Shipping:</span>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={additionalCharges}
                    onChange={(e) => setAdditionalCharges(e.target.value)}
                    className="w-20 text-right text-xs rounded border border-slate-300 py-1 px-2"
                  />
                  <span className="text-slate-800 font-medium text-xs w-24 text-right">
                    +{formatCurrency(numAdditional, currency)}
                  </span>
                </div>
              </div>

              {/* Grand Total */}
              <div className="pt-3 border-t border-slate-200 flex justify-between items-center">
                <span className="text-base font-bold text-slate-900">Grand Total:</span>
                <span className="text-xl font-extrabold text-brand-700">
                  {formatCurrency(grandTotal, currency)}
                </span>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Bottom Action Buttons */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
        <Link to="/invoices">
          <Button variant="secondary">Cancel</Button>
        </Link>
        <Button
          variant="secondary"
          icon={Save}
          loading={submitting}
          onClick={() => handleSubmit(false)}
        >
          Save Draft
        </Button>
        <Button
          variant="primary"
          icon={Send}
          loading={submitting}
          onClick={() => handleSubmit(true)}
        >
          Issue Invoice
        </Button>
      </div>
    </div>
  );
}
