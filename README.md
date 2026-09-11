# MindBridge AI — Vishnu Institute of Technology (VIT)

> **"No Student Should Suffer in Silence."**
> **Dedicated AI-Assisted Anonymous Mental Health Mobile Application for Vishnu Institute of Technology.**

MindBridge AI is a tailored institutional mobile application designed exclusively for **Vishnu Institute of Technology (VIT)**. It provides a highly empathetic, secure, and fully anonymous space for students to seek immediate psychological support without fear of stigma. Simultaneously, it equips institutional counselors and psychologists with real-time AI risk triage tools and gives college administration macro-level campus wellbeing insight.

---

## 🏛️ Three-Level Architecture
MindBridge AI avoids unnecessary multi-tenant complexity and operates on a streamlined **Three-Level Role-Based Access Control** protocol:
1. **🟢 Student Level**: Access to anonymous AI counseling, mood logging, daily sleep & habit tracking, interactive wellness plans, and peer peer discussion forums.
2. **🔵 Psychologist Level (Clinical Triage)**: Real-time risk prioritization queue, clinical appointment management (`/psychologist/calendar` & `/psychologist/patients`), encrypted emergency identity reveal protocol, and case notes.
3. **🟣 Admin Level (Institutional Oversight)**: Real-time campus wellbeing analytics across academic departments (CSE, AI&DS, ECE, EEE, MECH, CIVIL), staff personnel user management (`/admin/users`), audit trail logs, and CSV/JSON wellbeing reporting (`/admin/reports`).

---

## ✨ Core Technical Features
- **🛡️ AES-256 Encrypted Identity Vault**: Students register with their `@vishnu.edu.in` email, which is salted, hashed, and symmetrically encrypted in an offline vault. During standard interactions, only anonymous tokens (e.g., *Blue Sparrow #4821*) are displayed.
- **🚨 Multi-Factor Burnout & Risk Engine**: Synthesizes daily habit adherence, sleep duration, mood check-in sentiment, and natural language chat biomarkers to dynamically predict academic burnout and suicidal ideation with zero false-positive fatigue.
- **🎙️ Multilingual Native Audio Support**: Integrated Web Speech API enables native speech dictation and text-to-speech audio feedback across English, Telugu, Hindi, and Tamil to accommodate all VIT students.
- **⚡ Real-Time WebSockets Alert Triage**: Instantaneous background clinical alerting when an acute critical biomarker (e.g., severe self-harm ideation) is expressed during an AI counseling session.

---

## 🛠️ Technology Stack
- **Mobile UI (Frontend)**: React 19, TypeScript, Tailwind CSS, Vite, Capacitor 8 (Android Native / Mobile PWA), Lucide Icons, Web Speech API.
- **Institutional API (Backend)**: FastAPI (Python 3.11+), SQLAlchemy ORM, Uvicorn, SlowAPI Rate Limiting, Pydantic v2.
- **Database Engine**: PostgreSQL 15 (Production via Docker Compose) / SQLite (Local standalone server).
- **Security & Storage**: BCrypt Password Hashing, JWT RBAC Claims, Local Volume Server Blob Storage (`/uploads`), strict CORS & OWASP headers.

---

## 🚀 Getting Started Locally

### 1. Ready-To-Use Demo Accounts
When initialized, the system automatically seeds default institutional credentials for testing across all three levels:
| Role | Email Login | Password |
| :--- | :--- | :--- |
| **Institutional Admin** | `admin@vishnu.edu.in` | `Admin@VIT2024` |
| **Senior Psychologist** | `ram.sir@vishnu.edu.in` | `Psych@VIT2024` |
| **Staff Counselor** | `dr.sarah.mehta@vishnu.edu.in` | `Psych@VIT2024` |
| **Student Level** | Register anytime via mobile UI | Selected at signup |

### 2. Windows Quick Start (Batch Scripts)
1. Run **`install.bat`** to generate the Python virtual environment and install all Node and Python dependencies.
2. Run **`start.bat`** to concurrently launch the FastAPI server (`http://localhost:8000`) and Vite mobile simulator dev server (`http://localhost:5173`).

### 3. Docker Compose Server Deployment
To run the full stack (PostgreSQL Database + FastAPI Server + Static Nginx Frontend) on the VIT institutional server:
```bash
docker-compose up --build -d
```
* **Frontend Access**: `http://localhost` (Port 80)
* **API Documentation**: `http://localhost:8000/docs`

---

## 🧪 Verified Automated Testing
All core business logic, role-based access control, cryptographic vaults, and immutable database audit trails (SRS Section 16) are completely verified using an isolated in-memory testing engine (`sqlite:///:memory:`):
```bash
venv\Scripts\pytest.exe -v test_admin_analytics.py test_burnout_predictor.py test_community.py test_encryption.py test_storage_multi_role.py test_risk_triage_queue.py test_appointments.py test_emergency_sos.py test_auth_password_reset.py test_ai_recovery_plans.py
```
* **100% Pass Rate**: All 10 verification test suites execute cleanly without modifying or polluting development server records.

---
*Prepared as an Institutional AI Mental Health & Counseling Solution for Vishnu Institute of Technology (VIT).*
