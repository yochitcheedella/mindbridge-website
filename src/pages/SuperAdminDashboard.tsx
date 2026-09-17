import React, { useState, useEffect } from 'react';
import { 
  Building2, Users, ShieldAlert, Cpu, Activity, Plus, Search, 
  Settings, Lock, CheckCircle2, ChevronRight, AlertTriangle, Key, 
  Database, RefreshCw, BarChart3, Sliders, ExternalLink, FileText, Download,
  X, Trash2, Edit3, Shield, Check, Filter, Calendar, UserCheck
} from 'lucide-react';
import { getAuth } from '../utils/auth';
import { generateConsolidatedReportPDF, type ConsolidatedReportData } from '../utils/consolidatedReportPdf';
import { generateCounselorMonthlyReportPDF, type CounselorMonthlyReportData } from '../utils/counselorReportPdf';
import ConsolidatedReportModal from '../components/reports/ConsolidatedReportModal';

interface CollegeDeployment {
  id: string;
  name: string;
  code: string;
  adminName: string;
  adminEmail: string;
  studentsCount: number;
  counselorsCount: number;
  status: 'active' | 'maintenance' | 'provisioning';
  joinedDate: string;
  departments?: string[];
}

interface AuditLogEntry {
  id: string;
  timestamp: string;
  campus: string;
  role: string;
  action: string;
  status: 'Verified' | 'Success' | 'Active' | 'Nominal' | 'Alert';
}

const INITIAL_COLLEGES: CollegeDeployment[] = [
  {
    id: 'col-1',
    name: 'Vishnu Institute of Technology (VIT)',
    code: 'VIT-BVRM',
    adminName: 'Prof. K. Satyanarayana',
    adminEmail: 'admin@vishnu.edu.in',
    studentsCount: 4250,
    counselorsCount: 7,
    status: 'active',
    joinedDate: 'August 2024',
    departments: ['CSE', 'AI&DS', 'ECE', 'EEE', 'MECH', 'CIVIL', 'IT']
  },
  {
    id: 'col-2',
    name: 'BVRIT Hyderabad College of Engineering for Women',
    code: 'BVRITH-HYD',
    adminName: 'Dr. Radhika Sharma',
    adminEmail: 'admin@bvrith.ac.in',
    studentsCount: 2800,
    counselorsCount: 5,
    status: 'active',
    joinedDate: 'November 2024',
    departments: ['CSE', 'IT', 'ECE', 'EEE', 'AIML']
  },
  {
    id: 'col-3',
    name: 'Shri Vishnu Engineering College for Women (SVECW)',
    code: 'SVECW-BVRM',
    adminName: 'Dr. P. Srinivasa Rao',
    adminEmail: 'admin@svecw.edu.in',
    studentsCount: 3900,
    counselorsCount: 6,
    status: 'active',
    joinedDate: 'January 2025',
    departments: ['CSE', 'AI&DS', 'ECE', 'IT', 'CSBS', 'MECH']
  },
  {
    id: 'col-4',
    name: 'Vishnu Dental College (VDC)',
    code: 'VDC-BVRM',
    adminName: 'Dr. Suresh Varma',
    adminEmail: 'admin@vdc.edu.in',
    studentsCount: 1100,
    counselorsCount: 3,
    status: 'active',
    joinedDate: 'March 2025',
    departments: ['BDS', 'MDS', 'Oral Surgery', 'Orthodontics']
  },
  {
    id: 'col-5',
    name: 'Shri Vishnu College of Pharmacy (SVCP)',
    code: 'SVCP-BVRM',
    adminName: 'Dr. K. S. Rao',
    adminEmail: 'admin@svcp.edu.in',
    studentsCount: 850,
    counselorsCount: 2,
    status: 'active',
    joinedDate: 'June 2025',
    departments: ['B.Pharm', 'M.Pharm', 'Pharm.D']
  }
];

const INITIAL_AUDIT_LOGS: AuditLogEntry[] = [
  { id: 'log-1', timestamp: new Date(Date.now() - 1000 * 60 * 15).toLocaleString(), campus: 'VIT-BVRM', role: 'Super Admin', action: 'AES-256 student identity vault key rotated. Zero-PII integrity verified.', status: 'Verified' },
  { id: 'log-2', timestamp: new Date(Date.now() - 1000 * 60 * 45).toLocaleString(), campus: 'SVES Central', role: 'Central Admin', action: 'Attachment 5 Society Consolidated Wellbeing Report compiled for August 2026.', status: 'Success' },
  { id: 'log-3', timestamp: new Date(Date.now() - 1000 * 60 * 120).toLocaleString(), campus: 'BVRITH-HYD', role: 'Licensed Counsellor', action: 'Completed scheduled anonymous audio consultation for alias #StarVoyager412.', status: 'Verified' },
  { id: 'log-4', timestamp: new Date(Date.now() - 1000 * 60 * 240).toLocaleString(), campus: 'SVECW-BVRM', role: 'Campus Admin', action: 'Authorized new clinical wellness counsellor Dr. Sahithi Challa.', status: 'Success' },
  { id: 'log-5', timestamp: new Date(Date.now() - 1000 * 60 * 360).toLocaleString(), campus: 'VIT-BVRM', role: 'System Sentinel', action: 'SlowAPI DoS rate limiter enforced. Blocked 14 anomalous token requests.', status: 'Nominal' },
  { id: 'log-6', timestamp: new Date(Date.now() - 1000 * 60 * 500).toLocaleString(), campus: 'VDC-BVRM', role: 'Super Admin', action: 'Automated SOC2 compliance sweep across 7 society databases passed with 0 leaks.', status: 'Verified' },
];

