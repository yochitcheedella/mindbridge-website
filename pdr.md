# PROJECT DESIGN REPORT (PDR)

# MindBridge AI

### AI-Powered Anonymous Student Mental Health & Crisis Support Mobile Application

**Version:** 1.0

**Institution:** Vishnu Institute of Technology (VIT)

**Prepared By:**
Cheedella Bala Venkata Satya Yochit
B.Tech CSE (AI & DS)

---

# Table of Contents

1. Introduction
2. Problem Statement
3. Existing System
4. Proposed System
5. Objectives
6. Scope
7. Stakeholders
8. System Modules
9. Functional Requirements
10. Non-Functional Requirements
11. System Workflow
12. System Architecture
13. Database Design
14. AI Architecture
15. Anonymous Identity System
16. Emergency Response System
17. Technology Stack
18. Security Architecture
19. Testing Strategy
20. Deployment Strategy
21. Future Enhancements
22. Conclusion

---

# 1. Introduction

Mental health has become one of the biggest concerns among students at Vishnu Institute of Technology.

Common stressors include:

- Academic pressure and examination stress
- Financial issues
- Relationship stress
- Loneliness and homesickness
- Anxiety and depression
- Career uncertainty
- Placement and competition pressure

Unfortunately, most VIT students never seek professional help from the college counseling center due to:

- Fear of judgment from peers, faculty, and family
- Social stigma
- Privacy concerns — fear that faculty or parents will be informed
- Hesitation to walk into the counseling center physically

MindBridge AI is designed to eliminate these barriers by providing a **completely anonymous AI-powered mental health support mobile application**, available to all VIT students on their smartphones, while enabling VIT's psychologists to intervene only during high-risk situations.

---

# 2. Problem Statement

VIT students experience severe mental health issues but avoid counseling because they fear losing their privacy.

Current VIT counseling system limitations:

- Requires physical visit and identity disclosure
- Lacks anonymity
- Has long appointment delays
- Cannot detect suicide risk early
- Cannot provide 24×7 support
- No integration between mood patterns and counseling prioritization

There is currently no integrated platform at VIT that combines:

- AI emotional support
- Professional counseling
- Complete anonymity
- Crisis detection
- Emergency intervention

---

# 3. Existing System

Current approaches VIT students use:

- College counseling center (physical, requires disclosure)
- WhatsApp groups with friends
- General AI chatbots (no institutional integration)
- Traditional therapy (off-campus, costly)

Limitations:

- Not anonymous within the institution
- No institutional integration with VIT data
- No AI crisis prediction
- Limited psychologist availability
- No emergency escalation workflow
- No risk analytics

---

# 4. Proposed System

MindBridge AI provides VIT students with:

✓ Anonymous student accounts (VIT email registered, identity encrypted)

✓ AI emotional support companion (24×7 on mobile)

✓ AI mood tracking and trend analysis

✓ AI conversation and journal analysis

✓ Crisis and suicide risk prediction

✓ Psychologist dashboard with prioritized risk queue

✓ Emergency intervention with controlled identity reveal

✓ Secure AES-256 encrypted storage

✓ Anonymous counseling with VIT psychologists

✓ In-app appointment booking

✓ Self-help exercises and breathing techniques

✓ Private encrypted journal

✓ Mood history and wellness analytics

✓ Anonymous peer support community

---

# 5. Objectives

## Primary Objectives

- Reduce student suicides and mental health crises at VIT
- Increase counseling participation by eliminating the stigma of walking in
- Maintain complete anonymity for every student
- Provide AI support 24×7 through mobile app
- Enable VIT psychologists to manage cases efficiently with AI-assisted prioritization

## Secondary Objectives

- Early detection of at-risk students before crises occur
- Improve overall mental wellness of the VIT student population
- Provide stress management tools accessible on mobile
- Deliver institutional anonymous analytics to VIT administration
- Prevent crisis escalation through proactive intervention

---

# 6. Scope

### Students (VIT)

