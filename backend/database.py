import time
from typing import Dict, Any, Optional
from supabase import create_client, Client
try:
    from config import settings
except ImportError:
    from backend.config import settings

_supabase_client: Optional[Client] = None

def get_supabase_client() -> Client:
    """
    Singleton Supabase client getter.
    Initializes client using validated credentials from config.
    """
    global _supabase_client
    if _supabase_client is None:
        settings.validate()
        try:
            _supabase_client = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)
        except Exception as e:
            raise RuntimeError(f"Failed to initialize Supabase Python client: {str(e)}")
    return _supabase_client

def get_db() -> Client:
    """
    FastAPI dependency for accessing the Supabase client.
    """
    return get_supabase_client()

def test_supabase_connection() -> Dict[str, Any]:
    """
    Tests live connection to existing Supabase PostgreSQL instance.
    Runs a lightweight query against the existing 'hospitals' table.
    """
    start_time = time.time()
    try:
        client = get_supabase_client()
        # Query existing 'hospitals' table without modifying schema
        response = client.table("hospitals").select("id, name, city, status").limit(5).execute()
        latency_ms = round((time.time() - start_time) * 1000, 2)
        
        return {
            "status": "connected",
            "latency_ms": latency_ms,
            "supabase_url": settings.SUPABASE_URL,
            "table_tested": "hospitals",
            "sample_count": len(response.data) if response.data else 0,
            "sample_records": response.data,
            "error": None
        }
    except Exception as exc:
        latency_ms = round((time.time() - start_time) * 1000, 2)
        return {
            "status": "disconnected",
            "latency_ms": latency_ms,
            "supabase_url": settings.SUPABASE_URL,
            "table_tested": "hospitals",
            "sample_count": 0,
            "sample_records": [],
            "error": str(exc)
        }
