# Filo Backend

Node.js + Express + PostgreSQL (Prisma). JWT auth, Creator/Brand profiles, Social Accounts, Campaigns, Invitations, Notifications.

## Setup
```bash
npm install
copy .env.example .env     # set DATABASE_URL and JWT_SECRET
npx prisma migrate dev     # applies migrations
npm run dev                # http://localhost:5000
```

## Testing (Postman)
Import `docs/Filo.day4.postman_collection.json` and run the whole collection in order (it registers fresh users each run and saves tokens/ids). `docs/Filo.postman_collection.json` covers Day 2-3 auth/profile endpoints.

## Conventions
- Auth header: `Authorization: Bearer <token>`. Roles: `CREATOR`, `BRAND`.
- Errors: `{ "error": "...", "details": [{field, message}] }` — 400 validation, 401 unauthenticated, 403 wrong role / not your data, 404 not found, 409 conflict.

## API Reference
### Auth
| Method | Route | Role | Notes |
|---|---|---|---|
| POST | `/auth/register` | – | name, email, password (8+, letter+number), role (CREATOR/BRAND) |
| POST | `/auth/login` | – | email, password → `{user, token}` |
| GET | `/auth/me` | any | current user |

### Profiles
| Method | Route | Role | Notes |
|---|---|---|---|
| POST/GET/PUT | `/creators/profile` | CREATOR | create / view own / update own |
| GET | `/creators` | BRAND | browse creators; `?niche=&limit=&offset=` |
| GET | `/creators/:id` | any authed | view a creator |
| POST/GET/PUT | `/brands/profile` | BRAND | create / view own / update own |
| GET | `/brands/:id` | any authed | view a brand |

### Social accounts (CREATOR, own data only)
| Method | Route | Notes |
|---|---|---|
| GET | `/social-accounts` | list own |
| POST | `/social-accounts` | platform, handle, profileUrl?, followers? |
| GET | `/social-accounts/:id` | view one |
| PUT | `/social-accounts/:id` | partial update |
| DELETE | `/social-accounts/:id` | delete |

### Campaigns (BRAND, own data only)
| Method | Route | Notes |
|---|---|---|
| POST | `/campaigns` | title*, description, budget, deadline (ISO date) |
| GET | `/campaigns` | list own |
| GET | `/campaigns/:id` | view own |
| PUT | `/campaigns/:id` | partial update; `status`: ACTIVE / CLOSED |

### Invitations
| Method | Route | Role | Notes |
|---|---|---|---|
| POST | `/invitations` | BRAND | `{campaignId, creatorId, message?}`; own ACTIVE campaign only; one invite per creator per campaign (409) |
| GET | `/invitations/sent` | BRAND | `?status=PENDING\|ACCEPTED\|REJECTED\|WITHDRAWN` |
| GET | `/invitations/received` | CREATOR | same status filter |
| GET | `/invitations/:id` | sender brand or recipient creator | others get 403 |
| PATCH | `/invitations/:id/respond` | CREATOR (recipient) | `{status: "ACCEPTED"\|"REJECTED"}`; only while PENDING (else 409) |
| PATCH | `/invitations/:id/withdraw` | BRAND (sender) | only while PENDING (else 409) |

Flow: Brand creates profile → creates campaign → browses `GET /creators` → `POST /invitations` → Creator `GET /invitations/received` → `PATCH .../respond`.

## Notifications API (any authenticated user, own data only)
| Method | Route | Notes |
|---|---|---|
| GET | `/notifications` | `?isRead=true\|false&limit=&offset=` → `{total, unreadCount, limit, offset, notifications}`, newest first |
| GET | `/notifications/unread-count` | `{unreadCount}` |
| PATCH | `/notifications/:id/read` | mark one read (idempotent). 404 not found, 403 not yours, 400 bad id |
| PATCH | `/notifications/read-all` | `{updated}` |

Notification: `{id, type, title, message, invitationId, campaignId, isRead, readAt, createdAt}`

## When notifications are created
| Event | Recipient | `type` |
|---|---|---|
| Brand sends invitation | Creator | `INVITATION_RECEIVED` |
| Creator accepts | Brand | `INVITATION_ACCEPTED` |
| Creator rejects | Brand | `INVITATION_REJECTED` |
| Brand withdraws pending invitation | Creator | `INVITATION_WITHDRAWN` |
| Brand closes campaign | Creators with a still-PENDING invite | `CAMPAIGN_CLOSED` |

Each notification is created in the same DB transaction as the action that triggers it. Accept/reject/withdraw use an atomic `PENDING`-only update, so concurrent responses return 409 instead of double-applying.

## Auth & errors
Same as Day 4: `Authorization: Bearer <token>`; 400 validation, 401 unauthenticated, 403 not your data / wrong role, 404 not found, 409 conflict.

## Testing notifications
Import `docs/Filo.day5.postman_collection.json` and run it in order. Folders 1–3 are the Day 4 flow
(Brand → Invite Creator → Creator accepts/rejects); folder 4 verifies notifications for both sides, read/unread, and 403/404/400/401 cases.
