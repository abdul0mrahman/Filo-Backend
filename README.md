# Filo Backend

Day 1 backend foundation for Filo: a minimal, working Node.js/Express API with
PostgreSQL (via Prisma) and JWT-based authentication. This is intentionally
scoped to authentication only — no campaigns, matching, payments, or other
marketplace features yet.

## Requirements

- Node.js 18+
- PostgreSQL 13+
- npm

## Installation

```bash
cd filo-backend
npm install
```

## Environment Setup

Copy the example environment file and fill in real values:

```bash
cp .env.example .env
```

`.env` variables:

| Variable       | Description                                  |
| -------------- | --------------------------------------------- |
| `DATABASE_URL` | PostgreSQL connection string                  |
| `JWT_SECRET`   | Secret used to sign/verify JWTs               |
| `PORT`         | Port the API server listens on (default 5000) |

Example `DATABASE_URL`:

```
postgresql://USER:PASSWORD@localhost:5432/filo_dev?schema=public
```

## Database Setup

Make sure PostgreSQL is running and the database in `DATABASE_URL` exists,
then run the initial migration and generate the Prisma Client:

```bash
npx prisma migrate dev
```

This creates the `User` table and generates the Prisma Client automatically.

## How to Run Locally

```bash
npm install
npx prisma migrate dev
npm run dev
```

The API will start on `http://localhost:5000` (or the `PORT` you configured).

## API Endpoints

| Method | Route          | Description                          | Auth required |
| ------ | -------------- | ------------------------------------- | -------------- |
| GET    | `/`            | Health check                          | No             |
| POST   | `/auth/register` | Register a new user                | No             |
| POST   | `/auth/login`     | Log in and receive a JWT            | No             |
| GET    | `/auth/me`        | Get the authenticated user's profile | Yes (Bearer token) |

## Example Authentication Requests

### Register

```bash
curl -X POST http://localhost:5000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "Password123",
    "role": "CREATOR"
  }'
```

### Login

```bash
curl -X POST http://localhost:5000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Password123"
  }'
```

Response includes a `token` field. Use it for authenticated requests:

### Get current user

```bash
curl http://localhost:5000/auth/me \
  -H "Authorization: Bearer <token>"
```

## Available User Roles

- `CREATOR`
- `BRAND`
- `ADMIN`

## Security Notes

- Passwords are hashed with bcrypt before being stored.
- Password hashes are never returned in any API response.
- JWTs are signed with `JWT_SECRET`, which must be kept out of source control.
- `/auth/me` requires a valid `Authorization: Bearer <token>` header and
  returns `401` for missing or invalid tokens.
