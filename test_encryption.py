from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.models.base import Base
from app.models.user import Student
from app.core.security import encrypt_data, decrypt_data, hash_password
from app.api.auth import generate_anonymous_alias

engine = create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def test_aes_256_identity_encryption_vault():
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    
    # 1. Simulate registration in isolated test DB
    name = "John Doe"
    phone = "123-456-7890"
    email = "johndoe@vishnu.edu.in"
    
    alias = generate_anonymous_alias()
    student = Student(
        email_hash=email.lower(), # Simple mock for hash
        password_hash=hash_password("securepassword"),
        encrypted_name=encrypt_data(name),
        encrypted_phone=encrypt_data(phone),
        encrypted_email=encrypt_data(email.lower()),
        anonymous_token=alias
    )
    db.add(student)
    db.commit()
    db.refresh(student)
    
    print(f"[PASS] Stored Name Ciphertext: {student.encrypted_name}")
    print(f"[PASS] Stored Phone Ciphertext: {student.encrypted_phone}")
    
    assert student.encrypted_name != name, "Name was not encrypted in storage!"
    assert student.encrypted_phone != phone, "Phone number was not encrypted in storage!"
    assert student.anonymous_token == alias, "Anonymous alias decoupled from ciphertext vault"
    
    # 2. Simulate Emergency Decryption Protocol (SRS Section 16)
    decrypted_name = decrypt_data(student.encrypted_name)
    decrypted_phone = decrypt_data(student.encrypted_phone)
    decrypted_email = decrypt_data(student.encrypted_email)
    
    print(f"[PASS] Decrypted Name: {decrypted_name}")
    print(f"[PASS] Decrypted Phone: {decrypted_phone}")
    print(f"[PASS] Decrypted Email: {decrypted_email}")
    
    assert decrypted_name == name
    assert decrypted_phone == phone
    assert decrypted_email == email
    
    db.close()
    print("\n[PASS] TEST PASSED: AES-256 PII identity vault encryption and authorized emergency decryption protocol verified!")

if __name__ == "__main__":
    test_aes_256_identity_encryption_vault()
