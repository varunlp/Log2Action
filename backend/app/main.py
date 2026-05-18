from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
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
    admin_email, admin_password = settings.bootstrap_admin_credentials
    if admin_email and admin_password:
        from app.db.session import SessionLocal
        from app.models.domain import User
        from app.core.security import get_password_hash

        db = SessionLocal()
        try:
            existing_admin = db.query(User).filter(User.email == admin_email).first()
            if existing_admin:
                existing_admin.hashed_password = get_password_hash(admin_password)
                existing_admin.is_admin = True
                existing_admin.is_approved = True
                db.commit()
                print(f"[BOOTSTRAP] Admin user ready: {admin_email}")
            else:
                admin_user = User(
                    email=admin_email,
                    hashed_password=get_password_hash(admin_password),
                    is_admin=True,
                    is_approved=True
                )
                db.add(admin_user)
                db.commit()
                print(f"[BOOTSTRAP] Created admin user: {admin_email}")
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


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    messages = []
    for error in exc.errors():
        message = error.get("msg", "Invalid request")
        location = [str(part) for part in error.get("loc", []) if part not in {"body", "query", "path"}]
        if location:
            messages.append(f"{'.'.join(location)}: {message}")
        else:
            messages.append(message)

    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={"detail": "; ".join(messages) or "Invalid request"},
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
