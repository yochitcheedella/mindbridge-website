# MindBridge AI — Official Institutional Website & Web Platform
**Vishnu Institute of Technology (VIT) & Sri Vishnu Educational Society (SVES) Wellness Centre**

> **"Empowering Minds. Inspiring Lives."**  
> **"No Student Should Suffer in Silence."**

MindBridge AI is the dedicated, confidential, and anonymous institutional mental health ecosystem engineered for **Vishnu Institute of Technology (VIT)**. It bridges the gap between academic pressures and professional support, providing 24/7 AI-assisted therapy, interactive CBT studios, and direct confidential booking with certified campus counselors.

---

## 🌐 Web Platform Overview

This repository hosts the **official MindBridge web platform**, built with **100% feature parity** to the native mobile APK (`MindBridge-VIT-v1.7.apk`), adding a high-impact institutional landing page, dual desktop/mobile responsive navigation, and direct APK distribution.

### 🌟 Key Web Features
- **🏛️ Institutional Landing Page (`/`)**: Features official Vishnu Institute of Technology branding, SVES Wellness Centre insignia, and direct 24/7 emergency hotline (*Tele-MANAS: 14416*).
- **🛡️ Interactive Zero-PII Anonymity Demo**: Live interactive generator demonstrating how student `@vishnu.edu.in` emails are salted, hashed, and never displayed to peers or faculty.
- **👩‍⚕️ Verified SVES Counselors Showcase (`#counselors`)**: Complete profiles of all 7 certified campus psychologists across SVES institutions with credentials, degrees, and bio modals:
  1. **Ram Prudhvi Teja (CRN5259951)** — Senior Wellness Counsellor • Author • Mind-Body Therapist (*VIT*)
  2. **Devika Babu** — Wellness Counsellor (*Vishnu Women's University*)
  3. **Angel Mariam Benny** — Wellness Counsellor (*Vishnu Dental College*)
  4. **Akshitha Selvaraj** — Wellness Counsellor (*Shri Vishnu College of Pharmacy*)
  5. **Gadi Navya Sri** — Wellness Counsellor (*B.V. Raju College*)
  6. **Sahithi Challa** — Wellness Counsellor • Forensic Psychologist (*Vishnu School*)
  7. **Bantu Anumitha** — Wellness Counsellor (*Smt. B. Seetha Polytechnic College*)
- **🧘 4-7-8 Quick Calm Breathwork Widget**: Embedded breathing pause visualizer right on the landing page for instant anxiety reduction.
- **📲 Direct APK Download (`/MindBridge-VIT-v1.7.apk`)**: Direct download button and mobile QR code for Android installation on campus.

---

## 🏛️ The Three Unified Portals

1. **🟢 Student Sanctuary**:
   - **AI Therapy Companion**: Real-time conversational CBT counseling via WebSockets.
   - **CBT Thought Studio & Breathwork**: Cognitive reframing and Calm Canopy audio.
   - **Daily Trackers**: Sleep & Mood tracker with multi-factor burnout risk predictions.
   - **Appointments**: Multi-state confidential booking with campus psychologists.
   - **Peer Community**: Anonymous discussion forums and hybrid daily flashcards.
2. **🔵 Clinical Psychologist Suite**:
   - **Real-Time Risk Radar**: Prioritized clinical triage queue ranking student distress.
   - **SOAP Clinical Notes**: Standardized clinical documentation system.
   - **Session Schedule**: Appointment approval and availability calendar.
   - **Emergency Identity Reveal**: Strict multi-key cryptographic protocol for crises.
3. **🟣 Institutional Administration**:
   - **Branch Heatmaps**: Wellbeing analytics by academic branch (CSE, AI&DS, ECE, EEE, MECH, CIVIL).
   - **Predictive Burnout Engine**: Detects department exam stress spikes early.
   - **Accreditation Reports**: Exportable CSV & JSON audit summaries.

---

## 🛠️ Technology Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS, Vite, Lucide Icons, Web Speech API.
- **Backend**: FastAPI (Python 3.11+), SQLAlchemy, WebSockets, deployed live on Render (`https://mind-bridge-cc9m.onrender.com`).
- **Cryptographic Security**: AES-256 Offline Vault, BCrypt, JWT RBAC Claims, zero-PII storage.
- **Deployment Targets**: Vercel (`vercel.json`), Netlify (`_redirects`), Docker (`Dockerfile.frontend`).

---

## 🚀 Getting Started Locally

### Prerequisites
- Node.js 18+ (Node 22 recommended)
- npm or pnpm

### 1. Installation
```bash
git clone https://github.com/yochitcheedella/mindbridge-website.git
cd mindbridge-website
npm install
```

### 2. Run Development Server
```bash
npm run dev
```
Open **`http://localhost:5173`** in your browser.

### 3. Production Build
```bash
npm run build
```
The optimized production bundle will be generated in `dist/`.

---

## ☁️ Deployment

### 1. Deploy on Vercel (1-Click)
- Import repository `yochitcheedella/mindbridge-website` on [Vercel](https://vercel.com).
- Framework Preset: **Vite**.
- Build Command: `npm run build`.
- Output Directory: `dist`.
- `vercel.json` is already pre-configured with SPA route rewrites.

### 2. Deploy on Netlify
- Drag and drop `dist/` or link repository.
- `public/_redirects` is already pre-configured for SPA routing.

---

## 📞 Campus Emergency Helplines

- **Tele-MANAS (National Toll-Free 24/7)**: `14416`
- **VIT Campus Health Centre**: `08816-250815`
- **SVES Security & Campus Ambulance**: `08816-250800`

---
*© 2026 Vishnu Institute of Technology (VIT). Powered by SVES Wellness Centre.*
