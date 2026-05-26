# System Architecture

SupportFlow CRM is a full-stack web application built with a clean separation between a React frontend and a FastAPI backend. This document explains how every layer works, how they communicate, and how data flows through the system.

---

## Table of Contents

- [Overview](#overview)
- [High-Level Architecture](#high-level-architecture)
- [Frontend Architecture](#frontend-architecture)
- [Backend Architecture](#backend-architecture)
- [Database Layer](#database-layer)
- [Authentication Flow](#authentication-flow)
- [Request Lifecycle](#request-lifecycle)
- [Routing Architecture](#routing-architecture)
- [State Management](#state-management)
- [API Communication Layer](#api-communication-layer)
- [Deployment Architecture](#deployment-architecture)

---

## Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER'S BROWSER                           │
│                                                                 │
│   ┌─────────────────────────────────────────────────────────┐  │
│   │              React Application (Vite)                    │  │
│   │                                                         │  │
│   │  ┌──────────┐  ┌─────────────┐  ┌──────────────────┐  │  │
│   │  │  Pages   │  │  Components │  │  Context/State   │  │  │
│   │  └──────────┘  └─────────────┘  └──────────────────┘  │  │
│   │                       │                                 │  │
│   │              ┌────────────────┐                         │  │
│   │              │    api.js      │  ← HTTP + JWT           │  │
│   │              └────────────────┘                         │  │
│   └───────────────────────┼─────────────────────────────────┘  │
└───────────────────────────┼─────────────────────────────────────┘
                            │  HTTPS REST API
                            │
┌───────────────────────────┼─────────────────────────────────────┐
│                      RENDER CLOUD                                │
│                           │                                     │
│   ┌───────────────────────▼─────────────────────────────────┐  │
│   │              FastAPI Application                         │  │
│   │                                                         │  │
│   │  ┌──────────┐  ┌─────────────┐  ┌──────────────────┐  │  │
│   │  │  Routes  │  │   Schemas   │  │  Auth/JWT        │  │  │
│   │  └──────────┘  └─────────────┘  └──────────────────┘  │  │
│   │                       │                                 │  │
│   │              ┌────────────────┐                         │  │
│   │              │  SQLAlchemy    │  ← ORM                  │  │
│   │              └────────────────┘                         │  │
│   │                       │                                 │  │
│   │              ┌────────────────┐                         │  │
│   │              │  PostgreSQL    │                         │  │
│   │              └────────────────┘                         │  │
│   └─────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

The frontend is a **Single Page Application (SPA)** deployed on **Vercel**. The backend is a **REST API** deployed on **Render**. They communicate exclusively over HTTPS using JSON.

---

## High-Level Architecture

| Layer | Technology | Responsibility |
|-------|-----------|----------------|
| UI | React 18 + Vite | Render pages, handle user interactions |
| Styling | Tailwind CSS + Framer Motion | Visual design, animations |
| Routing | React Router v6 | Client-side navigation |
| State | React Context API | Auth state, toast notifications |
| API Client | Custom `api.js` | HTTP requests, auth token injection |
| Backend | FastAPI (Python) | Business logic, auth, data validation |
| ORM | SQLAlchemy | Database queries, models |
| Database | SQLite (dev) / PostgreSQL (prod) | Data persistence |
| Auth | JWT (python-jose) + bcrypt | Stateless token authentication |
| Deployment | Vercel + Render | Hosting |

---

## Frontend Architecture

### Component Hierarchy

```
App.jsx
├── AuthProvider (Context)
│   └── ToastProvider (Context)
│       ├── Router
│       │   ├── Route: "/" → LandingPage
│       │   │   ├── LandingNavbar
│       │   │   ├── Hero
│       │   │   ├── Stats
│       │   │   ├── Features
│       │   │   ├── HowItWorks
│       │   │   ├── DashboardPreview
│       │   │   ├── Testimonials
│       │   │   ├── FinalCTA
│       │   │   └── LandingFooter
│       │   │
│       │   ├── Route: "/login" → LoginPage
│       │   ├── Route: "/signup" → SignupPage
│       │   │
│       │   └── Route: "/dashboard" → ProtectedRoute
│       │       └── DashboardLayout
│       │           ├── Navbar
│       │           ├── Sidebar
│       │           └── Outlet
│       │               ├── "/" → HomePage
│       │               ├── "/new" → CreateTicketPage
│       │               └── "/tickets/:id" → TicketDetailPage
│       │
│       └── ToastContainer (fixed position)
```

### File Organization

```
frontend/src/
├── api.js                    ← All HTTP calls, single source of truth
├── main.jsx                  ← Root mount, provider wrapping
├── App.jsx                   ← Route definitions
│
├── context/
│   ├── AuthContext.jsx       ← User state, login/logout/signup
│   └── ToastContext.jsx      ← Notification system
│
├── pages/
│   ├── LandingPage.jsx       ← Public marketing page
│   ├── LoginPage.jsx         ← Authentication
│   ├── SignupPage.jsx        ← Registration
│   ├── HomePage.jsx          ← Ticket list view
│   ├── CreateTicketPage.jsx  ← New ticket form
│   └── TicketDetailPage.jsx  ← Single ticket view + notes
│
├── components/
│   ├── landing/              ← Landing page sections
│   ├── ProtectedRoute.jsx    ← Auth guard component
│   ├── DashboardLayout.jsx   ← Persistent shell with nav
│   ├── Navbar.jsx            ← Top navigation bar
│   ├── Sidebar.jsx           ← Left sidebar navigation
│   ├── EmptyState.jsx        ← Zero-data placeholder UI
│   └── Toast.jsx             ← Notification component
│
└── index.css                 ← Tailwind directives + custom components
```

---

## Backend Architecture

### Layered Design

```
HTTP Request
     │
     ▼
┌─────────────────────────────────────────┐
│              FastAPI Router             │
│  (routes defined in main.py)           │
└────────────────┬────────────────────────┘
                 │
     ┌───────────┼───────────┐
     ▼           ▼           ▼
┌─────────┐ ┌────────┐ ┌──────────┐
│  Auth   │ │Schemas │ │  DB Dep  │
│Middleware│ │(Pydantic)│ │(get_db) │
└─────────┘ └────────┘ └──────────┘
     │                       │
     ▼                       ▼
┌─────────────────────────────────────────┐
│            Route Handler                │
│  (validates input, calls DB queries)   │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│          SQLAlchemy ORM                 │
│  (models: User, Ticket, Note)          │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│            SQLite / PostgreSQL          │
└─────────────────────────────────────────┘
```

### File Organization

```
backend/
├── main.py          ← All route definitions, app config, CORS
├── models.py        ← SQLAlchemy ORM models (User, Ticket, Note)
├── schemas.py       ← Pydantic request/response schemas
├── auth.py          ← JWT creation, bcrypt hashing, get_current_user
├── database.py      ← DB engine, session factory, Base
└── requirements.txt ← Python dependencies
```

### Dependency Injection Flow

FastAPI uses `Depends()` to inject shared resources into route handlers. This keeps handlers clean and testable:

```python
# database.py provides a DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# auth.py validates the JWT and returns the current user
def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> models.User:
    ...

# main.py — handler receives both injected automatically
@app.get("/api/tickets")
def list_tickets(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    return db.query(models.Ticket).filter(
        models.Ticket.user_id == current_user.id
    ).all()
```

---

## Database Layer

### Schema Relationships

```
users
┌─────────────────────────────────┐
│ id            INTEGER PK        │
│ name          TEXT NOT NULL     │
│ email         TEXT UNIQUE       │
│ hashed_password TEXT NOT NULL   │
│ created_at    TIMESTAMP         │
└──────────────────┬──────────────┘
                   │ 1
                   │
                   │ many
┌──────────────────▼──────────────┐
│            tickets              │
│ id            INTEGER PK        │
│ user_id       INTEGER FK ──────►│ → users.id
│ title         TEXT NOT NULL     │
│ description   TEXT              │
│ status        TEXT              │ (open/in_progress/resolved/closed)
│ priority      TEXT              │ (low/medium/high/urgent)
│ customer_name TEXT              │
│ customer_email TEXT             │
│ created_at    TIMESTAMP         │
│ updated_at    TIMESTAMP         │
└──────────────────┬──────────────┘
                   │ 1
                   │
                   │ many
┌──────────────────▼──────────────┐
│             notes               │
│ id            INTEGER PK        │
│ ticket_id     INTEGER FK ──────►│ → tickets.id
│ content       TEXT NOT NULL     │
│ created_at    TIMESTAMP         │
└─────────────────────────────────┘
```

### Cascade Behavior

- Deleting a **User** → deletes all their **Tickets** → deletes all **Notes** on those tickets
- Deleting a **Ticket** → deletes all its **Notes**

This is enforced at the ORM level via `cascade="all, delete-orphan"` on each relationship.

---

## Authentication Flow

### Signup Flow

```
Browser                    FastAPI                     Database
  │                           │                            │
  │── POST /api/auth/signup ──►│                            │
  │   { name, email, password} │                            │
  │                           │── SELECT * FROM users ─────►│
  │                           │   WHERE email = ?           │
  │                           │◄── (no rows) ───────────────│
  │                           │                            │
  │                           │   bcrypt.hashpw(password)  │
  │                           │                            │
  │                           │── INSERT INTO users ───────►│
  │                           │◄── user row ────────────────│
  │                           │                            │
  │                           │   jwt.encode({sub: user_id,│
  │                           │               exp: +7days})│
  │                           │                            │
  │◄── { token, user } ───────│                            │
  │                           │                            │
  │  localStorage.setItem(    │                            │
  │    "crm_token", token)    │                            │
  │                           │                            │
  │  Navigate to /dashboard   │                            │
```

### Login Flow

```
Browser                    FastAPI                     Database
  │                           │                            │
  │── POST /api/auth/login ───►│                            │
  │   { email, password }     │                            │
  │                           │── SELECT * FROM users ─────►│
  │                           │   WHERE email = ?           │
  │                           │◄── user row ────────────────│
  │                           │                            │
  │                           │   bcrypt.checkpw(          │
  │                           │     plain, hashed)         │
  │                           │   → True                   │
  │                           │                            │
  │                           │   jwt.encode({sub: id, exp})│
  │                           │                            │
  │◄── { token, user } ───────│                            │
  │                           │                            │
  │  localStorage stores token│                            │
  │  AuthContext stores user  │                            │
```

### Authenticated Request Flow

```
Browser                    FastAPI                     Database
  │                           │                            │
  │── GET /api/tickets ───────►│                            │
  │   Authorization: Bearer   │                            │
  │   eyJhbGciOiJIUzI1...    │                            │
  │                           │                            │
  │                           │  bearer_scheme extracts    │
  │                           │  token from header         │
  │                           │                            │
  │                           │  jwt.decode(token,         │
  │                           │    SECRET_KEY)             │
  │                           │  → { sub: "42", exp: ... } │
  │                           │                            │
  │                           │── SELECT * FROM users ─────►│
  │                           │   WHERE id = 42            │
  │                           │◄── user object ─────────────│
  │                           │                            │
  │                           │── SELECT * FROM tickets ───►│
  │                           │   WHERE user_id = 42       │
  │                           │◄── ticket rows ─────────────│
  │                           │                            │
  │◄── [ ticket array ] ──────│                            │
```

### Token Storage and Expiry

- Token is stored in **`localStorage`** under key `crm_token`
- JWT expiry is set to **7 days**
- On every API request, `api.js` reads the token from localStorage and attaches it as `Authorization: Bearer <token>`
- If the backend returns **401**, `api.js` clears the token and redirects to `/login`
- On app load, `AuthContext` calls `GET /api/auth/me` to verify the token is still valid and restore the user session

---

## Request Lifecycle

### Full lifecycle of `GET /api/tickets`

```
1. User navigates to /dashboard

2. ProtectedRoute checks AuthContext:
   - loading = false → user = { id: 42, name: "Alice" }
   - Renders DashboardLayout

3. HomePage mounts
   - Calls useEffect → api.getTickets()

4. api.js builds the request:
   - Reads crm_token from localStorage
   - Adds Authorization header
   - Calls fetch("https://api.example.com/api/tickets")

5. Request hits FastAPI
   - CORS middleware checks Origin header
   - Route matched: GET /api/tickets

6. Dependency injection:
   - get_db() opens a SQLite session
   - bearer_scheme extracts "eyJhbGci..." from Authorization header
   - get_current_user() decodes JWT → user_id = 42
   - Queries users table → returns User(id=42, name="Alice")

7. Route handler executes:
   - db.query(Ticket).filter(user_id == 42).all()
   - Returns list of Ticket objects

8. FastAPI serializes:
   - Pydantic TicketOut schema validates/converts each ticket
   - Returns JSON array

9. api.js receives response:
   - res.ok → parses JSON
   - Returns data to HomePage

10. React re-renders:
    - Tickets stored in useState
    - Table renders each ticket row
```

---

## Routing Architecture

### Frontend Routes

| Path | Component | Auth Required |
|------|-----------|---------------|
| `/` | `LandingPage` | No |
| `/login` | `LoginPage` | No (redirects to /dashboard if logged in) |
| `/signup` | `SignupPage` | No (redirects to /dashboard if logged in) |
| `/dashboard` | `DashboardLayout` via `ProtectedRoute` | Yes |
| `/dashboard` (index) | `HomePage` | Yes |
| `/dashboard/new` | `CreateTicketPage` | Yes |
| `/dashboard/tickets/:ticketId` | `TicketDetailPage` | Yes |

### `ProtectedRoute` Logic

```jsx
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  // Still checking localStorage / calling /api/auth/me
  if (loading) return <PageSpinner />;

  // Not authenticated → redirect
  if (!user) return <Navigate to="/login" replace />;

  // Authenticated → render children
  return children;
}
```

### Backend Routes

| Method | Path | Auth |
|--------|------|------|
| POST | `/api/auth/signup` | No |
| POST | `/api/auth/login` | No |
| GET | `/api/auth/me` | Yes |
| GET | `/api/tickets` | Yes |
| POST | `/api/tickets` | Yes |
| GET | `/api/tickets/{id}` | Yes |
| PUT | `/api/tickets/{id}` | Yes |
| DELETE | `/api/tickets/{id}` | Yes |
| GET | `/api/tickets/{id}/notes` | Yes |
| POST | `/api/tickets/{id}/notes` | Yes |
| DELETE | `/api/tickets/{id}/notes/{note_id}` | Yes |
| GET | `/api/stats` | Yes |

---

## State Management

SupportFlow uses React Context API rather than a heavy state library like Redux. There are two contexts:

### AuthContext

Manages the currently logged-in user and auth actions.

```
AuthContext
├── state: { user: User | null, loading: boolean }
├── login(email, password): Promise<User>
├── signup(name, email, password): Promise<User>
└── logout(): void
```

**Initialization**: On app load, reads `crm_token` from localStorage. If present, calls `GET /api/auth/me` to rehydrate the user object. If the call fails (expired token), clears storage.

### ToastContext

Manages ephemeral notification messages.

```
ToastContext
├── state: { toasts: Array<{ id, message, type }> }
└── show(message, type): void   ← auto-dismissed after 3.5s
```

### Local State

Each page manages its own data using `useState` + `useEffect`. No global ticket store — data is fetched fresh on each page mount. This simplicity works well at this scale and avoids stale data issues.

---

## API Communication Layer

`api.js` is the single file that handles all HTTP communication. No component calls `fetch()` directly.

### Design Principles

1. **Single entry point**: All requests go through the `request()` helper
2. **Auto auth injection**: Token is attached to every request automatically
3. **Centralized error handling**: 401 → logout + redirect; other errors → throw with user-readable message
4. **No libraries**: Uses native browser `fetch()` — no Axios, no React Query

### Structure

```javascript
const BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

function getToken() {
  return localStorage.getItem("crm_token");
}

async function request(path, options = {}) {
  const token = getToken();
  const headers = { "Content-Type": "application/json", ...options.headers };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, { headers, ...options });

  if (res.status === 401) {
    localStorage.removeItem("crm_token");
    window.location.href = "/login";
    throw new Error("Session expired");
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Request failed");
  }

  if (res.status === 204) return null;
  return res.json();
}

export const api = {
  // Auth
  signup: (data) => request("/api/auth/signup", { method: "POST", body: JSON.stringify(data) }),
  login: (data) => request("/api/auth/login", { method: "POST", body: JSON.stringify(data) }),
  getMe: () => request("/api/auth/me"),

  // Tickets
  getTickets: (params) => request(`/api/tickets?${new URLSearchParams(params)}`),
  createTicket: (data) => request("/api/tickets", { method: "POST", body: JSON.stringify(data) }),
  getTicket: (id) => request(`/api/tickets/${id}`),
  updateTicket: (id, data) => request(`/api/tickets/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteTicket: (id) => request(`/api/tickets/${id}`, { method: "DELETE" }),

  // Notes
  getNotes: (id) => request(`/api/tickets/${id}/notes`),
  createNote: (id, data) => request(`/api/tickets/${id}/notes`, { method: "POST", body: JSON.stringify(data) }),
  deleteNote: (ticketId, noteId) => request(`/api/tickets/${ticketId}/notes/${noteId}`, { method: "DELETE" }),

  // Stats
  getStats: () => request("/api/stats"),
};
```

---

## Deployment Architecture

```
GitHub Repository
       │
       │  git push
       ▼
┌──────────────────────────────────────────────────────────────┐
│                      CI/CD Pipeline                          │
│                  (manual deploy trigger)                     │
└────────────────┬──────────────────────────┬─────────────────┘
                 │                          │
    ┌────────────▼────────────┐  ┌──────────▼──────────────────┐
    │         Vercel          │  │          Render             │
    │                         │  │                             │
    │  npm run build          │  │  python -m uvicorn          │
    │  → /dist static files   │  │    main:app --host 0.0.0.0  │
    │                         │  │                             │
    │  CDN edge network       │  │  PostgreSQL (Render)        │
    │  Global delivery        │  │  auto-wired via DATABASE_URL│
    │                         │  │                             │
    │  URL: yourapp.vercel.app│  │  URL: your-api.onrender.com │
    └─────────────────────────┘  └─────────────────────────────┘
              ▲                              ▲
              │                              │
         VITE_API_URL env var ───────────────┘
         (points frontend → backend)
```

### Environment Variables

**Frontend (Vercel)**:
- `VITE_API_URL` — The Render backend URL

**Backend (Render)**:
- `JWT_SECRET` — Random 32+ character string for JWT signing (Render can auto-generate this)
- `DATABASE_URL` — Automatically set by Render when a PostgreSQL database is attached
- `FRONTEND_URL` — Your Vercel frontend URL; used for CORS

---

## Key Design Decisions

### Why FastAPI over Flask?

FastAPI gives us automatic OpenAPI documentation, native async support, Pydantic validation, and dependency injection — all without extra configuration. The `/docs` endpoint is immediately useful for debugging and testing during development.

### Why SQLite over PostgreSQL?

SQLite requires zero configuration and works perfectly for development and low-to-medium traffic. The `DATABASE_URL` environment variable makes it trivial to swap to PostgreSQL for production without changing any application code.

### Why Context API over Redux?

The app has only two global state concerns: the current user and notifications. Redux would be significant overhead for this use case. Context API is built into React, requires no dependencies, and is simpler to reason about.

### Why localStorage for JWT?

The alternative is `httpOnly` cookies, which are more secure against XSS but require same-origin requests or cookie configuration for cross-origin APIs. Since the frontend (Vercel) and backend (Render) are on different domains, localStorage is the pragmatic choice. In production, adding a backend-for-frontend proxy to set httpOnly cookies would be the next security upgrade.
