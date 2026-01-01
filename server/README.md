# Auth Engine

An authentication microservice built with Fastify and Better Auth.

## Overview

Auth Engine provides secure user authentication for multiple applications. It manages user sessions, credentials, and supports application-scoped user isolation.

## Features

- Email and password authentication
- Session management with configurable expiration
- Multi-application support with application-scoped users
- PostgreSQL database for data persistence
- CORS configuration for cross-origin requests
- TypeScript for type safety

## Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL 14+

### Installation

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env

# Run database migrations
npm run migrate

# Start development server
npm run dev
```

### Environment Variables

```bash
PORT=4000
DATABASE_URL=postgresql://username:password@localhost:5432/auth_db
BETTER_AUTH_SECRET=your-super-secret-key-min-32-chars
BETTER_AUTH_URL=http://localhost:4000
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:8081
```

## API Testing Dashboard

Access the interactive API testing dashboard at:
```
http://localhost:4000/
```

The dashboard provides a professional UI to test all authentication endpoints with real-time feedback.

## API Endpoints

### Sign Up
```
POST /api/auth/sign-up/email
Headers: x-application-name: your-app-name
Body: { "name": "...", "email": "...", "password": "..." }
```

### Sign In
```
POST /api/auth/sign-in/email
Headers: x-application-name: your-app-name
Body: { "email": "...", "password": "..." }
```

### Session Management

Better Auth uses **HTTP-only cookies** for session management. When you sign in:
- A `better-auth.session_token` cookie is automatically set
- Session data is included in the sign-in/sign-up response
- Sessions expire after 7 days by default
- No separate "get session" endpoint is needed

### Sign Out
```
POST /api/auth/sign-out
```
Clears the session cookie and invalidates the session.

## Documentation

For complete documentation, see [docs/README.md](./docs/README.md)

## Development

```bash
# Development with hot reload
npm run dev

# Build for production
npm run build

# Run production server
npm start

# Run migrations
npm run migrate
```

## Tech Stack

- **Runtime**: Node.js 18+
- **Language**: TypeScript 5.9+
- **Framework**: Fastify 5.6+
- **Auth**: Better Auth 1.4+
- **Database**: PostgreSQL 14+

## License

ISC License - Copyright (c) 2025 [Yash Kumar Singh (Celestial)](https://yashkumarsingh.tech)