- Anonymous AI chat (24×7)
- Daily mood tracking
- AI therapist companion
- Anonymous counseling with VIT psychologists
- Emergency SOS help
- Private journal
- Breathing and mindfulness exercises
- Mental health self-assessments
- Anonymous community forum
- Wellness challenges and habit tracker

### Psychologists (VIT)

- AI-prioritized risk dashboard
- Anonymous counseling sessions
- Case management and session notes
- Push notification alerts for high-risk students
- Emergency response coordination
- Student emotional history (anonymous)

### Admin (VIT Administration)

- Anonymous campus wellbeing analytics
- Department-level stress trend reports
- Monthly wellbeing reports
- Psychologist account management
- Platform usage statistics

> **Out of scope:** Multi-university access, SaaS features, subscription billing, web browser access, desktop usage.

---

# 7. Stakeholders

| Stakeholder | Role |
|---|---|
| VIT Students | Primary users — seeking emotional support anonymously |
| VIT Psychologists | Counselors — providing support, managing cases |
| VIT Administration (Admin) | Oversight — monitoring campus wellbeing via aggregate data |
| AI System | Automated support and risk detection engine |
| VIT IT Department | Server hosting and infrastructure support |
| Emergency Response Team (VIT) | Activated during critical crisis events |

---

# 8. System Modules

## Module 1 — Authentication

- Anonymous registration using VIT college email
- OTP verification via email
- JWT token generation (access + refresh)
- Anonymous identity alias mapping
- Role assignment: Student / Psychologist / Admin

---

## Module 2 — Student Dashboard (Mobile)

- Daily mood check-in
- Today's wellness score
- AI Companion shortcut
- Upcoming appointments
- Journal shortcut
- Breathing exercises
- Emergency SOS button
- Push notifications

---

## Module 3 — AI Mental Health Companion

- 24×7 natural language emotional support
- Emotion and sentiment detection
- Conversation memory (session-based)
- Safety monitoring
- Personalized coping recommendation engine
- CBT-based guidance
- Mindfulness and breathing coaching
- Risk score computation

---

## Module 4 — Psychologist Dashboard (Mobile)

- Live AI-prioritized risk queue
- Anonymous student session management
- Secure messaging with students
- Emergency push notifications
- Case notes (private to psychologist)
- Risk score history per alias
- Appointment calendar

---

## Module 5 — Risk Detection Engine

Detects risk signals for:

- Suicidal ideation
- Self-harm
- Severe depression
- Chronic anxiety
- Panic attacks
- Social isolation
- Burnout
- Sleep disorders
- Eating disorder indicators

Outputs a continuous **risk score 0–100** updated after every interaction.

---

## Module 6 — Emergency Response Module

- Critical-threshold detection triggers immediate psychologist alert
- Psychologist reviews conversation and verifies risk
- Authorized multi-step identity reveal process
- VIT emergency team notification
- Student emergency contact notification (per VIT policy)
- Full audit trail of all emergency actions

---

## Module 7 — Admin Analytics Module

- Daily campus stress index (anonymized)
- Department-level wellbeing trends
- College-wide mood statistics
- AI usage and chat volume statistics
- Appointment and counseling statistics
- Anonymous emergency incident count reports

---

# 9. Functional Requirements

## Student shall:

- Register anonymously using VIT college email
- Chat with AI Companion 24×7 via mobile
- Book appointments with VIT psychologists
- Track daily mood with emoji-scale logging
- Maintain a private encrypted journal
- View mood history and wellness trends
- Receive personalized wellness recommendations
- Trigger emergency SOS when in crisis
- Participate in anonymous community forum

## Psychologist shall:

- Receive push alerts for high-risk student aliases
- View AI-prioritized risk queue
- Chat securely with anonymous students
- Manage counseling appointments
- Record private session notes
- View student emotional history (anonymous)
- Initiate emergency identity reveal when authorized

## Admin shall:

- Manage VIT psychologist accounts
- View anonymized campus wellbeing analytics
- Generate and download wellbeing reports
- Monitor platform usage statistics
- Review system audit logs

---

# 10. Non-Functional Requirements

