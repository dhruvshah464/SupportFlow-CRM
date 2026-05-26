# Project Structure

A complete annotated map of every file and directory in SupportFlow CRM.

---

## Table of Contents

- [Top-Level Overview](#top-level-overview)
- [Backend Directory](#backend-directory)
- [Frontend Directory](#frontend-directory)
  - [src/api.js](#srcapijs)
  - [src/context/](#srccontext)
  - [src/pages/](#srcpages)
  - [src/components/](#srccomponents)
  - [src/index.css](#srcindexcss)
- [docs/ Directory](#docs-directory)
- [Configuration Files](#configuration-files)
- [File Dependency Map](#file-dependency-map)

---

## Top-Level Overview

```
supportflow-crm/
│
├── backend/                 ← Python FastAPI application
├── frontend/                ← React application (Vite)
├── docs/                    ← Project documentation
│
├── README.md                ← Main project overview
├── CONTRIBUTING.md          ← Development and contribution guide
├── CHANGELOG.md             ← Version history
├── .env.example             ← Environment variable template (safe to commit)
└── .gitignore               ← Files excluded from git
```

---

## Backend Directory

```
backend/
│
├── main.py             ← Application entry point + all route definitions
├── models.py           ← SQLAlchemy ORM models
├── schemas.py          ← Pydantic request/response schemas
├── auth.py             ← JWT utilities + bcrypt + auth dependency
├── database.py         ← Database engine, session, and Base
├── requirements.txt    ← Python package dependencies
├── railway.toml        ← Railway deployment configuration
└── support_crm.db      ← SQLite database file (generated, git-ignored)
```

### backend/main.py

The heart of the backend. Contains:
- FastAPI app instantiation
- CORS middleware configuration
- All API route definitions (auth, tickets, notes, stats)
- Startup event that calls `Base.metadata.create_all()` to initialize the database tables

Nothing lives in separate router files — the codebase is intentionally small enough to keep everything in one file. If the routes file grew beyond ~300 lines, the next step would be splitting into `routers/auth.py`, `routers/tickets.py`, etc.

### backend/models.py

Defines the database schema as Python classes using SQLAlchemy's ORM:

```python
# Three models, in order of dependency:
User      ← no dependencies
Ticket    ← depends on User (user_id FK)
Note      ← depends on Ticket (ticket_id FK)
```

Relationships are bi-directional:
- `User.tickets` → list of Tickets
- `Ticket.user` → the User who owns it
- `Ticket.notes` → list of Notes
- `Note.ticket` → the Ticket it belongs to

### backend/schemas.py

Pydantic v2 models for request validation and response serialization. Separate from ORM models intentionally — this decouples "what the database stores" from "what the API accepts and returns."

Key schema pairs:
- `TicketCreate` / `TicketOut`
- `NoteCreate` / `NoteOut`
- `SignupRequest` / `LoginRequest` / `AuthResponse` / `UserOut`

### backend/auth.py

Three responsibilities:
1. **Password hashing** — `hash_password()` and `verify_password()` using bcrypt
2. **Token management** — `create_token()` creates JWTs, `get_current_user()` validates them
3. **FastAPI dependency** — `get_current_user` is used with `Depends()` in route handlers

### backend/database.py

Sets up the SQLAlchemy connection:
- `engine` — the database connection (SQLite file or PostgreSQL URL)
- `SessionLocal` — a session factory (creates individual DB sessions)
- `Base` — the declarative base all models inherit from
- `get_db()` — a generator that yields a session and closes it after the request

### backend/requirements.txt

```
fastapi>=0.100.0
uvicorn[standard]>=0.22.0
sqlalchemy>=2.0.0
pydantic[email]>=2.0.0
python-jose[cryptography]>=3.3.0
bcrypt>=4.0.0
python-multipart>=0.0.6
```

### backend/railway.toml

Railway deployment config:

```toml
[build]
builder = "NIXPACKS"

[deploy]
startCommand = "python -m uvicorn main:app --host 0.0.0.0 --port $PORT"
healthcheckPath = "/api/stats"
restartPolicyType = "ON_FAILURE"
```

---

## Frontend Directory

```
frontend/
│
├── src/
│   ├── api.js                    ← Central API client
│   ├── App.jsx                   ← Route definitions
│   ├── main.jsx                  ← App entry point (DOM mount + providers)
│   ├── index.css                 ← Tailwind imports + custom CSS classes
│   │
│   ├── context/
│   │   ├── AuthContext.jsx       ← Auth state and actions
│   │   └── ToastContext.jsx      ← Toast notification system
│   │
│   ├── pages/
│   │   ├── LandingPage.jsx       ← Public marketing page
│   │   ├── LoginPage.jsx         ← Login form
│   │   ├── SignupPage.jsx        ← Registration form
│   │   ├── HomePage.jsx          ← Dashboard ticket list
│   │   ├── CreateTicketPage.jsx  ← New ticket form
│   │   └── TicketDetailPage.jsx  ← Ticket detail + notes
│   │
│   └── components/
│       ├── landing/              ← Landing page sections
│       │   ├── LandingNavbar.jsx
│       │   ├── Hero.jsx
│       │   ├── Stats.jsx
│       │   ├── Features.jsx
│       │   ├── HowItWorks.jsx
│       │   ├── DashboardPreview.jsx
│       │   ├── Testimonials.jsx
│       │   ├── FinalCTA.jsx
│       │   └── LandingFooter.jsx
│       │
│       ├── DashboardLayout.jsx   ← Persistent shell (navbar + sidebar)
│       ├── Navbar.jsx            ← Top navigation bar
│       ├── Sidebar.jsx           ← Left navigation sidebar
│       ├── ProtectedRoute.jsx    ← Auth guard wrapper component
│       ├── EmptyState.jsx        ← Zero-data placeholder UI
│       └── Toast.jsx             ← Toast notification component
│
├── public/                      ← Static assets (favicon, etc.)
├── index.html                   ← HTML entry point (Vite)
├── vite.config.js               ← Vite build configuration
├── tailwind.config.js           ← Tailwind CSS configuration
├── postcss.config.js            ← PostCSS configuration for Tailwind
└── package.json                 ← Node.js dependencies and scripts
```

---

### src/api.js

The single file through which all HTTP communication passes. No component ever calls `fetch()` directly.

Exports a single `api` object with methods grouped by resource:

```javascript
api.signup(data)
api.login(data)
api.getMe()

api.getTickets(params)
api.createTicket(data)
api.getTicket(id)
api.updateTicket(id, data)
api.deleteTicket(id)

api.getNotes(ticketId)
api.createNote(ticketId, data)
api.deleteNote(ticketId, noteId)

api.getStats()
```

Every method goes through the shared `request()` helper which:
- Reads the auth token from localStorage
- Attaches `Authorization: Bearer <token>` header
- Handles 401 → logout + redirect
- Parses response JSON or returns null for 204

---

### src/context/

**AuthContext.jsx** — Manages the current user session.

State:
- `user: User | null` — the logged-in user's profile data
- `loading: boolean` — true while verifying the stored token on app load

Actions:
- `login(email, password)` → calls API, stores token, sets user
- `signup(name, email, password)` → same
- `logout()` → clears token, sets user to null, navigates to /

Hook: `useAuth()` — access anywhere in the component tree.

**ToastContext.jsx** — Manages the notification queue.

State:
- `toasts: Array<{ id, message, type }>` — active notifications

Actions:
- `show(message, type)` → adds a toast, auto-removes after 3500ms

Hook: `useToast()` — access anywhere in the component tree.

---

### src/pages/

**LandingPage.jsx** — Assembles the marketing page by composing the landing section components in order. Has no logic — pure composition.

**LoginPage.jsx** — Email + password form. Shows inline error on failure. Redirects to `/dashboard` if already logged in.

**SignupPage.jsx** — Name + email + password form. Client-side validation for min 8 char password. Show/hide toggle on the password field.

**HomePage.jsx** — The dashboard home. Fetches stats and tickets on mount. Renders the stats cards and the ticket table. Handles loading, error, and empty states.

**CreateTicketPage.jsx** — Form for creating a new ticket. Controlled form with React state. On submit, calls `api.createTicket()`, shows success toast, and navigates to the new ticket.

**TicketDetailPage.jsx** — Full ticket editor plus the notes panel. Fetches the ticket by ID on mount. All fields are editable. Notes are fetched and managed in local state alongside the ticket.

---

### src/components/

**DashboardLayout.jsx** — The persistent shell for all dashboard pages. Renders `<Navbar>`, `<Sidebar>`, and `<Outlet>` (React Router's placeholder for child routes). Child routes replace the Outlet area.

**Navbar.jsx** — Top bar with the app logo, current page title, user's name, and a logout button. Uses `useAuth()` to get the user.

**Sidebar.jsx** — Left navigation with links to the dashboard home and the "New ticket" page. Highlights the active route using React Router's `useMatch` hook.

**ProtectedRoute.jsx** — Wrapper component that checks auth state before rendering children. Shows a spinner during the loading phase, redirects to `/login` if no user.

**EmptyState.jsx** — Reusable component for empty data states. Accepts `title`, `description`, and `showCreate` (boolean) props. When `showCreate` is true, renders a link button to `/dashboard/new`.

**Toast.jsx** — Individual toast notification. Rendered by the ToastContainer. Uses Framer Motion's `AnimatePresence` for slide-in/slide-out animations. Three visual styles: success (green), error (red), info (blue).

---

### src/index.css

The global stylesheet. Contains:

```css
@tailwind base;       ← Tailwind's CSS reset
@tailwind components; ← custom component classes
@tailwind utilities;  ← all utility classes

@layer components {
  /* Reusable component abstractions */
  .btn-primary { ... }
  .btn-secondary { ... }
  .card { ... }
  .input { ... }
  .badge { ... }
  .badge-open { ... }
  .badge-in_progress { ... }
  .badge-resolved { ... }
  .badge-closed { ... }
  .badge-low { ... }
  .badge-medium { ... }
  .badge-high { ... }
  .badge-urgent { ... }
}
```

Keeping shared classes here (rather than duplicating Tailwind utility strings in every component) ensures visual consistency and makes global style changes easy.

---

### src/landing/ Components

Each landing section is its own component, imported by `LandingPage.jsx`:

| File | Section | Notable Implementation |
|------|---------|----------------------|
| `LandingNavbar.jsx` | Top navigation | Transparent → white transition on scroll via `useEffect` + `window.addEventListener("scroll")` |
| `Hero.jsx` | Hero section | Dot-grid background, animated badge, browser mockup |
| `Stats.jsx` | Numbers section | 4 stat cards with icons |
| `Features.jsx` | Feature grid | 6 feature cards in a responsive grid |
| `HowItWorks.jsx` | Steps section | 3 numbered steps connected by a dashed line |
| `DashboardPreview.jsx` | App mockup | Detailed static HTML mockup of the dashboard UI |
| `Testimonials.jsx` | Social proof | 3 testimonial cards |
| `FinalCTA.jsx` | Call to action | Dark section with animated concentric rings |
| `LandingFooter.jsx` | Footer | Links grid, social icons, tech stack badges |

---

## docs/ Directory

```
docs/
├── ARCHITECTURE.md         ← System design, component hierarchy, request lifecycle
├── API_DOCUMENTATION.md    ← Every endpoint with examples
├── DATABASE_SCHEMA.md      ← Tables, relationships, design decisions
├── DEPLOYMENT_GUIDE.md     ← Step-by-step Railway + Vercel setup
├── USER_FLOW.md            ← Every user journey with flow diagrams
├── SECURITY.md             ← Auth, hashing, isolation, known limitations
├── FEATURES.md             ← Complete feature breakdown
├── PROJECT_STRUCTURE.md    ← This file
├── DESIGN_SYSTEM.md        ← Colors, typography, components
├── DEMO_SCRIPT.md          ← Video presentation script
└── FUTURE_IMPROVEMENTS.md  ← Roadmap and next steps
```

---

## Configuration Files

### vite.config.js

```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
})
```

Minimal config — Vite's defaults handle everything for a React SPA.

### tailwind.config.js

```javascript
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      animation: {
        "spin-slow": "spin 20s linear infinite",
      },
    },
  },
  plugins: [],
}
```

The `content` array tells Tailwind which files to scan for class names. Only classes that appear in these files are included in the final CSS bundle. This is why dynamic class names (like `bg-${color}-50`) don't work — they're never seen during the scan.

### postcss.config.js

```javascript
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
```

Standard PostCSS configuration. Autoprefixer adds vendor prefixes for older browser support.

---

## File Dependency Map

How files depend on each other (simplified):

```
main.jsx
  └── App.jsx
        ├── LandingPage.jsx
        │     └── landing/*.jsx
        │
        ├── LoginPage.jsx
        │     └── api.js
        │     └── AuthContext.jsx
        │
        ├── SignupPage.jsx (same)
        │
        └── ProtectedRoute.jsx
              └── DashboardLayout.jsx
                    ├── Navbar.jsx ──── AuthContext.jsx
                    ├── Sidebar.jsx
                    └── Outlet
                          ├── HomePage.jsx ──── api.js
                          │                └── EmptyState.jsx
                          │
                          ├── CreateTicketPage.jsx ─ api.js
                          │                       └ ToastContext.jsx
                          │
                          └── TicketDetailPage.jsx ─ api.js
                                                   └ ToastContext.jsx

api.js ← used by all pages that fetch data
AuthContext.jsx ← used by ProtectedRoute, Navbar, LoginPage, SignupPage
ToastContext.jsx ← used by pages that show notifications
Toast.jsx ← rendered by ToastContainer in App.jsx
```

Every page communicates with the backend exclusively through `api.js`. No page imports another page. Components are shared downward — no upward imports.
