from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.domain import User
from app.schemas.user import UserCreate, UserResponse, Token
from app.core.security import verify_password, get_password_hash, create_access_token
from app.core.rate_limit import rate_limit_auth
from app.core.config import settings
from app.api.deps import get_current_user

router = APIRouter()

@router.post("/register", response_model=UserResponse, dependencies=[Depends(rate_limit_auth)])
def register(user_in: UserCreate, db: Session = Depends(get_db)):
    # Check if user exists
    user = db.query(User).filter(User.email == user_in.email).first()
    if user:
        raise HTTPException(
            status_code=400,
            detail="The user with this email already exists in the system.",
        )
    
    # Developer convenience only. Production admin creation should use bootstrap env vars.
    is_first_user = (
        settings.FIRST_USER_AUTO_ADMIN
        and not settings.is_production
        and db.query(User).count() == 0
    )
    
    user = User(
        email=user_in.email,
        hashed_password=get_password_hash(user_in.password),
        is_admin=is_first_user,
        is_approved=is_first_user,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

@router.post("/login", response_model=Token, dependencies=[Depends(rate_limit_auth)])
def login(db: Session = Depends(get_db), form_data: OAuth2PasswordRequestForm = Depends()):
    user = db.query(User).filter(User.email == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect email or password")
    
    if not user.is_approved:
        raise HTTPException(status_code=403, detail="Your account is pending admin approval.")
        
    access_token = create_access_token(subject=user.id)
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user
    }

@router.get("/me", response_model=UserResponse)
def read_user_me(current_user: User = Depends(get_current_user)):
    return current_user
