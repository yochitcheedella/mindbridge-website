# Software Requirements Specification (SRS)

## MindBridge AI

### AI-Powered Anonymous Student Mental Health Mobile Application

**Version:** 1.0

**Prepared By:** Cheedella Bala Venkata Satya Yochit

**Project Type:** Institutional Mobile Application — Vishnu Institute of Technology (VIT)

---

# Table of Contents

1. Introduction
2. Purpose
3. Scope
4. Objectives
5. Product Perspective
6. Product Functions
7. User Categories
8. Functional Requirements
9. Non-Functional Requirements
10. External Interface Requirements
11. Database Requirements
12. AI Requirements
13. Anonymous Identity Requirements
14. Security Requirements
15. Risk Detection Requirements
16. Emergency Protocol
17. Technology Stack
18. System Constraints
19. Assumptions
20. Future Scope

---

# 1. Introduction

Mental health has become one of the most serious challenges among students at Vishnu Institute of Technology. Despite increasing awareness, many students hesitate to seek help due to:

* Fear of judgment
* Social stigma
* Privacy concerns
* Fear that parents or faculty may know
* Reluctance to walk into the counseling center

MindBridge AI provides an **anonymous, AI-assisted mobile counseling platform** where VIT students can safely express their emotions and receive immediate support, while enabling VIT's psychologists to intervene only when necessary.

---

# 2. Purpose

The purpose of this system is to:

* Provide 24/7 emotional support through a mobile app
* Allow anonymous counseling with VIT's psychologists
* Detect suicidal intentions using AI before a crisis occurs
* Reduce psychologist workload through intelligent case prioritization
* Protect student privacy absolutely during normal use
* Save lives through early AI-driven intervention

---

# 3. Scope

The MindBridge AI mobile application (Android & iOS) includes:

* Anonymous student accounts
* AI Chat Companion (24/7)
* Human psychologist support (VIT counseling staff)
* Mood tracking & daily check-ins
* Private journal
* Anonymous community peer support
* AI-powered Crisis Detection
* Emergency SOS and contact
* Risk analytics for psychologists
* Push notifications
* Appointment scheduling with VIT psychologists
* Admin analytics dashboard (anonymized)

> **Out of scope:** Web browser access, desktop usage, multi-university deployment, SaaS subscriptions, billing management, or any "platform owner" administration tier.

---

# 4. Objectives

The system aims to:

* Reduce depression and anxiety among VIT students
* Detect suicidal thoughts early through AI monitoring
* Maintain complete student anonymity during standard counseling
* Provide instant emotional assistance at any time via mobile
* Help VIT psychologists prioritize the most critical cases
* Improve overall emotional wellbeing on campus

---

# 5. Product Perspective

The application is a mobile-first platform consisting of:

```
VIT Student (Mobile App)
        ↓
   AI Chatbot
        ↓
Risk Detection Engine
        ↓
Psychologist Dashboard (Mobile App)
        ↓
Emergency Alert System
        ↓
Encrypted Database (VIT Server)
        ↓
Admin Analytics Dashboard (Mobile App)
```

---

# 6. Product Functions

## Student

* Register anonymously using VIT college email
* Chat with AI Companion 24/7
* Write in private encrypted journal
* Log daily mood
* Daily wellness check-ins
* Post in anonymous community forum
* Book counseling session with VIT psychologist
* Trigger emergency help (SOS)
* Complete mental health self-assessments

---

## AI Assistant

* Natural, empathetic conversation
* Emotion Detection from text
* Sentiment Analysis
* Suicide Risk Prediction (0–100 score)
* CBT-based coping suggestions
* Meditation and breathing exercise recommendations
* Personalized coping plans
* Conversation memory (session-based)

---

## Psychologist (VIT)

* View live risk queue (prioritized by AI)
* Chat anonymously with students
* Schedule and manage counseling sessions
* View student emotional history (anonymous)
* Escalate to emergency protocol
* Receive AI-generated session summaries
* Record session notes (private)

