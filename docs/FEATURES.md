# Features

A complete breakdown of every feature in SupportFlow CRM — what it does, how it works, and why it was built this way.

---

## Table of Contents

- [Authentication](#authentication)
- [Ticket Management](#ticket-management)
- [Notes System](#notes-system)
- [Dashboard Overview](#dashboard-overview)
- [Filtering and Search](#filtering-and-search)
- [Landing Page](#landing-page)
- [Design and UX Features](#design-and-ux-features)
- [Developer Features](#developer-features)

---

## Authentication

### User Registration

**What it does:** Allows new users to create an account with their name, email, and password.

**How it works:**
- Form validates that email is properly formatted and password is at least 8 characters long
- Backend checks the email against the database — if it already exists, returns a clear error
- Password is hashed with bcrypt (work factor 12) before storage
- On success, a JWT token is issued and the user is immediately logged in

**Why this way:** Signing in right after signup avoids the friction of making users log in immediately after creating their account. The 8-character password minimum is a sensible baseline that doesn't over-restrict users.

---

### User Login

**What it does:** Authenticates existing users and gives them access to their dashboard.

**How it works:**
- User enters email and password
- Backend looks up the user by email, then uses bcrypt to verify the password
- If valid, issues a JWT token valid for 7 days
- Token is stored in `localStorage` on the client

**Security note:** The error message is deliberately generic ("Invalid email or password") — it doesn't reveal whether the email is registered, which would help attackers enumerate accounts.

---

### Session Persistence

**What it does:** Keeps users logged in across browser sessions and page refreshes without asking them to re-authenticate every time.

**How it works:**
- JWT token is stored in `localStorage` — it survives page refreshes and browser restarts
- On app load, `AuthContext` reads the token from `localStorage` and calls `GET /api/auth/me` to verify it's still valid
- If the token is expired or tampered with, the user is redirected to login silently

**Why this way:** Without session persistence, users would need to log in every time they open the app. The 7-day token lifetime balances security (tokens expire) with convenience.

---

### Logout

**What it does:** Clears the user's session and returns them to the landing page.

**How it works:**
- Clicking "Logout" in the navbar calls `AuthContext.logout()`
- The token is removed from `localStorage`
- The user object in React state is set to `null`
- React Router navigates to `/`

**Why this way:** Logout is immediate and doesn't require a server round-trip. Since JWTs are stateless, the server doesn't need to be notified — the token simply ceases to be used by the client.

---

### Protected Routes

**What it does:** Prevents unauthenticated users from accessing the dashboard.

**How it works:**
- The `ProtectedRoute` component wraps all dashboard routes
- It checks the current user from `AuthContext`
- While the auth check is in progress (loading state), it shows a spinner
- If no user is found, it redirects to `/login` using React Router's `<Navigate>` component

**Why this way:** Client-side route protection is a UX layer — it prevents rendering the dashboard UI for unauthenticated users. The real security is on the backend, which independently verifies the token on every API request.

---

## Ticket Management

### Creating Tickets

**What it does:** Lets users create new support tickets to track customer issues.

**Fields:**
| Field | Required | Description |
|-------|----------|-------------|
| Title | Yes | Short summary of the issue |
| Description | No | Detailed problem description |
| Status | No | Defaults to "Open" |
| Priority | No | Defaults to "Medium" |
| Customer Name | No | Name of the affected customer |
| Customer Email | No | Email of the affected customer |

**How it works:**
- Form validated client-side (title required)
- `POST /api/tickets` with auth token in header
- Backend assigns `user_id` from the token — users cannot create tickets for other users
- On success: navigates to the ticket detail page and shows a success toast

---

### Viewing Tickets

**What it does:** Shows all of the logged-in user's tickets in a sortable table.

**How it works:**
- Dashboard home loads all tickets via `GET /api/tickets`
- Table shows: title, customer name, status badge, priority badge, creation date
- Clicking any row navigates to the ticket detail page
- Empty state shown when no tickets exist (with a "Create ticket" CTA)

**Data isolation:** The API only returns tickets belonging to the authenticated user. There's no way to see another user's tickets.

---

### Ticket Detail View

**What it does:** Shows the full details of a single ticket and allows editing all fields.

**How it works:**
- Two-panel layout: ticket fields on the left, notes on the right
- All fields are editable inline
- Status and priority dropdowns update the ticket immediately via `PUT /api/tickets/:id`
- Save button sends all edits in one request
- Timestamps (created, last updated) shown at the bottom

---

### Editing Tickets

**What it does:** Allows updating any ticket field — title, description, status, priority, customer info.

**How it works:**
- All edits are tracked in local React state
- Save button sends `PUT /api/tickets/:id` with the full updated ticket
- Backend responds with the updated ticket including the new `updated_at` timestamp
- Success toast confirms the save
- `updated_at` refreshes automatically — no manual timestamp management needed

---

### Status Management

**What it does:** Tracks where a ticket is in the support workflow.

**Statuses:**

| Status | Badge Color | Meaning |
|--------|-------------|---------|
| Open | Blue | Newly created, not yet assigned |
| In Progress | Amber | Someone is actively working on it |
| Resolved | Green | Issue fixed, awaiting confirmation |
| Closed | Gray | No further action needed |

Statuses can be changed freely — there's no enforced workflow. A resolved ticket can be reopened by setting it back to "In Progress" or "Open".

---

### Priority Management

**What it does:** Categorizes tickets by urgency to help teams prioritize their work.

**Priorities:**

| Priority | Badge Color | When to use |
|----------|-------------|-------------|
| Low | Gray | Minor issues, cosmetic bugs |
| Medium | Blue | Standard issues |
| High | Orange | Significant user impact |
| Urgent | Red | Service disruption, data loss risk |

---

### Deleting Tickets

**What it does:** Permanently removes a ticket and all its associated notes.

**How it works:**
- Delete button on the ticket detail page
- Calls `DELETE /api/tickets/:id`
- On success: navigates back to the dashboard, shows "Ticket deleted" toast
- Cascade delete: all notes on the deleted ticket are also removed from the database

**Why cascade:** This prevents orphaned note records in the database — notes without a parent ticket would be inaccessible and waste storage.

---

## Notes System

### Adding Notes

**What it does:** Lets users add internal comments to a ticket — useful for logging investigation steps, customer communications, or team handoff notes.

**How it works:**
- Notes panel on the right side of the ticket detail page
- Textarea for the note content
- "Add note" button sends `POST /api/tickets/:id/notes`
- New note appears immediately at the bottom of the note list
- Textarea is cleared after a successful save

---

### Viewing Notes

**What it does:** Shows all notes on a ticket in chronological order (oldest first, like a conversation thread).

**How it works:**
- Notes load alongside the ticket when the detail page opens
- Each note shows the content and the time it was created
- If there are no notes, a placeholder message appears

---

### Deleting Notes

**What it does:** Removes a note from a ticket.

**How it works:**
- Each note has a delete icon that appears on hover
- Clicking it sends `DELETE /api/tickets/:id/notes/:note_id`
- Note is removed from the UI immediately after success

---

## Dashboard Overview

### Stats Cards

**What it does:** Shows aggregate numbers at the top of the dashboard — total tickets, open tickets, in-progress tickets, and resolved tickets.

**How it works:**
- `GET /api/stats` returns counts aggregated server-side
- Four metric cards display the numbers with icons
- Only counts the current user's tickets

**Why server-side aggregation:** Counting in the database is more efficient than fetching all tickets and counting in JavaScript, especially as the ticket count grows.

---

### Ticket Table

**What it does:** Lists all tickets in a clean, scannable table with key information visible at a glance.

**Columns:**
- Ticket ID (subtle, right-aligned)
- Title + customer name (two-line cell)
- Status badge
- Priority badge
- Created date (relative: "2 days ago")

**Behavior:**
- Full row is clickable — navigates to ticket detail
- Hover state highlights the row
- Newest tickets appear at the top (sorted by `created_at DESC`)

---

### Empty State

**What it does:** Shown when the user has no tickets (or no tickets match current filters). Provides a clear next action instead of a blank screen.

**What it shows:**
- Illustration icon
- "No tickets yet" heading
- Supporting message
- "Create your first ticket" button

**Why it matters:** Blank screens are confusing. An empty state tells the user where they are and what to do next. It's especially important for new users who just signed up and have an empty dashboard.

---

## Filtering and Search

### Status Filter

**What it does:** Shows only tickets with a specific status.

**Options:** All, Open, In Progress, Resolved, Closed

**How it works:** Appends `?status=open` to the API request. Filtering happens server-side so only matching records are returned.

---

### Priority Filter

**What it does:** Shows only tickets with a specific priority level.

**Options:** All, Low, Medium, High, Urgent

---

### Text Search

**What it does:** Filters tickets by keyword — searches across title and description.

**How it works:** Appends `?search=keyword` to the API request. Backend performs a case-insensitive substring match using SQLAlchemy's `.ilike()` operator.

---

### Stacked Filters

All filters work simultaneously. A user can filter for "high-priority open tickets mentioning 'mobile'" in a single combined query.

---

## Landing Page

The landing page is a multi-section marketing page designed to communicate what SupportFlow does and convert visitors to sign up.

### Sections

| Section | Purpose |
|---------|---------|
| **Navbar** | Logo, nav links, "Log in" + "Get started" CTAs |
| **Hero** | Headline, subheadline, primary CTA, browser mockup |
| **Stats** | Social proof numbers (tickets resolved, teams, etc.) |
| **Features** | 6 key features with icons and descriptions |
| **How It Works** | 3-step numbered walkthrough |
| **Dashboard Preview** | Mockup screenshot of the actual dashboard |
| **Testimonials** | 3 customer quotes |
| **Final CTA** | Dark section with sign-up call-to-action |
| **Footer** | Links, social icons, tech stack badges |

### Scroll Animations

Every section uses Framer Motion's `whileInView` to fade and slide in as the user scrolls down. The `viewport={{ once: true }}` setting ensures animations only play once — not every time the element re-enters view.

### Responsive Design

The landing page is fully responsive:
- Desktop: multi-column grid layouts
- Tablet: 2-column where appropriate
- Mobile: single column, adjusted typography scale

---

## Design and UX Features

### Toast Notifications

**What it does:** Shows temporary success and error messages in the bottom-right corner of the screen.

**Types:** Success (green), Error (red), Info (blue)

**How it works:**
- Components call `useToast().show(message, type)`
- Toasts appear with a slide-up animation (Framer Motion)
- Auto-dismiss after 3.5 seconds
- Multiple toasts stack vertically
- Each toast can also be dismissed manually with the X button

**Why toast notifications:** Inline form error messages are good for validation, but for async operations (saving a ticket, adding a note), you want feedback that's visible without taking up space in the main layout.

---

### Scroll-Activated Navbar

On the landing page, the navbar starts transparent and gains a white background with a shadow when the user scrolls down. This is a common pattern on marketing sites that keeps the hero section feeling full-bleed.

---

### Framer Motion Animations

Used throughout the app for micro-interactions:
- Card hover lifts (`whileHover: { y: -2 }`)
- Page section fade-ins (`whileInView`)
- Toast enter/exit animations (`AnimatePresence`)
- Stat counter animations

These animations follow the principle of **purposeful motion** — every animation either communicates state change, guides attention, or provides feedback. No gratuitous spinning or bouncing.

---

### Responsive Dashboard

The dashboard layout adapts to screen size:
- Desktop: sidebar + main content area side-by-side
- Mobile: sidebar collapses, hamburger menu (or simplified nav)

---

## Developer Features

### FastAPI Auto-Generated Docs

The backend automatically generates interactive API documentation:
- **Swagger UI** at `/docs` — test endpoints from the browser
- **ReDoc** at `/redoc` — clean reference documentation

These update automatically as routes are added or changed. No separate documentation effort needed during development.

### Hot Reload

Both servers support hot reload during development:
- `uvicorn main:app --reload` — FastAPI restarts on Python file changes
- Vite HMR — React updates in the browser without a full page reload

### SQLite in Development

No database server required. SQLite creates a single file (`support_crm.db`) on first run. The ORM switch to PostgreSQL for production requires only setting the `DATABASE_URL` environment variable.

### Environment Variable Configuration

All configuration is via environment variables — no hardcoded URLs or secrets in the codebase. `.env.example` documents all required variables with safe placeholder values.
