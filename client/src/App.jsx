import React, { useEffect, useRef } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Toaster, toast } from 'react-hot-toast';
import { App as CapApp } from '@capacitor/app';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute, AdminRoute, PublicOnlyRoute } from './routes/RouteGuards';

// Layouts
import PublicLayout from './layouts/PublicLayout';
import UserLayout from './layouts/UserLayout';
import AdminLayout from './layouts/AdminLayout';

// Public Pages
import LandingPage from './pages/auth/LandingPage';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';

// User Pages
import Dashboard from './pages/user/Dashboard';
import BusinessProfile from './pages/user/BusinessProfile';
import CustomerList from './pages/user/CustomerList';
import InvoiceList from './pages/user/InvoiceList';
import InvoiceEditor from './pages/user/InvoiceEditor';
import InvoiceDetails from './pages/user/InvoiceDetails';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsers from './pages/admin/AdminUsers';
import AdminAuditLogs from './pages/admin/AdminAuditLogs';

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
          // Navigate to previous page!
          navigate(-1);
        }
      });
    } catch {
      // Ignored if running in standard desktop web browser
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

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
