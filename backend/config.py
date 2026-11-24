import os
from pathlib import Path
from dotenv import load_dotenv

# Locate and load backend/.env
BASE_DIR = Path(__file__).resolve().parent
ENV_PATH = BASE_DIR / ".env"
if ENV_PATH.exists():
    load_dotenv(dotenv_path=ENV_PATH)
else:
    load_dotenv()

class Settings:
    PORT: int = int(os.getenv("PORT", "8000"))
    HOST: str = os.getenv("HOST", "0.0.0.0")
    NODE_ENV: str = os.getenv("NODE_ENV", "development")
    JWT_SECRET: str = os.getenv("JWT_SECRET", "super_secret_jwt_key_2026")
    
    # Supabase Configuration
    SUPABASE_URL: str = os.getenv("SUPABASE_URL", "").strip()
    # Accept SUPABASE_SECRET_KEY, SUPABASE_KEY, or SUPABASE_ANON_KEY
    SUPABASE_KEY: str = (
        os.getenv("SUPABASE_SECRET_KEY")
        or os.getenv("SUPABASE_KEY")
        or os.getenv("SUPABASE_ANON_KEY")
        or ""
    ).strip()

    def validate(self) -> None:
        if not self.SUPABASE_URL:
            raise ValueError("SUPABASE_URL environment variable is missing. Check backend/.env")
        if not self.SUPABASE_KEY:
            raise ValueError("SUPABASE_KEY environment variable is missing. Check backend/.env")

settings = Settings()
