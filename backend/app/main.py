from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.trustedhost import TrustedHostMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from contextlib import asynccontextmanager
from app.api.routes import logs, documents, auth, admin, chat
from app.core.config import settings


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request, call_next):
        response = await call_next(request)
        response.headers.setdefault("X-Content-Type-Options", "nosniff")
        response.headers.setdefault("X-Frame-Options", "DENY")
        response.headers.setdefault("Referrer-Policy", "strict-origin-when-cross-origin")
        response.headers.setdefault("Permissions-Policy", "camera=(), microphone=(), geolocation=()")
        if settings.is_production:
            response.headers.setdefault("Strict-Transport-Security", "max-age=31536000; includeSubDomains")
        return response


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Run startup tasks before the app accepts requests."""
    if settings.BOOTSTRAP_ADMIN_EMAIL and settings.BOOTSTRAP_ADMIN_PASSWORD:
        from app.db.session import SessionLocal
        from app.models.domain import User
        from app.core.security import get_password_hash

        db = SessionLocal()
        try:
            exists = db.query(User).filter(User.email == settings.BOOTSTRAP_ADMIN_EMAIL).first()
            if not exists:
                admin_user = User(
                    email=settings.BOOTSTRAP_ADMIN_EMAIL,
                    hashed_password=get_password_hash(settings.BOOTSTRAP_ADMIN_PASSWORD),
                    is_admin=True,
                    is_approved=True
                )
                db.add(admin_user)
                db.commit()
                print(f"[BOOTSTRAP] Created admin user: {settings.BOOTSTRAP_ADMIN_EMAIL}")
        except Exception as e:
            print(f"[BOOTSTRAP] Error: {e}")
        finally:
            db.close()
    
    yield  # App runs here

app = FastAPI(
    title="LOG2ACTION API",
    description="Operational Intelligence Platform — Log Analysis & Knowledge Assistant",
    version="1.0.0",
    lifespan=lifespan,
)

# Host and browser security middleware
if "*" not in settings.allowed_host_list:
    app.add_middleware(TrustedHostMiddleware, allowed_hosts=settings.allowed_host_list)

app.add_middleware(SecurityHeadersMiddleware)

# CORS configuration — use explicit origins in production
cors_origins = settings.cors_origin_list

if "*" in cors_origins:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=False,
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
