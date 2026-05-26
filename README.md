# SupportFlow CRM

A full-stack customer support ticketing system. Agents sign up, create tickets for customer issues, track them through **Open → In Progress → Closed**, and collaborate via internal notes.

Built with **React + Vite** on the frontend and **FastAPI + SQLAlchemy** on the backend.

**Live:** [Frontend (Vercel)](https://supportflow-crm.vercel.app) · [Backend API (Render)](https://your-api.onrender.com)

---

## Features

- **JWT Authentication** — Secure sign-up/login with bcrypt password hashing and token-based sessions
- **Ticket CRUD** — Create, view, update, and delete tickets with customer details, descriptions, and priority levels
- **User Data Isolation** — Each user only sees their own tickets (enforced via `user_id` foreign key on every query)
- **Internal Notes** — Add timestamped notes to tickets for tracking investigation progress
- **Search & Filters** — Full-text search across ticket ID, customer name, email, subject, and description. Filter by status and priority
- **Dashboard Stats** — Live count of total/open/in-progress/closed tickets
- **Responsive UI** — Works on desktop, tablet, and mobile

---

## Architecture

```
┌─────────────┐     REST/JSON      ┌──────────────┐     SQLAlchemy     ┌──────────┐
│  React SPA  │  ←───────────────→ │  FastAPI API  │  ←──────────────→ │  SQLite  │
│  (Vite)     │   Authorization:   │  (Uvicorn)    │                   │  / PG    │
│  Port 5173  │   Bearer <JWT>     │  Port 8000    │                   │          │
└─────────────┘                    └──────────────┘                    └──────────┘
```

- **Frontend** — React 18 SPA. Handles routing, auth state (Context API), and API calls via a centralized fetch wrapper (`api.js`).
- **Backend** — FastAPI with Pydantic v2 validation. All protected routes use `get_current_user` dependency injection to extract and verify the JWT.
- **Database** — SQLite for development (zero-config), PostgreSQL for production. SQLAlchemy ORM with `declarative_base`. Tables auto-created on startup via `Base.metadata.create_all()`.

---

## User Flow

1. New user signs up → backend hashes password with bcrypt, returns JWT
2. Frontend stores JWT in `localStorage`, sets `Authorization: Bearer` header on all requests
3. User lands on dashboard → sees stats and empty ticket list
4. Creates a ticket → system assigns sequential ID like `TKT-0001`
5. Opens ticket → can update status/priority, add internal notes
6. Marks ticket as "Closed" → dashboard stats update in real-time

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, Vite, React Router v6, Tailwind CSS, Framer Motion, Lucide Icons |
| Backend | FastAPI, SQLAlchemy, Pydantic v2, python-jose (JWT), bcrypt |
| Database | SQLite (dev) / PostgreSQL (production) |
| Deployment | Vercel (frontend), Render (backend + database) |

---

## Getting Started

### Prerequisites
- Python 3.10+
- Node.js 18+

### Backend
```bash
cd backend
python3 -m venv venv
source venv/bin/activate    # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp ../.env.example .env     # then edit JWT_SECRET
uvicorn main:app --reload --port 8000
```
API docs at `http://localhost:8000/docs` (auto-generated Swagger UI).

### Frontend
```bash
cd frontend
npm install
npm run dev
```
Opens at `http://localhost:5173`. Vite's dev proxy forwards `/api` requests to the backend (see `vite.config.js`).

---

## Environment Variables

**Backend (`backend/.env`):**

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `JWT_SECRET` | Yes | dev fallback | Secret key for signing JWTs. Generate: `python3 -c "import secrets; print(secrets.token_hex(32))"` |
| `DATABASE_URL` | No | `sqlite:///./support_crm.db` | Database connection string. Render sets this automatically for PostgreSQL. |
| `FRONTEND_URL` | No | `http://localhost:5173` | Allowed CORS origin(s). Comma-separated for multiple. |

**Frontend (`frontend/.env.local`):**

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `VITE_API_URL` | Production only | `""` (empty) | Backend URL. Leave blank in dev — Vite's proxy handles it. |

---

## Deployment

The app deploys as two services:

- **Backend → Render** — Push to GitHub → connect repo → Render reads `render.yaml` and creates the API + PostgreSQL database automatically.
- **Frontend → Vercel** — Connect repo → set root directory to `frontend` → add `VITE_API_URL` env var pointing to the Render URL.

After both are deployed, update `FRONTEND_URL` on Render to your Vercel domain for CORS.

See `render.yaml` for the Blueprint configuration and `frontend/vercel.json` for SPA rewrites.

> **Note:** Render's free tier spins down after 15 min of inactivity. The first request after sleep takes ~30s. This is normal.

---

## Folder Structure

```
backend/
├── main.py              # API routes (auth, tickets, notes, stats)
├── auth.py              # JWT creation/verification + bcrypt hashing
├── models.py            # SQLAlchemy models (User, Ticket, Note)
├── schemas.py           # Pydantic request/response schemas
├── database.py          # Engine + session factory
└── requirements.txt

frontend/src/
├── api.js               # Centralized fetch wrapper with auth headers
├── App.jsx              # Route definitions
├── main.jsx             # React root + providers
├── context/             # AuthContext (login/logout/state), ToastContext
├── components/          # Navbar, badges, spinner, toast, landing sections
├── layouts/             # DashboardLayout (navbar + Outlet)
└── pages/               # LandingPage, LoginPage, SignupPage, HomePage,
                         # CreateTicketPage, TicketDetailPage
```

---

## API Endpoints

All protected routes require `Authorization: Bearer <token>` header.

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/signup` | No | Register new user |
| POST | `/api/auth/login` | No | Login, returns JWT |
| GET | `/api/auth/me` | Yes | Get current user profile |
| GET | `/api/stats` | Yes | Dashboard statistics |
| GET | `/api/tickets` | Yes | List tickets (supports `?status=`, `?priority=`, `?search=`) |
| POST | `/api/tickets` | Yes | Create ticket |
| GET | `/api/tickets/{id}` | Yes | Ticket detail with notes |
| PUT | `/api/tickets/{id}` | Yes | Update status/priority, optionally add note |
| DELETE | `/api/tickets/{id}` | Yes | Delete ticket |
| POST | `/api/tickets/{id}/notes` | Yes | Add internal note |
| GET | `/health` | No | Health check |

---

## Authentication Flow

```
Frontend                          Backend
   │                                 │
   │  POST /api/auth/login           │
   │  { email, password }            │
   │ ──────────────────────────────→ │
   │                                 │  bcrypt.checkpw(password, hash)
   │                                 │  jwt.encode({ sub: user_id })
   │  { token, user }               │
   │ ←────────────────────────────── │
   │                                 │
   │  GET /api/tickets               │
   │  Authorization: Bearer <token>  │
   │ ──────────────────────────────→ │
   │                                 │  jwt.decode(token) → user_id
   │                                 │  SELECT * WHERE user_id = ?
   │  [ tickets ]                    │
   │ ←────────────────────────────── │
```

1. User submits email + password
2. Backend verifies credentials with bcrypt, creates JWT with `user_id` as the `sub` claim
3. Frontend stores token in `localStorage`, attaches it as `Bearer` header on every request
4. Backend's `get_current_user` dependency extracts `user_id` from JWT, loads user from DB
5. All queries are scoped to `user_id` — zero chance of data leakage between users

---

## Design Decisions

**Why FastAPI?** Automatic request validation via Pydantic, built-in Swagger docs, and dependency injection (used heavily for auth). Compared to Flask, less boilerplate for the same result.

**Why Vite over CRA?** Vite's dev server starts in <300ms vs CRA's 10+ seconds. Hot module replacement is near-instant. The dev proxy feature also simplifies local CORS setup.

**Why SQLite in dev?** Zero setup. Clone, install, run. The ORM layer means switching to PostgreSQL for production is a one-line env var change.

**Why Context API over Redux?** Two contexts (Auth + Toast) is all this app needs. Redux would be over-engineering for this scope.

---

## Future Improvements

- **Team workspaces** — Multi-agent collaboration with ticket assignment
- **Email notifications** — Send updates when ticket status changes
- **File attachments** — Upload screenshots/logs to tickets (S3)
- **Test coverage** — pytest (backend) + Vitest (frontend)
- **TypeScript migration** — Incremental, starting with shared types

---

## Docs

Additional documentation is in the `docs/` folder:

| Document | Contents |
|----------|----------|
| `API_DOCUMENTATION.md` | Full endpoint reference with request/response examples |
| `ARCHITECTURE.md` | System design, data flow, and component breakdown |
| `DATABASE_SCHEMA.md` | Table definitions, relationships, and indexes |
| `DEPLOYMENT_GUIDE.md` | Step-by-step Vercel + Render deployment |
| `DESIGN_SYSTEM.md` | UI component library and style guide |
| `FEATURES.md` | Detailed feature specifications |
| `FUTURE_IMPROVEMENTS.md` | Roadmap and planned enhancements |
| `PROJECT_STRUCTURE.md` | File-by-file code walkthrough |
| `SECURITY.md` | Auth implementation and security considerations |
| `USER_FLOW.md` | End-to-end user journey documentation |
| `DEMO_SCRIPT.md` | Script for live demo walkthrough |

---

Built for the Datastraw Technologies Data Engineer Assessment.
