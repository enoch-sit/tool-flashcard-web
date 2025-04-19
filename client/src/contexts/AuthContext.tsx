import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';

// Types
interface User {
  id: string;
  username: string;
  email: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  loading: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  checkAuthStatus: () => Promise<boolean>;
}

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Custom hook for using auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Provider component
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Check if token exists in localStorage on mount
  useEffect(() => {
    const storedToken = localStorage.getItem('flashcard_token');
    if (storedToken) {
      setToken(storedToken);
      checkAuthStatus();
    } else {
      setLoading(false);
    }
  }, []);
  
  // Set up axios interceptor to include the token in all requests
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [token]);
  
  // Check if the token is valid and get user data
  const checkAuthStatus = async (): Promise<boolean> => {
    setLoading(true);
    
    if (!token) {
      setLoading(false);
      return false;
    }
    
    try {
      // Call the auth API to validate token and get user data
      const response = await axios.get('/api/auth/profile');
      setUser(response.data.user);
      setLoading(false);
      return true;
    } catch (error) {
      console.error('Authentication check failed:', error);
      // If the token is invalid, clear it
      localStorage.removeItem('flashcard_token');
      setToken(null);
      setUser(null);
      setLoading(false);
      return false;
    }
  };
  
  // Login function
  const login = async (username: string, password: string): Promise<boolean> => {
    setLoading(true);
    
    try {
      const response = await axios.post('/api/auth/login', {
        username,
        password
      });
      
      const { token: newToken, user: userData } = response.data;
      
      // Save token to localStorage and state
      localStorage.setItem('flashcard_token', newToken);
      setToken(newToken);
      setUser(userData);
      
      setLoading(false);
      return true;
    } catch (error) {
      console.error('Login failed:', error);
      setLoading(false);
      return false;
    }
  };
  
  // Logout function
  const logout = async () => {
    try {
      // Call the logout API
      await axios.post('/api/auth/logout');
    } catch (error) {
      console.error('Logout API call failed:', error);
    } finally {
      // Clear local storage and state
      localStorage.removeItem('flashcard_token');
      setToken(null);
      setUser(null);
    }
  };
  
  // Value object with all the context data and functions
  const value = {
    user,
    token,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    loading,
    login,
    logout,
    checkAuthStatus
  };
  
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;