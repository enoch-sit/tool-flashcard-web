import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { CreditProvider } from './contexts/CreditContext';

// Import our components
import Login from './pages/Login';
import Signup from './pages/Signup';
import UserDashboard from './pages/user/Dashboard';
import Admin from './pages/admin';

// Protected route component to handle route protection
const ProtectedRoute: React.FC<{ element: React.ReactNode }> = ({ element }) => {
  const isAuthenticated = localStorage.getItem('flashcard_token') !== null;
  return isAuthenticated ? <>{element}</> : <Navigate to="/login" />;
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <CreditProvider>
        <div className="App">
          <header className="bg-indigo-600 text-white p-4 mb-4">
            <h1 className="text-2xl font-bold">Flashcard App</h1>
          </header>
          <main className="container mx-auto px-4 pb-8">
            <Routes>
              {/* Public routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              
              {/* Protected routes */}
              <Route path="/" element={<ProtectedRoute element={<UserDashboard />} />} />
              <Route path="/admin/*" element={<ProtectedRoute element={<Admin />} />} />
              
              {/* Catch-all redirect to home */}
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </main>
        </div>
      </CreditProvider>
    </AuthProvider>
  );
};

export default App;