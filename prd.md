# Product Requirements Document (PRD)
**Project:** MindBridge AI
**Version:** 1.0.0
**Institution:** Vishnu Institute of Technology (VIT)

## 1. Executive Summary
MindBridge AI is an AI-powered mobile application built exclusively for **Vishnu Institute of Technology (VIT)** to provide students with a 24/7 anonymous mental health support system. It bridges the gap between students suffering in silence and the college's counseling center by providing immediate AI triage, anonymous peer support, and seamless escalation to VIT's psychologists — all through a dedicated mobile app.

## 2. Target Audience
1. **Students (VIT):** Need safe, anonymous, instant mental health support and habit tracking via their mobile phone.
2. **Psychologists (VIT):** Need automated triage, risk insights, and a prioritized patient queue accessible on mobile.
3. **Admin (VIT):** Need high-level, anonymized dashboard analytics on campus wellbeing to guide institutional decisions.

## 3. Core Features
- **AI Chat Companion:** Real-time conversational AI using mobile Speech-to-Text for voice input and natural language emotion detection.
- **Crisis Detection Engine:** Synthesizes mood check-ins, journal reflections, sleep patterns, and chat sentiment to compute a dynamic 0–100 Risk Score.
- **Encrypted Identity Vault:** Students remain completely anonymous (e.g., "Orchid #404" or "Blue Sparrow #4821") during counseling and peer discussions.
- **Controlled Emergency De-anonymization:** Identity revelation is restricted to high-risk crisis alerts ($\ge 0.8$ score or SOS broadcast), with every decryption immutably recorded in the database `AuditLog` table for strict institutional accountability (SRS Section 16).
- **Anonymous Community Forum:** A safe peer support space where students publish posts, reply, and upvote anonymously.
- **Clinical Appointment Booking:** Seamless in-app scheduling of counseling sessions with assigned VIT counseling staff.
- **AI Habit & Recovery Plans:** Personalized daily wellness action items, breathing exercises, and sleep tracking that automatically transition plans from `'active'` to `'completed'`.
- **Unified 3-Tier Credential Recovery:** Secure OTP-verified password reset capability (`/api/auth/reset-password`) accessible across Student, Psychologist, and Admin tiers on mobile devices.
- **Resilient Multi-Role Storage Engine:** Document and avatar file upload architecture with primary cloud blob support and seamless automatic fallback to local high-speed server storage (`/uploads`).

## 4. Non-Functional Requirements
- **Performance:** API responses < 2 seconds; AI responses < 3 seconds on campus and mobile networks.
- **Security & Accountability:** FERPA/HIPAA-aligned data handling — AES-256 identity encryption at rest, PostgreSQL Row Level Security (RLS), immutable database audit logging for anonymity breaks, zero-PII admin dashboards, and JWT RBAC authentication.
- **Availability:** 99.9% uptime on Vishnu College's institutional cloud & serverless infrastructure with real-time WebSocket and FCM alert dispatch.
- **Platform:** **Cross-Platform Institutional Product** — Android APK/AAB (Capacitor/Flutter) + Responsive Web Portal (React + Vite hosted on Vercel).
- **Privacy:** Student real identities are never exposed to psychologists or administrators during standard operations; identity de-anonymization is permitted strictly during documented emergency interventions with mandatory reason logging in `identity_reveal_logs`.

