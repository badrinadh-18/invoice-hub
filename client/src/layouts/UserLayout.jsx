import React, { useState } from 'react';
import { Outlet, NavLink, Link, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  FileText,
  Users,
  Building2,
  PlusCircle,
  LogOut,
  Menu,
  X,
  Shield,
  Receipt,
  User as UserIcon,
  ChevronDown
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function UserLayout() {
  const { user, logout, isAdmin } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', to: '/dashboard', icon: LayoutDashboard },
    { name: 'Invoices', to: '/invoices', icon: FileText },
    { name: 'Customers', to: '/customers', icon: Users },
    { name: 'Business Profile', to: '/business-profile', icon: Building2 },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      {/* Mobile Drawer Backdrop */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar Navigation */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200/80 flex flex-col transform transition-transform duration-200 ease-in-out md:translate-x-0 md:static md:h-screen ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-0 -translate-x-full md:translate-x-0'
        }`}
      >
        {/* Brand */}
        <div className="h-16 px-6 flex items-center justify-between border-b border-slate-100">
          <Link to="/dashboard" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-brand-700 flex items-center justify-center text-white shadow-sm shadow-brand-700/20">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-base text-slate-900 tracking-tight">
                Invoice<span className="text-brand-700">Hub</span>
              </span>
              <span className="block text-[10px] text-slate-400 font-medium tracking-wide uppercase">
                WORKSPACE
              </span>
            </div>
          </Link>
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="md:hidden text-slate-400 hover:text-slate-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Action Button */}
        <div className="p-4 border-b border-slate-100">
          <Link
            to="/invoices/new"
            onClick={() => setMobileMenuOpen(false)}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium bg-brand-700 text-white hover:bg-brand-800 shadow-sm transition active:scale-[0.98]"
          >
            <PlusCircle className="w-4 h-4" />
            Create Invoice
          </Link>
        </div>

        {/* Nav Links */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/dashboard'}
              onClick={() => setMobileMenuOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition ${
                  isActive
                    ? 'bg-brand-50 text-brand-800 font-semibold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`
              }
            >
              <item.icon className="w-4 h-4" />
              {item.name}
            </NavLink>
          ))}

          {/* Admin link if user is administrator */}
          {isAdmin && (
            <div className="pt-4 mt-4 border-t border-slate-100">
              <span className="px-3.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                Administration
              </span>
              <NavLink
                to="/admin/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium text-amber-700 hover:bg-amber-50 transition"
              >
                <Shield className="w-4 h-4 text-amber-600" />
                Admin Console
              </NavLink>
            </div>
          )}
        </nav>

        {/* User Card & Logout in Sidebar Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-800 flex items-center justify-center font-bold text-xs shrink-0">
                {user?.name?.[0]?.toUpperCase() || 'U'}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-800 truncate">{user?.name}</p>
                <p className="text-xs text-slate-400 truncate">{user?.email}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              title="Sign Out"
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">
        {/* Top Navbar */}
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200/80 h-16 px-4 sm:px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition"
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <Link to="/dashboard" className="md:hidden flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-brand-700 flex items-center justify-center text-white">
                <Receipt className="w-4 h-4" />
              </div>
              <span className="font-bold text-sm text-slate-900 tracking-tight">
                Invoice<span className="text-brand-700">Hub</span>
              </span>
            </Link>
            <h1 className="text-base font-semibold text-slate-800 hidden md:block">
              InvoiceHub Workspace
            </h1>
          </div>

          {/* User actions on top right */}
          <div className="flex items-center gap-3">
            {isAdmin && (
              <Link
                to="/admin/dashboard"
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 transition"
              >
                <Shield className="w-3.5 h-3.5 text-amber-600" />
                Admin Mode
              </Link>
            )}

            <div className="relative">
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-100 transition"
              >
                <div className="w-7 h-7 rounded-full bg-brand-700 text-white flex items-center justify-center font-bold text-xs">
                  {user?.name?.[0]?.toUpperCase() || 'U'}
                </div>
                <span className="text-sm font-medium text-slate-700 hidden sm:inline">
                  {user?.name}
                </span>
                <ChevronDown className="w-4 h-4 text-slate-400" />
              </button>

              {userDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setUserDropdownOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-lg border border-slate-100 py-1 z-50">
                    <div className="px-4 py-2 border-b border-slate-100">
                      <p className="text-xs text-slate-400">Signed in as</p>
                      <p className="text-sm font-semibold text-slate-800 truncate">{user?.email}</p>
                      <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-brand-50 text-brand-700">
                        {user?.role}
                      </span>
                    </div>

                    <Link
                      to="/business-profile"
                      onClick={() => setUserDropdownOpen(false)}
                      className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition"
                    >
                      Business Profile
                    </Link>

                    {isAdmin && (
                      <Link
                        to="/admin/dashboard"
                        onClick={() => setUserDropdownOpen(false)}
                        className="block px-4 py-2 text-sm text-amber-700 hover:bg-amber-50 font-medium transition"
                      >
                        Admin Console
                      </Link>
                    )}

                    <button
                      onClick={() => {
                        setUserDropdownOpen(false);
                        handleLogout();
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-rose-600 hover:bg-rose-50 border-t border-slate-100 transition"
                    >
                      Sign Out
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Page Content Body */}
        <main className="flex-1 p-3.5 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto pb-24 md:pb-8">
          <Outlet />
        </main>

        {/* Mobile Bottom Navigation Bar */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/90 shadow-lg px-2 py-1.5 flex items-center justify-around">
          <NavLink
            to="/dashboard"
            end
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 py-1 px-3 rounded-lg text-[10px] font-medium transition ${
                isActive ? 'text-brand-700 font-bold' : 'text-slate-500 hover:text-slate-900'
              }`
            }
          >
            <LayoutDashboard className="w-5 h-5" />
            <span>Dashboard</span>
          </NavLink>

          <NavLink
            to="/invoices"
            end
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 py-1 px-3 rounded-lg text-[10px] font-medium transition ${
                isActive ? 'text-brand-700 font-bold' : 'text-slate-500 hover:text-slate-900'
              }`
            }
          >
            <FileText className="w-5 h-5" />
            <span>Invoices</span>
          </NavLink>

          {/* Quick Create Button in Center */}
          <Link
            to="/invoices/new"
            aria-label="Create Invoice"
            className="flex items-center justify-center w-11 h-11 -mt-4 rounded-full bg-brand-700 text-white shadow-md shadow-brand-700/30 hover:bg-brand-800 active:scale-95 transition"
          >
            <PlusCircle className="w-6 h-6" />
          </Link>

          <NavLink
            to="/customers"
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 py-1 px-3 rounded-lg text-[10px] font-medium transition ${
                isActive ? 'text-brand-700 font-bold' : 'text-slate-500 hover:text-slate-900'
              }`
            }
          >
            <Users className="w-5 h-5" />
            <span>Customers</span>
          </NavLink>

          <NavLink
            to="/business-profile"
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 py-1 px-3 rounded-lg text-[10px] font-medium transition ${
                isActive ? 'text-brand-700 font-bold' : 'text-slate-500 hover:text-slate-900'
              }`
            }
          >
            <Building2 className="w-5 h-5" />
            <span>Profile</span>
          </NavLink>
        </nav>
      </div>
    </div>
  );
}
