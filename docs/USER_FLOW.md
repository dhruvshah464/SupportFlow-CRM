# User Flow

This document maps every path a user can take through SupportFlow CRM — from first landing on the marketing page through daily use of the dashboard. Understanding these flows helps you reason about the application's navigation and state management.

---

## Table of Contents

- [Overview](#overview)
- [Flow 1: First-Time Visitor → Sign Up → Dashboard](#flow-1-first-time-visitor--sign-up--dashboard)
- [Flow 2: Returning User → Login → Dashboard](#flow-2-returning-user--login--dashboard)
- [Flow 3: Creating a Ticket](#flow-3-creating-a-ticket)
- [Flow 4: Managing an Existing Ticket](#flow-4-managing-an-existing-ticket)
- [Flow 5: Adding Notes to a Ticket](#flow-5-adding-notes-to-a-ticket)
- [Flow 6: Filtering and Searching Tickets](#flow-6-filtering-and-searching-tickets)
- [Flow 7: Logging Out](#flow-7-logging-out)
- [Flow 8: Session Expiry](#flow-8-session-expiry)
- [Flow 9: Accessing Protected Routes Without Auth](#flow-9-accessing-protected-routes-without-auth)
- [Complete Navigation Map](#complete-navigation-map)
- [Empty State Flows](#empty-state-flows)
- [Error Flows](#error-flows)

---

## Overview

SupportFlow has two distinct zones:

| Zone | Routes | Access |
|------|--------|--------|
| **Public** | `/`, `/login`, `/signup` | Anyone |
| **Protected** | `/dashboard/*` | Authenticated users only |

The application enforces this at the `ProtectedRoute` component level — any attempt to visit a protected route without a valid token redirects to `/login`.

---

## Flow 1: First-Time Visitor → Sign Up → Dashboard

This is the primary onboarding flow.

```
┌─────────────────────────────────────────────────────────────────┐
│  User opens browser and types the URL for the first time        │
└──────────────────────────────┬──────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│  LANDING PAGE (/)                                               │
│                                                                 │
│  • Marketing sections load (Hero, Stats, Features, etc.)        │
│  • "Get started" CTA button visible in navbar and Hero section  │
└──────────────────────────────┬──────────────────────────────────┘
                               │
                               │ clicks "Get started" or "Start for free"
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│  SIGNUP PAGE (/signup)                                          │
│                                                                 │
│  Form fields:                                                   │
│  • Full name (required)                                         │
│  • Email address (required, must be valid format)              │
│  • Password (required, minimum 8 characters)                    │
│  • Show/hide password toggle                                    │
│  • "Already have an account? Sign in" link → /login            │
└──────────────────────────────┬──────────────────────────────────┘
                               │
                               │ submits form
                               ▼
                    ┌──────────┴──────────┐
                    │                     │
              API error?            API success?
                    │                     │
                    ▼                     ▼
          ┌─────────────────┐   ┌─────────────────────────────────┐
          │ Error shown      │   │ Token saved to localStorage      │
          │ below the form   │   │ User object stored in AuthContext│
          │ (e.g. "Email     │   │ Redirect to /dashboard           │
          │  already exists")│   └─────────────────────────────────┘
          └─────────────────┘             │
                                          ▼
                             ┌─────────────────────────────────────┐
                             │  DASHBOARD (/dashboard)             │
                             │                                     │
                             │  Empty state shown (no tickets yet) │
                             │  "Create ticket" CTA in center      │
                             └─────────────────────────────────────┘
```

---

## Flow 2: Returning User → Login → Dashboard

```
┌─────────────────────────────────────────────────────────────────┐
│  User visits /login (or clicks "Sign in" on landing page)       │
└──────────────────────────────┬──────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│  LOGIN PAGE (/login)                                            │
│                                                                 │
│  Form fields:                                                   │
│  • Email address                                                │
│  • Password + show/hide toggle                                  │
│  • "Don't have an account? Sign up" link → /signup             │
└──────────────────────────────┬──────────────────────────────────┘
                               │
                               │ submits form
                               ▼
                    ┌──────────┴──────────┐
                    │                     │
              API error?            API success?
                    │                     │
                    ▼                     ▼
          ┌─────────────────┐   ┌─────────────────────────────────┐
          │ "Invalid email   │   │ Token saved to localStorage      │
          │  or password"    │   │ User stored in AuthContext       │
          │  error message   │   │ Redirect to /dashboard          │
          └─────────────────┘   └─────────────────────────────────┘
                                          │
                                          ▼
                             ┌─────────────────────────────────────┐
                             │  DASHBOARD HOME (/dashboard)        │
                             │                                     │
                             │  User's tickets load and render     │
                             │  in the ticket table                │
                             └─────────────────────────────────────┘
```

### Session Restoration on Revisit

If the user previously logged in and returns to the app without logging out:

```
User opens browser to the app
       │
       ▼
main.jsx renders AuthProvider
       │
       ▼
AuthContext reads localStorage: crm_token exists
       │
       ▼
Calls GET /api/auth/me with the token
       │
       ├── Token valid → sets user in state → ProtectedRoute passes
       │
       └── Token invalid/expired → clears localStorage → redirects to /login
```

---

## Flow 3: Creating a Ticket

```
DASHBOARD HOME (/dashboard)
       │
       │ clicks "New ticket" (sidebar or top button)
       ▼
┌─────────────────────────────────────────────────────────────────┐
│  CREATE TICKET PAGE (/dashboard/new)                            │
│                                                                 │
│  Fields:                                                        │
│  • Title* (required)                                            │
│  • Description (textarea, optional)                             │
│  • Status (select: open/in_progress/resolved/closed)           │
│  • Priority (select: low/medium/high/urgent)                    │
│  • Customer Name (optional)                                     │
│  • Customer Email (optional)                                    │
│                                                                 │
│  Actions: "Save ticket" button, "Cancel" button                 │
└──────────────────────────────┬──────────────────────────────────┘
                               │
                     ┌─────────┴──────────┐
                     │                    │
              Cancel clicked         Save clicked
                     │                    │
                     ▼                    ▼
          Navigate back to     POST /api/tickets
          /dashboard           (with auth token)
                                          │
                               ┌──────────┴──────────┐
                               │                     │
                           Success              Error
                               │                     │
                               ▼                     ▼
                    ┌──────────────────┐   ┌─────────────────┐
                    │ Green toast:      │   │ Red toast:       │
                    │ "Ticket created"  │   │ Error message    │
                    │ Navigate to       │   │ Stay on form     │
                    │ /dashboard/       │   │ for correction   │
                    │ tickets/:id       │   └─────────────────┘
                    └──────────────────┘
```

---

## Flow 4: Managing an Existing Ticket

```
DASHBOARD HOME — ticket list table
       │
       │ clicks on a ticket row
       ▼
┌─────────────────────────────────────────────────────────────────┐
│  TICKET DETAIL PAGE (/dashboard/tickets/:id)                    │
│                                                                 │
│  Left panel — ticket details:                                   │
│  • Title (editable inline)                                      │
│  • Description (editable textarea)                              │
│  • Status dropdown (changes saved immediately on change)        │
│  • Priority dropdown (same)                                     │
│  • Customer Name, Customer Email (editable)                     │
│  • Save button → PUT /api/tickets/:id                           │
│  • Delete button → DELETE /api/tickets/:id                      │
│                                                                 │
│  Right panel — notes (see Flow 5)                               │
└──────────────────────────────┬──────────────────────────────────┘
                               │
              ┌────────────────┼────────────────┐
              │                │                │
         Save ticket     Delete ticket    Edit fields
              │                │                │
              ▼                ▼                ▼
     PUT /api/tickets    Confirm dialog   Form updates
     → success toast     (browser confirm  in local state
                          or custom modal)
                               │
                          confirmed?
                               │
                    ┌──────────┴──────────┐
                    │                     │
                   Yes                   No
                    │                     │
                    ▼                     ▼
         DELETE /api/tickets/:id     Stay on page
         → Navigate to /dashboard
         → Toast: "Ticket deleted"
```

---

## Flow 5: Adding Notes to a Ticket

```
TICKET DETAIL PAGE — right panel
       │
       │ "Notes" section visible
       │ Existing notes listed (oldest at top)
       │
       │ user types in the note textarea
       ▼
┌─────────────────────────────────────────────────────────────────┐
│  Note input area                                                │
│                                                                 │
│  • Textarea (multi-line, expands with content)                  │
│  • "Add note" button                                            │
└──────────────────────────────┬──────────────────────────────────┘
                               │
                               │ clicks "Add note"
                               ▼
                    POST /api/tickets/:id/notes
                    { content: "note text" }
                               │
                    ┌──────────┴──────────┐
                    │                     │
                Success               Error
                    │                     │
                    ▼                     ▼
       New note appears in        Toast: error message
       the list immediately       (e.g. empty content)
       Textarea is cleared
       Toast: "Note added"

───────────────────────────────────────────

Deleting a note:

Each note has a delete icon (trash) on hover
       │
       │ clicks delete icon
       ▼
DELETE /api/tickets/:id/notes/:note_id
       │
       ▼
Note removed from list immediately
Toast: "Note deleted"
```

---

## Flow 6: Filtering and Searching Tickets

```
DASHBOARD HOME — ticket table
       │
       │ Filter controls visible above the table:
       │ • Status filter (select dropdown)
       │ • Priority filter (select dropdown)
       │ • Search input (searches title + description)
       ▼
┌─────────────────────────────────────────────────────────────────┐
│  User types in search box or selects a filter                   │
└──────────────────────────────┬──────────────────────────────────┘
                               │
                               │ on change
                               ▼
              URL query params updated
              GET /api/tickets?status=open&search=mobile
                               │
                               ▼
              Filtered results render in table
              (Empty state shown if no matches)
```

Filters stack: you can filter by status AND priority AND search text simultaneously.

---

## Flow 7: Logging Out

```
Any dashboard page — top navbar
       │
       │ clicks "Logout" button (top right)
       ▼
AuthContext.logout() is called:
  1. localStorage.removeItem("crm_token")
  2. setUser(null) in AuthContext
  3. Navigate to "/"
       │
       ▼
LANDING PAGE (/)
  User is now unauthenticated
  Any direct visit to /dashboard → redirects to /login
```

---

## Flow 8: Session Expiry

Tokens expire after 7 days. This is handled automatically:

```
User is on the dashboard, token has expired
       │
       │ any API call is made (e.g., fetching tickets)
       ▼
Backend returns 401 Unauthorized
       │
       ▼
api.js intercepts 401:
  localStorage.removeItem("crm_token")
  window.location.href = "/login"
       │
       ▼
LOGIN PAGE (/login)
  User must log in again
```

This happens silently from the user's perspective — they're redirected to login without a jarring error.

---

## Flow 9: Accessing Protected Routes Without Auth

```
Unauthenticated user types /dashboard in the browser
       │
       ▼
App.jsx renders:
  <ProtectedRoute>
    <DashboardLayout />
  </ProtectedRoute>
       │
       ▼
ProtectedRoute checks AuthContext:
  loading = false (no token in localStorage)
  user = null
       │
       ▼
<Navigate to="/login" replace />
       │
       ▼
LOGIN PAGE (/login)
```

The `replace` flag means the `/dashboard` URL is removed from browser history, so clicking "Back" doesn't loop the user.

---

## Complete Navigation Map

```
/ (Landing)
├── → /login          (Sign in CTA, "Log in" navbar link)
├── → /signup         (Get started CTA, "Sign up" navbar link)
└── → /dashboard      (Dashboard link in navbar/footer, if logged in)

/login
├── → /signup         ("Don't have an account? Sign up")
└── → /dashboard      (on successful login)

/signup
├── → /login          ("Already have an account? Sign in")
└── → /dashboard      (on successful signup)

/dashboard (index)
├── → /dashboard/new               (New ticket button)
└── → /dashboard/tickets/:id       (click on any ticket row)

/dashboard/new
├── → /dashboard                   (on success or Cancel)
└── → /dashboard/tickets/:id       (redirect after create)

/dashboard/tickets/:id
└── → /dashboard                   (on ticket delete, or back button)
```

---

## Empty State Flows

When a user has no tickets yet (brand new account):

```
DASHBOARD HOME
  • Empty state component renders
  • Illustration + "No tickets yet" heading
  • "Create your first ticket" CTA button
  • Clicking it → /dashboard/new
```

When filters return no results:

```
DASHBOARD HOME — filters active
  • Empty state renders with "No tickets match your filters"
  • "Clear filters" button → resets all filters
  • Full ticket list reappears
```

---

## Error Flows

### Network error (backend unreachable)

```
User performs any action that calls the API
       │
       ▼
fetch() throws a network error (no response)
       │
       ▼
api.js: error is caught, thrown to component
       │
       ▼
Component: catches error in try/catch or .catch()
  Shows red toast: "Network error. Please try again."
  Or renders error message inline
```

### Form validation error

```
User submits ticket form with missing title
       │
       ▼
Client-side check: title is empty
       │
       ▼
Form shows inline error: "Title is required"
API call is NOT made (client validates first)
```

### 404 — ticket doesn't exist

```
User navigates directly to /dashboard/tickets/9999 (nonexistent ID)
       │
       ▼
GET /api/tickets/9999 returns 404
       │
       ▼
TicketDetailPage catches error
  Renders: "Ticket not found" message
  Link back to /dashboard
```