| Requirement | Specification |
|---|---|
| Availability | 99.9% uptime during VIT academic calendar |
| Scalability | Supports full VIT enrollment (~5,000–10,000 students) |
| Encryption | AES-256 at rest; TLS 1.3 in transit |
| Performance | AI response < 3s; dashboard load < 2s; mood log < 1s |
| Accessibility | Dark mode, screen reader support, adjustable font size |
| Reliability | Daily automatic backup; failover database replica |
| Security | JWT auth, RBAC, rate limiting, audit logging |
| Privacy | No PII visible to psychologists during normal counseling |
| Platform | Android 5.0+ and iOS 13+ mobile app only |
| Compliance | FERPA-aligned data handling; VIT institutional policy compliance |

---

# 11. System Workflow

```
VIT Student opens Mobile App
           ↓
   Anonymous Login (JWT)
           ↓
   Daily Mood Check-in
           ↓
      AI Chat Session
           ↓
    Emotion Analysis
           ↓
   Risk Score Computed
           ↓
  ┌────────────────────────────────────┐
  │                                    │
Low Risk (0–30)   Medium (31–60)   High/Critical (61–100)
     ↓                 ↓                    ↓
AI Support    Psychologist Rec.    Immediate Psychologist
& Tips        + Booking Prompt          Push Alert
                                         ↓
                              Psychologist Reviews Case
                                         ↓
                             Emergency Protocol if Critical
                                         ↓
                                   Case Resolved
                                   & Logged
```

---

# 12. High-Level Architecture

```
┌─────────────────────────────────┐
│   React Native Mobile App       │
│   (Student / Psychologist /     │
│    Admin — same app, 3 roles)   │
└──────────────┬──────────────────┘
               │ HTTPS / WebSocket
┌──────────────▼──────────────────┐
│      FastAPI Backend            │
│   ┌──────────────────────────┐  │
│   │  Authentication Service  │  │
│   │  AI Engine & Risk Det.   │  │
│   │  Appointment Service     │  │
│   │  Notification Service    │  │
│   │  Analytics Service       │  │
│   └──────────────────────────┘  │
└──────────────┬──────────────────┘
               │
┌──────────────▼──────────────────┐
│     PostgreSQL Database         │
│  (Hosted on VIT Server)         │
└─────────────────────────────────┘
               │
┌──────────────▼──────────────────┐
│   External Services             │
│   - OpenAI API (AI Chat)        │
│   - Firebase FCM (Push Notif.)  │
│   - VIT Email SMTP (OTP)        │
└─────────────────────────────────┘
```

---

# 13. Database Design

## Main Tables

| Table | Key Columns |
|---|---|
| Users | id, encrypted_email, encrypted_name, role, created_at |
| AnonymousProfiles | id, user_id, alias, department, year |
| MoodLogs | id, anonymous_id, mood_value, note, timestamp |
| JournalEntries | id, anonymous_id, encrypted_content, tags, timestamp |
| ChatSessions | id, anonymous_id, session_start, session_end |
| Messages | id, session_id, sender_role, encrypted_content, timestamp |
| Appointments | id, anonymous_id, psychologist_id, scheduled_at, status |
| Psychologists | id, name, specialization, email, is_active |
| RiskAssessments | id, anonymous_id, score, level, computed_at |
| EmergencyCases | id, anonymous_id, triggered_by, resolved_at, outcome |
| Notifications | id, recipient_id, type, message, read_at |
| CommunityPosts | id, anonymous_id, content, moderation_status |
| AuditLogs | id, action_type, actor_id, target_id, timestamp, details |

---

# 14. AI Architecture

```
Student Input (Text / Voice)
          ↓
    Text Pre-processing
    (cleaning, language detection)
          ↓
   Sentiment Analysis
   (positive / negative / neutral)
          ↓
   Emotion Classification
   (sad / anxious / angry / hopeless / etc.)
          ↓
   Risk Prediction (0–100 score)
          ↓
   Intent Detection
   (help-seeking / venting / crisis signal)
          ↓
   Recommendation Engine
   (coping strategy / meditation / escalation)
          ↓
   Response Generation (GPT-4)
          ↓
   Memory Update (session context)
          ↓
   Safety Verification (crisis keyword check)
          ↓
   Final Response → Student's Mobile Screen
```

