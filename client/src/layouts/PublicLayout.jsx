import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { Receipt, ChevronRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function PublicLayout() {
  const { isAuthenticated, isAdmin } = useAuth();

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-150">
      {/* Top Navigation */}
      <header className="sticky top-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 transition-colors duration-150">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-brand-700 flex items-center justify-center text-white shadow-sm shadow-brand-700/20 group-hover:bg-brand-800 transition">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-lg text-slate-900 dark:text-white tracking-tight flex items-center gap-1.5">
                Invoice<span className="text-brand-700 dark:text-brand-400">Hub</span>
              </span>
              <span className="hidden sm:block text-[10px] text-slate-400 dark:text-slate-500 font-medium tracking-wide uppercase">
                Bill Management
              </span>
            </div>
          </Link>

          {/* Navigation links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600 dark:text-slate-300">
            <a href="#features" className="hover:text-brand-700 dark:hover:text-brand-400 transition">Features</a>
            <a href="#benefits" className="hover:text-brand-700 dark:hover:text-brand-400 transition">Benefits</a>
            <a href="#security" className="hover:text-brand-700 dark:hover:text-brand-400 transition">Security</a>
            <a href="#preview" className="hover:text-brand-700 dark:hover:text-brand-400 transition">Overview</a>
          </nav>

          {/* Action buttons */}
          <div className="flex items-center gap-2.5 sm:gap-3">
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
                  className="px-4 py-2 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
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

      {/* Main Outlet */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Public Footer */}
      <footer className="bg-white dark:bg-slate-900 border-t border-slate-200/80 dark:border-slate-800 py-12 transition-colors duration-150">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-8 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-brand-700 flex items-center justify-center text-white">
                <Receipt className="w-4 h-4" />
              </div>
              <span className="font-bold text-base text-slate-900 dark:text-white tracking-tight">
                Invoice<span className="text-brand-700 dark:text-brand-400">Hub</span>
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 text-center md:text-right">
              Multi-user bill & invoice management engineered for speed, reliability, and security.
            </p>
          </div>
          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400 dark:text-slate-500">
            <p>© {new Date().getFullYear()} InvoiceHub. All rights reserved.</p>
            <p>Designed for fast, reliable, and compliant invoicing.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
