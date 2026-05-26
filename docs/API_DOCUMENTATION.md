# API Documentation

SupportFlow CRM exposes a RESTful JSON API built with FastAPI. All endpoints live under the `/api` prefix. The backend is also self-documenting — visit `/docs` on any running instance for an interactive Swagger UI.

**Base URL (Production):** `https://your-backend.railway.app`
**Base URL (Development):** `http://localhost:8000`

---

## Table of Contents

- [Authentication](#authentication)
- [Auth Endpoints](#auth-endpoints)
  - [POST /api/auth/signup](#post-apiauthsignup)
  - [POST /api/auth/login](#post-apiauthlogin)
  - [GET /api/auth/me](#get-apiauthme)
- [Ticket Endpoints](#ticket-endpoints)
  - [GET /api/tickets](#get-apitickets)
  - [POST /api/tickets](#post-apitickets)
  - [GET /api/tickets/{id}](#get-apiticketsid)
  - [PUT /api/tickets/{id}](#put-apiticketsid)
  - [DELETE /api/tickets/{id}](#delete-apiticketsid)
- [Note Endpoints](#note-endpoints)
  - [GET /api/tickets/{id}/notes](#get-apiticketsidnotes)
  - [POST /api/tickets/{id}/notes](#post-apiticketsidnotes)
  - [DELETE /api/tickets/{id}/notes/{note_id}](#delete-apiticketsidnotesnote_id)
- [Stats Endpoint](#stats-endpoint)
  - [GET /api/stats](#get-apistats)
- [Error Reference](#error-reference)
- [Status and Priority Values](#status-and-priority-values)

---

## Authentication

SupportFlow uses **Bearer token authentication** with JWT (JSON Web Tokens).

### How it works

1. Call `/api/auth/signup` or `/api/auth/login` to get a token
2. Include the token in every subsequent request:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Token details

| Property | Value |
|----------|-------|
| Algorithm | HS256 |
| Expiry | 7 days |
| Claim | `sub` contains the user's ID as a string |
| Storage | Client-side localStorage |

### What happens when a token expires

The server returns `401 Unauthorized`. The client should redirect the user to `/login`.

---

## Auth Endpoints

### POST /api/auth/signup

Creates a new user account and returns an auth token.

**Authentication required:** No

#### Request Body

```json
{
  "name": "Alice Johnson",
  "email": "alice@example.com",
  "password": "securepassword123"
}
```

| Field | Type | Required | Validation |
|-------|------|----------|-----------|
| `name` | string | Yes | Non-empty |
| `email` | string | Yes | Valid email format |
| `password` | string | Yes | Minimum 8 characters |

#### Success Response `201 Created`

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI0MiIsImV4cCI6MTc0ODQ4NjQwMH0.abc123",
  "user": {
    "id": 42,
    "name": "Alice Johnson",
    "email": "alice@example.com",
    "created_at": "2026-05-25T12:00:00.000Z"
  }
}
```

#### Error Responses

| Status | Condition | Response Body |
|--------|-----------|---------------|
| `400` | Email already registered | `{"detail": "An account with that email already exists"}` |
| `422` | Invalid input | `{"detail": [{"loc": [...], "msg": "...", "type": "..."}]}` |

#### Example (curl)

```bash
curl -X POST https://your-api.railway.app/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"name": "Alice Johnson", "email": "alice@example.com", "password": "securepassword123"}'
```

---

### POST /api/auth/login

Authenticates an existing user and returns an auth token.

**Authentication required:** No

#### Request Body

```json
{
  "email": "alice@example.com",
  "password": "securepassword123"
}
```

| Field | Type | Required |
|-------|------|----------|
| `email` | string | Yes |
| `password` | string | Yes |

#### Success Response `200 OK`

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 42,
    "name": "Alice Johnson",
    "email": "alice@example.com",
    "created_at": "2026-05-25T12:00:00.000Z"
  }
}
```

#### Error Responses

| Status | Condition | Response Body |
|--------|-----------|---------------|
| `401` | Wrong email or password | `{"detail": "Invalid email or password"}` |
| `422` | Malformed request body | `{"detail": [...]}` |

#### Example (curl)

```bash
curl -X POST https://your-api.railway.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "alice@example.com", "password": "securepassword123"}'
```

---

### GET /api/auth/me

Returns the currently authenticated user's profile. Used by the frontend to verify a stored token is still valid on app load.

**Authentication required:** Yes

#### Success Response `200 OK`

```json
{
  "id": 42,
  "name": "Alice Johnson",
  "email": "alice@example.com",
  "created_at": "2026-05-25T12:00:00.000Z"
}
```

#### Error Responses

| Status | Condition |
|--------|-----------|
| `401` | Missing or invalid token |

#### Example (curl)

```bash
curl https://your-api.railway.app/api/auth/me \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

---

## Ticket Endpoints

All ticket endpoints require authentication. Users can only see and modify **their own tickets** — cross-user access returns a 404, not a 403, to avoid leaking ticket existence.

### GET /api/tickets

Returns a list of the authenticated user's tickets. Supports optional filtering.

**Authentication required:** Yes

#### Query Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `status` | string | Filter by status: `open`, `in_progress`, `resolved`, `closed` |
| `priority` | string | Filter by priority: `low`, `medium`, `high`, `urgent` |
| `search` | string | Full-text search across title and description |

#### Success Response `200 OK`

```json
[
  {
    "id": 1,
    "title": "Login button not working on mobile",
    "description": "Users on iOS Safari cannot tap the login button.",
    "status": "open",
    "priority": "high",
    "customer_name": "Bob Smith",
    "customer_email": "bob@example.com",
    "user_id": 42,
    "created_at": "2026-05-20T09:15:00.000Z",
    "updated_at": "2026-05-20T09:15:00.000Z"
  },
  {
    "id": 2,
    "title": "Cannot export CSV report",
    "description": "The export button shows a spinner but never downloads.",
    "status": "in_progress",
    "priority": "medium",
    "customer_name": "Carol Davis",
    "customer_email": "carol@example.com",
    "user_id": 42,
    "created_at": "2026-05-21T14:30:00.000Z",
    "updated_at": "2026-05-22T10:00:00.000Z"
  }
]
```

Returns an empty array `[]` when the user has no tickets (or no tickets match the filters).

#### Example (curl)

```bash
# All tickets
curl https://your-api.railway.app/api/tickets \
  -H "Authorization: Bearer TOKEN"

# Filter by status
curl "https://your-api.railway.app/api/tickets?status=open" \
  -H "Authorization: Bearer TOKEN"

# Search
curl "https://your-api.railway.app/api/tickets?search=mobile" \
  -H "Authorization: Bearer TOKEN"
```

---

### POST /api/tickets

Creates a new ticket belonging to the authenticated user.

**Authentication required:** Yes

#### Request Body

```json
{
  "title": "Payment fails on checkout",
  "description": "Customer receives a 500 error after entering card details.",
  "status": "open",
  "priority": "urgent",
  "customer_name": "Dan Wilson",
  "customer_email": "dan@example.com"
}
```

| Field | Type | Required | Default | Notes |
|-------|------|----------|---------|-------|
| `title` | string | Yes | — | Non-empty |
| `description` | string | No | `null` | |
| `status` | string | No | `"open"` | See valid values below |
| `priority` | string | No | `"medium"` | See valid values below |
| `customer_name` | string | No | `null` | |
| `customer_email` | string | No | `null` | |

#### Success Response `201 Created`

```json
{
  "id": 7,
  "title": "Payment fails on checkout",
  "description": "Customer receives a 500 error after entering card details.",
  "status": "open",
  "priority": "urgent",
  "customer_name": "Dan Wilson",
  "customer_email": "dan@example.com",
  "user_id": 42,
  "created_at": "2026-05-25T12:34:56.000Z",
  "updated_at": "2026-05-25T12:34:56.000Z"
}
```

#### Error Responses

| Status | Condition |
|--------|-----------|
| `401` | Not authenticated |
| `422` | Missing required fields or invalid values |

#### Example (curl)

```bash
curl -X POST https://your-api.railway.app/api/tickets \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Payment fails on checkout",
    "priority": "urgent",
    "customer_name": "Dan Wilson",
    "customer_email": "dan@example.com"
  }'
```

---

### GET /api/tickets/{id}

Returns a single ticket by ID. The ticket must belong to the authenticated user.

**Authentication required:** Yes

#### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | integer | The ticket's ID |

#### Success Response `200 OK`

```json
{
  "id": 7,
  "title": "Payment fails on checkout",
  "description": "Customer receives a 500 error after entering card details.",
  "status": "open",
  "priority": "urgent",
  "customer_name": "Dan Wilson",
  "customer_email": "dan@example.com",
  "user_id": 42,
  "created_at": "2026-05-25T12:34:56.000Z",
  "updated_at": "2026-05-25T12:34:56.000Z"
}
```

#### Error Responses

| Status | Condition |
|--------|-----------|
| `401` | Not authenticated |
| `404` | Ticket not found, or belongs to a different user |

#### Example (curl)

```bash
curl https://your-api.railway.app/api/tickets/7 \
  -H "Authorization: Bearer TOKEN"
```

---

### PUT /api/tickets/{id}

Updates one or more fields on an existing ticket. Supports partial updates — only include the fields you want to change.

**Authentication required:** Yes

#### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | integer | The ticket's ID |

#### Request Body

All fields are optional. Only the fields you include will be updated.

```json
{
  "status": "in_progress",
  "priority": "high"
}
```

Or update everything:

```json
{
  "title": "Payment fails on checkout — reproduced",
  "description": "Confirmed on Firefox and Chrome. Stripe returns card_declined.",
  "status": "in_progress",
  "priority": "urgent",
  "customer_name": "Dan Wilson",
  "customer_email": "dan@example.com"
}
```

#### Success Response `200 OK`

Returns the full updated ticket object:

```json
{
  "id": 7,
  "title": "Payment fails on checkout",
  "description": "Customer receives a 500 error after entering card details.",
  "status": "in_progress",
  "priority": "high",
  "customer_name": "Dan Wilson",
  "customer_email": "dan@example.com",
  "user_id": 42,
  "created_at": "2026-05-25T12:34:56.000Z",
  "updated_at": "2026-05-25T13:00:00.000Z"
}
```

Note: `updated_at` is automatically refreshed on every PUT.

#### Error Responses

| Status | Condition |
|--------|-----------|
| `401` | Not authenticated |
| `404` | Ticket not found, or belongs to a different user |
| `422` | Invalid field values |

#### Example (curl)

```bash
# Update just the status
curl -X PUT https://your-api.railway.app/api/tickets/7 \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status": "resolved"}'
```

---

### DELETE /api/tickets/{id}

Permanently deletes a ticket and all its notes. This action cannot be undone.

**Authentication required:** Yes

#### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | integer | The ticket's ID |

#### Success Response `204 No Content`

Empty body. HTTP status 204 indicates success.

#### Error Responses

| Status | Condition |
|--------|-----------|
| `401` | Not authenticated |
| `404` | Ticket not found, or belongs to a different user |

#### Example (curl)

```bash
curl -X DELETE https://your-api.railway.app/api/tickets/7 \
  -H "Authorization: Bearer TOKEN"
```

---

## Note Endpoints

Notes are internal comments on a ticket — useful for tracking investigation steps, customer communications, or team handoff notes.

### GET /api/tickets/{id}/notes

Returns all notes on a ticket, ordered oldest-first.

**Authentication required:** Yes (ticket must belong to the authenticated user)

#### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | integer | The parent ticket's ID |

#### Success Response `200 OK`

```json
[
  {
    "id": 1,
    "ticket_id": 7,
    "content": "Reproduced locally. The issue appears to be in the Stripe webhook handler.",
    "created_at": "2026-05-25T13:05:00.000Z"
  },
  {
    "id": 2,
    "ticket_id": 7,
    "content": "Found the bug — missing idempotency key causes double charges. Fix deployed to staging.",
    "created_at": "2026-05-25T14:30:00.000Z"
  }
]
```

Returns `[]` if the ticket has no notes.

#### Error Responses

| Status | Condition |
|--------|-----------|
| `401` | Not authenticated |
| `404` | Ticket not found |

---

### POST /api/tickets/{id}/notes

Adds a new note to a ticket.

**Authentication required:** Yes

#### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | integer | The parent ticket's ID |

#### Request Body

```json
{
  "content": "Reached out to the customer via email. Waiting for their Stripe dashboard access."
}
```

| Field | Type | Required |
|-------|------|----------|
| `content` | string | Yes |

#### Success Response `201 Created`

```json
{
  "id": 3,
  "ticket_id": 7,
  "content": "Reached out to the customer via email. Waiting for their Stripe dashboard access.",
  "created_at": "2026-05-25T15:00:00.000Z"
}
```

#### Error Responses

| Status | Condition |
|--------|-----------|
| `401` | Not authenticated |
| `404` | Ticket not found |
| `422` | Missing `content` field |

#### Example (curl)

```bash
curl -X POST https://your-api.railway.app/api/tickets/7/notes \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"content": "Customer confirmed the bug. Deploying fix tomorrow."}'
```

---

### DELETE /api/tickets/{id}/notes/{note_id}

Deletes a specific note from a ticket.

**Authentication required:** Yes

#### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | integer | The parent ticket's ID |
| `note_id` | integer | The note's ID |

#### Success Response `204 No Content`

Empty body.

#### Error Responses

| Status | Condition |
|--------|-----------|
| `401` | Not authenticated |
| `404` | Note or ticket not found |

#### Example (curl)

```bash
curl -X DELETE https://your-api.railway.app/api/tickets/7/notes/3 \
  -H "Authorization: Bearer TOKEN"
```

---

## Stats Endpoint

### GET /api/stats

Returns aggregated statistics for the authenticated user's tickets. Used to populate the dashboard overview cards.

**Authentication required:** Yes

#### Success Response `200 OK`

```json
{
  "total": 24,
  "open": 8,
  "in_progress": 5,
  "resolved": 9,
  "closed": 2,
  "urgent": 3,
  "high": 6,
  "medium": 11,
  "low": 4
}
```

| Field | Description |
|-------|-------------|
| `total` | Total number of tickets for this user |
| `open` | Tickets with status `open` |
| `in_progress` | Tickets with status `in_progress` |
| `resolved` | Tickets with status `resolved` |
| `closed` | Tickets with status `closed` |
| `urgent` | Tickets with priority `urgent` |
| `high` | Tickets with priority `high` |
| `medium` | Tickets with priority `medium` |
| `low` | Tickets with priority `low` |

#### Example (curl)

```bash
curl https://your-api.railway.app/api/stats \
  -H "Authorization: Bearer TOKEN"
```

---

## Error Reference

All errors follow this structure:

```json
{
  "detail": "Human-readable error message"
}
```

Validation errors from Pydantic include more detail:

```json
{
  "detail": [
    {
      "loc": ["body", "email"],
      "msg": "value is not a valid email address",
      "type": "value_error.email"
    }
  ]
}
```

### HTTP Status Codes

| Code | Meaning | When it occurs |
|------|---------|---------------|
| `200` | OK | Successful GET or PUT |
| `201` | Created | Successful POST (new resource created) |
| `204` | No Content | Successful DELETE |
| `400` | Bad Request | Business logic error (e.g., email already exists) |
| `401` | Unauthorized | Missing, invalid, or expired token |
| `404` | Not Found | Resource doesn't exist or belongs to another user |
| `422` | Unprocessable Entity | Request body validation failed |
| `500` | Internal Server Error | Unexpected server error |

---

## Status and Priority Values

### Status Values

| Value | Display | Meaning |
|-------|---------|---------|
| `open` | Open | Newly created, not yet assigned |
| `in_progress` | In Progress | Someone is actively working on it |
| `resolved` | Resolved | Issue has been fixed |
| `closed` | Closed | Ticket is fully closed (no further action) |

### Priority Values

| Value | Display | When to use |
|-------|---------|-------------|
| `low` | Low | Minor issues, cosmetic bugs |
| `medium` | Medium | Standard issues, default priority |
| `high` | High | Significant issues affecting workflow |
| `urgent` | Urgent | Critical issues, service disruptions |

---

## Interactive API Docs

When running locally, FastAPI auto-generates two interactive documentation UIs:

- **Swagger UI**: `http://localhost:8000/docs` — Test endpoints directly from the browser
- **ReDoc**: `http://localhost:8000/redoc` — Clean, readable API reference

Both are automatically kept in sync with your code. No manual maintenance required.
