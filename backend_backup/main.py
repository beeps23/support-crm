# =============================================================================
# main.py — Entry point for the Customer Support CRM Backend
# =============================================================================

from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from database import Base, engine, get_db
import models
from models import Ticket
from schemas import TicketCreate, TicketResponse, TicketUpdate
from typing import Optional
from sqlalchemy import or_

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Customer Support CRM",
    description="A backend API for managing customer support tickets and interactions.",
    version="1.0.0",
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -----------------------------------------------------------------------------
# Root Route
# -----------------------------------------------------------------------------
@app.get("/", tags=["Health"])
def root():
    return {"message": "Support CRM Backend Running"}


# -----------------------------------------------------------------------------
# POST /api/tickets
# -----------------------------------------------------------------------------
@app.post(
    "/api/tickets",
    response_model=TicketResponse,
    status_code=201,
    tags=["Tickets"]
)
def create_ticket(payload: TicketCreate, db: Session = Depends(get_db)):

    ticket = Ticket(
        customer_name=payload.customer_name,
        customer_email=payload.customer_email,
        subject=payload.subject,
        description=payload.description,
    )

    db.add(ticket)
    db.commit()
    db.refresh(ticket)

    return ticket


# -----------------------------------------------------------------------------
# GET /api/tickets
# -----------------------------------------------------------------------------
# -----------------------------------------------------------------------------
# GET /api/tickets (Search + Filter)
# -----------------------------------------------------------------------------
@app.get(
    "/api/tickets",
    response_model=list[TicketResponse],
    tags=["Tickets"]
)
def get_tickets(
    status: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):

    query = db.query(Ticket)

    # Filter by status
    if status:
        query = query.filter(Ticket.status == status)

    # Search across multiple fields
    if search:
        query = query.filter(
            or_(
                Ticket.customer_name.ilike(f"%{search}%"),
                Ticket.customer_email.ilike(f"%{search}%"),
                Ticket.subject.ilike(f"%{search}%"),
                Ticket.description.ilike(f"%{search}%"),
                Ticket.ticket_id.ilike(f"%{search}%")
            )
        )

    return query.order_by(Ticket.created_at.desc()).all()

# -----------------------------------------------------------------------------
# GET /api/tickets/{ticket_id}
# -----------------------------------------------------------------------------
@app.get(
    "/api/tickets/{ticket_id}",
    response_model=TicketResponse,
    tags=["Tickets"]
)
def get_ticket(ticket_id: str, db: Session = Depends(get_db)):

    ticket = db.query(Ticket).filter(
        Ticket.ticket_id == ticket_id
    ).first()

    if not ticket:
        raise HTTPException(
            status_code=404,
            detail=f"Ticket '{ticket_id}' not found."
        )

    return ticket


# -----------------------------------------------------------------------------
# PATCH /api/tickets/{ticket_id}
# -----------------------------------------------------------------------------
@app.patch(
    "/api/tickets/{ticket_id}",
    response_model=TicketResponse,
    tags=["Tickets"]
)
def update_ticket_status(
    ticket_id: str,
    payload: TicketUpdate,
    db: Session = Depends(get_db)
):

    ticket = db.query(Ticket).filter(
        Ticket.ticket_id == ticket_id
    ).first()

    if not ticket:
        raise HTTPException(
            status_code=404,
            detail=f"Ticket '{ticket_id}' not found."
        )

    ticket.status = payload.status

    db.commit()
    db.refresh(ticket)

    return ticket

# -----------------------------------------------------------------------------
# DELETE /api/tickets/{ticket_id}
# -----------------------------------------------------------------------------
@app.delete(
    "/api/tickets/{ticket_id}",
    tags=["Tickets"]
)
def delete_ticket(
    ticket_id: str,
    db: Session = Depends(get_db)
):
    """
    Permanently delete a support ticket by public ticket ID.
    Raises 404 if not found.
    """

    ticket = (
        db.query(Ticket)
        .filter(Ticket.ticket_id == ticket_id.strip())
        .first()
    )

    if ticket is None:
        raise HTTPException(
            status_code=404,
            detail=f"Ticket '{ticket_id}' not found."
        )

    db.delete(ticket)
    db.commit()

    return {
        "message": f"Ticket '{ticket_id}' deleted successfully."
    }