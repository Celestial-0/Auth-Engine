# Auth Engine

An authentication microservice built with Fastify and Better Auth.

[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](https://opensource.org/licenses/ISC)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9+-blue.svg)](https://www.typescriptlang.org/)

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment Variables](#environment-variables)
  - [Database Setup](#database-setup)
- [API Documentation](#api-documentation)
  - [Authentication Endpoints](#authentication-endpoints)
  - [Health Check](#health-check)
- [Project Structure](#project-structure)
- [Development](#development)
- [Deployment](#deployment)
- [Security](#security)
- [Contributing](#contributing)
- [License](#license)

---

## Overview

Auth Engine is an authentication microservice that provides user authentication for multiple applications. Built with [Better Auth](https://better-auth.com/) and [Fastify](https://www.fastify.io/), it manages user sessions, credentials, and multi-application authentication.

### Features

- Session management with configurable expiration
- Multi-application support with application-scoped user isolation
- PostgreSQL database for data persistence
- CORS configuration for cross-origin requests

---

## Architecture

### System Design

```mermaid
flowchart TD
    A[Client Apps<br/>Mobile/Web] -->|HTTP/HTTPS<br/>x-application-name header| B[CORS Middleware]
    
    subgraph Engine[Auth Engine - Fastify]
        B[CORS Middleware]
        C[Better Auth Handler]
        D[Sign Up]
        E[Sign In]
        F[Session Management]
        
        B --> C
        C --> D
        C --> E
        C --> F
    end
    
    Engine --> G[(PostgreSQL Database)]
    
    subgraph Database[PostgreSQL Database]
        H[Users]
        I[Sessions]
        J[Accounts]
        K[Verifications]
    end
    
    G -.-> H
    G -.-> I
    G -.-> J
    G -.-> K
```

### Request Flow

1. **Client Request** → Application sends authentication request with `x-application-name` header
2. **CORS Validation** → Origin checked against allowed list
3. **Header Validation** → Application name verified for sign-up/sign-in
4. **Better Auth Processing** → Request forwarded to Better Auth handler
5. **Database Operation** → User/session data persisted to PostgreSQL
6. **Response** → Session token and user data returned to client

---

## Tech Stack

| Component | Technology | Version | Purpose |
|-----------|-----------|---------|---------|
| **Runtime** | Node.js | 18+ | JavaScript runtime |
| **Language** | TypeScript | 5.9+ | Type-safe development |
| **Framework** | Fastify | 5.6+ | High-performance web server |
| **Auth Library** | Better Auth | 1.4+ | Authentication logic |
| **Database** | PostgreSQL | 14+ | Data persistence |
| **Database Client** | pg | 8.16+ | PostgreSQL driver |
| **CORS** | @fastify/cors | 11.2+ | Cross-origin handling |
| **Dev Tools** | tsx | 4.21+ | TypeScript execution |

---

## Getting Started

### Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
- **PostgreSQL** (v14 or higher) - [Download](https://www.postgresql.org/download/)
- **npm** or **yarn** - Comes with Node.js

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd auth-engine
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Run database migrations**
   ```bash
   npm run migrate
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

The server will start on `http://localhost:4000` (or your configured PORT).

### Environment Variables

Create a `.env` file in the root directory with the following variables:

```bash
# Server Configuration
PORT=4000

# Database
DATABASE_URL=postgresql://username:password@localhost:5432/auth_db

# Better Auth Configuration
BETTER_AUTH_SECRET=your-super-secret-key-min-32-chars
BETTER_AUTH_URL=http://localhost:4000

# CORS Configuration
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:8081
```

#### Environment Variable Details

| Variable | Description | Example |
|----------|-------------|---------|
| `PORT` | Server port number | `4000` |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host:5432/db` |
| `BETTER_AUTH_SECRET` | Secret key for session encryption (min 32 chars) | `your-random-secret-key-here` |
| `BETTER_AUTH_URL` | Base URL of the auth service | `http://localhost:4000` |
| `ALLOWED_ORIGINS` | Comma-separated list of allowed CORS origins | `http://localhost:3000,https://app.com` |

### Database Setup

#### 1. Create Database

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE auth_db;

# Exit psql
\q
```

#### 2. Run Migrations

The migration system automatically applies SQL migrations from the `src/migrations` directory:

```bash
npm run migrate
```

#### Database Schema

The service creates the following tables:

**`user` Table**
```sql
- id (text, primary key)
- name (text)
- email (text)
- emailVerified (boolean)
- image (text, nullable)
- application (text) -- Custom field for multi-app support
- createdAt (timestamptz)
- updatedAt (timestamptz)
- UNIQUE constraint on (email, application)
```

**`session` Table**
```sql
- id (text, primary key)
- expiresAt (timestamptz)
- token (text, unique)
- createdAt (timestamptz)
- updatedAt (timestamptz)
- ipAddress (text)
- userAgent (text)
- userId (text, foreign key → user.id)
```

**`account` Table**
```sql
- id (text, primary key)
- accountId (text)
- providerId (text)
- userId (text, foreign key → user.id)
- accessToken (text)
- refreshToken (text)
- idToken (text)
- accessTokenExpiresAt (timestamptz)
- refreshTokenExpiresAt (timestamptz)
- scope (text)
- password (text, hashed)
- createdAt (timestamptz)
- updatedAt (timestamptz)
```

**`verification` Table**
```sql
- id (text, primary key)
- identifier (text)
- value (text)
- expiresAt (timestamptz)
- createdAt (timestamptz)
- updatedAt (timestamptz)
```

---

## API Documentation

### Base URL

```
http://localhost:4000
```

### Authentication Endpoints

All authentication endpoints are proxied through Better Auth at the `/api/auth/*` path.

#### Sign Up

**Endpoint:** `POST /api/auth/sign-up`

**Headers:**
```http
Content-Type: application/json
x-application-name: your-app-name
```

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePassword123!"
}
```

**Response (201 Created):**
```json
{
  "user": {
    "id": "usr_abc123",
    "name": "John Doe",
    "email": "john@example.com",
    "emailVerified": false,
    "application": "your-app-name",
    "createdAt": "2025-12-30T00:00:00.000Z",
    "updatedAt": "2025-12-30T00:00:00.000Z"
  },
  "session": {
    "id": "ses_xyz789",
    "token": "session-token-here",
    "expiresAt": "2026-01-06T00:00:00.000Z"
  }
}
```

**Error Responses:**
```json
// Missing application header
{
  "error": "BAD_REQUEST",
  "message": "x-application-name header is required"
}

// User already exists
{
  "error": "USER_EXISTS",
  "message": "User with this email already exists for this application"
}
```

#### Sign In

**Endpoint:** `POST /api/auth/sign-in`

**Headers:**
```http
Content-Type: application/json
x-application-name: your-app-name
```

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "SecurePassword123!"
}
```

**Response (200 OK):**
```json
{
  "user": {
    "id": "usr_abc123",
    "name": "John Doe",
    "email": "john@example.com",
    "emailVerified": false,
    "application": "your-app-name"
  },
  "session": {
    "id": "ses_xyz789",
    "token": "session-token-here",
    "expiresAt": "2026-01-06T00:00:00.000Z"
  }
}
```

**Error Responses:**
```json
// Invalid credentials
{
  "error": "INVALID_CREDENTIALS",
  "message": "Invalid email or password"
}

// Missing application header
{
  "error": "BAD_REQUEST",
  "message": "x-application-name header is required"
}
```

#### Get Session

**Endpoint:** `GET /api/auth/session`

**Headers:**
```http
Cookie: better-auth.session_token=<session-token>
```

**Response (200 OK):**
```json
{
  "user": {
    "id": "usr_abc123",
    "name": "John Doe",
    "email": "john@example.com",
    "application": "your-app-name"
  },
  "session": {
    "id": "ses_xyz789",
    "expiresAt": "2026-01-06T00:00:00.000Z"
  }
}
```

#### Sign Out

**Endpoint:** `POST /api/auth/sign-out`

**Headers:**
```http
Cookie: better-auth.session_token=<session-token>
```

**Response (200 OK):**
```json
{
  "success": true
}
```

### Health Check

**Endpoint:** `GET /health`

**Response (200 OK):**
```json
{
  "status": "ok",
  "service": "auth-engine",
  "timestamp": "2025-12-30T00:00:00.000Z"
}
```

### CORS Configuration

The service validates the `Origin` header against the `ALLOWED_ORIGINS` environment variable. Requests from unauthorized origins will receive:

**Response (403 Forbidden):**
```json
{
  "statusCode": 403,
  "error": "Forbidden",
  "message": "Not allowed by CORS"
}
```

---

## Project Structure

```bash
auth-engine/
├── src/
│   ├── auth.ts              # Better Auth configuration
│   ├── server.ts            # Fastify server setup and routes
│   ├── migration.ts         # Database migration runner
│   └── migrations/          # SQL migration files
│       └── 2025-12-29T20-35-28.023Z.sql
├── docs/                    # Documentation files
│   ├── README.md            # This file
│   ├── index.html           # Documentation website
│   └── custom-theme.css     # Documentation styling
├── dist/                    # Compiled JavaScript (generated)
├── node_modules/            # Dependencies (generated)
├── .env                     # Environment variables (gitignored)
├── .gitignore               # Git ignore rules
├── package.json             # Project metadata and scripts
├── tsconfig.json            # TypeScript configuration
└── README.md                # Project overview
```

### File Descriptions

#### `src/auth.ts`
Configures Better Auth with:
- PostgreSQL database connection
- Email/password authentication
- Custom `application` field for multi-app support
- Session expiration settings (7 days)

#### `src/server.ts`
Main application server that:
- Initializes Fastify with logging
- Registers CORS middleware
- Implements application header validation
- Proxies requests to Better Auth
- Provides health check endpoint

#### `src/migration.ts`
Database migration runner that:
- Reads SQL files from `migrations/` directory
- Executes migrations in alphabetical order
- Uses transactions for safety (rollback on error)
- Provides detailed logging

#### `src/migrations/*.sql`
SQL migration files containing:
- Table creation statements
- Index definitions
- Constraint definitions
- Schema modifications

---

## Development

### Available Scripts

| Script | Command | Description |
|--------|---------|-------------|
| **Development** | `npm run dev` | Start development server with hot reload |
| **Build** | `npm run build` | Compile TypeScript to JavaScript |
| **Start** | `npm start` | Run production server from `dist/` |
| **Migrate** | `npm run migrate` | Run database migrations |
| **Type Check** | `npm run type-check` | Check TypeScript types without emitting |
| **Lint Types** | `npm run lint:types` | Strict type checking |

### Development Workflow

1. **Start development server**
   ```bash
   npm run dev
   ```
   This uses `tsx watch` for automatic reloading on file changes.

2. **Make changes**
   - Edit files in `src/`
   - Server automatically restarts
   - Check logs for errors

3. **Type checking**
   ```bash
   npm run type-check
   ```

4. **Build for production**
   ```bash
   npm run build
   ```

### Adding New Migrations

1. **Create migration file**
   ```bash
   # File naming: YYYY-MM-DDTHH-mm-ss.sssZ.sql
   touch src/migrations/2025-12-30T10-30-00.000Z.sql
   ```

2. **Write SQL**
   ```sql
   -- Add new column
   ALTER TABLE "user" ADD COLUMN "phone" text;
   
   -- Create index
   CREATE INDEX "user_phone_idx" ON "user" ("phone");
   ```

3. **Run migration**
   ```bash
   npm run migrate
   ```

### Debugging

Enable detailed logging by checking Fastify logs:

```typescript
// In src/server.ts
const fastify = Fastify({
  logger: true, // Already enabled
});
```

Logs include:
- Incoming requests
- Response times
- Error stack traces
- Route registration

---

## Deployment

### Production Build

1. **Build the application**
   ```bash
   npm run build
   ```

2. **Set production environment variables**
   ```bash
   NODE_ENV=production
   PORT=4000
   DATABASE_URL=postgresql://prod-user:prod-pass@prod-host:5432/prod-db
   BETTER_AUTH_SECRET=production-secret-min-32-chars
   BETTER_AUTH_URL=https://auth.yourdomain.com
   ALLOWED_ORIGINS=https://app.yourdomain.com,https://mobile.yourdomain.com
   ```

3. **Run migrations**
   ```bash
   npm run migrate
   ```

4. **Start the server**
   ```bash
   npm start
   ```

### Docker Deployment

Create a `Dockerfile`:

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source
COPY . .

# Build TypeScript
RUN npm run build

# Expose port
EXPOSE 4000

# Start server
CMD ["npm", "start"]
```

Build and run:

```bash
# Build image
docker build -t auth-engine .

# Run container
docker run -d \
  -p 4000:4000 \
  -e DATABASE_URL=postgresql://... \
  -e BETTER_AUTH_SECRET=... \
  -e BETTER_AUTH_URL=... \
  -e ALLOWED_ORIGINS=... \
  --name auth-engine \
  auth-engine
```

### Environment Considerations

#### Production Checklist
- Use strong `BETTER_AUTH_SECRET` (minimum 32 random characters)
- Enable SSL/TLS for database connections
- Use HTTPS for `BETTER_AUTH_URL`
- Restrict `ALLOWED_ORIGINS` to production domains only
- Set up database backups
- Configure log aggregation
- Set up health check monitoring
- Use environment-specific `.env` files
- Enable database connection pooling
- Configure rate limiting

#### Scaling Considerations
- **Horizontal Scaling**: Multiple instances can run behind a load balancer
- **Database**: Use connection pooling (already configured via `pg.Pool`)
- **Session Storage**: Sessions are database-backed (shared across instances)
- **Stateless**: Service is stateless, making it easy to scale

---

## Security

### Security Features

1. **Password Security**
   - Passwords are hashed using Better Auth's secure hashing
   - Never stored in plain text
   - Automatic salt generation

2. **Session Security**
   - Secure session tokens
   - Automatic expiration (7 days default)
   - IP address and user agent tracking
   - Database-backed storage

3. **CORS Protection**
   - Configurable allowed origins
   - Credentials support
   - Automatic origin validation

4. **Application Isolation**
   - Users are scoped to applications
   - Same email can exist across different apps
   - Prevents cross-application data leakage

5. **Database Security**
   - Parameterized queries (SQL injection protection)
   - Foreign key constraints
   - Unique constraints
   - Transactional migrations

### Security Best Practices

#### For Developers
- Never commit `.env` files
- Use strong secrets (minimum 32 characters)
- Rotate secrets regularly
- Keep dependencies updated
- Review security advisories

#### For Deployment
- Use HTTPS in production
- Enable database SSL
- Implement rate limiting
- Set up monitoring and alerts
- Conduct regular security audits
- Backup database regularly

#### Recommended Additions
Consider adding these security enhancements:
- Rate limiting (e.g., `@fastify/rate-limit`)
- Request validation (e.g., `@fastify/helmet`)
- Input sanitization
- Email verification flow
- Password reset functionality
- Two-factor authentication
- Account lockout after failed attempts

---

## Contributing

Contributions are welcome! Please follow these guidelines:

### Development Setup

1. Fork the repository
2. Clone your fork
3. Create a feature branch
4. Make your changes
5. Run type checking
6. Submit a pull request

### Code Style

- Use TypeScript for all new code
- Follow existing code formatting
- Add JSDoc comments for public APIs
- Write descriptive commit messages

### Commit Message Format

```
type(scope): subject

body

footer
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `refactor`: Code refactoring
- `test`: Adding tests
- `chore`: Maintenance tasks

**Example:**
```
feat(auth): add password reset functionality

Implement password reset flow with email verification.
Includes new endpoints and database migrations.

Closes #123
```

---

## License

This project is licensed under the **ISC License**.

```
ISC License

Copyright (c) 2025 Yash Kumar Singh (Celestial)

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted, provided that the above
copyright notice and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF
OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
```

---

## Support

For questions, issues, or feature requests:

- **Author**: [Yash Kumar Singh (Celestial)](https://yashkumarsingh.tech)
- **Issues**: [GitHub Issues](https://github.com/Celestial-0/Auth-Engine/issues)
- **Documentation**: [docs/](./docs/)

---

## Roadmap

Future enhancements planned:

- [ ] Email verification flow
- [ ] Password reset functionality
- [ ] Two-factor authentication (2FA)
- [ ] OAuth provider support (Google, GitHub, etc.)
- [ ] Rate limiting
- [ ] Admin dashboard
- [ ] User management API
- [ ] Audit logging
- [ ] Refresh token rotation
- [ ] Account deletion/deactivation

---

## Acknowledgments

Built with:
- [Better Auth](https://better-auth.com/) - Modern authentication library
- [Fastify](https://www.fastify.io/) - Fast and low overhead web framework
- [PostgreSQL](https://www.postgresql.org/) - Powerful, open source database
- [TypeScript](https://www.typescriptlang.org/) - JavaScript with syntax for types
