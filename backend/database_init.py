"""
database_init.py — Database table creation and optional demo data seeding.
Called once at application startup by main.py lifespan.
"""

import logging
from database import Base, engine
from models import user, scan, cognitive, appointment, message, caretaker, care_space  # noqa: F401

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
        _seed_care_space()


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


def _seed_care_space() -> None:
    """Seed the Connected Care demo circle once, after demo users exist."""
    from database import SessionLocal
    from models.user import User
    from models.care_space import (
        CareSpace,
        CareSpaceMember,
        DailyRoutineItem,
        MemoryBookItem,
        CaregiverResource,
    )
    from services.auth_service import hash_password
    import json

    db = SessionLocal()
    try:
        family = db.query(User).filter(User.id == "family-001").first()
        if not family:
            family = User(
                id="family-001",
                email="family@demo.com",
                full_name="Priya Sharma (Daughter)",
                role="patient",
                password_hash=hash_password("family123"),
                phone="+91 9876543213",
                is_active=True,
                is_verified=True,
            )
            db.add(family)
            db.flush()
        elif not family.password_hash:
            family.password_hash = hash_password("family123")
            db.commit()

        if db.query(CareSpace).filter(CareSpace.id == "space-sharma-001").first():
            return

        space = CareSpace(
            id="space-sharma-001",
            name="Sharma Family Care Circle",
            patient_id="patient-001",
            assistance_level="guided",
            preferences_json=json.dumps({"large_text": True, "simplified_icons": True}),
            safety_plan_json=json.dumps({
                "emergency_contacts": [
                    {"name": "Rahul Caregiver", "phone": "+91 9876543212", "role": "Primary Caregiver"},
                    {"name": "Priya Sharma (Daughter)", "phone": "+91 9876543213", "role": "Family Contact"},
                    {"name": "Dr. Rajesh Sharma", "phone": "+91 9876543211", "role": "Neurologist"},
                ],
                "home_address": "14 Green Park, New Delhi",
                "safe_zones": ["Home & Garden", "Green Park Community Hall", "Apollo Clinic"],
                "wandering_risk_level": "moderate",
                "calming_strategies": ["Play classical instrumental music", "Show family photo album"],
                "preferred_hospital": "Apollo Hospitals, Sarita Vihar, New Delhi",
                "primary_doctor_name": "Dr. Rajesh Sharma",
                "primary_doctor_phone": "+91 9876543211",
            }),
        )
        db.add(space)
        db.flush()

        full_permissions = {
            "can_manage_routine": True,
            "can_manage_appointments": True,
            "can_view_memory_book": True,
            "can_edit_memory_book": True,
            "can_log_care": True,
            "can_view_vitals": True,
            "can_view_reports": True,
            "can_receive_safety_alerts": True,
            "can_manage_members": True,
        }
        family_permissions = {**full_permissions, "can_edit_memory_book": False, "can_view_reports": False, "can_manage_members": False}
        members = [
            ("member-patient-001", "patient-001", "patient", "Self", full_permissions),
            ("member-caregiver-001", "caretaker-001", "primary_caregiver", "Primary Caregiver", full_permissions),
            ("member-family-001", "family-001", "family_member", "Daughter", family_permissions),
        ]
        db.add_all([
            CareSpaceMember(
                id=member_id,
                care_space_id=space.id,
                user_id=user_id,
                role=role,
                relationship_label=label,
                permissions_json=json.dumps(permissions),
                is_active=True,
            )
            for member_id, user_id, role, label, permissions in members
        ])

        routines = [
            ("routine-1", "Morning Stretch & Deep Breathing", "5 minutes of gentle stretches.", "activity", "08:30 AM", True, "sun"),
            ("routine-2", "Breakfast & Donepezil (5mg)", "Breakfast followed by the morning tablet.", "medication", "09:00 AM", True, "pill"),
            ("routine-3", "15-Minute Brain Game Puzzle", "Enjoy the picture matching game with Rahul.", "routine", "11:30 AM", False, "book"),
            ("routine-4", "Nutritious Lunch & Fruit Salad", "Enjoy lunch and drink fresh coconut water.", "routine", "01:00 PM", False, "cup"),
            ("routine-5", "Afternoon Rest & Hydration", "Relax with soft instrumental music.", "activity", "03:00 PM", False, "heart"),
            ("routine-6", "Evening Garden Walk", "A gentle walk around the garden with Rahul.", "activity", "05:30 PM", False, "walk"),
        ]
        db.add_all([
            DailyRoutineItem(
                id=item_id, care_space_id=space.id, title=title, description=description,
                category=category, scheduled_time=scheduled_time, assigned_to_role="patient",
                is_completed=completed, recurrence="daily", difficulty_level="easy", icon_hint=icon,
            )
            for item_id, title, description, category, scheduled_time, completed, icon in routines
        ])

        memories = [
            ("memory-priya", "familiar_person", "Priya Sharma (Daughter)", "Your eldest daughter", "Priya visits every weekend and loves drinking ginger chai with you.", "+91 9876543213", "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150", False, False),
            ("memory-rahul", "familiar_person", "Rahul Caregiver", "Your primary day caregiver", "Rahul helps with morning exercises, reminders, and daily garden walks.", "+91 9876543212", "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=150", False, False),
            ("memory-doctor", "familiar_person", "Dr. Rajesh Sharma", "Your neurologist at Apollo Hospital", "Senior clinical neurologist reviewing your memory tests and brain scans.", "+91 9876543211", "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=150", False, False),
            ("memory-shimla", "life_memory", "Family Holiday to Shimla (1995)", "Memorable winter family trip", "You, Sunita, and Priya took the toy train through Kalka and watched snowfall together.", None, "https://images.unsplash.com/photo-1518005020951-eccb494ad742?auto=format&fit=crop&q=80&w=300", False, True),
            ("memory-mango", "favorite_place", "Our First Green Park Mango Tree", "Planted in 1988", "You planted this Alphonso tree in the back garden.", None, "https://images.unsplash.com/photo-1553279768-865429fa0078?auto=format&fit=crop&q=80&w=300", False, True),
            ("memory-private", "comfort_item", "Personal Private Reflection", "Personal Journal Entry", "Thoughts on my morning walk and feeling peaceful today.", None, None, True, False),
        ]
        db.add_all([
            MemoryBookItem(
                id=item_id, care_space_id=space.id, created_by_user_id="patient-001",
                item_type=item_type, name_or_title=name, relationship_or_context=context,
                description=description, phone=phone, avatar_or_photo_url=avatar,
                is_private_to_patient=is_private, is_favorite=is_favorite,
            )
            for item_id, item_type, name, context, description, phone, avatar, is_private, is_favorite in memories
        ])
        db.add_all([
            CaregiverResource(
                id="resource-communication",
                title="Communicating with Patience",
                category="communication",
                summary="Simple techniques for calm, respectful conversations.",
                content="Use short sentences, allow extra response time, and offer one choice at a time.",
                read_time_mins=3,
            ),
            CaregiverResource(
                id="resource-burnout",
                title="Caregiver Wellbeing",
                category="self_care",
                summary="Small ways to protect your own energy.",
                content="Take regular breaks, accept help, and stay connected to your own support network.",
                read_time_mins=3,
            ),
        ])
        db.commit()
        logger.info("Seeded Connected Care demo fixtures.")
    except Exception:
        db.rollback()
        logger.exception("Connected Care fixture seeding failed.")
    finally:
        db.close()
