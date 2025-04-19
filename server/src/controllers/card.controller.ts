import { Request, Response } from 'express';
import Card from '../models/card.model';
import Deck from '../models/deck.model';
import creditService from '../services/credit.service';
import { CARD_CREATION_COST } from '../config/constants';

// Get all cards in a deck
export const getCardsByDeck = async (req: Request, res: Response) => {
  try {
    const { deckId } = req.params;
    const userId = req.user.id;
    
    // Verify the deck exists and user has access
    const deck = await Deck.findById(deckId);
    if (!deck) {
      return res.status(404).json({ message: 'Deck not found' });
    }
    
    // Check if user has access to this deck (either owner or public deck)
    if (!deck.isPublic && deck.userId.toString() !== userId) {
      return res.status(403).json({ message: 'You do not have access to this deck' });
    }
    
    // Get all cards in the deck
    const cards = await Card.find({ deckId }).sort({ nextReviewDate: 1 });
    
    return res.status(200).json({
      count: cards.length,
      cards
    });
  } catch (error) {
    console.error('Error fetching cards:', error);
    return res.status(500).json({ message: 'Failed to fetch cards' });
  }
};

// Create a new card (costs credits)
export const createCard = async (req: Request, res: Response) => {
  try {
    const { deckId, front, back } = req.body;
    const userId = req.user.id;
    
    // Validate input
    if (!deckId || !front || !back) {
      return res.status(400).json({ message: 'Deck ID, front, and back content are required' });
    }
    
    // Verify the deck exists and user owns it
    const deck = await Deck.findById(deckId);
    if (!deck) {
      return res.status(404).json({ message: 'Deck not found' });
    }
    
    if (deck.userId.toString() !== userId) {
      return res.status(403).json({ message: 'You do not have permission to add cards to this deck' });
    }
    
    // Check if user has enough credits
    const hasEnoughCredits = await creditService.hasEnoughCredits(userId, CARD_CREATION_COST);
    if (!hasEnoughCredits) {
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
    
    // Deduct credits for card creation
    await creditService.deductCredits(
      userId,
      CARD_CREATION_COST,
      `Created card in deck: ${deck.name}`,
      'CARD_CREATION'
    );
    
    return res.status(201).json({
      message: 'Card created successfully',
      card,
      creditsDeducted: CARD_CREATION_COST
    });
  } catch (error) {
    console.error('Error creating card:', error);
    return res.status(500).json({ message: 'Failed to create card' });
  }
};

// Get a specific card
export const getCard = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    const card = await Card.findById(id);
    if (!card) {
      return res.status(404).json({ message: 'Card not found' });
    }
    
    // Check if user has access to the deck this card belongs to
    const deck = await Deck.findById(card.deckId);
    if (!deck) {
      return res.status(404).json({ message: 'Associated deck not found' });
    }
    
    if (!deck.isPublic && deck.userId.toString() !== userId) {
      return res.status(403).json({ message: 'You do not have access to this card' });
    }
    
    return res.status(200).json({
      card
    });
  } catch (error) {
    console.error('Error fetching card:', error);
    return res.status(500).json({ message: 'Failed to fetch card' });
  }
};

// Update a card
export const updateCard = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { front, back } = req.body;
    const userId = req.user.id;
    
    // Find the card
    const card = await Card.findById(id);
    if (!card) {
      return res.status(404).json({ message: 'Card not found' });
    }
    
    // Check if user owns the deck this card belongs to
    const deck = await Deck.findById(card.deckId);
    if (!deck) {
      return res.status(404).json({ message: 'Associated deck not found' });
    }
    
    if (deck.userId.toString() !== userId) {
      return res.status(403).json({ message: 'You do not have permission to update this card' });
    }
    
    // Update card fields
    if (front) card.front = front;
    if (back) card.back = back;
    
    card.updatedAt = new Date();
    await card.save();
    
    return res.status(200).json({
      message: 'Card updated successfully',
      card
    });
  } catch (error) {
    console.error('Error updating card:', error);
    return res.status(500).json({ message: 'Failed to update card' });
  }
};

// Delete a card
export const deleteCard = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    // Find the card
    const card = await Card.findById(id);
    if (!card) {
      return res.status(404).json({ message: 'Card not found' });
    }
    
    // Check if user owns the deck this card belongs to
    const deck = await Deck.findById(card.deckId);
    if (!deck) {
      return res.status(404).json({ message: 'Associated deck not found' });
    }
    
    if (deck.userId.toString() !== userId) {
      return res.status(403).json({ message: 'You do not have permission to delete this card' });
    }
    
    // Delete the card
    await Card.findByIdAndDelete(id);
    
    return res.status(200).json({
      message: 'Card deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting card:', error);
    return res.status(500).json({ message: 'Failed to delete card' });
  }
};

// Record a review result for a card
export const reviewCard = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { performance } = req.body; // Performance rating 1-5
    const userId = req.user.id;
    
    // Validate performance rating
    if (!performance || performance < 1 || performance > 5) {
      return res.status(400).json({ message: 'Valid performance rating (1-5) is required' });
    }
    
    // Find the card
    const card = await Card.findById(id);
    if (!card) {
      return res.status(404).json({ message: 'Card not found' });
    }
    
    // Check if user has access to the deck this card belongs to
    const deck = await Deck.findById(card.deckId);
    if (!deck) {
      return res.status(404).json({ message: 'Associated deck not found' });
    }
    
    if (!deck.isPublic && deck.userId.toString() !== userId) {
      return res.status(403).json({ message: 'You do not have access to this card' });
    }
    
    // Calculate next review date based on performance
    // Simple algorithm: worse performance = review again sooner
    const now = new Date();
    let nextReviewDays = 1;
    
    switch (performance) {
      case 1: // Very hard
        nextReviewDays = 1;
        break;
      case 2: // Hard
        nextReviewDays = 2;
        break;
      case 3: // Medium
        nextReviewDays = 4;
        break;
      case 4: // Easy
        nextReviewDays = 7;
        break;
      case 5: // Very easy
        nextReviewDays = 14;
        break;
    }
    
    const nextReviewDate = new Date();
    nextReviewDate.setDate(now.getDate() + nextReviewDays);
    
    // Update card with review data
    card.nextReviewDate = nextReviewDate;
    
    // Add to review history
    card.reviewHistory.push({
      date: now,
      performance: performance
    });
    
    // Update difficulty (simple average of last 3 reviews)
    if (card.reviewHistory.length > 0) {
      const recentReviews = card.reviewHistory.slice(-3); // Get last 3 reviews
      const sum = recentReviews.reduce((total, review) => total + review.performance, 0);
      card.difficulty = Math.round((6 - (sum / recentReviews.length)) * 10) / 10; // Invert scale and round to 1 decimal
    }
    
    card.updatedAt = now;
    await card.save();
    
    return res.status(200).json({
      message: 'Review recorded successfully',
      nextReviewDate,
      card
    });
  } catch (error) {
    console.error('Error recording review:', error);
    return res.status(500).json({ message: 'Failed to record review' });
  }
};