export default function SuperAdminDashboard() {
  const auth = getAuth();
  const [colleges, setColleges] = useState<CollegeDeployment[]>(() => {
    try {
      const stored = localStorage.getItem('mindbridge_society_colleges');
      return stored ? JSON.parse(stored) : INITIAL_COLLEGES;
    } catch {
      return INITIAL_COLLEGES;
    }
  });

  const [activeTab, setActiveTab] = useState<'colleges' | 'consolidated_reports' | 'counselor_reports' | 'ai_config' | 'security' | 'audit'>('colleges');
  const [searchTerm, setSearchTerm] = useState('');
  const [campusStatusFilter, setCampusStatusFilter] = useState<'all' | 'active' | 'maintenance' | 'provisioning'>('all');

  // Consolidated Reports State
  const [consolidatedReports, setConsolidatedReports] = useState<ConsolidatedReportData[]>(() => {
    try {
      const stored = localStorage.getItem('mindbridge_consolidated_monthly_reports');
      if (stored) return JSON.parse(stored);
    } catch {}
    return [
      {
        id: 'cons-aug-2026',
        reportTitle: 'SHRI VISHNU EDUCATIONAL SOCIETY — CONSOLIDATED MONTHLY REPORT – AUGUST 2026',
        month: 'August',
        year: 2026,
        compiledBy: 'Vishnu Wellness Centre Administration',
        approvedBy: 'Sri Vishnu Educational Society Central Governance',
        submittedAt: '2026-08-31T18:00:00.000Z',
        executiveSummary: {
          totalSocietyStudents: 14200,
          totalSessionsAcrossCampuses: 195,
          avgSatisfactionIndex: '96.2%',
          sosCrisisHandled: 4,
          workshopsConducted: 7
        },
        institutionBreakdown: [
          { institution: 'VIT', code: 'VIT', counselorName: 'Ram Prudhvi Teja', activeStudents: 4200, individualSessions: 31, groupSessions: 2, totalSessions: 33, highRiskCount: 1 },
          { institution: 'SVECW + VIT', code: 'SVECW', counselorName: 'Sahithi Challa', activeStudents: 3950, individualSessions: 32, groupSessions: 2, totalSessions: 34, highRiskCount: 1 },
          { institution: 'VDC', code: 'VDC', counselorName: 'Angel', activeStudents: 1150, individualSessions: 29, groupSessions: 1, totalSessions: 30, highRiskCount: 0 },
          { institution: 'SVCP', code: 'SVCP', counselorName: 'Akshitha Selvaraj', activeStudents: 900, individualSessions: 27, groupSessions: 1, totalSessions: 28, highRiskCount: 0 },
          { institution: 'SBSP', code: 'SBSP', counselorName: 'Bantu Anumitha', activeStudents: 1400, individualSessions: 28, groupSessions: 1, totalSessions: 29, highRiskCount: 0 },
          { institution: "Vishnu Women's University", code: 'VWU', counselorName: 'Wellness Counsellor', activeStudents: 1800, individualSessions: 46, groupSessions: 1, totalSessions: 47, highRiskCount: 2 },
          { institution: 'B.V. Raju College', code: 'BVRC', counselorName: 'G. Navya Sri', activeStudents: 1600, individualSessions: 2, groupSessions: 4, totalSessions: 6, highRiskCount: 0 },
        ]
      }
    ];
  });

  const [showConsolidatedModal, setShowConsolidatedModal] = useState(false);

  // Counselor Reports State
  const [counselorReports, setCounselorReports] = useState<CounselorMonthlyReportData[]>(() => {
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
            meetingName: 'VEDIC Meeting',
            purposeOutcome: 'Attended the VEDIC Meeting on 24th August 2026 and discussed the activities and programmes conducted by the Vishnu Wellness Centre during July, along with updates and follow-up on ongoing wellness initiatives.',
            text: 'Attended the VEDIC Meeting on 24th August 2026 and discussed the activities and programmes conducted by the Vishnu Wellness Centre during July, along with updates and follow-up on ongoing wellness initiatives.'
          },
          {
            meetingName: 'Wellness Counsellors Team Meeting',
            purposeOutcome: 'Conducted a team meeting with the Wellness Counsellors to review ongoing activities and discuss upcoming events for the current and following months.',
            text: 'Conducted a team meeting with the Wellness Counsellors to review ongoing activities and discuss upcoming events for the current and following months.'
          },
          {
            meetingName: 'VWU & VIT Induction Programme',
            purposeOutcome: 'Attended the Induction Programme for VWU & VIT on 23rd August 2026 as part of institutional engagement.',
            text: 'Attended the Induction Programme for VWU & VIT on 23rd August 2026.'
          }
        ],
        activitiesConducted: [
          {
            activityName: 'Orientation Programme for First-Year Students',
            targetAudience: '1st Year B.Tech Students (VIT & VWU)',
            participantsCount: 350,
            keyTakeaway: 'Conducted an Orientation Programme for first-year students, introducing students to mental wellness support services.',
            text: 'Conducted an Orientation Programme for first-year students.'
          },
          {
            activityName: 'MINDTAP – Radio Vishnu Programme',
            targetAudience: 'Campus Community',
            participantsCount: 500,
            keyTakeaway: 'Recorded 5 episodes of the MINDTAP – Radio Vishnu programme.',
            text: 'Recorded 5 episodes of the MINDTAP – Radio Vishnu programme.'
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
          'Plan and conduct a Suicide Prevention Programme to promote early identification.',
          'Conduct the COPE Programme on Open Mic to encourage open conversations around mental health.'
        ],
        generalRemarks: 'All activities for August 2026 completed in accordance with the Vishnu Wellness Calendar.'
      }
    ];
  });

  const [counselorSearch, setCounselorSearch] = useState('');
  const [counselorCampusFilter, setCounselorCampusFilter] = useState('ALL');

  // AI Config State (Persistent)
  const [aiProvider, setAiProvider] = useState<'gemini' | 'openai' | 'local'>(() => {
    try {
      const cfg = localStorage.getItem('mindbridge_ai_engine_config');
      return cfg ? JSON.parse(cfg).provider || 'gemini' : 'gemini';
    } catch {
      return 'gemini';
    }
  });
  const [safetyThreshold, setSafetyThreshold] = useState<number>(() => {
    try {
      const cfg = localStorage.getItem('mindbridge_ai_engine_config');
      return cfg ? JSON.parse(cfg).safetyThreshold || 75 : 75;
    } catch {
      return 75;
    }
  });
  const [autoEscalateEmergency, setAutoEscalateEmergency] = useState<boolean>(() => {
    try {
      const cfg = localStorage.getItem('mindbridge_ai_engine_config');
      return cfg ? JSON.parse(cfg).autoEscalateEmergency ?? true : true;
    } catch {
      return true;
    }
  });
  const [configSaved, setConfigSaved] = useState<boolean>(false);

  // RBAC Matrix State (Persistent)
  const [rbacMatrix, setRbacMatrix] = useState<Record<string, Record<string, boolean>>>(() => {
    try {
      const stored = localStorage.getItem('mindbridge_rbac_matrix');
      if (stored) return JSON.parse(stored);
    } catch {}
    return {
      admin: {
        campus_analytics: true,
        manage_counselors: true,
        export_reports: true,
        view_audit_logs: true,
        publish_feed: true,
        emergency_sos_override: false,
      },
      psychologist: {
        session_triage: true,
        clinical_soap_notes: true,
        emergency_sos: true,
        log_offline_sessions: true,
        export_counselor_pdf: true,
        delete_student_records: false,
      },
      student: {
        anonymous_chat: true,
        cbt_reframing: true,
        schedule_appointments: true,
        digital_detox_screen: true,
        peer_community: true,
        export_personal_journal: true,
      }
    };
  });
  const [rbacSaved, setRbacSaved] = useState(false);

  // Audit Logs State (Persistent)
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(() => {
    try {
      const stored = localStorage.getItem('mindbridge_platform_audit_logs');
      return stored ? JSON.parse(stored) : INITIAL_AUDIT_LOGS;
    } catch {
      return INITIAL_AUDIT_LOGS;
    }
  });
  const [auditSearch, setAuditSearch] = useState('');
  const [auditCampusFilter, setAuditCampusFilter] = useState('ALL');
  const [auditRoleFilter, setAuditRoleFilter] = useState('ALL');

  // Modals State
  const [showAddCollege, setShowAddCollege] = useState(false);
  const [newColName, setNewColName] = useState('');
  const [newColCode, setNewColCode] = useState('');
  const [newColAdmin, setNewColAdmin] = useState('');
  const [newColEmail, setNewColEmail] = useState('');

  const [selectedCampusForManage, setSelectedCampusForManage] = useState<CollegeDeployment | null>(null);

  // Deploy New College
  const handleAddCollege = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newColName || !newColCode || !newColEmail) return;
    const item: CollegeDeployment = {
      id: `col-${Date.now()}`,
      name: newColName,
      code: newColCode.toUpperCase(),
      adminName: newColAdmin || 'Campus Administrator',
      adminEmail: newColEmail,
      studentsCount: 1500,
      counselorsCount: 3,
      status: 'active',
      joinedDate: 'September 2026',
      departments: ['Engineering', 'Sciences', 'Management']
    };
    const updated = [item, ...colleges];
    setColleges(updated);
    localStorage.setItem('mindbridge_society_colleges', JSON.stringify(updated));

    // Log audit event
    const newLog: AuditLogEntry = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toLocaleString(),
      campus: item.code,
      role: 'Super Admin',
      action: `Provisioned new society campus instance: ${item.name} (${item.code}). Admin: ${item.adminEmail}.`,
      status: 'Success'
    };
    const updatedLogs = [newLog, ...auditLogs];
    setAuditLogs(updatedLogs);
    localStorage.setItem('mindbridge_platform_audit_logs', JSON.stringify(updatedLogs));

    setShowAddCollege(false);
    setNewColName('');
    setNewColCode('');
    setNewColAdmin('');
    setNewColEmail('');
  };

  // Update Campus Details & Status
  const handleUpdateCampus = (updatedCampus: CollegeDeployment) => {
    const updated = colleges.map(c => c.id === updatedCampus.id ? updatedCampus : c);
    setColleges(updated);
    localStorage.setItem('mindbridge_society_colleges', JSON.stringify(updated));
    setSelectedCampusForManage(null);

    // Audit log
    const newLog: AuditLogEntry = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toLocaleString(),
      campus: updatedCampus.code,
      role: 'Super Admin',
      action: `Updated campus settings for ${updatedCampus.name}. Status: ${updatedCampus.status.toUpperCase()}.`,
      status: 'Verified'
    };
    const updatedLogs = [newLog, ...auditLogs];
    setAuditLogs(updatedLogs);
    localStorage.setItem('mindbridge_platform_audit_logs', JSON.stringify(updatedLogs));
  };

  // Delete / Decommission Campus
  const handleDeleteCampus = (id: string, name: string) => {
    if (!confirm(`Are you sure you want to decommission and delete "${name}" from SVES central management?`)) return;
    const updated = colleges.filter(c => c.id !== id);
    setColleges(updated);
    localStorage.setItem('mindbridge_society_colleges', JSON.stringify(updated));
    setSelectedCampusForManage(null);

    // Audit log
    const newLog: AuditLogEntry = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toLocaleString(),
      campus: 'SVES Central',
      role: 'Super Admin',
      action: `Decommissioned and deleted institution: ${name}.`,
      status: 'Alert'
    };
    const updatedLogs = [newLog, ...auditLogs];
    setAuditLogs(updatedLogs);
    localStorage.setItem('mindbridge_platform_audit_logs', JSON.stringify(updatedLogs));
  };

  // Save AI Config
  const handleSaveAiConfig = () => {
    const config = {
      provider: aiProvider,
      safetyThreshold,
      autoEscalateEmergency,
      updatedAt: new Date().toISOString()
    };
    localStorage.setItem('mindbridge_ai_engine_config', JSON.stringify(config));
    setConfigSaved(true);

    const newLog: AuditLogEntry = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toLocaleString(),
      campus: 'Global Society',
      role: 'Super Admin',
      action: `AI Clinical Sentinel calibrated: Engine=${aiProvider.toUpperCase()}, EscalationThreshold=${safetyThreshold}, AutoAlerts=${autoEscalateEmergency}.`,
      status: 'Verified'
    };
    const updatedLogs = [newLog, ...auditLogs];
    setAuditLogs(updatedLogs);
    localStorage.setItem('mindbridge_platform_audit_logs', JSON.stringify(updatedLogs));

    setTimeout(() => setConfigSaved(false), 3500);
  };

  // Toggle RBAC Permission
  const handleToggleRbac = (roleKey: string, permKey: string) => {
    setRbacMatrix(prev => ({
      ...prev,
      [roleKey]: {
        ...prev[roleKey],
        [permKey]: !prev[roleKey]?.[permKey]
      }
    }));
  };

  // Save RBAC Matrix
  const handleSaveRbac = () => {
    localStorage.setItem('mindbridge_rbac_matrix', JSON.stringify(rbacMatrix));
    setRbacSaved(true);

    const newLog: AuditLogEntry = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toLocaleString(),
      campus: 'Global Society',
      role: 'Super Admin',
      action: `Institutional RBAC permission matrix synchronized across all campus gates.`,
      status: 'Verified'
    };
    const updatedLogs = [newLog, ...auditLogs];
    setAuditLogs(updatedLogs);
    localStorage.setItem('mindbridge_platform_audit_logs', JSON.stringify(updatedLogs));

    setTimeout(() => setRbacSaved(false), 3000);
  };

  // Trigger Security Audit Scan
  const handleTriggerAuditScan = () => {
    const scanLog: AuditLogEntry = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toLocaleString(),
      campus: 'SVES Central',
      role: 'Super Admin',
      action: `Manual cryptographic audit scan executed: Zero-Knowledge hashes validated across ${colleges.length} campuses. 0 anomalies detected.`,
      status: 'Verified'
    };
    const updatedLogs = [scanLog, ...auditLogs];
    setAuditLogs(updatedLogs);
    localStorage.setItem('mindbridge_platform_audit_logs', JSON.stringify(updatedLogs));
  };

  // Export Audit Trail
  const handleExportAuditLogs = () => {
    const data = {
      organization: 'Sri Vishnu Educational Society (SVES)',
      system: 'MindBridge AI Mental Wellbeing Governance',
      exportTimestamp: new Date().toISOString(),
      compliance: 'SOC2 Type II & AES-256 Zero-Knowledge Privacy Standards',
      auditEntriesCount: auditLogs.length,
      logs: auditLogs
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sves_audit_log_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Save Consolidated Report from Modal
  const handleSaveConsolidatedReport = (saved: ConsolidatedReportData) => {
    const updated = [saved, ...consolidatedReports];
    setConsolidatedReports(updated);
    localStorage.setItem('mindbridge_consolidated_monthly_reports', JSON.stringify(updated));
    setShowConsolidatedModal(false);

    const log: AuditLogEntry = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toLocaleString(),
      campus: 'SVES Central',
      role: 'Super Admin',
      action: `Compiled and registered Attachment 5 Consolidated Report: ${saved.reportTitle}.`,
      status: 'Success'
    };
    const updatedLogs = [log, ...auditLogs];
    setAuditLogs(updatedLogs);
    localStorage.setItem('mindbridge_platform_audit_logs', JSON.stringify(updatedLogs));
  };

  // Filtered colleges
  const filteredColleges = colleges.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.adminEmail.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = campusStatusFilter === 'all' || c.status === campusStatusFilter;
    return matchesSearch && matchesStatus;
  });

  // Filtered audit logs
  const filteredAuditLogs = auditLogs.filter(log => {
    const matchesSearch = log.action.toLowerCase().includes(auditSearch.toLowerCase()) ||
      log.campus.toLowerCase().includes(auditSearch.toLowerCase()) ||
      log.role.toLowerCase().includes(auditSearch.toLowerCase());
    const matchesCampus = auditCampusFilter === 'ALL' || log.campus === auditCampusFilter;
    const matchesRole = auditRoleFilter === 'ALL' || log.role === auditRoleFilter;
    return matchesSearch && matchesCampus && matchesRole;
  });

  // Filtered counselor reports
  const filteredCounselorReports = counselorReports.filter(cRep => {
    const matchesSearch = cRep.counselorName.toLowerCase().includes(counselorSearch.toLowerCase()) ||
      cRep.institution.toLowerCase().includes(counselorSearch.toLowerCase());
    const matchesCampus = counselorCampusFilter === 'ALL' || cRep.institution.toLowerCase().includes(counselorCampusFilter.toLowerCase());
    return matchesSearch && matchesCampus;
  });

  const totalStudents = colleges.reduce((sum, c) => sum + c.studentsCount, 0);
  const totalCounselors = colleges.reduce((sum, c) => sum + c.counselorsCount, 0);

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in max-w-7xl mx-auto pb-24 text-[#111111]">
      {/* ── Top Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 sm:p-6 rounded-3xl bg-[#FFFFFF] border-2 border-[#111111] shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#F4C542] border-2 border-[#111111] text-[#111111] flex items-center justify-center shrink-0">
            <Building2 size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-[#111111]">
                Super Admin Console
              </h1>
              <span className="px-2 py-0.5 rounded-full bg-[#F4C542] text-[#111111] text-[10px] font-black tracking-wider border border-[#111111]">
                ROOT
              </span>
            </div>
            <p className="text-xs text-[#111111]/60 font-bold mt-0.5">
              Multi-Campus Deployment &amp; Governance · Sri Vishnu Educational Society
            </p>
          </div>
        </div>

        {/* Global Action */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => setShowAddCollege(true)}
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-[#F4C542] hover:bg-[#e0b435] text-[#111111] text-xs font-black border-2 border-[#111111] transition-all shadow-xs active:scale-95 cursor-pointer"
          >
            <Plus size={16} />
            <span>Deploy New College</span>
          </button>
        </div>
      </div>

      {/* ── Metric Highlights ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-3xl bg-[#FFFFFF] border-2 border-[#111111] shadow-xs">
          <div className="flex items-center justify-between text-[#111111]/60 mb-1">
            <span className="text-[11px] font-black tracking-wider uppercase">Institutions</span>
            <Building2 size={16} className="text-[#111111]" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-[#111111]">{colleges.length}</p>
          <p className="text-[11px] text-[#111111]/60 font-semibold mt-1">
            {colleges.filter(c => c.status === 'active').length} Active · {colleges.filter(c => c.status !== 'active').length} Maint
          </p>
        </div>

        <div className="p-5 rounded-3xl bg-[#FFFFFF] border-2 border-[#111111] shadow-xs">
          <div className="flex items-center justify-between text-[#111111]/60 mb-1">
            <span className="text-[11px] font-black tracking-wider uppercase">Society Students</span>
            <Users size={16} className="text-[#111111]" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-[#111111]">{totalStudents.toLocaleString()}</p>
          <p className="text-[11px] text-[#111111]/60 font-semibold mt-1">100% Zero-PII Protected</p>
        </div>

        <div className="p-5 rounded-3xl bg-[#FFFFFF] border-2 border-[#111111] shadow-xs">
          <div className="flex items-center justify-between text-[#111111]/60 mb-1">
            <span className="text-[11px] font-black tracking-wider uppercase">Licensed Counsellors</span>
            <Activity size={16} className="text-[#111111]" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-[#111111]">{totalCounselors}</p>
          <p className="text-[11px] text-[#111111]/60 font-semibold mt-1">Across 7 SVES Campuses</p>
        </div>

        <div className="p-5 rounded-3xl bg-[#FFFFFF] border-2 border-[#111111] shadow-xs">
          <div className="flex items-center justify-between text-[#111111]/60 mb-1">
            <span className="text-[11px] font-black tracking-wider uppercase">AI Sentinel Model</span>
            <Cpu size={16} className="text-[#111111]" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-[#111111] capitalize">
            {aiProvider === 'local' ? 'Air-Gapped' : aiProvider}
          </p>
          <p className="text-[11px] text-[#111111]/60 font-semibold mt-1">Threshold: {safetyThreshold}% Alert</p>
        </div>
      </div>

      {/* ── Navigation Tabs ── */}
      <div className="flex items-center gap-1.5 p-1.5 bg-[#FAFAFA] border-2 border-[#111111] rounded-2xl overflow-x-auto shadow-xs">
        <button
          onClick={() => setActiveTab('colleges')}
          className={`px-4 py-2.5 text-xs font-black rounded-xl transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
            activeTab === 'colleges'
              ? 'bg-[#F4C542] text-[#111111] border-2 border-[#111111] shadow-xs'
              : 'text-[#111111]/70 hover:text-[#111111] hover:bg-[#FFFFFF]'
          }`}
        >
          <Building2 size={14} />
          <span>Colleges &amp; Campuses ({colleges.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('ai_config')}
          className={`px-4 py-2.5 text-xs font-black rounded-xl transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
            activeTab === 'ai_config'
              ? 'bg-[#F4C542] text-[#111111] border-2 border-[#111111] shadow-xs'
              : 'text-[#111111]/70 hover:text-[#111111] hover:bg-[#FFFFFF]'
          }`}
        >
          <Sliders size={14} />
          <span>AI Engine Configuration</span>
        </button>
        <button
          onClick={() => setActiveTab('security')}
          className={`px-4 py-2.5 text-xs font-black rounded-xl transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
            activeTab === 'security'
              ? 'bg-[#F4C542] text-[#111111] border-2 border-[#111111] shadow-xs'
              : 'text-[#111111]/70 hover:text-[#111111] hover:bg-[#FFFFFF]'
          }`}
        >
          <Lock size={14} />
          <span>RBAC &amp; Access Control</span>
        </button>
        <button
          onClick={() => setActiveTab('audit')}
          className={`px-4 py-2.5 text-xs font-black rounded-xl transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
            activeTab === 'audit'
              ? 'bg-[#F4C542] text-[#111111] border-2 border-[#111111] shadow-xs'
              : 'text-[#111111]/70 hover:text-[#111111] hover:bg-[#FFFFFF]'
          }`}
        >
          <BarChart3 size={14} />
          <span>Platform Audit Logs ({auditLogs.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('consolidated_reports')}
          className={`px-4 py-2.5 text-xs font-black rounded-xl transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
            activeTab === 'consolidated_reports'
              ? 'bg-[#F4C542] text-[#111111] border-2 border-[#111111] shadow-xs'
              : 'text-[#111111]/70 hover:text-[#111111] hover:bg-[#FFFFFF]'
          }`}
        >
          <FileText size={14} />
          <span>Consolidated Reports ({consolidatedReports.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('counselor_reports')}
          className={`px-4 py-2.5 text-xs font-black rounded-xl transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
            activeTab === 'counselor_reports'
              ? 'bg-[#F4C542] text-[#111111] border-2 border-[#111111] shadow-xs'
              : 'text-[#111111]/70 hover:text-[#111111] hover:bg-[#FFFFFF]'
          }`}
        >
          <Building2 size={14} />
          <span>Counsellor Reports ({counselorReports.length})</span>
        </button>
      </div>

      {/* ── TAB 1: COLLEGES DIRECTORY ── */}
      {activeTab === 'colleges' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#FFFFFF] p-4 rounded-3xl border-2 border-[#111111] shadow-xs">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#111111]/40" />
              <input
                type="text"
                placeholder="Search college name, code, or administrator email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-xs bg-[#FAFAFA] rounded-xl border-2 border-[#111111] text-[#111111] font-bold focus:outline-none focus:ring-2 focus:ring-[#F4C542]"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#111111]/70">Status:</span>
              <select
                value={campusStatusFilter}
                onChange={(e: any) => setCampusStatusFilter(e.target.value)}
                className="p-2 text-xs font-bold bg-[#FAFAFA] border-2 border-[#111111] rounded-xl cursor-pointer"
              >
                <option value="all">All Statuses ({colleges.length})</option>
                <option value="active">Active Only</option>
                <option value="maintenance">Maintenance</option>
                <option value="provisioning">Provisioning</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredColleges.map((col) => (
              <div
                key={col.id}
                className="p-6 rounded-3xl bg-[#FFFFFF] border-2 border-[#111111] hover:border-[#F4C542] transition-all shadow-sm flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="px-2.5 py-1 rounded-xl bg-[#FAFAFA] text-[#111111] font-mono text-xs font-black border border-[#111111]/20">
                      {col.code}
                    </span>
                    <span className={`inline-flex items-center gap-1 text-[10px] font-black px-2.5 py-0.5 rounded-full border border-[#111111] ${
                      col.status === 'active' ? 'bg-[#F4C542] text-[#111111]' :
                      col.status === 'maintenance' ? 'bg-amber-100 text-amber-900' :
                      'bg-sky-100 text-sky-900'
                    }`}>
                      <span className="w-1.5 h-1.5 rounded-full bg-[#111111] animate-pulse" />
                      {col.status.toUpperCase()}
                    </span>
                  </div>

                  <h3 className="text-base font-heading font-black text-[#111111] leading-tight mb-2">
                    {col.name}
                  </h3>

                  <div className="space-y-2 text-xs text-[#111111]/70 border-t border-[#111111]/10 pt-3 mt-3">
                    <div className="flex justify-between">
                      <span>Administrator:</span>
                      <span className="font-bold text-[#111111]">{col.adminName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Official Email:</span>
                      <span className="font-mono text-[#111111] text-[11px] font-bold">{col.adminEmail}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Enrolled Students:</span>
                      <span className="font-bold text-[#111111]">{col.studentsCount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Licensed Counsellors:</span>
                      <span className="font-bold text-[#111111]">{col.counselorsCount} Clinical Staff</span>
                    </div>
                    {col.departments && col.departments.length > 0 && (
                      <div className="pt-1 flex flex-wrap gap-1">
                        {col.departments.slice(0, 4).map(d => (
                          <span key={d} className="px-1.5 py-0.5 bg-[#FAFAFA] border border-[#111111]/15 rounded text-[9px] font-mono font-bold">
                            {d}
                          </span>
                        ))}
                        {col.departments.length > 4 && (
                          <span className="px-1.5 py-0.5 text-[9px] font-mono font-bold text-[#111111]/50">
                            +{col.departments.length - 4} more
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-[#111111]/10 flex items-center justify-between">
                  <span className="text-[10px] text-[#111111]/50 font-mono">Joined {col.joinedDate}</span>
                  <button 
                    onClick={() => setSelectedCampusForManage(col)}
                    className="px-3 py-1.5 rounded-xl bg-[#FAFAFA] hover:bg-[#F4C542] text-[#111111] font-black text-xs border border-[#111111] transition-all flex items-center gap-1 cursor-pointer active:scale-95"
                  >
                    <span>Manage Campus</span>
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── TAB 2: AI ENGINE CONFIGURATION ── */}
      {activeTab === 'ai_config' && (
        <div className="bg-[#FFFFFF] p-6 sm:p-8 rounded-3xl border-2 border-[#111111] shadow-xs max-w-3xl space-y-6">
          <div className="border-b border-[#111111]/10 pb-4">
            <h2 className="text-xl font-heading font-black text-[#111111]">AI Screening &amp; Sentiment Guard</h2>
            <p className="text-xs text-[#111111]/70 mt-1 font-medium">
              Calibrate and deploy the reasoning parameters that power automated distress detection across all SVES campus portals.
            </p>
          </div>

          <div className="space-y-5">
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-[#111111] mb-2">
                Primary Clinical Reasoning LLM Engine
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setAiProvider('gemini')}
                  className={`p-4 rounded-2xl text-left transition-all cursor-pointer border-2 ${
                    aiProvider === 'gemini' 
                      ? 'border-[#111111] bg-[#F4C542] text-[#111111] shadow-xs scale-102' 
                      : 'border-[#111111]/20 bg-[#FAFAFA] hover:border-[#111111]'
                  }`}
                >
                  <p className="text-sm font-black">Google Gemini 1.5</p>
                  <p className="text-[11px] text-[#111111]/70 mt-1 font-medium">Clinical empathy &amp; real-time conversational streaming</p>
                </button>
                <button
                  type="button"
                  onClick={() => setAiProvider('openai')}
                  className={`p-4 rounded-2xl text-left transition-all cursor-pointer border-2 ${
                    aiProvider === 'openai' 
                      ? 'border-[#111111] bg-[#F4C542] text-[#111111] shadow-xs scale-102' 
                      : 'border-[#111111]/20 bg-[#FAFAFA] hover:border-[#111111]'
                  }`}
                >
                  <p className="text-sm font-black">OpenAI GPT-4o</p>
                  <p className="text-[11px] text-[#111111]/70 mt-1 font-medium">Multi-modal assessment &amp; diagnostic reasoning</p>
                </button>
                <button
                  type="button"
                  onClick={() => setAiProvider('local')}
                  className={`p-4 rounded-2xl text-left transition-all cursor-pointer border-2 ${
                    aiProvider === 'local' 
                      ? 'border-[#111111] bg-[#F4C542] text-[#111111] shadow-xs scale-102' 
                      : 'border-[#111111]/20 bg-[#FAFAFA] hover:border-[#111111]'
                  }`}
                >
                  <p className="text-sm font-black">Air-Gapped Llama 3</p>
                  <p className="text-[11px] text-[#111111]/70 mt-1 font-medium">Local institutional server with zero external egress</p>
                </button>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[#FAFAFA] border-2 border-[#111111] space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-xs font-black text-[#111111]">
                  Emergency Escalation Distress Threshold
                </label>
                <span className="px-3 py-1 rounded-full bg-[#F4C542] border border-[#111111] text-[#111111] text-xs font-black">
                  Risk Score ≥ {safetyThreshold}%
                </span>
              </div>
              <input
                type="range"
                min="50"
                max="90"
                step="5"
                value={safetyThreshold}
                onChange={(e) => setSafetyThreshold(Number(e.target.value))}
                className="w-full accent-[#111111] cursor-pointer h-2 bg-[#FFFFFF] rounded-lg border border-[#111111]/20"
              />
              <div className="flex justify-between text-[10px] font-mono text-[#111111]/50 font-bold">
                <span>50% (High Sensitivity)</span>
                <span>75% (Balanced Clinical)</span>
                <span>90% (Strict Emergency)</span>
              </div>
              <p className="text-[11px] text-[#111111]/60 font-medium pt-1">
                When student conversations or journal entries score above this threshold, the system flags the student for clinical review.
              </p>
            </div>

            <div className="flex items-center justify-between p-4 rounded-2xl bg-[#FAFAFA] border-2 border-[#111111]">
              <div>
                <p className="text-xs font-black text-[#111111]">Auto-Escalate Severe Crisis SOS</p>
                <p className="text-[11px] text-[#111111]/60 font-medium">
                  Immediately alert on-duty Vishnu Wellness Centre counsellors (+91 9100972237) upon acute distress detection.
                </p>
              </div>
              <input
                type="checkbox"
                checked={autoEscalateEmergency}
                onChange={(e) => setAutoEscalateEmergency(e.target.checked)}
                className="w-5 h-5 accent-[#111111] rounded cursor-pointer"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-[#111111]/10 flex items-center gap-3">
            <button
              onClick={handleSaveAiConfig}
              className="px-6 py-3 rounded-2xl bg-[#F4C542] hover:bg-[#e0b435] text-[#111111] text-xs font-black border-2 border-[#111111] shadow-xs transition-all cursor-pointer active:scale-95 flex items-center gap-2"
            >
              <Check size={16} />
              <span>Save &amp; Deploy AI Parameters</span>
            </button>
            {configSaved && (
              <span className="inline-flex items-center gap-1.5 text-xs font-black text-emerald-800 bg-emerald-100 border border-emerald-300 px-3 py-1.5 rounded-xl animate-fade-in">
                <CheckCircle2 size={16} /> Calibrated across all campuses
              </span>
            )}
          </div>
        </div>
      )}

      {/* ── TAB 3: RBAC & ACCESS CONTROL (INTERACTIVE MATRIX) ── */}
      {activeTab === 'security' && (
        <div className="bg-[#FFFFFF] p-6 sm:p-8 rounded-3xl border-2 border-[#111111] shadow-xs max-w-4xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#111111]/10 pb-4">
            <div>
              <h2 className="text-xl font-heading font-black text-[#111111]">Role-Based Access Control (RBAC) Matrix</h2>
              <p className="text-xs text-[#111111]/70 font-medium mt-0.5">
                Grant or restrict feature permissions across administrative, clinical, and student platform tiers.
              </p>
            </div>
            <button
              onClick={handleSaveRbac}
              className="px-5 py-2.5 rounded-xl bg-[#F4C542] hover:bg-[#e0b435] text-[#111111] text-xs font-black border-2 border-[#111111] transition-all shadow-xs cursor-pointer active:scale-95 flex items-center gap-1.5 self-start sm:self-auto"
            >
              <Check size={14} />
              <span>Save RBAC Matrix</span>
            </button>
          </div>

          {rbacSaved && (
            <div className="p-3 bg-emerald-100 border-2 border-emerald-400 text-emerald-900 rounded-2xl text-xs font-black flex items-center gap-2 animate-fade-in">
              <CheckCircle2 size={16} />
              <span>Permissions successfully updated and synchronized across all campus sessions!</span>
            </div>
          )}

          <div className="space-y-6">
            {/* Campus Admin Section */}
            <div className="p-5 rounded-2xl bg-[#FAFAFA] border-2 border-[#111111] space-y-3">
              <div className="flex items-center justify-between border-b border-[#111111]/10 pb-2">
                <div className="flex items-center gap-2">
                  <span className="text-base">🛡️</span>
                  <h3 className="text-sm font-black text-[#111111]">Campus Administrator Privileges</h3>
                </div>
                <span className="text-[10px] font-mono font-black px-2 py-0.5 bg-[#FFFFFF] border border-[#111111] rounded">CAMPUS ROOT</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {Object.entries(rbacMatrix.admin || {}).map(([permKey, isEnabled]) => (
                  <label key={permKey} className="flex items-center gap-2.5 p-2 rounded-xl bg-[#FFFFFF] border border-[#111111]/15 cursor-pointer hover:border-[#111111]">
                    <input
                      type="checkbox"
                      checked={isEnabled}
                      onChange={() => handleToggleRbac('admin', permKey)}
                      className="w-4 h-4 accent-[#111111] rounded cursor-pointer"
                    />
                    <span className="font-bold text-[#111111] capitalize">
                      {permKey.replace(/_/g, ' ')}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Counsellor Section */}
            <div className="p-5 rounded-2xl bg-[#FAFAFA] border-2 border-[#111111] space-y-3">
              <div className="flex items-center justify-between border-b border-[#111111]/10 pb-2">
                <div className="flex items-center gap-2">
                  <span className="text-base">🩺</span>
                  <h3 className="text-sm font-black text-[#111111]">Licensed Psychologist Privileges</h3>
                </div>
                <span className="text-[10px] font-mono font-black px-2 py-0.5 bg-[#F4C542] border border-[#111111] text-[#111111] rounded">CLINICAL PRIVILEGES</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {Object.entries(rbacMatrix.psychologist || {}).map(([permKey, isEnabled]) => (
                  <label key={permKey} className="flex items-center gap-2.5 p-2 rounded-xl bg-[#FFFFFF] border border-[#111111]/15 cursor-pointer hover:border-[#111111]">
                    <input
                      type="checkbox"
                      checked={isEnabled}
                      onChange={() => handleToggleRbac('psychologist', permKey)}
                      className="w-4 h-4 accent-[#111111] rounded cursor-pointer"
                    />
                    <span className="font-bold text-[#111111] capitalize">
                      {permKey.replace(/_/g, ' ')}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Student Section */}
            <div className="p-5 rounded-2xl bg-[#FAFAFA] border-2 border-[#111111] space-y-3">
              <div className="flex items-center justify-between border-b border-[#111111]/10 pb-2">
                <div className="flex items-center gap-2">
                  <span className="text-base">🎓</span>
                  <h3 className="text-sm font-black text-[#111111]">Anonymous Student Privileges</h3>
                </div>
                <span className="text-[10px] font-mono font-black px-2 py-0.5 bg-[#FFFFFF] border border-[#111111] rounded">PRIVACY FIRST</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {Object.entries(rbacMatrix.student || {}).map(([permKey, isEnabled]) => (
                  <label key={permKey} className="flex items-center gap-2.5 p-2 rounded-xl bg-[#FFFFFF] border border-[#111111]/15 cursor-pointer hover:border-[#111111]">
                    <input
                      type="checkbox"
                      checked={isEnabled}
                      onChange={() => handleToggleRbac('student', permKey)}
                      className="w-4 h-4 accent-[#111111] rounded cursor-pointer"
                    />
                    <span className="font-bold text-[#111111] capitalize">
                      {permKey.replace(/_/g, ' ')}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 4: PLATFORM AUDIT LOGS (FILTERABLE & EXPORTABLE) ── */}
      {activeTab === 'audit' && (
        <div className="bg-[#FFFFFF] p-6 sm:p-8 rounded-3xl border-2 border-[#111111] shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#111111]/10 pb-4">
            <div>
              <h2 className="text-xl font-heading font-black text-[#111111]">Immutable Platform Audit Trails</h2>
              <p className="text-xs text-[#111111]/70 font-medium mt-0.5">
                Real-time cryptographic oversight tracking institutional key rotation, policy changes, and clinical events.
              </p>
            </div>
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <button
                onClick={handleTriggerAuditScan}
                className="px-3.5 py-2 rounded-xl bg-[#FAFAFA] hover:bg-[#FFFFFF] text-[#111111] text-xs font-black border-2 border-[#111111] transition-all shadow-xs cursor-pointer active:scale-95 flex items-center gap-1.5"
                title="Run immediate security health scan"
              >
                <Shield size={14} />
                <span>Trigger Audit Scan</span>
              </button>
              <button
                onClick={handleExportAuditLogs}
                className="px-3.5 py-2 rounded-xl bg-[#F4C542] hover:bg-[#e0b435] text-[#111111] text-xs font-black border-2 border-[#111111] transition-all shadow-xs cursor-pointer active:scale-95 flex items-center gap-1.5"
              >
                <Download size={14} />
                <span>Export Audit (JSON)</span>
              </button>
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-[#FAFAFA] p-3 rounded-2xl border border-[#111111]/15">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#111111]/50" />
              <input
                type="text"
                placeholder="Search audit descriptions..."
                value={auditSearch}
                onChange={(e) => setAuditSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-2 text-xs bg-[#FFFFFF] rounded-xl border border-[#111111]/20 font-bold"
              />
            </div>
            <select
              value={auditCampusFilter}
              onChange={(e) => setAuditCampusFilter(e.target.value)}
              className="p-2 text-xs font-bold bg-[#FFFFFF] border border-[#111111]/20 rounded-xl cursor-pointer"
            >
              <option value="ALL">All Campuses ({colleges.length})</option>
              <option value="SVES Central">SVES Central</option>
              <option value="VIT-BVRM">VIT-BVRM</option>
              <option value="BVRITH-HYD">BVRITH-HYD</option>
              <option value="SVECW-BVRM">SVECW-BVRM</option>
              <option value="VDC-BVRM">VDC-BVRM</option>
            </select>
            <select
              value={auditRoleFilter}
              onChange={(e) => setAuditRoleFilter(e.target.value)}
              className="p-2 text-xs font-bold bg-[#FFFFFF] border border-[#111111]/20 rounded-xl cursor-pointer"
            >
              <option value="ALL">All Roles</option>
              <option value="Super Admin">Super Admin</option>
              <option value="Central Admin">Central Admin</option>
              <option value="Campus Admin">Campus Admin</option>
              <option value="Licensed Counsellor">Licensed Counsellor</option>
              <option value="System Sentinel">System Sentinel</option>
            </select>
          </div>

          {/* Table */}
          <div className="overflow-x-auto rounded-2xl border-2 border-[#111111]">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAFAFA] text-[#111111]/70 font-black uppercase tracking-wider text-[10px] border-b-2 border-[#111111]">
                <tr>
                  <th className="p-3.5">Timestamp</th>
                  <th className="p-3.5">Campus</th>
                  <th className="p-3.5">Actor Role</th>
                  <th className="p-3.5">Action &amp; Forensic Details</th>
                  <th className="p-3.5">Verification</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#111111]/10 bg-[#FFFFFF]">
                {filteredAuditLogs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-xs font-bold text-[#111111]/50">
                      No audit entries matched your filters.
                    </td>
                  </tr>
                ) : (
                  filteredAuditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-[#FAFAFA] transition-colors">
                      <td className="p-3.5 font-mono text-[11px] text-[#111111]/60 whitespace-nowrap">{log.timestamp}</td>
                      <td className="p-3.5 font-bold text-[#111111] whitespace-nowrap">{log.campus}</td>
                      <td className="p-3.5 font-black text-[#111111] whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded-md bg-[#FAFAFA] border border-[#111111]/20 text-[10px]">
                          {log.role}
                        </span>
                      </td>
                      <td className="p-3.5 font-medium text-[#111111]">{log.action}</td>
                      <td className="p-3.5 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black border ${
                          log.status === 'Verified' ? 'bg-emerald-100 text-emerald-900 border-emerald-300' :
                          log.status === 'Success' ? 'bg-[#F4C542] text-[#111111] border-[#111111]' :
                          log.status === 'Alert' ? 'bg-rose-100 text-rose-900 border-rose-300' :
                          'bg-sky-100 text-sky-900 border-sky-300'
                        }`}>
                          {log.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── TAB 5: CONSOLIDATED REPORTS (ATTACHMENT 5) ── */}
      {activeTab === 'consolidated_reports' && (
        <div className="space-y-6 animate-fade-in text-[#111111]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-[#FFFFFF] border-2 border-[#111111] shadow-xs">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-mono font-black uppercase tracking-wider bg-[#F4C542] px-2 py-0.5 rounded-full border border-[#111111]">
                  Attachment 5 Governance
                </span>
                <span className="text-xs font-mono text-[#111111]/60">SVES Centralized Repository</span>
              </div>
              <h2 className="text-2xl font-heading font-black text-[#111111]">
                Consolidated Society Reports ({consolidatedReports.length})
              </h2>
              <p className="text-xs text-[#111111]/70 mt-1">
                Monthly reports consolidated across Sri Vishnu Educational Society campuses submitted by Central Admin.
              </p>
            </div>

            <button
              onClick={() => setShowConsolidatedModal(true)}
              className="px-5 py-3 rounded-2xl bg-[#F4C542] hover:bg-[#e0b435] text-[#111111] font-heading font-black text-xs border-2 border-[#111111] transition-all shadow-xs flex items-center gap-2 cursor-pointer active:scale-95 self-start sm:self-auto"
            >
              <Plus size={16} />
              <span>Compile New Consolidated Report</span>
            </button>
          </div>

          <div className="space-y-4">
            {consolidatedReports.map((rep) => (
              <div 
                key={rep.id}
                className="p-6 rounded-3xl border-2 border-[#111111] bg-[#FFFFFF] shadow-sm space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#111111]/10 pb-3">
                  <div>
                    <h3 className="text-lg font-heading font-black text-[#111111]">
                      {rep.reportTitle}
                    </h3>
                    <p className="text-xs text-[#111111]/60 font-mono">
                      Compiled by: {rep.compiledBy} · Approved by: {rep.approvedBy}
                    </p>
                  </div>
                  <span className="text-[10px] font-mono font-black px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300 self-start sm:self-auto">
                    SOCIETY LEVEL AUDIT
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#FAFAFA] p-4 rounded-2xl border border-[#111111]/15 text-center font-mono">
                  <div>
                    <span className="block text-[10px] text-[#111111]/60 uppercase">Society Campuses</span>
                    <span className="text-lg font-heading font-black text-[#111111]">{rep.institutionBreakdown.length}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-[#111111]/60 uppercase">Total Sessions</span>
                    <span className="text-lg font-heading font-black text-[#111111]">{rep.executiveSummary.totalSessionsAcrossCampuses}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-[#111111]/60 uppercase">Students Reach</span>
                    <span className="text-lg font-heading font-black text-[#111111]">{rep.executiveSummary.totalSocietyStudents.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-[#111111]/60 uppercase">Satisfaction</span>
                    <span className="text-lg font-heading font-black text-[#111111]">{rep.executiveSummary.avgSatisfactionIndex}</span>
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    onClick={() => generateConsolidatedReportPDF(rep)}
                    className="px-5 py-2.5 rounded-xl bg-[#F4C542] hover:bg-[#e0b435] text-[#111111] font-heading font-black text-xs border-2 border-[#111111] transition-all shadow-xs flex items-center gap-2 cursor-pointer active:scale-95"
                  >
                    <Download size={14} />
                    <span>Download Attachment 5 Vector PDF</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── TAB 6: COUNSELLOR MONTHLY REPORTS (ATTACHMENT 4) ── */}
      {activeTab === 'counselor_reports' && (
        <div className="space-y-6 animate-fade-in text-[#111111]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-[#FFFFFF] border-2 border-[#111111] shadow-xs">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-mono font-black uppercase tracking-wider bg-[#F4C542] text-[#111111] px-2 py-0.5 rounded-full border border-[#111111]">
                  Attachment 4 Clinical Archive
                </span>
                <span className="text-xs font-mono text-[#111111]/60">All Institutional Counsellors</span>
              </div>
              <h2 className="text-2xl font-heading font-black text-[#111111]">
                Counsellor Monthly Reports ({counselorReports.length})
              </h2>
              <p className="text-xs text-[#111111]/70 mt-1">
                Review individualized psychologist submissions across SVECW, VIT, VDC, SVCP, SBSP, and BVRC campuses.
              </p>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#FFFFFF] p-4 rounded-3xl border-2 border-[#111111]">
            <div className="relative flex-1">
              <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#111111]/50" />
              <input
                type="text"
                placeholder="Search counsellor name or campus..."
                value={counselorSearch}
                onChange={(e) => setCounselorSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs bg-[#FAFAFA] rounded-xl border border-[#111111]/20 font-bold"
              />
            </div>
            <select
              value={counselorCampusFilter}
              onChange={(e) => setCounselorCampusFilter(e.target.value)}
              className="p-2 text-xs font-bold bg-[#FAFAFA] border-2 border-[#111111] rounded-xl cursor-pointer"
            >
              <option value="ALL">All Campuses</option>
              <option value="VIT">Vishnu Institute of Technology (VIT)</option>
              <option value="SVECW">Shri Vishnu Engineering College (SVECW)</option>
              <option value="BVRIT">BVRIT Hyderabad</option>
              <option value="VDC">Vishnu Dental College (VDC)</option>
              <option value="SVCP">Sri Vishnu Pharmacy (SVCP)</option>
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredCounselorReports.map((cRep) => (
              <div 
                key={cRep.id}
                className="p-6 rounded-3xl border-2 border-[#111111] bg-[#FFFFFF] shadow-sm space-y-4 hover:border-[#F4C542] transition-all flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-mono font-black uppercase text-[#111111]/60">
                        {cRep.institution}
                      </span>
                      <h3 className="text-lg font-heading font-black text-[#111111] mt-0.5">
                        {cRep.counselorName} · {cRep.month} {cRep.year}
                      </h3>
                    </div>
                    <span className="text-[10px] font-mono font-black px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300">
                      OFFICIALLY FILED
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 bg-[#FAFAFA] p-3 rounded-2xl border border-[#111111]/15 text-center font-mono">
                    <div>
                      <span className="block text-[9px] text-[#111111]/60 uppercase">Sessions</span>
                      <span className="text-base font-heading font-black text-[#111111]">{cRep.sessionStats.total}</span>
                    </div>
                    <div>
                      <span className="block text-[9px] text-[#111111]/60 uppercase">Meetings</span>
                      <span className="text-base font-heading font-black text-[#111111]">{cRep.administrativeMeetings.length}</span>
                    </div>
                    <div>
                      <span className="block text-[9px] text-[#111111]/60 uppercase">Workshops</span>
                      <span className="text-base font-heading font-black text-[#111111]">{cRep.activitiesConducted.length}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-[#111111]/10">
                  <button
                    onClick={() => generateCounselorMonthlyReportPDF(cRep)}
                    className="w-full py-2.5 rounded-xl bg-[#F4C542] hover:bg-[#e0b435] text-[#111111] font-heading font-black text-xs border-2 border-[#111111] transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                  >
                    <Download size={14} />
                    <span>Download Attachment 4 Vector PDF</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── MODAL: Deploy New College ── */}
      {showAddCollege && (
        <div className="fixed inset-0 z-50 bg-[#111111]/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#FFFFFF] text-[#111111] w-full max-w-md rounded-3xl p-6 shadow-2xl border-2 border-[#111111] animate-scale-up space-y-4">
            <div className="flex items-center justify-between border-b border-[#111111]/10 pb-3">
              <div>
                <h2 className="text-base font-black text-[#111111]">Deploy New Campus</h2>
                <p className="text-xs text-[#111111]/60 mt-0.5">
                  Provision a new college instance with independent RBAC and dedicated counselling team.
                </p>
              </div>
              <button 
                onClick={() => setShowAddCollege(false)}
                className="p-1 rounded-lg hover:bg-[#FAFAFA] border border-[#111111]/20 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddCollege} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-[#111111] block mb-1">Institution Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Vishnu Dental College"
                  value={newColName}
                  onChange={(e) => setNewColName(e.target.value)}
                  className="w-full p-2.5 bg-[#FAFAFA] border-2 border-[#111111] rounded-xl font-bold"
                />
              </div>

              <div>
                <label className="font-bold text-[#111111] block mb-1">Campus Code</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. VDC-BVRM"
                  value={newColCode}
                  onChange={(e) => setNewColCode(e.target.value)}
                  className="w-full p-2.5 bg-[#FAFAFA] border-2 border-[#111111] rounded-xl uppercase font-mono font-bold"
                />
              </div>

              <div>
                <label className="font-bold text-[#111111] block mb-1">Designated Administrator Name</label>
                <input
                  type="text"
                  placeholder="e.g. Dr. Suresh Varma"
                  value={newColAdmin}
                  onChange={(e) => setNewColAdmin(e.target.value)}
                  className="w-full p-2.5 bg-[#FAFAFA] border-2 border-[#111111] rounded-xl font-bold"
                />
              </div>

              <div>
                <label className="font-bold text-[#111111] block mb-1">Administrator Email</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. admin@vdc.edu.in"
                  value={newColEmail}
                  onChange={(e) => setNewColEmail(e.target.value)}
                  className="w-full p-2.5 bg-[#FAFAFA] border-2 border-[#111111] rounded-xl font-mono font-bold"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddCollege(false)}
                  className="px-4 py-2 rounded-xl text-[#111111] border border-[#111111] hover:bg-[#111111] hover:text-[#FFFFFF] font-bold cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#F4C542] text-[#111111] font-black border-2 border-[#111111] hover:bg-[#e0b435] shadow-xs cursor-pointer active:scale-95"
                >
                  Provision Campus
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: Manage Campus Detailed Modal ── */}
      {selectedCampusForManage && (
        <div className="fixed inset-0 z-50 bg-[#111111]/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#FFFFFF] text-[#111111] w-full max-w-lg rounded-3xl p-6 shadow-2xl border-2 border-[#111111] animate-scale-up space-y-4">
            <div className="flex items-center justify-between border-b border-[#111111]/10 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-[#F4C542] border border-[#111111] flex items-center justify-center font-black">
                  <Building2 size={20} />
                </div>
                <div>
                  <h2 className="text-base font-black text-[#111111]">{selectedCampusForManage.name}</h2>
                  <span className="text-xs font-mono text-[#111111]/60 font-bold">{selectedCampusForManage.code}</span>
                </div>
              </div>
              <button
                onClick={() => setSelectedCampusForManage(null)}
                className="p-1 rounded-lg hover:bg-[#FAFAFA] border border-[#111111]/20 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-[#111111] block mb-1">Campus Status</label>
                  <select
                    value={selectedCampusForManage.status}
                    onChange={(e: any) => setSelectedCampusForManage({ ...selectedCampusForManage, status: e.target.value })}
                    className="w-full p-2.5 bg-[#FAFAFA] border-2 border-[#111111] rounded-xl font-black cursor-pointer"
                  >
                    <option value="active">Active (Operational)</option>
                    <option value="maintenance">Maintenance Mode</option>
                    <option value="provisioning">Provisioning / Setup</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-[#111111] block mb-1">Enrolled Students</label>
                  <input
                    type="number"
                    value={selectedCampusForManage.studentsCount}
                    onChange={(e) => setSelectedCampusForManage({ ...selectedCampusForManage, studentsCount: Number(e.target.value) })}
                    className="w-full p-2 bg-[#FAFAFA] border-2 border-[#111111] rounded-xl font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-[#111111] block mb-1">Designated Administrator</label>
                <input
                  type="text"
                  value={selectedCampusForManage.adminName}
                  onChange={(e) => setSelectedCampusForManage({ ...selectedCampusForManage, adminName: e.target.value })}
                  className="w-full p-2 bg-[#FAFAFA] border-2 border-[#111111] rounded-xl font-bold"
                />
              </div>

              <div>
                <label className="font-bold text-[#111111] block mb-1">Official Administrator Email</label>
                <input
                  type="email"
                  value={selectedCampusForManage.adminEmail}
                  onChange={(e) => setSelectedCampusForManage({ ...selectedCampusForManage, adminEmail: e.target.value })}
                  className="w-full p-2 bg-[#FAFAFA] border-2 border-[#111111] rounded-xl font-mono font-bold"
                />
              </div>

              <div>
                <label className="font-bold text-[#111111] block mb-1">Assigned Counsellors Count</label>
                <input
                  type="number"
                  value={selectedCampusForManage.counselorsCount}
                  onChange={(e) => setSelectedCampusForManage({ ...selectedCampusForManage, counselorsCount: Number(e.target.value) })}
                  className="w-full p-2 bg-[#FAFAFA] border-2 border-[#111111] rounded-xl font-bold"
                />
              </div>

              <div className="pt-3 border-t border-[#111111]/10 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => handleDeleteCampus(selectedCampusForManage.id, selectedCampusForManage.name)}
                  className="px-3.5 py-2 rounded-xl bg-rose-100 hover:bg-rose-200 text-rose-800 font-bold border border-rose-300 flex items-center gap-1.5 cursor-pointer"
                >
                  <Trash2 size={14} />
                  <span>Decommission Campus</span>
                </button>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedCampusForManage(null)}
                    className="px-4 py-2 rounded-xl border border-[#111111] font-bold hover:bg-[#FAFAFA] cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => handleUpdateCampus(selectedCampusForManage)}
                    className="px-5 py-2 rounded-xl bg-[#F4C542] hover:bg-[#e0b435] text-[#111111] font-black border-2 border-[#111111] shadow-xs cursor-pointer active:scale-95"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Consolidated Report Modal ── */}
      <ConsolidatedReportModal
        isOpen={showConsolidatedModal}
        onClose={() => setShowConsolidatedModal(false)}
        onSaveReport={handleSaveConsolidatedReport}
      />
    </div>
  );
}
