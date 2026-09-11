"""
MindBridge AI — Security utilities.
VIT-only platform. Uses bcrypt directly (passlib had version compat issues).
"""
from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
import bcrypt
import random
import os
from cryptography.fernet import Fernet


SECRET_KEY = os.getenv("SECRET_KEY", "mindbridge-secret-key-change-in-production-use-env-var")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days

# Fernet key must be 32 URL-safe base64-encoded bytes. In production, provide ENCRYPTION_KEY in .env
ENCRYPTION_KEY = os.getenv("ENCRYPTION_KEY", Fernet.generate_key().decode("utf-8"))
fernet = Fernet(ENCRYPTION_KEY.encode("utf-8"))


# Anonymous alias word lists — avoids any personally identifiable descriptors
ADJECTIVES = [
    "Blue", "Silver", "Golden", "Purple", "Crimson", "Emerald",
    "Azure", "Jade", "Amber", "Coral", "Violet", "Indigo",
    "Teal", "Copper", "Sapphire", "Rose", "Forest", "Arctic",
]
NOUNS = [
    "Sparrow", "Eagle", "Ocean", "Phoenix", "Wolf", "Falcon",
    "River", "Mountain", "Star", "Comet", "Orchid", "Cedar",
    "Horizon", "Breeze", "Harbor", "Lantern", "Echo", "Ember",
]


def generate_anonymous_alias() -> str:
    """Generates a unique anonymous display name like 'Blue Sparrow #4821'."""
    adj = random.choice(ADJECTIVES)
    noun = random.choice(NOUNS)
    num = random.randint(1000, 9999)
    return f"{adj} {noun} #{num}"


def hash_password(password: str) -> str:
    """Hash a password using bcrypt."""
    salt = bcrypt.gensalt(rounds=12)
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    """Verify a plaintext password against a bcrypt hash.
    
    Also handles legacy passlib hashes that may have been stored in a slightly
    different format — falls back gracefully if verification fails.
    """
    if not plain or not hashed:
        return False
    try:
        return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))
    except Exception:
        return False


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def decode_token(token: str) -> Optional[dict]:
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except JWTError:
        return None


def encrypt_data(plain_text: str) -> str:
    """Encrypts plain text using AES-128 (Fernet)."""
    if not plain_text:
        return ""
    return fernet.encrypt(plain_text.encode("utf-8")).decode("utf-8")


def decrypt_data(encrypted_text: str) -> str:
    """Decrypts Fernet-encrypted ciphertext."""
    if not encrypted_text:
        return ""
    try:
        return fernet.decrypt(encrypted_text.encode("utf-8")).decode("utf-8")
    except Exception:
        return "[decryption error]"
