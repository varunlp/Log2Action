import sys
import os

# Add the parent directory to sys.path so we can import 'app'
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.db.session import SessionLocal
from app.models.domain import User
from app.core.security import get_password_hash
from app.core.config import settings

def seed_admin():
    db = SessionLocal()
    try:
        admin_email, admin_password = settings.initial_admin_credentials
        if not admin_email or not admin_password:
            print("No initial admin credentials configured.")
            return
        
        user = db.query(User).filter(User.email == admin_email).first()
        if user:
            user.hashed_password = get_password_hash(admin_password)
            user.is_admin = True
            user.is_approved = True
            db.commit()
            print(f"Admin user {admin_email} is ready.")
            return

        admin = User(
            email=admin_email,
            hashed_password=get_password_hash(admin_password),
            is_admin=True,
            is_approved=True
        )
        db.add(admin)
        db.commit()
        print(f"Successfully created admin user: {admin_email}")
    except Exception as e:
        print(f"Error seeding database: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_admin()
