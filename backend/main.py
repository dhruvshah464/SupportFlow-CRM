from fastapi import FastAPI, Depends, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import or_
from datetime import datetime, timezone
from typing import Optional, List
import os

import models
import schemas
from database import engine, get_db
from auth import hash_password, verify_password, create_token, get_current_user

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Support CRM API", version="2.0.0")

# FRONTEND_URL can be a comma-separated list for multiple allowed origins.
# Defaults to localhost for local development.
_frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173")
allowed_origins = [u.strip() for u in _frontend_url.split(",") if u.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --- Auth ---

@app.post("/api/auth/signup", response_model=schemas.AuthResponse, status_code=201)
def signup(body: schemas.SignupRequest, db: Session = Depends(get_db)):
    existing = db.query(models.User).filter(models.User.email == body.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="An account with that email already exists")

    user = models.User(
        name=body.name,
        email=body.email,
        hashed_password=hash_password(body.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    token = create_token(user.id)
    return {"token": token, "user": user}


@app.post("/api/auth/login", response_model=schemas.AuthResponse)
def login(body: schemas.LoginRequest, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == body.email).first()
    if not user or not verify_password(body.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    token = create_token(user.id)
    return {"token": token, "user": user}


@app.get("/api/auth/me", response_model=schemas.UserOut)
def get_me(current_user: models.User = Depends(get_current_user)):
    return current_user


# --- Stats ---

@app.get("/api/stats", response_model=schemas.StatsResponse)
def get_stats(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    base = db.query(models.Ticket).filter(models.Ticket.user_id == current_user.id)
    total = base.count()
    open_count = base.filter(models.Ticket.status == "Open").count()
    in_progress = base.filter(models.Ticket.status == "In Progress").count()
    closed = base.filter(models.Ticket.status == "Closed").count()
    return {"total": total, "open": open_count, "in_progress": in_progress, "closed": closed}


# --- Tickets ---

def generate_ticket_id(db: Session) -> str:
    count = db.query(models.Ticket).count()
    return f"TKT-{count + 1:04d}"


@app.post("/api/tickets", response_model=schemas.TicketCreatedResponse, status_code=201)
def create_ticket(
    ticket: schemas.TicketCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    ticket_id = generate_ticket_id(db)
    db_ticket = models.Ticket(
        ticket_id=ticket_id,
        user_id=current_user.id,
        customer_name=ticket.customer_name,
        customer_email=ticket.customer_email,
        subject=ticket.subject,
        description=ticket.description,
        priority=ticket.priority,
    )
    db.add(db_ticket)
    db.commit()
    db.refresh(db_ticket)
    return {"ticket_id": db_ticket.ticket_id, "created_at": db_ticket.created_at}


@app.get("/api/tickets", response_model=List[schemas.TicketListItem])
def list_tickets(
    status: Optional[str] = Query(None),
    priority: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    query = db.query(models.Ticket).filter(models.Ticket.user_id == current_user.id)

    if status:
        query = query.filter(models.Ticket.status == status)
    if priority:
        query = query.filter(models.Ticket.priority == priority)
    if search:
        term = f"%{search}%"
        query = query.filter(
            or_(
                models.Ticket.ticket_id.ilike(term),
                models.Ticket.customer_name.ilike(term),
                models.Ticket.customer_email.ilike(term),
                models.Ticket.subject.ilike(term),
                models.Ticket.description.ilike(term),
            )
        )

    tickets = query.order_by(models.Ticket.created_at.desc()).all()

    result = []
    for t in tickets:
        note_count = db.query(models.Note).filter(models.Note.ticket_id == t.ticket_id).count()
        result.append(schemas.TicketListItem(
            ticket_id=t.ticket_id,
            customer_name=t.customer_name,
            customer_email=t.customer_email,
            subject=t.subject,
            status=t.status,
            priority=t.priority,
            created_at=t.created_at,
            updated_at=t.updated_at,
            note_count=note_count,
        ))
    return result


@app.get("/api/tickets/{ticket_id}", response_model=schemas.TicketDetail)
def get_ticket(
    ticket_id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    ticket = db.query(models.Ticket).filter(
        models.Ticket.ticket_id == ticket_id,
        models.Ticket.user_id == current_user.id,
    ).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    return ticket


@app.put("/api/tickets/{ticket_id}", response_model=schemas.UpdateResponse)
def update_ticket(
    ticket_id: str,
    update: schemas.TicketUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    ticket = db.query(models.Ticket).filter(
        models.Ticket.ticket_id == ticket_id,
        models.Ticket.user_id == current_user.id,
    ).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    if update.status:
        ticket.status = update.status
    if update.priority:
        ticket.priority = update.priority

    ticket.updated_at = datetime.now(timezone.utc)

    if update.note_text and update.note_text.strip():
        note = models.Note(
            ticket_id=ticket_id,
            note_text=update.note_text.strip(),
            author=update.author or "Support Agent",
        )
        db.add(note)

    db.commit()
    db.refresh(ticket)
    return {"success": True, "updated_at": ticket.updated_at}


@app.post("/api/tickets/{ticket_id}/notes", response_model=schemas.NoteOut, status_code=201)
def add_note(
    ticket_id: str,
    note: schemas.NoteCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    ticket = db.query(models.Ticket).filter(
        models.Ticket.ticket_id == ticket_id,
        models.Ticket.user_id == current_user.id,
    ).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    db_note = models.Note(
        ticket_id=ticket_id,
        note_text=note.note_text,
        author=note.author or "Support Agent",
    )
    db.add(db_note)
    ticket.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(db_note)
    return db_note


@app.delete("/api/tickets/{ticket_id}", status_code=204)
def delete_ticket(
    ticket_id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    ticket = db.query(models.Ticket).filter(
        models.Ticket.ticket_id == ticket_id,
        models.Ticket.user_id == current_user.id,
    ).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    db.delete(ticket)
    db.commit()


from fastapi.responses import RedirectResponse

@app.get("/", include_in_schema=False)
def root():
    return RedirectResponse(url="/docs")

@app.get("/health")
def health():
    return {"status": "ok"}
