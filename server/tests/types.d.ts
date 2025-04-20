// This file provides global type declarations for Jest testing functions
// Explicitly declaring Jest globals to help TypeScript recognize them

import '@types/jest';
import { Request } from 'express';

declare global {
  // Jest globals
  const describe: jest.Describe;
  const test: jest.It;
  const it: jest.It;
  const expect: jest.Expect;
  const beforeAll: jest.Lifecycle;
  const beforeEach: jest.Lifecycle;
  const afterAll: jest.Lifecycle;
  const afterEach: jest.Lifecycle;
  const jest: jest.Jest;
  
  // Express extensions
  namespace Express {
    interface Request {
      user?: {
        id: string;
        [key: string]: any;  // Allow for additional user properties
      };
    }
  }
}

// Make this file a module to ensure the global declarations apply
export {};