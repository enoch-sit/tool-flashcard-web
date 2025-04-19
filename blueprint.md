# Blueprint and Documentation for Flash Card Remembering Application

## Overview

This document outlines the architecture and implementation details for a credit-based flash card application that integrates with the existing Simple Authentication and Accounting System. The application will feature:

1. User frontend for creating and studying flash cards
2. Admin dashboard for account and credit management
3. Docker setup for easy deployment
4. Integration with the existing authentication API

## System Architecture

### Components

1. **Frontend**:
   - User interface for flash card creation and studying
   - Admin dashboard for user and credit management
   - Built with React, TypeScript, and Tailwind CSS

2. **Backend**:
   - RESTful API for flash card CRUD operations
   - Credit management system
   - Integration with existing authentication system
   - Built with Express.js and TypeScript

3. **Database**:
   - MongoDB for storing flash cards, decks, and credit transactions
   - Leverages existing user data from the authentication system

4. **Infrastructure**:
   - Docker containers for each component
   - Docker Compose for orchestration

### Database Schema

#### Collections

1. **Decks**:

   ```typescript
   {
     _id: ObjectId,
     userId: ObjectId,
     name: string,
     description: string,
     isPublic: boolean,
     tags: string[],
     createdAt: Date,
     updatedAt: Date
   }
   ```

2. **Cards**:

   ```typescript
   {
     _id: ObjectId,
     deckId: ObjectId,
     front: string,
     back: string,
     difficulty: number, // 1-5 rating
     nextReviewDate: Date,
     reviewHistory: [
       {
         date: Date,
         performance: number // 1-5 rating
       }
     ],
     createdAt: Date,
     updatedAt: Date
   }
   ```

3. **CreditTransactions**:

   ```typescript
   {
     _id: ObjectId,
     userId: ObjectId,
     amount: number, // Positive for additions, negative for usage
     description: string,
     transactionType: string, // "PURCHASE", "ADMIN_GRANT", "CARD_CREATION", etc.
     createdAt: Date
   }
   ```

4. **UserCredits**:

   ```typescript
   {
     _id: ObjectId,
     userId: ObjectId,
     balance: number,
     lastUpdated: Date
   }
   ```

5. **CreditPackages**:

   ```typescript
   {
     _id: ObjectId,
     name: string,
     description: string,
     credits: number,
     price: number, // in cents
     isActive: boolean,
     createdAt: Date,
     updatedAt: Date
   }
   ```

## Implementation Plan

### 1. Project Setup

#### Directory Structure

```
flashcard-app/
├── client/                # Frontend React application
│   ├── public/
│   └── src/
│       ├── components/
│       ├── pages/
│       │   ├── user/      # User interface
│       │   └── admin/     # Admin dashboard
│       ├── services/      # API client services
│       └── contexts/      # React contexts for state management
├── server/                # Backend Express application
│   ├── src/
│   │   ├── controllers/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── middleware/
│   │   └── utils/
│   └── tests/
├── docker/
│   ├── client/
│   ├── server/
│   └── nginx/
└── docker-compose.yml
```

### 2. Backend Implementation

#### API Endpoints

**Deck Management**:

- `GET /api/decks` - Get all decks for the authenticated user
- `POST /api/decks` - Create a new deck
- `GET /api/decks/:id` - Get a specific deck
- `PUT /api/decks/:id` - Update a deck
- `DELETE /api/decks/:id` - Delete a deck

**Card Management**:

- `GET /api/decks/:deckId/cards` - Get all cards in a deck
- `POST /api/decks/:deckId/cards` - Create a new card (costs credits)
- `GET /api/cards/:id` - Get a specific card
- `PUT /api/cards/:id` - Update a card
- `DELETE /api/cards/:id` - Delete a card

**Study Sessions**:

- `POST /api/decks/:deckId/study` - Start a study session
- `POST /api/cards/:id/review` - Record a review result for a card

**Credit Management**:

- `GET /api/credits` - Get current user's credit balance
- `GET /api/credits/history` - Get credit transaction history
- `POST /api/credits/purchase` - Purchase credits (mock payment)

