from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.api.routes import logs, documents, auth, admin, chat
from app.core.config import settings

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Run startup tasks before the app accepts requests."""
    # Auto-seed admin user on first boot
    from app.db.session import SessionLocal
    from app.models.domain import User
    from app.core.security import get_password_hash
    
    db = SessionLocal()
    try:
        admin_email = "admin@log2action.com"
        exists = db.query(User).filter(User.email == admin_email).first()
        if not exists:
            admin_user = User(
                email=admin_email,
                hashed_password=get_password_hash("admin123"),
                is_admin=True,
                is_approved=True
            )
            db.add(admin_user)
            db.commit()
            print(f"[SEED] Created admin user: {admin_email} / admin123")
        else:
            print(f"[SEED] Admin user already exists.")
    except Exception as e:
        print(f"[SEED] Error: {e}")
    finally:
        db.close()
    
    yield  # App runs here

app = FastAPI(
    title="LOG2ACTION API",
    description="Operational Intelligence Platform — Log Analysis & Knowledge Assistant",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS configuration — reads from env, defaults to "*"
cors_origins = [o.strip() for o in settings.CORS_ORIGINS.split(",") if o.strip()]

if "*" in cors_origins:
    app.add_middleware(
        CORSMiddleware,
        allow_origin_regex=".*",
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
else:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

# API Routes
app.include_router(chat.router, prefix="/api/v1/chat", tags=["Chat"])
app.include_router(logs.router, prefix="/api/v1/logs", tags=["Logs (Legacy)"])
app.include_router(documents.router, prefix="/api/v1/documents", tags=["Documents"])
app.include_router(auth.router, prefix="/api/v1/auth", tags=["Authentication"])
app.include_router(admin.router, prefix="/api/v1/admin", tags=["Admin"])

@app.get("/health")
async def health_check():
    return {"status": "ok", "service": "log2action_api", "version": "1.0.0"}
