import { Router } from 'express';
import { 
  getCardsByDeck, 
  createCard, 
  getCard, 
  updateCard, 
  deleteCard, 
  reviewCard 
} from '../controllers/card.controller';
import { authenticateJwt } from '../middleware/auth.middleware';

const router = Router();

// All card routes require authentication
router.use(authenticateJwt);

// Get all cards for a specific deck
router.get('/deck/:deckId', getCardsByDeck);

// Create a new card (costs credits)
router.post('/', createCard);

// Get, update, delete a specific card
router.get('/:id', getCard);
router.put('/:id', updateCard);
router.delete('/:id', deleteCard);

// Record a review result for a card
router.post('/:id/review', reviewCard);

export default router;