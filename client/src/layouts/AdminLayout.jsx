import React, { useState } from 'react';
import { Outlet, NavLink, Link, useNavigate } from 'react-router-dom';
import {
  ShieldAlert,
  Users,
  FileSpreadsheet,
  History,
  ArrowLeft,
  Menu,
  X,
  LogOut,
  ShieldCheck
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navItems = [
    { name: 'System Overview', to: '/admin/dashboard', icon: ShieldCheck },
    { name: 'User Management', to: '/admin/users', icon: Users },
    { name: 'Audit Logs', to: '/admin/audit-logs', icon: History }
  ];

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col md:flex-row">
      {/* Mobile Backdrop */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Admin Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-slate-100 flex flex-col transform transition-transform duration-200 ease-in-out md:translate-x-0 md:static md:h-screen ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="h-16 px-6 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center font-bold">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-sm tracking-tight text-white block">
                ADMIN CONSOLE
              </span>
              <span className="text-[10px] text-amber-400 font-semibold tracking-wider uppercase">
                InvoiceHub Control
              </span>
            </div>
          </div>
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="md:hidden text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/admin/dashboard'}
              onClick={() => setMobileMenuOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition ${
                  isActive
                    ? 'bg-slate-800 text-amber-400 font-semibold border-l-2 border-amber-400'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`
              }
            >
              <item.icon className="w-4 h-4" />
              {item.name}
            </NavLink>
          ))}

          <div className="pt-4 mt-4 border-t border-slate-800">
            <Link
              to="/dashboard"
              className="flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800/60 transition"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to User Workspace
            </Link>
          </div>
        </nav>

        <div className="p-4 border-t border-slate-800 bg-slate-950/40">
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <p className="text-xs font-semibold text-white truncate">{user?.name}</p>
              <span className="inline-block px-1.5 py-0.5 rounded text-[10px] bg-amber-500/20 text-amber-300 font-bold uppercase">
                Administrator
              </span>
            </div>
            <button
              onClick={handleLogout}
              title="Sign Out"
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Content */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">
        <header className="sticky top-0 z-30 bg-white border-b border-slate-200 h-16 px-4 sm:px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100"
            >
              <Menu className="w-5 h-5" />
            </button>
            <span className="text-xs font-bold uppercase tracking-wider text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-md">
              Privileged Administrator Environment
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/dashboard"
              className="text-xs font-medium text-brand-700 hover:text-brand-900 transition flex items-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Switch to Workspace
            </Link>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
