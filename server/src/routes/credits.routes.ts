import { Router } from 'express';
import { 
  getUserCreditBalance,
  getAvailableCreditPackages,
  purchaseCredits,
  getUserTransactionHistory
} from '../controllers/credit.controller';
import { authenticateJwt } from '../middleware/auth.middleware';

const router = Router();

// All credit routes require authentication
router.use(authenticateJwt);

// Get current user's credit balance
router.get('/balance', getUserCreditBalance);

// Get credit packages available for purchase
router.get('/packages', getAvailableCreditPackages);

// Purchase credits
router.post('/purchase', purchaseCredits);

// Get transaction history for the current user
router.get('/transactions', getUserTransactionHistory);

export default router;