import React from 'react';
import { Toaster } from 'react-hot-toast';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import AdminDashboard from './pages/AdminDashboard';
import Landing from './pages/Landing';

const ProtectedRoute = ({ children }) => {
  const { user, token } = useAuth();
  
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  
  if (!user) {
    // Still loading user data
    return <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Authenticating...</div>;
  }

  return children;
};

const AdminRoute = ({ children }) => {
  const { user } = useAuth();
  
  if (user && !user.is_admin) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return <ProtectedRoute>{children}</ProtectedRoute>;
};

function App() {
  return (
    <AuthProvider>
      <Toaster position="top-right" toastOptions={{ style: { background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border)', borderRadius: '10px', fontSize: '0.9rem' } }} />
      <Router>
        <Routes>
          {/* Landing Page as the entry point */}
          <Route path="/" element={<Landing />} />
          
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } 
          />
          
          <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
