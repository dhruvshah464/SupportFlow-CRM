# Contributing to SupportFlow CRM

Thank you for your interest in contributing! This document covers how to set up the project locally, the coding conventions used throughout the codebase, how to write commit messages, and the pull request process.

---

## Table of Contents

- [Development Setup](#development-setup)
- [Project Structure Quick Reference](#project-structure-quick-reference)
- [Running the App Locally](#running-the-app-locally)
- [Coding Style](#coding-style)
  - [Python (Backend)](#python-backend)
  - [JavaScript/React (Frontend)](#javascriptreact-frontend)
  - [CSS / Tailwind](#css--tailwind)
- [Commit Conventions](#commit-conventions)
- [Pull Request Process](#pull-request-process)
- [Branch Naming](#branch-naming)
- [Testing](#testing)
- [Adding a New API Endpoint](#adding-a-new-api-endpoint)
- [Adding a New Frontend Page](#adding-a-new-frontend-page)

---

## Development Setup

### Requirements

| Tool | Version | Install |
|------|---------|---------|
| Python | 3.10+ | [python.org](https://python.org) |
| Node.js | 18+ | [nodejs.org](https://nodejs.org) |
| npm | 9+ | Comes with Node |
| Git | Any recent | [git-scm.com](https://git-scm.com) |

### 1. Clone the repository

```bash
git clone https://github.com/your-username/supportflow-crm.git
cd supportflow-crm
```

### 2. Set up the backend

```bash
cd backend

# Create a virtual environment
python3 -m venv venv

# Activate it
source venv/bin/activate          # macOS / Linux
# venv\Scripts\activate           # Windows PowerShell

# Install dependencies
pip install -r requirements.txt

# Copy the example env file
cp ../.env.example .env
# Edit .env and set SECRET_KEY to any 32+ character string
```

### 3. Set up the frontend

```bash
cd ../frontend

# Install Node dependencies
npm install

# Copy the example env file
cp ../.env.example .env.local
# .env.local already has VITE_API_URL=http://localhost:8000
```

### 4. Start both servers

**Terminal 1 — Backend:**
```bash
cd backend
source venv/bin/activate
python3 -m uvicorn main:app --reload --port 8000
```

**Terminal 2 — Frontend:**
```bash
cd frontend
npm run dev
```

Frontend opens at **http://localhost:5173**
Backend API docs at **http://localhost:8000/docs**

---

## Project Structure Quick Reference

```
supportflow-crm/
├── backend/
│   ├── main.py          ← All routes
│   ├── models.py        ← SQLAlchemy models
│   ├── schemas.py       ← Pydantic request/response schemas
│   ├── auth.py          ← JWT + bcrypt utilities
│   ├── database.py      ← DB engine and session
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   │   ├── api.js           ← All API calls
│   │   ├── App.jsx          ← Routes
│   │   ├── main.jsx         ← Root mount
│   │   ├── context/         ← AuthContext, ToastContext
│   │   ├── pages/           ← Page-level components
│   │   ├── components/      ← Shared + landing components
│   │   └── index.css        ← Tailwind + custom component classes
│   └── package.json
│
├── docs/                ← Documentation
├── .env.example         ← Environment variable template
└── README.md
```

---

## Running the App Locally

After setup, the typical development workflow is:

1. Start both servers (backend + frontend) as described above
2. Make changes to source files — both servers support hot-reload
3. Test your changes in the browser at `http://localhost:5173`
4. Test the API directly at `http://localhost:8000/docs`

### Resetting the database

If you need a fresh database (e.g., after changing models):

```bash
cd backend
rm -f support_crm.db
# Restart the backend — SQLAlchemy recreates tables on startup
python3 -m uvicorn main:app --reload
```

---

## Coding Style

### Python (Backend)

- **Formatter:** Black (run `black .` before committing)
- **Linter:** Flake8 with default rules
- **Type hints:** Use them on all function signatures
- **Docstrings:** Only when the function behavior is non-obvious; otherwise skip
- **Line length:** 88 characters (Black's default)

#### Style examples

```python
# Good
def get_ticket_or_404(ticket_id: int, db: Session, user_id: int) -> models.Ticket:
    ticket = db.query(models.Ticket).filter(
        models.Ticket.id == ticket_id,
        models.Ticket.user_id == user_id,
    ).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    return ticket

# Avoid
def get_ticket(id, db, uid):
    t = db.query(models.Ticket).filter(models.Ticket.id == id, models.Ticket.user_id == uid).first()
    if not t: raise HTTPException(status_code=404, detail="Not found")
    return t
```

- One route file is fine for this project size; split into routers if the file exceeds ~300 lines
- Use `response_model=` on every route for consistent serialization
- Keep route handlers thin: validate input, call helpers, return data

### JavaScript/React (Frontend)

- **No TypeScript** (for simplicity in this project — a future improvement)
- **Formatter:** Prettier with default settings
- **Component naming:** PascalCase (`TicketTable`, `EmptyState`)
- **File naming:** matches component name (`TicketTable.jsx`, `EmptyState.jsx`)
- **Hooks:** custom hooks prefixed with `use` (`useAuth`, `useToast`)
- **Avoid inline styles:** use Tailwind classes
- **No `var`:** use `const` by default, `let` only when reassignment is needed

#### Style examples

```jsx
// Good — small, focused component
function StatusBadge({ status }) {
  const styles = {
    open: "bg-blue-50 text-blue-700 border-blue-200",
    in_progress: "bg-amber-50 text-amber-700 border-amber-200",
    resolved: "bg-emerald-50 text-emerald-700 border-emerald-200",
    closed: "bg-zinc-100 text-zinc-500 border-zinc-200",
  };
  return (
    <span className={`badge ${styles[status]}`}>
      {status.replace("_", " ")}
    </span>
  );
}

// Avoid — hardcoded styles, template-literal class names (breaks Tailwind purge)
function StatusBadge({ status }) {
  return (
    <span style={{ color: "blue" }} className={`bg-${status}-50`}>
      {status}
    </span>
  );
}
```

- Keep API calls in `api.js` — never call `fetch()` directly in components
- Use `useEffect` for data fetching; always handle loading and error states
- Avoid prop drilling more than 2 levels — use context

### CSS / Tailwind

- Use Tailwind utility classes for one-off styles
- Extract repeated class combinations into `@layer components` in `index.css`:

```css
@layer components {
  .btn-primary {
    @apply inline-flex items-center gap-2 px-4 py-2 bg-blue-600
           hover:bg-blue-700 text-white font-semibold text-sm
           rounded-xl transition-all shadow-sm;
  }
}
```

- **Never** use `!important`
- Use `transition-all` (not `transition`) for smooth hover effects
- Responsive classes go after base classes: `text-sm md:text-base lg:text-lg`

---

## Commit Conventions

We follow the **Conventional Commits** specification. Format:

```
<type>(<scope>): <short description>

[optional body]
```

### Types

| Type | When to use |
|------|-------------|
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation changes |
| `style` | Code style changes (formatting, whitespace) — no logic changes |
| `refactor` | Code reorganization — no new features, no bug fixes |
| `test` | Adding or updating tests |
| `chore` | Build tools, CI config, dependency updates |

### Scope

Optional. Use the area of the codebase affected: `auth`, `tickets`, `notes`, `ui`, `api`, `db`.

### Examples

```bash
# Good commit messages
feat(auth): add JWT authentication with bcrypt password hashing
fix(tickets): filter tickets by user_id to prevent cross-user data access
docs: add deployment guide for Railway and Vercel
style(frontend): run Prettier on all JSX files
chore: update FastAPI to 0.110.0

# Bad commit messages — too vague
fix bug
update stuff
wip
changes
```

### Writing the body

For complex changes, add a body explaining *why*, not *what*:

```
feat(auth): add 7-day JWT expiry

Tokens previously had no expiry, meaning a stolen token was valid forever.
7 days balances security with UX (users don't have to log in constantly).
```

---

## Pull Request Process

1. **Create a branch** from `main` (see Branch Naming below)
2. **Make your changes** — keep PRs focused; one feature or fix per PR
3. **Test locally** — make sure both backend and frontend work
4. **Commit** following the conventions above
5. **Push** your branch and open a Pull Request against `main`
6. **Fill in the PR description** using this template:

```markdown
## What changed

Brief description of the change.

## Why

The motivation — what problem does this solve?

## How to test

Steps to verify the change works as expected:

1. Start the backend and frontend
2. Navigate to ...
3. Do X, expect Y

## Screenshots (if UI change)

[attach before/after screenshots]
```

7. **Request a review** — at least one approval required before merging
8. **Merge** — use "Squash and merge" to keep the `main` branch history clean

---

## Branch Naming

```
<type>/<short-description>
```

Examples:

```
feat/user-profile-page
fix/ticket-404-on-delete
docs/update-api-reference
chore/upgrade-react-19
```

Keep it lowercase, use hyphens not underscores.

---

## Testing

There are currently no automated tests in this project (a known gap — see `docs/FUTURE_IMPROVEMENTS.md`). Until tests are added:

### Backend manual testing

Use the FastAPI Swagger UI at `http://localhost:8000/docs` to test endpoints interactively. The "Authorize" button in the top right lets you paste a JWT token to test protected endpoints.

### Frontend manual testing

Test the happy path and edge cases by hand:

- Sign up with a new email
- Log in with wrong password — expect error
- Create, update, and delete a ticket
- Add and delete notes
- Log out and verify the dashboard is inaccessible without login
- Resize the browser to check mobile responsiveness

### When tests are added

The plan is to add:
- **pytest** for backend unit and integration tests
- **Vitest + React Testing Library** for frontend component tests

Check `docs/FUTURE_IMPROVEMENTS.md` for the full plan.

---

## Adding a New API Endpoint

1. **Define the Pydantic schema** in `backend/schemas.py`
2. **Add the route** in `backend/main.py`
3. **Add `Depends(get_current_user)`** unless the endpoint is intentionally public
4. **Filter by `user_id`** for any ticket/note queries
5. **Test** via `http://localhost:8000/docs`
6. **Update** `docs/API_DOCUMENTATION.md`

Example skeleton:

```python
# schemas.py
class NewThingCreate(BaseModel):
    name: str
    description: Optional[str] = None

class NewThingOut(BaseModel):
    id: int
    name: str
    description: Optional[str]
    created_at: datetime
    model_config = {"from_attributes": True}

# main.py
@app.post("/api/things", response_model=schemas.NewThingOut, status_code=201)
def create_thing(
    body: schemas.NewThingCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    thing = models.NewThing(**body.model_dump(), user_id=current_user.id)
    db.add(thing)
    db.commit()
    db.refresh(thing)
    return thing
```

---

## Adding a New Frontend Page

1. **Create the page** in `frontend/src/pages/NewPage.jsx`
2. **Add the route** in `frontend/src/App.jsx`
3. **Wrap in ProtectedRoute** if authentication is required
4. **Add the API call** to `frontend/src/api.js` if it needs backend data
5. **Add navigation** (sidebar link, navbar link, or button) so users can reach the page

Example skeleton:

```jsx
// pages/NewPage.jsx
import { useState, useEffect } from "react";
import { api } from "../api";

export function NewPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.getSomething()
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-8">Loading...</div>;
  if (error) return <div className="p-8 text-red-500">{error}</div>;

  return (
    <div className="p-8">
      {/* Page content */}
    </div>
  );
}
```

```jsx
// App.jsx — add inside the /dashboard route
<Route path="new-thing" element={<NewPage />} />
```
