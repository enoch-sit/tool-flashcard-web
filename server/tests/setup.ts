/// <reference path="./jest.d.ts" />

// Jest setup file for server tests
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongoServer: MongoMemoryServer;

// Connect to a new in-memory database before running any tests
beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  
  await mongoose.connect(uri);
});

// Clear all test data after each test
afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    const collection = collections[key];
    await collection.deleteMany({});
  }
});

// Disconnect and close connection after all tests
afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});