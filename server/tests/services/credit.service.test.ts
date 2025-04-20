import '../types.d.ts'; // Import custom type definitions

import mongoose from 'mongoose';
import creditService from '../../src/services/credit.service';
import { UserCredits, CreditTransaction } from '../../src/models';
import { Document } from 'mongoose';

// Interface for transaction items in the test
interface TransactionItem {
  userId: string;
  amount: number;
  description: string;
  transactionType: string;
  createdAt: Date;
}

// Mock MongoDB sessions for transactions
const mockSession = {
  startTransaction: jest.fn(),
  commitTransaction: jest.fn(),
  abortTransaction: jest.fn(),
  endSession: jest.fn()
};

// Mock the startSession method globally for all tests
beforeAll(() => {
  // @ts-ignore - we're intentionally mocking this method
  UserCredits.startSession = jest.fn().mockResolvedValue(mockSession);
  
  // Mock the session option to be ignored in mongoose operations
  const originalFindOneAndUpdate = UserCredits.findOneAndUpdate;
  // @ts-ignore - we're intentionally mocking this method
  UserCredits.findOneAndUpdate = jest.fn().mockImplementation(function(filter, update, options) {
    // Remove session from options to avoid transaction requirements
    const { session, ...restOptions } = options || {};
    return originalFindOneAndUpdate.call(this, filter, update, restOptions);
  });
  
  // Mock create to bypass session
  const originalCreate = CreditTransaction.create;
  // @ts-ignore - we're intentionally mocking this method
  CreditTransaction.create = jest.fn().mockImplementation(function(docs, options) {
    // Remove session from options to avoid transaction requirements
    const { session, ...restOptions } = options || {};
    return originalCreate.call(this, docs, restOptions);
  });
});

// Clear mocks between tests
beforeEach(() => {
  mockSession.startTransaction.mockClear();
  mockSession.commitTransaction.mockClear();
  mockSession.abortTransaction.mockClear();
  mockSession.endSession.mockClear();
});

