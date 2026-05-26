# Demo Script

This is the complete script for a 3–5 minute video walkthrough of SupportFlow CRM. Use it for an internship submission demo, a portfolio video, or a technical presentation.

---

## Before You Start

**Setup checklist:**
- [ ] Backend running locally on port 8000 (`python3 -m uvicorn main:app --reload`)
- [ ] Frontend running locally on port 5173 (`npm run dev`)
- [ ] Browser at 100% zoom, DevTools closed
- [ ] Empty database — no existing accounts
- [ ] Screen recording software ready
- [ ] Browser window maximized or at a comfortable demo width (~1400px)

**Recording tips:**
- Speak naturally — don't read word-for-word from this script
- Pause 1 second after navigating to a new page before speaking
- Move the mouse slowly and deliberately — viewers follow the cursor
- If you make a mistake, keep going — you can cut in editing

---

## Script

---

### Opening (0:00 – 0:30)

*[Show the landing page, scrolling slowly down]*

> "Hi, I'm [your name], and this is SupportFlow CRM — a full-stack customer support ticket management system I built for the Datastraw Technologies data engineering assessment.

> The goal was to design and build a complete, production-quality application from scratch — a frontend, a backend API, a database, and authentication — everything a real support team needs to manage customer issues.

> Let me show you what it does."

---

### Landing Page Tour (0:30 – 1:00)

*[Start at the top of the landing page, scroll down slowly]*

> "The application has a fully designed marketing landing page. It highlights the key features, shows how the product works, and has clear calls-to-action to sign up or log in.

> The landing page is built with React and Framer Motion for the scroll animations. The design is inspired by products like Linear and Stripe — clean, minimal, and fast-feeling.

> At the bottom, I've added a dark final call-to-action section for contrast. Let's click 'Get started' and create an account."

*[Click "Get started" to navigate to /signup]*

---

### Sign Up Flow (1:00 – 1:30)

*[On the signup page]*

> "Here's the signup page. New users enter their full name, email address, and a password — minimum 8 characters. I can toggle the password visibility with this eye icon.

> Under the hood, passwords are hashed with bcrypt before being stored in the database. The plain-text password never touches the database.

> Let me create an account now."

