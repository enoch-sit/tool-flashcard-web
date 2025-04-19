import { Request, Response } from 'express';
import creditService from '../services/credit.service';
import CreditPackage from '../models/credit-package.model';

// Get current user's credit balance
export const getUserCreditBalance = async (req: Request, res: Response) => {
  try {
    const userId = req.user.id;
    
    const balance = await creditService.getUserBalance(userId);
    
    return res.status(200).json({
      balance
    });
  } catch (error) {
    console.error('Error fetching credit balance:', error);
    return res.status(500).json({ message: 'Failed to fetch credit balance' });
  }
};

// Get available credit packages for purchase
export const getAvailableCreditPackages = async (req: Request, res: Response) => {
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

// Purchase credits (simplified - in a real app, you'd integrate with a payment processor)
export const purchaseCredits = async (req: Request, res: Response) => {
  try {
    const { packageId, paymentMethod } = req.body;
    const userId = req.user.id;
    
    // Validate input
    if (!packageId) {
      return res.status(400).json({ message: 'Credit package ID is required' });
    }
    
    // Find the package
    const creditPackage = await CreditPackage.findById(packageId);
    if (!creditPackage || !creditPackage.isActive) {
      return res.status(404).json({ message: 'Credit package not found or inactive' });
    }
    
    // In a real app, you would:
    // 1. Process payment with Stripe/PayPal/etc.
    // 2. Verify payment was successful
    // 3. Then add credits to the user's account
    
    // For our simplified version, we'll just add the credits directly
    await creditService.addCredits(
      userId,
      creditPackage.credits,
      `Purchased ${creditPackage.name} credit package`,
      'PURCHASE'
    );
    
    // Get updated balance
    const newBalance = await creditService.getUserBalance(userId);
    
    return res.status(200).json({
      message: 'Credit purchase successful',
      creditsAdded: creditPackage.credits,
      newBalance
    });
  } catch (error) {
    console.error('Error purchasing credits:', error);
    return res.status(500).json({ message: 'Failed to process credit purchase' });
  }
};

// Get transaction history for the current user
export const getUserTransactionHistory = async (req: Request, res: Response) => {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    
    const result = await creditService.getTransactionHistory(userId, limit, page);
    
    return res.status(200).json(result);
  } catch (error) {
    console.error('Error fetching transaction history:', error);
    return res.status(500).json({ message: 'Failed to fetch transaction history' });
  }
};