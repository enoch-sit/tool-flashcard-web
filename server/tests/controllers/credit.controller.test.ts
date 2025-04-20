import '../types'; // Import custom type definitions

import mongoose from 'mongoose';
import { Request, Response } from 'express';
import * as creditController from '../../src/controllers/credit.controller';
import creditService from '../../src/services/credit.service';
import { UserCredits, CreditPackage, CreditTransaction } from '../../src/models';

// Mock the credit service
jest.mock('../../src/services/credit.service');

describe('Credit Controller Tests', () => {
  const mockUserId = new mongoose.Types.ObjectId().toString();
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let responseObject: any = {};
  
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Reset response object
    responseObject = {};
    
    // Mock request object
    mockRequest = {
      params: {},
      body: {},
      query: {},
      user: { id: mockUserId }
    };
    
    // Mock response object
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockImplementation(result => {
        responseObject = result;
        return mockResponse;
      })
    };
  });
  
  describe('getUserCreditBalance', () => {
    it('should return the user credit balance', async () => {
      (creditService.getUserBalance as jest.Mock).mockResolvedValueOnce(50);
      
      await creditController.getUserCreditBalance(
        mockRequest as Request,
        mockResponse as Response
      );
      
      expect(creditService.getUserBalance).toHaveBeenCalledWith(mockUserId);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(responseObject.balance).toBe(50);
    });
    
    it('should handle errors properly', async () => {
      (creditService.getUserBalance as jest.Mock).mockRejectedValueOnce(new Error('Database error'));
      
      await creditController.getUserCreditBalance(
        mockRequest as Request,
        mockResponse as Response
      );
      
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(responseObject.message).toBe('Failed to fetch credit balance');
    });
  });
  
  describe('getAvailableCreditPackages', () => {
    it('should return available credit packages', async () => {
      const mockPackages = [
        {
          _id: new mongoose.Types.ObjectId(),
          name: 'Small Package',
          description: 'Small credit package',
          credits: 50,
          price: 499,
          isActive: true
        },
        {
          _id: new mongoose.Types.ObjectId(),
          name: 'Medium Package',
          description: 'Medium credit package',
          credits: 125,
          price: 999,
          isActive: true
        }
      ];
      
      jest.spyOn(CreditPackage, 'find').mockReturnValueOnce({
        sort: jest.fn().mockResolvedValueOnce(mockPackages)
      } as any);
      
      await creditController.getAvailableCreditPackages(
        mockRequest as Request,
        mockResponse as Response
      );
      
      expect(CreditPackage.find).toHaveBeenCalledWith({ isActive: true });
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(responseObject.packages).toEqual(mockPackages);
    });
    
    it('should handle errors properly', async () => {
      jest.spyOn(CreditPackage, 'find').mockReturnValueOnce({
        sort: jest.fn().mockRejectedValueOnce(new Error('Database error'))
      } as any);
      
      await creditController.getAvailableCreditPackages(
        mockRequest as Request,
        mockResponse as Response
      );
      
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(responseObject.message).toBe('Failed to fetch credit packages');
    });
  });
  
  describe('purchaseCredits', () => {
    const mockPackageId = new mongoose.Types.ObjectId().toString();
    
    beforeEach(() => {
      mockRequest.body = {
        packageId: mockPackageId
      };
      
      // Default mock for addCredits (success case)
      (creditService.addCredits as jest.Mock).mockResolvedValue(true);
      
      // Default mock for getUserBalance (post-purchase)
      (creditService.getUserBalance as jest.Mock).mockResolvedValue(150);
    });
    
    it('should return 400 if package ID is missing', async () => {
      mockRequest.body = {}; // No packageId
      
      await creditController.purchaseCredits(
        mockRequest as Request,
        mockResponse as Response
      );
      
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(responseObject.message).toBe('Credit package ID is required');
    });
    
    it('should return 404 if package does not exist or is inactive', async () => {
      jest.spyOn(CreditPackage, 'findById').mockResolvedValueOnce(null);
      
      await creditController.purchaseCredits(
        mockRequest as Request,
        mockResponse as Response
      );
      
      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(responseObject.message).toBe('Credit package not found or inactive');
    });
    
    it('should return 404 if package is inactive', async () => {
      const mockPackage = {
        _id: mockPackageId,
        name: 'Test Package',
        credits: 50,
        isActive: false
      };
      
      jest.spyOn(CreditPackage, 'findById').mockResolvedValueOnce(mockPackage as any);
      
      await creditController.purchaseCredits(
        mockRequest as Request,
        mockResponse as Response
      );
      
      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(responseObject.message).toBe('Credit package not found or inactive');
    });
    
    it('should purchase credits successfully', async () => {
      const mockPackage = {
        _id: mockPackageId,
        name: 'Test Package',
        credits: 50,
        isActive: true
      };
      
      jest.spyOn(CreditPackage, 'findById').mockResolvedValueOnce(mockPackage as any);
      
      await creditController.purchaseCredits(
        mockRequest as Request,
        mockResponse as Response
      );
      
      expect(creditService.addCredits).toHaveBeenCalledWith(
        mockUserId,
        50, // Credits from package
        expect.stringContaining('Purchased'),
        'PURCHASE'
      );
      
      expect(creditService.getUserBalance).toHaveBeenCalledWith(mockUserId);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(responseObject.message).toBe('Credit purchase successful');
      expect(responseObject.creditsAdded).toBe(50);
      expect(responseObject.newBalance).toBe(150);
    });
    
    it('should handle errors during purchase', async () => {
      const mockPackage = {
        _id: mockPackageId,
        name: 'Test Package',
        credits: 50,
        isActive: true
      };
      
      jest.spyOn(CreditPackage, 'findById').mockResolvedValueOnce(mockPackage as any);
      (creditService.addCredits as jest.Mock).mockRejectedValueOnce(new Error('Database error'));
      
      await creditController.purchaseCredits(
        mockRequest as Request,
        mockResponse as Response
      );
      
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(responseObject.message).toBe('Failed to process credit purchase');
    });
  });
  
  describe('getUserTransactionHistory', () => {
    beforeEach(() => {
      mockRequest.query = {
        page: '1',
        limit: '10'
      };
      
      // Mock transaction history result
      const mockTransactions = [
        {
          _id: new mongoose.Types.ObjectId(),
          userId: mockUserId,
          amount: 50,
          description: 'Purchased Small Package',
          transactionType: 'PURCHASE',
          createdAt: new Date()
        },
        {
          _id: new mongoose.Types.ObjectId(),
          userId: mockUserId,
          amount: -1,
          description: 'Created card in deck: Test Deck',
          transactionType: 'CARD_CREATION',
          createdAt: new Date()
        }
      ];
      
      const mockResult = {
        transactions: mockTransactions,
        pagination: {
          total: 2,
          page: 1,
          pages: 1
        }
      };
      
      (creditService.getTransactionHistory as jest.Mock).mockResolvedValue(mockResult);
    });
    
    it('should return transaction history with pagination', async () => {
      await creditController.getUserTransactionHistory(
        mockRequest as Request,
        mockResponse as Response
      );
      
      expect(creditService.getTransactionHistory).toHaveBeenCalledWith(
        mockUserId,
        10, // limit
        1 // page
      );
      
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(responseObject.transactions).toBeDefined();
      expect(responseObject.pagination).toBeDefined();
    });
    
    it('should use default pagination if not specified', async () => {
      mockRequest.query = {}; // No pagination params
      
      await creditController.getUserTransactionHistory(
        mockRequest as Request,
        mockResponse as Response
      );
      
      // Should use defaults: limit=10, page=1
      expect(creditService.getTransactionHistory).toHaveBeenCalledWith(
        mockUserId,
        10,
        1
      );
    });
    
    it('should handle custom pagination parameters', async () => {
      mockRequest.query = {
        page: '2',
        limit: '5'
      };
      
      await creditController.getUserTransactionHistory(
        mockRequest as Request,
        mockResponse as Response
      );
      
      expect(creditService.getTransactionHistory).toHaveBeenCalledWith(
        mockUserId,
        5,
        2
      );
    });
    
    it('should handle errors properly', async () => {
      (creditService.getTransactionHistory as jest.Mock).mockRejectedValueOnce(new Error('Database error'));
      
      await creditController.getUserTransactionHistory(
        mockRequest as Request,
        mockResponse as Response
      );
      
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(responseObject.message).toBe('Failed to fetch transaction history');
    });
  });
});