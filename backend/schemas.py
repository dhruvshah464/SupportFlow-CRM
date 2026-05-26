from pydantic import BaseModel, EmailStr, field_validator
from typing import Optional, List
from datetime import datetime


# --- Auth ---

class SignupRequest(BaseModel):
    name: str
    email: EmailStr
    password: str

    @field_validator("password")
    @classmethod
    def password_length(cls, v):
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        return v

    @field_validator("name")
    @classmethod
    def name_not_empty(cls, v):
        if not v.strip():
            raise ValueError("Name is required")
        return v.strip()


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    id: int
    name: str
    email: str
    created_at: datetime

    model_config = {"from_attributes": True}


class AuthResponse(BaseModel):
    token: str
    user: UserOut


# --- Notes ---

class NoteCreate(BaseModel):
    note_text: str
    author: Optional[str] = "Support Agent"


class NoteOut(BaseModel):
    id: int
    note_text: str
    author: str
    created_at: datetime

    model_config = {"from_attributes": True}


# --- Tickets ---

class TicketCreate(BaseModel):
    customer_name: str
    customer_email: str
    subject: str
    description: str
    priority: Optional[str] = "Medium"

    @field_validator("priority")
    @classmethod
    def validate_priority(cls, v):
        allowed = {"Low", "Medium", "High", "Urgent"}
        if v not in allowed:
            raise ValueError(f"Priority must be one of {allowed}")
        return v


class TicketUpdate(BaseModel):
    status: Optional[str] = None
    priority: Optional[str] = None
    note_text: Optional[str] = None
    author: Optional[str] = "Support Agent"

    @field_validator("status")
    @classmethod
    def validate_status(cls, v):
        if v is None:
            return v
        allowed = {"Open", "In Progress", "Closed"}
        if v not in allowed:
            raise ValueError(f"Status must be one of {allowed}")
        return v


class TicketListItem(BaseModel):
    ticket_id: str
    customer_name: str
    customer_email: str
    subject: str
    status: str
    priority: str
    created_at: datetime
    updated_at: datetime
    note_count: int = 0

    model_config = {"from_attributes": True}


class TicketDetail(BaseModel):
    ticket_id: str
    customer_name: str
    customer_email: str
    subject: str
    description: str
    status: str
    priority: str
    created_at: datetime
    updated_at: datetime
    notes: List[NoteOut] = []

    model_config = {"from_attributes": True}


class TicketCreatedResponse(BaseModel):
    ticket_id: str
    created_at: datetime


class UpdateResponse(BaseModel):
    success: bool
    updated_at: datetime


class StatsResponse(BaseModel):
    total: int
    open: int
    in_progress: int
    closed: int
