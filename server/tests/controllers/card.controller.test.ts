import '../types.d.ts'; // Import custom type definitions

import mongoose from 'mongoose';
import { Request, Response } from 'express';
import * as cardController from '../../src/controllers/card.controller';
import { Card, Deck } from '../../src/models';
import creditService from '../../src/services/credit.service';

// Define ReviewRecord interface to match the one in card.model.ts
interface ReviewRecord {
  date: Date;
  performance: number; // 1-5 rating
}

// Mock the credit service
jest.mock('../../src/services/credit.service');

describe('Card Controller Tests', () => {
  const mockUserId = new mongoose.Types.ObjectId().toString();
  const mockDeckId = new mongoose.Types.ObjectId();
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
      query: {}, // Initialize query property
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
    
    // Default mock for hasEnoughCredits (success case)
    (creditService.hasEnoughCredits as jest.Mock).mockResolvedValue(true);
    
    // Default mock for deductCredits (success case)
    (creditService.deductCredits as jest.Mock).mockResolvedValue(true);
  });
  
  describe('getCardsByDeck', () => {
    it('should return 404 if deck does not exist', async () => {
      // Mock findById to return null (deck not found)
      jest.spyOn(Deck, 'findById').mockResolvedValueOnce(null);
      
      // Set up request with deck ID
      mockRequest.params = { deckId: mockDeckId.toString() };
      
      // Call the controller
      await cardController.getCardsByDeck(
        mockRequest as Request,
        mockResponse as Response
      );
      
      // Verify response
      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(responseObject.message).toBe('Deck not found');
    });
    
    it('should return 403 if user does not have access to private deck', async () => {
      // Mock a private deck owned by a different user
      const mockDeck = {
        _id: mockDeckId,
        userId: new mongoose.Types.ObjectId().toString(), // Different user ID
        isPublic: false
      };
      
      jest.spyOn(Deck, 'findById').mockResolvedValueOnce(mockDeck);
      
      // Set up request
      mockRequest.params = { deckId: mockDeckId.toString() };
      
      // Call the controller
      await cardController.getCardsByDeck(
        mockRequest as Request,
        mockResponse as Response
      );
      
      // Verify response
      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(responseObject.message).toBe('You do not have access to this deck');
    });
    
    it('should return cards for a user\'s own deck', async () => {
      // Mock a private deck owned by the user
      const mockDeck = {
        _id: mockDeckId,
        userId: mockUserId,
        isPublic: false
      };
      
      // Mock cards
      const mockCards = [
        { _id: new mongoose.Types.ObjectId(), front: 'Card 1 Front', back: 'Card 1 Back' },
        { _id: new mongoose.Types.ObjectId(), front: 'Card 2 Front', back: 'Card 2 Back' }
      ];
      
      jest.spyOn(Deck, 'findById').mockResolvedValueOnce(mockDeck);
      jest.spyOn(Card, 'find').mockReturnValueOnce({
        sort: jest.fn().mockResolvedValueOnce(mockCards)
      } as any);
      
      // Set up request
      mockRequest.params = { deckId: mockDeckId.toString() };
      
      // Call the controller
      await cardController.getCardsByDeck(
        mockRequest as Request,
        mockResponse as Response
      );
      
      // Verify response
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(responseObject.cards).toEqual(mockCards);
      expect(responseObject.count).toBe(2);
    });
    
    it('should return cards for a public deck', async () => {
      // Mock a public deck owned by a different user
      const mockDeck = {
        _id: mockDeckId,
        userId: new mongoose.Types.ObjectId().toString(), // Different user ID
        isPublic: true
      };
      
      // Mock cards
      const mockCards = [
        { _id: new mongoose.Types.ObjectId(), front: 'Card 1 Front', back: 'Card 1 Back' }
      ];
      
      jest.spyOn(Deck, 'findById').mockResolvedValueOnce(mockDeck);
      jest.spyOn(Card, 'find').mockReturnValueOnce({
        sort: jest.fn().mockResolvedValueOnce(mockCards)
      } as any);
      
      // Set up request
      mockRequest.params = { deckId: mockDeckId.toString() };
      
      // Call the controller
      await cardController.getCardsByDeck(
        mockRequest as Request,
        mockResponse as Response
      );
      
      // Verify response
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(responseObject.cards).toEqual(mockCards);
      expect(responseObject.count).toBe(1);
    });
  });
  
  describe('createCard', () => {
    beforeEach(() => {
      // Set up request body with valid card data
      mockRequest.body = {
        deckId: mockDeckId.toString(),
        front: 'Test Card Front',
        back: 'Test Card Back'
      };
      
      // Mock deck finding
      const mockDeck = {
        _id: mockDeckId,
        userId: mockUserId,
        name: 'Test Deck'
      };
      jest.spyOn(Deck, 'findById').mockResolvedValue(mockDeck as any);
      
      // Mock card creation
      const mockCard = {
        _id: new mongoose.Types.ObjectId(),
        deckId: mockDeckId,
        front: 'Test Card Front',
        back: 'Test Card Back',
        difficulty: 1,
        nextReviewDate: new Date(),
        reviewHistory: []
      };
      jest.spyOn(Card, 'create').mockResolvedValue(mockCard as any);
    });
    
    it('should return 400 if required fields are missing', async () => {
      // Missing fields
      mockRequest.body = { deckId: mockDeckId.toString() }; // Missing front and back
      
      await cardController.createCard(
        mockRequest as Request,
        mockResponse as Response
      );
      
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(responseObject.message).toBe('Deck ID, front, and back content are required');
    });
    
    it('should return 404 if deck does not exist', async () => {
      jest.spyOn(Deck, 'findById').mockResolvedValueOnce(null);
      
      await cardController.createCard(
        mockRequest as Request,
        mockResponse as Response
      );
      
      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(responseObject.message).toBe('Deck not found');
    });
    
    it('should return 403 if user does not own the deck', async () => {
      const mockDeck = {
        _id: mockDeckId,
        userId: new mongoose.Types.ObjectId().toString(), // Different user ID
        name: 'Test Deck'
      };
      
      jest.spyOn(Deck, 'findById').mockResolvedValueOnce(mockDeck as any);
      
      await cardController.createCard(
        mockRequest as Request,
        mockResponse as Response
      );
      
      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(responseObject.message).toBe('You do not have permission to add cards to this deck');
    });
    
    it('should return 402 if user does not have enough credits', async () => {
      // Mock hasEnoughCredits to return false
      (creditService.hasEnoughCredits as jest.Mock).mockResolvedValueOnce(false);
      
      await cardController.createCard(
        mockRequest as Request,
        mockResponse as Response
      );
      
      expect(mockResponse.status).toHaveBeenCalledWith(402);
      expect(responseObject.message).toBe('Insufficient credits to create a card');
      expect(creditService.hasEnoughCredits).toHaveBeenCalledWith(mockUserId, 1); // 1 is CARD_CREATION_COST
    });
    
    it('should create a card successfully and deduct credits', async () => {
      await cardController.createCard(
        mockRequest as Request,
        mockResponse as Response
      );
      
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(responseObject.message).toBe('Card created successfully');
      expect(responseObject.card).toBeDefined();
      expect(creditService.deductCredits).toHaveBeenCalledWith(
        mockUserId,
        1, // CARD_CREATION_COST
        expect.stringContaining('Created card in deck'),
        'CARD_CREATION'
      );
    });
  });
  
  describe('getCard', () => {
    const mockCardId = new mongoose.Types.ObjectId();
    
    it('should return 404 if card does not exist', async () => {
      jest.spyOn(Card, 'findById').mockResolvedValueOnce(null);
      
      mockRequest.params = { id: mockCardId.toString() };
      
      await cardController.getCard(
        mockRequest as Request,
        mockResponse as Response
      );
      
      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(responseObject.message).toBe('Card not found');
    });
    
    it('should return 404 if associated deck does not exist', async () => {
      const mockCard = {
        _id: mockCardId,
        deckId: mockDeckId
      };
      
      jest.spyOn(Card, 'findById').mockResolvedValueOnce(mockCard as any);
      jest.spyOn(Deck, 'findById').mockResolvedValueOnce(null);
      
      mockRequest.params = { id: mockCardId.toString() };
      
      await cardController.getCard(
        mockRequest as Request,
        mockResponse as Response
      );
      
      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(responseObject.message).toBe('Associated deck not found');
    });
    
    it('should return 403 if user does not have access to the card', async () => {
      const mockCard = {
        _id: mockCardId,
        deckId: mockDeckId
      };
      
      const mockDeck = {
        _id: mockDeckId,
        userId: new mongoose.Types.ObjectId().toString(), // Different user ID
        isPublic: false
      };
      
      jest.spyOn(Card, 'findById').mockResolvedValueOnce(mockCard as any);
      jest.spyOn(Deck, 'findById').mockResolvedValueOnce(mockDeck as any);
      
      mockRequest.params = { id: mockCardId.toString() };
      
      await cardController.getCard(
        mockRequest as Request,
        mockResponse as Response
      );
      
      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(responseObject.message).toBe('You do not have access to this card');
    });
    
    it('should return the card if user owns the deck', async () => {
      const mockCard = {
        _id: mockCardId,
        deckId: mockDeckId,
        front: 'Test Front',
        back: 'Test Back'
      };
      
      const mockDeck = {
        _id: mockDeckId,
        userId: mockUserId,
        isPublic: false
      };
      
      jest.spyOn(Card, 'findById').mockResolvedValueOnce(mockCard as any);
      jest.spyOn(Deck, 'findById').mockResolvedValueOnce(mockDeck as any);
      
      mockRequest.params = { id: mockCardId.toString() };
      
      await cardController.getCard(
        mockRequest as Request,
        mockResponse as Response
      );
      
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(responseObject.card).toEqual(mockCard);
    });
    
    it('should return the card if the deck is public', async () => {
      const mockCard = {
        _id: mockCardId,
        deckId: mockDeckId,
        front: 'Test Front',
        back: 'Test Back'
      };
      
      const mockDeck = {
        _id: mockDeckId,
        userId: new mongoose.Types.ObjectId().toString(), // Different user ID
        isPublic: true
      };
      
      jest.spyOn(Card, 'findById').mockResolvedValueOnce(mockCard as any);
      jest.spyOn(Deck, 'findById').mockResolvedValueOnce(mockDeck as any);
      
      mockRequest.params = { id: mockCardId.toString() };
      
      await cardController.getCard(
        mockRequest as Request,
        mockResponse as Response
      );
      
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(responseObject.card).toEqual(mockCard);
    });
  });
  
  describe('updateCard', () => {
    const mockCardId = new mongoose.Types.ObjectId();
    
    beforeEach(() => {
      mockRequest.params = { id: mockCardId.toString() };
      mockRequest.body = { front: 'Updated Front', back: 'Updated Back' };
    });
    
    it('should update a card successfully', async () => {
      const mockCard = {
        _id: mockCardId,
        deckId: mockDeckId,
        front: 'Old Front',
        back: 'Old Back',
        save: jest.fn().mockResolvedValue(true)
      };
      
      const mockDeck = {
        _id: mockDeckId,
        userId: mockUserId
      };
      
      jest.spyOn(Card, 'findById').mockResolvedValueOnce(mockCard as any);
      jest.spyOn(Deck, 'findById').mockResolvedValueOnce(mockDeck as any);
      
      await cardController.updateCard(
        mockRequest as Request,
        mockResponse as Response
      );
      
      expect(mockCard.front).toBe('Updated Front');
      expect(mockCard.back).toBe('Updated Back');
      expect(mockCard.save).toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(responseObject.message).toBe('Card updated successfully');
    });
    
    // Other test cases for updateCard would follow the same pattern as getCard tests
    // (404 for card not found, 404 for deck not found, 403 for no permission)
  });
  
  describe('deleteCard', () => {
    const mockCardId = new mongoose.Types.ObjectId();
    
    beforeEach(() => {
      mockRequest.params = { id: mockCardId.toString() };
    });
    
    it('should delete a card successfully', async () => {
      const mockCard = {
        _id: mockCardId,
        deckId: mockDeckId
      };
      
      const mockDeck = {
        _id: mockDeckId,
        userId: mockUserId
      };
      
      jest.spyOn(Card, 'findById').mockResolvedValueOnce(mockCard as any);
      jest.spyOn(Deck, 'findById').mockResolvedValueOnce(mockDeck as any);
      jest.spyOn(Card, 'findByIdAndDelete').mockResolvedValueOnce({} as any);
      
      await cardController.deleteCard(
        mockRequest as Request,
        mockResponse as Response
      );
      
      expect(Card.findByIdAndDelete).toHaveBeenCalledWith(mockCardId.toString());
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(responseObject.message).toBe('Card deleted successfully');
    });
    
    // Other test cases for deleteCard would follow the same pattern as getCard tests
    // (404 for card not found, 404 for deck not found, 403 for no permission)
  });
  
  describe('reviewCard', () => {
    const mockCardId = new mongoose.Types.ObjectId();
    
    beforeEach(() => {
      mockRequest.params = { id: mockCardId.toString() };
      mockRequest.body = { performance: 3 }; // Medium difficulty
      
      // Mock Date.now
      jest.spyOn(global.Date, 'now').mockImplementation(() => 1618042800000); // Fixed timestamp
    });
    
    afterEach(() => {
      // Restore Date.now
      jest.restoreAllMocks();
    });
    
    it('should return 400 if performance rating is invalid', async () => {
      mockRequest.body = { performance: 0 }; // Invalid rating (must be 1-5)
      
      await cardController.reviewCard(
        mockRequest as Request,
        mockResponse as Response
      );
      
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(responseObject.message).toBe('Valid performance rating (1-5) is required');
    });
    
    it('should record a review successfully', async () => {
      const mockCard = {
        _id: mockCardId,
        deckId: mockDeckId,
        nextReviewDate: new Date(),
        reviewHistory: [] as ReviewRecord[],
        difficulty: 1,
        save: jest.fn().mockResolvedValue(true)
      };
      
      const mockDeck = {
        _id: mockDeckId,
        userId: mockUserId,
        isPublic: true
      };
      
      jest.spyOn(Card, 'findById').mockResolvedValueOnce(mockCard as any);
      jest.spyOn(Deck, 'findById').mockResolvedValueOnce(mockDeck as any);
      
      await cardController.reviewCard(
        mockRequest as Request,
        mockResponse as Response
      );
      
      // Check that review was recorded
      expect(mockCard.reviewHistory.length).toBe(1);
      expect(mockCard.reviewHistory[0]?.performance).toBe(3);
      expect(mockCard.save).toHaveBeenCalled();
      
      // Check response
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(responseObject.message).toBe('Review recorded successfully');
      expect(responseObject.nextReviewDate).toBeDefined();
      expect(responseObject.card).toBeDefined();
    });
    
    it('should update card difficulty based on review performance', async () => {
      // Card with existing review history
      const mockCard = {
        _id: mockCardId,
        deckId: mockDeckId,
        nextReviewDate: new Date(),
        reviewHistory: [
          { date: new Date(), performance: 2 },
          { date: new Date(), performance: 1 }
        ] as ReviewRecord[],
        difficulty: 3,
        save: jest.fn().mockResolvedValue(true)
      };
      
      const mockDeck = {
        _id: mockDeckId,
        userId: mockUserId,
        isPublic: true
      };
      
      jest.spyOn(Card, 'findById').mockResolvedValueOnce(mockCard as any);
      jest.spyOn(Deck, 'findById').mockResolvedValueOnce(mockDeck as any);
      
      // Set a high performance value
      mockRequest.body = { performance: 5 }; // Very easy
      
      await cardController.reviewCard(
        mockRequest as Request,
        mockResponse as Response
      );
      
      // With performance of 5 and previous performances of [2, 1], 
      // the new average should be (5+2+1)/3 = 2.67
      // When inverted (6 - avg), it should be around 3.33, but rounded to 1 decimal
      expect(parseFloat(mockCard.difficulty.toFixed(1))).toBeCloseTo(3.3, 1);
      
      // Check that next review date is set further in the future for easy cards
      const reviewDate = new Date(responseObject.nextReviewDate);
      const now = new Date(global.Date.now());
      const daysDiff = Math.round((reviewDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      expect(daysDiff).toBeGreaterThanOrEqual(10); // For performance 5, next review is 14 days
    });
  });
});