---

## Admin (VIT Administration)

* View anonymized campus wellbeing analytics
* Manage registered VIT psychologists
* Monitor platform usage statistics
* Generate anonymous wellbeing reports
* Review system audit logs

> **Admin cannot view:** student chat, journals, student identity, or psychologist session notes.

---

# 7. User Categories

## Student

Anonymous VIT student seeking emotional support through the mobile app.

---

## Psychologist

Licensed VIT counselor providing anonymous support and crisis intervention.

---

## Administrator

VIT administrative staff managing the platform and viewing aggregate wellbeing data. Has no access to individual student information.

---

# 8. Functional Requirements

---

## Authentication Module

**FR-1** — System shall allow anonymous registration using a VIT college email (email is encrypted; identity is never exposed in-app).

**FR-2** — System shall generate a unique anonymous alias (e.g., *Blue Sparrow #4821*) for each student.

**FR-3** — System shall never expose real student identity to psychologists during standard counseling.

**FR-4** — System shall encrypt all student PII using AES-256.

**FR-5** — System shall support role-based login for Student, Psychologist, and Admin.

---

## AI Chat Module

**FR-6** — Students can initiate AI chat conversations from the mobile app at any time.

**FR-7** — AI shall respond empathetically within 3 seconds.

**FR-8** — AI shall retain conversation context within a session.

**FR-9** — AI shall detect emotions from student messages.

**FR-10** — AI shall generate personalized coping strategies.

**FR-11** — AI shall recommend booking a psychologist session if distress is detected.

**FR-12** — AI shall support voice-to-text input via the mobile microphone.

---

## Mood Tracking

**FR-13** — Daily mood logging with emoji scale and optional note.

**FR-14** — Weekly mood analytics displayed as charts in the mobile app.

**FR-15** — Monthly mood reports viewable by the student.

**FR-16** — Mood trends used to update the AI risk score.

---

## Journal

**FR-17** — Students can write encrypted private journal entries.

**FR-18** — AI extracts emotional themes from journal entries (locally summarized).

**FR-19** — Students can search previous entries by keyword or tag.

**FR-20** — Students may optionally share specific journal entries with their assigned psychologist.

---

## Community (Anonymous Forum)

**FR-21** — Students can create anonymous posts and replies.

**FR-22** — Students can report abusive or harmful content.

**FR-23** — AI moderates posts for crisis-level content and triggers alerts if needed.

---

## Appointment Module

**FR-24** — Students can book, cancel, or reschedule counseling sessions with VIT psychologists.

**FR-25** — Psychologists receive appointment requests with only the student's anonymous alias and risk level.

**FR-26** — Push notification reminders are sent to both parties before a session.

---

## Risk Detection

**FR-27** — AI continuously analyzes chat, mood logs, and journal entries for risk signals.

**FR-28** — AI assigns a risk score from 0–100.

**FR-29** — Psychologists are immediately notified via push notification when a student's risk score exceeds the threshold.

**FR-30** — The emergency protocol is triggered automatically for Critical Risk detections.

---

## Psychologist Dashboard

**FR-31** — Risk Queue: Prioritized list of students sorted by AI risk score.

**FR-32** — Case History: Full anonymous interaction history per student alias.

**FR-33** — Student Timeline: Chronological view of mood logs, journal summaries, and chat.

**FR-34** — Emotion graphs: Visual charts of student emotional trends.

**FR-35** — Priority cases flagged with color-coded severity indicators.

---

## Admin Dashboard

**FR-36** — Anonymous campus wellbeing analytics (average stress, department trends, session counts).

**FR-37** — Add, edit, or deactivate VIT psychologist accounts.

**FR-38** — View platform usage statistics (total users, active sessions, appointments — all anonymized).

**FR-39** — Download anonymized wellbeing reports (PDF/CSV).

---

# 9. Non-Functional Requirements

## Performance

| Metric | Requirement |
|---|---|
| Dashboard load time | < 2 seconds |
| AI chat response | < 3 seconds |
| Mood log submission | < 1 second |
| Push notification delivery | < 5 seconds |

---

## Availability

System uptime: **99.9%** during VIT academic hours; best-effort during holidays.

---

## Scalability

Support the full enrolled student population of VIT (~5,000–10,000 students) without performance degradation.

---

## Security

* AES-256 encryption at rest
* TLS 1.3 in transit
* JWT Authentication (access + refresh tokens)
* Role-Based Access Control (RBAC)
* Secure Audit Logs for all identity-reveal actions
* Rate Limiting on all API endpoints
* SQL Injection & XSS prevention

---

## Reliability

* Automatic database backup (daily)
* Disaster recovery plan
* Failover database replica

---

## Usability

* Mobile-first responsive UI
* Dark Mode and Light Mode
* Accessibility: Screen reader support, high-contrast mode, adjustable font size
* Simple, calming design language

---

## Compatibility

| Platform | Minimum Version |
|---|---|
| Android | 5.0 (API 21) |
| iOS | 13.0 |

> The application is a **mobile app only**. No web browser or desktop access is provided.

---

# 10. External Interface Requirements

## Hardware Interfaces

* Android smartphone
* iPhone

## Software / API Interfaces

* OpenAI API — AI chat and emotional analysis
* Firebase Cloud Messaging — Push notifications
* Mobile Speech-to-Text API — Voice journal and chat input
* VIT Email SMTP — OTP verification during registration

---

# 11. Database Requirements

## Core Tables

| Table | Purpose |
|---|---|
| Users | Encrypted student PII (never exposed in-app) |
| AnonymousIdentity | Animal-alias mapping per student |
| MoodLogs | Daily mood entries |
| JournalEntries | Encrypted journal content |
| Appointments | Counseling bookings |
| AIChats | Chat session messages |
| RiskScores | AI-generated risk score history |
| Psychologists | VIT psychologist accounts |
| Notifications | Push notification records |
| EmergencyContacts | Student-provided emergency contact (encrypted) |
| CommunityPosts | Anonymous forum posts |
| CommunityReplies | Anonymous forum replies |
| AuditLogs | All identity-reveal and admin actions |

---

# 12. AI Requirements

The AI system shall detect:

* Anxiety
* Depression
* Panic attacks
* Burnout
* Loneliness
* PTSD indicators
* Self-harm signals
* Suicide Risk

The AI system shall generate:

* Coping techniques
* Guided meditation scripts
* Positive affirmations
* CBT exercises
* Grounding exercises (5-4-3-2-1 technique)

The AI system shall predict:

* Risk Score: **0–100** (Low / Medium / High / Critical)

---

# 13. Anonymous Identity Requirements

```
Student registers with VIT email
          ↓
     Email encrypted (AES-256)
          ↓
  Unique Anonymous Alias generated
    e.g., "Blue Sparrow #4821"
          ↓
  Psychologist sees only:
    - Anonymous Alias
    - Department
    - Academic Year
    - Risk Score
    - Mood History
    (NO name, roll number, phone, or email)
          ↓
  Emergency Identity Reveal:
    - Only triggered by psychologist during crisis
    - Requires multi-step authorization
    - Every reveal is permanently logged in AuditLog
```

---

# 14. Security Requirements

* AES-256 encryption for all PII
* JWT Authentication with refresh token rotation
* Role-Based Access Control — Student / Psychologist / Admin
* End-to-End encryption for chat messages
* Rate limiting on login and chat endpoints
* SQL Injection prevention via ORM parameterization
* XSS and CSRF protection
* Comprehensive Audit Logging
* Secure password hashing (PBKDF2/bcrypt)
* HTTPS enforced on all endpoints

---

# 15. AI Risk Detection Levels

## Low Risk (Score 0–30)

Sad, lonely, stressed, homesick

→ *AI provides coping tips and encouragement*

---

## Medium Risk (Score 31–60)

Hopeless, worthless, persistent anxiety, depression indicators

→ *AI recommends booking a psychologist session*

---

## High Risk (Score 61–85)

Self-harm language, severe depression, social withdrawal

→ *Psychologist is notified immediately via push notification*

---

## Critical Risk (Score 86–100)

"I want to die", "I'll kill myself", "No reason to live"

→ *Immediate emergency protocol triggered*

---

# 16. Emergency Protocol

When AI detects a Critical Risk message:

1. AI assigns **Critical Risk** score.
2. VIT psychologist receives an **immediate push notification** with the student's alias.
3. AI continues supportive conversation, gently encouraging the student to stay connected.
4. Psychologist reviews the conversation history.
5. If imminent danger is confirmed, the psychologist initiates the **authorized identity-reveal process** (multi-step confirmation required).
6. VIT's institutional emergency response team and/or the student's registered emergency contact are notified.
7. **All actions are permanently logged** in the AuditLog table for accountability.

---

# 17. Technology Stack

## Frontend (Cross-Platform Mobile & Responsive Web)

* React 19 + TypeScript + Vite
* Capacitor (Android APK/AAB / iOS native container) + PWA (Workbox Service Worker offline caching)
* Tailwind CSS with institutional color palettes, dark glassmorphism, and responsive breakpoints
* React Router v7 with role-based authenticated routing and widescreen AppLayout drawer
* Native Web Audio API / WebRTC for anonymous audio therapy & live counselor calls

## Backend

* FastAPI (Python 3.11+)
* SQLAlchemy ORM

## AI

* OpenAI GPT-4
* Sentence Transformers
* Emotion Detection Model (Hugging Face)

## Database

* PostgreSQL (primary)
* SQLite (local development only)

## Authentication

* JWT (access + refresh tokens)
* PBKDF2 / bcrypt password hashing

## Notifications

* Firebase Cloud Messaging (FCM)

## Deployment

* Docker & Docker Compose
* NGINX reverse proxy
* VIT institutional server (on-premise or cloud VM)

---

# 18. System Constraints

* Internet connection required for AI chat (mobile data or Wi-Fi)
* Licensed VIT psychologists must be registered in the system before student sessions
* AI is designed to support — not replace — professional mental healthcare
* Emergency identity access must comply with VIT institutional policies and applicable laws
* The application is designed exclusively for Vishnu Institute of Technology; no multi-university deployment

---

# 19. Assumptions

* Students provide truthful emotional information to the AI
* VIT psychologists are available during designated counseling hours
* AI models are regularly monitored and updated by the technical team
* Students consent to the emergency crisis intervention policy during onboarding
* VIT provides server infrastructure or a cloud VM for hosting

---

# 20. Future Scope

* Voice AI Therapist (real-time spoken conversation)
* Video counseling integration within the app
* Wearable integration (smartwatch heart rate / sleep data)
* AI facial emotion recognition (opt-in, camera-based)
* Telugu / regional language support
* Peer support groups (moderated by psychologists)
* AI-generated personalized 7-day recovery plans
* Offline AI support (on-device model)
* Predictive mental wellness analytics using long-term trends
* VIT faculty wellbeing module (separate role)

---

## Summary

This SRS defines a **mobile-first institutional mental health platform** built exclusively for **Vishnu Institute of Technology**, combining:

* **Anonymous identity protection** with controlled emergency escalation
* **AI-powered emotional support** available 24/7 on mobile
* **Human psychologist intervention** for higher-risk situations (VIT counseling staff)
* **Security-first architecture** with AES-256 encryption and role-based access
* **Three user levels**: Student · Psychologist · Admin

The specification is suitable as a foundation for a **final-year B.Tech project** and a **production-ready institutional deployment** at Vishnu Institute of Technology.
