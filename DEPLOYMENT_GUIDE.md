# MindBridge AI — Production Deployment Guide
**Institutional Mental Health Ecosystem for Vishnu Institute of Technology**

---

## 1. Architecture Overview

MindBridge AI operates under a privacy-first, zero-PII architecture designed for high-availability university deployment:
- **Frontend**: React 19 + TypeScript + Vite + TailwindCSS + PWA Service Worker (Workbox).
- **Backend**: FastAPI (Python 3.11+) + SQLAlchemy ORM + WebSockets + Uvicorn/Gunicorn.
- **Database**: PostgreSQL 15+ (Production) with SQLite fallback for offline development.
- **Security**: AES-256 Vault-encrypted identity mappings, bcrypt password hashing, JWT Bearer authentication, and rate limiting.
- **Mobile**: Capacitor 8 for cross-platform Android & iOS compilation.

---

## 2. Option A: 1-Click Docker Compose (Recommended for Institutional On-Prem / Cloud VPS)

The fastest way to deploy the entire production stack (Frontend + Backend + PostgreSQL Database) with automatic SSL termination and reverse proxying:

### Prerequisites:
- Docker 24.0+
- Docker Compose 2.20+

### Steps:
```bash
# 1. Clone the repository
git clone https://github.com/yochitcheedella/mind_bridge.git
cd mind_bridge

# 2. Configure environment variables
cp .env.example .env

# 3. Build and launch all services
docker compose up -d --build

# 4. Verify deployment health
curl http://localhost:8000/api/health
```

### Services Started:
- **`frontend`** (Port `80`): Nginx reverse proxy serving the optimized Vite SPA bundle and routing `/api/*` and `/ws/*` requests.
- **`backend`** (Port `8000`): Gunicorn cluster with 4 Uvicorn workers running FastAPI.
- **`db`** (Port `5432`): PostgreSQL 15 with persistent volume `postgres-data`.

---

## 3. Option B: Cloud PaaS Deployment (Render + Vercel)

### Backend on Render:
1. Connect repository to [Render.com](https://render.com).
2. The repository includes `render.yaml` for automatic blueprint deployment.
3. It provisions:
   - **`mindbridge-db`**: Managed PostgreSQL database.
   - **`mindbridge-backend`**: Python web service running `uvicorn app.main:app --host 0.0.0.0 --port $PORT`.
4. Required environment variables in Render Dashboard:
   - `SECRET_KEY`: High-entropy 64-character secret.
   - `DATABASE_URL`: Automatically linked from `mindbridge-db`.
   - `CORS_ORIGINS`: Your Vercel frontend URL (e.g., `https://mindbridge.vercel.app`).
   - `OPENAI_API_KEY` or `GEMINI_API_KEY`: For CBT reframing and AI recovery plans.

### Frontend on Vercel:
1. Import repository on [Vercel](https://vercel.com).
2. Framework Preset: **Vite**.
3. Build Command: `npm run build`.
4. Output Directory: `dist`.
5. Environment Variables:
   - `VITE_API_URL`: Your Render backend URL (e.g., `https://mindbridge-backend.onrender.com`).
6. Routing: `vercel.json` is already present to handle client-side React Router rewrites.

---

## 4. Option C: Unified Single-Server Production (FastAPI Serving React SPA)

FastAPI can directly serve the production-built React SPA from `dist/` while exposing all `/api/*` and `/ws/*` endpoints:

```bash
# 1. Install frontend and backend dependencies
npm ci
python -m venv venv
venv\Scripts\activate     # On Windows (or source venv/bin/activate on Linux)
pip install -r requirements.txt

# 2. Build the production frontend SPA bundle
npm run build

# 3. Synchronize database schema and seed accounts
python migrate_db.py

# 4. Start the production server
gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```
Visit `http://localhost:8000/` — the complete React SPA and API are live simultaneously.

---

## 5. Option D: Android Mobile App Production Build

MindBridge AI is built with Capacitor for native Android deployment:

```bash
# 1. Build frontend bundle
npm run build

# 2. Sync web assets with Android native project
npx cap sync android

# 3. Open Android Studio or compile APK directly
cd android
./gradlew assembleRelease
```
The compiled signed production APK will be emitted to `android/app/build/outputs/apk/release/app-release.apk`.

---

## 6. Seeded Demo Accounts for Institutional Evaluation

| Role | Email | Password | Access Privileges |
| :--- | :--- | :--- | :--- |
| **Student** | `student@vishnu.edu.in` | `Student@VIT2024` | Anonymous Journaling, CBT Reframing, PHQ-9/GAD-7, Audio/Video Telehealth, Community |
| **Psychologist** | `dr.sarah.mehta@vishnu.edu.in` | `Psych@VIT2024` | High-Risk Triage Radar, SOAP EHR, Patient Drawer, Shared Student Journals, Telehealth |
| **Admin** | `admin@vishnu.edu.in` | `Admin@VIT2024` | Burnout Index, Department Risk Heatmaps, User Directory, Security Audit Trail |

*Emergency Password Reset Demo OTP*: `123456`

---

## 7. Automated Test Suite & Quality Verification

Run the full automated test matrix (100% pass rate verified):
```bash
# Run complete test suite across all 20 modules
venv\Scripts\pytest.exe -v

# Run multi-role end-to-end dashboard state verification
venv\Scripts\pytest.exe -v test_all_states_dashboards.py

# Typecheck and lint
npm run build
npm run lint
```

---

## 8. Institutional Compliance & Privacy Checklist
- [x] **FERPA / Zero-PII Compliance**: Student identity encrypted via AES-256 vault; counselors only view cryptographic aliases (e.g. *Emerald Heron #721*).
- [x] **Emergency De-anonymization Protocol**: Requires dual-step clinical justification logged in the audit trail.
- [x] **GDPR Data Portability & Right to Erasure**: Fully functional at `/api/privacy/export` and `/api/privacy/account`.
- [x] **Strict Content Security**: HTTP security headers (`nosniff`, `DENY`, XSS protection) enabled on all responses.