*[Type a name, email, and password — type slowly so it's visible]*
*[Click "Create account"]*

> "Authentication uses JWT tokens — when I sign up, the server creates a signed token and sends it back. The token is stored in localStorage and attached to every subsequent API request as a Bearer token.

> And we're in — the dashboard loads immediately after signup."

---

### Dashboard Overview (1:30 – 2:00)

*[On the dashboard home, which is empty]*

> "This is the dashboard. At the top, there are four stat cards showing ticket counts by status. Right now they're all zero because I just created my account and have no tickets yet.

> This is the empty state — instead of a blank screen, the app shows a helpful message and a button to create the first ticket. Good UX means guiding users to their next action.

> Let me create a ticket."

*[Click "Create your first ticket" or "New ticket" in the sidebar]*

---

### Creating a Ticket (2:00 – 2:30)

*[On the create ticket page]*

> "The create ticket form has everything a support team needs: a title, a description, status, priority, and the affected customer's contact info.

> Let me create a realistic example."

*[Fill in the form:]*
- Title: `Payment fails at checkout — Stripe card_declined`
- Description: `Customer reported that their payment fails after entering card details. The error 'card_declined' appears. Reproduced on Firefox and Chrome.`
- Status: `Open`
- Priority: `Urgent`
- Customer Name: `Sarah Johnson`
- Customer Email: `sarah@example.com`

*[Click "Save ticket"]*

> "The ticket is created. Notice the green toast notification confirming the save — we're immediately redirected to the ticket detail page."

---

### Ticket Detail and Notes (2:30 – 3:15)

*[On the ticket detail page]*

> "The ticket detail page has two panels. On the left, all the ticket fields — I can edit any of them inline. On the right, the notes panel for internal comments.

> Let me update the status to In Progress since we've started investigating."

*[Change status dropdown to "In Progress"]*

*[Click "Save changes"]*

> "Now let me add an investigation note."

*[Click in the notes textarea and type:]*
`Reproduced locally. The Stripe webhook is missing an idempotency key — this causes the charge to fail on retry. Working on a fix.`

*[Click "Add note"]*

> "The note appears immediately. Notes are ordered chronologically — oldest at the top, newest at the bottom. This gives a timeline of the investigation.

> Let me add one more."

*[Add second note:]*
`Fix deployed to staging. Waiting for customer to confirm.`

*[Click "Add note"]*

> "Now let me go back to the dashboard and create a couple more tickets to show the full view."

*[Navigate back to /dashboard, create 2-3 more tickets with different statuses and priorities]*

---

### Ticket List and Filtering (3:15 – 3:45)

*[Back on the dashboard with multiple tickets]*

> "With multiple tickets, you can see the table showing each ticket's title, customer, status badge, priority badge, and creation date. The color-coded badges make it easy to scan urgency at a glance.

> Now let me show the filtering. I can filter by status..."

*[Select "Urgent" from the priority filter]*

> "...and the table immediately updates to show only urgent tickets. This filter call goes to the backend — only matching records are returned, nothing is hidden client-side."

*[Clear the filter, then type "payment" in the search box]*

> "Search works across title and description — here we see the payment ticket."

*[Clear search]*

---

### Security and Data Isolation (3:45 – 4:00)

*[While on the dashboard]*

> "One important feature is user data isolation. Every ticket is tied to the user who created it. If I log out and sign up with a different account, I see a completely empty dashboard — I cannot see the tickets from the first account.

> The backend enforces this — every API query filters by `user_id` from the decoded JWT token. Even if someone manually set a different user ID in a request, the auth middleware only trusts the user ID in the signed token."

---

### Logout and Session Persistence (4:00 – 4:20)

*[Click logout in the top right]*

> "Logging out clears the JWT token from localStorage and redirects here. Let me log back in to show session persistence."

*[Click "Sign in", enter the credentials]*

> "On login, the token is saved, and the session persists across page refreshes. On app load, the frontend calls `/api/auth/me` to verify the stored token is still valid — if it's expired, the user is redirected to login automatically."

---

### Tech Stack Summary (4:20 – 4:50)

*[Optional: share screen showing code, or just speak over the landing page]*

> "Under the hood, SupportFlow is built with:

> **Backend:** FastAPI with SQLAlchemy ORM on SQLite. JWT authentication with python-jose, bcrypt password hashing. Deployed on Railway.

> **Frontend:** React 18 with Vite, Tailwind CSS for styling, Framer Motion for animations, and React Router for client-side routing. Deployed on Vercel.

> **Authentication:** JWT Bearer tokens with 7-day expiry. Passwords hashed with bcrypt at work factor 12. All protected endpoints use FastAPI's dependency injection to validate the token before the route handler executes.

> The full codebase is documented with architecture diagrams, API reference, database schema, and a deployment guide in the `/docs` folder."

---

### Closing (4:50 – 5:00)

> "That's SupportFlow CRM — a full-stack application built end-to-end for this assessment. I designed the system architecture, implemented the auth flow from scratch, built the landing page and dashboard from scratch, and documented everything.

> The code is on GitHub in the link below. Thank you."

---

## Common Questions and Answers

If presenting live, be ready for these:

**"Why FastAPI over Django or Flask?"**
> FastAPI gives you automatic OpenAPI docs, Pydantic validation, async support, and dependency injection out of the box. For a REST API, it's the most productive Python framework.

**"Why SQLite? Is it production-ready?"**
> SQLite is used in development and demo mode. The `DATABASE_URL` environment variable makes it trivial to switch to PostgreSQL for production — no code changes needed. Railway offers a PostgreSQL add-on that works with zero configuration.

**"How do you handle authentication on the frontend?"**
> The JWT is stored in localStorage. On app load, `AuthContext` reads the token and calls `/api/auth/me` to restore the user session. If the backend returns 401 on any request, the client automatically clears the token and redirects to login.

**"What would you add next?"**
> The top priorities would be: email verification on signup, a password reset flow, rate limiting on auth endpoints, and unit tests. The full roadmap is in `docs/FUTURE_IMPROVEMENTS.md`.

**"Is the data shared between users?"**
> No — every API query is filtered by the authenticated user's ID. Users can only see and modify their own tickets. The backend does not trust user-supplied IDs — it only trusts the user ID encoded in the signed JWT.

---

## Video Editing Notes

- Cut dead air and pauses longer than 2 seconds
- Add captions if uploading to YouTube or LinkedIn
- Recommended background music: subtle lo-fi instrumental at low volume
- End card: your name, GitHub link, email address
- Keep it under 5 minutes — demo videos that go long lose viewers fast
- Thumbnail: screenshot of the dashboard with status badges visible
