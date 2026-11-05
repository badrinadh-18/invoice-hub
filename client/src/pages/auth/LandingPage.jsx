import React from 'react';
import { Link } from 'react-router-dom';
import {
  Receipt,
  ShieldCheck,
  Zap,
  FileText,
  DollarSign,
  Lock,
  ArrowRight,
  CheckCircle2,
  PieChart,
  Download
} from 'lucide-react';
import Button from '../../components/common/Button';

export default function LandingPage() {
  return (
    <div className="space-y-24 py-12">
      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center pt-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-50 border border-brand-200 text-brand-800 text-xs font-semibold mb-6">
          <ShieldCheck className="w-3.5 h-3.5 text-brand-700" />
          <span>Multi-Tenant Architecture & Strict Data Isolation</span>
        </div>

        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight max-w-4xl mx-auto leading-tight">
          Create, Manage & Track Invoices in{' '}
          <span className="text-brand-700 underline decoration-brand-200 decoration-wavy">One Place.</span>
        </h1>

        <p className="mt-6 text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto">
          InvoiceHub is a secure, full-stack bill management platform for businesses and freelancers.
          Calculate taxes, issue professional PDF invoices, and monitor your cash flow in real time.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link to="/register">
            <Button size="lg" variant="primary" className="w-full sm:w-auto shadow-md">
              Get Started for Free
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
          <Link to="/login">
            <Button size="lg" variant="secondary" className="w-full sm:w-auto">
              Sign In to Workspace
            </Button>
          </Link>
        </div>

        {/* Product Mockup Preview */}
        <div id="preview" className="mt-16 relative mx-auto max-w-5xl rounded-2xl p-3 bg-gradient-to-b from-slate-200 to-slate-100 shadow-2xl border border-slate-200/80">
          <div className="bg-white rounded-xl shadow-inner border border-slate-200 overflow-hidden">
            {/* Mock Dashboard Header */}
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-brand-700 flex items-center justify-center text-white">
                  <Receipt className="w-4 h-4" />
                </div>
                <span className="font-bold text-sm">InvoiceHub Workspace Demo</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-300">
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                Connected to MongoDB
              </div>
            </div>

            {/* Mock Content */}
            <div className="p-6 sm:p-8 bg-slate-50 text-left space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                  <span className="text-xs text-slate-500 font-medium">Total Invoiced</span>
                  <p className="text-2xl font-bold text-slate-900 mt-1">$24,850.00</p>
                  <span className="text-xs text-emerald-600 font-medium">18 Active Invoices</span>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                  <span className="text-xs text-slate-500 font-medium">Amount Collected</span>
                  <p className="text-2xl font-bold text-brand-700 mt-1">$20,200.00</p>
                  <span className="text-xs text-slate-400 font-medium">92% collection rate</span>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                  <span className="text-xs text-slate-500 font-medium">Outstanding Balance</span>
                  <p className="text-2xl font-bold text-amber-600 mt-1">$4,650.00</p>
                  <span className="text-xs text-amber-700 font-medium">2 Invoices pending</span>
                </div>
              </div>

              {/* Mock Table */}
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
                <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                  <span className="text-xs font-semibold text-slate-700 uppercase">Recent Authorized Invoices</span>
                  <span className="text-xs text-brand-700 font-medium">Server Validated</span>
                </div>
                <div className="divide-y divide-slate-100 text-sm">
                  <div className="px-5 py-3.5 flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-slate-900">Acme Global Enterprises</p>
                      <p className="text-xs text-slate-400">INV-202610-0001 • Net 30</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-slate-900">$2,850.00</p>
                      <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Paid
                      </span>
                    </div>
                  </div>
                  <div className="px-5 py-3.5 flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-slate-900">TechForward Labs</p>
                      <p className="text-xs text-slate-400">INV-202610-0002 • Due in 14 days</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-slate-900">₹2,655.00</p>
                      <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                        Partially Paid (Bal: ₹1,655)
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Grid */}
      <section id="features" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl font-bold text-slate-900">
            Engineered for Precision & Accountability
          </h2>
          <p className="mt-3 text-slate-600">
            Everything your business needs to bill clients professionally with zero spreadsheet headaches.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition">
            <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center mb-5">
              <Zap className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900">Server-Side Calculation Engine</h3>
            <p className="mt-2 text-sm text-slate-600 leading-relaxed">
              Decimal-safe arithmetic with itemized taxes, percentage or fixed discounts, and strict balance verification.
              Client-forged totals are automatically recalculated and rejected.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center mb-5">
              <Download className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900">Instant Vector PDF Generation</h3>
            <p className="mt-2 text-sm text-slate-600 leading-relaxed">
              Generate crisp A4 PDF documents directly from the server with your custom business details, line item breakdown,
              payment instructions, and verified balances.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition">
            <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center mb-5">
              <DollarSign className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900">Payment Lifecycle Tracking</h3>
            <p className="mt-2 text-sm text-slate-600 leading-relaxed">
              Record partial and full payments across Cash, Bank Wire, UPI, and Cards. Automatically prevent overpayments
              and transition invoice statuses accurately.
            </p>
          </div>
        </div>
      </section>

      {/* Security & Multi-Tenant Highlights */}
      <section id="security" className="bg-slate-900 text-white py-16 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <span className="text-brand-400 font-semibold text-xs uppercase tracking-wider">
                Enterprise-Grade Privacy
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold mt-2 leading-tight">
                Complete Data Isolation for Every Registered Business
              </h2>
              <p className="mt-4 text-slate-300 text-sm sm:text-base leading-relaxed">
                InvoiceHub enforces strict database owner scoping on every query. User A can never view,
                modify, download, or record payments against User B’s customers, invoices, or business profiles.
              </p>

              <div className="mt-8 space-y-4">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-teal-400 shrink-0 mt-0.5" />
                  <span className="text-sm text-slate-200">
                    Bcrypt password hashing with secure sessions & JWT authentication
                  </span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-teal-400 shrink-0 mt-0.5" />
                  <span className="text-sm text-slate-200">
                    Administrator console with system audit logs and account governance
                  </span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-teal-400 shrink-0 mt-0.5" />
                  <span className="text-sm text-slate-200">
                    Seller & customer snapshots on issue preserve historical invoices permanently
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-slate-800/80 p-6 sm:p-8 rounded-2xl border border-slate-700">
              <div className="flex items-center gap-3 pb-4 border-b border-slate-700">
                <Lock className="w-5 h-5 text-teal-400" />
                <h4 className="font-semibold text-white">Owner Scoped Query Model</h4>
              </div>
              <div className="mt-4 font-mono text-xs text-slate-300 space-y-3 bg-slate-950 p-4 rounded-xl border border-slate-800">
                <p className="text-teal-400">// Server-authoritative isolation</p>
                <p>const invoice = await Invoice.findOne(&#123;</p>
                <p className="pl-4">_id: req.params.id,</p>
                <p className="pl-4 text-amber-300">ownerId: req.user._id // strictly enforced</p>
                <p>&#125;);</p>
                <p className="text-slate-400">// 21 Automated security isolation tests verified</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="max-w-5xl mx-auto px-4 text-center">
        <div className="bg-brand-50 border border-brand-200 rounded-2xl p-8 sm:p-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
            Ready to streamline your invoice workflow?
          </h2>
          <p className="mt-3 text-slate-600 max-w-xl mx-auto">
            Get started in under two minutes. No credit card required.
          </p>
          <div className="mt-6 flex justify-center gap-4">
            <Link to="/register">
              <Button size="lg" variant="primary">Create Free Account</Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
