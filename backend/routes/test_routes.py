from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Dict, Any
from supabase import Client
try:
    from database import get_db, test_supabase_connection
except ImportError:
    from backend.database import get_db, test_supabase_connection

router = APIRouter(prefix="/api/test", tags=["Database Test & Verification"])

@router.get("/connection")
def check_connection() -> Dict[str, Any]:
    """
    Check live connectivity to Supabase PostgreSQL instance.
    """
    result = test_supabase_connection()
    if result["status"] != "connected":
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={
                "message": "Failed to connect to Supabase database",
                "error": result["error"]
            }
        )
    return {
        "success": True,
        "message": "Database connection established successfully",
        "details": result
    }

@router.get("/hospitals")
def get_existing_hospitals(db: Client = Depends(get_db)) -> Dict[str, Any]:
    """
    Test API: Retrieves existing hospital records from Supabase table 'hospitals'.
    Demonstrates error handling and typed response.
    """
    try:
        response = db.table("hospitals").select("*").order("id").execute()
        return {
            "success": True,
            "table": "hospitals",
            "count": len(response.data) if response.data else 0,
            "records": response.data or []
        }
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "message": "Database query error while fetching hospitals",
                "error": str(exc)
            }
        )

@router.get("/tables-summary")
def get_tables_summary(db: Client = Depends(get_db)) -> Dict[str, Any]:
    """
    Test API: Inspects existing core tables and retrieves row counts.
    Does NOT create, alter, or duplicate any tables.
    """
    existing_tables = [
        "hospitals",
        "users",
        "blood_inventory",
        "blood_requests",
        "transfers",
        "alerts",
        "audit_logs",
        "hospital_distances"
    ]
    summary = {}
    errors = {}

    for table_name in existing_tables:
        try:
            res = db.table(table_name).select("id", count="exact").limit(1).execute()
            count_val = res.count if res.count is not None else len(res.data)
            summary[table_name] = count_val
        except Exception as err:
            errors[table_name] = str(err)

    return {
        "success": True,
        "existing_tables_counts": summary,
        "table_errors": errors
    }
