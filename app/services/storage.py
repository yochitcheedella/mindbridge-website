import os
from dotenv import load_dotenv

try:
    from supabase import create_client, Client
except ImportError:
    create_client = None
    Client = None

load_dotenv()

UPLOADS_DIR = "uploads"
os.makedirs(UPLOADS_DIR, exist_ok=True)

# Supabase Configuration for Initial Version at VIT
SUPABASE_URL = os.getenv("SUPABASE_URL", "https://hweyomasaofopsgirqvs.supabase.co")
SUPABASE_KEY = os.getenv("SUPABASE_KEY", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh3ZXlvbWFzYW9mb3BzZ2lycXZzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUxNjIzMTUsImV4cCI6MjEwMDczODMxNX0.s4BdO6_-ip2sVGQJzs8eDQFOEAwCSkLjU7YPXfTHVp4")

supabase_client = None
if create_client and SUPABASE_URL and SUPABASE_KEY:
    try:
        supabase_client = create_client(SUPABASE_URL, SUPABASE_KEY)
    except Exception as e:
        print(f"Notice: Supabase client initialization failed ({e}), defaulting to local volume fallback.")


def upload_file(folder: str, file_path: str, file_bytes: bytes, content_type: str = "application/octet-stream") -> str:
    """
    Saves an uploaded file to Supabase Storage for the initial version.
    Automatically falls back to local server volume under the 'uploads' directory if cloud storage is unavailable.
    """
    # 1. Attempt Supabase Storage upload
    if supabase_client:
        try:
            supabase_client.storage.from_(folder).upload(
                file_path,
                file_bytes,
                file_options={"content-type": content_type, "upsert": "true"}
            )
            public_url = supabase_client.storage.from_(folder).get_public_url(file_path)
            if public_url:
                return public_url
        except Exception as e:
            print(f"Supabase Storage upload error ({e}). Saving directly to local VIT server volume.")
            
    # 2. Local Server Volume Storage Fallback
    try:
        full_folder_path = os.path.join(UPLOADS_DIR, folder, os.path.dirname(file_path))
        os.makedirs(full_folder_path, exist_ok=True)
        
        destination = os.path.join(UPLOADS_DIR, folder, file_path)
        with open(destination, "wb") as f:
            f.write(file_bytes)
            
        # Return relative URL path that can be served by static file middleware
        return f"/uploads/{folder}/{file_path}".replace("\\", "/")
    except Exception as e:
        print(f"Error saving uploaded file locally: {e}")
        return ""


def download_file(folder: str, file_path: str) -> bytes:
    """
    Reads a file from Supabase Storage or the local 'uploads' directory.
    """
    if supabase_client:
        try:
            data = supabase_client.storage.from_(folder).download(file_path)
            if data:
                return data
        except Exception as e:
            pass
            
    try:
        source = os.path.join(UPLOADS_DIR, folder, file_path)
        if not os.path.exists(source):
            return b""
        with open(source, "rb") as f:
            return f.read()
    except Exception as e:
        print(f"Error reading file locally: {e}")
        return b""
