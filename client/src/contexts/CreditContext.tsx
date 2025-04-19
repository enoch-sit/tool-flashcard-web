import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';

// Types
interface CreditPackage {
  _id: string;
  name: string;
  description: string;
  credits: number;
  price: number;
  isActive: boolean;
}

interface Transaction {
  _id: string;
  userId: string;
  amount: number;
  description: string;
  transactionType: string;
  createdAt: string;
}

interface TransactionHistory {
  transactions: Transaction[];
  pagination: {
    total: number;
    page: number;
    pages: number;
  };
}

interface CreditContextType {
  balance: number;
  packages: CreditPackage[];
  transactions: Transaction[];
  refreshBalance: () => Promise<number>;
  getPackages: () => Promise<CreditPackage[]>;
  purchaseCredits: (packageId: string) => Promise<boolean>;
  getTransactionHistory: (page?: number) => Promise<TransactionHistory | null>;
  loading: boolean;
}

// Create context
const CreditContext = createContext<CreditContextType | undefined>(undefined);

// Custom hook for using credit context
export const useCredit = () => {
  const context = useContext(CreditContext);
  if (!context) {
    throw new Error('useCredit must be used within a CreditProvider');
  }
  return context;
};

// Provider component
export const CreditProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [balance, setBalance] = useState<number>(0);
  const [packages, setPackages] = useState<CreditPackage[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  // Fetch credit balance when user is authenticated
  useEffect(() => {
    if (isAuthenticated) {
      refreshBalance();
      getPackages();
    }
  }, [isAuthenticated]);

  // Refresh user credit balance
  const refreshBalance = async (): Promise<number> => {
    setLoading(true);
    try {
      const response = await axios.get('/api/credits/balance');
      setBalance(response.data.balance);
      setLoading(false);
      return response.data.balance;
    } catch (error) {
      console.error('Error fetching credit balance:', error);
      setLoading(false);
      return balance;
    }
  };

  // Get available credit packages
  const getPackages = async (): Promise<CreditPackage[]> => {
    setLoading(true);
    try {
      const response = await axios.get('/api/credits/packages');
      setPackages(response.data.packages);
      setLoading(false);
      return response.data.packages;
    } catch (error) {
      console.error('Error fetching credit packages:', error);
      setLoading(false);
      return packages;
    }
  };

  // Purchase credits
  const purchaseCredits = async (packageId: string): Promise<boolean> => {
    setLoading(true);
    try {
      const response = await axios.post('/api/credits/purchase', { packageId });
      setBalance(response.data.newBalance);
      setLoading(false);
      return true;
    } catch (error) {
      console.error('Error purchasing credits:', error);
      setLoading(false);
      return false;
    }
  };

  // Get transaction history
  const getTransactionHistory = async (page = 1): Promise<TransactionHistory | null> => {
    setLoading(true);
    try {
      const response = await axios.get(`/api/credits/transactions?page=${page}`);
      setTransactions(response.data.transactions);
      setLoading(false);
      return response.data;
    } catch (error) {
      console.error('Error fetching transaction history:', error);
      setLoading(false);
      return null;
    }
  };

  // Value object with all the context data and functions
  const value = {
    balance,
    packages,
    transactions,
    refreshBalance,
    getPackages,
    purchaseCredits,
    getTransactionHistory,
    loading
  };

  return (
    <CreditContext.Provider value={value}>
      {children}
    </CreditContext.Provider>
  );
};

export default CreditContext;