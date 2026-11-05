import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Receipt, ShieldCheck, ChevronRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function PublicLayout() {
  const { isAuthenticated, user, isAdmin } = useAuth();
  const location = useLocation();

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      {/* Top Navigation */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-brand-700 flex items-center justify-center text-white shadow-sm shadow-brand-700/20 group-hover:bg-brand-800 transition">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-lg text-slate-900 tracking-tight flex items-center gap-1.5">
                Invoice<span className="text-brand-700">Hub</span>
              </span>
              <span className="hidden sm:block text-[10px] text-slate-400 font-medium tracking-wide uppercase">
                Bill Management
              </span>
            </div>
          </Link>

          {/* Navigation links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
            <a href="#features" className="hover:text-brand-700 transition">Features</a>
            <a href="#benefits" className="hover:text-brand-700 transition">Benefits</a>
            <a href="#security" className="hover:text-brand-700 transition">Security</a>
            <a href="#preview" className="hover:text-brand-700 transition">Overview</a>
          </nav>

          {/* Action buttons */}
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <Link
                to={isAdmin ? "/admin/dashboard" : "/dashboard"}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-brand-700 text-white hover:bg-brand-800 shadow-sm transition"
              >
                Go to Dashboard
                <ChevronRight className="w-4 h-4" />
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-4 py-2 rounded-lg text-sm font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium bg-brand-700 text-white hover:bg-brand-800 shadow-sm transition"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 mt-auto py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div className="md:col-span-2">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-brand-700 flex items-center justify-center text-white">
                  <Receipt className="w-4 h-4" />
                </div>
                <span className="font-bold text-slate-900 text-base">InvoiceHub</span>
              </div>
              <p className="text-sm text-slate-500 max-w-sm">
                A secure multi-user invoice management platform providing isolated business profiles,
                automated financial calculations, PDF generation, and payment lifecycle tracking.
              </p>
            </div>

            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-900 mb-3">Platform</h4>
              <ul className="space-y-2 text-sm text-slate-600">
                <li><Link to="/login" className="hover:text-brand-700 transition">User Login</Link></li>
                <li><Link to="/register" className="hover:text-brand-700 transition">Register Account</Link></li>
                <li><Link to="/login" className="hover:text-brand-700 transition">Admin Portal</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-900 mb-3">Security</h4>
              <ul className="space-y-2 text-sm text-slate-600">
                <li className="flex items-center gap-1.5 text-slate-600">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  Owner Scoped RBAC
                </li>
                <li>Zero Cross-Tenant Access</li>
                <li>Server Audited Actions</li>
              </ul>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
            <p>© {new Date().getFullYear()} InvoiceHub. All rights reserved.</p>
            <p>Designed for fast, reliable, and compliant invoicing.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
