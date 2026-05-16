from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from typing import List

from app.db.session import get_db
from app.models.domain import User, LogUpload
from app.schemas.user import UserResponse
from app.api.deps import get_current_admin_user

router = APIRouter()

@router.get("/users/pending", response_model=List[UserResponse])
def get_pending_users(
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin_user)
):
    """Get all users waiting for approval"""
    return db.query(User).filter(User.is_approved == False).all()

@router.post("/users/{user_id}/approve")
def approve_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin_user)
):
    """Approve a pending user"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    user.is_approved = True
    db.commit()
    return {"status": "success", "message": f"User {user.email} approved."}

@router.get("/stats")
def get_platform_stats(
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin_user)
):
    """Get basic observability metrics"""
    total_users = db.query(User).count()
    pending_users = db.query(User).filter(User.is_approved == False).count()
    total_logs = db.query(LogUpload).count()
    return {
        "total_users": total_users,
        "pending_approvals": pending_users,
        "total_logs_processed": total_logs,
        "status": "Healthy"
    }

@router.get("/activity")
def get_platform_activity(
    limit: int = 15,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin_user)
):
    """
    Admin can see ALL recent log analyses across all users.
    This is the global audit trail.
    """
    logs = (
        db.query(LogUpload)
        .options(joinedload(LogUpload.analysis), joinedload(LogUpload.owner))
        .order_by(LogUpload.created_at.desc())
        .limit(limit)
        .all()
    )
    
    return [
        {
            "id": log.id,
            "filename": log.filename,
            "user_email": log.owner.email if log.owner else "system",
            "created_at": log.created_at.isoformat() if log.created_at else None,
            "severity": log.analysis.severity if log.analysis else None,
            "issue_summary": log.analysis.issue_summary if log.analysis else None,
        }
        for log in logs
    ]
