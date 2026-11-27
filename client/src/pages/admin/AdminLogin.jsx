import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShieldCheck, Lock, Mail, Eye, EyeOff, ArrowRight, ArrowLeft, KeyRound } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/common/Button';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const { login, logout } = useAuth();
  const navigate = useNavigate();

  const handleAdminSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg('Please enter both administrator email and password.');
      return;
    }

    try {
      setLoading(true);
      setErrorMsg('');
      const userData = await login(email, password);

      // Verify that the account has administrative privileges
      if (userData.role !== 'admin') {
        await logout();
        setErrorMsg('Access Denied: This portal is exclusively for System Administrators. Standard user accounts cannot log in here.');
        return;
      }

      navigate('/admin/dashboard', { replace: true });
    } catch (err) {
      setErrorMsg(err.response?.data?.error?.message || 'Administrator sign-in failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleFillDemoAdmin = () => {
    setEmail('admin@invoicehub.local');
    setPassword('Admin@InvoiceHub2026');
    setErrorMsg('');
  };

  return (
    <div className="min-h-[85vh] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-slate-900 dark:bg-slate-800 border border-slate-700 shadow-xl mb-4 text-emerald-400">
          <ShieldCheck className="w-8 h-8" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          System Admin Portal
        </h2>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
          Restricted administrative access console for InvoiceHub management.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white dark:bg-slate-900 py-8 px-6 sm:px-10 shadow-lg border border-slate-200 dark:border-slate-800 rounded-3xl relative overflow-hidden">
          {/* Top Security Banner Accent */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-brand-600" />

          {errorMsg && (
            <div className="mb-5 p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs sm:text-sm leading-relaxed">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleAdminSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Admin Email Address
              </label>
              <div className="relative rounded-xl shadow-xs">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                  <Mail className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@invoicehub.local"
                  className="block w-full rounded-xl border border-slate-300 dark:border-slate-700 pl-10 pr-3 py-2.5 text-sm text-slate-900 dark:text-white bg-white dark:bg-slate-800 placeholder:text-slate-400 focus:border-brand-600 focus:outline-none focus:ring-1 focus:ring-brand-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Master Password
              </label>
              <div className="relative rounded-xl shadow-xs">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                  <Lock className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="block w-full rounded-xl border border-slate-300 dark:border-slate-700 pl-10 pr-10 py-2.5 text-sm text-slate-900 dark:text-white bg-white dark:bg-slate-800 placeholder:text-slate-400 focus:border-brand-600 focus:outline-none focus:ring-1 focus:ring-brand-600"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Quick Demo Credentials Autofill */}
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 flex items-center justify-between text-xs">
              <div>
                <span className="font-semibold text-slate-800 dark:text-slate-200 block">Default Admin Account</span>
                <span className="text-slate-500 dark:text-slate-400 font-mono text-[11px]">admin@invoicehub.local</span>
              </div>
              <button
                type="button"
                onClick={handleFillDemoAdmin}
                className="px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 font-semibold text-slate-700 dark:text-slate-200 text-xs transition inline-flex items-center gap-1"
              >
                <KeyRound className="w-3.5 h-3.5" />
                Auto-fill
              </button>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={loading}
              className="w-full"
            >
              Sign In to Admin Console
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>

            <div className="text-center pt-2 border-t border-slate-100 dark:border-slate-800">
              <Link
                to="/login"
                className="text-xs font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 inline-flex items-center gap-1 transition"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Standard User? Return to User Sign In
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
