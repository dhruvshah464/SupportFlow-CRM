# Security

This document explains the security measures built into SupportFlow CRM — how passwords are protected, how authentication works, how users are kept isolated from each other's data, and what the known limitations are.

---

## Table of Contents

- [Password Security](#password-security)
- [Authentication with JWT](#authentication-with-jwt)
- [Protected Routes](#protected-routes)
- [User Data Isolation](#user-data-isolation)
- [API Security](#api-security)
- [CORS Configuration](#cors-configuration)
- [Environment Variables](#environment-variables)
- [Known Limitations and Future Improvements](#known-limitations-and-future-improvements)

---

## Password Security

### bcrypt Hashing

Passwords are never stored in plain text. When a user signs up, the password goes through the following process:

```
User provides: "mysecurepassword"
                      │
                      ▼
bcrypt.hashpw(password.encode(), bcrypt.gensalt())
                      │
                      ├── gensalt() generates a random 16-byte salt
                      ├── applies bcrypt with work factor = 12
                      │   (12 rounds = ~2^12 = 4096 iterations)
                      └── produces: "$2b$12$K9Lx..."
                                       ↑
                                stored in database
```

bcrypt is specifically designed for password hashing. Key properties:

| Property | Benefit |
|----------|---------|
| **Random salt per hash** | Two users with the same password get different hashes — eliminates rainbow tables |
| **Intentionally slow** | Work factor 12 means ~250ms per hash — fast for users, slow for attackers trying millions of guesses |
| **Adaptive** | Work factor can be increased as hardware gets faster, without changing existing hashes |
| **Collision-resistant** | Different passwords never produce the same hash |

### Password Verification

During login, the plain-text password is checked against the stored hash:

```python
bcrypt.checkpw(plain_password.encode(), stored_hash.encode())
# → True if match, False otherwise
```

The original password is never reconstructed. bcrypt re-hashes the input and compares — the only way to "crack" a bcrypt hash is to try every possible input until one matches.

### Why Not SHA-256?

SHA-256 is a general-purpose cryptographic hash. It's extremely fast — a modern GPU can compute billions of SHA-256 hashes per second. This makes it unsuitable for passwords, where you want the hash to be slow. bcrypt is the right tool for this use case.

### Why Not passlib?

The codebase uses `bcrypt` directly (imported as `import bcrypt as _bcrypt`) rather than through `passlib`. This is because passlib 1.7.x has a known compatibility bug with bcrypt 4.x+ where it raises a `ValueError: password cannot be longer than 72 bytes` error even for short passwords. Direct bcrypt usage avoids this bug entirely.

---

## Authentication with JWT

### What is a JWT?

A JSON Web Token (JWT) is a compact, URL-safe token that encodes claims (data) and is signed to prevent tampering.

Structure: `header.payload.signature`

```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9  ← base64-encoded header
.
eyJzdWIiOiI0MiIsImV4cCI6MTc0ODQ4NjQwMH0  ← base64-encoded payload
.
xK4d3Lm9N2pQ7rT8fV1jZ6sE5oW0uY9hX3bC  ← HMAC-SHA256 signature
```

Decoded payload:
```json
{
  "sub": "42",    ← user ID (subject claim)
  "exp": 1748486400  ← expiry timestamp (Unix epoch)
}
```

### Token Creation

```python
def create_token(user_id: int) -> str:
    expire = datetime.now(timezone.utc) + timedelta(days=7)
    payload = {"sub": str(user_id), "exp": expire}
    return jwt.encode(payload, SECRET_KEY, algorithm="HS256")
```

The `JWT_SECRET` (read via `os.getenv("JWT_SECRET")`) is a random 32+ character string. Anyone who knows it can forge tokens, so it must be kept private and never committed to version control.

### Token Verification

On every protected request:

```python
def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme), ...):
    token = credentials.credentials
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        user_id = payload.get("sub")
        if user_id is None:
            raise ValueError()
    except (JWTError, ValueError):
        raise HTTPException(status_code=401, detail="Invalid or expired token")
```

`jwt.decode()` automatically:
1. Verifies the signature using `JWT_SECRET`
2. Checks that `exp` has not passed
3. Raises `JWTError` if either check fails

### Token Expiry

Tokens expire after **7 days**. This limits the damage if a token is stolen — the attacker's access window is bounded. After expiry, the user must log in again.

### Why Stateless?

JWTs are stateless — the server doesn't store any session data. The entire session is encoded in the token itself. This means:
- No session table in the database
- No Redis session store needed
- Scales horizontally without sticky sessions

The tradeoff is that tokens cannot be revoked server-side before expiry (e.g., for "log out all devices"). This is a known limitation — see [Known Limitations](#known-limitations-and-future-improvements).

---

## Protected Routes

### Backend Protection

Every API endpoint that touches user data is protected by the `get_current_user` dependency:

```python
@app.get("/api/tickets")
def list_tickets(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),  # ← auth guard
):
    ...
```

If the request has no token, an expired token, or a tampered token, `get_current_user` raises a `401 HTTPException` and the handler never executes.

Only two endpoints are intentionally unprotected:
- `POST /api/auth/signup`
- `POST /api/auth/login`

### Frontend Protection

The `ProtectedRoute` component wraps all dashboard routes:

```jsx
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) return <PageSpinner />;          // checking auth
  if (!user) return <Navigate to="/login" />;   // not authenticated
  return children;                              // authenticated
}
```

This prevents the dashboard UI from rendering entirely if the user is not authenticated — even before any API request is made.

---

## User Data Isolation

Every ticket and note query is filtered by the authenticated user's ID. Users can only see and modify their own data.

### Ticket Queries

```python
# List tickets — only the current user's
db.query(models.Ticket).filter(
    models.Ticket.user_id == current_user.id
).all()

# Get single ticket — verify ownership
ticket = db.query(models.Ticket).filter(
    models.Ticket.id == ticket_id,
    models.Ticket.user_id == current_user.id,  # ← ownership check
).first()
if not ticket:
    raise HTTPException(status_code=404, detail="Ticket not found")
```

### Why 404, Not 403?

When a user requests a ticket that belongs to another user, the API returns `404 Not Found` rather than `403 Forbidden`. This is a deliberate security choice called **resource existence concealment** — it prevents attackers from learning whether a resource exists by probing different IDs.

If we returned `403`, an attacker could enumerate ticket IDs and discover how many tickets other users have created. With `404`, the ticket appears not to exist.

### Note Queries

Notes are accessed via their parent ticket. The ticket ownership check is performed first, so if the ticket doesn't belong to the current user, notes are unreachable.

```python
@app.get("/api/tickets/{ticket_id}/notes")
def list_notes(ticket_id: int, db, current_user):
    # This check prevents access to notes of other users' tickets
    ticket = db.query(Ticket).filter(
        Ticket.id == ticket_id,
        Ticket.user_id == current_user.id
    ).first()
    if not ticket:
        raise HTTPException(404, "Ticket not found")

    return db.query(Note).filter(Note.ticket_id == ticket_id).all()
```

---

## API Security

### Input Validation

All request bodies are validated by Pydantic schemas before reaching route handlers:

```python
class SignupRequest(BaseModel):
    name: str
    email: EmailStr          # Validates email format
    password: str

    @field_validator("password")
    @classmethod
    def password_length(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        return v
```

Invalid input returns `422 Unprocessable Entity` with a descriptive error message — the request never touches the database.

### SQL Injection Prevention

SQLAlchemy ORM uses parameterized queries internally. User-supplied values are always passed as parameters, never interpolated into SQL strings:

```python
# SQLAlchemy does this safely
db.query(Ticket).filter(Ticket.title == user_input).all()

# Which generates SQL like:
# SELECT * FROM tickets WHERE title = ? → with user_input as a bound parameter
```

It's not possible to inject SQL through the ORM layer when used correctly (no raw `text()` queries with string concatenation).

### Error Messages

Error messages are intentionally generic for security-sensitive operations:

```python
# Login: doesn't reveal whether the email exists
raise HTTPException(401, "Invalid email or password")

# vs. the insecure alternative:
# "No account found with that email"  ← reveals whether the email is registered
```

---

## CORS Configuration

Cross-Origin Resource Sharing (CORS) is configured on the FastAPI backend to allow requests from specific origins:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("FRONTEND_URL", "http://localhost:5173").split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

In production, `FRONTEND_URL` is set to the exact Vercel frontend URL (e.g., `https://your-app.vercel.app`). This prevents other websites from making API requests on behalf of your users.

During development, it defaults to `http://localhost:5173` (the Vite dev server).

---

## Environment Variables

Sensitive configuration is kept out of the codebase using environment variables:

| Variable | Where | Purpose | Risk if exposed |
|----------|-------|---------|-----------------|
| `JWT_SECRET` | Backend | Signs JWTs | Anyone can forge auth tokens |
| `DATABASE_URL` | Backend | Database connection | DB access |
| `FRONTEND_URL` | Backend | Allowed CORS origin | Minor — restricts API access |
| `VITE_API_URL` | Frontend | Backend URL | Minor — just the API endpoint |

### Rules for JWT_SECRET

- Must be at least 32 random characters
- Must never be committed to version control
- Must be different in development and production
- Should be rotated periodically (see [limitations](#known-limitations-and-future-improvements))
- On Render, set `generateValue: true` in `render.yaml` and Render auto-generates a secure random value

The `.env.example` file contains placeholder values that are safe to commit. The actual `.env` file is in `.gitignore`.

---

## Known Limitations and Future Improvements

### 1. JWT tokens cannot be revoked

If a token is stolen, the attacker has access until it expires (up to 7 days). The standard fix is a **token blocklist** — a Redis set of revoked token IDs that the server checks on every request. Alternatively, **refresh tokens** with short-lived access tokens (15 minutes) minimize the exposure window.

### 2. Passwords stored in localStorage-adjacent security model

The JWT is stored in `localStorage`, which is accessible to JavaScript running on the page. If the app ever has an XSS vulnerability, the token could be stolen. The more secure alternative is `httpOnly` cookies — not accessible to JavaScript — but this requires same-origin deployment or a backend-for-frontend proxy.

### 3. No rate limiting

The auth endpoints (`/signup`, `/login`) are not rate-limited, making them vulnerable to brute-force attacks. In production, add rate limiting via:
- `slowapi` (Python rate limiting for FastAPI)
- Cloudflare or a reverse proxy in front of the API

### 4. No password reset

There is no "forgot my password" flow. Users who forget their password cannot recover their account without a database modification. This requires email delivery (SMTP or a transactional email service) to be useful.

### 5. No email verification

Users can sign up with any email address — it is not verified to be real or owned by them. Email verification (sending a confirmation link) would prevent fake signups.

### 6. No HTTPS enforcement in development

In development, the API runs over plain HTTP on localhost. This is acceptable locally but must never be deployed over HTTP in production. Render and Vercel both enforce HTTPS automatically.

### 7. Notes do not track authorship

Currently, a note's author is implicit (the ticket owner). In a multi-user team scenario, multiple people could manage the same tickets and notes would need an `author_id` field to track who wrote each one.
