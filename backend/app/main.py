from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import get_settings
from app.api.v1.router import api_router
from app.middleware.security import SecurityHeadersMiddleware
from app.middleware.rate_limit import RateLimitMiddleware
from app.websocket.signaling import router as websocket_router
import logging

settings = get_settings()

app = FastAPI(
    title="ChatFlow API",
    description="Backend API for ChatFlow messaging application",
    version="1.0.0",
)

# Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(RateLimitMiddleware)

# Routers
app.include_router(api_router, prefix="/api/v1")
app.include_router(websocket_router, prefix="/ws")

@app.on_event("startup")
async def startup_event():
    logging.info("Starting up ChatFlow API...")

@app.on_event("shutdown")
async def shutdown_event():
    logging.info("Shutting down ChatFlow API...")

@app.get("/health")
async def health_check():
    return {"status": "ok", "version": app.version}
