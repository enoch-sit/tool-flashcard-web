import '../types.d.ts'; // Import custom type definitions

import mongoose from 'mongoose';
import { Request, Response } from 'express';
import * as deckController from '../../src/controllers/deck.controller';
import { Deck, Card } from '../../src/models';

describe('Deck Controller Tests', () => {
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
      query: {}, // Ensure query is initialized
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
  
  describe('getDecksByUser', () => {
    it('should return all decks for the authenticated user', async () => {
      // Mock decks
      const mockDecks = [
        { _id: new mongoose.Types.ObjectId(), name: 'Deck 1', userId: mockUserId },
        { _id: new mongoose.Types.ObjectId(), name: 'Deck 2', userId: mockUserId }
      ];
      
      jest.spyOn(Deck, 'find').mockReturnValueOnce({
        sort: jest.fn().mockResolvedValueOnce(mockDecks)
      } as any);
      
      await deckController.getDecksByUser(
        mockRequest as Request,
        mockResponse as Response
      );
      
      expect(Deck.find).toHaveBeenCalledWith({ userId: mockUserId });
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(responseObject.decks).toEqual(mockDecks);
      expect(responseObject.count).toBe(2);
    });
    
    it('should return an empty array if user has no decks', async () => {
      // Mock empty results
      jest.spyOn(Deck, 'find').mockReturnValueOnce({
        sort: jest.fn().mockResolvedValueOnce([])
      } as any);
      
      await deckController.getDecksByUser(
        mockRequest as Request,
        mockResponse as Response
      );
      
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(responseObject.decks).toEqual([]);
      expect(responseObject.count).toBe(0);
    });
    
    it('should handle server errors properly', async () => {
      // Mock a database error
      jest.spyOn(Deck, 'find').mockReturnValueOnce({
        sort: jest.fn().mockRejectedValueOnce(new Error('Database error'))
      } as any);
      
      await deckController.getDecksByUser(
        mockRequest as Request,
        mockResponse as Response
      );
      
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(responseObject.message).toBe('Failed to fetch decks');
    });
  });
  
  describe('createDeck', () => {
    beforeEach(() => {
      // Set up request with valid deck data
      mockRequest.body = {
        name: 'Test Deck',
        description: 'Test Description',
        isPublic: false,
        tags: ['test', 'sample']
      };
      
      // Mock Deck.create
      const mockDeck = {
        _id: new mongoose.Types.ObjectId(),
        userId: mockUserId,
        name: 'Test Deck',
        description: 'Test Description',
        isPublic: false,
        tags: ['test', 'sample'],
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      jest.spyOn(Deck, 'create').mockResolvedValue(mockDeck as any);
    });
    
    it('should create a deck successfully', async () => {
      await deckController.createDeck(
        mockRequest as Request,
        mockResponse as Response
      );
      
      expect(Deck.create).toHaveBeenCalledWith(expect.objectContaining({
        userId: mockUserId,
        name: 'Test Deck',
        description: 'Test Description',
        isPublic: false,
        tags: ['test', 'sample']
      }));
      
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(responseObject.message).toBe('Deck created successfully');
      expect(responseObject.deck).toBeDefined();
    });
    
    it('should return 400 if name is missing', async () => {
      mockRequest.body = {
        description: 'Test Description'
      };
      
      await deckController.createDeck(
        mockRequest as Request,
        mockResponse as Response
      );
      
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(responseObject.message).toBe('Deck name is required');
    });
    
    it('should create a deck with default values if optional fields are not provided', async () => {
      mockRequest.body = {
        name: 'Test Deck'
      };
      
      await deckController.createDeck(
        mockRequest as Request,
        mockResponse as Response
      );
      
      expect(Deck.create).toHaveBeenCalledWith(expect.objectContaining({
        userId: mockUserId,
        name: 'Test Deck',
        description: '',
        isPublic: false,
        tags: []
      }));
      
      expect(mockResponse.status).toHaveBeenCalledWith(201);
    });
    
    it('should handle server errors properly', async () => {
      jest.spyOn(Deck, 'create').mockRejectedValueOnce(new Error('Database error'));
      
      await deckController.createDeck(
        mockRequest as Request,
        mockResponse as Response
      );
      
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(responseObject.message).toBe('Failed to create deck');
    });
  });
  
  describe('getDeck', () => {
    const mockDeckId = new mongoose.Types.ObjectId();
    
    beforeEach(() => {
      mockRequest.params = { id: mockDeckId.toString() };
    });
    
    it('should return 404 if deck does not exist', async () => {
      jest.spyOn(Deck, 'findById').mockResolvedValueOnce(null);
      
      await deckController.getDeck(
        mockRequest as Request,
        mockResponse as Response
      );
      
      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(responseObject.message).toBe('Deck not found');
    });
    
    it('should return 403 if user does not have access to a private deck', async () => {
      const mockDeck = {
        _id: mockDeckId,
        userId: new mongoose.Types.ObjectId().toString(), // Different user ID
        isPublic: false
      };
      
      jest.spyOn(Deck, 'findById').mockResolvedValueOnce(mockDeck as any);
      
      await deckController.getDeck(
        mockRequest as Request,
        mockResponse as Response
      );
      
      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(responseObject.message).toBe('You do not have access to this deck');
    });
    
    it('should return the deck and card count if user is the owner', async () => {
      const mockDeck = {
        _id: mockDeckId,
        userId: mockUserId,
        isPublic: false,
        name: 'Test Deck'
      };
      
      jest.spyOn(Deck, 'findById').mockResolvedValueOnce(mockDeck as any);
      jest.spyOn(Card, 'countDocuments').mockResolvedValueOnce(5);
      
      await deckController.getDeck(
        mockRequest as Request,
        mockResponse as Response
      );
      
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(responseObject.deck).toEqual(mockDeck);
      expect(responseObject.cardCount).toBe(5);
    });
    
    it('should return the deck if it is public', async () => {
      const mockDeck = {
        _id: mockDeckId,
        userId: new mongoose.Types.ObjectId().toString(), // Different user ID
        isPublic: true,
        name: 'Public Deck'
      };
      
      jest.spyOn(Deck, 'findById').mockResolvedValueOnce(mockDeck as any);
      jest.spyOn(Card, 'countDocuments').mockResolvedValueOnce(3);
      
      await deckController.getDeck(
        mockRequest as Request,
        mockResponse as Response
      );
      
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(responseObject.deck).toEqual(mockDeck);
      expect(responseObject.cardCount).toBe(3);
    });
  });
  
  describe('updateDeck', () => {
    const mockDeckId = new mongoose.Types.ObjectId();
    
    beforeEach(() => {
      mockRequest.params = { id: mockDeckId.toString() };
      mockRequest.body = {
        name: 'Updated Name',
        description: 'Updated Description',
        isPublic: true,
        tags: ['updated', 'tags']
      };
    });
    
    it('should update a deck successfully', async () => {
      const mockDeck = {
        _id: mockDeckId,
        userId: mockUserId,
        name: 'Old Name',
        description: 'Old Description',
        isPublic: false,
        tags: ['old'],
        save: jest.fn().mockResolvedValue(true)
      };
      
      jest.spyOn(Deck, 'findById').mockResolvedValueOnce(mockDeck as any);
      
      await deckController.updateDeck(
        mockRequest as Request,
        mockResponse as Response
      );
      
      expect(mockDeck.name).toBe('Updated Name');
      expect(mockDeck.description).toBe('Updated Description');
      expect(mockDeck.isPublic).toBe(true);
      expect(mockDeck.tags).toEqual(['updated', 'tags']);
      expect(mockDeck.save).toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(responseObject.message).toBe('Deck updated successfully');
    });
    
    it('should return 404 if deck does not exist', async () => {
      jest.spyOn(Deck, 'findById').mockResolvedValueOnce(null);
      
      await deckController.updateDeck(
        mockRequest as Request,
        mockResponse as Response
      );
      
      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(responseObject.message).toBe('Deck not found');
    });
    
    it('should return 403 if user does not own the deck', async () => {
      const mockDeck = {
        _id: mockDeckId,
        userId: new mongoose.Types.ObjectId().toString() // Different user ID
      };
      
      jest.spyOn(Deck, 'findById').mockResolvedValueOnce(mockDeck as any);
      
      await deckController.updateDeck(
        mockRequest as Request,
        mockResponse as Response
      );
      
      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(responseObject.message).toBe('You do not have permission to update this deck');
    });
    
    it('should update only provided fields', async () => {
      const mockDeck = {
        _id: mockDeckId,
        userId: mockUserId,
        name: 'Old Name',
        description: 'Old Description',
        isPublic: false,
        tags: ['old'],
        save: jest.fn().mockResolvedValue(true)
      };
      
      jest.spyOn(Deck, 'findById').mockResolvedValueOnce(mockDeck as any);
      
      // Only update the name
      mockRequest.body = {
        name: 'Updated Name Only'
      };
      
      await deckController.updateDeck(
        mockRequest as Request,
        mockResponse as Response
      );
      
      expect(mockDeck.name).toBe('Updated Name Only');
      // These should not change
      expect(mockDeck.description).toBe('Old Description');
      expect(mockDeck.isPublic).toBe(false);
      expect(mockDeck.tags).toEqual(['old']);
      expect(mockDeck.save).toHaveBeenCalled();
    });
  });
  
  describe('deleteDeck', () => {
    const mockDeckId = new mongoose.Types.ObjectId();
    
    beforeEach(() => {
      mockRequest.params = { id: mockDeckId.toString() };
    });
    
    it('should delete a deck and its cards successfully', async () => {
      const mockDeck = {
        _id: mockDeckId,
        userId: mockUserId
      };
      
      jest.spyOn(Deck, 'findById').mockResolvedValueOnce(mockDeck as any);
      jest.spyOn(Card, 'deleteMany').mockResolvedValueOnce({ deletedCount: 5 } as any);
      jest.spyOn(Deck, 'findByIdAndDelete').mockResolvedValueOnce(mockDeck as any);
      
      await deckController.deleteDeck(
        mockRequest as Request,
        mockResponse as Response
      );
      
      expect(Card.deleteMany).toHaveBeenCalledWith({ deckId: mockDeckId.toString() });
      expect(Deck.findByIdAndDelete).toHaveBeenCalledWith(mockDeckId.toString());
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(responseObject.message).toBe('Deck and all associated cards deleted successfully');
    });
    
    it('should return 404 if deck does not exist', async () => {
      jest.spyOn(Deck, 'findById').mockResolvedValueOnce(null);
      
      await deckController.deleteDeck(
        mockRequest as Request,
        mockResponse as Response
      );
      
      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(responseObject.message).toBe('Deck not found');
    });
    
    it('should return 403 if user does not own the deck', async () => {
      const mockDeck = {
        _id: mockDeckId,
        userId: new mongoose.Types.ObjectId().toString() // Different user ID
      };
      
      jest.spyOn(Deck, 'findById').mockResolvedValueOnce(mockDeck as any);
      
      await deckController.deleteDeck(
        mockRequest as Request,
        mockResponse as Response
      );
      
      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(responseObject.message).toBe('You do not have permission to delete this deck');
    });
  });
  
  describe('getPublicDecks', () => {
    beforeEach(() => {
      // Set default query params
      mockRequest.query = {
        page: '1',
        limit: '10'
      };
      
      // Mock decks
      const mockDecks = [
        { _id: new mongoose.Types.ObjectId(), name: 'Public Deck 1', isPublic: true },
        { _id: new mongoose.Types.ObjectId(), name: 'Public Deck 2', isPublic: true }
      ];
      
      jest.spyOn(Deck, 'find').mockReturnValueOnce({
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue(mockDecks)
      } as any);
      
      jest.spyOn(Deck, 'countDocuments').mockResolvedValue(2);
    });
    
    it('should return public decks with pagination', async () => {
      await deckController.getPublicDecks(
        mockRequest as Request,
        mockResponse as Response
      );
      
      expect(Deck.find).toHaveBeenCalledWith({ isPublic: true });
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(responseObject.decks).toBeDefined();
      expect(responseObject.pagination).toBeDefined();
      expect(responseObject.pagination.page).toBe(1);
      expect(responseObject.pagination.total).toBe(2);
    });
    
    it('should filter decks by search query', async () => {
      mockRequest.query = mockRequest.query || {};
      mockRequest.query.query = 'javascript';
      
      await deckController.getPublicDecks(
        mockRequest as Request,
        mockResponse as Response
      );
      
      expect(Deck.find).toHaveBeenCalledWith(expect.objectContaining({
        $or: expect.any(Array)
      }));
    });
    
    it('should handle pagination correctly', async () => {
      mockRequest.query = mockRequest.query || {};
      mockRequest.query.page = '2';
      mockRequest.query.limit = '5';
      
      await deckController.getPublicDecks(
        mockRequest as Request,
        mockResponse as Response
      );
      
      // Skip should be (page-1) * limit = 5
      const skipFn = (Deck.find as jest.Mock).mock.results[0].value.skip;
      expect(skipFn).toHaveBeenCalledWith(5);
      
      const limitFn = (Deck.find as jest.Mock).mock.results[0].value.limit;
      expect(limitFn).toHaveBeenCalledWith(5);
      
      expect(responseObject.pagination.page).toBe(2);
    });
  });
});