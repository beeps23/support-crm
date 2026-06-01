# =============================================================================
# schemas.py — Pydantic Schemas for the Customer Support CRM Backend
# =============================================================================

from datetime import datetime
from typing import Literal
from pydantic import BaseModel, EmailStr, Field


# -----------------------------------------------------------------------------
# TicketCreate — Request Schema (Input)
# -----------------------------------------------------------------------------
class TicketCreate(BaseModel):
    customer_name: str = Field(
        ...,
        min_length=2,
        max_length=100,
        description="Full name of the customer raising the ticket.",
        examples=["Alice Johnson"],
    )

    customer_email: EmailStr = Field(
        ...,
        description="Valid email address of the customer.",
        examples=["alice@example.com"],
    )

    subject: str = Field(
        ...,
        min_length=5,
        max_length=255,
        description="Short summary of the issue.",
        examples=["Unable to reset password"],
    )

    description: str = Field(
        ...,
        min_length=10,
        description="Detailed explanation of the issue reported by the customer.",
        examples=["I clicked 'Forgot Password' but never received the reset email."],
    )


# -----------------------------------------------------------------------------
# TicketResponse — Response Schema (Output)
# -----------------------------------------------------------------------------
class TicketResponse(BaseModel):
    ticket_id: str = Field(
        description="Unique public identifier for the ticket."
    )

    customer_name: str = Field(
        description="Full name of the customer."
    )

    customer_email: EmailStr = Field(
        description="Customer email address."
    )

    subject: str = Field(
        description="Issue summary."
    )

    description: str = Field(
        description="Full issue description."
    )

    status: str = Field(
        description="Ticket lifecycle status."
    )

    created_at: datetime = Field(
        description="Creation timestamp."
    )

    updated_at: datetime = Field(
        description="Last updated timestamp."
    )

    model_config = {"from_attributes": True}


# -----------------------------------------------------------------------------
# TicketUpdate — Request Schema (PATCH Input)
# -----------------------------------------------------------------------------
class TicketUpdate(BaseModel):
    status: Literal[
        "Open",
        "In Progress",
        "Resolved",
        "Closed"
    ] = Field(
        description="Updated lifecycle status of the ticket."
    )