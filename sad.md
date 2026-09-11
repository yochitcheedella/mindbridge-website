# Software Architecture Document (SAD)
**Project:** MindBridge AI
**Version:** 1.0.0
**Institution:** Vishnu Institute of Technology (VIT)

## 1. Introduction
MindBridge AI is an institutional mobile application built exclusively for **Vishnu Institute of Technology (VIT)**. It provides students, psychologists, and the college administration with an AI-assisted, anonymous mental health support system accessible entirely through a mobile app on Android and iOS.

## 2. Architectural Overview
MindBridge employs a **Client-Server architecture** with a React Native mobile frontend communicating with a Python FastAPI backend hosted on VIT's server infrastructure.

### 2.1 Frontend (Cross-Platform Mobile & Web Application)
- **Framework:** React 19 + TypeScript + Vite
- **Mobile Container & PWA:** Capacitor (Android APK/AAB / iOS native wrapper) + PWA Service Worker (Vite PWA / Workbox)
- **Styling:** Vanilla Tailwind CSS with custom institutional design system tokens, glassmorphism, and responsive breakpoints
- **State & Security Management:** React Hooks with encrypted localStorage institutional token vault
- **Key Modules:**
  - AI Therapy Companion & Voice Therapist (Speech recognition & audio synthesis)
  - Student Dashboard, Mood Tracker, Sleep Tracker, Habit Tracker, and Secure Journal
  - Cognitive Behavioral Therapy (CBT) Thought Studio & Interactive Breathwork
  - Psychologist Triage Radar, Patient Roster, SOAP Notes EHR, and WebRTC Audio Calls
  - Admin Executive Analytics, User Directory, and Institutional Audit Logging
  - Peer Community Forum with anonymous discussions and upvoting
  - Emergency SOS & Campus Response Hotline
- **Navigation:** React Router v7 with role-based routing and widescreen responsive AppLayout drawer

### 2.2 Backend
- **Framework:** FastAPI (Python 3.11+)
- **Database:** PostgreSQL (with SQLite fallback for local dev) via SQLAlchemy ORM
- **AI Integration:** OpenAI API (GPT-4) for context-aware counseling, risk detection, and journal reflection
- **Authentication:** JWT tokens + PBKDF2 Password Hashing
- **Real-time:** WebSockets for live chat between student and psychologist

### 2.3 DevOps & Infrastructure
- **Containerization:** Docker & Docker Compose (single-server deployment)
- **Hosting:** VIT institutional server (on-premise or VIT-managed cloud VM)
- **Monitoring:** Basic logging with structured logs; optional Prometheus metrics via `/metrics`
- **Reverse Proxy:** NGINX for routing and SSL termination

## 3. User Roles & Access Control
The system supports exactly **three user roles**:

| Role | Access |
|---|---|
| **Student** | AI chat, mood tracker, journal, appointments, community, emergency SOS |
| **Psychologist** | Risk queue, anonymous student cases, chat with students, session notes, emergency alerts |
| **Admin (VIT)** | Anonymized campus wellbeing analytics, psychologist management, user management — NO access to chat, journals, or student identity |

## 4. Security, Cryptographic Isolation & Data Flow
All student personally identifiable information (PII)—including real names, emails, contact numbers, and academic roll IDs—is encrypted at rest using **AES-256** cryptographic vaulting via the `Fernet` specification.

- **Anonymous Interaction:** Students communicate with the AI wellness counselors and Peer Community entirely anonymously via generated botanical and faunal aliases (e.g., *Orchid #404* or *Blue Sparrow #4821*). URL routing parameter encoding (`encodeURIComponent`) ensures special characters in aliases are transmitted safely across API boundaries.
- **Controlled Identity Deconstruction:** Real identities are strictly inaccessible during normal platform operation. De-anonymization is exclusively restricted to verified critical emergency scenarios (such as active suicide risk scores $\ge 0.8$ or explicit emergency SOS alarm triggers).
- **Immutable Audit Accountability (SRS Section 16):** Whenever an authorized clinical Psychologist or Emergency Response Committee member initiates an identity decryption request, the backend automatically logs an immutable accountability record (`CLINICAL_IDENTITY_REVEAL` or `IDENTITY_DECRYPTED`) directly into the database `AuditLog` table with the accessor's credentials, timestamp, and stated emergency rationale.
- **Administrative Privacy:** VIT institutional administrators receive solely anonymized, macro-level campus burnout and department wellbeing aggregations—they are cryptographically blocked from viewing individual chat dossiers, mood journals, or decrypted identities.

## 5. Architectural Resiliency & Core Subsystems

### 5.1 Thread-Safe WebSocket Alert Dispatcher (`AlertManager`)
To guarantee zero latency when broadcasting critical life-safety alarms to counseling staff without triggering async/sync concurrency conflicts, the application utilizes a dedicated event loop bridging architecture:
- **Synchronous Worker Compatibility:** When synchronous route endpoints or background analysis threads trigger high-risk alert events, `AlertManager.dispatch_alert()` evaluates current thread context and routes real-time WebSocket payloads via `asyncio.run_coroutine_threadsafe()` into the active Uvicorn event loop.
- **Connection Health Tracking:** Active clinical connections are tracked via an atomic connection registry that automatically prunes dropped sockets without blocking parallel alarm broadcasts.

### 5.2 Multi-Role Storage Engine with Offline Resiliency
In strict compliance with VIT's institutional requirement to minimize external SaaS lock-in and operate autonomously on local college networks, the file storage subsystem features a dual-layer architecture:
- **Primary Interface:** Supports standard cloud bucket storage via Supabase Blob APIs for multi-tier uploads (student medical certificates, clinical stress guidelines, administrative institutional handbooks).
- **Automatic Local Fallback:** When external cloud connectivity is restricted or unconfigured, the file service seamlessly reverts to local high-speed filesystem volume writing under `/uploads/`, ensuring uninterrupted operation across all three user roles on localized VIT campus infrastructure.

### 5.3 AI Habit & Recovery Plan Synthesis (`/api/plans`)
The backend integrates an AI-driven wellness recovery generator that continuously evaluates student chat sentiment and mood logs to synthesize personalized, structured daily action items:
- **Dynamic State Progression:** Recovery plans commence in an `'active'` status. As students check off daily action items via `/api/plans/tasks/{id}/complete`, the subsystem computes progress and triggers an automated status transition to `'completed'` upon full task fulfillment.

### 5.4 Unified 3-Tier OTP Password Recovery
Authentication protocols incorporate a standardized credential recovery gateway (`/api/auth/reset-password`) servicing Students, Psychologists, and Administrators through a unified interface. Time-sensitive one-time passwords (OTP) validate account ownership before executing PBKDF2 password rechambering.

## 6. Verification & Quality Assurance Architecture
To safeguard system integrity and prevent regression during institutional deployments, MindBridge implements an **Isolated Automated Testing Harness**:
- **Zero-Database Pollution:** Test modules leverage an in-memory SQLite runtime engine (`sqlite:///:memory:`) combined with SQLAlchemy `StaticPool`. Each test run instantiates clean ephemeral database schemas that vanish immediately upon completion, protecting live campus demonstration data from pollution or lock contention.
- **10-Module Verification Suite:** End-to-end functionality across all layers—from campus-wide administrative wellbeing metrics and clinical sorting queues to encryption vaults and AI recovery checklists—is continuously validated via 10 dedicated test suites executing under standardized cross-platform output rules.
