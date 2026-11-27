import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Lock, Mail, User, Receipt, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/common/Button';
import GoogleAuthModal, { GoogleIcon } from '../../components/auth/GoogleAuthModal';

export default function Register() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    acceptTerms: false
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Google Sign-Up state
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const { register, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (formData.password.length < 8) {
      setErrorMsg('Password must be at least 8 characters long.');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    if (!formData.acceptTerms) {
      setErrorMsg('Please accept the Terms of Service to continue.');
      return;
    }

    try {
      setLoading(true);
      await register({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        confirmPassword: formData.confirmPassword
      });
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setErrorMsg(err.response?.data?.error?.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSelectAccount = async (account) => {
    try {
      setGoogleLoading(true);
      setErrorMsg('');
      await loginWithGoogle({
        email: account.email,
        name: account.name || account.email.split('@')[0],
        avatar: account.avatar || '',
        googleId: account.googleId || `g_${Date.now()}`
      });
      setShowGoogleModal(false);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setErrorMsg(err.response?.data?.error?.message || 'Google registration failed.');
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
          Create your business account
        </h2>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
          Already registered?{' '}
          <Link to="/login" className="font-medium text-brand-700 dark:text-brand-400 hover:text-brand-800 dark:hover:text-brand-300 underline">
            Sign in to existing account
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

          {/* Google Account Sign Up Button */}
          <button
            type="button"
            onClick={() => setShowGoogleModal(true)}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 border border-slate-300 dark:border-slate-700 rounded-xl shadow-xs bg-white dark:bg-slate-800 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-750 active:scale-[0.99] transition"
          >
            <GoogleIcon className="w-5 h-5" />
            <span>Sign up with Google</span>
          </button>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200 dark:border-slate-800" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white dark:bg-slate-900 px-3 text-slate-500 dark:text-slate-400 font-medium">
                Or register with email
              </span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Full Name
              </label>
              <div className="relative rounded-lg shadow-xs">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <User className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  type="text"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g. Jane Doe"
                  className="block w-full rounded-lg border border-slate-300 dark:border-slate-700 pl-10 pr-3 py-2 text-sm text-slate-900 dark:text-white bg-white dark:bg-slate-800 placeholder:text-slate-400 focus:border-brand-700 focus:outline-none focus:ring-1 focus:ring-brand-700"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Business Email Address
              </label>
              <div className="relative rounded-lg shadow-xs">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Mail className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="jane@company.com"
                  className="block w-full rounded-lg border border-slate-300 dark:border-slate-700 pl-10 pr-3 py-2 text-sm text-slate-900 dark:text-white bg-white dark:bg-slate-800 placeholder:text-slate-400 focus:border-brand-700 focus:outline-none focus:ring-1 focus:ring-brand-700"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Password (min. 8 characters)
              </label>
              <div className="relative rounded-lg shadow-xs">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Lock className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  required
                  minLength={8}
                  value={formData.password}
                  onChange={handleChange}
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

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Confirm Password
              </label>
              <div className="relative rounded-lg shadow-xs">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Lock className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="block w-full rounded-lg border border-slate-300 dark:border-slate-700 pl-10 pr-3 py-2 text-sm text-slate-900 dark:text-white bg-white dark:bg-slate-800 placeholder:text-slate-400 focus:border-brand-700 focus:outline-none focus:ring-1 focus:ring-brand-700"
                />
              </div>
            </div>

            <div className="pt-2">
              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="acceptTerms"
                  checked={formData.acceptTerms}
                  onChange={handleChange}
                  className="h-4 w-4 mt-0.5 rounded border-slate-300 dark:border-slate-700 text-brand-700 focus:ring-brand-700"
                />
                <span className="text-xs text-slate-600 dark:text-slate-400 leading-normal">
                  I accept the InvoiceHub Terms of Service, Privacy Policy, and acknowledge that all tenant records are strictly isolated.
                </span>
              </label>
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                variant="primary"
                size="lg"
                loading={loading}
                className="w-full"
              >
                Create Account & Access Workspace
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </form>
        </div>
      </div>

      {/* Google Account Selector Modal */}
      <GoogleAuthModal
        isOpen={showGoogleModal}
        onClose={() => setShowGoogleModal(false)}
        onSelectAccount={handleGoogleSelectAccount}
        loading={googleLoading}
      />
    </div>
  );
}