---

# 15. Anonymous Identity Architecture

```
Student registers with VIT Email
              ↓
     Email encrypted (AES-256)
     Stored separately in DB
              ↓
   Unique Anonymous Alias Generated
   e.g., "Blue Sparrow #4821"
              ↓
   Psychologist sees ONLY:
   - Anonymous Alias
   - Department (e.g., CSE, ECE)
   - Academic Year (e.g., 2nd Year)
   - Risk Score
   - Mood History
   - AI Session Summary
   (NO name, roll number, phone, email)
              ↓
   Emergency Identity Reveal:
   - Triggered by: High/Critical Risk
   - Authorized by: VIT Psychologist
   - Multi-step confirmation required
   - Identity revealed ONLY after psychologist
     confirmation + admin approval
   - Every reveal permanently logged in AuditLog
```

---

# 16. Emergency Response System

```
Risk Score > 85 (Critical)
OR Student presses SOS Button
          ↓
Immediate Push Notification
→ VIT Psychologist Mobile App
          ↓
Psychologist Reviews
Anonymous Conversation
          ↓
Psychologist Confirms Emergency
          ↓
Authorized Identity Unlock Process
(multi-step confirmation)
          ↓
Emergency Contact Notified
(student's registered contact)
          ↓
VIT Emergency Team Activated
if required
          ↓
Ongoing Case Monitoring
          ↓
Case Closed & Outcome Logged
```

---

# 17. Technology Stack

### Mobile Frontend

| Technology | Purpose |
|---|---|
| React 19 / TypeScript / Vite | Modern high-performance responsive web and mobile architecture |
| Capacitor 8 (Mobile PWA) | Native Android APK & iOS mobile runtime bundling |
| Tailwind CSS / Lucide Icons | Responsive styling and design system icons |
| Web Speech API | Native speech-to-text dictation and audio feedback |
| React Router v6 | Client-side view and modal navigation |

### Backend

| Technology | Purpose |
|---|---|
| FastAPI (Python 3.11+) | REST API & real-time WebSocket server |
| SQLAlchemy ORM & Uvicorn | Database abstraction & asynchronous WSGI engine |
| JWT & PBKDF2 Hashing | Role-based authentication across 3 tiers (Student/Psychologist/Admin) |
| Pydantic v2 | Data model validation and API schema serialization |
| WebSockets & AlertManager | Thread-safe real-time crisis alert dispatcher |

### AI

| Technology | Purpose |
|---|---|
| OpenAI GPT-4 | Conversational AI & response generation |
| Sentence Transformers | Semantic similarity & context matching |
| Hugging Face Models | Emotion classification |
| spaCy | NLP text processing |
| Scikit-learn / Risk Engine | Dynamic burnout & suicide risk prediction |

### Database & Storage

| Technology | Purpose |
|---|---|
| PostgreSQL | Primary production institutional relational database |
| SQLite & StaticPool | Local standalone server and zero-pollution in-memory test engine |
| Supabase Blob Storage | Initial version cloud document uploads with seamless local volume fallback (`/uploads/`) |

### Notifications

| Technology | Purpose |
|---|---|
| Firebase Cloud Messaging | Mobile push notifications for critical SOS triage |
| VIT SMTP & Demo Simulator | Email OTP dispatch during multi-role registration & password reset |

### Deployment (VIT Server)

| Technology | Purpose |
|---|---|
| Docker & Docker Compose | Containerized single-server deployment |
| NGINX | Reverse proxy with 50MB payload limits & 3600s WebSocket timeouts |
| VIT Institutional Server | Dedicated on-premise or campus cloud hosting |

---

# 18. Security Architecture

