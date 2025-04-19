import { Router } from 'express';
import { 
  getDecksByUser,
  createDeck,
  getDeck,
  updateDeck,
  deleteDeck,
  getPublicDecks
} from '../controllers/deck.controller';
import { authenticateJwt } from '../middleware/auth.middleware';

const router = Router();

// All deck routes require authentication
router.use(authenticateJwt);

// Get all decks (for the authenticated user or public decks)
router.get('/', getDecksByUser);

// Create a new deck
router.post('/', createDeck);

// Get, update, delete a specific deck
router.get('/:id', getDeck);
router.put('/:id', updateDeck);
router.delete('/:id', deleteDeck);

// Get public decks
router.get('/public', getPublicDecks);

export default router;