import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, Lock, Mail, Receipt, ArrowRight, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/common/Button';

const GoogleIcon = () => (
  <svg className="w-4 h-4 mr-2 shrink-0" viewBox="0 0 24 24">
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
    />
  </svg>
);

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Google Sign-In state
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [googleEmail, setGoogleEmail] = useState('');
  const [googleName, setGoogleName] = useState('');
  const [googleLoading, setGoogleLoading] = useState(false);

  const { login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/dashboard';

  const handleSuccessfulAuth = (user) => {
    if (user.role === 'admin') {
      navigate('/admin/dashboard', { replace: true });
    } else {
      navigate(from === '/login' ? '/dashboard' : from, { replace: true });
    }
  };

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
      handleSuccessfulAuth(user);
    } catch (err) {
      setErrorMsg(err.response?.data?.error?.message || 'Login failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSubmit = async (e) => {
    e?.preventDefault();
    if (!googleEmail || !googleEmail.includes('@')) {
      setErrorMsg('Please enter a valid Gmail address.');
      return;
    }

    try {
      setGoogleLoading(true);
      setErrorMsg('');
      const user = await loginWithGoogle({
        email: googleEmail.trim(),
        name: googleName.trim() || googleEmail.split('@')[0],
        googleId: `google_${Date.now()}`
      });
      setShowGoogleModal(false);
      handleSuccessfulAuth(user);
    } catch (err) {
      setErrorMsg(err.response?.data?.error?.message || 'Google authentication failed.');
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
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
          Sign in to your account
        </h2>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
          Or{' '}
          <Link to="/register" className="font-medium text-brand-700 dark:text-brand-400 hover:text-brand-800 dark:hover:text-brand-300 underline">
            create a new business account
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white dark:bg-slate-900 py-8 px-6 sm:px-10 shadow-sm border border-slate-200/80 dark:border-slate-800 rounded-2xl">
          {errorMsg && (
            <div className="mb-5 p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-sm">
              {errorMsg}
            </div>
          )}

          {/* Google / Gmail Sign In Button */}
          <button
            type="button"
            onClick={() => {
              setGoogleEmail('');
              setGoogleName('');
              setShowGoogleModal(true);
            }}
            className="w-full flex items-center justify-center py-2.5 px-4 border border-slate-300 dark:border-slate-700 rounded-xl shadow-xs bg-white dark:bg-slate-800 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-750 transition"
          >
            <GoogleIcon />
            <span>Continue with Google</span>
          </button>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200 dark:border-slate-800" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white dark:bg-slate-900 px-3 text-slate-500 dark:text-slate-400 font-medium">
                Or sign in with email
              </span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
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
                  className="block w-full rounded-lg border border-slate-300 dark:border-slate-700 pl-10 pr-3 py-2 text-sm text-slate-900 dark:text-white bg-white dark:bg-slate-800 placeholder:text-slate-400 focus:border-brand-700 focus:outline-none focus:ring-1 focus:ring-brand-700"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  className="text-xs font-medium text-brand-700 dark:text-brand-400 hover:text-brand-800 dark:hover:text-brand-300"
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
                  className="block w-full rounded-lg border border-slate-300 dark:border-slate-700 pl-10 pr-10 py-2 text-sm text-slate-900 dark:text-white bg-white dark:bg-slate-800 placeholder:text-slate-400 focus:border-brand-700 focus:outline-none focus:ring-1 focus:ring-brand-700"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
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
                  className="h-4 w-4 rounded border-slate-300 dark:border-slate-700 text-brand-700 focus:ring-brand-700"
                />
                <span className="text-xs text-slate-600 dark:text-slate-400">Remember this device</span>
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
        </div>
      </div>

      {/* Google Sign In Modal */}
      {showGoogleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <GoogleIcon />
                <h3 className="font-bold text-slate-900 dark:text-white text-base">
                  Sign in with Google
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowGoogleModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleGoogleSubmit} className="mt-4 space-y-4">
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Enter your Gmail / Google Workspace address to sign in or create an instant linked session.
              </p>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Gmail Address *
                </label>
                <input
                  type="email"
                  required
                  value={googleEmail}
                  onChange={(e) => setGoogleEmail(e.target.value)}
                  placeholder="username@gmail.com"
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 px-3 py-2 text-sm text-slate-900 dark:text-white bg-white dark:bg-slate-800 focus:border-brand-700 focus:ring-1 focus:ring-brand-700 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Account Name (optional)
                </label>
                <input
                  type="text"
                  value={googleName}
                  onChange={(e) => setGoogleName(e.target.value)}
                  placeholder="e.g. Alex Johnson"
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 px-3 py-2 text-sm text-slate-900 dark:text-white bg-white dark:bg-slate-800 focus:border-brand-700 focus:ring-1 focus:ring-brand-700 focus:outline-none"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  className="flex-1"
                  onClick={() => setShowGoogleModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  className="flex-1"
                  loading={googleLoading}
                >
                  Continue
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
