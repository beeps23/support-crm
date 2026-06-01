# =============================================================================
# models.py — ORM Models for the Customer Support CRM Backend
# =============================================================================
# This file defines the database schema using SQLAlchemy's ORM layer.
# Each class maps directly to a table in the SQLite database.
# New models (e.g. Customer, Agent) should be added here as the project grows.
# =============================================================================

import uuid
from datetime import datetime

from sqlalchemy import Column, DateTime, Integer, String, Text

from database import Base


# -----------------------------------------------------------------------------
# Ticket Model
# -----------------------------------------------------------------------------
# Maps to the `tickets` table in crm.db.
# Represents a single customer support request, from creation through
# resolution. The `status` field tracks its lifecycle stage.
# -----------------------------------------------------------------------------
class Ticket(Base):
    __tablename__ = "tickets"

    # -------------------------------------------------------------------------
    # Primary Key
    # -------------------------------------------------------------------------
    # Auto-incremented integer used internally by SQLAlchemy as the true
    # primary key. Keeps joins and foreign key references efficient.
    # -------------------------------------------------------------------------
    id = Column(Integer, primary_key=True, index=True)

    # -------------------------------------------------------------------------
    # Ticket ID (Public Identifier)
    # -------------------------------------------------------------------------
    # A human-readable, unique identifier surfaced to users and agents
    # (e.g. "TKT-3f2a1c"). Defaults to a UUID string to ensure uniqueness
    # across environments without relying on sequential IDs.
    # -------------------------------------------------------------------------
    ticket_id = Column(
        String,
        unique=True,
        index=True,
        default=lambda: f"TKT-{uuid.uuid4().hex[:8].upper()}",
        nullable=False,
    )

    # -------------------------------------------------------------------------
    # Customer Information
    # -------------------------------------------------------------------------
    # Stores who raised the ticket. Email is indexed to allow efficient
    # lookups by customer (e.g. "show all tickets from this user").
    # -------------------------------------------------------------------------
    customer_name  = Column(String(100), nullable=False)
    customer_email = Column(String(255), nullable=False, index=True)

    # -------------------------------------------------------------------------
    # Ticket Content
    # -------------------------------------------------------------------------
    # `subject` is a short summary; `description` holds the full message.
    # Text type is used for description to support arbitrarily long content.
    # -------------------------------------------------------------------------
    subject     = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)

    # -------------------------------------------------------------------------
    # Status
    # -------------------------------------------------------------------------
    # Tracks the current lifecycle stage of the ticket.
    # Allowed values (enforced at the application layer):
    #   "Open" → "In Progress" → "Resolved" → "Closed"
    # Defaults to "Open" when a new ticket is created.
    # -------------------------------------------------------------------------
    status = Column(String(50), nullable=False, default="Open")

    # -------------------------------------------------------------------------
    # Timestamps
    # -------------------------------------------------------------------------
    # `created_at` is set once at insert time and never changes.
    # `updated_at` refreshes automatically on every update, making it easy
    # to sort by recent activity or detect stale tickets.
    # -------------------------------------------------------------------------
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False,
    )

    # -------------------------------------------------------------------------
    # String Representation
    # -------------------------------------------------------------------------
    # Makes debugging easier — printing a Ticket instance shows its key
    # identifiers instead of a raw memory address.
    # -------------------------------------------------------------------------
    def __repr__(self):
        return f"<Ticket id={self.id} ticket_id={self.ticket_id!r} status={self.status!r}>"