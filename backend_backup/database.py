# =============================================================================
# database.py — Database configuration for the Customer Support CRM Backend
# =============================================================================
# This file sets up the SQLAlchemy engine, session factory, and declarative
# base. All models and routes will import from this file to interact with
# the SQLite database in a consistent, reusable way.
# =============================================================================

from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# -----------------------------------------------------------------------------
# Database URL
# -----------------------------------------------------------------------------
# Tells SQLAlchemy where the SQLite database file lives.
# The file `crm.db` will be auto-created in the project root on first run.
# `check_same_thread=False` is required for SQLite when used with FastAPI,
# since requests may be handled across multiple threads.
# -----------------------------------------------------------------------------
DATABASE_URL = "sqlite:///./crm.db"

# -----------------------------------------------------------------------------
# Engine
# -----------------------------------------------------------------------------
# The engine is the core interface to the database.
# It manages the connection pool and translates SQLAlchemy operations into
# raw SQL that SQLite can execute.
# -----------------------------------------------------------------------------
engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False},
)

# -----------------------------------------------------------------------------
# SessionLocal
# -----------------------------------------------------------------------------
# A factory that produces individual database sessions.
# Each request in FastAPI will get its own session (opened and closed per
# request) to ensure safe, isolated database interactions.
# - `autocommit=False` — changes must be explicitly committed
# - `autoflush=False`  — changes are not flushed to DB until commit or query
# -----------------------------------------------------------------------------
SessionLocal = sessionmaker(
    bind=engine,
    autocommit=False,
    autoflush=False,
)

# -----------------------------------------------------------------------------
# Base
# -----------------------------------------------------------------------------
# The declarative base class that all ORM models will inherit from.
# SQLAlchemy uses it to track model definitions and map them to database
# tables when `Base.metadata.create_all(engine)` is called.
# -----------------------------------------------------------------------------
Base = declarative_base()


# -----------------------------------------------------------------------------
# Dependency — get_db()
# -----------------------------------------------------------------------------
# A FastAPI dependency that provides a database session to any route that
# needs one. It ensures the session is always properly closed after the
# request finishes, even if an error occurs (via the try/finally block).
#
# Usage in a route:
#   def get_tickets(db: Session = Depends(get_db)): ...
# -----------------------------------------------------------------------------
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()