**Admin Endpoints**:

- `GET /api/admin/users` - Get all users with credit information
- `POST /api/admin/users/:userId/credits` - Adjust credits for a user
- `GET /api/admin/credits/transactions` - View all credit transactions
- `GET /api/admin/packages` - Get all credit packages
- `POST /api/admin/packages` - Create a credit package
- `PUT /api/admin/packages/:id` - Update a credit package
- `DELETE /api/admin/packages/:id` - Delete a credit package

### 3. Frontend Implementation

#### User Interface

**Main Pages**:

- Dashboard - Overview of decks and study progress
- Deck Management - Create, view, and edit decks
- Card Creation - Add cards to decks (costs credits)
- Study Session - Interactive flash card review
- Credit Store - Purchase additional credits
- Profile - User profile and settings

**Key Features**:

- Spaced repetition algorithm for study sessions
- Progress tracking and statistics
- Credit balance display and transaction history
- Responsive design for mobile and desktop

#### Admin Dashboard

**Main Pages**:

- User Management - View and manage user accounts
- Credit Management - Adjust user credit balances
- Transaction History - View all credit transactions
- Package Management - Create and manage credit packages
- System Statistics - Usage metrics and reports

**Key Features**:

- User search and filtering
- Batch credit operations
- Transaction reports and exports
- System usage analytics

### 4. Credit System Design

#### Credit Economy

1. **Credit Usage**:
   - Creating a new card: 1 credit
   - Creating a new deck: Free
   - Reviewing cards: Free
   - Studying public decks: Free

2. **Credit Acquisition**:
   - Initial signup bonus: 10 credits
   - Purchasing credit packages from store
   - Admin grants

3. **Credit Packages**:
   - Small: 50 credits for $4.99
   - Medium: 125 credits for $9.99
   - Large: 300 credits for $19.99

#### Implementation Details

1. **Credit Checking Middleware**:
   - Validates sufficient credits before card creation
   - Automatically deducts credits after successful operations

2. **Transaction Recording**:
   - Records all credit-related transactions
   - Provides detailed history for both users and admins

3. **Balance Updates**:
   - Maintains a separate collection for current balances for quick access
   - Updates transaction records for audit trail

### 5. Integration with Authentication System

#### Authentication Flow

1. Leverage existing JWT-based authentication from the Auth API
2. Use access tokens for API requests
3. Implement refresh token mechanism
4. Handle role-based access control for admin features

#### User Management

1. Use existing user data from the Auth API
2. Extend user profiles with flash card application preferences
3. Admin dashboard accesses user data through Auth API endpoints

### 6. Docker Setup

#### Docker Compose Configuration

```yaml
version: '3.8'

services:
  # Frontend application
  client:
    build:
      context: ./client
      dockerfile: ../docker/client/Dockerfile
    ports:
      - "80:80"
    depends_on:
      - server
    networks:
      - flashcard-network

  # Backend API
  server:
    build:
      context: ./server
      dockerfile: ../docker/server/Dockerfile
    ports:
      - "4000:4000"
    environment:
      - NODE_ENV=production
      - MONGO_URI=mongodb://mongo:27017/flashcard_db
      - AUTH_API_URL=http://auth-service:3000
    depends_on:
      - mongo
      - auth-service
    networks:
      - flashcard-network
      - auth-network

  # Auth service (existing)
  auth-service:
    image: auth-service:latest
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - MONGO_URI=mongodb://mongo:27017/auth_db
    depends_on:
      - mongo
    networks:
      - auth-network

  # MongoDB
  mongo:
    image: mongo:latest
    ports:
      - "27017:27017"
    volumes:
      - mongo-data:/data/db
    networks:
      - flashcard-network
      - auth-network

networks:
  flashcard-network:
  auth-network:

volumes:
  mongo-data:
```

## Implementation Details

### Backend (Express.js + TypeScript)

#### Key Files

1. **Credit Service (`server/src/services/credit.service.ts`)**:

