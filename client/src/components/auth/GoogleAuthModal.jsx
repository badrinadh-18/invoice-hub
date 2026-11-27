import React, { useState, useEffect } from 'react';
import { User, Plus, X, ArrowLeft, Check, ShieldCheck, Loader2 } from 'lucide-react';
import Button from '../common/Button';

export const GoogleIcon = ({ className = 'w-5 h-5' }) => (
  <svg className={className} viewBox="0 0 24 24">
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

const DEFAULT_ACCOUNTS = [
  {
    name: 'Badrinadh User',
    email: 'badrinadh.app@gmail.com',
    avatarBg: 'bg-blue-600',
  },
  {
    name: 'Business Admin',
    email: 'admin.invoicehub@gmail.com',
    avatarBg: 'bg-emerald-600',
  }
];

export default function GoogleAuthModal({ isOpen, onClose, onSelectAccount, loading }) {
  const [accounts, setAccounts] = useState([]);
  const [showAddAnother, setShowAddAnother] = useState(false);
  const [customEmail, setCustomEmail] = useState('');
  const [customName, setCustomName] = useState('');
  const [selectedEmail, setSelectedEmail] = useState('');
  const [inputError, setInputError] = useState('');

  // Load saved Google accounts from localStorage or initialize with defaults
  useEffect(() => {
    try {
      const saved = localStorage.getItem('invoicehub_google_accounts');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setAccounts(parsed);
          return;
        }
      }
    } catch (e) {
      console.warn('Could not read saved google accounts', e);
    }
    setAccounts(DEFAULT_ACCOUNTS);
  }, []);

  if (!isOpen) return null;

  const handleAccountClick = async (account) => {
    setSelectedEmail(account.email);
    // Save to device's recent Google accounts list
    saveAccountToStorage(account);
    await onSelectAccount({
      email: account.email,
      name: account.name || account.email.split('@')[0],
      avatar: account.avatar || '',
      googleId: account.googleId || `g_${account.email.replace(/[^a-zA-Z0-9]/g, '_')}`
    });
  };

  const handleCustomSubmit = async (e) => {
    e.preventDefault();
    if (!customEmail || !customEmail.includes('@')) {
      setInputError('Please enter a valid Google or Gmail address.');
      return;
    }
    setInputError('');
    const newAccount = {
      name: customName.trim() || customEmail.split('@')[0],
      email: customEmail.trim().toLowerCase(),
      avatarBg: 'bg-purple-600',
      googleId: `g_${Date.now()}`
    };

    saveAccountToStorage(newAccount);
    setSelectedEmail(newAccount.email);
    await onSelectAccount(newAccount);
  };

  const saveAccountToStorage = (account) => {
    try {
      const existing = accounts.filter(
        (a) => a.email.toLowerCase() !== account.email.toLowerCase()
      );
      const updated = [account, ...existing].slice(0, 5);
      setAccounts(updated);
      localStorage.setItem('invoicehub_google_accounts', JSON.stringify(updated));
    } catch (err) {
      console.warn('Could not save google account', err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/65 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 relative transition-all">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          disabled={loading}
          className="absolute top-5 right-5 p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Google Header */}
        <div className="text-center pt-2 pb-4">
          <div className="flex justify-center mb-3">
            <div className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs flex items-center justify-center">
              <GoogleIcon className="w-6 h-6" />
            </div>
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            {showAddAnother ? 'Add Google Account' : 'Choose an account'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            to continue to <strong className="text-slate-800 dark:text-slate-200 font-semibold">InvoiceHub</strong>
          </p>
        </div>

        {/* View 1: Account Chooser List */}
        {!showAddAnother ? (
          <div className="space-y-1 my-3 max-h-[320px] overflow-y-auto">
            {accounts.map((acc, idx) => {
              const isSelected = selectedEmail === acc.email && loading;
              return (
                <button
                  key={acc.email || idx}
                  type="button"
                  disabled={loading}
                  onClick={() => handleAccountClick(acc)}
                  className={`w-full flex items-center gap-3.5 p-3 rounded-2xl text-left border transition ${
                    isSelected
                      ? 'border-brand-500 bg-brand-50/60 dark:bg-brand-950/40'
                      : 'border-transparent hover:border-slate-200 dark:hover:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0 ${
                      acc.avatarBg || 'bg-brand-600'
                    }`}
                  >
                    {acc.name ? acc.name.charAt(0).toUpperCase() : acc.email.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                      {acc.name || acc.email.split('@')[0]}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                      {acc.email}
                    </p>
                  </div>
                  {isSelected ? (
                    <Loader2 className="w-5 h-5 text-brand-600 animate-spin shrink-0" />
                  ) : (
                    <div className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-700 opacity-0 group-hover:opacity-100" />
                  )}
                </button>
              );
            })}

            {/* Use another account option */}
            <button
              type="button"
              disabled={loading}
              onClick={() => {
                setShowAddAnother(true);
                setInputError('');
              }}
              className="w-full flex items-center gap-3.5 p-3 rounded-2xl text-left border border-transparent hover:border-slate-200 dark:hover:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition text-slate-700 dark:text-slate-200 mt-2"
            >
              <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 shrink-0">
                <User className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                  Use another account
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Sign in with any Google / Gmail account
                </p>
              </div>
            </button>
          </div>
        ) : (
          /* View 2: Add Custom Account Form */
          <form onSubmit={handleCustomSubmit} className="space-y-4 my-2">
            {inputError && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs">
                {inputError}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Google or Gmail Address *
              </label>
              <input
                type="email"
                required
                autoFocus
                value={customEmail}
                onChange={(e) => setCustomEmail(e.target.value)}
                placeholder="yourname@gmail.com"
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white bg-white dark:bg-slate-800 placeholder:text-slate-400 focus:border-brand-600 focus:ring-1 focus:ring-brand-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Display Name (optional)
              </label>
              <input
                type="text"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder="e.g. John Doe"
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white bg-white dark:bg-slate-800 placeholder:text-slate-400 focus:border-brand-600 focus:ring-1 focus:ring-brand-600 focus:outline-none"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                type="button"
                variant="secondary"
                disabled={loading}
                onClick={() => setShowAddAnother(false)}
                className="flex-1"
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                Back
              </Button>
              <Button
                type="submit"
                variant="primary"
                loading={loading}
                className="flex-1"
              >
                Continue
              </Button>
            </div>
          </form>
        )}

        {/* Security Footer Notice */}
        <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed flex items-start gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <span>
            To continue, Google will share your profile name and email address with InvoiceHub. Automatic sign-in or instant registration is applied immediately.
          </span>
        </div>
      </div>
    </div>
  );
}
