import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, Receipt, Info } from 'lucide-react';
import Button from '../../components/common/Button';
import api from '../../services/api';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [responseMsg, setResponseMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;

    try {
      setLoading(true);
      const res = await api.post('/auth/forgot-password', { email });
      setResponseMsg(res.data.message);
    } catch (err) {
      setResponseMsg('An error occurred. Please contact system administrator.');
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
          <span className="font-bold text-2xl text-slate-900 tracking-tight">
            Invoice<span className="text-brand-700">Hub</span>
          </span>
        </Link>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">
          Reset Account Password
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          Enter your registered email address to receive recovery instructions.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 sm:px-10 shadow-sm border border-slate-200/80 rounded-2xl">
          {responseMsg ? (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs sm:text-sm space-y-2">
                <div className="flex items-center gap-2 font-semibold text-amber-800">
                  <Info className="w-4 h-4 shrink-0 text-amber-600" />
                  Password Recovery Notice
                </div>
                <p>{responseMsg}</p>
              </div>

              <div className="flex gap-2">
                <Button variant="secondary" className="flex-1" onClick={() => setResponseMsg('')}>
                  <ArrowLeft className="w-4 h-4 mr-1" />
                  Return to Sign In
                </Button>
                <Button variant="primary" className="flex-1" onClick={handleSubmit} loading={loading}>
                  Resend Reset Link
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Email Address
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
                    className="block w-full rounded-lg border border-slate-300 pl-10 pr-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-700 focus:outline-none focus:ring-1 focus:ring-brand-700"
                  />
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs text-slate-500">
                <p className="font-semibold text-slate-700 mb-0.5">Admin Controlled Environment</p>
                In development or self-hosted mode without external SMTP configured, your system administrator can reset passwords directly through the Admin Console.
              </div>

              <Button
                type="submit"
                variant="primary"
                size="md"
                loading={loading}
                className="w-full"
              >
                Send Reset Instructions
              </Button>

              <div className="text-center pt-2">
                <Link
                  to="/login"
                  className="text-xs font-medium text-slate-500 hover:text-slate-800 inline-flex items-center gap-1"
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
