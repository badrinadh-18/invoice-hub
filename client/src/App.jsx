import React, { useEffect, useRef, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Toaster, toast } from 'react-hot-toast';
import { App as CapApp } from '@capacitor/app';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute, AdminRoute, PublicOnlyRoute } from './routes/RouteGuards';

// Eager Layouts
import PublicLayout from './layouts/PublicLayout';
import UserLayout from './layouts/UserLayout';
import AdminLayout from './layouts/AdminLayout';

// Eager Critical Auth Pages for instant first paint
import LandingPage from './pages/auth/LandingPage';
import Login from './pages/auth/Login';

// Lazy load secondary/heavy pages for instantaneous app launch
const Register = lazy(() => import('./pages/auth/Register'));
const ForgotPassword = lazy(() => import('./pages/auth/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/auth/ResetPassword'));

// User Pages
const Dashboard = lazy(() => import('./pages/user/Dashboard'));
const BusinessProfile = lazy(() => import('./pages/user/BusinessProfile'));
const CustomerList = lazy(() => import('./pages/user/CustomerList'));
const InvoiceList = lazy(() => import('./pages/user/InvoiceList'));
const InvoiceEditor = lazy(() => import('./pages/user/InvoiceEditor'));
const InvoiceDetails = lazy(() => import('./pages/user/InvoiceDetails'));

// Admin Pages
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const AdminUsers = lazy(() => import('./pages/admin/AdminUsers'));
const AdminAuditLogs = lazy(() => import('./pages/admin/AdminAuditLogs'));

// Fast lightweight page fallback
function PageFallback() {
  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="w-7 h-7 border-2 border-brand-700 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

/**
 * Handles Android Hardware & Gesture Back Button:
 * - On inner pages: goes back to previously opened page without closing app.
 * - On root/dashboard/login: requires double-tap to exit with a friendly prompt.
 */
function MobileBackButtonHandler() {
  const navigate = useNavigate();
  const location = useLocation();
  const lastPressRef = useRef(0);

  useEffect(() => {
    let listenerPromise;

    try {
      listenerPromise = CapApp.addListener('backButton', () => {
        const path = location.pathname;
        const isRootPage = path === '/' || path === '/dashboard' || path === '/login' || path === '/admin/dashboard';

        if (isRootPage) {
          const now = Date.now();
          if (now - lastPressRef.current < 2000) {
            CapApp.exitApp();
          } else {
            lastPressRef.current = now;
            toast('Tap back again to exit', {
              id: 'back-exit-toast',
              duration: 2000,
              icon: '👋',
              style: {
                background: '#0F172A',
                color: '#fff',
                fontSize: '12px',
                borderRadius: '9999px',
                padding: '8px 16px',
              }
            });
          }
        } else {
          navigate(-1);
        }
      });
    } catch {
      // Not on native device, fallback silently
    }

    return () => {
      if (listenerPromise && typeof listenerPromise.then === 'function') {
        listenerPromise.then((handle) => handle?.remove?.()).catch(() => {});
      }
    };
  }, [location, navigate]);

  return null;
}

export default function App() {
  // Pre-warm the backend API as soon as the app opens in the background
  useEffect(() => {
    const apiUrl = import.meta.env.VITE_API_URL || 'https://invoice-hub-t9jv.onrender.com/api/v1';
    fetch(`${apiUrl}/health`).catch(() => {});
  }, []);

  return (
    <BrowserRouter>
      <MobileBackButtonHandler />
      <AuthProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3500,
            style: {
              background: '#0F172A',
              color: '#fff',
              fontSize: '13px',
              borderRadius: '8px',
              padding: '10px 16px',
            },
            success: {
              iconTheme: {
                primary: '#10B981',
                secondary: '#FFFFFF',
              },
            },
            error: {
              iconTheme: {
                primary: '#EF4444',
                secondary: '#FFFFFF',
              },
            },
          }}
        />

        <Suspense fallback={<PageFallback />}>
          <Routes>
            {/* Public Routes */}
            <Route element={<PublicLayout />}>
              <Route path="/" element={<LandingPage />} />
              <Route
                path="/login"
                element={
                  <PublicOnlyRoute>
                    <Login />
                  </PublicOnlyRoute>
                }
              />
              <Route
                path="/register"
                element={
                  <PublicOnlyRoute>
                    <Register />
                  </PublicOnlyRoute>
                }
              />
              <Route path="/reset-password/:token" element={<ResetPassword />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
            </Route>

            {/* User Workspace Routes */}
            <Route
              element={
                <ProtectedRoute>
                  <UserLayout />
                </ProtectedRoute>
              }
            >
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/business-profile" element={<BusinessProfile />} />
              <Route path="/customers" element={<CustomerList />} />
              <Route path="/invoices" element={<InvoiceList />} />
              <Route path="/invoices/new" element={<InvoiceEditor />} />
              <Route path="/invoices/:id" element={<InvoiceDetails />} />
              <Route path="/invoices/:id/edit" element={<InvoiceEditor />} />
            </Route>

            {/* Admin Portal Routes */}
            <Route
              path="/admin"
              element={
                <AdminRoute>
                  <AdminLayout />
                </AdminRoute>
              }
            >
              <Route index element={<Navigate to="/admin/dashboard" replace />} />
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route path="users" element={<AdminUsers />} />
              <Route path="audit-logs" element={<AdminAuditLogs />} />
            </Route>

            {/* 404 Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </AuthProvider>
    </BrowserRouter>
  );
}