describe('Credit Service Tests', () => {
  const mockUserId = new mongoose.Types.ObjectId().toString();
  
  describe('getUserBalance', () => {
    it('should return 0 for a new user', async () => {
      const balance = await creditService.getUserBalance(mockUserId);
      expect(balance).toBe(0);
    });
    
    it('should return the correct balance for a user with credits', async () => {
      // Create a user with a balance
      await UserCredits.create({
        userId: mockUserId,
        balance: 50,
        lastUpdated: new Date()
      });
      
      const balance = await creditService.getUserBalance(mockUserId);
      expect(balance).toBe(50);
    });
  });
  
  describe('hasEnoughCredits', () => {
    it('should return false if user has insufficient credits', async () => {
      // Create a user with a balance
      await UserCredits.create({
        userId: mockUserId,
        balance: 10,
        lastUpdated: new Date()
      });
      
      const result = await creditService.hasEnoughCredits(mockUserId, 20);
      expect(result).toBe(false);
    });
    
    it('should return true if user has sufficient credits', async () => {
      // Create a user with a balance
      await UserCredits.create({
        userId: mockUserId,
        balance: 30,
        lastUpdated: new Date()
      });
      
      const result = await creditService.hasEnoughCredits(mockUserId, 20);
      expect(result).toBe(true);
    });
  });
  
  describe('deductCredits', () => {
    it('should deduct credits from user balance', async () => {
      // Create a user with a balance
      await UserCredits.create({
        userId: mockUserId,
        balance: 50,
        lastUpdated: new Date()
      });
      
      // Deduct credits
      const amountToDeduct = 20;
      const result = await creditService.deductCredits(
        mockUserId,
        amountToDeduct,
        'Test deduction',
        'CARD_CREATION'
      );
      
      // Verify deduction was successful
      expect(result).toBe(true);
      
      // Verify balance was updated
      const updatedBalance = await creditService.getUserBalance(mockUserId);
      expect(updatedBalance).toBe(30);
      
      // Verify transaction was recorded
      const transaction = await CreditTransaction.findOne({ userId: mockUserId });
      expect(transaction).toBeTruthy();
      expect(transaction?.amount).toBe(-amountToDeduct);
      expect(transaction?.description).toBe('Test deduction');
      expect(transaction?.transactionType).toBe('CARD_CREATION');
    });
    
    it('should create a user credit record if it doesn\'t exist', async () => {
      // User doesn't exist yet
      const newUserId = new mongoose.Types.ObjectId().toString();
      
      // Deduct credits (should create the user record)
      const result = await creditService.deductCredits(
        newUserId,
        5,
        'First deduction',
        'CARD_CREATION'
      );
      
      // Verify result
      expect(result).toBe(true);
      
      // Verify user credits record was created
      const userCredits = await UserCredits.findOne({ userId: newUserId });
      expect(userCredits).toBeTruthy();
      expect(userCredits?.balance).toBe(-5); // Started at 0, deducted 5
    });
  });
  
  describe('addCredits', () => {
    it('should add credits to user balance', async () => {
      // Create a user with a balance
      await UserCredits.create({
        userId: mockUserId,
        balance: 30,
        lastUpdated: new Date()
      });
      
      // Add credits
      const amountToAdd = 25;
      const result = await creditService.addCredits(
        mockUserId,
        amountToAdd,
        'Test addition',
        'PURCHASE'
      );
      
      // Verify addition was successful
      expect(result).toBe(true);
      
      // Verify balance was updated
      const updatedBalance = await creditService.getUserBalance(mockUserId);
      expect(updatedBalance).toBe(55);
      
      // Verify transaction was recorded
      const transaction = await CreditTransaction.findOne({ userId: mockUserId });
      expect(transaction).toBeTruthy();
      expect(transaction?.amount).toBe(amountToAdd);
      expect(transaction?.description).toBe('Test addition');
      expect(transaction?.transactionType).toBe('PURCHASE');
    });
    
    it('should create a user credit record if it doesn\'t exist', async () => {
      // User doesn't exist yet
      const newUserId = new mongoose.Types.ObjectId().toString();
      
      // Add credits (should create the user record)
      const result = await creditService.addCredits(
        newUserId,
        15,
        'First addition',
        'SIGNUP_BONUS'
      );
      
      // Verify result
      expect(result).toBe(true);
      
      // Verify user credits record was created with correct balance
      const userCredits = await UserCredits.findOne({ userId: newUserId });
      expect(userCredits).toBeTruthy();
      expect(userCredits?.balance).toBe(15);
    });
  });
  
  describe('getTransactionHistory', () => {
    beforeEach(async () => {
      // Create multiple transactions for testing pagination
      const transactions: TransactionItem[] = [];
      for (let i = 1; i <= 25; i++) {
        transactions.push({
          userId: mockUserId,
          amount: i % 2 === 0 ? i : -i, // Alternating credits/debits
          description: `Transaction ${i}`,
          transactionType: i % 2 === 0 ? 'PURCHASE' : 'CARD_CREATION',
          createdAt: new Date(Date.now() - (i * 1000 * 60 * 60)) // Different timestamps
        });
      }
      
      await CreditTransaction.insertMany(transactions);
    });
    
    it('should retrieve transaction history with pagination', async () => {
      const limit = 10;
      const page = 1;
      
      const result = await creditService.getTransactionHistory(mockUserId, limit, page);
      
      // Verify pagination structure
      expect(result).toHaveProperty('transactions');
      expect(result).toHaveProperty('pagination');
      expect(result.pagination).toHaveProperty('total');
      expect(result.pagination).toHaveProperty('page');
      expect(result.pagination).toHaveProperty('pages');
      
      // Verify content
      expect(result.transactions.length).toBe(limit);
      expect(result.pagination.page).toBe(page);
      expect(result.pagination.total).toBe(25);
      expect(result.pagination.pages).toBe(3); // 25 items with 10 per page = 3 pages
      
      // Verify sorting (newest first)
      const timestamps = result.transactions.map((t: any) => new Date(t.createdAt).getTime());
      const isSortedDescending = timestamps.every((val: number, i: number, arr: number[]) => 
        i === 0 || val <= arr[i - 1]
      );
      expect(isSortedDescending).toBe(true);
    });
    
    it('should retrieve the second page of results', async () => {
      const limit = 10;
      const page = 2;
      
      const result = await creditService.getTransactionHistory(mockUserId, limit, page);
      
      expect(result.transactions.length).toBe(limit);
      expect(result.pagination.page).toBe(page);
      
      // Verify we got the second set of transactions
      const firstPageResult = await creditService.getTransactionHistory(mockUserId, limit, 1);
      const firstPageIds = firstPageResult.transactions.map((t: any) => t._id.toString());
      const secondPageIds = result.transactions.map((t: any) => t._id.toString());
      
      // Make sure there's no overlap between pages
      const hasOverlap = secondPageIds.some((id: string) => firstPageIds.includes(id));
      expect(hasOverlap).toBe(false);
    });
    
    it('should return empty list for a user with no transactions', async () => {
      const newUserId = new mongoose.Types.ObjectId().toString();
      
      const result = await creditService.getTransactionHistory(newUserId);
      
      expect(result.transactions.length).toBe(0);
      expect(result.pagination.total).toBe(0);
      expect(result.pagination.pages).toBe(0);
    });
  });
});