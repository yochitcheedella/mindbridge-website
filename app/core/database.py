import os
import logging
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

logger = logging.getLogger(__name__)

SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./mindbridge.db")

# Fix Heroku/Render/Neon postgres:// uri format for SQLAlchemy 1.4+
if SQLALCHEMY_DATABASE_URL.startswith("postgres://"):
    SQLALCHEMY_DATABASE_URL = SQLALCHEMY_DATABASE_URL.replace("postgres://", "postgresql://", 1)


def _create_engine(url: str):
    if url.startswith("sqlite"):
        return create_engine(url, connect_args={"check_same_thread": False})
    return create_engine(url, pool_pre_ping=True, pool_size=5, max_overflow=10)


# Try the configured URL; fall back to SQLite if connection fails
try:
    engine = _create_engine(SQLALCHEMY_DATABASE_URL)
    # Validate the connection is actually reachable
    with engine.connect() as conn:
        conn.execute(text("SELECT 1"))
    logger.info(f"Database connected: {SQLALCHEMY_DATABASE_URL[:40]}...")
except Exception as e:
    logger.warning(
        f"Could not connect to DATABASE_URL ({e}). "
        "Falling back to SQLite (./mindbridge.db)."
    )
    SQLALCHEMY_DATABASE_URL = "sqlite:///./mindbridge.db"
    engine = _create_engine(SQLALCHEMY_DATABASE_URL)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

