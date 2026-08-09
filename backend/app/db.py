from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from . import config

engine = create_engine(
    config.DATABASE_URL,
    pool_pre_ping=True,
    pool_size=config.DB_POOL_SIZE,
    max_overflow=config.DB_MAX_OVERFLOW,
    pool_timeout=config.DB_POOL_TIMEOUT,
    pool_recycle=config.DB_POOL_RECYCLE,
    connect_args={"sslmode": "require"} if config.DATABASE_URL.startswith("postgresql") else {},
)

SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def db_connectivity_check():
    with engine.connect() as conn:
        result = conn.execute(text("SELECT 1"))
        row = result.fetchone()
    return {"ok": True, "result": row[0] if row else None}
