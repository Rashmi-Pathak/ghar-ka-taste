import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import LandingPage from './pages/LandingPage';
import AuthPage from './pages/AuthPage';
import CustomerPage from './pages/CustomerPage';
import ChefDashboard from './pages/ChefDashboard';
import ChefProfilePage from './pages/ChefProfilePage';

import AdminDashboard from './pages/AdminDashboard';

function ProtectedRoute({ children, requiredRole }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0a0a' }}>
      <div style={{ width: 40, height: 40, borderRadius: '50%', border: '2px solid rgba(160,82,45,0.2)', borderTopColor: '#A0522D', animation: 'spin 1s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  );
  if (!user) return <Navigate to="/auth?tab=login" replace />;
  if (requiredRole && user.role !== requiredRole) {
    if (user.role === 'admin') return <Navigate to="/admin-dashboard" replace />;
    return <Navigate to={user.role === 'chef' ? '/dashboard' : '/explore'} replace />;
  }
  return children;
}

function AppRoutes() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/explore" element={
          <ProtectedRoute requiredRole="customer">
            <CustomerPage />
          </ProtectedRoute>
        } />
        <Route path="/chef/:id" element={<ChefProfilePage />} />
        <Route path="/dashboard" element={
          <ProtectedRoute requiredRole="chef">
            <ChefDashboard />
          </ProtectedRoute>
        } />
        <Route path="/admin-dashboard" element={
          <ProtectedRoute requiredRole="admin">
            <AdminDashboard />
          </ProtectedRoute>
        } />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