```typescript
import { UserCredits, CreditTransactions } from '../models';

class CreditService {
  async getUserBalance(userId: string): Promise<number> {
    const userCredit = await UserCredits.findOne({ userId });
    return userCredit ? userCredit.balance : 0;
  }

  async hasEnoughCredits(userId: string, amount: number): Promise<boolean> {
    const balance = await this.getUserBalance(userId);
    return balance >= amount;
  }

  async deductCredits(
    userId: string, 
    amount: number, 
    description: string, 
    transactionType: string
  ): Promise<boolean> {
    // Start a session for transaction
    const session = await UserCredits.startSession();
    session.startTransaction();

    try {
      // Update user balance
      const userCredit = await UserCredits.findOneAndUpdate(
        { userId },
        { $inc: { balance: -amount }, $set: { lastUpdated: new Date() } },
        { session, new: true, upsert: true }
      );

      // Record transaction
      await CreditTransactions.create([{
        userId,
        amount: -amount,
        description,
        transactionType,
        createdAt: new Date()
      }], { session });

      await session.commitTransaction();
      return true;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  async addCredits(
    userId: string, 
    amount: number, 
    description: string, 
    transactionType: string
  ): Promise<boolean> {
    // Similar to deductCredits but with positive amount
    const session = await UserCredits.startSession();
    session.startTransaction();

    try {
      const userCredit = await UserCredits.findOneAndUpdate(
        { userId },
        { $inc: { balance: amount }, $set: { lastUpdated: new Date() } },
        { session, new: true, upsert: true }
      );

      await CreditTransactions.create([{
        userId,
        amount: amount,
        description,
        transactionType,
        createdAt: new Date()
      }], { session });

      await session.commitTransaction();
      return true;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  async getTransactionHistory(userId: string, limit = 20, page = 1): Promise<any> {
    const skip = (page - 1) * limit;
    
    const transactions = await CreditTransactions.find({ userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
      
    const total = await CreditTransactions.countDocuments({ userId });
    
    return {
      transactions,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit)
      }
    };
  }
}

export default new CreditService();
```

2. **Card Controller (`server/src/controllers/card.controller.ts`)**:

```typescript
import { Request, Response } from 'express';
import Card from '../models/card.model';
import creditService from '../services/credit.service';
import { CARD_CREATION_COST } from '../config/constants';

const createCard = async (req: Request, res: Response) => {
  try {
    const { deckId, front, back } = req.body;
    const userId = req.user.id;

    // Check if user has enough credits
    const hasCredits = await creditService.hasEnoughCredits(userId, CARD_CREATION_COST);
    if (!hasCredits) {
      return res.status(402).json({ message: 'Insufficient credits to create a card' });
    }

    // Create the card
    const card = await Card.create({
      deckId,
      front,
      back,
      difficulty: 1,
      nextReviewDate: new Date(),
      reviewHistory: [],
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // Deduct credits
    await creditService.deductCredits(
      userId,
      CARD_CREATION_COST,
      `Created card in deck ${deckId}`,
      'CARD_CREATION'
    );

    return res.status(201).json({
      message: 'Card created successfully',
      card,
      creditDeducted: CARD_CREATION_COST
    });
  } catch (error) {
    console.error('Error creating card:', error);
    return res.status(500).json({ message: 'Failed to create card' });
  }
};

// Other card operations...

export { createCard };
```

3. **Admin Credit Controller (`server/src/controllers/admin-credit.controller.ts`)**:

```typescript
import { Request, Response } from 'express';
import creditService from '../services/credit.service';
import UserCredits from '../models/user-credits.model';
import CreditPackage from '../models/credit-package.model';

const adjustUserCredits = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { amount, reason } = req.body;
    const adminId = req.user.id;

    if (!amount || typeof amount !== 'number') {
      return res.status(400).json({ message: 'Valid credit amount required' });
    }

    // Add or deduct credits based on amount sign
    if (amount > 0) {
      await creditService.addCredits(
        userId,
        amount,
        reason || 'Admin credit adjustment',
        'ADMIN_GRANT'
      );
    } else if (amount < 0) {
      // Check if user has enough credits for deduction
      const balance = await creditService.getUserBalance(userId);
      if (balance < Math.abs(amount)) {
        return res.status(400).json({ 
          message: 'User does not have enough credits for this deduction',
          currentBalance: balance
        });
      }
      
      await creditService.deductCredits(
        userId,
        Math.abs(amount),
        reason || 'Admin credit adjustment',
        'ADMIN_DEDUCTION'
      );
    }

    const newBalance = await creditService.getUserBalance(userId);
    
    return res.status(200).json({
      message: 'User credits adjusted successfully',
      userId,
      adjustmentAmount: amount,
      newBalance
    });
  } catch (error) {
    console.error('Error adjusting user credits:', error);
    return res.status(500).json({ message: 'Failed to adjust user credits' });
  }
};

// Other admin credit operations...

export { adjustUserCredits };
```

