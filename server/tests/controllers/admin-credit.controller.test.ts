import '../types'; // Import custom type definitions

import mongoose from 'mongoose';
import { Request, Response } from 'express';
import * as adminCreditController from '../../src/controllers/admin-credit.controller';
import creditService from '../../src/services/credit.service';
import { UserCredits, CreditPackage, CreditTransaction } from '../../src/models';

// Mock the credit service
jest.mock('../../src/services/credit.service');

describe('Admin Credit Controller Tests', () => {
  const mockAdminId = new mongoose.Types.ObjectId().toString();
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
      user: { id: mockAdminId }
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
  
  describe('getUsersWithCredits', () => {
    it('should return a list of users with their credit information', async () => {
      const mockUsers = [
        {
          _id: new mongoose.Types.ObjectId(),
          userId: mockUserId,
          balance: 100,
          lastUpdated: new Date()
        },
        {
          _id: new mongoose.Types.ObjectId(),
          userId: new mongoose.Types.ObjectId().toString(),
          balance: 50,
          lastUpdated: new Date()
        }
      ];
      
      jest.spyOn(UserCredits, 'find').mockReturnValueOnce({
        sort: jest.fn().mockResolvedValueOnce(mockUsers)
      } as any);
      
      await adminCreditController.getUsersWithCredits(
        mockRequest as Request,
        mockResponse as Response
      );
      
      expect(UserCredits.find).toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(responseObject.users).toEqual(mockUsers);
    });
    
    it('should handle errors properly', async () => {
      jest.spyOn(UserCredits, 'find').mockReturnValueOnce({
        sort: jest.fn().mockRejectedValueOnce(new Error('Database error'))
      } as any);
      
      await adminCreditController.getUsersWithCredits(
        mockRequest as Request,
        mockResponse as Response
      );
      
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(responseObject.message).toBe('Failed to fetch users');
    });
  });
  
  describe('adjustUserCredits', () => {
    beforeEach(() => {
      mockRequest.params = { userId: mockUserId };
      mockRequest.body = {
        amount: 20,
        reason: 'Admin reward'
      };
      
      // Default mock for getUserBalance (success case)
      (creditService.getUserBalance as jest.Mock).mockResolvedValue(120);
      
      // Default mock for addCredits (success case)
      (creditService.addCredits as jest.Mock).mockResolvedValue(true);
      
      // Default mock for deductCredits (success case)
      (creditService.deductCredits as jest.Mock).mockResolvedValue(true);
    });
    
    it('should add credits to a user', async () => {
      // Positive amount adds credits
      mockRequest.body.amount = 50;
      
      await adminCreditController.adjustUserCredits(
        mockRequest as Request,
        mockResponse as Response
      );
      
      expect(creditService.addCredits).toHaveBeenCalledWith(
        mockUserId,
        50,
        'Admin reward',
        'ADMIN_GRANT'
      );
      
      expect(creditService.getUserBalance).toHaveBeenCalledWith(mockUserId);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(responseObject.message).toBe('User credits adjusted successfully');
      expect(responseObject.adjustmentAmount).toBe(50);
      expect(responseObject.newBalance).toBe(120);
    });
    
    it('should deduct credits from a user', async () => {
      // Negative amount deducts credits
      mockRequest.body.amount = -30;
      
      // Mock that user has enough credits
      (creditService.getUserBalance as jest.Mock).mockResolvedValueOnce(50);
      
      await adminCreditController.adjustUserCredits(
        mockRequest as Request,
        mockResponse as Response
      );
      
      expect(creditService.deductCredits).toHaveBeenCalledWith(
        mockUserId,
        30, // Absolute value
        'Admin reward',
        'ADMIN_DEDUCTION'
      );
      
      expect(creditService.getUserBalance).toHaveBeenCalledWith(mockUserId);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(responseObject.message).toBe('User credits adjusted successfully');
      expect(responseObject.adjustmentAmount).toBe(-30);
    });
    
    it('should return 400 if amount is missing or invalid', async () => {
      mockRequest.body = { reason: 'Admin reward' }; // No amount
      
      await adminCreditController.adjustUserCredits(
        mockRequest as Request,
        mockResponse as Response
      );
      
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(responseObject.message).toBe('Valid credit amount required');
    });
    
    it('should return 400 if user has insufficient credits for deduction', async () => {
      mockRequest.body.amount = -100; // Large negative amount
      
      // Mock user with only 50 credits
      (creditService.getUserBalance as jest.Mock).mockResolvedValueOnce(50);
      
      await adminCreditController.adjustUserCredits(
        mockRequest as Request,
        mockResponse as Response
      );
      
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(responseObject.message).toBe('User does not have enough credits for this deduction');
      expect(responseObject.currentBalance).toBe(50);
    });
    
    it('should use default reason if none provided', async () => {
      mockRequest.body = { amount: 10 }; // No reason
      
      await adminCreditController.adjustUserCredits(
        mockRequest as Request,
        mockResponse as Response
      );
      
      expect(creditService.addCredits).toHaveBeenCalledWith(
        mockUserId,
        10,
        'Admin credit grant', // Default reason
        'ADMIN_GRANT'
      );
    });
    
    it('should handle errors during credit adjustment', async () => {
      (creditService.addCredits as jest.Mock).mockRejectedValueOnce(new Error('Database error'));
      
      await adminCreditController.adjustUserCredits(
        mockRequest as Request,
        mockResponse as Response
      );
      
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(responseObject.message).toBe('Failed to adjust user credits');
    });
  });
  
  describe('getCreditPackages', () => {
    it('should return all credit packages', async () => {
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
      
      await adminCreditController.getCreditPackages(
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
      
      await adminCreditController.getCreditPackages(
        mockRequest as Request,
        mockResponse as Response
      );
      
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(responseObject.message).toBe('Failed to fetch credit packages');
    });
  });
  
  describe('createCreditPackage', () => {
    beforeEach(() => {
      mockRequest.body = {
        name: 'New Package',
        description: 'New credit package description',
        credits: 75,
        price: 799
      };
      
      const mockPackage = {
        _id: new mongoose.Types.ObjectId(),
        name: 'New Package',
        description: 'New credit package description',
        credits: 75,
        price: 799,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      jest.spyOn(CreditPackage, 'create').mockResolvedValue(mockPackage as any);
    });
    
    it('should create a credit package successfully', async () => {
      await adminCreditController.createCreditPackage(
        mockRequest as Request,
        mockResponse as Response
      );
      
      expect(CreditPackage.create).toHaveBeenCalledWith(expect.objectContaining({
        name: 'New Package',
        description: 'New credit package description',
        credits: 75,
        price: 799,
        isActive: true
      }));
      
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(responseObject.message).toBe('Credit package created successfully');
      expect(responseObject.package).toBeDefined();
    });
    
    it('should return 400 if required fields are missing', async () => {
      mockRequest.body = {
        name: 'New Package',
        description: 'New credit package description'
        // Missing credits and price
      };
      
      await adminCreditController.createCreditPackage(
        mockRequest as Request,
        mockResponse as Response
      );
      
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(responseObject.message).toBe('All fields are required');
    });
    
    it('should handle errors properly', async () => {
      jest.spyOn(CreditPackage, 'create').mockRejectedValueOnce(new Error('Database error'));
      
      await adminCreditController.createCreditPackage(
        mockRequest as Request,
        mockResponse as Response
      );
      
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(responseObject.message).toBe('Failed to create credit package');
    });
  });
  
  describe('updateCreditPackage', () => {
    const mockPackageId = new mongoose.Types.ObjectId().toString();
    
    beforeEach(() => {
      mockRequest.params = { id: mockPackageId };
      mockRequest.body = {
        name: 'Updated Package',
        description: 'Updated description',
        credits: 100,
        price: 899,
        isActive: true
      };
      
      const mockPackage = {
        _id: mockPackageId,
        name: 'Old Package',
        description: 'Old description',
        credits: 50,
        price: 499,
        isActive: true,
        save: jest.fn().mockResolvedValue(true)
      };
      
      jest.spyOn(CreditPackage, 'findById').mockResolvedValue(mockPackage as any);
    });
    
    it('should update a credit package successfully', async () => {
      await adminCreditController.updateCreditPackage(
        mockRequest as Request,
        mockResponse as Response
      );
      
      const mockPackage = await CreditPackage.findById(mockPackageId);
      
      expect(mockPackage.name).toBe('Updated Package');
      expect(mockPackage.description).toBe('Updated description');
      expect(mockPackage.credits).toBe(100);
      expect(mockPackage.price).toBe(899);
      expect(mockPackage.save).toHaveBeenCalled();
      
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(responseObject.message).toBe('Credit package updated successfully');
      expect(responseObject.package).toBeDefined();
    });
    
    it('should return 404 if package does not exist', async () => {
      jest.spyOn(CreditPackage, 'findById').mockResolvedValueOnce(null);
      
      await adminCreditController.updateCreditPackage(
        mockRequest as Request,
        mockResponse as Response
      );
      
      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(responseObject.message).toBe('Credit package not found');
    });
    
    it('should update only provided fields', async () => {
      mockRequest.body = {
        name: 'Just Name Update'
        // Other fields not included
      };
      
      const originalPackage = await CreditPackage.findById(mockPackageId);
      const originalDescription = originalPackage.description;
      const originalCredits = originalPackage.credits;
      const originalPrice = originalPackage.price;
      
      await adminCreditController.updateCreditPackage(
        mockRequest as Request,
        mockResponse as Response
      );
      
      const updatedPackage = await CreditPackage.findById(mockPackageId);
      
      expect(updatedPackage.name).toBe('Just Name Update');
      // Other fields should remain unchanged
      expect(updatedPackage.description).toBe(originalDescription);
      expect(updatedPackage.credits).toBe(originalCredits);
      expect(updatedPackage.price).toBe(originalPrice);
    });
    
    it('should handle errors properly', async () => {
      const mockPackage = await CreditPackage.findById(mockPackageId);
      mockPackage.save.mockRejectedValueOnce(new Error('Database error'));
      
      await adminCreditController.updateCreditPackage(
        mockRequest as Request,
        mockResponse as Response
      );
      
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(responseObject.message).toBe('Failed to update credit package');
    });
  });
  
  describe('deleteCreditPackage', () => {
    const mockPackageId = new mongoose.Types.ObjectId().toString();
    
    beforeEach(() => {
      mockRequest.params = { id: mockPackageId };
      
      jest.spyOn(CreditPackage, 'findByIdAndDelete').mockResolvedValue({
        _id: mockPackageId,
        name: 'Package to Delete'
      } as any);
    });
    
    it('should delete a credit package successfully', async () => {
      await adminCreditController.deleteCreditPackage(
        mockRequest as Request,
        mockResponse as Response
      );
      
      expect(CreditPackage.findByIdAndDelete).toHaveBeenCalledWith(mockPackageId);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(responseObject.message).toBe('Credit package deleted successfully');
    });
    
    it('should return 404 if package does not exist', async () => {
      jest.spyOn(CreditPackage, 'findByIdAndDelete').mockResolvedValueOnce(null);
      
      await adminCreditController.deleteCreditPackage(
        mockRequest as Request,
        mockResponse as Response
      );
      
      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(responseObject.message).toBe('Credit package not found');
    });
    
    it('should handle errors properly', async () => {
      jest.spyOn(CreditPackage, 'findByIdAndDelete').mockRejectedValueOnce(new Error('Database error'));
      
      await adminCreditController.deleteCreditPackage(
        mockRequest as Request,
        mockResponse as Response
      );
      
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(responseObject.message).toBe('Failed to delete credit package');
    });
  });
  
  describe('getAllCreditTransactions', () => {
    beforeEach(() => {
      mockRequest.query = {
        page: '1',
        limit: '20'
      };
      
      const mockTransactions = [
        {
          _id: new mongoose.Types.ObjectId(),
          userId: mockUserId,
          amount: 50,
          description: 'Purchased credits',
          transactionType: 'PURCHASE',
          createdAt: new Date()
        },
        {
          _id: new mongoose.Types.ObjectId(),
          userId: new mongoose.Types.ObjectId().toString(),
          amount: -1,
          description: 'Card creation',
          transactionType: 'CARD_CREATION',
          createdAt: new Date()
        }
      ];
      
      jest.spyOn(CreditTransaction, 'find').mockReturnValueOnce({
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValueOnce(mockTransactions)
      } as any);
      
      jest.spyOn(CreditTransaction, 'countDocuments').mockResolvedValue(2);
    });
    
    it('should return all credit transactions with pagination', async () => {
      await adminCreditController.getAllCreditTransactions(
        mockRequest as Request,
        mockResponse as Response
      );
      
      expect(CreditTransaction.find).toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(responseObject.transactions).toBeDefined();
      expect(responseObject.pagination).toBeDefined();
      expect(responseObject.pagination.page).toBe(1);
      expect(responseObject.pagination.total).toBe(2);
    });
    
    it('should handle pagination parameters correctly', async () => {
      mockRequest.query = {
        page: '2',
        limit: '10'
      };
      
      await adminCreditController.getAllCreditTransactions(
        mockRequest as Request,
        mockResponse as Response
      );
      
      // Skip should be (page-1) * limit = 10
      const skipFn = (CreditTransaction.find as jest.Mock).mock.results[0].value.skip;
      expect(skipFn).toHaveBeenCalledWith(10);
      
      const limitFn = (CreditTransaction.find as jest.Mock).mock.results[0].value.limit;
      expect(limitFn).toHaveBeenCalledWith(10);
      
      expect(responseObject.pagination.page).toBe(2);
    });
    
    it('should handle errors properly', async () => {
      jest.spyOn(CreditTransaction, 'find').mockReturnValueOnce({
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockRejectedValueOnce(new Error('Database error'))
      } as any);
      
      await adminCreditController.getAllCreditTransactions(
        mockRequest as Request,
        mockResponse as Response
      );
      
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(responseObject.message).toBe('Failed to fetch credit transactions');
    });
  });
});