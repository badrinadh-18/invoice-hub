import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, Receipt, CheckCircle, AlertTriangle, ArrowRight } from 'lucide-react';
import Button from '../../components/common/Button';
import api from '../../services/api';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;

    try {
      setLoading(true);
      setErrorMsg('');
      const res = await api.post('/auth/forgot-password', {
        email: email.trim(),
        frontendUrl: window.location.origin
      });
      setSuccessMsg(res.data.message || 'A secure password reset link has been dispatched to your email inbox.');
    } catch (err) {
      const errText = err.response?.data?.error?.message || err.response?.data?.message || 'No registered account found with this email address.';
      setErrorMsg(errText);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[75vh] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link to="/" className="inline-flex items-center gap-2 mb-4">
          <div className="w-10 h-10 rounded-xl bg-brand-700 flex items-center justify-center text-white shadow-md">
            <Receipt className="w-5 h-5" />
          </div>
          <span className="font-bold text-2xl text-slate-900 dark:text-white tracking-tight">
            Invoice<span className="text-brand-700 dark:text-brand-400">Hub</span>
          </span>
        </Link>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Reset Account Password
        </h2>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
          Enter your registered email address to receive your password reset link.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white dark:bg-slate-900 py-8 px-6 sm:px-10 shadow-sm border border-slate-200/80 dark:border-slate-800 rounded-2xl">
          {errorMsg && (
            <div className="mb-5 p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs sm:text-sm flex items-start gap-2.5">
              <AlertTriangle className="w-5 h-5 shrink-0 text-rose-600 dark:text-rose-400 mt-0.5" />
              <div>
                <p className="font-semibold text-rose-900 dark:text-rose-100">User Not Found</p>
                <p className="mt-0.5 leading-relaxed">{errorMsg}</p>
              </div>
            </div>
          )}

          {successMsg ? (
            <div className="space-y-5">
              <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 text-sm space-y-2">
                <div className="flex items-center gap-2 font-semibold text-emerald-800 dark:text-emerald-300">
                  <CheckCircle className="w-5 h-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                  Password Reset Email Sent
                </div>
                <p className="text-xs sm:text-sm text-emerald-800 dark:text-emerald-300 leading-relaxed">
                  {successMsg}
                </p>
                <div className="mt-2 pt-2 border-t border-emerald-200 dark:border-emerald-800/80 text-[11px] text-emerald-700 dark:text-emerald-400 leading-relaxed">
                  🔒 For your security, the reset link is never displayed on screen. Please check your inbox and spam/junk folder. The link is valid for 60 minutes.
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 pt-2">
                <Link to="/login" className="flex-1">
                  <Button variant="secondary" className="w-full">
                    <ArrowLeft className="w-4 h-4 mr-1" />
                    Back to Sign In
                  </Button>
                </Link>
                <Button variant="primary" className="flex-1" onClick={() => { setSuccessMsg(''); setErrorMsg(''); }} loading={loading}>
                  Request Again
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Registered Email Address
                </label>
                <div className="relative rounded-lg shadow-xs">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <Mail className="h-4 w-4 text-slate-400" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@business.com"
                    className="block w-full rounded-lg border border-slate-300 dark:border-slate-700 pl-10 pr-3 py-2 text-sm text-slate-900 dark:text-white bg-white dark:bg-slate-800 placeholder:text-slate-400 focus:border-brand-700 focus:outline-none focus:ring-1 focus:ring-brand-700"
                  />
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-xs text-slate-500 dark:text-slate-400">
                <p className="font-semibold text-slate-700 dark:text-slate-300 mb-0.5">Strict Security Protocol</p>
                We will check if your email exists in our system. If verified, a secure reset link valid for 60 minutes will be delivered directly to your email inbox only.
              </div>

              <Button
                type="submit"
                variant="primary"
                size="md"
                loading={loading}
                className="w-full"
              >
                Send Password Reset Link
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>

              <div className="text-center pt-2">
                <Link
                  to="/login"
                  className="text-xs font-medium text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 inline-flex items-center gap-1"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Back to Sign In
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