### Frontend (React + TypeScript)

#### Key Components

1. **User Dashboard (`client/src/pages/user/Dashboard.tsx`)**:

```tsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DeckList from '../../components/DeckList';
import CreditBalance from '../../components/CreditBalance';
import StudyStats from '../../components/StudyStats';
import { useAuth } from '../../contexts/AuthContext';
import { getDeckStats, getUserCredits } from '../../services/api';

const Dashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [credits, setCredits] = useState(0);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsData, creditsData] = await Promise.all([
          getDeckStats(),
          getUserCredits()
        ]);
        
        setStats(statsData);
        setCredits(creditsData.balance);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return <div className="flex justify-center mt-8">Loading dashboard...</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex flex-col md:flex-row justify-between items-start gap-6">
        <div className="w-full md:w-8/12">
          <h1 className="text-2xl font-bold mb-4">Welcome back, {user?.username}!</h1>
          
          <div className="bg-white rounded-lg shadow p-4 mb-6">
            <h2 className="text-xl font-semibold mb-2">Your Study Stats</h2>
            <StudyStats stats={stats} />
            
            <div className="mt-4">
              <button 
                onClick={() => navigate('/study')}
                className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
              >
                Start Studying
              </button>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Your Decks</h2>
              <button 
                onClick={() => navigate('/decks/new')}
                className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
              >
                New Deck
              </button>
            </div>
            <DeckList />
          </div>
        </div>
        
        <div className="w-full md:w-4/12 bg-white rounded-lg shadow p-4">
          <CreditBalance balance={credits} />
          
          <div className="mt-4">
            <button 
              onClick={() => navigate('/credits/buy')}
              className="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Get More Credits
            </button>
          </div>
          
          <div className="mt-4">
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
```

2. **Admin Credit Management (`client/src/pages/admin/CreditManagement.tsx`)**:

