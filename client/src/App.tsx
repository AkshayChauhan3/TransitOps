import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { DashboardLayout } from './components/layout/DashboardLayout';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Vehicles from './pages/Vehicles';
import Drivers from './pages/Drivers';
import Trips from './pages/Trips';
import Maintenance from './pages/Maintenance';
import Expenses from './pages/Expenses';
import Reports from './pages/Reports';
import ProfilePage from './pages/ProfilePage';
import MyFleet from './pages/MyFleet';
import Preferences from './pages/Preferences';
import Branches from './pages/Branches';
import Users from './pages/Users';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              {/* Public Auth Route */}
              <Route path="/login" element={<Login />} />

              {/* Protected Workspace Layout Routes */}
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <DashboardLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<Dashboard />} />
                <Route path="vehicles" element={<Vehicles />} />
                <Route path="drivers" element={<Drivers />} />
                <Route path="trips" element={<Trips />} />
                <Route
                  path="branches"
                  element={
                    <ProtectedRoute allowedRoles={['SUPER_ADMIN']}>
                      <Branches />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="users"
                  element={
                    <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'BRANCH_ADMIN']}>
                      <Users />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="maintenance"
                  element={
                    <ProtectedRoute allowedRoles={['FLEET_MANAGER']}>
                      <Maintenance />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="expenses"
                  element={
                    <ProtectedRoute allowedRoles={['FLEET_MANAGER', 'FINANCIAL_ANALYST']}>
                      <Expenses />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="reports"
                  element={
                    <ProtectedRoute allowedRoles={['FLEET_MANAGER', 'FINANCIAL_ANALYST']}>
                      <Reports />
                    </ProtectedRoute>
                  }
                />
                {/* Profile area */}
                <Route path="profile" element={<ProfilePage />} />
                <Route path="my-fleet" element={<MyFleet />} />
                <Route path="preferences" element={<Preferences />} />
              </Route>

              {/* Fallback Redirection */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </ToastProvider>
    </QueryClientProvider>
  );
};

export default App;
