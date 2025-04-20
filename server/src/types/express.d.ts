// This file extends the Express Request type to include the user property
// which is added by our authentication middleware

import { Request } from 'express';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        [key: string]: any;  // Allow for additional user properties
      };
    }
  }
}

// Make this file a module to ensure the declarations apply
export {};