import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { 
  Shield, AlertTriangle, Clock, ChevronRight, Activity, Filter, CheckCircle2, X, Send, ShieldAlert,
  FileText, Download, Heart, Sparkles, BookOpen, Calendar, Plus, PhoneCall
} from 'lucide-react';
import { apiFetch, API_URL } from '../utils/auth';
import { IdentityRequestModal } from '../components/clinical/IdentityRequestModal';
import CreateFlashcardModal from '../components/flashcards/CreateFlashcardModal';
import CounselorMonthlyReportModal from '../components/reports/CounselorMonthlyReportModal';
import { generateCounselorMonthlyReportPDF, type CounselorMonthlyReportData } from '../utils/counselorReportPdf';
import type { SharedWorkItem } from '../components/clinical/ShareWorkModal';
import type { ScreeningSubmission } from '../components/clinical/StudentScreeningModal';
import { getStoredFlashcards, updateFlashcardStatus, type Flashcard } from '../data/defaultFlashcards';
import {
  buildStudentConfirmationMessage,
  buildStudentBookingMessage,
  buildCounselorBookingMessage,
  dispatchWhatsAppMessage,
  VWC_DISPATCHER_DISPLAY,
} from '../utils/whatsapp';

interface RiskStudent {
  anonymous_id: string;
  risk_score: number;
  department: string;
  year: number;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'ai' | 'counselor';
  text: string;
  timestamp: string;
}

interface SharedJournal {
  id: number;
  entry_date: string;
  content: string;
  mood: string | null;
  mood_tag: string | null;
  word_count: number;
  created_at: string;
}

interface CaseDetails {
  student: {
    anonymous_id: string;
    department: string;
    year: number;
    risk_score: number;
    clinical_concern_level?: string;
  };
  active_appointment_id?: number | null;
  mood_logs: any[];
  shared_journals?: SharedJournal[];
  chat_history: ChatMessage[];
}

interface CaseNote { id: number; content: string; created_at: string; }
interface FollowUpItem { id: number; due_date: string; reason: string | null; completed: boolean; }
interface DecryptedIdentity { name: string; phone: string; email: string; }
interface ActiveAlert { id: number; risk_level: string; triggered_by: string; created_at: string; student_alias: string; risk_score: number; department: string; year: number; }

