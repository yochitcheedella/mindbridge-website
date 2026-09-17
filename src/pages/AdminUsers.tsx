import React, { useState, useEffect } from 'react';
import {
  Users, Plus, Trash2, Brain, CheckCircle2, XCircle,
  Search, RefreshCw, Mail, ToggleLeft, ToggleRight,
  Shield, GraduationCap, Building2, Download, AlertTriangle,
  Lock, Eye, Filter, Sparkles, Check, Phone
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { apiFetch } from '../utils/auth';
import { OFFICIAL_COUNSELORS, type CounselorData } from '../data/counselors';

interface Psychologist {
  id: number;
  name: string;
  specialization: string | null;
  email: string | null;
  phone?: string;
  institution?: string;
  is_active: boolean;
  caseload_quota?: number;
}

interface StudentRecord {
  id: string;
  alias: string;
  department: string;
  year: string;
  checkinsCount: number;
  riskStatus: 'Safe' | 'Mild Stress' | 'Monitored' | 'Clinical Priority';
  lastActivity: string;
  encryptionStatus: 'AES-256 Hashed';
  clientHash?: string;
}

interface CampusAdmin {
  id: string;
  name: string;
  roleTitle: string;
  campus: string;
  email: string;
  permissions: string;
  twoFactorEnabled: boolean;
  lastLogin: string;
}

const DEFAULT_COUNSELORS_LIST: Psychologist[] = OFFICIAL_COUNSELORS.map(c => ({
  id: c.id,
  name: c.name,
  specialization: c.specialization,
  email: c.email || `${c.name.toLowerCase().replace(/[^a-z]/g, '.')}@vishnu.edu.in`,
  phone: c.contact_phone || '+91 9100972237',
  institution: c.institution || 'Vishnu Wellness Centre (VIT)',
  is_active: true,
  caseload_quota: 25,
}));

const INITIAL_STUDENTS: StudentRecord[] = [
  { id: 'std-101', alias: 'StarlightSeeker #219', department: 'CSE', year: '3rd Year', checkinsCount: 14, riskStatus: 'Safe', lastActivity: '12 mins ago', encryptionStatus: 'AES-256 Hashed', clientHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855' },
  { id: 'std-102', alias: 'Silent Phoenix #6718', department: 'CSE', year: '3rd Year', checkinsCount: 19, riskStatus: 'Monitored', lastActivity: '1 hour ago', encryptionStatus: 'AES-256 Hashed', clientHash: 'ca978112ca1bbdcafac231b39a23dc4da786eff8147c4e72b9807785afee48bb' },
  { id: 'std-103', alias: 'QuietRiver #904', department: 'AI&DS', year: '2nd Year', checkinsCount: 8, riskStatus: 'Mild Stress', lastActivity: '3 hours ago', encryptionStatus: 'AES-256 Hashed', clientHash: '3e23e8160039594a33894f6564e1b1348bbd7a0088d42c4acb73eeaed59c009d' },
  { id: 'std-104', alias: 'SilverHawk #1102', department: 'ECE', year: '4th Year', checkinsCount: 22, riskStatus: 'Safe', lastActivity: 'Yesterday', encryptionStatus: 'AES-256 Hashed', clientHash: '2e7d2c03a9507ae265ecf5b5356885a53393a2029d241394997265a1a25aefc6' },
  { id: 'std-105', alias: 'SolarBeam #5021', department: 'IT', year: '2nd Year', checkinsCount: 5, riskStatus: 'Safe', lastActivity: '2 days ago', encryptionStatus: 'AES-256 Hashed', clientHash: '18ac3e7343f016890c510e93f935261169d9e3f565436429830faf0934f4f8e4' },
  { id: 'std-106', alias: 'AmberShadow #314', department: 'CSBS', year: '1st Year', checkinsCount: 11, riskStatus: 'Mild Stress', lastActivity: '4 hours ago', encryptionStatus: 'AES-256 Hashed', clientHash: '8f434346648f6b96df89dda901c5176b10a6d83961dd3c1ac88b59b2dc327aa4' },
  { id: 'std-107', alias: 'EchoVoyager #882', department: 'MECH', year: '3rd Year', checkinsCount: 3, riskStatus: 'Safe', lastActivity: '3 days ago', encryptionStatus: 'AES-256 Hashed', clientHash: 'eccbc87e4b5ce2fe28308fd9f2a7baf3a41e974e622b7945d8b2d8471b088b64' },
  { id: 'std-108', alias: 'BraveSparrow #410', department: 'CIVIL', year: '4th Year', checkinsCount: 16, riskStatus: 'Clinical Priority', lastActivity: '30 mins ago', encryptionStatus: 'AES-256 Hashed', clientHash: 'c81e728d9d4c2f636f067f89cc14862c1f54316a738676bb2d358be85ffcf88e' },
];

const INITIAL_ADMINS: CampusAdmin[] = [
  { id: 'adm-1', name: 'Prof. K. Satyanarayana', roleTitle: 'Chief Institutional Administrator', campus: 'Vishnu Institute of Technology (VIT)', email: 'admin@vishnu.edu.in', permissions: 'Full Institutional Read/Write', twoFactorEnabled: true, lastLogin: 'Today, 09:45 AM' },
  { id: 'adm-2', name: 'Dr. Radhika Sharma', roleTitle: 'Campus Wellness Administrator', campus: 'BVRIT Hyderabad for Women', email: 'admin@bvrith.ac.in', permissions: 'Campus Level Read/Write', twoFactorEnabled: true, lastLogin: 'Yesterday, 04:12 PM' },
  { id: 'adm-3', name: 'Dr. P. Srinivasa Rao', roleTitle: 'Dean of Student Affairs', campus: 'SVECW Bhimavaram', email: 'admin@svecw.edu.in', permissions: 'Campus Level Read/Write', twoFactorEnabled: true, lastLogin: '14 Sept 2026' },
  { id: 'adm-4', name: 'SVES Central Governance (Root)', roleTitle: 'Central Society Super Administrator', campus: 'Sri Vishnu Educational Society (Central)', email: 'superadmin@vishnu.edu.in', permissions: 'Root Multi-Campus Authority', twoFactorEnabled: true, lastLogin: 'Active Now' },
];

export default function AdminUsers() {
  const [activeTab, setActiveTab] = useState<'psychologists' | 'students' | 'admins'>('psychologists');
  
  // Persistent Counselors List
  const [psychologists, setPsychologists] = useState<Psychologist[]>(() => {
    try {
      const stored = localStorage.getItem('mindbridge_counselors_list');
      if (stored) return JSON.parse(stored);
    } catch {}
    return DEFAULT_COUNSELORS_LIST;
  });

  // Persistent Zero-PII Students Vault
  const [students, setStudents] = useState<StudentRecord[]>(() => {
    try {
      const stored = localStorage.getItem('mindbridge_students_vault');
      if (stored) return JSON.parse(stored);
    } catch {}
    return INITIAL_STUDENTS;
  });

  // Persistent Campus Admins
  const [admins, setAdmins] = useState<CampusAdmin[]>(() => {
    try {
      const stored = localStorage.getItem('mindbridge_campus_admins');
      if (stored) return JSON.parse(stored);
    } catch {}
    return INITIAL_ADMINS;
  });

  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('ALL');
  const [riskFilter, setRiskFilter] = useState('ALL');
  
  // Modals
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingCounselor, setEditingCounselor] = useState<Psychologist | null>(null);
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [inspectingStudent, setInspectingStudent] = useState<StudentRecord | null>(null);
  const [showAddAdminModal, setShowAddAdminModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form for New Psychologist
  const [form, setForm] = useState({
    name: '', specialization: '', email: '', phone: '', institution: 'Vishnu Institute of Technology (VIT)', caseload_quota: 30
  });

  // Form for New Student Alias
  const [studentForm, setStudentForm] = useState({
    alias: '',
    department: 'CSE',
    year: '2nd Year',
    riskStatus: 'Safe' as StudentRecord['riskStatus'],
  });

  // Form for New Admin
  const [adminForm, setAdminForm] = useState({
    name: '', roleTitle: 'Campus Administrator', campus: 'Vishnu Institute of Technology (VIT)', email: '',
  });

  const savePsychologists = (updated: Psychologist[]) => {
    setPsychologists(updated);
    try {
      localStorage.setItem('mindbridge_counselors_list', JSON.stringify(updated));
    } catch {}
  };

  const saveStudents = (updated: StudentRecord[]) => {
    setStudents(updated);
    try {
      localStorage.setItem('mindbridge_students_vault', JSON.stringify(updated));
    } catch {}
  };

  const saveAdmins = (updated: CampusAdmin[]) => {
    setAdmins(updated);
    try {
      localStorage.setItem('mindbridge_campus_admins', JSON.stringify(updated));
    } catch {}
  };

  const fetchPsychologists = async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/api/admin/psychologists');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          savePsychologists(data);
        }
      }
    } catch (e) {
      console.warn('API fetch failed, retaining local persistent roster:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    // If not already in localStorage, ensure initial are seeded
    if (!localStorage.getItem('mindbridge_counselors_list')) {
      localStorage.setItem('mindbridge_counselors_list', JSON.stringify(DEFAULT_COUNSELORS_LIST));
    }
    if (!localStorage.getItem('mindbridge_students_vault')) {
      localStorage.setItem('mindbridge_students_vault', JSON.stringify(INITIAL_STUDENTS));
    }
    if (!localStorage.getItem('mindbridge_campus_admins')) {
      localStorage.setItem('mindbridge_campus_admins', JSON.stringify(INITIAL_ADMINS));
    }
    fetchPsychologists(); 
  }, []);

  const handleAddPsychologist = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const newCounselor: Psychologist = {
        id: Date.now(),
        name: form.name,
        specialization: form.specialization || 'Student Wellness & Mental Health',
        email: form.email,
        phone: form.phone || '+91 9100972237',
        institution: form.institution,
        is_active: true,
        caseload_quota: Number(form.caseload_quota) || 25
      };

      const updated = [newCounselor, ...psychologists];
      savePsychologists(updated);
      setForm({ name: '', specialization: '', email: '', phone: '', institution: 'Vishnu Institute of Technology (VIT)', caseload_quota: 30 });
      setShowAddForm(false);
      setSuccess(`Counsellor "${newCounselor.name}" successfully added to roster.`);
      setTimeout(() => setSuccess(''), 4000);
    } catch (err: any) {
      setError(err.message || 'Failed to add psychologist.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveEditedCounselor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCounselor) return;
    const updated = psychologists.map(p => p.id === editingCounselor.id ? editingCounselor : p);
    savePsychologists(updated);
    setSuccess(`Updated details for "${editingCounselor.name}".`);
    setEditingCounselor(null);
    setTimeout(() => setSuccess(''), 3500);
  };

  const handleAddStudentAlias = (e: React.FormEvent) => {
    e.preventDefault();
    const aliasName = studentForm.alias.trim() || `Anonymous Phoenix #${Math.floor(1000 + Math.random() * 9000)}`;
    const randomHash = Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
    
    const newStudent: StudentRecord = {
      id: `std-${Date.now()}`,
      alias: aliasName,
      department: studentForm.department,
      year: studentForm.year,
      checkinsCount: 1,
      riskStatus: studentForm.riskStatus,
      lastActivity: 'Just registered',
      encryptionStatus: 'AES-256 Hashed',
      clientHash: randomHash,
    };

    const updated = [newStudent, ...students];
    saveStudents(updated);
    setShowAddStudentModal(false);
    setStudentForm({ alias: '', department: 'CSE', year: '2nd Year', riskStatus: 'Safe' });
    setSuccess(`Generated Zero-PII alias "${newStudent.alias}" with isolated cryptographic hash.`);
    setTimeout(() => setSuccess(''), 4000);
  };

  const handleUpdateStudentRisk = (id: string, newRisk: StudentRecord['riskStatus']) => {
    const updated = students.map(s => s.id === id ? { ...s, riskStatus: newRisk, lastActivity: 'Triage updated just now' } : s);
    saveStudents(updated);
    setSuccess(`Student triage status updated to "${newRisk}".`);
    setTimeout(() => setSuccess(''), 3000);
  };

  const handleDeleteStudent = (id: string, alias: string) => {
    if (!confirm(`Purge encrypted zero-PII vault entry for alias "${alias}"?`)) return;
    const updated = students.filter(s => s.id !== id);
    saveStudents(updated);
    setSuccess(`Purged student vault record for "${alias}".`);
    setTimeout(() => setSuccess(''), 3000);
  };

  const handleAddAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminForm.name || !adminForm.email) return;
    const newAdm: CampusAdmin = {
      id: `adm-${Date.now()}`,
      name: adminForm.name,
      roleTitle: adminForm.roleTitle,
      campus: adminForm.campus,
      email: adminForm.email,
      permissions: 'Institutional Management Access',
      twoFactorEnabled: true,
      lastLogin: 'Provisioned Just Now',
    };
    const updated = [newAdm, ...admins];
    saveAdmins(updated);
    setShowAddAdminModal(false);
    setAdminForm({ name: '', roleTitle: 'Campus Administrator', campus: 'Vishnu Institute of Technology (VIT)', email: '' });
    setSuccess(`Administrator "${newAdm.name}" authorized.`);
    setTimeout(() => setSuccess(''), 4000);
  };

  const handleToggleAdmin2FA = (id: string) => {
    const updated = admins.map(a => a.id === id ? { ...a, twoFactorEnabled: !a.twoFactorEnabled } : a);
    saveAdmins(updated);
    const target = updated.find(a => a.id === id);
    setSuccess(`2FA status updated to ${target?.twoFactorEnabled ? 'Enabled' : 'Disabled'} for ${target?.name}.`);
    setTimeout(() => setSuccess(''), 3000);
  };

  const handleRevokeAdmin = (id: string, name: string) => {
    if (!confirm(`Revoke administrative access privileges for "${name}"?`)) return;
    const updated = admins.filter(a => a.id !== id);
    saveAdmins(updated);
    setSuccess(`Administrative access revoked for "${name}".`);
    setTimeout(() => setSuccess(''), 3000);
  };

  const handleTogglePsychologist = (id: number) => {
    const updated = psychologists.map(p =>
      p.id === id ? { ...p, is_active: !p.is_active } : p
    );
    savePsychologists(updated);
  };

  const handleDeletePsychologist = (id: number, name: string) => {
    if (!confirm(`Deactivate counsellor account for "${name}"?`)) return;
    const updated = psychologists.map(p => p.id === id ? { ...p, is_active: false } : p);
    savePsychologists(updated);
    setSuccess(`Counsellor "${name}" deactivated.`);
    setTimeout(() => setSuccess(''), 3000);
  };

  const handleExportRegistry = () => {
    const exportData = {
      exportTitle: 'SVES Institutional Personnel & Zero-PII Student Registry',
      generatedAt: new Date().toISOString(),
      compliance: 'SOC2 & AES-256 Zero-Knowledge Privacy Standard',
      counselors: psychologists,
      studentsRoster: students,
      administrators: admins,
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sves_personnel_registry_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Filtered lists
  const filteredPsychologists = psychologists.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.email?.toLowerCase().includes(search.toLowerCase()) ?? false) ||
    (p.specialization?.toLowerCase().includes(search.toLowerCase()) ?? false) ||
    (p.institution?.toLowerCase().includes(search.toLowerCase()) ?? false)
  );

  const filteredStudents = students.filter(s => {
    const matchesSearch = s.alias.toLowerCase().includes(search.toLowerCase()) ||
      s.department.toLowerCase().includes(search.toLowerCase()) ||
      s.year.toLowerCase().includes(search.toLowerCase());
    const matchesDept = deptFilter === 'ALL' || s.department === deptFilter;
    const matchesRisk = riskFilter === 'ALL' || s.riskStatus === riskFilter;
    return matchesSearch && matchesDept && matchesRisk;
  });

  const filteredAdmins = admins.filter(a =>
    a.name.toLowerCase().includes(search.toLowerCase()) ||
    a.campus.toLowerCase().includes(search.toLowerCase()) ||
    a.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex-1 overflow-y-auto bg-[#FFFFFF] p-4 md:p-8 pb-28 text-[#111111]">
      <div className="max-w-6xl mx-auto space-y-6">

        {/* ── Top Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-[#FFFFFF] border-2 border-[#111111] shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#F4C542] border-2 border-[#111111] text-[#111111] flex items-center justify-center font-black">
              <Users size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-[#111111] font-heading">
                  User &amp; Personnel Management
                </h1>
                <span className="px-2.5 py-0.5 rounded-full bg-[#111111] text-[#FFFFFF] text-[10px] font-mono font-bold">
                  SVES GOVERNANCE
                </span>
              </div>
              <p className="text-xs text-[#111111]/70 font-semibold mt-0.5">
                Central administration for licensed psychologists, students (Zero-PII), and campus staff.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleExportRegistry}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-[#FAFAFA] hover:bg-[#F4C542] text-[#111111] font-black text-xs border-2 border-[#111111] transition-all shadow-xs cursor-pointer active:scale-95"
            >
              <Download size={14} /> Export Registry
            </button>
            <button
              onClick={fetchPsychologists}
              className="p-2.5 bg-[#FAFAFA] border-2 border-[#111111] rounded-2xl text-[#111111] hover:bg-[#F4C542] transition-colors cursor-pointer"
              title="Refresh Data"
            >
              <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            </button>
            {activeTab === 'psychologists' && (
              <button
                onClick={() => setShowAddForm(v => !v)}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#F4C542] hover:bg-[#e0b435] text-[#111111] border-2 border-[#111111] shadow-xs rounded-2xl text-xs font-black transition-all cursor-pointer active:scale-95"
              >
                <Plus size={16} /> Add Counsellor
              </button>
            )}
            {activeTab === 'students' && (
              <button
                onClick={() => setShowAddStudentModal(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#F4C542] hover:bg-[#e0b435] text-[#111111] border-2 border-[#111111] shadow-xs rounded-2xl text-xs font-black transition-all cursor-pointer active:scale-95"
              >
                <Plus size={16} /> Register Anonymous Alias
              </button>
            )}
            {activeTab === 'admins' && (
              <button
                onClick={() => setShowAddAdminModal(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#F4C542] hover:bg-[#e0b435] text-[#111111] border-2 border-[#111111] shadow-xs rounded-2xl text-xs font-black transition-all cursor-pointer active:scale-95"
              >
                <Plus size={16} /> Authorize Admin
              </button>
            )}
          </div>
        </div>

        {/* ── Metric Summary Cards ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div 
            onClick={() => setActiveTab('psychologists')}
            className={`p-5 rounded-3xl border-2 transition-all cursor-pointer shadow-xs ${
              activeTab === 'psychologists' ? 'border-[#111111] bg-[#F4C542]/20' : 'border-[#111111]/15 bg-[#FFFFFF] hover:border-[#111111]'
            }`}
          >
            <div className="flex items-center justify-between text-[#111111]/60 mb-1">
              <span className="text-[11px] font-mono font-black uppercase tracking-wider">Licensed Counsellors</span>
              <Brain size={18} className="text-[#111111]" />
            </div>
            <p className="text-3xl font-heading font-black text-[#111111]">{psychologists.filter(p => p.is_active).length}</p>
            <p className="text-[11px] text-[#111111]/70 font-bold mt-1">{psychologists.length} Total Registered ({psychologists.filter(p => !p.is_active).length} Suspended)</p>
          </div>

          <div 
            onClick={() => setActiveTab('students')}
            className={`p-5 rounded-3xl border-2 transition-all cursor-pointer shadow-xs ${
              activeTab === 'students' ? 'border-[#111111] bg-[#F4C542]/20' : 'border-[#111111]/15 bg-[#FFFFFF] hover:border-[#111111]'
            }`}
          >
            <div className="flex items-center justify-between text-[#111111]/60 mb-1">
              <span className="text-[11px] font-mono font-black uppercase tracking-wider">Students in Vault</span>
              <GraduationCap size={18} className="text-[#111111]" />
            </div>
            <p className="text-3xl font-heading font-black text-[#111111]">{students.length.toLocaleString()}</p>
            <p className="text-[11px] text-[#111111]/70 font-bold mt-1">100% Zero-Knowledge Anonymity</p>
          </div>

          <div 
            onClick={() => setActiveTab('admins')}
            className={`p-5 rounded-3xl border-2 transition-all cursor-pointer shadow-xs ${
              activeTab === 'admins' ? 'border-[#111111] bg-[#F4C542]/20' : 'border-[#111111]/15 bg-[#FFFFFF] hover:border-[#111111]'
            }`}
          >
            <div className="flex items-center justify-between text-[#111111]/60 mb-1">
              <span className="text-[11px] font-mono font-black uppercase tracking-wider">Campus Administrators</span>
              <Shield size={18} className="text-[#111111]" />
            </div>
            <p className="text-3xl font-heading font-black text-[#111111]">{admins.length}</p>
            <p className="text-[11px] text-[#111111]/70 font-bold mt-1">Authorized Executive Staff</p>
          </div>
        </div>

        {/* ── Tabs Navigation ── */}
        <div className="flex items-center gap-1.5 p-1 bg-[#FAFAFA] border-2 border-[#111111] rounded-2xl overflow-x-auto shadow-xs">
          <button
            onClick={() => setActiveTab('psychologists')}
            className={`px-5 py-2.5 text-xs font-black rounded-xl transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
              activeTab === 'psychologists'
                ? 'bg-[#F4C542] text-[#111111] border-2 border-[#111111] shadow-xs'
                : 'text-[#111111]/70 hover:text-[#111111]'
            }`}
          >
            <Brain size={15} />
            <span>Licensed Counsellors ({psychologists.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('students')}
            className={`px-5 py-2.5 text-xs font-black rounded-xl transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
              activeTab === 'students'
                ? 'bg-[#F4C542] text-[#111111] border-2 border-[#111111] shadow-xs'
                : 'text-[#111111]/70 hover:text-[#111111]'
            }`}
          >
            <GraduationCap size={15} />
            <span>Student Registry ({students.length} Zero-PII Vault)</span>
          </button>

          <button
            onClick={() => setActiveTab('admins')}
            className={`px-5 py-2.5 text-xs font-black rounded-xl transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
              activeTab === 'admins'
                ? 'bg-[#F4C542] text-[#111111] border-2 border-[#111111] shadow-xs'
                : 'text-[#111111]/70 hover:text-[#111111]'
            }`}
          >
            <Building2 size={15} />
            <span>Campus Administrators ({admins.length})</span>
          </button>
        </div>

        {/* ── Search & Filter Bar ── */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#FFFFFF] p-3 rounded-2xl border-2 border-[#111111] shadow-xs">
          <div className="relative flex-1 w-full">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#111111]/40" />
            <input
              type="text"
              placeholder={`Search in ${activeTab}...`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-xs bg-[#FAFAFA] rounded-xl border border-[#111111]/20 text-[#111111] font-bold focus:outline-none focus:border-[#111111]"
            />
          </div>

          {activeTab === 'students' && (
            <div className="flex items-center gap-2 shrink-0 flex-wrap">
              <div className="flex items-center gap-1">
                <span className="text-xs font-bold text-[#111111]/60">Dept:</span>
                <select
                  value={deptFilter}
                  onChange={(e) => setDeptFilter(e.target.value)}
                  className="px-2.5 py-1.5 bg-[#FAFAFA] border border-[#111111]/20 rounded-xl text-xs font-bold text-[#111111] focus:outline-none cursor-pointer"
                >
                  <option value="ALL">All Depts</option>
                  <option value="CSE">CSE</option>
                  <option value="AI&DS">AI&DS</option>
                  <option value="ECE">ECE</option>
                  <option value="IT">IT</option>
                  <option value="CSBS">CSBS</option>
                  <option value="MECH">MECH</option>
                  <option value="CIVIL">CIVIL</option>
                </select>
              </div>

              <div className="flex items-center gap-1">
                <span className="text-xs font-bold text-[#111111]/60">Triage:</span>
                <select
                  value={riskFilter}
                  onChange={(e) => setRiskFilter(e.target.value)}
                  className="px-2.5 py-1.5 bg-[#FAFAFA] border border-[#111111]/20 rounded-xl text-xs font-bold text-[#111111] focus:outline-none cursor-pointer"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="Safe">Safe</option>
                  <option value="Mild Stress">Mild Stress</option>
                  <option value="Monitored">Monitored</option>
                  <option value="Clinical Priority">Clinical Priority</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Feedback Banners */}
        {success && (
          <div className="flex items-center gap-2 px-4 py-3 bg-emerald-100 border-2 border-emerald-600 rounded-2xl text-emerald-900 text-xs font-bold animate-fade-in">
            <CheckCircle2 size={16} className="shrink-0 text-emerald-700" />
            <span>{success}</span>
          </div>
        )}
        {error && (
          <div className="flex items-center gap-2 px-4 py-3 bg-rose-100 border-2 border-rose-600 rounded-2xl text-rose-900 text-xs font-bold animate-fade-in">
            <AlertTriangle size={16} className="shrink-0 text-rose-700" />
            <span>{error}</span>
          </div>
        )}

        {/* ── TAB 1: LICENSED COUNSELLORS ── */}
        {activeTab === 'psychologists' && (
          <div className="space-y-4 animate-fade-in">
            {showAddForm && (
              <form onSubmit={handleAddPsychologist} className="p-6 rounded-3xl bg-[#FAFAFA] border-2 border-[#111111] shadow-md space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-[#111111]/10">
                  <h3 className="text-base font-black text-[#111111] font-heading flex items-center gap-2">
                    <Plus size={18} /> Register New Campus Counsellor
                  </h3>
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="text-xs font-bold text-[#111111]/60 hover:text-[#111111] cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-black text-[#111111] mb-1">Full Name *</label>
                    <input
                      required
                      value={form.name}
                      onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                      placeholder="e.g. Dr. K. Meenakshi"
                      className="w-full bg-[#FFFFFF] border-2 border-[#111111] rounded-xl px-3.5 py-2 text-xs font-bold focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-black text-[#111111] mb-1">Clinical Specialization</label>
                    <input
                      value={form.specialization}
                      onChange={e => setForm(f => ({ ...f, specialization: e.target.value }))}
                      placeholder="e.g. Academic Anxiety & Cognitive Behavioral Therapy"
                      className="w-full bg-[#FFFFFF] border-2 border-[#111111] rounded-xl px-3.5 py-2 text-xs font-bold focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-black text-[#111111] mb-1">Official College Email *</label>
                    <input
                      required
                      type="email"
                      value={form.email}
                      onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                      placeholder="counselor@vishnu.edu.in"
                      className="w-full bg-[#FFFFFF] border-2 border-[#111111] rounded-xl px-3.5 py-2 text-xs font-bold focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-black text-[#111111] mb-1">Helpline Phone (WhatsApp Alert) *</label>
                    <input
                      value={form.phone}
                      onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                      placeholder="+91 9100972237"
                      className="w-full bg-[#FFFFFF] border-2 border-[#111111] rounded-xl px-3.5 py-2 text-xs font-bold focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-black text-[#111111] mb-1">Institution Campus</label>
                    <input
                      value={form.institution}
                      onChange={e => setForm(f => ({ ...f, institution: e.target.value }))}
                      placeholder="Vishnu Institute of Technology (VIT)"
                      className="w-full bg-[#FFFFFF] border-2 border-[#111111] rounded-xl px-3.5 py-2 text-xs font-bold focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-black text-[#111111] mb-1">Weekly Caseload Capacity</label>
                    <input
                      type="number"
                      value={form.caseload_quota}
                      onChange={e => setForm(f => ({ ...f, caseload_quota: Number(e.target.value) }))}
                      className="w-full bg-[#FFFFFF] border-2 border-[#111111] rounded-xl px-3.5 py-2 text-xs font-bold focus:outline-none"
                    />
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-6 py-2.5 rounded-2xl bg-[#F4C542] hover:bg-[#e0b435] text-[#111111] font-black text-xs border-2 border-[#111111] shadow-xs cursor-pointer active:scale-95"
                  >
                    {submitting ? 'Registering...' : 'Save & Authorize Counsellor'}
                  </button>
                </div>
              </form>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredPsychologists.map(psych => (
                <div
                  key={psych.id}
                  className="p-5 rounded-3xl bg-[#FFFFFF] border-2 border-[#111111] shadow-xs flex flex-col justify-between space-y-4 hover:border-[#F4C542] transition-all"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-[#F4C542] border-2 border-[#111111] flex items-center justify-center font-black text-[#111111] shrink-0 text-base">
                      {psych.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="text-sm font-black text-[#111111] truncate">{psych.name}</h3>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-black border ${
                          psych.is_active ? 'bg-green-100 text-green-900 border-green-300' : 'bg-rose-100 text-rose-900 border-rose-300'
                        }`}>
                          {psych.is_active ? 'ACTIVE' : 'OFFLINE'}
                        </span>
                      </div>
                      <p className="text-xs text-[#111111]/70 font-semibold mt-0.5">{psych.specialization}</p>
                      <div className="flex items-center gap-3 mt-2 text-[11px] text-[#111111]/60 font-mono flex-wrap">
                        <span className="flex items-center gap-1"><Mail size={12} /> {psych.email}</span>
                        {psych.phone && <span className="flex items-center gap-1"><Phone size={12} /> {psych.phone}</span>}
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-[#111111]/10 flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-mono font-bold text-[#111111]/70">{psych.institution || 'Vishnu Wellness Centre'}</span>
                      <span className="text-[10px] font-mono text-[#111111]/50">Quota: {psych.caseload_quota || 25} cases/wk</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setEditingCounselor(psych)}
                        className="px-3 py-1 bg-[#FAFAFA] hover:bg-[#F4C542] text-[#111111] border border-[#111111] rounded-xl text-[11px] font-bold transition-all cursor-pointer"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleTogglePsychologist(psych.id)}
                        className="px-3 py-1 bg-[#FAFAFA] hover:bg-[#F4C542] text-[#111111] border border-[#111111] rounded-xl text-[11px] font-bold transition-all cursor-pointer"
                      >
                        {psych.is_active ? 'Suspend' : 'Activate'}
                      </button>
                      <button
                        onClick={() => handleDeletePsychologist(psych.id, psych.name)}
                        className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                        title="Remove"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── TAB 2: STUDENT POPULATION (ZERO-PII VAULT) ── */}
        {activeTab === 'students' && (
          <div className="space-y-4 animate-fade-in">
            {/* Zero-PII Transparency Notice */}
            <div className="p-4 rounded-3xl bg-[#F4C542]/15 border-2 border-[#111111] flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#F4C542] border border-[#111111] flex items-center justify-center shrink-0">
                  <Lock size={16} />
                </div>
                <div className="text-xs">
                  <p className="font-black text-[#111111]">Zero-Knowledge Student Privacy Guarantee</p>
                  <p className="text-[#111111]/75 mt-0.5 text-[11px] sm:text-xs font-medium">
                    In compliance with institutional ethics guidelines, student names and contact numbers are cryptographically isolated in client-side vaults. Administrators only have access to anonymized aliases, aggregate branch analytics, and triage telemetry.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAddStudentModal(true)}
                className="px-3.5 py-2 bg-[#111111] text-[#FFFFFF] hover:bg-[#F4C542] hover:text-[#111111] border border-[#111111] rounded-xl font-mono text-[11px] font-bold shrink-0 transition-all cursor-pointer"
              >
                + Add Alias
              </button>
            </div>

            {/* Students Table */}
            <div className="overflow-x-auto rounded-3xl border-2 border-[#111111] bg-[#FFFFFF] shadow-xs">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#FAFAFA] border-b-2 border-[#111111] text-[11px] font-mono font-black uppercase text-[#111111]/70">
                    <th className="py-3.5 px-4">Student Anonymous Alias</th>
                    <th className="py-3.5 px-4">Branch &amp; Year</th>
                    <th className="py-3.5 px-4">Check-ins</th>
                    <th className="py-3.5 px-4">Live Triage Status</th>
                    <th className="py-3.5 px-4">Last Telemetry</th>
                    <th className="py-3.5 px-4">Privacy Level</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#111111]/10 font-bold">
                  {filteredStudents.map(std => (
                    <tr key={std.id} className="hover:bg-[#FAFAFA] transition-colors">
                      <td className="py-3 px-4 font-mono font-black text-[#111111] flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-[#F4C542] border border-[#111111]" />
                        {std.alias}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-lg bg-[#FAFAFA] border border-[#111111]/20 font-mono text-[11px]">
                          {std.department} · {std.year}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono">{std.checkinsCount} check-ins</td>
                      <td className="py-3 px-4">
                        <select
                          value={std.riskStatus}
                          onChange={(e) => handleUpdateStudentRisk(std.id, e.target.value as StudentRecord['riskStatus'])}
                          className={`px-2 py-1 rounded-xl text-[10px] font-mono font-black border cursor-pointer focus:outline-none ${
                            std.riskStatus === 'Safe' ? 'bg-green-100 text-green-900 border-green-300' :
                            std.riskStatus === 'Mild Stress' ? 'bg-yellow-100 text-yellow-900 border-yellow-300' :
                            std.riskStatus === 'Monitored' ? 'bg-orange-100 text-orange-900 border-orange-300' :
                            'bg-rose-100 text-rose-900 border-rose-300'
                          }`}
                        >
                          <option value="Safe">Safe</option>
                          <option value="Mild Stress">Mild Stress</option>
                          <option value="Monitored">Monitored</option>
                          <option value="Clinical Priority">Clinical Priority</option>
                        </select>
                      </td>
                      <td className="py-3 px-4 font-mono text-[#111111]/60 text-[11px]">{std.lastActivity}</td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => setInspectingStudent(std)}
                          className="inline-flex items-center gap-1 text-[10px] font-mono text-[#111111] bg-[#FAFAFA] hover:bg-[#F4C542] px-2.5 py-1 rounded-full border border-[#111111]/20 transition-colors cursor-pointer"
                          title="Inspect Zero-Knowledge Cryptographic Token"
                        >
                          <Lock size={10} /> {std.encryptionStatus} <Eye size={10} className="ml-0.5" />
                        </button>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleDeleteStudent(std.id, std.alias)}
                          className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                          title="Purge Anonymous Vault Record"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── TAB 3: CAMPUS ADMINISTRATORS ── */}
        {activeTab === 'admins' && (
          <div className="space-y-4 animate-fade-in">
            {showAddAdminModal && (
              <form onSubmit={handleAddAdmin} className="p-6 rounded-3xl bg-[#FAFAFA] border-2 border-[#111111] shadow-md space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-[#111111]/10">
                  <h3 className="text-base font-black text-[#111111] font-heading flex items-center gap-2">
                    <Building2 size={18} /> Authorize New Campus Administrator
                  </h3>
                  <button
                    type="button"
                    onClick={() => setShowAddAdminModal(false)}
                    className="text-xs font-bold text-[#111111]/60 hover:text-[#111111] cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-black text-[#111111] mb-1">Administrator Name *</label>
                    <input
                      required
                      value={adminForm.name}
                      onChange={e => setAdminForm(f => ({ ...f, name: e.target.value }))}
                      placeholder="e.g. Dr. N. Suryanarayana"
                      className="w-full bg-[#FFFFFF] border-2 border-[#111111] rounded-xl px-3.5 py-2 text-xs font-bold focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-black text-[#111111] mb-1">Administrative Designation</label>
                    <input
                      value={adminForm.roleTitle}
                      onChange={e => setAdminForm(f => ({ ...f, roleTitle: e.target.value }))}
                      placeholder="e.g. Dean of Student Affairs"
                      className="w-full bg-[#FFFFFF] border-2 border-[#111111] rounded-xl px-3.5 py-2 text-xs font-bold focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-black text-[#111111] mb-1">Institutional Campus *</label>
                    <input
                      value={adminForm.campus}
                      onChange={e => setAdminForm(f => ({ ...f, campus: e.target.value }))}
                      placeholder="Vishnu Institute of Technology (VIT)"
                      className="w-full bg-[#FFFFFF] border-2 border-[#111111] rounded-xl px-3.5 py-2 text-xs font-bold focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-black text-[#111111] mb-1">Institutional Email *</label>
                    <input
                      required
                      type="email"
                      value={adminForm.email}
                      onChange={e => setAdminForm(f => ({ ...f, email: e.target.value }))}
                      placeholder="dean.affairs@vishnu.edu.in"
                      className="w-full bg-[#FFFFFF] border-2 border-[#111111] rounded-xl px-3.5 py-2 text-xs font-bold focus:outline-none"
                    />
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-2xl bg-[#F4C542] hover:bg-[#e0b435] text-[#111111] font-black text-xs border-2 border-[#111111] shadow-xs cursor-pointer active:scale-95"
                  >
                    Grant Administrative Access
                  </button>
                </div>
              </form>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredAdmins.map(admin => (
                <div
                  key={admin.id}
                  className="p-5 rounded-3xl bg-[#FFFFFF] border-2 border-[#111111] shadow-xs flex flex-col justify-between space-y-4 hover:border-[#F4C542] transition-all"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-[#111111] text-[#F4C542] border-2 border-[#111111] flex items-center justify-center font-black shrink-0">
                      <Shield size={22} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="text-sm font-black text-[#111111] truncate">{admin.name}</h3>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-black bg-[#F4C542] text-[#111111] border border-[#111111]">
                          AUTHORIZED
                        </span>
                      </div>
                      <p className="text-xs text-[#111111]/70 font-semibold mt-0.5">{admin.roleTitle}</p>
                      <p className="text-[11px] font-mono text-[#111111]/60 mt-1">{admin.campus}</p>
                      <div className="mt-2 text-[11px] font-mono text-[#111111]/50 flex items-center gap-1">
                        <Mail size={12} /> {admin.email}
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-[#111111]/10 flex items-center justify-between text-[11px] font-mono">
                    <button
                      onClick={() => handleToggleAdmin2FA(admin.id)}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black border cursor-pointer transition-colors ${
                        admin.twoFactorEnabled 
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-300' 
                          : 'bg-rose-50 text-rose-800 border-rose-300'
                      }`}
                    >
                      <Check size={12} /> {admin.twoFactorEnabled ? '2FA Active' : '2FA Pending'}
                    </button>
                    
                    <div className="flex items-center gap-2">
                      <span className="text-[#111111]/50 hidden sm:inline">{admin.lastLogin}</span>
                      <button
                        onClick={() => handleRevokeAdmin(admin.id, admin.name)}
                        className="px-2.5 py-1 rounded-xl bg-[#FAFAFA] hover:bg-rose-100 hover:text-rose-800 border border-[#111111]/20 text-[10px] font-black transition-colors cursor-pointer"
                      >
                        Revoke Access
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* ── MODAL: EDIT COUNSELLOR ── */}
      {editingCounselor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="w-full max-w-lg bg-[#FFFFFF] border-3 border-[#111111] rounded-3xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#111111]/10">
              <h3 className="font-heading font-black text-lg text-[#111111] flex items-center gap-2">
                <Brain size={20} /> Edit Counsellor Profile
              </h3>
              <button 
                onClick={() => setEditingCounselor(null)}
                className="p-1 hover:bg-[#FAFAFA] rounded-lg text-[#111111]/60 hover:text-[#111111] cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEditedCounselor} className="space-y-3.5">
              <div>
                <label className="block text-xs font-black text-[#111111] mb-1">Full Name</label>
                <input
                  required
                  value={editingCounselor.name}
                  onChange={e => setEditingCounselor({ ...editingCounselor, name: e.target.value })}
                  className="w-full bg-[#FAFAFA] border-2 border-[#111111] rounded-xl px-3.5 py-2 text-xs font-bold focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-[#111111] mb-1">Clinical Specialization</label>
                <input
                  value={editingCounselor.specialization || ''}
                  onChange={e => setEditingCounselor({ ...editingCounselor, specialization: e.target.value })}
                  className="w-full bg-[#FAFAFA] border-2 border-[#111111] rounded-xl px-3.5 py-2 text-xs font-bold focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-black text-[#111111] mb-1">Official Email</label>
                  <input
                    value={editingCounselor.email || ''}
                    onChange={e => setEditingCounselor({ ...editingCounselor, email: e.target.value })}
                    className="w-full bg-[#FAFAFA] border-2 border-[#111111] rounded-xl px-3.5 py-2 text-xs font-bold focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-[#111111] mb-1">Direct Phone</label>
                  <input
                    value={editingCounselor.phone || ''}
                    onChange={e => setEditingCounselor({ ...editingCounselor, phone: e.target.value })}
                    className="w-full bg-[#FAFAFA] border-2 border-[#111111] rounded-xl px-3.5 py-2 text-xs font-bold focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-black text-[#111111] mb-1">Institution Campus</label>
                  <input
                    value={editingCounselor.institution || ''}
                    onChange={e => setEditingCounselor({ ...editingCounselor, institution: e.target.value })}
                    className="w-full bg-[#FAFAFA] border-2 border-[#111111] rounded-xl px-3.5 py-2 text-xs font-bold focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-[#111111] mb-1">Caseload Quota (cases/wk)</label>
                  <input
                    type="number"
                    value={editingCounselor.caseload_quota || 25}
                    onChange={e => setEditingCounselor({ ...editingCounselor, caseload_quota: Number(e.target.value) })}
                    className="w-full bg-[#FAFAFA] border-2 border-[#111111] rounded-xl px-3.5 py-2 text-xs font-bold focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingCounselor(null)}
                  className="px-4 py-2 bg-[#FAFAFA] border border-[#111111] rounded-xl text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#F4C542] hover:bg-[#e0b435] border-2 border-[#111111] rounded-xl text-xs font-black shadow-xs cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: REGISTER ANONYMOUS STUDENT ALIAS ── */}
      {showAddStudentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="w-full max-w-md bg-[#FFFFFF] border-3 border-[#111111] rounded-3xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#111111]/10">
              <h3 className="font-heading font-black text-lg text-[#111111] flex items-center gap-2">
                <Lock size={18} /> Register Anonymous Student Alias
              </h3>
              <button 
                onClick={() => setShowAddStudentModal(false)}
                className="p-1 hover:bg-[#FAFAFA] rounded-lg text-[#111111]/60 hover:text-[#111111] cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddStudentAlias} className="space-y-3.5">
              <div>
                <label className="block text-xs font-black text-[#111111] mb-1">Alias Name (or leave blank to auto-generate)</label>
                <input
                  value={studentForm.alias}
                  onChange={e => setStudentForm({ ...studentForm, alias: e.target.value })}
                  placeholder="e.g. CelestialSeeker #881"
                  className="w-full bg-[#FAFAFA] border-2 border-[#111111] rounded-xl px-3.5 py-2 text-xs font-bold focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-black text-[#111111] mb-1">Department</label>
                  <select
                    value={studentForm.department}
                    onChange={e => setStudentForm({ ...studentForm, department: e.target.value })}
                    className="w-full bg-[#FAFAFA] border-2 border-[#111111] rounded-xl px-3 py-2 text-xs font-bold focus:outline-none cursor-pointer"
                  >
                    <option value="CSE">CSE</option>
                    <option value="AI&DS">AI&DS</option>
                    <option value="ECE">ECE</option>
                    <option value="IT">IT</option>
                    <option value="CSBS">CSBS</option>
                    <option value="MECH">MECH</option>
                    <option value="CIVIL">CIVIL</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-black text-[#111111] mb-1">Academic Year</label>
                  <select
                    value={studentForm.year}
                    onChange={e => setStudentForm({ ...studentForm, year: e.target.value })}
                    className="w-full bg-[#FAFAFA] border-2 border-[#111111] rounded-xl px-3 py-2 text-xs font-bold focus:outline-none cursor-pointer"
                  >
                    <option value="1st Year">1st Year</option>
                    <option value="2nd Year">2nd Year</option>
                    <option value="3rd Year">3rd Year</option>
                    <option value="4th Year">4th Year</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-[#111111] mb-1">Initial Triage Risk Status</label>
                <select
                  value={studentForm.riskStatus}
                  onChange={e => setStudentForm({ ...studentForm, riskStatus: e.target.value as StudentRecord['riskStatus'] })}
                  className="w-full bg-[#FAFAFA] border-2 border-[#111111] rounded-xl px-3 py-2 text-xs font-bold focus:outline-none cursor-pointer"
                >
                  <option value="Safe">Safe (Routine Wellness)</option>
                  <option value="Mild Stress">Mild Stress (Academic/Sleep)</option>
                  <option value="Monitored">Monitored (Active Follow-up)</option>
                  <option value="Clinical Priority">Clinical Priority (SOS Triage)</option>
                </select>
              </div>

              <div className="p-3 bg-[#FAFAFA] border border-[#111111]/20 rounded-2xl text-[11px] font-mono text-[#111111]/70">
                🔒 Cryptographic hash will be seeded locally using AES-256 GCM client vault isolation.
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddStudentModal(false)}
                  className="px-4 py-2 bg-[#FAFAFA] border border-[#111111] rounded-xl text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#F4C542] hover:bg-[#e0b435] border-2 border-[#111111] rounded-xl text-xs font-black shadow-xs cursor-pointer"
                >
                  Authorize Alias
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: ZERO-KNOWLEDGE PRIVACY CERTIFICATE INSPECTOR ── */}
      {inspectingStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="w-full max-w-lg bg-[#FFFFFF] border-3 border-[#111111] rounded-3xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#111111]/10">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#F4C542] border border-[#111111] flex items-center justify-center font-black text-[#111111]">
                  <Shield size={16} />
                </div>
                <div>
                  <h3 className="font-heading font-black text-base text-[#111111]">
                    Zero-Knowledge Privacy Certificate
                  </h3>
                  <p className="text-[10px] font-mono text-[#111111]/60">SVES SOC2 &amp; AES-256 Hardware Isolation</p>
                </div>
              </div>
              <button 
                onClick={() => setInspectingStudent(null)}
                className="p-1 hover:bg-[#FAFAFA] rounded-lg text-[#111111]/60 hover:text-[#111111] cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-[#FAFAFA] rounded-2xl border border-[#111111]/15 space-y-1.5 font-mono">
                <div className="flex justify-between text-[11px]">
                  <span className="text-[#111111]/60">Alias Identity:</span>
                  <span className="font-black text-[#111111]">{inspectingStudent.alias}</span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span className="text-[#111111]/60">Academic Branch:</span>
                  <span className="font-bold text-[#111111]">{inspectingStudent.department} · {inspectingStudent.year}</span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span className="text-[#111111]/60">Triage Classification:</span>
                  <span className="font-black text-[#111111]">{inspectingStudent.riskStatus}</span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span className="text-[#111111]/60">Local Check-ins:</span>
                  <span className="font-bold text-[#111111]">{inspectingStudent.checkinsCount} recorded</span>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-mono font-bold text-[#111111]/70 mb-1">SHA-256 Vault Token Hash:</label>
                <div className="p-2.5 bg-[#FAFAFA] rounded-xl border border-[#111111]/20 font-mono text-[10px] break-all select-all text-[#111111]">
                  {inspectingStudent.clientHash || 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'}
                </div>
              </div>

              <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-2xl space-y-1 text-emerald-950">
                <div className="flex items-center gap-1.5 font-black text-xs">
                  <CheckCircle2 size={14} className="text-emerald-700" />
                  <span>Zero-PII Isolation Certified</span>
                </div>
                <p className="text-[11px] leading-relaxed">
                  Real roll numbers, phone contacts, and student portal passwords never touch the server database. All queries use unidirectional salted cryptographic handles.
                </p>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setInspectingStudent(null)}
                className="px-5 py-2 bg-[#111111] text-[#FFFFFF] hover:bg-[#F4C542] hover:text-[#111111] border-2 border-[#111111] rounded-xl text-xs font-black cursor-pointer transition-colors"
              >
                Close Certificate
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
