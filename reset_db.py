from app.core.database import engine
from app.models.base import Base
import app.models  # This imports all models to register them with Base

def reset():
    print("Dropping all tables...")
    Base.metadata.drop_all(bind=engine)
    print("Creating all tables...")
    Base.metadata.create_all(bind=engine)
    print("Database reset successful.")

if __name__ == "__main__":
    reset()
