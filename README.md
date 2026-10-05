# Filo Backend

Node.js + Express + PostgreSQL (Prisma). JWT auth, Creator & Brand profiles, Social Accounts.

## Setup
```bash
npm install
cp .env.example .env        # set DATABASE_URL and JWT_SECRET
npx prisma migrate dev      # creates tables (migrations in prisma/migrations)
npm run dev                 # http://localhost:5000
```
Use a fresh database (or `npx prisma migrate reset`) if you had an earlier Day 1 schema.

## Testing in Postman
Import `docs/Filo.postman_collection.json`, run the collection top to bottom (tokens/ids are saved automatically). Base URL: `http://localhost:5000`.

## Conventions
- Auth: `Authorization: Bearer <token>`. Passwords hashed with bcrypt; JWT signed with `JWT_SECRET`.
- Roles: `CREATOR`, `BRAND` (self-register), `ADMIN` (not self-assignable).
- Errors: `{ "error": "message", "details": [{field, message}] }` — 400 validation, 401 unauthenticated, 403 wrong role/not owner, 404 not found, 409 conflict.

## API Reference
| Method | Route | Role | Description |
|---|---|---|---|
| GET | `/` | – | Health check |
| POST | `/auth/register` | – | Body: name, email, password (8+ chars, letter+number), role (CREATOR/BRAND) |
| POST | `/auth/login` | – | Body: email, password → `{user, token}` |
| GET | `/auth/me` | any | Current user |
| POST | `/creators/profile` | CREATOR | displayName*, bio, niche, location, avatarUrl |
| GET | `/creators/profile` | CREATOR | Own profile + social accounts |
| PUT | `/creators/profile` | CREATOR | Partial update |
| GET | `/creators/:id` | any authed | View a creator profile |
| POST | `/brands/profile` | BRAND | companyName*, industry, website, description, location, logoUrl |
| GET | `/brands/profile` | BRAND | Own profile |
| PUT | `/brands/profile` | BRAND | Partial update |
| GET | `/brands/:id` | any authed | View a brand profile |
| GET | `/social-accounts` | CREATOR | List own accounts |
| POST | `/social-accounts` | CREATOR | platform* (INSTAGRAM, YOUTUBE, TIKTOK, TWITTER, FACEBOOK, LINKEDIN, OTHER), handle*, profileUrl, followers |
| PUT | `/social-accounts/:id` | CREATOR (owner) | Partial update |
| DELETE | `/social-accounts/:id` | CREATOR (owner) | Delete |

`*` required. One profile per user; a creator needs a profile before adding social accounts.

## Git workflow
```bash
git checkout -b feature/profiles-and-social-accounts
git add . && git commit -m "Add auth, creator/brand profiles, social accounts"
git push -u origin feature/profiles-and-social-accounts   # then open a PR
```