- **AES-256 Encryption** — All PII at rest (name, email, phone, roll number) vaulted via `Fernet` specification
- **JWT RBAC Authentication** — Stateless token verification strictly isolating Student, Psychologist, and Admin levels
- **HTTPS (TLS 1.3)** — All data in transit encrypted across API boundaries
- **Rate Limiting (SlowAPI)** — Prevent brute force attempts on login and chat routes
- **Role-Based Access Control (RBAC)** — Three-tier institutional governance with zero multi-tenant complexity
- **Unified OTP Credential Recovery** — Secure one-time password verification for multi-role password resets (`/api/auth/reset-password`)
- **Immutable Database Audit Logs** — Every sensitive crisis intervention and identity reveal is permanently recorded in the database `AuditLog` table for accountability (SRS Section 16 compliance)
- **Row-Level Privacy Isolation** — Students can only access their own encrypted data and counseling records
- **End-to-End Counseling Integrity** — Protected communications between student and assigned campus counselor
- **Anonymous Identity Vault** — Student legal PII decoupled from generated animal aliases (e.g., *Orchid #404*) during standard platform operation

---

# 19. Testing Strategy

| Test Type | Description |
|---|---|
| Unit Testing | Individual function and service testing (pytest) |
| Integration Testing | API endpoint and database integration tests |
| System Testing | End-to-end mobile app user flow testing |
| Performance Testing | Load testing for VIT student population scale |
| Security Testing | Vulnerability scanning and penetration testing |
| AI Accuracy Testing | Risk score validation against labeled test cases |
| Emergency Workflow Testing | Full crisis escalation workflow simulation |
| Usability Testing | Student and psychologist UX review on mobile devices |

---

# 20. Deployment Strategy

```
Development Environment (local)
          ↓
Testing Server (Docker Compose, internal VIT network)
          ↓
Pilot Deployment — One VIT Department (e.g., CSE)
          ↓
Evaluation & Feedback Collection
          ↓
VIT-Wide Rollout — All Departments
          ↓
Ongoing Maintenance & AI Model Updates
```

---

# 21. Future Enhancements

- Voice counseling (real-time spoken AI therapy)
- In-app video counseling sessions
- AI voice assistant (hands-free mode)
- Smartwatch integration (heart rate, sleep data)
- AI burnout prediction from academic schedule
- Telugu / regional language support
- Peer support groups (moderated by VIT psychologists)
- Gamified wellness challenges
- AI 7-day personalized recovery plan generator
- Offline AI support (on-device model)
- Predictive mental wellness analytics
- VIT faculty wellbeing module

---

# 22. Conclusion

MindBridge AI aims to transform student mental healthcare at **Vishnu Institute of Technology** by combining artificial intelligence, complete anonymity, and professional psychological support into a single secure **mobile application**. The system provides continuous AI assistance, early detection of mental health risks, and a structured emergency intervention workflow while preserving student privacy absolutely. By enabling timely support and data-driven anonymous wellness insights for VIT administration, MindBridge AI has the potential to improve student well-being, increase counseling accessibility, and reduce the impact of untreated mental health challenges across the VIT campus.

---

## Project Summary

| Item | Details |
|---|---|
| **Project Name** | MindBridge AI |
| **Project Type** | AI-Powered Institutional Mental Health Mobile Application |
| **Institution** | Vishnu Institute of Technology (VIT) |
| **Domain** | Healthcare / EdTech / AI |
| **Target Users** | VIT Students · VIT Psychologists · VIT Admin |
| **User Levels** | 3 (Student, Psychologist, Admin) |
| **Platform** | Mobile App — Android & iOS |
| **Frontend** | React Native (Expo) |
| **Backend** | FastAPI (Python 3.11+) |
| **Database** | PostgreSQL (VIT server) |
| **AI Stack** | OpenAI GPT-4, Hugging Face, spaCy, Sentence Transformers |
| **Deployment** | Docker + NGINX on VIT Institutional Server |
| **Primary Innovation** | Anonymous AI-assisted mental health support with verified emergency identity reveal |
| **Scale** | VIT campus-wide (pilot: 1 dept → full VIT rollout) |

This PDR is comprehensive and suitable as a **final-year B.Tech project report** for Vishnu Institute of Technology.
