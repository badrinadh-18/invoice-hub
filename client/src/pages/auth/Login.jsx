import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, Lock, Mail, Receipt, ArrowRight, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/common/Button';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/dashboard';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg('Please enter both email and password.');
      return;
    }

    try {
      setLoading(true);
      setErrorMsg('');
      const user = await login(email, password);

      if (user.role === 'admin') {
        navigate('/admin/dashboard', { replace: true });
      } else {
        navigate(from === '/login' ? '/dashboard' : from, { replace: true });
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.error?.message || 'Login failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFill = (demoEmail, demoPass) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setErrorMsg('');
  };

  return (
    <div className="min-h-[80vh] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
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
          Sign in to your account
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          Or{' '}
          <Link to="/register" className="font-medium text-brand-700 hover:text-brand-800 underline">
            create a new business account
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 sm:px-10 shadow-sm border border-slate-200/80 rounded-2xl">
          {errorMsg && (
            <div className="mb-5 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-sm">
              {errorMsg}
            </div>
          )}

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

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  className="text-xs font-medium text-brand-700 hover:text-brand-800"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative rounded-lg shadow-xs">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Lock className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="block w-full rounded-lg border border-slate-300 pl-10 pr-10 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-700 focus:outline-none focus:ring-1 focus:ring-brand-700"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-brand-700 focus:ring-brand-700"
                />
                <span className="text-xs text-slate-600">Remember this device</span>
              </label>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={loading}
              className="w-full"
            >
              Sign In to InvoiceHub
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </form>

          {/* Quick Demo Credentials for Fast Evaluation */}
          <div className="mt-6 pt-6 border-t border-slate-100">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block text-center mb-3">
              One-Click Demo Credentials
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickFill('demo@invoicehub.local', 'Password@123')}
                className="text-xs py-2 px-2.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 font-medium text-center transition"
              >
                👤 Regular User
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill('admin@invoicehub.local', 'Admin@InvoiceHub2026')}
                className="text-xs py-2 px-2.5 rounded-lg border border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-800 font-medium text-center transition"
              >
                🛡️ Administrator
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
