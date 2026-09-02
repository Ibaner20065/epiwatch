import os
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from . import config

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
SQLITE_PATH = os.path.join(BASE_DIR, "epiwatch.db")
SQLITE_URL = f"sqlite:///{SQLITE_PATH.replace(chr(92), '/')}"


def _create_engine():
    target_url = config.DATABASE_URL
    if target_url and target_url.startswith("postgresql"):
        try:
            eng = create_engine(
                target_url,
                pool_pre_ping=True,
                pool_size=config.DB_POOL_SIZE,
                max_overflow=config.DB_MAX_OVERFLOW,
                pool_timeout=config.DB_POOL_TIMEOUT,
                pool_recycle=config.DB_POOL_RECYCLE,
                connect_args={"sslmode": "require", "connect_timeout": 3},
            )
            with eng.connect() as conn:
                conn.execute(text("SELECT 1"))
            return eng
        except Exception as e:
            print(f"[DB] Remote PostgreSQL connection failed: {e}. Using local SQLite database at {SQLITE_PATH}.")
    
    return create_engine(SQLITE_URL, pool_pre_ping=True)


engine = _create_engine()
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
    return {"ok": True, "result": row[0] if row else None, "engine": str(engine.url)}
