# Flashcard Web Application

A comprehensive web-based flashcard application with credit-based system for creating and reviewing flashcards.

## Table of Contents

- [Flashcard Web Application](#flashcard-web-application)
  - [Table of Contents](#table-of-contents)
  - [Features](#features)
  - [Technology Stack](#technology-stack)
  - [Getting Started](#getting-started)
    - [Prerequisites](#prerequisites)
    - [Installation](#installation)
    - [Running Locally](#running-locally)
    - [Docker Setup](#docker-setup)
  - [API Documentation](#api-documentation)
    - [Authentication Endpoints](#authentication-endpoints)
    - [Card Endpoints](#card-endpoints)
    - [Deck Endpoints](#deck-endpoints)
    - [Credit System Endpoints](#credit-system-endpoints)
    - [Admin Endpoints](#admin-endpoints)
  - [Project Structure](#project-structure)
  - [Contributing](#contributing)
  - [License](#license)

## Features

- User authentication and account management
- Create and manage decks of flashcards
- Interactive flashcard review system with spaced repetition
- Credit-based system for creating new cards
- Admin panel for managing users and credit packages
- Responsive design for desktop and mobile use

## Technology Stack

- **Frontend**: React, TypeScript, CSS
- **Backend**: Node.js, Express, TypeScript
- **Database**: MongoDB
- **Authentication**: JWT-based authentication
- **Containerization**: Docker

## Getting Started

### Prerequisites

- Node.js (v14+)
- npm or yarn
- MongoDB (or Docker for containerized setup)
- Docker and Docker Compose (for containerized setup)

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/enoch-sit/tool-flashcard-web.git
   cd flashcard-web
   ```

2. Install dependencies for client and server:

   ```bash
   # Install client dependencies
   cd client
   npm install
   
   # Install server dependencies
   cd ../server
   npm install
   ```

### Running Locally

1. Start the MongoDB service on your machine or use Docker:

   ```bash
   # Using Docker
   docker run -d -p 27017:27017 --name mongodb mongo:latest
   ```

2. Start the server:

   ```bash
   cd server
   npm run dev
   ```

3. Start the client:

   ```bash
   cd client
   npm start
   ```

4. Open your browser and navigate to `http://localhost:3000`

### Docker Setup

The application includes Docker configuration for easy deployment:

1. Make sure Docker and Docker Compose are installed on your system.

2. The application requires an external auth network. Make sure it exists or create it:

   ```bash
   docker network create boilerplate-accounting-nodejs-typescript_auth-network
   ```

3. Build and start the containers:

   ```bash
   docker-compose up -d
   ```

4. Access the application at `http://localhost`

For standalone mode (including mock auth service):

```bash
docker-compose -f docker-compose.standalone.yml up -d
```

## API Documentation

### Authentication Endpoints

| Endpoint | Method | Description | Access Level |
|----------|--------|-------------|--------------|
| `/api/auth/signup` | POST | Register a new user | Public |
| `/api/auth/verify-email` | POST | Verify email with token | Public |
| `/api/auth/resend-verification` | POST | Resend verification code | Public |
| `/api/auth/login` | POST | Login with credentials | Public |
| `/api/auth/refresh` | POST | Refresh access token | Public |
| `/api/auth/logout` | POST | Logout (invalidate token) | Public |
| `/api/auth/logout-all` | POST | Logout from all devices | Authenticated |
| `/api/auth/forgot-password` | POST | Request password reset | Public |
| `/api/auth/reset-password` | POST | Reset password with token | Public |

### Card Endpoints

| Endpoint | Method | Description | Access Level |
|----------|--------|-------------|--------------|
| `/api/cards/deck/:deckId` | GET | Get all cards for a specific deck | Authenticated |
| `/api/cards` | POST | Create a new card (costs credits) | Authenticated |
| `/api/cards/:id` | GET | Get a specific card | Authenticated |
| `/api/cards/:id` | PUT | Update a specific card | Authenticated |
| `/api/cards/:id` | DELETE | Delete a specific card | Authenticated |
| `/api/cards/:id/review` | POST | Record a review result for a card | Authenticated |

### Deck Endpoints

| Endpoint | Method | Description | Access Level |
|----------|--------|-------------|--------------|
| `/api/decks` | GET | Get all decks for user | Authenticated |
| `/api/decks` | POST | Create a new deck | Authenticated |
| `/api/decks/:id` | GET | Get a specific deck | Authenticated |
| `/api/decks/:id` | PUT | Update a specific deck | Authenticated |
| `/api/decks/:id` | DELETE | Delete a specific deck | Authenticated |

### Credit System Endpoints

| Endpoint | Method | Description | Access Level |
|----------|--------|-------------|--------------|
| `/api/credits/balance` | GET | Get user's credit balance | Authenticated |
| `/api/credits/packages` | GET | Get available credit packages | Authenticated |
| `/api/credits/purchase` | POST | Purchase a credit package | Authenticated |
| `/api/credits/history` | GET | Get transaction history | Authenticated |

### Admin Endpoints

| Endpoint | Method | Description | Access Level |
|----------|--------|-------------|--------------|
| `/api/admin/users` | GET | Get all users with credits | Admin |
| `/api/admin/users/:userId/credits` | POST | Adjust user credits | Admin |
| `/api/admin/packages` | GET | Get all credit packages | Admin |
| `/api/admin/packages` | POST | Create a credit package | Admin |
| `/api/admin/packages/:id` | PUT | Update a credit package | Admin |
| `/api/admin/packages/:id` | DELETE | Delete a credit package | Admin |
| `/api/admin/transactions` | GET | Get all credit transactions | Admin |

## Project Structure

```
flashcard-web/
├── client/                 # React frontend application
│   ├── public/
│   └── src/
│       ├── components/     # Reusable components
│       ├── contexts/       # React context providers
│       ├── pages/          # Page components
│       └── services/       # API service functions
├── server/                 # Node.js Express backend
│   └── src/
│       ├── config/         # Application configuration
│       ├── controllers/    # Request handlers
│       ├── middleware/     # Express middleware
│       ├── models/         # MongoDB schema models
│       ├── routes/         # API routes
│       ├── services/       # Business logic services
│       └── utils/          # Utility functions
└── docker/                 # Docker configuration files
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
