# Flash Card Application Documentation

## Overview

This document provides comprehensive documentation for the credit-based flash card application that integrates with the Simple Authentication and Accounting System. The application allows users to create and study flash cards, with a credit-based system for card creation.

## Table of Contents

1. [System Requirements](#system-requirements)
2. [Installation](#installation)
3. [Docker Setup](#docker-setup)
4. [Running the Application](#running-the-application)
5. [API Documentation](#api-documentation)
6. [Frontend Usage](#frontend-usage)
7. [Credit System](#credit-system)
8. [Admin Dashboard](#admin-dashboard)
9. [Troubleshooting](#troubleshooting)
10. [Security Considerations](#security-considerations)
11. [Advanced Configuration](#advanced-configuration)
12. [Future Development](#future-development)

## System Requirements

Before you begin, ensure you have installed:

- [Node.js](https://nodejs.org/) (v18+ recommended)
- [npm](https://www.npmjs.com/) or [pnpm](https://pnpm.io/)
- [Docker](https://www.docker.com/get-started) and Docker Compose

## Installation

### Option 1: Using Docker (Recommended)

The application is containerized with Docker, making it easy to set up and run without installing dependencies locally.

1. **Clone the repository**:

   ```bash
   git clone <repository-url>
   cd flashcard-web
   ```

2. **Build and start with Docker Compose**:

   ```bash
   docker-compose up -d
   ```

   This command will:
   - Build and start the client (React frontend)
   - Build and start the server (Express backend)
   - Start MongoDB
   - Configure Nginx for routing

### Option 2: Manual Setup

If you prefer to run the application without Docker:

1. **Clone the repository**:

   ```bash
   git clone <repository-url>
   cd flashcard-web
   ```

2. **Install and run the server**:

   ```bash
   cd server
   npm install
   # or
   pnpm install

   # Start the server
   npm run dev
   # or
   pnpm dev
   ```

3. **Install and run the client**:

   ```bash
   cd client
   npm install
   # or
   pnpm install

   # Start the client
   npm run dev
   # or
   pnpm dev
   ```

4. **Set up MongoDB**:
   - Ensure MongoDB is installed and running locally
   - Update connection string in server configuration if needed

## Docker Setup

The application uses Docker Compose for containerization and orchestration.

### Docker Compose Files

- **docker-compose.yml**: Main configuration for development
- **docker-compose.standalone.yml**: Configuration for standalone deployment without external auth system

### Starting the Application with Docker

```bash
# Start all services
docker-compose up -d

# Start only specific services
docker-compose up -d client server

# Start in standalone mode (with mock auth)
docker-compose -f docker-compose.standalone.yml up -d
```

### Viewing Logs

```bash
# View logs from all services
docker-compose logs -f

# View logs from a specific service
docker-compose logs -f server
```

### Container Management

```bash
# Stop all containers
docker-compose down

# Rebuild and restart containers
docker-compose up -d --build
```

## Running the Application

After starting the application, you can access:

- **Frontend**: <http://localhost:80>
- **Backend API**: <http://localhost:4000>
- **Admin Dashboard**: <http://localhost:80/admin>

## API Documentation

### Authentication

The application integrates with the existing Simple Authentication and Accounting System. All API endpoints that require authentication expect a JWT token in the Authorization header.

```
Authorization: Bearer <your-jwt-token>
```

### API Base URL

For local development: `http://localhost:4000/api`

### API Endpoints

#### Deck Management

| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|--------------|
| `/api/decks` | GET | Get all decks for the authenticated user | Yes |
| `/api/decks/public` | GET | Get all public decks | Yes |
| `/api/decks` | POST | Create a new deck | Yes |
| `/api/decks/:id` | GET | Get a specific deck | Yes |
| `/api/decks/:id` | PUT | Update a deck | Yes |
| `/api/decks/:id` | DELETE | Delete a deck | Yes |

#### Card Management

| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|--------------|
| `/api/decks/:deckId/cards` | GET | Get all cards in a deck | Yes |
| `/api/decks/:deckId/cards` | POST | Create a new card (costs credits) | Yes |
| `/api/cards/:id` | GET | Get a specific card | Yes |
| `/api/cards/:id` | PUT | Update a card | Yes |
| `/api/cards/:id` | DELETE | Delete a card | Yes |

#### Study Sessions

| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|--------------|
| `/api/decks/:deckId/study` | POST | Start a study session | Yes |
| `/api/cards/:id/review` | POST | Record a review result for a card | Yes |

#### Credit Management

| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|--------------|
| `/api/credits` | GET | Get current user's credit balance | Yes |
| `/api/credits/history` | GET | Get credit transaction history | Yes |
| `/api/credits/purchase` | POST | Purchase credits (mock payment) | Yes |

#### Admin Endpoints

| Endpoint | Method | Description | Auth Required | Admin Only |
|----------|--------|-------------|--------------|------------|
| `/api/admin/users` | GET | Get all users with credit information | Yes | Yes |
| `/api/admin/users/:userId/credits` | POST | Adjust credits for a user | Yes | Yes |
| `/api/admin/credits/transactions` | GET | View all credit transactions | Yes | Yes |
| `/api/admin/packages` | GET | Get all credit packages | Yes | Yes |
| `/api/admin/packages` | POST | Create a credit package | Yes | Yes |
| `/api/admin/packages/:id` | PUT | Update a credit package | Yes | Yes |
| `/api/admin/packages/:id` | DELETE | Delete a credit package | Yes | Yes |

### API Examples

#### Creating a New Deck

**Request:**

```json
POST /api/decks
Content-Type: application/json
Authorization: Bearer <your-jwt-token>

{
  "name": "Spanish Vocabulary",
  "description": "Common Spanish words and phrases",
  "isPublic": false,
  "tags": ["language", "spanish", "beginner"]
}
```

**Response:**

```json
{
  "message": "Deck created successfully",
  "deck": {
    "_id": "60a1e2c3d4e5f6a7b8c9d0e1",
    "userId": "507f1f77bcf86cd799439011",
    "name": "Spanish Vocabulary",
    "description": "Common Spanish words and phrases",
    "isPublic": false,
    "tags": ["language", "spanish", "beginner"],
    "createdAt": "2025-04-19T10:30:00Z",
    "updatedAt": "2025-04-19T10:30:00Z"
  }
}
```

#### Creating a New Card

**Request:**

```json
POST /api/decks/60a1e2c3d4e5f6a7b8c9d0e1/cards
Content-Type: application/json
Authorization: Bearer <your-jwt-token>

{
  "front": "Hello",
  "back": "Hola"
}
```

**Response:**

```json
{
  "message": "Card created successfully",
  "card": {
    "_id": "60a1e2c3d4e5f6a7b8c9d0e2",
    "deckId": "60a1e2c3d4e5f6a7b8c9d0e1",
    "front": "Hello",
    "back": "Hola",
    "difficulty": 1,
    "nextReviewDate": "2025-04-20T10:30:00Z",
    "reviewHistory": [],
    "createdAt": "2025-04-19T10:30:00Z",
    "updatedAt": "2025-04-19T10:30:00Z"
  },
  "creditDeducted": 1
}
```

#### Getting Credit Balance

**Request:**

```
GET /api/credits
Authorization: Bearer <your-jwt-token>
```

**Response:**

```json
{
  "balance": 45,
  "lastUpdated": "2025-04-19T10:15:00Z"
}
```

## Credit System

The application uses a credit-based system for card creation:

1. **Credit Usage**:
   - Creating a new card: 1 credit
   - Creating a new deck: Free
   - Reviewing cards: Free
   - Studying public decks: Free

2. **Credit Acquisition**:
   - Initial signup bonus: 10 credits
   - Purchasing credit packages from store
   - Admin grants

3. **Credit Packages** (default configuration):
   - Small: 50 credits for $4.99
   - Medium: 125 credits for $9.99
   - Large: 300 credits for $19.99

## Admin Dashboard

The admin dashboard provides tools for system management:

1. **User Management**:
   - View all registered users
   - Check user credit balances
   - Grant additional credits to users
   - View user activity statistics

2. **Credit Package Management**:
   - Create, update, and delete credit packages
   - Set pricing and credit amounts
   - Configure package availability

3. **Transaction History**:
   - View all credit transactions across the system
   - Filter transactions by user, date, or transaction type
   - Export transaction data for reporting

4. **System Statistics**:
   - View total active users
   - Track credit usage patterns
   - Monitor card creation activity

### Accessing the Admin Dashboard

The admin dashboard is available at `http://localhost:80/admin` and requires admin-level authentication. Admins are users with the admin role in the authentication system.

## Frontend Usage

### User Interface

The application features an intuitive user interface with the following sections:

1. **Dashboard**:
   - Overview of user's decks
   - Credit balance display
   - Quick access to recent decks

2. **Deck Management**:
   - Create new decks
   - Browse and edit existing decks
   - Search and filter decks

3. **Study Mode**:
   - Spaced repetition algorithm for optimal learning
   - Performance tracking
   - Difficulty rating for cards

4. **Card Editor**:
   - Create and edit cards
   - Bulk card import
   - Media attachment support

### Study Techniques

The application implements proven study techniques:

1. **Spaced Repetition**:
   - Cards appear less frequently as you master them
   - Difficult cards appear more frequently

2. **Active Recall**:
   - Cards prompt you to actively recall information
   - Self-assessment of performance

3. **Interleaved Practice**:
   - Mix different topics for more effective learning
   - Configure study sessions to include multiple decks

### Credit Store

Users can purchase additional credits through the in-app store:

1. Navigate to the Store section
2. Choose a credit package
3. Complete the checkout process (mock payment in demo mode)
4. Credits are immediately added to the account

## Troubleshooting

### Common Issues

1. **Login Problems**:
   - Ensure you're using the correct credentials
   - Check that the authentication service is running
   - Verify your account is verified (if using email verification)

2. **Card Creation Issues**:
   - Confirm you have sufficient credits in your account
   - Check network connectivity
   - Verify the deck you're adding to still exists

3. **Docker Setup Problems**:
   - Ensure ports 80 and 4000 are available on your system
   - Check Docker is running with `docker info`
   - Verify Docker Compose is installed with `docker-compose --version`

4. **Study Session Not Saving Progress**:
   - Ensure you have a stable internet connection
   - Check browser localStorage settings
   - Verify the backend API is accessible

### Logs and Debugging

Access application logs for troubleshooting:

```bash
# Frontend logs
docker-compose logs -f client

# Backend logs
docker-compose logs -f server

# Database logs
docker-compose logs -f mongodb
```

### Support and Help

If you encounter issues not covered in this troubleshooting guide:

1. Check the GitHub repository issues section
2. Search the documentation for similar problems
3. Submit a detailed bug report with steps to reproduce

## Security Considerations

The application implements several security measures:

1. **Authentication**: JWT-based authentication via the Simple Authentication System
2. **Data Protection**: HTTPS for all API communications
3. **Input Validation**: Server-side validation of all user inputs
4. **Rate Limiting**: Protection against brute force attacks

## Advanced Configuration

For advanced users, the application supports several customization options:

1. **Environment Variables**:
   - Configure database connection settings
   - Set API timeouts and limits
   - Configure integration points

2. **Custom Styling**:
   - Edit CSS variables for theming
   - Modify component styling through the client source

3. **API Extensions**:
   - The server architecture supports adding custom endpoints
   - Extend the data models for additional functionality

## Future Development

Planned features for future releases:

1. **Enhanced Media Support**:
   - Audio attachments for language learning
   - Image recognition for science flashcards

2. **Advanced Analytics**:
   - Learning performance metrics
   - Study pattern analysis

3. **Collaborative Features**:
   - Shared deck editing
   - Classroom integration

---

Last updated: April 19, 2025
