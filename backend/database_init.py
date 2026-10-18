"""
database_init.py — Database table creation and optional demo data seeding.
Called once at application startup by main.py lifespan.
"""

import logging
from database import Base, engine
from models import user, scan, cognitive, appointment, message, caretaker  # noqa: F401

logger = logging.getLogger("demenx.database_init")


def init_db(seed: bool = False) -> None:
    """
    Create all SQLAlchemy tables if they don't already exist.
    Optionally seeds demo data (only when seed=True and tables are empty).
    """
    logger.info("Running database table creation (create_all) …")
    Base.metadata.create_all(bind=engine)
    logger.info("Database tables ready.")

    if seed:
        _seed_demo_data()


def _seed_demo_data() -> None:
    """
    Insert minimal demo records so the UI is not blank on first launch.
    Safe to call repeatedly — checks for existing records first.
    """
    from database import SessionLocal
    from models.user import User
    from services.auth_service import hash_password

    db = SessionLocal()
    try:
        existing = db.query(User).first()
        if existing:
            logger.info("Demo data already present — skipping seed.")
            return

        logger.info("Seeding demo user accounts …")
        demo_users = [
            User(
                id="patient-001",
                email="patient@demo.com",
                full_name="Alex Johnson",
                role="patient",
                password_hash=hash_password("demo1234"),
                is_active=True,
            ),
            User(
                id="doctor-001",
                email="doctor@demo.com",
                full_name="Dr. Sarah Chen",
                role="doctor",
                password_hash=hash_password("demo1234"),
                is_active=True,
            ),
            User(
                id="caretaker-001",
                email="caretaker@demo.com",
                full_name="Mike Roberts",
                role="caretaker",
                password_hash=hash_password("demo1234"),
                is_active=True,
            ),
        ]
        db.add_all(demo_users)
        db.commit()
        logger.info("Seeded %d demo users.", len(demo_users))
    except Exception:
        db.rollback()
        logger.exception("Demo data seeding failed — continuing without seed data.")
    finally:
        db.close()
