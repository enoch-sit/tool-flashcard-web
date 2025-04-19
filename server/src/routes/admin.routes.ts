import { Router } from 'express';
import {
  getUsersWithCredits,
  adjustUserCredits,
  getCreditPackages,
  createCreditPackage,
  updateCreditPackage,
  deleteCreditPackage,
  getAllCreditTransactions
} from '../controllers/admin-credit.controller';
import { authenticateJwt, requireAdmin } from '../middleware/auth.middleware';

const router = Router();

// All admin routes require authentication and admin privileges
router.use(authenticateJwt);
router.use(requireAdmin);

// User credit management
router.get('/users', getUsersWithCredits);
router.post('/users/:userId/credits', adjustUserCredits);

// Credit package management
router.get('/packages', getCreditPackages);
router.post('/packages', createCreditPackage);
router.put('/packages/:id', updateCreditPackage);
router.delete('/packages/:id', deleteCreditPackage);

// Transaction history
router.get('/transactions', getAllCreditTransactions);

export default router;