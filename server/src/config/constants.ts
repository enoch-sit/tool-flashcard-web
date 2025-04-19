// Credit costs for various operations
export const CARD_CREATION_COST = 1; // Cost to create a new flashcard
export const INITIAL_SIGNUP_CREDITS = 10; // Initial credits for new users

// Credit package configurations
export const CREDIT_PACKAGES = {
  SMALL: {
    name: 'Small Package',
    credits: 50,
    price: 499 // $4.99 in cents
  },
  MEDIUM: {
    name: 'Medium Package',
    credits: 125,
    price: 999 // $9.99 in cents
  },
  LARGE: {
    name: 'Large Package',
    credits: 300,
    price: 1999 // $19.99 in cents
  }
};

// Authentication constants
export const JWT_COOKIE_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

// API integration
export const AUTH_API_URL = process.env.AUTH_API_URL || 'http://localhost:3000';

// Pagination defaults
export const DEFAULT_PAGE_SIZE = 20;

// MongoDB connection
export const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/flashcard_db';

// Server config
export const PORT = process.env.PORT || 4000;
export const NODE_ENV = process.env.NODE_ENV || 'development';