```tsx
import React, { useState, useEffect } from 'react';
import { getUsersList, adjustUserCredits } from '../../services/api';

const CreditManagement: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [amount, setAmount] = useState<number>(0);
  const [reason, setReason] = useState<string>('');
  const [message, setMessage] = useState<{text: string, type: 'success' | 'error'} | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await getUsersList();
      setUsers(response.users);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdjustCredits = async () => {
    if (!selectedUser || amount === 0) {
      setMessage({
        text: 'Please select a user and enter a valid amount',
        type: 'error'
      });
      return;
    }

    try {
      const response = await adjustUserCredits(selectedUser, amount, reason);
      setMessage({
        text: `Credits adjusted successfully. New balance: ${response.newBalance}`,
        type: 'success'
      });
      
      // Refresh user list to show updated balances
      fetchUsers();
      
      // Reset form
      setAmount(0);
      setReason('');
    } catch (error: any) {
      setMessage({
        text: error.response?.data?.message || 'Failed to adjust credits',
        type: 'error'
      });
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Credit Management</h1>
      
      {message && (
        <div className={`p-4 mb-4 rounded ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {message.text}
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">User List</h2>
          
          {loading ? (
            <p>Loading users...</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white">
                <thead>
                  <tr>
                    <th className="py-2 px-4 border-b text-left">Username</th>
                    <th className="py-2 px-4 border-b text-left">Email</th>
                    <th className="py-2 px-4 border-b text-right">Credits</th>
                    <th className="py-2 px-4 border-b text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(user => (
                    <tr key={user._id} className={selectedUser === user._id ? 'bg-blue-50' : ''}>
                      <td className="py-2 px-4 border-b">{user.username}</td>
                      <td className="py-2 px-4 border-b">{user.email}</td>
                      <td className="py-2 px-4 border-b text-right">{user.credits}</td>
                      <td className="py-2 px-4 border-b text-center">
                        <button
                          onClick={() => setSelectedUser(user._id)}
                          className="bg-blue-500 text-white px-3 py-1 rounded text-sm"
                        >
                          Select
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Adjust Credits</h2>
          
          {selectedUser ? (
            <div>
              <div className="mb-4">
                <p>
                  <span className="font-medium">Selected User: </span>
                  {users.find(u => u._id === selectedUser)?.username} ({users.find(u => u._id === selectedUser)?.email})
                </p>
                <p>
                  <span className="font-medium">Current Balance: </span>
                  {users.find(u => u._id === selectedUser)?.credits} credits
                </p>
              </div>
              
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">Credit Adjustment</label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  className="w-full p-2 border rounded"
                  placeholder="Enter amount (positive to add, negative to deduct)"
                />
                <p className="text-gray-600 text-sm mt-1">
                  Use positive values to add credits, negative to deduct
                </p>
              </div>
              
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">Reason</label>
                <input
                  type="text"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full p-2 border rounded"
                  placeholder="Reason for adjustment"
                />
              </div>
              
              <div className="flex justify-between">
                <button
                  onClick={() => setSelectedUser(null)}
                  className="bg-gray-500 text-white px-4 py-2 rounded"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAdjustCredits}
                  className="bg-green-600 text-white px-4 py-2 rounded"
                >
                  Apply Adjustment
                </button>
              </div>
            </div>
          ) : (
            <p className="text-gray-600">Select a user from the list to adjust their credits</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreditManagement;
```

## Deployment Instructions

### Prerequisites

1. Docker and Docker Compose installed
2. Node.js and pnpm for local development
3. Existing Authentication Service Docker image

### Steps to Deploy

1. **Clone the repository**:

   ```bash
   git clone https://github.com/your-org/flashcard-app.git
   cd flashcard-app
   ```

2. **Build and start the application**:

   ```bash
   docker-compose up -d
   ```

3. **Initialize the database** (first run only):

   ```bash
   docker-compose exec server node dist/scripts/init-db.js
   ```

4. **Access the application**:
   - User Interface: <http://localhost>
   - Admin Dashboard: <http://localhost/admin>
   - Backend API: <http://localhost:4000>

### Local Development

1. **Install dependencies**:

   ```bash
   # Install server dependencies
   cd server
   pnpm install

   # Install client dependencies
   cd ../client
   pnpm install
   ```

2. **Start development servers**:

   ```bash
   # Start backend in development mode
   cd server
   pnpm dev

   # Start frontend in development mode
   cd ../client
   pnpm dev
   ```

## Additional Resources

### Testing

1. **Backend Tests**:

   ```bash
   cd server
   pnpm test
   ```

2. **Frontend Tests**:

   ```bash
   cd client
   pnpm test
   ```

3. **End-to-End Tests**:

   ```bash
   pnpm e2e
   ```

### Monitoring and Maintenance

1. **Logs**:

   ```bash
   # View server logs
   docker-compose logs -f server

   # View client logs
   docker-compose logs -f client
   ```

2. **Database Backup**:

   ```bash
   docker-compose exec mongo mongodump --out=/data/backup
   ```

3. **Database Restore**:

   ```bash
   docker-compose exec mongo mongorestore /data/backup
   ```

## Security Considerations

1. Ensure all API endpoints validate user permissions
2. Implement rate limiting for credit-related operations
3. Monitor transaction logs for suspicious activities
4. Regularly audit admin-level credit adjustments
5. Secure all API communications with proper CORS configuration
6. Implement audit logs for all credit-related activities

This document provides a comprehensive plan for implementing a credit-based flash card application that integrates with the existing authentication system. The design focuses on scalability, security, and user experience while providing robust credit management features for administrators.
