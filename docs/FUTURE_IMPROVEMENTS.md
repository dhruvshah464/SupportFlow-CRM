# Future Improvements

SupportFlow CRM is a functional, production-quality application. This document outlines the roadmap — what would be built next, and why.

Items are organized by category and approximate implementation complexity.

---

## Table of Contents

- [Authentication and Security](#authentication-and-security)
- [Team Collaboration](#team-collaboration)
- [Ticket Features](#ticket-features)
- [Customer Management](#customer-management)
- [Reporting and Analytics](#reporting-and-analytics)
- [Notifications and Integrations](#notifications-and-integrations)
- [Developer Experience](#developer-experience)
- [Infrastructure](#infrastructure)
- [Accessibility and Internationalization](#accessibility-and-internationalization)
- [Priority Matrix](#priority-matrix)

---

## Authentication and Security

### Password Reset Flow

**What:** Allow users to reset their password via email when they forget it.

**Why:** A common need. Without it, forgotten passwords require direct database access to fix.

**How:**
1. User enters email on `/forgot-password`
2. Backend generates a time-limited reset token (UUID, expires in 1 hour) and stores it in a `password_resets` table
3. Sends an email containing a link: `/reset-password?token=<uuid>`
4. User clicks the link, enters a new password
5. Backend validates the token (not expired, not already used), updates the password hash, invalidates the token

**Requires:** A transactional email service (SendGrid, Postmark, or AWS SES via `fastapi-mail`)

**Complexity:** Medium (3–5 hours)

---

### Email Verification

**What:** Verify that a user actually owns the email address they signed up with.

**Why:** Prevents fake accounts, ensures the password reset email goes to a real inbox.

**How:** On signup, user is set to `verified = false` and sent a confirmation link. Protected features are locked until the email is verified.

**Complexity:** Medium (2–4 hours, requires email sending)

---

### Rate Limiting on Auth Endpoints

**What:** Limit how many times someone can attempt to log in from the same IP address.

**Why:** Without rate limiting, brute-force attacks against `/api/auth/login` are trivial.

**How:** Use `slowapi` (FastAPI wrapper for `limits`). Enforce: 10 attempts per minute per IP.

```python
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)

@app.post("/api/auth/login")
@limiter.limit("10/minute")
async def login(request: Request, body: LoginRequest, ...):
    ...
```

**Complexity:** Low (1–2 hours)

---

### Token Refresh / Short-Lived Access Tokens

**What:** Issue short-lived access tokens (15 minutes) and long-lived refresh tokens (30 days). The frontend uses the refresh token to get a new access token without requiring the user to log in.

**Why:** If an access token is stolen, the attacker's window is 15 minutes, not 7 days.

**How:** Two endpoints — `/api/auth/token` and `/api/auth/refresh`. Refresh tokens stored in the database (so they can be revoked). Access tokens remain JWT (stateless).

**Complexity:** High (4–6 hours)

---

### "Log Out All Devices" / Token Revocation

**What:** Allow a user to invalidate all their active sessions — useful after a password change or suspected account compromise.

**How:** Store a `token_version` integer on the User model. Embed it in every JWT. Increment it on logout-all. Any token with an old version is rejected.

```python
# In JWT payload:
{"sub": "42", "ver": 3, "exp": ...}

# In get_current_user:
if payload["ver"] != user.token_version:
    raise HTTPException(401, "Token has been revoked")
```

**Complexity:** Medium (2–3 hours)

---

## Team Collaboration

### Organizations and Teams

**What:** Allow multiple users to share a workspace, see each other's tickets, and collaborate on them.

**Why:** In a real support team, tickets aren't private per-agent — the whole team needs visibility.

**Schema changes:**
- New `organizations` table
- `users.organization_id` FK
- Tickets owned by organization, not individual user
- Role system: admin, agent, viewer

**Complexity:** High (8–12 hours — significant schema and auth changes)

---

### Ticket Assignment

**What:** Assign a ticket to a specific team member.

**Why:** Tracks ownership and accountability — "Alice is working on this."

**Schema:** `tickets.assignee_id FK → users.id`

**UI:** Assignee dropdown on the ticket detail page, filter by assignee on the list.

**Complexity:** Medium (3–4 hours, requires multi-user org feature first)

---

### Internal Mentions in Notes

**What:** @mention a team member in a note to notify them.

**Why:** Direct attention without leaving the CRM.

**How:** Parse `@username` in note content, send notification to the mentioned user.

**Complexity:** Medium (3–5 hours)

---

## Ticket Features

### File Attachments

**What:** Allow agents and customers to attach screenshots, logs, or documents to a ticket.

**Why:** Many support issues require visual evidence (screenshots) or diagnostic data (log files).

**How:** Upload files to S3-compatible object storage (AWS S3, Cloudflare R2, or Backblaze B2). Store the object URL in an `attachments` table. Serve them via signed URLs.

**Complexity:** High (6–8 hours)

---

### Ticket Templates

**What:** Pre-fill ticket fields from a template (e.g., "Bug Report", "Feature Request", "Billing Issue").

**Why:** Standardizes ticket structure for common issue types. Speeds up ticket creation.

**How:** A `templates` table with default field values. A template selector on the create ticket page.

**Complexity:** Medium (3–4 hours)

---

### Ticket History / Audit Log

**What:** Track every change to a ticket: who changed what, and when.

**Why:** Useful for understanding how a ticket progressed. Required in some compliance contexts.

**Schema:** A `ticket_events` table:
```sql
id, ticket_id, event_type, old_value, new_value, actor_id, created_at
```

Examples: `status_changed`, `priority_changed`, `assigned`, `note_added`.

**Complexity:** Medium (4–5 hours)

---

### Custom Ticket Fields

**What:** Allow teams to add custom fields to tickets (dropdowns, text, dates).

**Why:** Every support team has slightly different data needs. A billing team might need an "invoice number" field. A hardware team might need a "serial number" field.

**How:** A `custom_fields` schema table + a JSON column on tickets for field values.

**Complexity:** High (8–12 hours)

---

### Ticket Merging

**What:** Merge duplicate tickets into one.

**Why:** Customers often submit the same issue multiple times.

**How:** Mark one ticket as a duplicate pointing to a canonical ticket. Show a "merged from" notice.

**Complexity:** Medium (3–5 hours)

---

## Customer Management

### Customer Profiles

**What:** A dedicated `customers` table, separate from the denormalized `customer_name`/`customer_email` on tickets.

**Why:** See all tickets from a single customer in one place. Track customer history.

**Schema:** `customers` (id, name, email, phone, company, created_at)

**UI:** Customer detail page showing all their tickets.

**Complexity:** Medium (4–6 hours)

---

### Customer Portal

**What:** A public-facing portal where customers can submit tickets and check their status — without needing a SupportFlow account.

**Why:** Customers can self-serve rather than relying on email or phone.

**How:** Separate auth system for customers (separate from agents). Shared ticket database.

**Complexity:** Very High (12–20 hours — entirely new auth surface and UI)

---

## Reporting and Analytics

### Ticket Volume Charts

**What:** Line charts showing ticket volume over time (daily, weekly, monthly).

**Why:** Identify trends — is support load increasing? Are certain days busier?

**How:** New aggregation endpoints. Frontend charts with Recharts or Chart.js.

**Complexity:** Medium (4–6 hours)

---

### Resolution Time Tracking

**What:** Track how long each ticket takes to move from "Open" to "Resolved".

**Why:** A key support team KPI. Identify bottlenecks.

**Schema:** `tickets.resolved_at` timestamp set when status changes to `resolved`.

**Complexity:** Low-Medium (2–3 hours)

---

### CSV Export

**What:** Export the ticket list (with optional filters) as a CSV file.

**Why:** Reporting and offline analysis.

**How:** Backend endpoint that queries tickets and returns `Content-Type: text/csv`.

**Complexity:** Low (1–2 hours)

---

## Notifications and Integrations

### Email Notifications

**What:** Email the assigned agent when a new ticket is created, or when someone comments on their ticket.

**Why:** Agents shouldn't need to have the CRM open to know when something needs attention.

**Complexity:** Medium (4–5 hours, requires email service)

---

### Slack Integration

**What:** Post a message to a Slack channel when a ticket is created or updated.

**Why:** Many support teams monitor Slack for incoming issues.

**How:** Slack Incoming Webhooks API — a simple POST with the message body.

**Complexity:** Low (1–2 hours)

---

### Webhook Outbound Events

**What:** Send HTTP webhooks when ticket events occur (created, updated, resolved).

**Why:** Allows teams to integrate SupportFlow with their existing toolchain (Zapier, Make, custom services).

**Complexity:** Medium (3–5 hours)

---

## Developer Experience

### Automated Testing

**What:** Unit and integration test suites for both backend and frontend.

**Why:** Catch regressions automatically. Enables confident refactoring.

**Backend:** pytest + HTTPX async test client. Test each endpoint with valid and invalid inputs. Use an in-memory SQLite database for tests.

```python
# Example
def test_signup_creates_user(client):
    res = client.post("/api/auth/signup", json={
        "name": "Test User", "email": "test@example.com", "password": "password123"
    })
    assert res.status_code == 201
    assert "token" in res.json()
```

**Frontend:** Vitest + React Testing Library. Test component rendering, form interactions, and context behavior.

**Complexity:** High (8–12 hours for good coverage)

---

### CI/CD Pipeline

**What:** Automatically run tests and deploy on every push to `main`.

**How:**
- GitHub Actions workflow: run `pytest`, run frontend `npm test`, then deploy to Railway + Vercel
- Fail the pipeline if any test fails — don't deploy broken code

**Complexity:** Medium (3–4 hours)

---

### API Versioning

**What:** Version the API (`/api/v1/tickets`) to allow breaking changes without disrupting existing clients.

**Why:** Once external clients depend on the API (a mobile app, another service), you can't change it without coordinating.

**Complexity:** Low (1–2 hours — mostly path prefix changes)

---

## Infrastructure

### PostgreSQL in Production

**What:** Replace SQLite with PostgreSQL for production deployments.

**Why:** SQLite has a single-writer limitation — under concurrent writes, it serializes all operations. PostgreSQL handles concurrent access far better.

**How:** Set `DATABASE_URL` to a PostgreSQL connection string. Railway provides a one-click PostgreSQL add-on.

**Complexity:** Low (already supported — just set the env var)

---

### Redis for Caching and Rate Limiting

**What:** Use Redis to cache expensive queries and enforce rate limits.

**Why:** As ticket volume grows, stats queries that scan all tickets will slow down. Redis caches the results.

**Complexity:** Medium (3–5 hours)

---

### Background Tasks

**What:** Offload slow operations (email sending, webhook delivery) to a background task queue.

**Why:** Don't make the user wait for an HTTP response while the server sends an email.

**How:** FastAPI BackgroundTasks (simple) or Celery with Redis (production-grade).

**Complexity:** Medium (3–5 hours for Celery setup)

---

## Accessibility and Internationalization

### WCAG 2.1 AA Compliance

**What:** Ensure the application is fully accessible to users who rely on screen readers, keyboard navigation, or high-contrast displays.

**Improvements needed:**
- ARIA labels on icon-only buttons
- Focus ring styles visible in all browsers
- Color contrast ratio ≥ 4.5:1 for all text
- Skip-to-content link at the top of every page

**Complexity:** Medium (4–6 hours of audit and fixes)

---

### Internationalization (i18n)

**What:** Support multiple languages in the UI.

**Why:** Support teams often operate globally.

**How:** `react-i18next` for the frontend. Store translation strings in JSON files per locale.

**Complexity:** High (6–10 hours for full string extraction and translation infrastructure)

---

## Priority Matrix

| Feature | Impact | Effort | Priority |
|---------|--------|--------|----------|
| Rate limiting on auth | High (security) | Low | Immediate |
| Password reset | High (UX) | Medium | Next sprint |
| Automated tests | High (reliability) | High | Next sprint |
| Email notifications | Medium | Medium | v6 |
| Customer profiles | Medium | Medium | v6 |
| Team/org support | High | Very High | v7 |
| File attachments | Medium | High | v7 |
| Ticket history | Medium | Medium | v7 |
| CSV export | Low | Low | v6 |
| Slack integration | Medium | Low | v6 |
| i18n | Low | High | Future |
| Customer portal | High | Very High | Future |
