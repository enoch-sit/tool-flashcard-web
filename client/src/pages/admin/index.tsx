import React from 'react';
import { Routes, Route, Link, Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import CreditPackageManager from '../../components/admin/CreditPackageManager';

// Admin dashboard components we'll create as placeholders for now
// They can be expanded later with actual functionality
const AdminDashboard: React.FC = () => {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Admin Dashboard</h1>
      <p className="mb-4">Welcome to the admin dashboard. View system statistics below.</p>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded shadow">
          <h3 className="font-bold text-lg mb-2">Total Users</h3>
          <p className="text-2xl">Loading...</p>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <h3 className="font-bold text-lg mb-2">Total Credits Issued</h3>
          <p className="text-2xl">Loading...</p>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <h3 className="font-bold text-lg mb-2">Active Packages</h3>
          <p className="text-2xl">Loading...</p>
        </div>
      </div>
      
      <div className="bg-white p-4 rounded shadow">
        <h2 className="text-xl font-bold mb-4">Recent Activity</h2>
        <p>Loading recent user activities...</p>
      </div>
    </div>
  );
};

const UserManagement: React.FC = () => {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">User Management</h1>
      <p>Here you can manage users and adjust their credits.</p>
      
      <div className="bg-white p-4 rounded shadow mt-4">
        <p>User management features will be implemented here.</p>
      </div>
    </div>
  );
};

const CreditTransactions: React.FC = () => {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Credit Transactions</h1>
      <p>View all credit transactions across the system.</p>
      
      <div className="bg-white p-4 rounded shadow mt-4">
        <p>Transaction history will be displayed here.</p>
      </div>
    </div>
  );
};

// Main Admin component that contains the layout and routing for admin pages
const Admin: React.FC = () => {
  const { isAuthenticated, isAdmin, logout } = useAuth();
  
  // Redirect to login if not authenticated or not an admin
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
  
  if (!isAdmin) {
    return <Navigate to="/" />;
  }
  
  return (
    <div className="flex flex-col md:flex-row min-h-[80vh]">
      {/* Sidebar */}
      <div className="bg-gray-800 text-white w-full md:w-64 p-4">
        <h2 className="text-xl font-bold mb-6">Admin Panel</h2>
        <nav>
          <ul>
            <li className="mb-2">
              <Link 
                to="/admin" 
                className="block p-2 rounded hover:bg-gray-700"
              >
                Dashboard
              </Link>
            </li>
            <li className="mb-2">
              <Link 
                to="/admin/users" 
                className="block p-2 rounded hover:bg-gray-700"
              >
                User Management
              </Link>
            </li>
            <li className="mb-2">
              <Link 
                to="/admin/packages" 
                className="block p-2 rounded hover:bg-gray-700"
              >
                Credit Packages
              </Link>
            </li>
            <li className="mb-2">
              <Link 
                to="/admin/transactions" 
                className="block p-2 rounded hover:bg-gray-700"
              >
                Transactions
              </Link>
            </li>
            <li className="mb-2">
              <button 
                onClick={logout}
                className="block w-full text-left p-2 rounded hover:bg-gray-700"
              >
                Logout
              </button>
            </li>
          </ul>
        </nav>
      </div>
      
      {/* Main content */}
      <div className="flex-1 bg-gray-100">
        <Routes>
          <Route path="/" element={<AdminDashboard />} />
          <Route path="/users" element={<UserManagement />} />
          <Route path="/packages" element={<CreditPackageManager />} />
          <Route path="/transactions" element={<CreditTransactions />} />
        </Routes>
      </div>
    </div>
  );
};

export default Admin;