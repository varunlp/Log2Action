from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes import logs, documents, auth, admin

app = FastAPI(
    title="LOG2ACTION API",
    description="Operational Intelligence Platform API",
    version="0.1.0",
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify the exact frontend domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(logs.router, prefix="/api/v1/logs", tags=["Logs"])
app.include_router(documents.router, prefix="/api/v1/documents", tags=["Documents"])
app.include_router(auth.router, prefix="/api/v1/auth", tags=["Authentication"])
app.include_router(admin.router, prefix="/api/v1/admin", tags=["Admin"])

@app.get("/health")
async def health_check():
    return {"status": "ok", "service": "log2action_api"}
