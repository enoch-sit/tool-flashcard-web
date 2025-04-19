import { Request, Response } from 'express';
import Deck from '../models/deck.model';
import Card from '../models/card.model';

// Get all decks for the authenticated user
export const getDecksByUser = async (req: Request, res: Response) => {
  try {
    const userId = req.user.id;
    
    const decks = await Deck.find({ userId }).sort({ updatedAt: -1 });
    
    return res.status(200).json({
      count: decks.length,
      decks
    });
  } catch (error) {
    console.error('Error fetching decks:', error);
    return res.status(500).json({ message: 'Failed to fetch decks' });
  }
};

// Create a new deck
export const createDeck = async (req: Request, res: Response) => {
  try {
    const { name, description, isPublic, tags } = req.body;
    const userId = req.user.id;
    
    // Validate input
    if (!name) {
      return res.status(400).json({ message: 'Deck name is required' });
    }
    
    // Create the deck
    const deck = await Deck.create({
      userId,
      name,
      description: description || '',
      isPublic: isPublic || false,
      tags: tags || [],
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    return res.status(201).json({
      message: 'Deck created successfully',
      deck
    });
  } catch (error) {
    console.error('Error creating deck:', error);
    return res.status(500).json({ message: 'Failed to create deck' });
  }
};

// Get a specific deck
export const getDeck = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    const deck = await Deck.findById(id);
    if (!deck) {
      return res.status(404).json({ message: 'Deck not found' });
    }
    
    // Check if user has access to this deck
    if (!deck.isPublic && deck.userId.toString() !== userId) {
      return res.status(403).json({ message: 'You do not have access to this deck' });
    }
    
    // Get count of cards in the deck
    const cardCount = await Card.countDocuments({ deckId: id });
    
    return res.status(200).json({
      deck,
      cardCount
    });
  } catch (error) {
    console.error('Error fetching deck:', error);
    return res.status(500).json({ message: 'Failed to fetch deck' });
  }
};

// Update a deck
export const updateDeck = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description, isPublic, tags } = req.body;
    const userId = req.user.id;
    
    // Find the deck
    const deck = await Deck.findById(id);
    if (!deck) {
      return res.status(404).json({ message: 'Deck not found' });
    }
    
    // Check if user owns this deck
    if (deck.userId.toString() !== userId) {
      return res.status(403).json({ message: 'You do not have permission to update this deck' });
    }
    
    // Update deck fields
    if (name) deck.name = name;
    if (description !== undefined) deck.description = description;
    if (isPublic !== undefined) deck.isPublic = isPublic;
    if (tags) deck.tags = tags;
    
    deck.updatedAt = new Date();
    await deck.save();
    
    return res.status(200).json({
      message: 'Deck updated successfully',
      deck
    });
  } catch (error) {
    console.error('Error updating deck:', error);
    return res.status(500).json({ message: 'Failed to update deck' });
  }
};

// Delete a deck
export const deleteDeck = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    // Find the deck
    const deck = await Deck.findById(id);
    if (!deck) {
      return res.status(404).json({ message: 'Deck not found' });
    }
    
    // Check if user owns this deck
    if (deck.userId.toString() !== userId) {
      return res.status(403).json({ message: 'You do not have permission to delete this deck' });
    }
    
    // Delete all cards in this deck
    await Card.deleteMany({ deckId: id });
    
    // Delete the deck itself
    await Deck.findByIdAndDelete(id);
    
    return res.status(200).json({
      message: 'Deck and all associated cards deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting deck:', error);
    return res.status(500).json({ message: 'Failed to delete deck' });
  }
};

// Get public decks
export const getPublicDecks = async (req: Request, res: Response) => {
  try {
    const { query, page = 1, limit = 10 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    
    // Build filter
    const filter: any = { isPublic: true };
    
    // Add search if provided
    if (query) {
      filter.$or = [
        { name: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } },
        { tags: { $in: [new RegExp(String(query), 'i')] } }
      ];
    }
    
    // Get decks with pagination
    const decks = await Deck.find(filter)
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(Number(limit));
    
    // Get total count for pagination
    const total = await Deck.countDocuments(filter);
    
    return res.status(200).json({
      decks,
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching public decks:', error);
    return res.status(500).json({ message: 'Failed to fetch public decks' });
  }
};