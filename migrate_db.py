import logging
from sqlalchemy import inspect, text
from app.core.database import engine

logger = logging.getLogger(__name__)

MIGRATIONS = {
    "psychologists": [
        ("email", "VARCHAR(255)"),
        ("password_hash", "VARCHAR(255)"),
        ("institution", "VARCHAR(255) DEFAULT 'Vishnu Institute of Technology'"),
        ("specialization", "VARCHAR(255)"),
        ("experience", "VARCHAR(255)"),
        ("avatar_url", "TEXT"),
        ("full_photo_url", "TEXT"),
        ("quote", "TEXT"),
        ("pillars", "TEXT"),
        ("focus_areas", "TEXT"),
        ("message_to_students", "TEXT"),
        ("fun_facts", "TEXT"),
        ("is_active", "BOOLEAN DEFAULT TRUE"),
        ("available", "VARCHAR(50) DEFAULT 'true'"),
        ("created_at", "TIMESTAMP DEFAULT CURRENT_TIMESTAMP"),
    ],
    "students": [
        ("university_id", "INTEGER DEFAULT 1"),
        ("email_hash", "VARCHAR(255)"),
        ("password_hash", "VARCHAR(255)"),
        ("encrypted_name", "TEXT"),
        ("encrypted_phone", "TEXT"),
        ("encrypted_email", "TEXT"),
        ("anonymous_token", "VARCHAR(255)"),
        ("department", "VARCHAR(100) DEFAULT 'General'"),
        ("year", "INTEGER DEFAULT 1"),
        ("risk_score", "FLOAT DEFAULT 0.0"),
        ("burnout_probability", "FLOAT DEFAULT 0.0"),
        ("daily_wellness_score", "INTEGER DEFAULT 100"),
        ("fcm_token", "TEXT"),
        ("created_at", "TIMESTAMP DEFAULT CURRENT_TIMESTAMP"),
    ],
    "journal_entries": [
        ("entry_date", "TEXT"),
        ("mood", "VARCHAR(50)"),
        ("is_shared_with_counselor", "BOOLEAN DEFAULT FALSE"),
        ("word_count", "INTEGER DEFAULT 0"),
        ("updated_at", "TIMESTAMP"),
    ],
    "appointments": [
        ("session_type", "VARCHAR(50) DEFAULT 'video'"),
        ("duration", "INTEGER DEFAULT 45"),
        ("concern", "TEXT"),
        ("feedback_rating", "INTEGER"),
        ("feedback_tags", "TEXT"),
        ("feedback_comment", "TEXT"),
    ],
    "vit_admins": [
        ("name", "VARCHAR(255)"),
        ("email", "VARCHAR(255)"),
        ("password_hash", "VARCHAR(255)"),
        ("is_active", "BOOLEAN DEFAULT TRUE"),
        ("created_at", "TIMESTAMP DEFAULT CURRENT_TIMESTAMP"),
    ]
}

def migrate():
    try:
        inspector = inspect(engine)
        table_names = inspector.get_table_names()
        is_postgres = engine.dialect.name == "postgresql"

        with engine.begin() as conn:
            # Clean up legacy multi-tenant foreign keys if present on PostgreSQL
            if is_postgres:
                try:
                    conn.execute(text("ALTER TABLE students DROP CONSTRAINT IF EXISTS students_university_id_fkey;"))
                except Exception as fk_err:
                    logger.info(f"FK constraint cleanup notice: {fk_err}")

                if "universities" in table_names:
                    try:
                        conn.execute(text("""
                            INSERT INTO universities (id, name, is_active)
                            VALUES (1, 'Vishnu Institute of Technology', TRUE)
                            ON CONFLICT (id) DO NOTHING;
                        """))
                    except Exception as uni_err:
                        logger.info(f"University seed notice: {uni_err}")

            for table, columns in MIGRATIONS.items():
                if table in table_names:
                    existing_cols = {col["name"].lower() for col in inspector.get_columns(table)}
                    for col_name, col_type in columns:
                        if col_name.lower() not in existing_cols:
                            logger.info(f"Adding column '{col_name}' to table '{table}'...")
                            try:
                                if is_postgres:
                                    conn.execute(text(f"ALTER TABLE {table} ADD COLUMN IF NOT EXISTS {col_name} {col_type}"))
                                else:
                                    conn.execute(text(f"ALTER TABLE {table} ADD COLUMN {col_name} {col_type}"))
                            except Exception as col_err:
                                logger.warning(f"Could not add column {col_name} to {table}: {col_err}")

        logger.info("Database migration finished successfully.")
    except Exception as e:
        logger.error(f"Migration error: {e}")

if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    migrate()