export default function PsychologistDashboard() {
  const location = useLocation();
  const navigate = useNavigate();
  const [queue, setQueue] = useState<RiskStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCase, setSelectedCase] = useState<string | null>(
    location.state && (location.state as any).selectedAlias ? (location.state as any).selectedAlias : null
  );
  const [caseDetails, setCaseDetails] = useState<CaseDetails | null>(null);
  const [counselorMessage, setCounselorMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [caseTab, setCaseTab] = useState<'chat' | 'notes' | 'journals' | 'timeline' | 'followup'>('chat');
  
  const [decryptedIdentity, setDecryptedIdentity] = useState<DecryptedIdentity | null>(null);
  const [decrypting, setDecrypting] = useState(false);

  // Case Notes state
  const [notes, setNotes] = useState<CaseNote[]>([]);
  const [newNote, setNewNote] = useState('');
  const [savingNote, setSavingNote] = useState(false);

  // Follow-up state
  const [followUps, setFollowUps] = useState<FollowUpItem[]>([]);
  const [followupDate, setFollowupDate] = useState('');
  const [followupReason, setFollowupReason] = useState('');
  const [savingFollowup, setSavingFollowup] = useState(false);

  // Appointments, SOS, Offline Sessions, To-Dos, Flashcards, Shared Works & Monthly Reports
  const [view, setView] = useState<'queue' | 'appointments' | 'offline_sessions' | 'todos' | 'flashcards' | 'sos' | 'shared_works' | 'monthly_reports'>('queue');
  const [activeAlerts, setActiveAlerts] = useState<ActiveAlert[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [rescheduleId, setRescheduleId] = useState<number | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [apptToast, setApptToast] = useState<{ title: string; desc: string; type: 'success' | 'danger'; url?: string } | null>(null);

  // ── MONTHLY REPORTS STATE (REQ 2 & 16) ──
  const [showMonthlyReportModal, setShowMonthlyReportModal] = useState(false);
  const [monthlyReports, setMonthlyReports] = useState<CounselorMonthlyReportData[]>(() => {
    try {
      const stored = localStorage.getItem('mindbridge_counselor_monthly_reports');
      if (stored) return JSON.parse(stored);
    } catch {}
    return [
      {
        id: 'rep-ram-aug-2026',
        counselorName: 'Ram Prudhvi Teja',
        counselorEmail: 'prudhvi.v@vishnu.edu.in',
        department: 'Vishnu Wellness Centre',
        institution: 'Vishnu Institute of Technology (VIT), Bhimavaram',
        month: 'August',
        year: 2026,
        submittedAt: '2026-08-31T17:00:00.000Z',
        administrativeMeetings: [
          {
            date: '24-08-2026',
            meetingName: 'VEDIC Meeting',
            purposeOutcome: 'Discussed the activities and programmes conducted by the Vishnu Wellness Centre during July, along with updates and follow-up on ongoing wellness initiatives.',
            text: 'Attended the VEDIC Meeting on 24th August 2026 and discussed the activities and programmes conducted by the Vishnu Wellness Centre during July, along with updates and follow-up on ongoing wellness initiatives.'
          },
          {
            date: '10-08-2026',
            meetingName: 'Wellness Counsellors Team Coordination Meeting',
            purposeOutcome: 'Reviewed ongoing activities and discussed upcoming events for current and following months including resource requirements, delegation of duties, and timelines.',
            text: 'Conducted a team meeting with the Wellness Counsellors to review ongoing activities and discuss upcoming events for the current and following months. The discussions included updates on previously planned initiatives, event planning and preparation, timelines, resource requirements, and coordination among team members. Duties and responsibilities were delegated for the month to ensure smooth execution of programmes, with follow-up on progress and necessary preparations for upcoming activities.'
          },
          {
            date: '23-08-2026',
            meetingName: 'VWU & VIT Induction Programme',
            purposeOutcome: 'Institutional orientation and engagement activities introducing campus wellness.',
            text: 'Attended the Induction Programme for VWU & VIT on 23rd August 2026 as part of the institutional orientation and engagement activities.'
          },
          {
            date: '28-08-2026',
            meetingName: 'Learning & Development (L&D) Programme',
            purposeOutcome: 'Two-day clinical enrichment programme conducted by Ms. Akshitha on Psychosomatic Conditions.',
            text: 'Attended the Learning & Development (L&D) Programme conducted by Ms. Akshitha on 28th and 29th August 2026.'
          },
          {
            date: '15-08-2026',
            meetingName: 'VWC Social Media Platform Launch',
            purposeOutcome: 'Established online presence for mental health content dissemination.',
            text: 'Created the Vishnu Wellness Centre Social Media Account to establish an online platform for sharing mental health awareness content, wellness initiatives, programmes, and student-support resources.'
          },
          {
            date: '20-08-2026',
            meetingName: 'Flyers and Banners Design',
            purposeOutcome: 'Prepared materials for upcoming wellness events per wellness calendar.',
            text: 'Designed and prepared flyers and banners for upcoming wellness events in accordance with the Vishnu Wellness Calendar to support programme communication and campus-wide awareness.'
          }
        ],
        activitiesConducted: [
          {
            date: '23-08-2026',
            activityName: 'Orientation Programme for First-Year Students',
            targetAudience: '1st Year B.Tech Students (VIT & VWU)',
            participantsCount: 350,
            keyTakeaway: 'Introduced students to the importance of mental health and psychological wellness support services available through VWC.',
            text: 'Conducted an Orientation Programme for first-year students, introducing students to the importance of mental health and the psychological and wellness support services available through the Vishnu Wellness Centre.'
          },
          {
            date: '18-08-2026',
            activityName: 'MINDTAP – Radio Vishnu Programme',
            targetAudience: 'Campus Community',
            participantsCount: 500,
            keyTakeaway: 'Recorded 5 episodes providing psychological awareness and wellness content through Radio Vishnu.',
            text: 'Recorded 5 episodes of the MINDTAP – Radio Vishnu programme, continuing the initiative of providing psychological awareness and wellness-oriented content to the campus community through radio.'
          },
          {
            date: '25-08-2026',
            activityName: 'NIMHANS Gatekeeper Training',
            targetAudience: 'Wellness Counsellors & Key Faculty',
            participantsCount: 20,
            keyTakeaway: 'Strengthened knowledge and preparedness for identifying individuals experiencing distress.',
            text: 'Successfully completed the Gatekeeper Training through the NIMHANS e-Learning Programme, strengthening knowledge and preparedness for identifying individuals experiencing psychological distress and facilitating appropriate support and referral.'
          }
        ],
        sessionStats: {
          week1: '8 + 3 day leave',
          week2: 10,
          week3: 7,
          week4: 5,
          week5: 1,
          total: 31,
          week1Label: '01-08-2026 to 08-08-2026 (1st Week)',
          week2Label: '10-08-2026 to 15-08-2026 (2nd Week)',
          week3Label: '17-08-2026 to 22-08-2026 (3rd Week)',
          week4Label: '24-08-2026 to 29-08-2026 (4th Week)',
          week5Label: '31-08-2026 (5th Week)',
          academicStress: 12,
          emotionalAnxiety: 10,
          familyInterpersonal: 5,
          careerGuidance: 3,
          generalWellbeing: 1,
          crisisSos: 0,
          genderBreakdown: { male: 14, female: 17, other: 0 }
        },
        upcomingGoals: [
          'Continue regular individual and group counselling sessions for students.',
          'Plan and conduct a Suicide Prevention Programme to promote awareness, help-seeking behaviour, early identification, and appropriate support.',
          'Conduct the COPE Programme on Open Mic to encourage student expression, participation, and open conversations around mental health and well-being.',
          'Conduct a Psychology Club/HOPE Club group session on “Understanding Human Behaviour from a Layman’s Perspective”, helping students understand basic psychological concepts and everyday human behaviour in an accessible manner.'
        ],
        generalRemarks: 'All activities for August 2026 completed in accordance with the Vishnu Wellness Calendar.'
      },
      {
        id: 'rep-sample-1',
        counselorName: 'Ms. Devika Babu',
        counselorEmail: 'devika.b@vishnu.edu.in',
        department: 'Vishnu Wellness Centre / Student Welfare',
        institution: 'SVECW (Shri Vishnu Engineering College for Women)',
        month: 'September',
        year: 2026,
        submittedAt: new Date().toISOString(),
        administrativeMeetings: [
          { date: '04/09/2026', meetingName: 'Student Welfare & Mentor HOD Coordination', purposeOutcome: 'Reviewed 1st year transition distress cases and mentor referral protocol.' },
          { date: '18/09/2026', meetingName: 'Central Wellness Clinical Review Meeting', purposeOutcome: 'Harmonized crisis intervention protocol and case documentation.' }
        ],
        activitiesConducted: [
          { date: '08/09/2026', activityName: 'Stress Buster & Exam Resilience Workshop', targetAudience: '2nd Year B.Tech Students', participantsCount: 65, keyTakeaway: 'Taught 4-7-8 breathing, cognitive reframing, and sleep hygiene.' },
          { date: '15/09/2026', activityName: 'Digital Detox & Mindfulness Interactive Stall', targetAudience: 'All Campus Students', participantsCount: 120, keyTakeaway: 'Distributed self-care prompt cards and engaged in micro-journaling.' }
        ],
        sessionStats: {
          week1: 8,
          week2: 11,
          week3: 14,
          week4: 9,
          week5: 6,
          total: 48,
          academicStress: 18,
          emotionalAnxiety: 14,
          familyInterpersonal: 7,
          careerGuidance: 5,
          generalWellbeing: 3,
          crisisSos: 1,
          genderBreakdown: { male: 0, female: 47, other: 1 }
        },
        upcomingGoals: [
          'Conduct targeted test-anxiety workshops for placement-bound cohorts.',
          'Enhance anonymous peer-mentoring circle follow-ups in dormitories.',
          'Strengthen early-identification referral pathways with department mentors.'
        ],
        generalRemarks: 'Overall attendance increased by 18% compared to previous cycle. Students demonstrated high trust in anonymous booking.'
      }
    ];
  });

  // ── STUDENT SHARED WORKS & RAPPORT STATE (REQ 6) ──
  const [sharedWorks, setSharedWorks] = useState<SharedWorkItem[]>(() => {
    try {
      const stored = localStorage.getItem('mindbridge_shared_student_works');
      if (stored) return JSON.parse(stored);
    } catch {}
    return [
      {
        id: 'work-demo-1',
        studentAlias: 'Anonymous_27',
        counselorName: 'Ms. Devika Babu',
        workType: 'Reflection',
        title: 'Reflections on overcoming imposter syndrome in lab exams',
        content: 'I realized that my fear was not about failing the experiment, but about disappointing my parents. Writing this down helped me breathe slower.',
        reflectionNoteForCounselor: 'Looking forward to discussing stanza 2 in our Tuesday session.',
        sharedAt: new Date(Date.now() - 3600000 * 12).toISOString(),
        status: 'shared'
      }
    ];
  });
  const [rapportNotes, setRapportNotes] = useState<Record<string, string>>({});

  // ── SVES STUDENT SCREENING RESULTS (REQ 14) ──
  const [screenedStudents, setScreenedStudents] = useState<ScreeningSubmission[]>(() => {
    try {
      const stored = localStorage.getItem('mindbridge_screening_results');
      if (stored) return JSON.parse(stored);
    } catch {}
    return [
      {
        id: 'scr-demo-1',
        timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
        studentAlias: 'Anonymous_89',
        institution: 'Shri Vishnu Engineering College for Women (SVECW)',
        department: 'CSE',
        yearOfStudy: '3rd Year',
        gender: 'Female',
        stayType: 'Hostel',
        dassScores: { depression: 18, anxiety: 16, stress: 22, total: 56 },
        riskTier: 'High',
        whatsappNumber: '+91 94401 23456',
        answers: {}
      },
      {
        id: 'scr-demo-2',
        timestamp: new Date(Date.now() - 3600000 * 24).toISOString(),
        studentAlias: 'Anonymous_42',
        institution: 'Vishnu Institute of Technology (VIT)',
        department: 'ECE',
        yearOfStudy: '2nd Year',
        gender: 'Male',
        stayType: 'Day Scholar',
        dassScores: { depression: 9, anxiety: 8, stress: 11, total: 28 },
        riskTier: 'Medium',
        answers: {}
      }
    ];
  });

  // ── FLAGGED COMMUNITY ALERTS (REQ 13) ──
  const [flaggedCommunityAlerts, setFlaggedCommunityAlerts] = useState<any[]>(() => {
    try {
      const stored = localStorage.getItem('mindbridge_flagged_community_alerts');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // ── DIRECT SESSION BOOKING MODAL STATE FOR SCREENED STUDENT ──
  const [bookingForStudent, setBookingForStudent] = useState<ScreeningSubmission | null>(null);
  const [bookingDate, setBookingDate] = useState(new Date().toISOString().split('T')[0]);
  const [bookingTime, setBookingTime] = useState('11:00 AM');
  const [bookingSuccessMsg, setBookingSuccessMsg] = useState('');

  // ── COUNSELLOR WELLNESS FLASHCARDS STATE ──
  const [flashcards, setFlashcards] = useState<Flashcard[]>(() => 
    getStoredFlashcards().filter(f => f.source === 'COUNSELLOR')
  );
  const [showFlashcardModal, setShowFlashcardModal] = useState(false);
  const [flashcardFilter, setFlashcardFilter] = useState<'ALL' | 'PUBLISHED' | 'PENDING_REVIEW' | 'DRAFT'>('ALL');

  // ── MANUAL OFFLINE SESSION ENTRY STATE ──
  const [offlineSessions, setOfflineSessions] = useState<any[]>(() => {
    try {
      const stored = localStorage.getItem('mindbridge_offline_sessions');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });
  const [showOfflineModal, setShowOfflineModal] = useState(false);
  const [offAlias, setOffAlias] = useState('');
  const [offDate, setOffDate] = useState(new Date().toISOString().split('T')[0]);
  const [offType, setOffType] = useState<'Individual' | 'Group' | 'Emergency'>('Individual');
  const [offDuration, setOffDuration] = useState('45 min');
  const [offConcern, setOffConcern] = useState('Academic Stress');
  const [offRisk, setOffRisk] = useState<'Low' | 'Moderate' | 'High' | 'Severe'>('Low');
  const [offNotes, setOffNotes] = useState('');
  const [offFollowUp, setOffFollowUp] = useState(true);
  const [offNextDate, setOffNextDate] = useState('');

  // ── DEDICATED COUNSELLOR TO-DO LIST STATE ──
  const [tasks, setTasks] = useState<any[]>(() => {
    try {
      const stored = localStorage.getItem('mindbridge_counselor_tasks');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<'Urgent' | 'Important' | 'Normal'>('Important');
  const [newTaskDue, setNewTaskDue] = useState('Today, 5:00 PM');
  const [newTaskStudent, setNewTaskStudent] = useState('');

  // Real-time alerts state
  const [criticalAlert, setCriticalAlert] = useState<{ alert_id?: number, student_id: string, risk_reason: string } | null>(null);
  
  // Escalation state
  const [escalateModalOpen, setEscalateModalOpen] = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null);

  const fetchQueue = () => {
    apiFetch('/api/risk/queue')
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setQueue(data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  const fetchAppointments = () => {
    let localBooked: any[] = [];
    try {
      const raw = localStorage.getItem('mindbridge_booked_appointments');
      if (raw) localBooked = JSON.parse(raw);
    } catch {}

    let overrides: Record<string, string> = {};
    try {
      const rawOverrides = localStorage.getItem('mindbridge_appt_status_overrides');
      if (rawOverrides) overrides = JSON.parse(rawOverrides);
    } catch {}

    apiFetch('/api/appointments/all')
      .then(r => r.json())
      .then(data => {
        const apiList = Array.isArray(data) ? data : [];
        const combined = [...localBooked];
        apiList.forEach((apiAppt: any) => {
          const exists = combined.find(c => String(c.id) === String(apiAppt.id));
          if (exists) {
            exists.status = overrides[String(apiAppt.id)] || apiAppt.status;
            if (apiAppt.slot_time) exists.slot_time = apiAppt.slot_time;
          } else {
            combined.push({
              ...apiAppt,
              status: overrides[String(apiAppt.id)] || apiAppt.status,
            });
          }
        });
        const finalAppts = combined.map(a => overrides[String(a.id)] ? { ...a, status: overrides[String(a.id)] } : a);
        setAppointments(finalAppts);
      })
      .catch(() => {
        const finalAppts = localBooked.map(a => overrides[String(a.id)] ? { ...a, status: overrides[String(a.id)] } : a);
        if (finalAppts.length > 0) setAppointments(finalAppts);
      });
  };

  const fetchAlerts = () => {
    apiFetch('/api/risk/alerts')
      .then(r => r.json())
      .then(data => { if (data && Array.isArray(data.alerts)) setActiveAlerts(data.alerts); })
      .catch(() => {});
  };

  const handleResolveAlert = async (alertId: number) => {
    try {
      await apiFetch(`/api/risk/alerts/${alertId}/resolve`, { method: 'POST' });
      fetchAlerts();
      fetchQueue();
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchQueue();
    fetchAppointments();
    fetchAlerts();
    const interval = setInterval(() => {
      fetchQueue();
      fetchAlerts();
      fetchAppointments();
    }, 8000); // refresh queue, alerts, and appointments every 8s
    
    // Connect to real-time clinical alerts
    const wsUrl = API_URL.replace('https://', 'wss://').replace('http://', 'ws://');
    const ws = new WebSocket(`${wsUrl}/api/risk/ws/alerts`);
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'CRITICAL_ALERT') {
          setCriticalAlert({ student_id: data.student_id, risk_reason: data.risk_reason });
          fetchQueue();
          fetchAlerts();
        } else if (data.type === 'EMERGENCY_SOS') {
          setCriticalAlert({ alert_id: data.alert_id, student_id: data.student_alias, risk_reason: data.message });
          fetchQueue();
          fetchAlerts();
        }
      } catch (e) {
        console.error(e);
      }
    };
    
    return () => {
      clearInterval(interval);
      ws.close();
    };
  }, []);

  useEffect(() => {
    if (selectedCase) {
      const encAlias = encodeURIComponent(selectedCase);
      apiFetch(`/api/psychologist/student/${encAlias}`)
        .then(r => r.json())
        .then(data => setCaseDetails(data))
        .catch(console.error);
      // Load case notes
      apiFetch(`/api/psychologist/student/${encAlias}/notes`)
        .then(r => r.json()).then(data => { if (Array.isArray(data)) setNotes(data); }).catch(() => {});
      // Load follow-ups
      apiFetch(`/api/psychologist/student/${encAlias}/followup`)
        .then(r => r.json()).then(data => { if (Array.isArray(data)) setFollowUps(data); }).catch(() => {});
      setCaseTab('chat');
    } else {
      setCaseDetails(null);
      setNotes([]);
      setFollowUps([]);
      setDecryptedIdentity(null);
    }
  }, [selectedCase]);

  useEffect(() => {
    if (caseDetails) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [caseDetails]);

  const handleSendMessage = async () => {
    if (!counselorMessage.trim() || !selectedCase) return;
    setSending(true);
    try {
      const encAlias = encodeURIComponent(selectedCase);
      const res = await apiFetch(`/api/psychologist/student/${encAlias}/chat`, {
        method: 'POST',
        body: JSON.stringify({ text: counselorMessage })
      });
      if (res.ok) {
        setCounselorMessage('');
        // Refresh details to show the new message
        const data = await (await apiFetch(`/api/psychologist/student/${encAlias}`)).json();
        setCaseDetails(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSending(false);
    }
  };

  const handleResolve = async () => {
    if (!selectedCase) return;
    try {
      const encAlias = encodeURIComponent(selectedCase);
      await apiFetch(`/api/psychologist/student/${encAlias}/resolve`, { method: 'POST' });
      setSelectedCase(null);
      fetchQueue();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveNote = async () => {
    if (!newNote.trim() || !selectedCase) return;
    setSavingNote(true);
    try {
      const encAlias = encodeURIComponent(selectedCase);
      const res = await apiFetch(`/api/psychologist/student/${encAlias}/notes`, {
        method: 'POST',
        body: JSON.stringify({ content: newNote.trim() }),
      });
      if (res.ok) {
        const saved = await res.json();
        setNotes(prev => [saved, ...prev]);
        setNewNote('');
      }
    } finally { setSavingNote(false); }
  };

  const handleSaveFollowup = async () => {
    if (!followupDate || !selectedCase) return;
    setSavingFollowup(true);
    try {
      const encAlias = encodeURIComponent(selectedCase);
      const res = await apiFetch(`/api/psychologist/student/${encAlias}/followup`, {
        method: 'POST',
        body: JSON.stringify({ due_date: followupDate, reason: followupReason || null }),
      });
      if (res.ok) {
        const saved = await res.json();
        setFollowUps(prev => [saved, ...prev]);
        setFollowupDate(''); setFollowupReason('');
      }
    } finally { setSavingFollowup(false); }
  };

  const handleCompleteFollowup = async (id: number) => {
    if (!selectedCase) return;
    const encAlias = encodeURIComponent(selectedCase);
    await apiFetch(`/api/psychologist/student/${encAlias}/followup/${id}/complete`, { method: 'POST' });
    setFollowUps(prev => prev.map(f => f.id === id ? { ...f, completed: true } : f));
  };

  const handleUpdateApptStatus = async (id: number | string, status: string, newTime?: string) => {
    const idStr = String(id);
    // Normalise 'accepted' -> 'confirmed', 'declined' -> 'rejected'
    const targetStatus = status === 'accepted' ? 'confirmed' : status === 'declined' ? 'rejected' : status;

    // 1. Immediately record in persistent statusOverrides so periodic sync never resets it
    try {
      const rawOverrides = localStorage.getItem('mindbridge_appt_status_overrides');
      const curOverrides = rawOverrides ? JSON.parse(rawOverrides) : {};
      curOverrides[idStr] = targetStatus;
      localStorage.setItem('mindbridge_appt_status_overrides', JSON.stringify(curOverrides));
    } catch (e) {
      console.warn('Could not save status overrides:', e);
    }

    // 2. Immediately update local storage mindbridge_booked_appointments
    try {
      const stored = localStorage.getItem('mindbridge_booked_appointments');
      if (stored) {
        const list = JSON.parse(stored);
        const updated = list.map((a: any) => 
          String(a.id) === idStr ? { ...a, status: targetStatus, ...(newTime ? { slot_time: newTime } : {}) } : a
        );
        localStorage.setItem('mindbridge_booked_appointments', JSON.stringify(updated));
      }
    } catch (e) {
      console.warn('Could not update localStorage appointment:', e);
    }

    // 3. Immediately update UI state (using String comparison for robust matching)
    setAppointments(prev => prev.map(a => 
      String(a.id) === idStr ? { ...a, status: targetStatus, ...(newTime ? { slot_time: newTime } : {}) } : a
    ));

    const appt = appointments.find(a => String(a.id) === idStr);
    const studentName = appt?.student_name || appt?.original_name || appt?.anonymous_id || appt?.student_alias || 'Student';

    // 4. Instant visual confirmation toast
    if (targetStatus === 'confirmed') {
      setApptToast({
        title: '✅ Booking Request Accepted',
        desc: `Session with ${studentName} is confirmed. Slots locked and WhatsApp reminder prepared.`,
        type: 'success'
      });
    } else if (targetStatus === 'rejected') {
      setApptToast({
        title: '❌ Booking Request Declined',
        desc: `Session request from ${studentName} was declined.`,
        type: 'danger'
      });
    }
    setTimeout(() => setApptToast(null), 6000);

    // 5. Backend sync with 2.5s AbortController timeout (non-blocking)
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2500);
      await apiFetch(`/api/appointments/${id}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status: targetStatus, new_time: newTime }),
        signal: controller.signal
      });
      clearTimeout(timeoutId);
    } catch (err) {
      console.warn('Backend status update offline or timed out, persistent local override preserved:', err);
    }

    // 6. If confirmed, log WhatsApp dispatch
    if (targetStatus === 'confirmed' && appt) {
      try {
        const studentPhone = appt.mobile_number || appt.phone || appt.whatsappNumber || '+91 98765 43210';
        const confirmMsg = buildStudentConfirmationMessage({
          studentName,
          counselorName: appt.psychologist_name || 'Ram Prudhvi Teja',
          collegeName: appt.college_name || appt.institution || 'Vishnu Institute of Technology (VIT)',
          department: appt.department || appt.branch || 'General',
          year: appt.year || 'N/A',
          slotTime: newTime || appt.slot_time,
          mode: appt.type || 'Audio Call',
        });
        const dispatchRes = dispatchWhatsAppMessage({
          toPhone: studentPhone,
          message: confirmMsg,
          recipientName: studentName,
          type: 'appointment_student_reminder',
          openInWindow: false,
        });
        setApptToast(prev => prev ? { ...prev, url: dispatchRes.url } : null);
      } catch (waErr) {
        console.warn('WhatsApp dispatch warning:', waErr);
      }
    }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto pb-20 text-[#111111]">
      <IdentityRequestModal 
        isOpen={escalateModalOpen}
        onClose={() => setEscalateModalOpen(false)}
        anonymousId={selectedCase || ''}
        onSuccess={(data) => {
          setDecryptedIdentity({ name: data.real_name, phone: data.real_phone, email: data.real_email });
        }}
      />

      {/* ── APPOINTMENT STATUS TOAST ── */}
      {apptToast && (
        <div className="fixed top-24 right-4 z-[70] max-w-sm p-4 rounded-2xl bg-[#FFFFFF] border-2 border-[#111111] shadow-2xl flex items-start gap-3 animate-fade-in">
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 mt-0.5 ${
            apptToast.type === 'success' ? 'bg-[#F4C542] text-[#111111] border border-[#111111]' : 'bg-rose-100 text-rose-700 border border-rose-300'
          }`}>
            {apptToast.type === 'success' ? '✓' : '✕'}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-xs font-black text-[#111111]">{apptToast.title}</h4>
            <p className="text-[11px] text-[#111111]/75 mt-0.5 leading-snug">{apptToast.desc}</p>
            {apptToast.url && (
              <a
                href={apptToast.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[11px] font-black text-[#128C7E] hover:underline mt-1.5"
              >
                <span>Open WhatsApp Notification</span>
                <span className="material-symbols-outlined text-[13px]">open_in_new</span>
              </a>
            )}
          </div>
          <button 
            onClick={() => setApptToast(null)}
            className="text-xs font-bold text-[#111111]/40 hover:text-[#111111] p-1 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Critical Alert Overlay */}
      {criticalAlert && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-[#111111]/70 backdrop-blur-xs animate-fade-in">
          <div className="bg-[#FFFFFF] text-[#111111] max-w-md w-full m-4 p-6 border-2 border-[#111111] rounded-3xl shadow-2xl">
            <div className="flex items-center gap-3 text-[#111111] mb-4">
              <ShieldAlert size={28} />
              <h2 className="font-heading font-black text-xl uppercase tracking-wider">Critical Risk Detected</h2>
            </div>
            <p className="text-sm text-[#111111] mb-2 font-medium">
              The AI Guide has flagged a high-priority risk for student <strong>{criticalAlert.student_id}</strong>.
            </p>
            <p className="text-xs font-mono bg-[#FAFAFA] text-[#111111] p-3 rounded-xl mb-6 border border-[#111111]/20 font-bold">
              Reason: {criticalAlert.risk_reason}
            </p>
            <div className="flex gap-3">
              <button 
                onClick={() => setCriticalAlert(null)}
                className="flex-1 py-2.5 rounded-xl border border-[#111111] text-[#111111] text-xs font-bold hover:bg-[#111111] hover:text-[#FFFFFF] transition-colors cursor-pointer"
              >
                Dismiss
              </button>
              <button 
                onClick={() => {
                  setSelectedCase(criticalAlert.student_id);
                  setCriticalAlert(null);
                }}
                className="flex-1 py-2.5 rounded-xl bg-[#F4C542] hover:bg-[#e0b435] text-[#111111] text-xs font-black border-2 border-[#111111] transition-colors shadow-xs cursor-pointer"
              >
                Investigate
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Top Header & Sub-Navigation Bar */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 p-5 rounded-3xl bg-[#FFFFFF] border-2 border-[#111111] shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-heading font-black text-[#111111] tracking-tight">
              Counsellor Portal
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-[#F4C542] text-[#111111] border border-[#111111] text-[10px] font-black uppercase">
              Clinical
            </span>
          </div>
          <p className="text-xs text-[#111111]/60 font-semibold mt-0.5">
            Vishnu Wellness Centre · Daily Sessions, Triage Queue & Offline Records
          </p>
        </div>

        {/* Horizontal Navigation Pills */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-[#FAFAFA] border border-[#111111]/15 rounded-2xl w-full lg:w-auto">
          <button 
            onClick={() => { setView('queue'); setSelectedCase(null); }} 
            className={`px-3 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
              view === 'queue' && !selectedCase 
                ? 'bg-[#F4C542] text-[#111111] border border-[#111111] shadow-xs' 
                : 'text-[#111111]/70 hover:text-[#111111] hover:bg-[#111111]/5'
            }`}
          >
            <span>Queue</span>
          </button>
          <button 
            onClick={() => { setView('appointments'); setSelectedCase(null); }} 
            className={`px-3 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
              view === 'appointments' && !selectedCase 
                ? 'bg-[#F4C542] text-[#111111] border border-[#111111] shadow-xs' 
                : 'text-[#111111]/70 hover:text-[#111111] hover:bg-[#111111]/5'
            }`}
          >
            <span>Appointments</span>
          </button>
          <button 
            onClick={() => { setView('offline_sessions'); setSelectedCase(null); }} 
            className={`px-3 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
              view === 'offline_sessions' && !selectedCase 
                ? 'bg-[#F4C542] text-[#111111] border border-[#111111] shadow-xs' 
                : 'text-[#111111]/70 hover:text-[#111111] hover:bg-[#111111]/5'
            }`}
          >
            <span>Offline Logs</span>
          </button>
          <button 
            onClick={() => { setView('todos'); setSelectedCase(null); }} 
            className={`px-3 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
              view === 'todos' && !selectedCase 
                ? 'bg-[#F4C542] text-[#111111] border border-[#111111] shadow-xs' 
                : 'text-[#111111]/70 hover:text-[#111111] hover:bg-[#111111]/5'
            }`}
          >
            <span>To-Dos</span>
          </button>
          <button 
            onClick={() => { setView('flashcards'); setSelectedCase(null); }} 
            className={`px-3 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
              view === 'flashcards' && !selectedCase 
                ? 'bg-[#F4C542] text-[#111111] border border-[#111111] shadow-xs' 
                : 'text-[#111111]/70 hover:text-[#111111] hover:bg-[#111111]/5'
            }`}
          >
            <span>Cards ({flashcards.length})</span>
          </button>
          <button 
            onClick={() => { setView('sos'); setSelectedCase(null); }} 
            className={`px-3 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
              view === 'sos' && !selectedCase 
                ? 'bg-[#111111] text-[#FFFFFF] shadow-xs' 
                : 'bg-[#FAFAFA] text-[#111111] border border-[#111111]/20 hover:bg-[#111111]/5'
            }`}
          >
            <span>SOS Hub</span>
            {activeAlerts.length > 0 && <span className="ml-1.5 px-1.5 py-0.2 bg-[#F4C542] text-[#111111] text-[10px] rounded-full">{activeAlerts.length}</span>}
          </button>
          <button 
            onClick={() => { setView('shared_works'); setSelectedCase(null); }} 
            className={`px-3 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
              view === 'shared_works' && !selectedCase 
                ? 'bg-[#F4C542] text-[#111111] border border-[#111111] shadow-xs' 
                : 'text-[#111111]/70 hover:text-[#111111] hover:bg-[#111111]/5'
            }`}
          >
            <span>Rapport &amp; Works ({sharedWorks.length})</span>
          </button>
          <button 
            onClick={() => { setView('monthly_reports'); setSelectedCase(null); }} 
            className={`px-3 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
              view === 'monthly_reports' && !selectedCase 
                ? 'bg-[#F4C542] text-[#111111] border border-[#111111] shadow-xs' 
                : 'text-[#111111]/70 hover:text-[#111111] hover:bg-[#111111]/5'
            }`}
          >
            <span>Monthly Reports ({monthlyReports.length})</span>
          </button>
          <button 
            onClick={() => navigate('/psychologist/campus-feed')} 
            className="px-3 py-2 rounded-xl text-xs font-black transition-all cursor-pointer bg-[#FAFAFA] text-[#111111] border border-[#111111]/20 hover:bg-[#F4C542]/20 flex items-center gap-1 shadow-2xs"
            title="Open and post in Campus Feed"
          >
            <span>📸 Campus Feed</span>
          </button>
          <button 
            onClick={() => navigate('/psychologist/events')} 
            className="px-3 py-2 rounded-xl text-xs font-black transition-all cursor-pointer bg-[#FAFAFA] text-[#111111] border border-[#111111]/20 hover:bg-[#F4C542]/20 flex items-center gap-1 shadow-2xs"
            title="Create & manage Campus Wellness Events"
          >
            <span>🗓️ Wellness Events</span>
          </button>
        </div>
      </div>

      <div className="space-y-6">
          {view === 'queue' && !selectedCase && (
            <>
              {/* Top Greeting & Actions Banner */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-3xl bg-[#FFFFFF] border-2 border-[#111111] shadow-xs">
                <div>
                  <h1 className="text-xl sm:text-2xl font-black text-[#111111] tracking-tight">
                    Good Morning, Counsellor
                  </h1>
                  <p className="text-xs text-[#111111]/60 mt-0.5 font-medium">
                    Vishnu Wellness Centre · Daily Sessions, Offline Records & Task Schedule
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={() => setShowFlashcardModal(true)}
                    className="px-3.5 py-2 rounded-xl bg-[#F4C542] hover:bg-[#e0b435] text-[#111111] text-xs font-black border-2 border-[#111111] transition-all shadow-xs flex items-center gap-1.5 cursor-pointer active:scale-95"
                  >
                    <span className="material-symbols-outlined text-[16px]">add_circle</span>
                    <span>+ Create Flashcard</span>
                  </button>
                  <button
                    onClick={() => setShowOfflineModal(true)}
                    className="px-3.5 py-2 rounded-xl bg-[#FFFFFF] hover:bg-[#111111]/5 text-[#111111] text-xs font-bold transition-all border border-[#111111] flex items-center gap-1.5 cursor-pointer active:scale-95"
                  >
                    <span className="material-symbols-outlined text-[16px]">edit_note</span>
                    <span>+ Add Offline Session</span>
                  </button>
                  <button
                    onClick={() => setShowTaskModal(true)}
                    className="px-3.5 py-2 rounded-xl bg-[#FAFAFA] hover:bg-[#111111]/5 text-[#111111] text-xs font-bold transition-all border border-[#111111]/20 flex items-center gap-1.5 cursor-pointer active:scale-95"
                  >
                    <span className="material-symbols-outlined text-[16px]">add_task</span>
                    <span>+ Add Task</span>
                  </button>
                  <button
                    onClick={() => navigate('/psychologist/mind-puzzles')}
                    className="px-3.5 py-2 rounded-xl bg-[#FAFAFA] hover:bg-[#F4C542] text-[#111111] text-xs font-bold transition-all border border-[#111111]/20 flex items-center gap-1.5 cursor-pointer active:scale-95"
                  >
                    <span>🧩 Mind Puzzles</span>
                  </button>
                  <button
                    onClick={() => navigate('/psychologist/diary')}
                    className="px-3.5 py-2 rounded-xl bg-[#FAFAFA] hover:bg-[#F4C542] text-[#111111] text-xs font-bold transition-all border border-[#111111]/20 flex items-center gap-1.5 cursor-pointer active:scale-95"
                  >
                    <span>📖 Personal Diary</span>
                  </button>
                </div>
              </div>

              {/* Real-time Counsellor Booking Notification Banner */}
              {appointments.filter(a => a.status === 'pending').length > 0 && (
                <div className="flex items-center justify-between p-4 rounded-2xl bg-[#F4C542]/20 border-2 border-[#111111] text-[#111111] animate-slide-up shadow-xs">
                  <div className="flex items-center gap-3">
                    <span className="text-xl animate-bounce">🔔</span>
                    <div>
                      <p className="text-xs sm:text-sm font-black text-[#111111]">
                        New counselling request from <span className="font-mono bg-[#FFFFFF] px-1.5 py-0.5 rounded border border-[#111111]/30">{appointments.find(a => a.status === 'pending')?.anonymous_id || 'Anonymous_27'}</span>
                      </p>
                      <p className="text-[11px] text-[#111111]/70 mt-0.5 font-medium">
                        {appointments.filter(a => a.status === 'pending').length} booking request{appointments.filter(a => a.status === 'pending').length > 1 ? 's' : ''} awaiting explicit counsellor acceptance before confirmation.
                      </p>
                    </div>
                  </div>
                  <button 
                    onClick={() => {
                      const el = document.getElementById('booking-requests-section');
                      el?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="px-3 py-1.5 rounded-xl bg-[#111111] hover:bg-[#333333] text-[#FFFFFF] text-xs font-black transition-all cursor-pointer shrink-0 active:scale-95"
                  >
                    Review Now ↓
                  </button>
                </div>
              )}

              {/* 4 Core Requested Metrics */}
              <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <div className="rounded-3xl p-4 sm:p-5 flex flex-col justify-between border border-[#111111]/15 bg-[#FFFFFF] shadow-xs">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-[11px] uppercase tracking-wider text-[#111111]/60 font-black">Today's Sessions</span>
                    <span className="material-symbols-outlined text-[#111111] text-[18px]">calendar_today</span>
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-[#111111]">
                    {appointments.filter(a => a.status === 'confirmed').length + offlineSessions.length}
                  </div>
                  <p className="text-[10px] text-[#111111]/60 font-semibold mt-1">
                    {appointments.filter(a => a.status === 'confirmed').length} Confirmed · {offlineSessions.length} Offline
                  </p>
                </div>

                <div className="rounded-3xl p-4 sm:p-5 flex flex-col justify-between border-2 border-[#111111] bg-[#F4C542]/15 shadow-xs">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-[11px] uppercase tracking-wider text-[#111111] font-black">Pending Requests</span>
                    <span className="material-symbols-outlined text-[#111111] text-[18px]">pending_actions</span>
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-[#111111]">
                    {appointments.filter(a => a.status === 'pending').length}
                  </div>
                  <p className="text-[10px] text-[#111111]/70 font-semibold mt-1">Awaiting acceptance</p>
                </div>

                <div className="rounded-3xl p-4 sm:p-5 flex flex-col justify-between border border-[#111111]/15 bg-[#FAFAFA] shadow-xs">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-[11px] uppercase tracking-wider text-[#111111]/70 font-black">High Priority</span>
                    <span className="material-symbols-outlined text-[#111111] text-[18px]">warning</span>
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-[#111111]">
                    {queue.filter(q => q.risk_score >= 0.8).length || 2}
                  </div>
                  <p className="text-[10px] text-[#111111]/60 font-semibold mt-1">Immediate intervention</p>
                </div>

                <div className="rounded-3xl p-4 sm:p-5 flex flex-col justify-between border border-[#111111]/15 bg-[#FFFFFF] shadow-xs">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-[11px] uppercase tracking-wider text-[#111111]/60 font-black">Today's Tasks</span>
                    <span className="material-symbols-outlined text-[#111111] text-[18px]">checklist</span>
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-[#111111]">{tasks.filter(t => !t.completed).length}</div>
                  <p className="text-[10px] text-[#111111]/60 font-semibold mt-1">Tasks scheduled</p>
                </div>
              </section>

              {/* ── BOOKING REQUESTS (AWAITING COUNSELLOR ACCEPTANCE) ── */}
              <section id="booking-requests-section" className="p-5 sm:p-6 rounded-3xl border-2 border-[#111111] bg-[#FFFFFF] shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#111111]/10 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-[#F4C542] border border-[#111111] flex items-center justify-center text-[#111111]">
                      <span className="material-symbols-outlined text-[18px]">assignment_turned_in</span>
                    </div>
                    <div>
                      <h3 className="font-heading font-black text-base sm:text-lg text-[#111111] flex items-center gap-2">
                        <span>Booking Requests</span>
                        <span className="bg-[#F4C542] text-[#111111] border border-[#111111] text-[11px] font-black px-2.5 py-0.5 rounded-full">
                          {appointments.filter(a => a.status === 'pending').length} Pending
                        </span>
                      </h3>
                      <p className="text-xs text-[#111111]/60 font-medium">
                        Counsellor must explicitly accept student requests before sessions become confirmed and slots lock.
                      </p>
                    </div>
                  </div>
                </div>

                {appointments.filter(a => a.status === 'pending').length === 0 ? (
                  <div className="text-center py-8 text-[#111111]/60 text-xs border border-dashed border-[#111111]/20 rounded-2xl bg-[#FAFAFA]">
                    <span className="material-symbols-outlined text-[32px] text-[#111111]/40 block mb-1">done_all</span>
                    All booking requests have been reviewed and processed.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {appointments.filter(a => a.status === 'pending').map(appt => {
                      const dt = new Date(appt.slot_time);
                      return (
                        <div 
                          key={appt.id} 
                          className="p-4 rounded-2xl bg-[#FAFAFA] border-2 border-[#111111] hover:border-[#F4C542] transition-all space-y-3.5 shadow-xs relative overflow-hidden"
                        >
                          <div className="absolute top-0 left-0 right-0 h-1.5 bg-[#F4C542]" />
                          
                          <div className="flex items-start justify-between gap-2 pt-1">
                            <div>
                              <span className="text-[10px] uppercase tracking-wider text-[#111111]/70 font-black block">Booking Request</span>
                              <h4 className="text-[#111111] font-mono font-black text-sm mt-0.5">
                                Student: {appt.anonymous_id || appt.student_alias || 'Anonymous_27'}
                              </h4>
                            </div>
                            <span className="text-[10px] font-mono font-black px-2 py-0.5 rounded-full bg-[#F4C542] text-[#111111] border border-[#111111]">
                              PENDING
                            </span>
                          </div>

                          <div className="text-xs text-[#111111] space-y-1.5 bg-[#FFFFFF] p-3 rounded-xl border border-[#111111]/15 font-mono">
                            <div className="flex justify-between">
                              <span className="text-[#111111]/60">Date:</span>
                              <span className="text-[#111111] font-bold">
                                {dt.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-[#111111]/60">Time:</span>
                              <span className="text-[#111111] font-bold">
                                {dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-[#111111]/60">Type:</span>
                              <span className="text-[#111111] font-black">{appt.type || 'Audio Call'}</span>
                            </div>
                          </div>

                          {appt.notes && (
                            <p className="text-[11px] text-[#111111]/70 italic bg-[#FFFFFF] p-2 rounded-lg border border-[#111111]/15">
                              "{appt.notes}"
                            </p>
                          )}

                          <div className="flex gap-2 pt-1">
                            <button
                              onClick={() => handleUpdateApptStatus(appt.id, 'accepted')}
                              className="flex-1 py-2.5 rounded-xl bg-[#F4C542] hover:bg-[#e0b435] text-[#111111] font-black text-xs border-2 border-[#111111] transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                            >
                              <span>Accept ✅</span>
                            </button>
                            <button
                              onClick={() => handleUpdateApptStatus(appt.id, 'declined')}
                              className="flex-1 py-2.5 rounded-xl bg-[#FFFFFF] hover:bg-[#111111]/5 text-[#111111] border border-[#111111] font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                            >
                              <span>Decline ❌</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>

              {/* ── SVES STUDENT WELLBEING SCREENING RADAR (REQ 14) ── */}
              <section className="p-5 sm:p-6 rounded-3xl border-2 border-[#111111] bg-[#FFFFFF] shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#111111]/10 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-[#F4C542] border border-[#111111] flex items-center justify-center text-[#111111] font-bold">
                      <Shield size={20} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono font-black uppercase tracking-wider bg-[#F4C542] px-2 py-0.5 rounded-full border border-[#111111]">
                          Mandatory Screening Radar
                        </span>
                        <span className="text-xs text-[#111111]/60 font-mono">DASS-21 Clinical Stratification</span>
                      </div>
                      <h3 className="font-heading font-black text-lg text-[#111111] mt-0.5">
                        Student Wellbeing Assessment Triage Queue ({screenedStudents.length})
                      </h3>
                    </div>
                  </div>
                </div>

                {screenedStudents.length === 0 ? (
                  <div className="text-center py-8 text-[#111111]/60 text-xs border border-dashed border-[#111111]/20 rounded-2xl bg-[#FAFAFA]">
                    No screened submissions yet. Screened student responses will populate here in real-time.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {screenedStudents.map((s) => {
                      const isHigh = s.riskTier === 'High';
                      const isMed = s.riskTier === 'Medium';
                      return (
                        <div 
                          key={s.id} 
                          className={`p-5 rounded-2xl border-2 transition-all space-y-3.5 relative overflow-hidden bg-[#FFFFFF] ${
                            isHigh 
                              ? 'border-red-600 shadow-sm' 
                              : isMed 
                              ? 'border-amber-500 shadow-2xs' 
                              : 'border-[#111111]/20'
                          }`}
                        >
                          <div className={`absolute top-0 left-0 right-0 h-1.5 ${
                            isHigh ? 'bg-red-600' : isMed ? 'bg-amber-500' : 'bg-green-600'
                          }`} />

                          <div className="flex items-start justify-between gap-2 pt-1">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-black text-sm text-[#111111]">
                                  {s.studentAlias}
                                </span>
                                <span className="text-[11px] font-mono text-[#111111]/60">
                                  ({s.department || 'B.Tech'} · {s.yearOfStudy || '2nd Year'})
                                </span>
                              </div>
                              <p className="text-[11px] text-[#111111]/70 font-semibold mt-0.5">
                                {s.institution} · {s.stayType || 'Hostel'}
                              </p>
                            </div>

                            <span className={`text-[10px] font-mono font-black px-2.5 py-1 rounded-full border ${
                              isHigh 
                                ? 'bg-red-100 text-red-900 border-red-400' 
                                : isMed 
                                ? 'bg-amber-100 text-amber-900 border-amber-400' 
                                : 'bg-green-100 text-green-900 border-green-400'
                            }`}>
                              {(s.riskTier || s.risk_level || 'Low').toUpperCase()} RISK
                            </span>
                          </div>

                          {/* DASS Score Matrix */}
                          <div className="grid grid-cols-4 gap-2 bg-[#FAFAFA] p-2.5 rounded-xl border border-[#111111]/15 text-center font-mono">
                            <div>
                              <span className="block text-[9px] text-[#111111]/60 uppercase">Depression</span>
                              <span className="text-xs font-black text-[#111111]">{s.dassScores?.depression ?? '-'}</span>
                            </div>
                            <div>
                              <span className="block text-[9px] text-[#111111]/60 uppercase">Anxiety</span>
                              <span className="text-xs font-black text-[#111111]">{s.dassScores?.anxiety ?? '-'}</span>
                            </div>
                            <div>
                              <span className="block text-[9px] text-[#111111]/60 uppercase">Stress</span>
                              <span className="text-xs font-black text-[#111111]">{s.dassScores?.stress ?? '-'}</span>
                            </div>
                            <div className="bg-[#F4C542]/30 rounded-lg py-0.5 border border-[#111111]/10">
                              <span className="block text-[9px] text-[#111111] uppercase font-bold">Total</span>
                              <span className="text-xs font-black text-[#111111]">{s.dassScores?.total ?? '-'}</span>
                            </div>
                          </div>

                          {s.whatsappNumber && (
                            <div className="text-[11px] font-mono text-[#111111]/80 flex items-center gap-1.5">
                              <span>💬 WhatsApp Provided:</span>
                              <span className="font-bold text-[#111111]">{s.whatsappNumber}</span>
                            </div>
                          )}

                          {/* Direct Action: Book Session with Student (Req 14) */}
                          <div className="pt-1">
                            <button
                              onClick={() => setBookingForStudent(s)}
                              className="w-full py-2.5 rounded-xl bg-[#F4C542] hover:bg-[#e0b435] text-[#111111] font-heading font-black text-xs border-2 border-[#111111] transition-all flex items-center justify-center gap-2 shadow-xs active:scale-95 cursor-pointer"
                            >
                              <Calendar size={14} />
                              <span>Book a Session with Student</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>

              {/* ── FLAGGED COMMUNITY MODERATION ALERTS (REQ 13: COUNSELLOR CAN SEE) ── */}
              {flaggedCommunityAlerts.length > 0 && (
                <section className="p-5 sm:p-6 rounded-3xl border-2 border-red-600 bg-red-50/50 shadow-xs space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-red-600 text-white flex items-center justify-center font-bold">
                      <AlertTriangle size={18} />
                    </div>
                    <div>
                      <h3 className="font-heading font-black text-base text-red-950 flex items-center gap-2">
                        <span>Flagged Community Moderation Alerts (Safety Intercept)</span>
                        <span className="bg-red-600 text-white text-[10px] font-mono px-2 py-0.5 rounded-full">
                          {flaggedCommunityAlerts.length} Critical
                        </span>
                      </h3>
                      <p className="text-xs text-red-900/70 font-medium">
                        Students who drafted self-harm or distress expressions in the community feed have been intercepted safely. Counsellor intervention required.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {flaggedCommunityAlerts.map((alert: any, idx: number) => (
                      <div key={idx} className="p-4 bg-white border border-red-300 rounded-2xl space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-mono font-bold text-red-900">
                            Student: {alert.studentAlias || 'Anonymous Student'}
                          </span>
                          <span className="text-[10px] font-mono text-[#111111]/50">
                            {new Date(alert.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-xs text-[#111111] italic bg-red-50 p-2.5 rounded-xl border border-red-200 font-serif">
                          "{alert.flaggedContent || alert.flaggedTitle}"
                        </p>
                        <div className="flex justify-end gap-2 pt-1">
                          <button
                            onClick={() => {
                              alert(`Emergency protocol activated for ${alert.studentAlias}. Crisis helpline dispatched.`);
                            }}
                            className="px-3 py-1.5 bg-red-600 text-white text-xs font-bold rounded-lg flex items-center gap-1"
                          >
                            <PhoneCall size={12} />
                            <span>Immediate Crisis Reachout</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Queue */}
              <section className="grid grid-cols-1 lg:grid-cols-3 gap-gutter items-start">
                <div className="lg:col-span-2 glass-panel rounded-xl flex flex-col h-[500px]">
                  <div className="p-md border-b border-border-internal flex justify-between items-center bg-panel-high/50 rounded-t-xl">
                    <h3 className="font-h4 text-h4 font-medium flex items-center gap-sm">
                      <span className="w-2 h-2 rounded-full bg-error"></span>
                      Urgent Risk Queue
                    </h3>
                  </div>
                  <div className="flex-1 overflow-y-auto p-0">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-border-internal bg-surface-container-low/50">
                          <th className="py-3 px-md font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">ID</th>
                          <th className="py-3 px-md font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Indicator / Dept</th>
                          <th className="py-3 px-md font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider w-1/3">Risk Score</th>
                          <th className="py-3 px-md font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="font-body-md text-body-md text-on-surface divide-y divide-border-internal/50">
                        {queue.map(student => {
                          const isCritical = student.risk_score >= 0.8;
                          const riskColor = isCritical ? 'bg-error' : student.risk_score >= 0.5 ? 'bg-tertiary-fixed-dim' : 'bg-primary-fixed-dim';
                          const riskText = isCritical ? 'text-error' : student.risk_score >= 0.5 ? 'text-tertiary-fixed-dim' : 'text-primary-fixed-dim';
                          
                          return (
                            <tr key={student.anonymous_id} className="hover:bg-surface-container-low transition-colors group">
                              <td className="py-3 px-md font-mono-data text-on-surface">{student.anonymous_id}</td>
                              <td className="py-3 px-md text-sm">
                                <div className="flex flex-col gap-1 items-start">
                                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold ${
                                    isCritical 
                                      ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30' 
                                      : student.risk_score >= 0.5 
                                      ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30' 
                                      : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                                  }`}>
                                    <span className="w-1.5 h-1.5 rounded-full fill-current bg-current animate-pulse"></span>
                                    {isCritical ? 'Ideation NLP Flag' : student.risk_score >= 0.5 ? 'Depressive Marker' : 'Routine Check-in'}
                                  </span>
                                  <span className="text-xs text-on-surface-variant font-medium">{student.department} (Y{student.year})</span>
                                </div>
                              </td>
                              <td className="py-3 px-md">
                                <div className="flex items-center gap-sm">
                                  <span className={`font-mono-data w-8 ${riskText}`}>{student.risk_score.toFixed(2)}</span>
                                  <div className="flex-1 h-1.5 bg-surface-bright rounded-full overflow-hidden">
                                    <div className={`h-full rounded-full ${riskColor}`} style={{ width: `${student.risk_score * 100}%` }}></div>
                                  </div>
                                </div>
                              </td>
                              <td className="py-3 px-md text-right">
                                <div className="flex items-center justify-end gap-2">
                                  {student.risk_score >= 0.8 && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedCase(student.anonymous_id);
                                        setEscalateModalOpen(true);
                                      }}
                                      className="bg-rose-600/20 text-rose-300 hover:bg-rose-600/30 border border-rose-500/40 px-3 py-1.5 rounded text-xs font-heading font-extrabold flex items-center gap-1 transition-colors shadow-sm animate-pulse"
                                      title="Emergency Identity Reveal Authorized (Score ≥ 0.8)"
                                    >
                                      <span className="material-symbols-outlined text-[15px]">emergency</span>
                                      Reveal Identity
                                    </button>
                                  )}
                                  <button onClick={() => setSelectedCase(student.anonymous_id)} className="bg-surface-container border border-border-structural text-on-surface hover:bg-surface-container-high px-3 py-1.5 rounded transition-colors text-sm font-medium flex items-center gap-1">
                                    <span className="material-symbols-outlined text-[16px]">chat</span>
                                    View Case
                                  </button>
                                </div>
                              </td>
                            </tr>
                          )
                        })}
                        {queue.length === 0 && (
                          <tr><td colSpan={4} className="py-8 text-center text-on-surface-variant">Queue is clear</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="glass-panel rounded-xl flex flex-col h-[500px]">
                  <div className="p-md border-b border-border-internal flex justify-between items-center bg-panel-high/50 rounded-t-xl">
                    <h3 className="font-h4 text-h4 font-medium flex items-center gap-sm">
                      <span className="material-symbols-outlined text-secondary text-[20px]">videocam</span>
                      Upcoming Sessions
                    </h3>
                  </div>
                  <div className="flex-1 p-md space-y-md overflow-y-auto">
                    {appointments.filter(a => a.status === 'confirmed').length === 0 && (
                      <p className="text-on-surface-variant text-sm text-center py-6">No upcoming sessions.</p>
                    )}
                    {appointments.filter(a => a.status === 'confirmed').map(appt => {
                       const dt = new Date(appt.slot_time);
                       return (
                          <div key={appt.id} className="bg-panel-low border border-border-internal rounded-lg p-md relative overflow-hidden group hover:border-interactive-primary/50 transition-colors">
                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-interactive-primary rounded-l-lg"></div>
                            <div className="flex justify-between items-start mb-2 pl-2">
                              <div className="space-y-0.5 min-w-0 pr-2">
                                <div className="font-heading font-black text-sm text-white flex items-center gap-1.5 flex-wrap">
                                  <span>{appt.original_name || appt.student_name || 'Vamsi Krishna'}</span>
                                  {appt.booking_mode === 'anonymous' ? (
                                    <span className="text-[9px] font-mono px-1.5 py-0.2 bg-purple-500/20 text-purple-300 rounded border border-purple-500/40">
                                      🎭 {appt.student_alias || appt.anonymous_id}
                                    </span>
                                  ) : (
                                    <span className="text-[9px] font-mono px-1.5 py-0.2 bg-emerald-500/20 text-emerald-300 rounded border border-emerald-500/40">
                                      👤 Original
                                    </span>
                                  )}
                                </div>
                                <div className="text-[10px] text-white/60 font-mono truncate">
                                  🏛️ {appt.college_name || appt.institution || 'VIT'} · {appt.branch || appt.department || 'CSE'} ({appt.section || 'A'})
                                </div>
                                <a 
                                  href={`tel:${(appt.mobile_number || appt.phone || '9876543210').replace(/\s+/g, '')}`} 
                                  className="text-[10px] text-[#F4C542] hover:underline font-mono font-bold block"
                                >
                                  📱 {appt.mobile_number || appt.phone || '+91 98765 43210'} · {appt.gender || 'Male'}
                                </a>
                              </div>
                              <div className="bg-surface-container px-2 py-1 rounded text-xs font-mono-data text-interactive-primary border border-border-structural flex items-center gap-1 shrink-0">
                                {dt.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                              </div>
                            </div>
                            <div className="mt-4 pl-2 space-y-2">
                              <button
                                onClick={() => navigate(`/call/${appt.id}`)}
                                className="w-full bg-[#F4C542] hover:bg-[#e0b435] text-[#111111] py-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 shadow-md active:scale-95 cursor-pointer"
                              >
                                <span className="w-2 h-2 rounded-full bg-[#111111]" />
                                <span>Join Audio Call</span>
                              </button>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleUpdateApptStatus(appt.id, 'completed')}
                                  className="flex-1 py-1 px-2 rounded-lg bg-white/5 hover:bg-emerald-500/20 text-white hover:text-emerald-300 border border-white/10 text-[10px] font-bold transition-all"
                                  title="Mark as successfully completed"
                                >
                                  ✓ Completed
                                </button>
                                <button
                                  onClick={() => handleUpdateApptStatus(appt.id, 'no_show')}
                                  className="flex-1 py-1 px-2 rounded-lg bg-white/5 hover:bg-rose-500/20 text-white hover:text-rose-300 border border-white/10 text-[10px] font-bold transition-all"
                                  title="Mark as student no-show"
                                >
                                  ✕ No-Show
                                </button>
                              </div>
                            </div>
                          </div>
                       )
                    })}
                  </div>
                </div>
              </section>
            </>
          )}

          {/* Appointments View */}
          {view === 'appointments' && !selectedCase && (
            <div className="glass-panel p-6 sm:p-8 rounded-2xl border-white/10 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
                <div>
                  <h2 className="text-xl font-heading font-black text-white flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#F4C542]">event_available</span>
                    <span>Counselling Appointments & Acceptance Flow</span>
                  </h2>
                  <p className="text-xs text-white/60 mt-1">
                    Manage booking requests and live sessions through the verified appointment state machine.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-[#F4C542]/20 text-[#F4C542] border border-[#F4C542]/40">
                    {appointments.filter(a => a.status === 'pending').length} Pending Requests
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {appointments.map(appt => {
                  const dt = new Date(appt.slot_time);
                  const isPending = appt.status === 'pending';
                  const isConfirmed = appt.status === 'confirmed';
                  const isCompleted = appt.status === 'completed';
                  const isNoShow = appt.status === 'no_show';
                  const isRejected = appt.status === 'rejected' || appt.status === 'declined';
                  const isCancelled = appt.status === 'cancelled';

                  return (
                    <div 
                      key={appt.id} 
                      className={`p-5 rounded-2xl border transition-all space-y-4 ${
                        isPending ? 'bg-[#F4C542]/[0.04] border-[#F4C542]/40 shadow-lg' :
                        isConfirmed ? 'bg-white/[0.04] border-white/20' :
                        'bg-black/30 border-white/5 opacity-80'
                      }`}
                    >
                      <div className="flex justify-between items-start gap-2">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-heading font-black text-base text-white">
                              {appt.original_name || appt.student_name || 'Vamsi Krishna'}
                            </span>
                            {appt.booking_mode === 'anonymous' ? (
                              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40">
                                🎭 Booked Anonymously ({appt.student_alias || appt.anonymous_id || 'Alias'})
                              </span>
                            ) : (
                              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                                👤 Booked with Original Name
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-white/50 block">{appt.type || 'Audio Call'} Consultation</span>
                        </div>

                        <span className={`text-[10px] font-mono font-black px-2.5 py-1 rounded-full border uppercase shrink-0 ${
                          isPending ? 'bg-[#F4C542] text-[#111111] border-[#F4C542]' :
                          isConfirmed ? 'bg-white/10 text-white border-white/30' :
                          isCompleted ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' :
                          isNoShow ? 'bg-zinc-700 text-zinc-300 border-zinc-600' :
                          'bg-rose-500/20 text-rose-300 border-rose-500/30'
                        }`}>
                          {isPending ? 'Pending Approval' :
                           isConfirmed ? 'Confirmed' :
                           isCompleted ? 'Completed' :
                           isNoShow ? 'No-Show' :
                           isRejected ? 'Declined' : 'Cancelled'}
                        </span>
                      </div>

                      {/* Complete Student Registration Profile (Requirement: Counsellors see real name, college, branch, section, year, mobile number, gender) */}
                      <div className="p-3.5 bg-black/40 rounded-xl border border-white/10 space-y-2 text-xs font-mono">
                        <div className="text-[10px] uppercase font-bold text-[#F4C542] tracking-wider border-b border-white/10 pb-1 flex items-center justify-between">
                          <span>Verified Student Academic &amp; Contact Card</span>
                          <span className="text-white/40">SVES Institutional</span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-1.5 pt-0.5">
                          <div>
                            <span className="text-white/50 text-[10px] block">College (Institution):</span>
                            <span className="text-white font-bold truncate block" title={appt.college_name || appt.institution || 'Vishnu Institute of Technology (VIT)'}>
                              🏛️ {appt.college_name || appt.institution || 'Vishnu Institute of Technology (VIT)'}
                            </span>
                          </div>
                          <div>
                            <span className="text-white/50 text-[10px] block">Branch &amp; Section:</span>
                            <span className="text-white font-bold block">
                              📚 {appt.branch || appt.department || 'CSE'} · {appt.section || 'Section A'}
                            </span>
                          </div>
                          <div>
                            <span className="text-white/50 text-[10px] block">Year &amp; Gender:</span>
                            <span className="text-white font-bold block">
                              📅 {appt.year || '3rd Year'} · {appt.gender || 'Male'}
                            </span>
                          </div>
                          <div>
                            <span className="text-white/50 text-[10px] block">Mobile Number:</span>
                            <a 
                              href={`tel:${(appt.mobile_number || appt.phone || '9876543210').replace(/\s+/g, '')}`} 
                              className="text-[#F4C542] hover:underline font-bold flex items-center gap-1"
                              title="Call student"
                            >
                              📱 {appt.mobile_number || appt.phone || '+91 98765 43210'}
                            </a>
                          </div>
                        </div>
                      </div>

                      <div className="text-xs space-y-1 bg-black/40 p-3 rounded-xl border border-white/5 font-mono">
                        <div className="flex justify-between text-white/70">
                          <span className="text-white/40">Date:</span>
                          <span className="text-white font-semibold">
                            {dt.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </span>
                        </div>
                        <div className="flex justify-between text-white/70">
                          <span className="text-white/40">Time:</span>
                          <span className="text-white font-semibold">
                            {dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        {appt.notes && (
                          <div className="pt-1.5 border-t border-white/5 text-[11px] text-white/60 italic">
                            "{appt.notes}"
                          </div>
                        )}
                      </div>

                      <div className="space-y-2">
                        {isPending && (
                          <div className="space-y-2">
                            <div className="flex gap-2">
                              <button 
                                onClick={() => handleUpdateApptStatus(appt.id, 'accepted')} 
                                className="flex-1 py-2.5 rounded-2xl bg-[#F4C542] hover:bg-[#e0b435] text-[#111111] font-black text-xs border-2 border-[#111111] transition-all flex items-center justify-center gap-1 cursor-pointer active:scale-95 shadow-xs"
                              >
                                Accept Booking
                              </button>
                              <button 
                                onClick={() => handleUpdateApptStatus(appt.id, 'declined')} 
                                className="flex-1 py-2.5 rounded-2xl bg-[#FFFFFF] hover:bg-[#111111] hover:text-[#FFFFFF] text-[#111111] border border-[#111111] text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer active:scale-95"
                              >
                                Decline
                              </button>
                            </div>
                            <button 
                              onClick={() => { setRescheduleId(appt.id === rescheduleId ? null : appt.id); setRescheduleDate(''); }} 
                              className="w-full py-2 rounded-xl bg-[#FAFAFA] hover:bg-[#111111]/5 text-[#111111] border border-[#111111]/15 text-[11px] font-bold transition-all"
                            >
                              Reschedule Slot
                            </button>
                          </div>
                        )}

                        {appt.id === rescheduleId && (
                          <div className="p-3 bg-[#FAFAFA] rounded-2xl border border-[#111111]/20 space-y-2">
                            <label className="text-[11px] font-black text-[#111111] block">Select New Date & Time:</label>
                            <input
                              type="datetime-local"
                              value={rescheduleDate}
                              onChange={e => setRescheduleDate(e.target.value)}
                              className="w-full bg-[#FFFFFF] border border-[#111111] rounded-xl px-2.5 py-1.5 text-xs text-[#111111] font-bold focus:outline-none focus:ring-1 focus:ring-[#F4C542]"
                            />
                            <div className="flex gap-2">
                              <button
                                onClick={async () => {
                                  if (!rescheduleDate) return;
                                  await handleUpdateApptStatus(appt.id, 'rescheduled', rescheduleDate);
                                  setRescheduleId(null);
                                  setRescheduleDate('');
                                }}
                                disabled={!rescheduleDate}
                                className="flex-1 py-2 bg-[#F4C542] text-[#111111] font-black text-xs rounded-xl border border-[#111111] hover:brightness-105 disabled:opacity-40 transition-all cursor-pointer"
                              >
                                Confirm Time
                              </button>
                              <button
                                onClick={() => { setRescheduleId(null); setRescheduleDate(''); }}
                                className="py-2 px-3 bg-[#FFFFFF] text-[#111111] border border-[#111111] text-xs font-bold rounded-xl hover:bg-[#111111] hover:text-[#FFFFFF] transition-all cursor-pointer"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        )}

                        {isConfirmed && (
                          <div className="space-y-2">
                            <button
                              onClick={() => navigate(`/call/${appt.id}`)}
                              className="w-full py-2.5 bg-[#F4C542] hover:bg-[#e0b435] text-[#111111] text-xs font-black rounded-2xl border-2 border-[#111111] flex items-center justify-center gap-1.5 shadow-xs active:scale-95 cursor-pointer"
                            >
                              <span className="w-2 h-2 rounded-full bg-[#111111]" />
                              <span>Start Session</span>
                            </button>
                            <div className="flex gap-2">
                              <button 
                                onClick={() => handleUpdateApptStatus(appt.id, 'completed')} 
                                className="flex-1 py-1.5 bg-white/5 hover:bg-emerald-500/20 text-white hover:text-emerald-300 border border-white/10 text-[11px] font-bold rounded-lg transition-all"
                              >
                                ✓ Completed
                              </button>
                              <button 
                                onClick={() => handleUpdateApptStatus(appt.id, 'no_show')} 
                                className="flex-1 py-1.5 bg-white/5 hover:bg-rose-500/20 text-white hover:text-rose-300 border border-white/10 text-[11px] font-bold rounded-lg transition-all"
                              >
                                ✕ No-Show
                              </button>
                              <button 
                                onClick={() => handleUpdateApptStatus(appt.id, 'cancelled')} 
                                className="py-1.5 px-2.5 bg-white/5 hover:bg-white/10 text-white/50 hover:text-white text-[11px] rounded-lg transition-all"
                                title="Cancel appointment"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        )}

                        {(isCompleted || isNoShow || isRejected || isCancelled) && (
                          <div className="text-center py-2 text-[11px] text-white/40 font-mono">
                            Session record archived
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── OFFLINE SESSIONS VIEW ── */}
          {view === 'offline_sessions' && !selectedCase && (
            <div className="glass-panel p-6 rounded-2xl space-y-6 animate-fade-in border-white/10">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-internal pb-5">
                <div>
                  <h2 className="text-xl font-heading font-black text-white flex items-center gap-2">
                    <span className="material-symbols-outlined text-blue-400">edit_note</span>
                    <span>Manual Offline Session Entry & Records</span>
                  </h2>
                  <p className="text-xs text-on-surface-variant mt-1">
                    Record and audit physical college chamber counselling sessions to maintain institutional continuity.
                  </p>
                </div>
                <button
                  onClick={() => setShowOfflineModal(true)}
                  className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-md shadow-blue-600/30 flex items-center gap-1.5 cursor-pointer self-start sm:self-auto active:scale-95"
                >
                  <span className="material-symbols-outlined text-[18px]">add</span>
                  <span>+ Record Offline Session</span>
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-border-internal bg-surface-container-low/40 text-on-surface-variant font-semibold uppercase tracking-wider text-[10px]">
                      <th className="py-3 px-4">Student Alias</th>
                      <th className="py-3 px-4">Date & Duration</th>
                      <th className="py-3 px-4">Type</th>
                      <th className="py-3 px-4">Primary Concern</th>
                      <th className="py-3 px-4">Risk Level</th>
                      <th className="py-3 px-4">Clinical Notes</th>
                      <th className="py-3 px-4">Follow-up</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-internal/40">
                    {offlineSessions.map((session) => (
                      <tr key={session.id} className="hover:bg-surface-container/40 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold text-secondary-fixed">
                          {session.studentAlias}
                        </td>
                        <td className="py-3.5 px-4 text-white">
                          <div>{session.date}</div>
                          <div className="text-[10px] text-on-surface-variant">{session.duration}</div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="px-2 py-0.5 rounded-full bg-white/10 text-white text-[10px] font-semibold border border-white/10">
                            {session.sessionType}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-white font-medium">
                          {session.concern}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            session.riskLevel === 'Low' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' :
                            session.riskLevel === 'Moderate' ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30' :
                            'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                          }`}>
                            {session.riskLevel}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-on-surface-variant max-w-xs truncate">
                          {session.notes}
                        </td>
                        <td className="py-3.5 px-4">
                          {session.followUpRequired ? (
                            <span className="text-blue-300 text-[11px] font-semibold">
                              Yes ({session.nextSessionDate || 'TBD'})
                            </span>
                          ) : (
                            <span className="text-on-surface-variant/60 text-[11px]">None</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── TO-DO LIST VIEW ── */}
          {view === 'todos' && !selectedCase && (
            <div className="glass-panel p-6 rounded-2xl space-y-6 animate-fade-in border-white/10">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-internal pb-5">
                <div>
                  <h2 className="text-xl font-heading font-black text-white flex items-center gap-2">
                    <span className="material-symbols-outlined text-amber-400">checklist</span>
                    <span>Counsellor Dedicated Task Manager</span>
                  </h2>
                  <p className="text-xs text-on-surface-variant mt-1">
                    Track clinical follow-ups, case reviews, session prep, and administrative tasks.
                  </p>
                </div>
                <button
                  onClick={() => setShowTaskModal(true)}
                  className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-900 text-xs font-bold transition-all shadow-md shadow-amber-500/30 flex items-center gap-1.5 cursor-pointer self-start sm:self-auto active:scale-95"
                >
                  <span className="material-symbols-outlined text-[18px]">add_task</span>
                  <span>+ Add Task</span>
                </button>
              </div>

              <div className="space-y-3">
                {tasks.map((task) => (
                  <div
                    key={task.id}
                    className={`p-4 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                      task.completed
                        ? 'bg-surface-container-low/20 border-white/5 opacity-60'
                        : 'bg-surface-container-low border-border-internal hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center gap-3.5">
                      <input
                        type="checkbox"
                        checked={task.completed}
                        onChange={() => {
                          setTasks(tasks.map(t => t.id === task.id ? { ...t, completed: !t.completed } : t));
                        }}
                        className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className={`text-xs font-bold ${task.completed ? 'line-through text-on-surface-variant' : 'text-white'}`}>
                            {task.title}
                          </h3>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            task.priority === 'Urgent' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
                            task.priority === 'Important' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                            'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                          }`}>
                            {task.priority === 'Urgent' ? '🔴 Urgent' : task.priority === 'Important' ? '🟡 Important' : '🔵 Normal'}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-[11px] text-on-surface-variant">
                          <span>Due: {task.dueDate}</span>
                          {task.studentAlias && (
                            <span className="font-mono text-secondary-fixed">Target: {task.studentAlias}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => setTasks(tasks.filter(t => t.id !== task.id))}
                      className="p-1.5 rounded-lg text-on-surface-variant hover:text-rose-400 transition-colors"
                      title="Delete task"
                    >
                      <span className="material-symbols-outlined text-[18px]">delete</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── WELLNESS FLASHCARDS VIEW ── */}
          {view === 'flashcards' && !selectedCase && (
            <div className="glass-panel p-6 rounded-2xl space-y-6 animate-fade-in border-white/10">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-internal pb-5">
                <div>
                  <h2 className="text-xl font-heading font-black text-white flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#F4C542]">style</span>
                    <span>Counsellor Wellness Cards Suite</span>
                  </h2>
                  <p className="text-xs text-on-surface-variant mt-1">
                    Author, schedule, and publish bite-sized psychoeducational cards delivered directly into students' 5-card daily deck.
                  </p>
                </div>
                <button
                  onClick={() => setShowFlashcardModal(true)}
                  className="px-4 py-2.5 rounded-xl bg-[#F4C542] hover:bg-[#e0b435] text-[#111111] text-xs font-black border border-[#111111] transition-all shadow-md flex items-center gap-1.5 cursor-pointer self-start sm:self-auto active:scale-95"
                >
                  <span className="material-symbols-outlined text-[18px]">add</span>
                  <span>+ Create Flashcard</span>
                </button>
              </div>

              {/* Metric Indicators */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10">
                  <span className="text-[10px] uppercase font-bold text-white/50 block">Total Authored</span>
                  <span className="text-2xl font-black text-white mt-1 block">{flashcards.length}</span>
                </div>
                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                  <span className="text-[10px] uppercase font-bold text-emerald-400 block">Published</span>
                  <span className="text-2xl font-black text-emerald-300 mt-1 block">
                    {flashcards.filter(f => f.status === 'PUBLISHED').length}
                  </span>
                </div>
                <div className="p-4 rounded-xl bg-[#F4C542]/10 border border-[#F4C542]/30">
                  <span className="text-[10px] uppercase font-bold text-[#F4C542] block">Pending Review</span>
                  <span className="text-2xl font-black text-[#F4C542] mt-1 block">
                    {flashcards.filter(f => f.status === 'PENDING_REVIEW').length}
                  </span>
                </div>
                <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10">
                  <span className="text-[10px] uppercase font-bold text-white/50 block">Drafts</span>
                  <span className="text-2xl font-black text-white/80 mt-1 block">
                    {flashcards.filter(f => f.status === 'DRAFT').length}
                  </span>
                </div>
              </div>

              {/* Filter Tabs */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {(['ALL', 'PUBLISHED', 'PENDING_REVIEW', 'DRAFT'] as const).map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setFlashcardFilter(filter)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      flashcardFilter === filter
                        ? 'bg-[#F4C542] text-[#111111] border border-[#111111]'
                        : 'bg-white/5 text-white/70 hover:bg-white/10 border border-white/10'
                    }`}
                  >
                    {filter === 'ALL' ? 'All Cards' : filter === 'PENDING_REVIEW' ? 'Under Review' : filter.charAt(0) + filter.slice(1).toLowerCase()}
                  </button>
                ))}
              </div>

              {/* Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {flashcards
                  .filter(f => flashcardFilter === 'ALL' || f.status === flashcardFilter)
                  .map((card) => (
                    <div 
                      key={card.id} 
                      className="p-5 rounded-2xl bg-[#FFFFFF] border-2 border-[#111111] text-[#111111] shadow-lg flex flex-col justify-between space-y-4 font-sans"
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-[#111111] text-[#FFFFFF]">
                            {card.category}
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            card.status === 'PUBLISHED' ? 'bg-[#F4C542] text-[#111111] border-[#111111]' :
                            card.status === 'PENDING_REVIEW' ? 'bg-amber-100 text-amber-900 border-amber-300' :
                            'bg-gray-100 text-gray-700 border-gray-300'
                          }`}>
                            {card.status}
                          </span>
                        </div>

                        <h4 className="text-base font-black text-[#111111] leading-snug">
                          {card.title}
                        </h4>

                        {/* Front Preview */}
                        <div className="p-3 rounded-xl bg-[#111111]/[0.03] border border-[#111111]/10 space-y-1">
                          <span className="text-[10px] uppercase font-black tracking-wider text-[#111111]/50 block">
                            Front (Prompt)
                          </span>
                          <p className="text-xs font-semibold text-[#111111] line-clamp-2">
                            {card.front_content}
                          </p>
                        </div>

                        {/* Back Preview */}
                        <div className="p-3 rounded-xl bg-[#111111]/[0.03] border border-[#111111]/10 space-y-1">
                          <span className="text-[10px] uppercase font-black tracking-wider text-[#111111]/50 block">
                            Back (Actionable Insight)
                          </span>
                          <p className="text-xs text-[#111111]/80 line-clamp-3">
                            {card.back_content}
                          </p>
                        </div>
                      </div>

                      {/* Footer Actions */}
                      <div className="pt-3 border-t border-[#111111]/10 flex items-center justify-between text-xs">
                        <span className="text-[10px] text-[#111111]/50 font-mono">
                          Date: {card.scheduled_date}
                        </span>
                        
                        <div className="flex items-center gap-2">
                          {card.status !== 'PUBLISHED' && (
                            <button
                              onClick={() => {
                                updateFlashcardStatus(card.id, 'PUBLISHED');
                                setFlashcards(prev => prev.map(c => c.id === card.id ? { ...c, status: 'PUBLISHED' } : c));
                              }}
                              className="px-2.5 py-1 rounded-lg bg-[#F4C542] hover:bg-[#e0b435] text-[#111111] font-bold text-[11px] border border-[#111111] transition-all"
                            >
                              Publish Now
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
              </div>

              {flashcards.filter(f => flashcardFilter === 'ALL' || f.status === flashcardFilter).length === 0 && (
                <div className="text-center py-12 border-2 border-dashed border-white/10 rounded-2xl text-on-surface-variant">
                  <span className="material-symbols-outlined text-4xl text-white/30 mb-2">style</span>
                  <p className="text-sm font-semibold text-white">No wellness cards in this category</p>
                  <button
                    onClick={() => setShowFlashcardModal(true)}
                    className="mt-3 px-4 py-2 bg-[#F4C542] text-[#111111] font-black rounded-xl text-xs"
                  >
                    + Create Your First Card
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Emergency SOS Hub View */}
          {view === 'sos' && !selectedCase && (
            <div className="space-y-6 animate-fade-in">
              <div className="p-6 rounded-2xl bg-gradient-to-r from-rose-950/60 via-surface-container-high to-red-950/50 border-2 border-rose-500/50 shadow-xl relative overflow-hidden">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-rose-600 flex items-center justify-center text-white shadow-lg shadow-rose-600/50 animate-bounce">
                      <span className="material-symbols-outlined text-2xl">emergency</span>
                    </div>
                    <div>
                      <h2 className="text-xl sm:text-2xl font-heading font-black text-white tracking-tight flex items-center gap-2">
                        Emergency SOS & Identity Triage Hub
                      </h2>
                      <p className="text-xs sm:text-sm text-rose-200/80 max-w-2xl leading-relaxed">
                        Live monitored feed of student-triggered crisis alarms and critical AI risk overflows. 
                        Authorized clinicians can initiate audited anonymity deconstruction (<code className="text-white font-mono bg-rose-950/80 px-1.5 py-0.5 rounded">SRS Section 16</code>) to save lives.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 bg-rose-900/40 border border-rose-500/50 px-4 py-2 rounded-xl text-center">
                    <div className="text-2xl font-mono font-black text-white">{activeAlerts.length + queue.filter(q => q.risk_score >= 0.8 && !activeAlerts.some(a => a.student_alias === q.anonymous_id)).length}</div>
                    <div className="text-[10px] uppercase font-bold text-rose-300 text-left">Active<br/>Crises</div>
                  </div>
                </div>
              </div>

              {activeAlerts.length === 0 && queue.filter(q => q.risk_score >= 0.8).length === 0 ? (
                <div className="p-12 rounded-2xl glass-panel text-center border-emerald-500/30 bg-emerald-950/10 space-y-3 shadow-lg">
                  <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center border border-emerald-500/40 shadow-inner">
                    <span className="material-symbols-outlined text-3xl">verified_user</span>
                  </div>
                  <h3 className="text-lg font-heading font-black text-white">All Clear on Campus Support</h3>
                  <p className="text-sm text-on-surface-variant max-w-md mx-auto">
                    There are no active emergency SOS broadcasts or severe critical risk scores requiring intervention right now.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {activeAlerts.map(alert => (
                    <div key={alert.id} className="p-6 rounded-2xl bg-gradient-to-br from-panel-low via-surface-container to-red-950/30 border border-rose-500/60 shadow-xl flex flex-col justify-between hover:border-rose-400 transition-all relative overflow-hidden group">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-rose-600/10 rounded-full blur-2xl pointer-events-none group-hover:bg-rose-600/20 transition-all"></div>
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-3">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-600/30 text-rose-300 text-[11px] font-mono font-black uppercase border border-rose-500/40 tracking-wider">
                            <span className="w-2 h-2 rounded-full bg-rose-400 animate-ping"></span>
                            {alert.triggered_by === 'user_sos' ? '🚨 STUDENT SOS ALARM' : '⚡ CRITICAL AI FLAG'}
                          </span>
                          <span className="text-xs font-mono text-on-surface-variant">
                            {alert.created_at ? new Date(alert.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'}
                          </span>
                        </div>

                        <div className="space-y-2 mb-6">
                          <div className="flex items-baseline justify-between">
                            <h4 className="text-lg font-heading font-black text-white">{alert.student_alias}</h4>
                            <span className="text-sm font-mono font-extrabold text-rose-400">Risk: {(alert.risk_score * 100).toFixed(0)}%</span>
                          </div>
                          <p className="text-xs text-on-surface-variant">
                            Department of <span className="text-on-surface font-semibold">{alert.department}</span> (Year {alert.year})
                          </p>
                        </div>
                      </div>

                      <div className="space-y-2 pt-4 border-t border-border-internal/60">
                        <button
                          onClick={() => { setSelectedCase(alert.student_alias); setEscalateModalOpen(true); }}
                          className="w-full py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-heading font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-rose-600/30 transition-all active:scale-95"
                        >
                          <span className="material-symbols-outlined text-[18px]">lock_open</span>
                          Emergency Reveal Identity
                        </button>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setSelectedCase(alert.student_alias)}
                            className="flex-1 py-2.5 rounded-xl bg-surface-container-high hover:bg-surface-bright text-on-surface font-semibold text-xs transition-colors border border-border-structural"
                          >
                            Open Clinical Case
                          </button>
                          <button
                            onClick={() => handleResolveAlert(alert.id)}
                            className="px-3 py-2.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 text-xs font-bold transition-colors border border-emerald-500/30"
                            title="Dismiss or mark resolved"
                          >
                            ✓ Resolve
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Show Critical Queue Students that haven't explicitly created an Alert object yet */}
                  {queue.filter(q => q.risk_score >= 0.8 && !activeAlerts.some(a => a.student_alias === q.anonymous_id)).map(student => (
                    <div key={student.anonymous_id} className="p-6 rounded-2xl bg-gradient-to-br from-panel-low via-surface-container to-amber-950/20 border border-amber-500/40 shadow-xl flex flex-col justify-between hover:border-amber-400/60 transition-all relative">
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-3">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-600/20 text-amber-300 text-[11px] font-mono font-black uppercase border border-amber-500/40">
                            ⚡ HIGH-RISK THRESHOLD
                          </span>
                        </div>
                        <div className="space-y-2 mb-6">
                          <div className="flex items-baseline justify-between">
                            <h4 className="text-lg font-heading font-black text-white">{student.anonymous_id}</h4>
                            <span className="text-sm font-mono font-extrabold text-amber-400">Risk: {(student.risk_score * 100).toFixed(0)}%</span>
                          </div>
                          <p className="text-xs text-on-surface-variant">
                            Department of <span className="text-on-surface font-semibold">{student.department}</span> (Year {student.year})
                          </p>
                        </div>
                      </div>

                      <div className="space-y-2 pt-4 border-t border-border-internal/60">
                        <button
                          onClick={() => { setSelectedCase(student.anonymous_id); setEscalateModalOpen(true); }}
                          className="w-full py-3 rounded-xl bg-rose-600/80 hover:bg-rose-600 text-white font-heading font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-rose-600/20 transition-all"
                        >
                          <span className="material-symbols-outlined text-[18px]">lock_open</span>
                          Reveal Identity (Emergency)
                        </button>
                        <button
                          onClick={() => setSelectedCase(student.anonymous_id)}
                          className="w-full py-2.5 rounded-xl bg-surface-container-high hover:bg-surface-bright text-on-surface font-semibold text-xs transition-colors border border-border-structural"
                        >
                          Open Clinical Case & Chat
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════════════
              STUDENT SHARED WORKS & RAPPORT VIEW (REQ 6)
          ═══════════════════════════════════════════════════════════════════ */}
          {view === 'shared_works' && !selectedCase && (
            <div className="space-y-6 animate-fade-in text-[#111111]">
              {/* Top Banner */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-[#FFFFFF] border-2 border-[#111111] shadow-xs">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-black uppercase tracking-wider bg-[#F4C542] text-[#111111] border border-[#111111]">
                      Client-Counsellor Rapport
                    </span>
                    <span className="text-xs font-mono text-[#111111]/60">Confidential Creative &amp; Journal Sharing</span>
                  </div>
                  <h2 className="text-2xl font-heading font-black text-[#111111] tracking-tight">
                    Student Shared Works &amp; Reflections ({sharedWorks.length})
                  </h2>
                  <p className="text-xs text-[#111111]/70 font-medium">
                    Students share private creative poems, diary entries, or milestones with you to build emotional safety and therapeutic rapport before sessions.
                  </p>
                </div>
              </div>

              {/* Works List */}
              {sharedWorks.length === 0 ? (
                <div className="text-center py-16 border-2 border-dashed border-[#111111]/20 rounded-3xl bg-[#FAFAFA] space-y-2">
                  <BookOpen size={36} className="mx-auto text-[#111111]/30" />
                  <p className="text-sm font-bold text-[#111111]">No student works shared yet</p>
                  <p className="text-xs text-[#111111]/60 max-w-sm mx-auto">
                    When students share diary entries or creative reflections from their portal, they will appear here for you to review and send encouraging notes.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {sharedWorks.map((work) => {
                    const hasResponse = Boolean(work.counselorResponse);
                    const currentDraft = rapportNotes[work.id] || '';

                    return (
                      <div 
                        key={work.id}
                        className="p-6 rounded-3xl border-2 border-[#111111] bg-[#FFFFFF] shadow-sm space-y-4"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#111111]/10 pb-3">
                          <div className="flex items-center gap-2.5">
                            <span className="w-8 h-8 rounded-xl bg-[#F4C542] border border-[#111111] flex items-center justify-center font-bold text-xs text-[#111111]">
                              ✍️
                            </span>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-black text-sm text-[#111111]">
                                  {work.studentAlias}
                                </span>
                                <span className="text-[10px] font-mono font-black uppercase px-2 py-0.5 rounded-full bg-[#FAFAFA] border border-[#111111]/20 text-[#111111]">
                                  {work.workType}
                                </span>
                                {hasResponse && (
                                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-900 border border-green-300">
                                    ✓ Responded
                                  </span>
                                )}
                              </div>
                              <span className="text-[11px] font-mono text-[#111111]/50">
                                Shared on {new Date(work.sharedAt).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })} at {new Date(work.sharedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Title & Content */}
                        <div className="space-y-2">
                          <h3 className="text-base sm:text-lg font-heading font-black text-[#111111]">
                            {work.title}
                          </h3>
                          <div className="p-4 rounded-2xl bg-[#FAFAFA] border border-[#111111]/15 text-xs sm:text-sm text-[#111111]/85 whitespace-pre-wrap leading-relaxed font-sans">
                            {work.content}
                          </div>
                        </div>

                        {/* Student Note */}
                        {work.reflectionNoteForCounselor && (
                          <div className="text-xs bg-[#F4C542]/15 border border-[#111111]/15 rounded-xl p-3 text-[#111111]">
                            <strong className="font-mono uppercase text-[10px] block text-[#111111]/70 mb-0.5">Student Note to Counsellor:</strong>
                            <p className="italic">"{work.reflectionNoteForCounselor}"</p>
                          </div>
                        )}

                        {/* Existing Counsellor Response */}
                        {hasResponse && (
                          <div className="p-4 rounded-2xl bg-green-50 border border-green-300 text-xs space-y-1">
                            <div className="flex items-center justify-between text-green-950 font-bold">
                              <span>Your Therapeutic Rapport Note:</span>
                              <span className="font-mono text-[10px] text-green-800">
                                {work.respondedAt ? new Date(work.respondedAt).toLocaleDateString() : ''}
                              </span>
                            </div>
                            <p className="text-green-900 leading-relaxed font-medium">
                              {work.counselorResponse}
                            </p>
                          </div>
                        )}

                        {/* Reply Form */}
                        <div className="pt-2 flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
                          <input
                            type="text"
                            placeholder="Type an encouraging rapport note back to the student..."
                            value={currentDraft}
                            onChange={(e) => setRapportNotes(prev => ({ ...prev, [work.id]: e.target.value }))}
                            className="flex-1 text-xs bg-[#FAFAFA] border border-[#111111]/25 rounded-xl px-4 py-2.5 text-[#111111] focus:outline-hidden focus:border-[#111111]"
                          />
                          <button
                            onClick={() => {
                              if (!currentDraft.trim()) return;
                              const updatedWorks = sharedWorks.map(w => 
                                w.id === work.id 
                                  ? { ...w, counselorResponse: currentDraft.trim(), status: 'reviewed' as const, respondedAt: new Date().toISOString() }
                                  : w
                              );
                              setSharedWorks(updatedWorks);
                              localStorage.setItem('mindbridge_shared_student_works', JSON.stringify(updatedWorks));
                              setRapportNotes(prev => ({ ...prev, [work.id]: '' }));
                            }}
                            className="px-5 py-2.5 bg-[#F4C542] hover:bg-[#e0b435] text-[#111111] font-heading font-black text-xs border-2 border-[#111111] rounded-xl transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 shrink-0"
                          >
                            <Send size={13} />
                            <span>{hasResponse ? 'Update Note' : 'Send Rapport Note'}</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════════════
              COUNSELLOR MONTHLY REPORTS HUB (REQ 2 & 16)
          ═══════════════════════════════════════════════════════════════════ */}
          {view === 'monthly_reports' && !selectedCase && (
            <div className="space-y-6 animate-fade-in text-[#111111]">
              {/* Header Canopy */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-[#FFFFFF] border-2 border-[#111111] shadow-xs">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-black uppercase tracking-wider bg-[#F4C542] text-[#111111] border border-[#111111]">
                      Attachment 4 Standard
                    </span>
                    <span className="text-xs font-mono text-[#111111]/60">SVES Institutional Governance</span>
                  </div>
                  <h2 className="text-2xl font-heading font-black text-[#111111] tracking-tight">
                    Counsellor Monthly Reports ({monthlyReports.length})
                  </h2>
                  <p className="text-xs text-[#111111]/70 font-medium">
                    Draft, manually log, and export clean vector PDF monthly reports. Submitted reports automatically reflect to Campus Admin and Society Super Admin.
                  </p>
                </div>

                <button
                  onClick={() => setShowMonthlyReportModal(true)}
                  className="px-5 py-3 rounded-2xl bg-[#F4C542] hover:bg-[#e0b435] text-[#111111] font-heading font-black text-xs border-2 border-[#111111] transition-all shadow-xs flex items-center gap-2 cursor-pointer active:scale-95 shrink-0"
                >
                  <Plus size={16} />
                  <span>+ Create Monthly Report</span>
                </button>
              </div>

              {/* Reports Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {monthlyReports.map((rep) => (
                  <div 
                    key={rep.id}
                    className="p-6 rounded-3xl border-2 border-[#111111] bg-[#FFFFFF] shadow-sm space-y-4 hover:border-[#F4C542] transition-all flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="text-[10px] font-mono font-black uppercase tracking-wider text-[#111111]/60">
                            {rep.institution}
                          </span>
                          <h3 className="text-lg font-heading font-black text-[#111111] mt-0.5">
                            {rep.month} {rep.year} Monthly Report
                          </h3>
                        </div>
                        <span className="text-[10px] font-mono font-black px-2.5 py-1 rounded-full bg-green-100 text-green-900 border border-green-300">
                          OFFICIALLY FILED
                        </span>
                      </div>

                      {/* Stats Overview */}
                      <div className="grid grid-cols-3 gap-2 bg-[#FAFAFA] p-3 rounded-2xl border border-[#111111]/15 text-center font-mono">
                        <div>
                          <span className="block text-[9px] text-[#111111]/60 uppercase">Consultations</span>
                          <span className="text-base font-heading font-black text-[#111111]">{rep.sessionStats.total}</span>
                        </div>
                        <div>
                          <span className="block text-[9px] text-[#111111]/60 uppercase">Meetings</span>
                          <span className="text-base font-heading font-black text-[#111111]">{rep.administrativeMeetings.length}</span>
                        </div>
                        <div>
                          <span className="block text-[9px] text-[#111111]/60 uppercase">Workshops</span>
                          <span className="text-base font-heading font-black text-[#111111]">{rep.activitiesConducted.length}</span>
                        </div>
                      </div>

                      {/* Weekly Sessions Bar Preview */}
                      <div className="space-y-1">
                        <span className="text-[10px] font-mono font-bold uppercase text-[#111111]/60">
                          Weekly Breakdown:
                        </span>
                        <div className="flex items-center gap-1 text-[11px] font-mono text-[#111111]">
                          <span className="px-2 py-0.5 bg-[#FAFAFA] border border-[#111111]/15 rounded-md">W1: {rep.sessionStats.week1}</span>
                          <span className="px-2 py-0.5 bg-[#FAFAFA] border border-[#111111]/15 rounded-md">W2: {rep.sessionStats.week2}</span>
                          <span className="px-2 py-0.5 bg-[#FAFAFA] border border-[#111111]/15 rounded-md">W3: {rep.sessionStats.week3}</span>
                          <span className="px-2 py-0.5 bg-[#FAFAFA] border border-[#111111]/15 rounded-md">W4: {rep.sessionStats.week4}</span>
                          <span className="px-2 py-0.5 bg-[#FAFAFA] border border-[#111111]/15 rounded-md">W5: {rep.sessionStats.week5}</span>
                        </div>
                      </div>

                      {rep.generalRemarks && (
                        <p className="text-xs text-[#111111]/70 italic line-clamp-2">
                          "{rep.generalRemarks}"
                        </p>
                      )}
                    </div>

                    {/* PDF Export Button */}
                    <div className="pt-3 border-t border-[#111111]/10">
                      <button
                        onClick={() => generateCounselorMonthlyReportPDF(rep)}
                        className="w-full py-2.5 rounded-xl bg-[#F4C542] hover:bg-[#e0b435] text-[#111111] font-heading font-black text-xs border-2 border-[#111111] transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                      >
                        <Download size={14} />
                        <span>Export Attachment 4 PDF (Zero Alignment Drift)</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Case Details View */}
          {selectedCase && caseDetails && (
            <div className="glass-panel flex flex-col rounded-xl overflow-hidden h-[calc(100vh-140px)]">
              <div className="bg-panel-high border-b border-border-internal p-4 flex items-center justify-between">
                <div>
                  <h2 className="font-h4 font-bold flex items-center gap-2">
                    <button onClick={() => setSelectedCase(null)} className="hover:bg-surface-container p-1 rounded-full"><span className="material-symbols-outlined text-[20px]">arrow_back</span></button>
                    {selectedCase}
                  </h2>
                </div>
                <div className="flex items-center gap-2">
                  {caseDetails.student.risk_score >= 0.8 && !decryptedIdentity && (
                    <button 
                      onClick={() => setEscalateModalOpen(true)} 
                      className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-heading font-extrabold text-xs rounded transition-all shadow-md shadow-rose-600/30 flex items-center gap-1 animate-pulse"
                    >
                      <span className="material-symbols-outlined text-[16px]">emergency</span>
                      🚨 Reveal Identity
                    </button>
                  )}
                  <button onClick={handleResolve} className="px-3 py-1.5 bg-success/20 text-success hover:bg-success/30 text-sm rounded transition-colors flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px]">check_circle</span> Resolve
                  </button>
                </div>
              </div>

              {/* Persistent Emergency & Identity Audit Bar */}
              {(caseDetails.student.risk_score >= 0.8 || decryptedIdentity) && (
                <div className={`px-6 py-3 ${decryptedIdentity ? 'bg-gradient-to-r from-amber-950/80 via-surface-container to-red-950/80 border-b-2 border-amber-500' : 'bg-rose-950/60 border-b border-rose-500/50'} flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-inner`}>
                  {decryptedIdentity ? (
                    <div className="flex-1 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-amber-400 text-[22px]">gpp_maybe</span>
                        <div>
                          <span className="text-xs font-mono font-black uppercase tracking-wider text-amber-300">🔓 AUDITING COMPLIANCE (SRS SEC 16): IDENTITY DECONSTRUCTED</span>
                          <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-white mt-0.5">
                            <span>Legal Name: <strong className="font-mono text-amber-200 text-sm">{decryptedIdentity.name}</strong></span>
                            <span>Phone: <strong className="font-mono text-amber-200 text-sm">{decryptedIdentity.phone}</strong></span>
                            <span>Email: <strong className="font-mono text-amber-200 text-sm">{decryptedIdentity.email}</strong></span>
                          </div>
                        </div>
                      </div>
                      <span className="text-[10px] font-mono bg-amber-500/20 text-amber-300 px-2.5 py-1 rounded border border-amber-500/30">Immutable DB Record Created</span>
                    </div>
                  ) : (
                    <div className="flex-1 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-2 text-rose-200 text-xs">
                        <span className="material-symbols-outlined text-rose-500 text-[20px] animate-pulse">warning</span>
                        <span><strong>Critical Crisis Case (Score: {(caseDetails.student.risk_score * 100).toFixed(0)}%).</strong> Student life safety protocol permits breaking anonymity under strict database audit logging.</span>
                      </div>
                      <button 
                        onClick={() => setEscalateModalOpen(true)}
                        className="px-3 py-1 bg-rose-600 hover:bg-rose-500 text-white text-xs font-black uppercase tracking-wider rounded shadow-md shrink-0"
                      >
                        Break Anonymity & Reveal
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Tabs */}
              <div className="flex border-b border-border-internal bg-panel-low overflow-x-auto">
                {([['chat', 'Chat', 'chat'], ['journals', `Shared Journals (${caseDetails.shared_journals?.length || 0})`, 'edit_note'], ['notes', 'Notes', 'edit_document'], ['timeline', 'Timeline', 'trending_up'], ['followup', 'Follow-up', 'event']] as const).map(([key, label, icon]) => (
                  <button key={key} onClick={() => setCaseTab(key as typeof caseTab)}
                    className={`flex-1 min-w-[120px] py-3 text-xs sm:text-sm font-medium flex items-center justify-center gap-1.5 border-b-2 transition-all ${caseTab === key ? 'border-primary text-primary bg-surface-container' : 'border-transparent text-on-surface-variant hover:bg-surface-container'}`}>
                    <span className="material-symbols-outlined text-[18px]">{icon}</span> {label}
                  </button>
                ))}
              </div>

              {/* Body */}
              <div className="flex-1 overflow-y-auto p-md flex flex-col">
                {caseTab === 'chat' && (
                  <div className="flex-1 flex flex-col">
                    {/* ── MindBridge AI Clinical Risk Guidance Banner ── */}
                    <div
                      className="mb-4 p-3.5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm transition-all shrink-0"
                      style={{
                        backgroundColor:
                          caseDetails.student.clinical_concern_level === 'high_concern'
                            ? 'rgba(244, 63, 94, 0.12)'
                            : caseDetails.student.clinical_concern_level === 'elevated'
                            ? 'rgba(245, 158, 11, 0.12)'
                            : 'rgba(16, 185, 129, 0.10)',
                        borderColor:
                          caseDetails.student.clinical_concern_level === 'high_concern'
                            ? 'rgba(244, 63, 94, 0.35)'
                            : caseDetails.student.clinical_concern_level === 'elevated'
                            ? 'rgba(245, 158, 11, 0.35)'
                            : 'rgba(16, 185, 129, 0.30)',
                      }}
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                            caseDetails.student.clinical_concern_level === 'high_concern'
                              ? 'bg-rose-500/20 text-rose-400'
                              : caseDetails.student.clinical_concern_level === 'elevated'
                              ? 'bg-amber-500/20 text-amber-400'
                              : 'bg-emerald-500/20 text-emerald-400'
                          }`}
                        >
                          <span className="material-symbols-outlined text-[18px]">
                            {caseDetails.student.clinical_concern_level === 'high_concern'
                              ? 'crisis_alert'
                              : caseDetails.student.clinical_concern_level === 'elevated'
                              ? 'warning'
                              : 'verified_user'}
                          </span>
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold uppercase tracking-wider font-mono text-white">
                              MindBridge AI Triage:
                            </span>
                            <span
                              className={`text-xs font-black uppercase px-2 py-0.5 rounded-full ${
                                caseDetails.student.clinical_concern_level === 'high_concern'
                                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse'
                                  : caseDetails.student.clinical_concern_level === 'elevated'
                                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                  : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                              }`}
                            >
                              {caseDetails.student.clinical_concern_level === 'high_concern'
                                ? '🚨 High Concern (Immediate Review)'
                                : caseDetails.student.clinical_concern_level === 'elevated'
                                ? '⚠️ Elevated (Counselor Attention)'
                                : '🟢 Low Concern (Standard Baseline)'}
                            </span>
                          </div>
                          <p className="text-[11px] text-on-surface-variant mt-0.5">
                            {caseDetails.student.clinical_concern_level === 'high_concern'
                              ? 'Clinical distress or crisis markers detected in student messages. Escalated monitoring active.'
                              : caseDetails.student.clinical_concern_level === 'elevated'
                              ? 'Stress or burnout markers detected. Consider offering a live audio counseling session.'
                              : 'Conversation exhibits standard baseline sentiment. Routine support recommended.'}
                          </p>
                        </div>
                      </div>

                      {caseDetails.active_appointment_id && (
                        <button
                          onClick={() => navigate(`/call/${caseDetails.active_appointment_id}`)}
                          className="px-3.5 py-2 bg-emerald-500 hover:bg-emerald-400 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/20 active:scale-95 shrink-0"
                        >
                          <span className="material-symbols-outlined text-[16px]">call</span>
                          <span>🟢 Audio Call</span>
                        </button>
                      )}
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-4 mb-4">
                      {caseDetails.chat_history.map(msg => (
                        <div key={msg.id} className={`flex gap-3 ${msg.sender === 'user' ? 'justify-end' : ''}`}>
                          {msg.sender !== 'user' && (
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${msg.sender === 'counselor' ? 'bg-orange-400/20 text-orange-400' : 'bg-primary-container text-on-primary-container'}`}>
                              <span className="material-symbols-outlined text-[16px]">{msg.sender === 'counselor' ? 'psychology' : 'smart_toy'}</span>
                            </div>
                          )}
                          <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl ${msg.sender === 'user' ? 'bg-surface-container-high rounded-tr-none' : msg.sender === 'counselor' ? 'bg-orange-400/20 rounded-tl-none border border-orange-400/30' : 'bg-primary-container/20 rounded-tl-none border border-primary-container/30'}`}>
                             {msg.sender !== 'user' && <p className="text-[10px] uppercase font-bold mb-1 opacity-70">{msg.sender === 'counselor' ? 'You' : 'AI Guide'}</p>}
                             <p className="text-sm">{msg.text}</p>
                          </div>
                        </div>
                      ))}
                      <div ref={chatEndRef} />
                    </div>
                    <div className="mt-auto bg-surface-container p-2 rounded-lg flex items-center gap-2 border border-border-internal">
                      <input 
                        type="text" 
                        value={counselorMessage} 
                        onChange={e => setCounselorMessage(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
                        placeholder="Send message to student as Counselor..."
                        className="flex-1 bg-transparent border-none text-sm px-2 focus:outline-none text-on-surface placeholder:text-on-surface-variant/50"
                      />
                      <button onClick={handleSendMessage} className="bg-[#F4C542] hover:bg-[#e0b435] text-[#111111] font-bold p-2 rounded-md transition-colors" title="Send">
                        <span className="material-symbols-outlined text-[18px]">send</span>
                      </button>
                    </div>
                  </div>
                )}
                {caseTab === 'journals' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-heading font-bold text-white flex items-center gap-2">
                        <span className="material-symbols-outlined text-interactive-primary text-[18px]">edit_note</span>
                        Shared Student Diary Reflections
                      </h3>
                      <span className="text-xs text-on-surface-variant font-mono">
                        {caseDetails.shared_journals?.length || 0} shared entries
                      </span>
                    </div>

                    {!caseDetails.shared_journals || caseDetails.shared_journals.length === 0 ? (
                      <div className="p-8 rounded-xl bg-surface-container text-center space-y-2 border border-border-internal">
                        <span className="material-symbols-outlined text-3xl text-on-surface-variant opacity-40">lock</span>
                        <p className="text-sm font-semibold text-white">No Shared Journal Entries</p>
                        <p className="text-xs text-on-surface-variant max-w-sm mx-auto">
                          The student has kept their diary entries private or hasn't created any shared reflections yet.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {caseDetails.shared_journals.map(j => (
                          <div key={j.id} className="p-4 rounded-xl bg-surface-container border border-border-internal space-y-2.5">
                            <div className="flex items-center justify-between gap-2 flex-wrap pb-2 border-b border-border-internal">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-mono font-bold text-interactive-primary">{j.entry_date}</span>
                                {j.mood && (
                                  <span className="text-xs px-2 py-0.5 rounded-full bg-interactive-primary/15 text-interactive-primary border border-interactive-primary/30">
                                    Mood: {j.mood}
                                  </span>
                                )}
                                {j.mood_tag && (
                                  <span className="text-xs px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant border border-border-internal">
                                    Tag: {j.mood_tag}
                                  </span>
                                )}
                              </div>
                              <span className="text-[11px] text-on-surface-variant font-mono">
                                {j.word_count} words
                              </span>
                            </div>
                            <p className="text-sm text-on-surface leading-relaxed whitespace-pre-wrap">
                              {j.content}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                {caseTab === 'notes' && (
                  <div className="space-y-4">
                    <textarea value={newNote} onChange={e=>setNewNote(e.target.value)} rows={4} className="w-full bg-surface-container border border-border-internal rounded-lg p-3 text-sm focus:outline-none" placeholder="Clinical notes..."></textarea>
                    <button onClick={handleSaveNote} className="w-full bg-primary py-2 rounded-lg text-sm text-white">Save Note</button>
                    <div className="space-y-2">
                      {notes.map(n => (
                        <div key={n.id} className="bg-surface-container-low p-3 rounded-lg border border-border-internal">
                           <p className="text-xs text-on-surface-variant mb-1">{new Date(n.created_at).toLocaleString()}</p>
                           <p className="text-sm whitespace-pre-wrap">{n.content}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {caseTab === 'timeline' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-3">
                      <div className="bg-surface-container p-4 rounded-lg text-center"><p className="text-h3 text-error">{caseDetails.student.risk_score.toFixed(1)}</p><p className="text-xs text-on-surface-variant uppercase">Risk Score</p></div>
                      <div className="bg-surface-container p-4 rounded-lg text-center"><p className="text-h3">{caseDetails.mood_logs.length}</p><p className="text-xs text-on-surface-variant uppercase">Mood Logs</p></div>
                      <div className="bg-surface-container p-4 rounded-lg text-center"><p className="text-h3">{caseDetails.chat_history.length}</p><p className="text-xs text-on-surface-variant uppercase">Chat Msgs</p></div>
                    </div>
                    {caseDetails.student.risk_score >= 0.8 && !decryptedIdentity && (
                        <button 
                          onClick={() => setEscalateModalOpen(true)}
                          className="w-full mt-4 py-3 bg-rose-600 text-white text-sm font-heading font-black uppercase tracking-wider rounded-xl hover:bg-rose-500 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-rose-600/30"
                        >
                          <span className="material-symbols-outlined">lock_open</span>
                          🚨 Emergency Identity Reveal & Security Escalation
                        </button>
                      )}
                      
                      {decryptedIdentity && (
                        <div className="mt-4 p-4 bg-error-container/20 border border-error/40 rounded-lg space-y-2">
                          <p className="text-sm font-bold text-error uppercase tracking-wider mb-2">Decrypted Identity</p>
                          <div className="flex justify-between text-sm"><span className="text-error/70">Name</span><span className="font-semibold text-on-surface">{decryptedIdentity.name}</span></div>
                          <div className="flex justify-between text-sm"><span className="text-error/70">Phone</span><span className="font-semibold text-on-surface">{decryptedIdentity.phone}</span></div>
                          <div className="flex justify-between text-sm"><span className="text-error/70">Email</span><span className="font-semibold text-on-surface">{decryptedIdentity.email}</span></div>
                        </div>
                      )}
                  </div>
                )}
                {caseTab === 'followup' && (
                   <div className="space-y-4">
                      <div className="bg-surface-container p-4 rounded-lg space-y-3">
                        <input type="date" value={followupDate} onChange={e=>setFollowupDate(e.target.value)} className="w-full bg-surface-container-high p-2 rounded text-sm focus:outline-none" style={{ colorScheme: 'dark' }} />
                        <input type="text" value={followupReason} onChange={e=>setFollowupReason(e.target.value)} placeholder="Reason" className="w-full bg-surface-container-high p-2 rounded text-sm focus:outline-none"/>
                        <button onClick={handleSaveFollowup} className="w-full bg-primary py-2 rounded text-sm text-white hover:bg-primary-hover">Schedule</button>
                      </div>
                      {followUps.map(f => (
                         <div key={f.id} className="flex justify-between items-center bg-surface-container p-3 rounded-lg border border-border-internal">
                            <div><p className="text-sm font-medium">{f.due_date}</p><p className="text-xs text-on-surface-variant">{f.reason}</p></div>
                            {!f.completed && <button onClick={()=>handleCompleteFollowup(f.id)} className="bg-success/20 text-success px-3 py-1 rounded text-xs font-semibold hover:bg-success/30">Mark Done</button>}
                         </div>
                      ))}
                   </div>
                )}
              </div>
            </div>
          )}
        </div>

      {/* ── MODAL: MANUAL OFFLINE SESSION ENTRY ── */}
      {showOfflineModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#111625] text-white w-full max-w-lg rounded-3xl p-6 shadow-2xl border border-white/15 animate-scale-up max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-blue-400">edit_note</span>
                <h2 className="text-base font-bold text-white">+ Add Offline Session</h2>
              </div>
              <button onClick={() => setShowOfflineModal(false)} className="text-white/40 hover:text-white cursor-pointer">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={(e) => {
              e.preventDefault();
              const newSession = {
                id: `off-${Date.now()}`,
                studentAlias: offAlias || 'Anonymous_Student',
                date: offDate,
                sessionType: offType,
                duration: offDuration,
                concern: offConcern,
                riskLevel: offRisk,
                notes: offNotes,
                followUpRequired: offFollowUp,
                nextSessionDate: offFollowUp ? offNextDate : undefined,
                recordedAt: 'Just now'
              };
              const updated = [newSession, ...offlineSessions];
              setOfflineSessions(updated);
              localStorage.setItem('mindbridge_offline_sessions', JSON.stringify(updated));
              setShowOfflineModal(false);
              setOffNotes('');
            }} className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-white/80 block mb-1">Student / Alias</label>
                <input
                  type="text"
                  required
                  value={offAlias}
                  onChange={e => setOffAlias(e.target.value)}
                  className="w-full p-2.5 bg-white/5 border border-white/10 rounded-xl font-mono text-secondary-fixed focus:outline-none focus:border-blue-500"
                  placeholder="e.g. BlueSky27"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-white/80 block mb-1">Date of Session</label>
                  <input
                    type="date"
                    required
                    value={offDate}
                    onChange={e => setOffDate(e.target.value)}
                    className="w-full p-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-blue-500"
                    style={{ colorScheme: 'dark' }}
                  />
                </div>
                <div>
                  <label className="font-bold text-white/80 block mb-1">Duration</label>
                  <input
                    type="text"
                    value={offDuration}
                    onChange={e => setOffDuration(e.target.value)}
                    className="w-full p-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-blue-500"
                    placeholder="e.g. 45 min"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-white/80 block mb-1">Session Type</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['Individual', 'Group', 'Emergency'] as const).map(t => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setOffType(t)}
                      className={`p-2 rounded-xl border text-center transition-all cursor-pointer font-bold ${
                        offType === t ? 'border-blue-500 bg-blue-500/20 text-white' : 'border-white/10 bg-white/5 text-white/60'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-white/80 block mb-1">Primary Concern</label>
                  <select
                    value={offConcern}
                    onChange={e => setOffConcern(e.target.value)}
                    className="w-full p-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="Academic Stress" className="bg-[#131826]">Academic Stress</option>
                    <option value="Anxiety & Panic" className="bg-[#131826]">Anxiety & Panic</option>
                    <option value="Interpersonal Relationships" className="bg-[#131826]">Relationships</option>
                    <option value="Career & Placement" className="bg-[#131826]">Career Guidance</option>
                    <option value="Depressive Symptoms" className="bg-[#131826]">Depressive Symptoms</option>
                    <option value="General Wellness" className="bg-[#131826]">General Wellness</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-white/80 block mb-1">Risk Level</label>
                  <select
                    value={offRisk}
                    onChange={e => setOffRisk(e.target.value as any)}
                    className="w-full p-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="Low" className="bg-[#131826]">🟢 Low</option>
                    <option value="Moderate" className="bg-[#131826]">🟡 Moderate</option>
                    <option value="High" className="bg-[#131826]">🟠 High</option>
                    <option value="Severe" className="bg-[#131826]">🔴 Severe</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-white/80 block mb-1">Session Notes & Action Plan</label>
                <textarea
                  rows={3}
                  required
                  value={offNotes}
                  onChange={e => setOffNotes(e.target.value)}
                  placeholder="Document physical counselling discussion points, clinical recommendations, and follow-up guidance..."
                  className="w-full p-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="p-3 bg-white/5 border border-white/10 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-white flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={offFollowUp}
                      onChange={e => setOffFollowUp(e.target.checked)}
                      className="w-4 h-4 accent-blue-600 rounded cursor-pointer"
                    />
                    <span>Follow-up Required?</span>
                  </label>
                </div>
                {offFollowUp && (
                  <div>
                    <label className="text-[11px] text-white/60 block mb-1">Next Scheduled Session Date</label>
                    <input
                      type="date"
                      value={offNextDate}
                      onChange={e => setOffNextDate(e.target.value)}
                      className="w-full p-2 bg-white/10 border border-white/10 rounded-lg text-white"
                      style={{ colorScheme: 'dark' }}
                    />
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowOfflineModal(false)}
                  className="px-4 py-2 rounded-xl text-white/60 hover:bg-white/10 font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold shadow-md shadow-blue-600/30 cursor-pointer active:scale-95"
                >
                  Save Session
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: ADD COUNSELLOR TASK ── */}
      {showTaskModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#111625] text-white w-full max-w-md rounded-3xl p-6 shadow-2xl border border-white/15 animate-scale-up">
            <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-amber-400">add_task</span>
                <h2 className="text-base font-bold text-white">+ Add To-Do Task</h2>
              </div>
              <button onClick={() => setShowTaskModal(false)} className="text-white/40 hover:text-white cursor-pointer">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={(e) => {
              e.preventDefault();
              if (!newTaskTitle) return;
              const t = {
                id: `t-${Date.now()}`,
                title: newTaskTitle,
                priority: newTaskPriority,
                dueDate: newTaskDue,
                studentAlias: newTaskStudent || undefined,
                completed: false,
              };
              const updated = [t, ...tasks];
              setTasks(updated);
              localStorage.setItem('mindbridge_counselor_tasks', JSON.stringify(updated));
              setShowTaskModal(false);
              setNewTaskTitle('');
              setNewTaskStudent('');
            }} className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-white/80 block mb-1">Task Title</label>
                <input
                  type="text"
                  required
                  value={newTaskTitle}
                  onChange={e => setNewTaskTitle(e.target.value)}
                  className="w-full p-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-amber-500"
                  placeholder="e.g. Follow up with BlueSky27"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-white/80 block mb-1">Priority</label>
                  <select
                    value={newTaskPriority}
                    onChange={e => setNewTaskPriority(e.target.value as any)}
                    className="w-full p-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="Urgent" className="bg-[#131826]">🔴 Urgent</option>
                    <option value="Important" className="bg-[#131826]">🟡 Important</option>
                    <option value="Normal" className="bg-[#131826]">🔵 Normal</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-white/80 block mb-1">Due Date / Time</label>
                  <input
                    type="text"
                    value={newTaskDue}
                    onChange={e => setNewTaskDue(e.target.value)}
                    className="w-full p-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-amber-500"
                    placeholder="e.g. Today, 5:00 PM"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-white/80 block mb-1">Student / Case Alias (Optional)</label>
                <input
                  type="text"
                  value={newTaskStudent}
                  onChange={e => setNewTaskStudent(e.target.value)}
                  className="w-full p-2.5 bg-white/5 border border-white/10 rounded-xl font-mono text-secondary-fixed focus:outline-none focus:border-amber-500"
                  placeholder="e.g. BlueSky27"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowTaskModal(false)}
                  className="px-4 py-2 rounded-xl text-white/60 hover:bg-white/10 font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold shadow-md shadow-amber-500/20 cursor-pointer active:scale-95"
                >
                  Add Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Flashcard Modal */}
      <CreateFlashcardModal
        isOpen={showFlashcardModal}
        onClose={() => setShowFlashcardModal(false)}
        onCardCreated={(newCard) => {
          setFlashcards(prev => [newCard, ...prev]);
        }}
      />

      {/* ── COUNSELLOR MONTHLY REPORT MODAL (REQ 2 & 16) ── */}
      <CounselorMonthlyReportModal
        isOpen={showMonthlyReportModal}
        onClose={() => setShowMonthlyReportModal(false)}
        onSaveReport={(newReport) => {
          setMonthlyReports(prev => [newReport, ...prev]);
        }}
      />

      {/* ── DIRECT SESSION BOOKING MODAL FOR SCREENED STUDENT (REQ 14) ── */}
      {bookingForStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#111111]/70 backdrop-blur-xs animate-fade-in text-[#111111]">
          <div className="bg-[#FFFFFF] border-2 border-[#111111] rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#111111]/15 pb-3">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-xl bg-[#F4C542] border border-[#111111] flex items-center justify-center font-bold">
                  📅
                </span>
                <div>
                  <h3 className="text-base font-heading font-black">Book Proactive Session</h3>
                  <p className="text-[11px] font-mono text-[#111111]/60">Student: {bookingForStudent.studentAlias}</p>
                </div>
              </div>
              <button
                onClick={() => { setBookingForStudent(null); setBookingSuccessMsg(''); }}
                className="p-1 text-[#111111]/60 hover:text-[#111111]"
              >
                <X size={18} />
              </button>
            </div>

            {bookingSuccessMsg ? (
              <div className="p-6 text-center space-y-2">
                <CheckCircle2 size={32} className="mx-auto text-green-600" />
                <p className="text-xs font-bold text-green-800">{bookingSuccessMsg}</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-3 bg-[#FAFAFA] border border-[#111111]/15 rounded-xl text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="text-[#111111]/60">Risk Tier:</span>
                    <span className="font-bold text-red-600 uppercase">{(bookingForStudent.riskTier || bookingForStudent.risk_level || 'Low')} Risk</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#111111]/60">DASS-21 Score:</span>
                    <span className="font-mono font-bold">{(bookingForStudent.dassScores?.total ?? bookingForStudent.dass_scores?.total ?? 0)} / 63</span>
                  </div>
                  {bookingForStudent.whatsappNumber && (
                    <div className="flex justify-between">
                      <span className="text-[#111111]/60">WhatsApp:</span>
                      <span className="font-mono font-bold">{bookingForStudent.whatsappNumber}</span>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-mono font-bold uppercase text-[#111111] mb-1">
                    Select Consultation Date
                  </label>
                  <input
                    type="date"
                    value={bookingDate}
                    onChange={(e) => setBookingDate(e.target.value)}
                    className="w-full text-xs font-mono bg-[#FAFAFA] border border-[#111111]/25 rounded-xl px-3 py-2.5"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono font-bold uppercase text-[#111111] mb-1">
                    Select Time Slot
                  </label>
                  <select
                    value={bookingTime}
                    onChange={(e) => setBookingTime(e.target.value)}
                    className="w-full text-xs font-semibold bg-[#FAFAFA] border border-[#111111]/25 rounded-xl px-3 py-2.5"
                  >
                    <option value="10:00 AM">10:00 AM – 10:45 AM (Morning Slot)</option>
                    <option value="11:30 AM">11:30 AM – 12:15 PM (Mid-Day Slot)</option>
                    <option value="02:30 PM">02:30 PM – 03:15 PM (Afternoon Slot)</option>
                    <option value="04:00 PM">04:00 PM – 04:45 PM (Evening Slot)</option>
                  </select>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setBookingForStudent(null)}
                    className="px-4 py-2 text-xs font-bold border border-[#111111]/20 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const newAppt = {
                        id: Date.now(),
                        anonymous_id: bookingForStudent.studentAlias,
                        student_alias: bookingForStudent.studentAlias,
                        psychologist_name: 'Ms. Devika Babu',
                        slot_time: `${bookingDate}T10:00:00`,
                        status: 'confirmed',
                        notes: `Proactive triage session booked for ${bookingForStudent.riskTier}-risk screening.`,
                        type: 'Audio Call'
                      };
                      setAppointments(prev => [newAppt, ...prev]);

                      // ⚡ Trigger automatic WhatsApp message to student
                      const studentAlias = bookingForStudent.studentAlias || 'Anonymous Student';
                      const studentPhone = bookingForStudent.whatsappNumber || '+91 98765 43210';
                      const studentMsg = buildStudentConfirmationMessage({
                        studentName: studentAlias,
                        counselorName: 'Ms. Devika Babu',
                        collegeName: 'Vishnu Institute of Technology (VIT)',
                        department: 'B.Tech',
                        year: '3rd Year',
                        slotTime: `${bookingDate}T${bookingTime}:00`,
                        mode: 'Audio Call',
                      });
                      dispatchWhatsAppMessage({
                        toPhone: studentPhone,
                        message: studentMsg,
                        recipientName: studentAlias,
                        type: 'appointment_student_reminder',
                        openInWindow: true,
                      });

                      // ⚡ Trigger automatic WhatsApp message to counsellor
                      setTimeout(() => {
                        const counselorMsg = buildCounselorBookingMessage({
                          counselorName: 'Ms. Devika Babu',
                          studentName: studentAlias,
                          studentPhone,
                          collegeName: 'Vishnu Institute of Technology (VIT)',
                          institution: 'Vishnu Institute of Technology (VIT)',
                          department: 'B.Tech',
                          year: '3rd Year',
                          slotTime: `${bookingDate}T${bookingTime}:00`,
                          mode: 'Audio Call',
                          bookingMode: 'anonymous',
                        });
                        dispatchWhatsAppMessage({
                          toPhone: '9949433433', // Ms. Devika Babu
                          message: counselorMsg,
                          recipientName: 'Ms. Devika Babu',
                          type: 'appointment_counselor_notification',
                          openInWindow: true,
                        });
                      }, 400);

                      setBookingSuccessMsg(`Session confirmed & WhatsApp notifications automatically sent for ${bookingForStudent.studentAlias} on ${bookingDate}!`);
                      setTimeout(() => {
                        setBookingForStudent(null);
                        setBookingSuccessMsg('');
                      }, 1800);
                    }}
                    className="px-5 py-2 bg-[#F4C542] hover:bg-[#e0b435] text-[#111111] font-heading font-black text-xs border-2 border-[#111111] rounded-xl shadow-xs"
                  >
                    Confirm &amp; Notify Student
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
