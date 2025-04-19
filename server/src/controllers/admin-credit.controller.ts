import { Request, Response } from 'express';
import creditService from '../services/credit.service';
import UserCredits from '../models/user-credits.model';
import CreditPackage from '../models/credit-package.model';
import CreditTransaction from '../models/credit-transaction.model';

// Get all users with credit information
export const getUsersWithCredits = async (req: Request, res: Response) => {
  try {
    // Fetch users from the database with credit information
    const users = await UserCredits.find().sort({ lastUpdated: -1 });
    
    return res.status(200).json({
      users
    });
  } catch (error) {
    console.error('Error fetching users with credits:', error);
    return res.status(500).json({ message: 'Failed to fetch users' });
  }
};

// Adjust a user's credits (add or deduct)
export const adjustUserCredits = async (req: Request, res: Response) => {
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
        reason || 'Admin credit grant',
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
        reason || 'Admin credit deduction',
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

// Get all credit packages
export const getCreditPackages = async (req: Request, res: Response) => {
  try {
    const packages = await CreditPackage.find({ isActive: true }).sort({ price: 1 });
    
    return res.status(200).json({
      packages
    });
  } catch (error) {
    console.error('Error fetching credit packages:', error);
    return res.status(500).json({ message: 'Failed to fetch credit packages' });
  }
};

// Create a new credit package
export const createCreditPackage = async (req: Request, res: Response) => {
  try {
    const { name, description, credits, price } = req.body;
    
    // Validate input
    if (!name || !description || !credits || !price) {
      return res.status(400).json({ message: 'All fields are required' });
    }
    
    // Create package
    const creditPackage = await CreditPackage.create({
      name,
      description,
      credits,
      price,
      isActive: true
    });
    
    return res.status(201).json({
      message: 'Credit package created successfully',
      package: creditPackage
    });
  } catch (error) {
    console.error('Error creating credit package:', error);
    return res.status(500).json({ message: 'Failed to create credit package' });
  }
};

// Update a credit package
export const updateCreditPackage = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description, credits, price, isActive } = req.body;
    
    // Find package
    const creditPackage = await CreditPackage.findById(id);
    if (!creditPackage) {
      return res.status(404).json({ message: 'Credit package not found' });
    }
    
    // Update fields
    if (name) creditPackage.name = name;
    if (description) creditPackage.description = description;
    if (credits !== undefined) creditPackage.credits = credits;
    if (price !== undefined) creditPackage.price = price;
    if (isActive !== undefined) creditPackage.isActive = isActive;
    
    creditPackage.updatedAt = new Date();
    await creditPackage.save();
    
    return res.status(200).json({
      message: 'Credit package updated successfully',
      package: creditPackage
    });
  } catch (error) {
    console.error('Error updating credit package:', error);
    return res.status(500).json({ message: 'Failed to update credit package' });
  }
};

// Delete a credit package
export const deleteCreditPackage = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Find and delete package
    const result = await CreditPackage.findByIdAndDelete(id);
    
    if (!result) {
      return res.status(404).json({ message: 'Credit package not found' });
    }
    
    return res.status(200).json({
      message: 'Credit package deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting credit package:', error);
    return res.status(500).json({ message: 'Failed to delete credit package' });
  }
};

// View all credit transactions (for admin)
export const getAllCreditTransactions = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;
    
    const transactions = await CreditTransaction.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
      
    const total = await CreditTransaction.countDocuments();
    
    return res.status(200).json({
      transactions,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching credit transactions:', error);
    return res.status(500).json({ message: 'Failed to fetch credit transactions' });
  }
};