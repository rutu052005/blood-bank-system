from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn

try:
    from config import settings
    from database import test_supabase_connection
    from routes.test_routes import router as test_router
except ImportError:
    from backend.config import settings
    from backend.database import test_supabase_connection
    from backend.routes.test_routes import router as test_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Test Supabase connection
    print("\n" + "=" * 60)
    print("🚀 Initializing FastAPI Backend for Blood Resource Sharing...")
    print(f"📡 Verifying Supabase connection to: {settings.SUPABASE_URL}")
    conn_result = test_supabase_connection()
    if conn_result["status"] == "connected":
        print(f"✅ Supabase connected successfully! (Latency: {conn_result['latency_ms']}ms)")
        print(f"📊 Sample table '{conn_result['table_tested']}' has {conn_result['sample_count']} records.")
    else:
        print(f"⚠️ Supabase connection warning: {conn_result['error']}")
    print("=" * 60 + "\n")
    yield
    print("🛑 FastAPI backend shutting down...")

app = FastAPI(
    title="Multi-Hospital Blood Resource Sharing System API",
    description="FastAPI Backend connected to Supabase PostgreSQL Database",
    version="2.0.0",
    lifespan=lifespan
)

# CORS Configuration - allows React frontend to communicate seamlessly
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
        "https://blood-bank-system-pink.vercel.app",
        "*"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global Error Handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "success": False,
            "message": "An unhandled internal server error occurred",
            "error_detail": str(exc),
            "path": request.url.path
        }
    )

# Root Endpoint
@app.get("/")
def root():
    return {
        "service": "Multi-Hospital Blood Resource Sharing System & Expiry Management API",
        "framework": "FastAPI + Python 3.13",
        "database": "Supabase PostgreSQL",
        "status": "operational",
        "docs_url": "/docs",
        "test_endpoints": [
            "/api/health",
            "/api/test/connection",
            "/api/test/hospitals",
            "/api/test/tables-summary"
        ]
    }

# Health Check Endpoint
@app.get("/api/health")
def health_check():
    conn = test_supabase_connection()
    return {
        "status": "healthy" if conn["status"] == "connected" else "degraded",
        "database": conn,
        "environment": settings.NODE_ENV
    }

# Mount Test Routes
app.include_router(test_router)

if __name__ == "__main__":
    uvicorn.run("main:app", host=settings.HOST, port=settings.PORT, reload=True)
