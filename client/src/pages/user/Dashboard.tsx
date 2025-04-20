import React, { useState, useEffect } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useCredit } from '../../contexts/CreditContext';

const Dashboard: React.FC = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const { balance, refreshBalance } = useCredit();
  const [deckStats, setDeckStats] = useState({
    total: 0,
    cardsToReview: 0
  });
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    if (isAuthenticated) {
      const fetchData = async () => {
        try {
          await refreshBalance();
          // In a real implementation, we would fetch deck stats here
          // For now, we'll just simulate it
          setTimeout(() => {
            setDeckStats({
              total: 5,
              cardsToReview: 12
            });
            setLoading(false);
          }, 500);
        } catch (error) {
          console.error('Error fetching dashboard data:', error);
          setLoading(false);
        }
      };
      
      fetchData();
    }
  }, [isAuthenticated, refreshBalance]);
  
  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
  
  return (
    <div className="container mx-auto p-4">
      <div className="flex flex-col md:flex-row justify-between mb-6">
        <h1 className="text-2xl font-bold">Welcome, {user?.username}!</h1>
        <button 
          onClick={logout} 
          className="mt-2 md:mt-0 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
        >
          Logout
        </button>
      </div>
      
      <div className="flex flex-col md:flex-row gap-6">
        {/* Main content section */}
        <div className="w-full md:w-8/12">
          {/* Study stats card */}
          <div className="bg-white rounded-lg shadow p-4 mb-6">
            <h2 className="text-xl font-semibold mb-2">Your Study Stats</h2>
            {loading ? (
              <p>Loading stats...</p>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <div className="border rounded p-3">
                  <h3 className="text-sm text-gray-600">Total Decks</h3>
                  <p className="text-2xl font-bold">{deckStats.total}</p>
                </div>
                <div className="border rounded p-3">
                  <h3 className="text-sm text-gray-600">Cards to Review</h3>
                  <p className="text-2xl font-bold">{deckStats.cardsToReview}</p>
                </div>
              </div>
            )}
            
            <div className="mt-4">
              <Link 
                to="/study"
                className="inline-block bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
              >
                Start Studying
              </Link>
            </div>
          </div>
          
          {/* Decks card */}
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Your Decks</h2>
              <Link 
                to="/decks/new"
                className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
              >
                New Deck
              </Link>
            </div>
            
            {loading ? (
              <p>Loading your decks...</p>
            ) : (
              <div>
                {deckStats.total > 0 ? (
                  <p>Your decks will be listed here.</p>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-600 mb-4">You don't have any decks yet.</p>
                    <Link 
                      to="/decks/new"
                      className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
                    >
                      Create Your First Deck
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        
        {/* Sidebar */}
        <div className="w-full md:w-4/12 bg-white rounded-lg shadow p-4">
          {/* Credit balance */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-2">Your Credits</h2>
            <div className="bg-gray-100 p-4 rounded">
              <p className="text-3xl font-bold">{balance}</p>
              <p className="text-sm text-gray-600">Available Credits</p>
            </div>
            
            <div className="mt-4">
              <Link 
                to="/credits/buy"
                className="w-full block text-center bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                Get More Credits
              </Link>
            </div>
          </div>
          
          {/* Quick tips */}
          <div>
            <h3 className="text-lg font-medium mb-2">Quick Tips</h3>
            <ul className="list-disc pl-5 text-gray-700">
              <li>Creating a new card costs 1 credit</li>
              <li>Review your cards daily for best results</li>
              <li>Create focused decks for each subject</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;