import sys
import os

# Add the parent directory to sys.path so we can import 'app'
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.db.session import SessionLocal
from app.models.domain import User
from app.core.security import get_password_hash

def seed_admin():
    db = SessionLocal()
    try:
        admin_email = "admin@log2action.com"
        
        # Check if admin already exists
        user = db.query(User).filter(User.email == admin_email).first()
        if user:
            print(f"Admin user {admin_email} already exists.")
            return

        # Create admin user
        admin = User(
            email=admin_email,
            hashed_password=get_password_hash("admin123"),
            is_admin=True,
            is_approved=True
        )
        db.add(admin)
        db.commit()
        print(f"Successfully created admin user: {admin_email} with password: admin123")
    except Exception as e:
        print(f"Error seeding database: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_admin()
