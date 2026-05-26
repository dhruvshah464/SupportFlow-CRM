# Database Schema

SupportFlow CRM uses a relational database with three tables: `users`, `tickets`, and `notes`. The schema is defined using SQLAlchemy ORM models, which means the same code works with SQLite (development) and PostgreSQL (production) without modification.

---

## Table of Contents

- [Overview](#overview)
- [Entity Relationship Diagram](#entity-relationship-diagram)
- [Tables](#tables)
  - [users](#users-table)
  - [tickets](#tickets-table)
  - [notes](#notes-table)
- [Relationships](#relationships)
- [SQLAlchemy Models](#sqlalchemy-models)
- [SQL Schema](#sql-schema)
- [Design Decisions](#design-decisions)
- [Scalability Considerations](#scalability-considerations)

---

## Overview

| Table | Purpose | Row count (typical) |
|-------|---------|---------------------|
| `users` | Authentication and account data | Small (one per team member) |
| `tickets` | Support tickets created by users | Medium (dozens to hundreds) |
| `notes` | Internal comments on tickets | Medium (a few per ticket) |

---

## Entity Relationship Diagram

```
┌──────────────────────────────────────────────┐
│                    users                     │
├─────────────────┬────────────────────────────┤
│ id              │ INTEGER PRIMARY KEY        │
│ name            │ TEXT NOT NULL              │
│ email           │ TEXT UNIQUE NOT NULL       │
│ hashed_password │ TEXT NOT NULL              │
│ created_at      │ TIMESTAMP DEFAULT NOW()    │
└─────────────────┴──────────┬─────────────────┘
                             │
                             │  1-to-many
                             │  (cascade delete)
                             │
┌────────────────────────────▼─────────────────┐
│                   tickets                    │
├─────────────────┬────────────────────────────┤
│ id              │ INTEGER PRIMARY KEY        │
│ user_id         │ INTEGER FK → users.id      │
│ title           │ TEXT NOT NULL              │
│ description     │ TEXT                       │
│ status          │ TEXT DEFAULT 'open'        │
│ priority        │ TEXT DEFAULT 'medium'      │
│ customer_name   │ TEXT                       │
│ customer_email  │ TEXT                       │
│ created_at      │ TIMESTAMP DEFAULT NOW()    │
│ updated_at      │ TIMESTAMP DEFAULT NOW()    │
└─────────────────┴──────────┬─────────────────┘
                             │
                             │  1-to-many
                             │  (cascade delete)
                             │
┌────────────────────────────▼─────────────────┐
│                    notes                     │
├─────────────────┬────────────────────────────┤
│ id              │ INTEGER PRIMARY KEY        │
│ ticket_id       │ INTEGER FK → tickets.id    │
│ content         │ TEXT NOT NULL              │
│ created_at      │ TIMESTAMP DEFAULT NOW()    │
└─────────────────┴────────────────────────────┘
```

---

## Tables

### users Table

Stores account credentials and profile data for every person who signs up.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | INTEGER | PRIMARY KEY, AUTO INCREMENT | Unique identifier |
| `name` | TEXT | NOT NULL | Display name shown in the dashboard |
| `email` | TEXT | UNIQUE, NOT NULL, INDEX | Used for login; must be globally unique |
| `hashed_password` | TEXT | NOT NULL | bcrypt hash of the user's password |
| `created_at` | TIMESTAMP | DEFAULT `now()` | When the account was created |

**Notes:**
- Passwords are **never** stored in plain text. Only the bcrypt hash is persisted.
- The `email` column has a database-level unique constraint AND an index for fast lookup on login.
- There is no `updated_at` because the only mutable user field is the password, which is not yet a supported feature (future improvement).

**Example rows:**

```
id | name          | email               | hashed_password      | created_at
---|---------------|---------------------|----------------------|------------------------
1  | Alice Johnson | alice@example.com   | $2b$12$K9.abc...     | 2026-05-20 09:00:00
2  | Bob Smith     | bob@company.com     | $2b$12$L8.xyz...     | 2026-05-21 14:30:00
```

---

### tickets Table

The core table. Each row represents a support ticket created by a user.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | INTEGER | PRIMARY KEY, AUTO INCREMENT | Unique identifier |
| `user_id` | INTEGER | FOREIGN KEY → `users.id`, NOT NULL | Which user owns this ticket |
| `title` | TEXT | NOT NULL | Short summary of the issue |
| `description` | TEXT | NULLABLE | Full issue description |
| `status` | TEXT | DEFAULT `'open'` | Current ticket state |
| `priority` | TEXT | DEFAULT `'medium'` | Urgency level |
| `customer_name` | TEXT | NULLABLE | Name of the affected customer |
| `customer_email` | TEXT | NULLABLE | Email of the affected customer |
| `created_at` | TIMESTAMP | DEFAULT `now()` | When the ticket was created |
| `updated_at` | TIMESTAMP | DEFAULT `now()`, ON UPDATE `now()` | Last modification time |

**Valid status values:**

| Value | Meaning |
|-------|---------|
| `open` | Default; newly created |
| `in_progress` | Being actively investigated |
| `resolved` | Issue fixed |
| `closed` | No further action needed |

**Valid priority values:**

| Value | Urgency |
|-------|---------|
| `low` | Minor / cosmetic |
| `medium` | Standard (default) |
| `high` | Significant user impact |
| `urgent` | Service disruption |

**Note on `customer_name` / `customer_email`:** These fields store the external customer's contact info — separate from the `users` table, which stores the support agent/team member using SupportFlow. A ticket is created *by* a user (agent) on behalf of a customer.

**Example rows:**

```
id | user_id | title                    | status      | priority | customer_name | created_at
---|---------|--------------------------|-------------|----------|---------------|------------------------
1  | 1       | Login broken on mobile   | in_progress | high     | Carol Davis   | 2026-05-22 09:00:00
2  | 1       | Export CSV not working   | open        | medium   | Dan Wilson    | 2026-05-23 11:00:00
3  | 2       | Password reset email lost| resolved    | low      | Eve Martinez  | 2026-05-24 15:00:00
```

---

### notes Table

Internal comments added to a ticket by the team member managing it. Used for investigation notes, status updates, and customer communication logs.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | INTEGER | PRIMARY KEY, AUTO INCREMENT | Unique identifier |
| `ticket_id` | INTEGER | FOREIGN KEY → `tickets.id`, NOT NULL | Which ticket this note belongs to |
| `content` | TEXT | NOT NULL | The note body (free-form text) |
| `created_at` | TIMESTAMP | DEFAULT `now()` | When the note was added |

**Notes:**
- Notes are append-only in the current version — they cannot be edited, only deleted.
- There is no `author` field yet. Since each ticket belongs to one user, all notes on that ticket are implicitly by the ticket's owner.
- Notes are ordered by `created_at ASC` in the API response (oldest first, like a conversation thread).

**Example rows:**

```
id | ticket_id | content                                          | created_at
---|-----------|--------------------------------------------------|------------------------
1  | 1         | Reproduced locally on iPhone 13 / Safari 17      | 2026-05-22 10:00:00
2  | 1         | Root cause: CSS z-index conflict. Fix in review. | 2026-05-22 14:00:00
3  | 2         | Customer confirmed: happens in Chrome on Windows | 2026-05-23 12:00:00
```

---

## Relationships

### users → tickets (One-to-Many)

- One user can have many tickets
- Each ticket belongs to exactly one user (`user_id` is NOT NULL)
- Deleting a user **cascades** and deletes all their tickets

### tickets → notes (One-to-Many)

- One ticket can have many notes
- Each note belongs to exactly one ticket (`ticket_id` is NOT NULL)
- Deleting a ticket **cascades** and deletes all its notes

### Cascade Delete Chain

If a user account is deleted:
```
users.id = 42 → DELETE
  → tickets WHERE user_id = 42 → DELETE (cascade)
    → notes WHERE ticket_id IN (deleted ticket ids) → DELETE (cascade)
```

This ensures no orphaned rows remain in the database.

---

## SQLAlchemy Models

The Python source of truth for the schema is in `backend/models.py`:

```python
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    tickets = relationship(
        "Ticket",
        back_populates="user",
        cascade="all, delete-orphan"
    )


class Ticket(Base):
    __tablename__ = "tickets"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    status = Column(String, default="open")
    priority = Column(String, default="medium")
    customer_name = Column(String, nullable=True)
    customer_email = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    user = relationship("User", back_populates="tickets")
    notes = relationship(
        "Note",
        back_populates="ticket",
        cascade="all, delete-orphan",
        order_by="Note.created_at"
    )


class Note(Base):
    __tablename__ = "notes"

    id = Column(Integer, primary_key=True, index=True)
    ticket_id = Column(Integer, ForeignKey("tickets.id"), nullable=False)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    ticket = relationship("Ticket", back_populates="notes")
```

---

## SQL Schema

The equivalent SQL DDL (generated by SQLAlchemy's `create_all()`):

```sql
CREATE TABLE users (
    id          INTEGER     NOT NULL PRIMARY KEY AUTOINCREMENT,
    name        VARCHAR     NOT NULL,
    email       VARCHAR     NOT NULL UNIQUE,
    hashed_password VARCHAR NOT NULL,
    created_at  DATETIME    DEFAULT (CURRENT_TIMESTAMP)
);

CREATE INDEX ix_users_id    ON users (id);
CREATE INDEX ix_users_email ON users (email);


CREATE TABLE tickets (
    id             INTEGER  NOT NULL PRIMARY KEY AUTOINCREMENT,
    user_id        INTEGER  NOT NULL REFERENCES users(id),
    title          VARCHAR  NOT NULL,
    description    TEXT,
    status         VARCHAR  DEFAULT 'open',
    priority       VARCHAR  DEFAULT 'medium',
    customer_name  VARCHAR,
    customer_email VARCHAR,
    created_at     DATETIME DEFAULT (CURRENT_TIMESTAMP),
    updated_at     DATETIME DEFAULT (CURRENT_TIMESTAMP)
);

CREATE INDEX ix_tickets_id ON tickets (id);


CREATE TABLE notes (
    id         INTEGER  NOT NULL PRIMARY KEY AUTOINCREMENT,
    ticket_id  INTEGER  NOT NULL REFERENCES tickets(id),
    content    TEXT     NOT NULL,
    created_at DATETIME DEFAULT (CURRENT_TIMESTAMP)
);

CREATE INDEX ix_notes_id ON notes (id);
```

---

## Design Decisions

### Why no enum constraints on status/priority?

SQLite doesn't support CHECK constraints via SQLAlchemy's `Enum` type in a portable way. Status and priority are validated at the Pydantic schema layer (in `schemas.py`) before they reach the database. For PostgreSQL, you'd add native ENUM types.

### Why is `updated_at` only on tickets?

Tickets change frequently (status updates, priority changes). Users and notes don't have editable fields in the current version — notes are append-only and user profile editing isn't implemented yet.

### Why store `customer_name` / `customer_email` as plain text?

In a production CRM you'd have a separate `customers` table with a foreign key. For this project, denormalizing into the ticket keeps the schema simple and avoids join complexity. The data is entered manually by the support agent and isn't queried for aggregation.

### Why bcrypt hashes, not SHA-256?

bcrypt is specifically designed for password hashing. It's intentionally slow (work factor ~12), includes a random salt per hash, and is resistant to rainbow table attacks. SHA-256 is a general-purpose hash — fast, which makes it vulnerable to brute-force.

---

## Scalability Considerations

The current schema handles a single team's tickets comfortably. Here's what would need to change at larger scale:

| Concern | Current approach | At scale |
|---------|-----------------|----------|
| Database | SQLite (single file) | PostgreSQL with connection pooling |
| Multi-tenancy | `user_id` FK per ticket | Add `organization_id` table for team accounts |
| Full-text search | None (frontend filters) | PostgreSQL `tsvector` or Elasticsearch |
| Audit trail | `updated_at` only | Separate `ticket_history` table with change diffs |
| Note authors | Implicit (ticket owner) | Add `author_id` FK on notes table |
| Attachments | Not supported | S3/R2 object storage with URL stored in DB |
| Indexes | Primary keys only | Add composite indexes on `(user_id, status)`, `(user_id, priority)` for fast filtered queries |
