import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { CreditProvider } from './contexts/CreditContext';

// Placeholder components for routes
const Dashboard = () => <div>Dashboard Page</div>;
const Login = () => <div>Login Page</div>;
const Signup = () => <div>Signup Page</div>;
const Decks = () => <div>Decks Page</div>;
const Admin = () => <div>Admin Dashboard</div>;

const App: React.FC = () => {
  return (
    <AuthProvider>
      <CreditProvider>
        <div className="App">
          <header className="bg-indigo-600 text-white p-4 mb-4">
            <h1 className="text-2xl font-bold">Flashcard App</h1>
          </header>
          <main className="container mx-auto px-4">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/decks/*" element={<Decks />} />
              <Route path="/admin/*" element={<Admin />} />
            </Routes>
          </main>
        </div>
      </CreditProvider>
    </AuthProvider>
  );
};

export default App;