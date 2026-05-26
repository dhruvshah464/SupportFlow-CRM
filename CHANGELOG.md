# Changelog

All notable changes to SupportFlow CRM are documented here. The project follows [Semantic Versioning](https://semver.org/) (MAJOR.MINOR.PATCH).

---

## [v5.1.0] — 2026-05-26 — Render + PostgreSQL Deployment

Migrated deployment target from Railway to Render, replaced SQLite with PostgreSQL for production, and added proper Vercel SPA routing.

### Added

- `render.yaml` — Render Blueprint spec for one-click backend + database deployment
- `frontend/vercel.json` — Catch-all rewrite for React Router SPA support on Vercel
- `psycopg2-binary` to `requirements.txt` for PostgreSQL driver
- `FRONTEND_URL` env var for CORS configuration (replaces wildcard `*`)
- `JWT_SECRET` env var support in `auth.py` (Render-friendly name)

### Changed

- `backend/database.py` — auto-converts `postgres://` → `postgresql://` (Render format)
- `backend/main.py` — CORS now uses `FRONTEND_URL` env var instead of `allow_origins=["*"]`
- `backend/auth.py` — reads `JWT_SECRET` first, falls back to `SECRET_KEY` for backward compat
- `backend/requirements.txt` — added `psycopg2-binary`
- `.env.example` — updated with `JWT_SECRET` and `FRONTEND_URL`
- `README.md` — replaced Railway deployment section with Render + Vercel instructions
- `docs/DEPLOYMENT_GUIDE.md` — full rewrite for Render + Vercel workflow
- `docs/ARCHITECTURE.md`, `docs/SECURITY.md` — updated Railway references to Render

### Removed

- `backend/railway.toml` — no longer needed
- `frontend/railway.toml` — no longer needed

---

## [v5.0.0] — 2026-05-25 — Production-Ready Auth + Premium Design

This release is a complete transformation: full authentication, user data isolation, and a ground-up redesign of both the landing page and dashboard.

### Added

- **User authentication** — Signup and login with email + password
- **JWT-based sessions** — 7-day bearer tokens, stored in localStorage
- **bcrypt password hashing** — bcrypt work factor 12; passwords never stored plain text
- **Protected routes** — `/dashboard/*` requires authentication; unauthenticated visitors are redirected to `/login`
- **User data isolation** — Every ticket is scoped to the creating user; users cannot access each other's data
- **`POST /api/auth/signup`** — Creates a new user, returns token + user profile
- **`POST /api/auth/login`** — Authenticates user, returns token + user profile
- **`GET /api/auth/me`** — Returns current user profile (used for session restoration on app load)
- **`AuthContext`** — Global React context for user state, login, signup, and logout
- **`ToastContext`** — Global notification system with success/error/info types
- **Toast notifications** — Bottom-right toast system with Framer Motion animations, auto-dismiss after 3.5s
- **`ProtectedRoute` component** — Auth guard with loading spinner and redirect
- **`LoginPage`** — Clean card-based login form with show/hide password toggle
- **`SignupPage`** — Registration form with client-side password validation
- **Empty states** — When a user has no tickets, a helpful empty state with "Create ticket" CTA is shown
- **Landing page redesign** — Full light/white theme overhaul
  - `LandingNavbar` — White with backdrop blur, scroll-activated shadow
  - `Hero` — Dot-grid background, animated badge, browser mockup
  - `Stats` — Social proof numbers on zinc-50 background
  - `Features` — 6 feature cards on white
  - `HowItWorks` — 3-step numbered process
  - `DashboardPreview` — Detailed light-theme dashboard mockup
  - `Testimonials` — 3 customer quote cards
  - `FinalCTA` — Dark (zinc-900) section with animated rings
  - `LandingFooter` — Links grid + social icons + tech stack badges

### Changed

- Dashboard badge styles updated to Stripe-inspired pattern (colored bg + text + border)
- `bg-dot-grid` updated from white dots (dark bg) to dark dots (light bg)
- All ticket queries now filter by `user_id == current_user.id`
- `api.js` rewritten with centralized `request()` helper, automatic token injection, and 401 interception
- `Navbar` now shows logged-in user's name and a Logout button
- `TicketDetailPage` migrated from inline save message to toast notifications
- `CreateTicketPage` now shows success toast on ticket creation
- Root page background changed from `bg-zinc-950` (dark) to `bg-white text-zinc-900` (light)
- Database `tickets` table: added `user_id` column with FK to `users`

### Fixed

- bcrypt 5.x compatibility: switched from passlib to direct bcrypt import to fix `ValueError: password cannot be longer than 72 bytes`
- Old SQLite database (without `user_id` column) replaced with fresh schema

### Security

- Added `Depends(get_current_user)` to all ticket and notes endpoints
- Cross-user ticket access returns 404 (not 403) to prevent resource enumeration

---

## [v4.0.0] — 2026-05-20 — Dashboard Redesign

A major visual overhaul of the dashboard with improved UX throughout.

### Added

- Stats cards at the top of the dashboard (total, open, in-progress, resolved ticket counts)
- `GET /api/stats` endpoint for aggregated ticket statistics
- Sidebar navigation with active route highlighting
- `DashboardLayout` with persistent navbar and sidebar
- `EmptyState` component for zero-data states

### Changed

- Dashboard rebuilt with two-panel layout (sidebar + main content)
- Ticket table redesigned: cleaner typography, subtle row hover, better mobile behavior
- Status and priority badges redesigned with semantic colors
- `TicketDetailPage` redesigned with left/right panel layout
- Notes panel relocated to right side of ticket detail

### Removed

- Demo/seeded tickets removed — new users start with an empty database
- Old monolithic dashboard page replaced with layout + page components

---

## [v3.0.0] — 2026-05-15 — Notes System

Added the ability to attach internal notes to support tickets.

### Added

- `notes` database table with `ticket_id` FK
- `Note` SQLAlchemy model
- `NoteCreate` and `NoteOut` Pydantic schemas
- `GET /api/tickets/{id}/notes` — list notes for a ticket
- `POST /api/tickets/{id}/notes` — add a note to a ticket
- `DELETE /api/tickets/{id}/notes/{note_id}` — delete a specific note
- Notes UI panel on the ticket detail page
- Inline save confirmation message on the ticket detail page

### Changed

- Ticket detail page reorganized to accommodate notes panel
- Notes cascade-delete when their parent ticket is deleted

---

## [v2.0.0] — 2026-05-10 — Core Ticket CRUD

Full ticket management with create, read, update, delete operations.

### Added

- `tickets` database table
- `Ticket` SQLAlchemy model (title, description, status, priority, customer_name, customer_email, timestamps)
- `TicketCreate`, `TicketUpdate`, `TicketOut` Pydantic schemas
- `GET /api/tickets` — list all tickets with optional `status`, `priority`, `search` filters
- `POST /api/tickets` — create a new ticket
- `GET /api/tickets/{id}` — get a single ticket
- `PUT /api/tickets/{id}` — update a ticket (partial update supported)
- `DELETE /api/tickets/{id}` — delete a ticket
- Dashboard ticket list table
- Ticket detail page with editable fields
- Create ticket form page
- React Router navigation between pages
- Status and priority badge components

### Changed

- Backend migrated from Flask prototype to FastAPI
- Database migrated from raw SQL to SQLAlchemy ORM

---

## [v1.0.0] — 2026-05-05 — Initial Prototype

The very first working version — a minimal proof of concept.

### Added

- FastAPI backend with a single `/api/tickets` endpoint (list only)
- SQLite database via SQLAlchemy
- Basic React frontend with Vite
- Single-page ticket list (no navigation, no routing)
- Tailwind CSS integration
- Demo seed data (10 pre-created tickets)
- CORS configuration for local development
- `requirements.txt` and `package.json` dependencies
- `README.md` with basic setup instructions

---

## Upgrade Notes

### Upgrading from v4 to v5

v5 introduces authentication, which requires a database migration:

```bash
# Back up any existing data if needed
cp backend/support_crm.db backend/support_crm.db.backup

# Delete the old database (it lacks the users table and user_id column)
rm -f backend/support_crm.db

# Restart the backend — it will recreate the database with the new schema
python3 -m uvicorn main:app --reload
```

All existing tickets will be lost in this migration. This is expected — without user ownership, the old tickets cannot be attributed to a user.

### Environment variables added in v5

The following environment variables are new in v5 and required for deployment:

```
SECRET_KEY=<32+ random characters>   ← REQUIRED for JWT signing
CORS_ORIGINS=<frontend URL>           ← recommended for security
```

See `.env.example` for the full variable list.
