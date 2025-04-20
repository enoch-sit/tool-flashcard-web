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
    - [Docker Development Workflow](#docker-development-workflow)
      - [Development Mode](#development-mode)
      - [Handling Code Updates](#handling-code-updates)
        - [Client-side Code Changes](#client-side-code-changes)
        - [Server-side Code Changes](#server-side-code-changes)
        - [Complete Rebuild](#complete-rebuild)
        - [Database Changes](#database-changes)
      - [Troubleshooting Common Issues](#troubleshooting-common-issues)
  - [API Documentation](#api-documentation)
    - [Authentication Endpoints](#authentication-endpoints)
    - [Card Endpoints](#card-endpoints)
    - [Deck Endpoints](#deck-endpoints)
    - [Credit System Endpoints](#credit-system-endpoints)
    - [Admin Endpoints](#admin-endpoints)
  - [Project Structure](#project-structure)
  - [JWT Authentication Configuration](#jwt-authentication-configuration)
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

### Docker Development Workflow

When developing with Docker, you'll need to rebuild and restart containers when making code changes. Below are instructions for managing the development workflow:

#### Development Mode

The application is configured for development with hot-reloading on both client and server sides, but Docker containers need special handling:

1. Start the application in development mode:

   ```bash
   docker-compose up -d
   ```

2. To monitor logs during development:

   ```bash
   # All containers
   docker-compose logs -f
   
   # Specific container (e.g., client or server)
   docker-compose logs -f client
   docker-compose logs -f server
   ```

#### Handling Code Updates

##### Client-side Code Changes

React client code has hot reloading enabled, so most frontend changes will be automatically applied when you save files. However, if you:

1. Install new npm packages
2. Modify package.json
3. Change webpack or other build configurations

You'll need to rebuild the client container:

```bash
# Rebuild just the client container
docker-compose build client
docker-compose up -d client
```

##### Server-side Code Changes

The server uses nodemon for auto-restarting on code changes, but in some cases, you may need to rebuild:

1. When installing new npm packages
2. When modifying package.json
3. When changing TypeScript configurations

To rebuild the server container:

```bash
# Rebuild just the server container
docker-compose build server
docker-compose up -d server
```

##### Complete Rebuild

For major changes affecting multiple services or Docker configurations:

```bash
# Stop all containers first
docker-compose down

# Rebuild all containers with no cache (for a clean build)
docker-compose build --no-cache

# Start everything up again
docker-compose up -d
```

##### Database Changes

If your schema changes affect the database structure:

1. For development data (that can be reset):

   ```bash
   docker-compose down -v  # This removes volumes!
   docker-compose up -d
   ```

2. For preserving data but updating the application:

   ```bash
   # Backup your data first if needed
   docker exec -it flashcard-web_mongo_1 mongodump --out /data/backup

   # Then rebuild and restart without removing volumes
   docker-compose build
   docker-compose down
   docker-compose up -d
   ```

#### Troubleshooting Common Issues

- **Container not updating**: Ensure you're rebuilding with `docker-compose build <service>` after making significant changes
- **Port conflicts**: Use `docker-compose down` and then `docker-compose up -d` if you encounter port conflicts
- **Missing modules**: If new modules are missing, ensure you're rebuilding the container after updating package.json
- **Permission issues**: Some file changes might cause permission problems; use `chmod -R 777 ./` on the project directory (use with caution)

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

## JWT Authentication Configuration

### Setting Up JWT Secret Keys

For proper authentication between the main application and the authentication service, both need to share the same JWT secret keys. This is crucial for token validation to work correctly.

### Method 1: Using Environment Variables (Recommended for Production)

When deploying with Docker Compose, you can set the JWT secrets using environment variables:

```bash
# Generate secure random strings for production
JWT_ACCESS_SECRET=$(openssl rand -base64 32)
JWT_REFRESH_SECRET=$(openssl rand -base64 32)

# Export as environment variables
export JWT_ACCESS_SECRET
export JWT_REFRESH_SECRET

# Run the application with the secure secrets
docker-compose -f docker-compose.standalone.yml up -d
```

### Method 2: Using an .env File

1. Create a `.env` file in the project root directory:

```
JWT_ACCESS_SECRET=your-secure-access-token-secret
JWT_REFRESH_SECRET=your-secure-refresh-token-secret
```

2. Start the application with Docker Compose:

```bash
docker-compose -f docker-compose.standalone.yml up -d
```

### Method 3: Setting Variables Directly in docker-compose.standalone.yml

For development or testing, you can directly modify the docker-compose file, but **avoid this in production**:

```yaml
services:
  server:
    environment:
      - JWT_ACCESS_SECRET=your-custom-secret
      # ...other environment variables
  
  auth-service:
    environment:
      - JWT_ACCESS_SECRET=your-custom-secret
      - JWT_REFRESH_SECRET=your-refresh-secret
      # ...other environment variables
```

### Understanding the MongoDB Configuration

The application uses two separate MongoDB databases:

1. **Auth Service Database**: `auth_db` - Stores user credentials and authentication data
2. **Main Service Database**: `flashcard_db` - Stores application data (cards, decks, credits)

While both databases use the same MongoDB container in development, you can configure separate MongoDB instances in production for better security and scalability.

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
