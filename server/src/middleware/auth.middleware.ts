import { Request, Response, NextFunction } from 'express';
import axios from 'axios';
import jwt from 'jsonwebtoken';
import { AUTH_API_URL } from '../config/constants';

// Extend the Request interface to include the user property
declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

/**
 * Middleware to validate JWT token and protect routes
 */
export const authenticateJwt = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    const token = authHeader.split(' ')[1];
    
    // Check if JWT_ACCESS_SECRET is available for local verification
    const jwtSecret = process.env.JWT_ACCESS_SECRET;
    
    if (jwtSecret) {
      // Perform local token verification
      try {
        const decoded = jwt.verify(token, jwtSecret);
        req.user = decoded;
        next();
        return;
      } catch (jwtError) {
        console.log('Local JWT verification failed, falling back to remote validation');
        // If local verification fails, fall back to remote validation
      }
    }
    
    // If no JWT secret available or local verification failed, validate token with auth service
    try {
      const response = await axios.post(`${AUTH_API_URL}/api/auth/validate-token`, { token });
      
      if (response.data && response.data.valid) {
        // Store user info from the token in the request object
        req.user = response.data.user;
        next();
      } else {
        return res.status(401).json({ message: 'Invalid token' });
      }
    } catch (error) {
      return res.status(401).json({ message: 'Token validation failed' });
    }
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Middleware to check if user has admin role
 */
export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin privileges required' });
  }
  
  next();
};