import React, { useState } from 'react';
import { 
  Building2, Users, ShieldAlert, Cpu, Activity, Plus, Search, 
  Settings, Lock, CheckCircle2, ChevronRight, AlertTriangle, Key, 
  Database, RefreshCw, BarChart3, Sliders, ExternalLink
} from 'lucide-react';
import { getAuth } from '../utils/auth';

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
  }
];

export default function SuperAdminDashboard() {
  const auth = getAuth();
  const [colleges, setColleges] = useState<CollegeDeployment[]>(INITIAL_COLLEGES);
  const [activeTab, setActiveTab] = useState<'colleges' | 'ai_config' | 'security' | 'audit'>('colleges');
  const [searchTerm, setSearchTerm] = useState('');
  
  // AI Config State
  const [aiProvider, setAiProvider] = useState<'gemini' | 'openai' | 'local'>('gemini');
  const [safetyThreshold, setSafetyThreshold] = useState<number>(75);
  const [autoEscalateEmergency, setAutoEscalateEmergency] = useState<boolean>(true);
  const [configSaved, setConfigSaved] = useState<boolean>(false);

  // New College Modal
  const [showAddCollege, setShowAddCollege] = useState(false);
  const [newColName, setNewColName] = useState('');
  const [newColCode, setNewColCode] = useState('');
  const [newColAdmin, setNewColAdmin] = useState('');
  const [newColEmail, setNewColEmail] = useState('');

  const handleAddCollege = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newColName || !newColCode || !newColEmail) return;
    const item: CollegeDeployment = {
      id: `col-${Date.now()}`,
      name: newColName,
      code: newColCode.toUpperCase(),
      adminName: newColAdmin || 'Campus Admin',
      adminEmail: newColEmail,
      studentsCount: 0,
      counselorsCount: 0,
      status: 'active',
      joinedDate: 'Today',
    };
    setColleges([item, ...colleges]);
    setShowAddCollege(false);
    setNewColName('');
    setNewColCode('');
    setNewColAdmin('');
    setNewColEmail('');
  };

  const handleSaveAiConfig = () => {
    setConfigSaved(true);
    setTimeout(() => setConfigSaved(false), 3000);
  };

  const filteredColleges = colleges.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.adminEmail.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalStudents = colleges.reduce((sum, c) => sum + c.studentsCount, 0);
  const totalCounselors = colleges.reduce((sum, c) => sum + c.counselorsCount, 0);

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in max-w-7xl mx-auto pb-20 text-[#111111]">
      {/* ── Top Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 sm:p-6 rounded-3xl bg-[#FFFFFF] border-2 border-[#111111] shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#F4C542] border-2 border-[#111111] text-[#111111] flex items-center justify-center">
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

        {/* Global Quick Action */}
        <button
          onClick={() => setShowAddCollege(true)}
          className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-[#F4C542] hover:bg-[#e0b435] text-[#111111] text-xs font-black border-2 border-[#111111] transition-all shadow-xs active:scale-95 cursor-pointer"
        >
          <Plus size={16} />
          <span>Deploy New College</span>
        </button>
      </div>

      {/* ── Metric Highlights ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-3xl bg-[#FFFFFF] border border-[#111111]/15 shadow-xs">
          <div className="flex items-center justify-between text-[#111111]/60 mb-1">
            <span className="text-[11px] font-black tracking-wider uppercase">Institutions</span>
            <Building2 size={16} className="text-[#111111]" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-[#111111]">{colleges.length}</p>
          <p className="text-[11px] text-[#111111]/60 font-semibold mt-1">100% Active Campuses</p>
        </div>

        <div className="p-5 rounded-3xl bg-[#FFFFFF] border border-[#111111]/15 shadow-xs">
          <div className="flex items-center justify-between text-[#111111]/60 mb-1">
            <span className="text-[11px] font-black tracking-wider uppercase">Total Students</span>
            <Users size={16} className="text-[#111111]" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-[#111111]">{totalStudents.toLocaleString()}</p>
          <p className="text-[11px] text-[#111111]/60 font-semibold mt-1">All Protected Anonymously</p>
        </div>

        <div className="p-5 rounded-3xl bg-[#FFFFFF] border border-[#111111]/15 shadow-xs">
          <div className="flex items-center justify-between text-[#111111]/60 mb-1">
            <span className="text-[11px] font-black tracking-wider uppercase">Active Counsellors</span>
            <Activity size={16} className="text-[#111111]" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-[#111111]">{totalCounselors}</p>
          <p className="text-[11px] text-[#111111]/60 font-semibold mt-1">Licensed Clinical Staff</p>
        </div>

        <div className="p-5 rounded-3xl bg-[#FFFFFF] border border-[#111111]/15 shadow-xs">
          <div className="flex items-center justify-between text-[#111111]/60 mb-1">
            <span className="text-[11px] font-black tracking-wider uppercase">AI Sentinel</span>
            <Cpu size={16} className="text-[#111111]" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-[#111111]">Online</p>
          <p className="text-[11px] text-[#111111]/60 font-semibold mt-1">Clinical Sentiment Active</p>
        </div>
      </div>

      {/* ── Navigation Tabs ── */}
      <div className="flex items-center gap-1.5 p-1 bg-[#FAFAFA] border border-[#111111]/15 rounded-2xl overflow-x-auto">
        <button
          onClick={() => setActiveTab('colleges')}
          className={`px-4 py-2.5 text-xs font-black rounded-xl transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
            activeTab === 'colleges'
              ? 'bg-[#F4C542] text-[#111111] border border-[#111111] shadow-xs'
              : 'text-[#111111]/70 hover:text-[#111111] hover:bg-[#111111]/5'
          }`}
        >
          <Building2 size={14} />
          <span>Colleges &amp; Campuses ({colleges.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('ai_config')}
          className={`px-4 py-2.5 text-xs font-black rounded-xl transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
            activeTab === 'ai_config'
              ? 'bg-[#F4C542] text-[#111111] border border-[#111111] shadow-xs'
              : 'text-[#111111]/70 hover:text-[#111111] hover:bg-[#111111]/5'
          }`}
        >
          <Sliders size={14} />
          <span>AI Engine Configuration</span>
        </button>
        <button
          onClick={() => setActiveTab('security')}
          className={`px-4 py-2.5 text-xs font-black rounded-xl transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
            activeTab === 'security'
              ? 'bg-[#F4C542] text-[#111111] border border-[#111111] shadow-xs'
              : 'text-[#111111]/70 hover:text-[#111111] hover:bg-[#111111]/5'
          }`}
        >
          <Lock size={14} />
          <span>RBAC &amp; Access Control</span>
        </button>
        <button
          onClick={() => setActiveTab('audit')}
          className={`px-4 py-2.5 text-xs font-black rounded-xl transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
            activeTab === 'audit'
              ? 'bg-[#F4C542] text-[#111111] border border-[#111111] shadow-xs'
              : 'text-[#111111]/70 hover:text-[#111111] hover:bg-[#111111]/5'
          }`}
        >
          <BarChart3 size={14} />
          <span>Platform Audit Logs</span>
        </button>
      </div>

      {/* ── TAB 1: COLLEGES DIRECTORY ── */}
      {activeTab === 'colleges' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4 bg-[#FFFFFF] p-3 rounded-2xl border border-[#111111]/15">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#111111]/40" />
              <input
                type="text"
                placeholder="Search college name, code, or administrator..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-xs bg-[#FAFAFA] rounded-xl border border-[#111111]/15 text-[#111111] font-bold focus:outline-none focus:border-[#111111]"
              />
            </div>
            <span className="text-xs text-[#111111]/60 font-bold">
              Showing {filteredColleges.length} campuses
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredColleges.map((col) => (
              <div
                key={col.id}
                className="p-5 rounded-3xl bg-[#FFFFFF] border border-[#111111]/15 hover:border-[#111111] transition-all shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="px-2.5 py-0.5 rounded-lg bg-[#FAFAFA] text-[#111111] font-mono text-[11px] font-black border border-[#111111]/20">
                      {col.code}
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-black text-[#111111] bg-[#F4C542] px-2 py-0.5 rounded-full border border-[#111111]">
                      ● Live
                    </span>
                  </div>

                  <h3 className="text-sm font-black text-[#111111] leading-tight mb-2">
                    {col.name}
                  </h3>

                  <div className="space-y-1.5 text-xs text-[#111111]/70 border-t border-[#111111]/10 pt-3 mt-3">
                    <div className="flex justify-between">
                      <span>Administrator:</span>
                      <span className="font-bold text-[#111111]">{col.adminName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Official Email:</span>
                      <span className="font-mono text-[#111111] text-[11px]">{col.adminEmail}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Enrolled Students:</span>
                      <span className="font-bold text-[#111111]">{col.studentsCount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Counsellors:</span>
                      <span className="font-bold text-[#111111]">{col.counselorsCount}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-[#111111]/10 flex items-center justify-between">
                  <span className="text-[10px] text-[#111111]/50 font-mono">Joined {col.joinedDate}</span>
                  <button className="text-xs font-black text-[#111111] hover:underline flex items-center gap-1 cursor-pointer">
                    Manage Campus <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── TAB 2: AI ENGINE CONFIGURATION ── */}
      {activeTab === 'ai_config' && (
        <div className="bg-[#FFFFFF] p-6 rounded-3xl border-2 border-[#111111] shadow-xs max-w-3xl space-y-6">
          <div>
            <h2 className="text-base font-black text-[#111111]">AI Screening &amp; Sentiment Guard</h2>
            <p className="text-xs text-[#111111]/60 mt-0.5 font-medium">
              Control the neural parameters driving automated triage, distress indicators, and risk classification.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-black text-[#111111] mb-1.5">
                Primary Clinical Reasoning Model
              </label>
              <div className="grid grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setAiProvider('gemini')}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                    aiProvider === 'gemini' 
                      ? 'border-2 border-[#111111] bg-[#F4C542] text-[#111111]' 
                      : 'border-[#111111]/15 bg-[#FAFAFA] hover:border-[#111111]'
                  }`}
                >
                  <p className="text-xs font-black">Google Gemini</p>
                  <p className="text-[10px] text-[#111111]/70 mt-0.5">Optimized clinical empathy</p>
                </button>
                <button
                  type="button"
                  onClick={() => setAiProvider('openai')}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                    aiProvider === 'openai' 
                      ? 'border-2 border-[#111111] bg-[#F4C542] text-[#111111]' 
                      : 'border-[#111111]/15 bg-[#FAFAFA] hover:border-[#111111]'
                  }`}
                >
                  <p className="text-xs font-black">OpenAI GPT-4o</p>
                  <p className="text-[10px] text-[#111111]/70 mt-0.5">Analytical screening</p>
                </button>
                <button
                  type="button"
                  onClick={() => setAiProvider('local')}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                    aiProvider === 'local' 
                      ? 'border-2 border-[#111111] bg-[#F4C542] text-[#111111]' 
                      : 'border-[#111111]/15 bg-[#FAFAFA] hover:border-[#111111]'
                  }`}
                >
                  <p className="text-xs font-black">Air-Gapped Local</p>
                  <p className="text-[10px] text-[#111111]/70 mt-0.5">On-premise zero leakage</p>
                </button>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-black text-[#111111]">
                  Emergency Escalation Threshold
                </label>
                <span className="px-2 py-0.5 rounded-full bg-[#FAFAFA] border border-[#111111]/20 text-[#111111] text-xs font-black">
                  Score ≥ {safetyThreshold}
                </span>
              </div>
              <input
                type="range"
                min="50"
                max="90"
                value={safetyThreshold}
                onChange={(e) => setSafetyThreshold(Number(e.target.value))}
                className="w-full accent-[#111111] cursor-pointer"
              />
              <p className="text-[11px] text-[#111111]/60 mt-1">
                When student conversations or journal entries cross this sentiment risk score, counsellors receive immediate alerts.
              </p>
            </div>

            <div className="flex items-center justify-between p-4 rounded-2xl bg-[#FAFAFA] border border-[#111111]/15">
              <div>
                <p className="text-xs font-black text-[#111111]">Auto-Escalate Severe Crisis SOS</p>
                <p className="text-[11px] text-[#111111]/60 font-medium">
                  Trigger immediate notifications to on-duty Vishnu Wellness Centre counsellors when distress triggers are detected.
                </p>
              </div>
              <input
                type="checkbox"
                checked={autoEscalateEmergency}
                onChange={(e) => setAutoEscalateEmergency(e.target.checked)}
                className="w-4 h-4 accent-[#111111] rounded cursor-pointer"
              />
            </div>
          </div>

          <div className="pt-2 flex items-center gap-3">
            <button
              onClick={handleSaveAiConfig}
              className="px-6 py-3 rounded-2xl bg-[#F4C542] hover:bg-[#e0b435] text-[#111111] text-xs font-black border-2 border-[#111111] shadow-xs transition-all cursor-pointer active:scale-95"
            >
              Save Configuration
            </button>
            {configSaved && (
              <span className="inline-flex items-center gap-1.5 text-xs font-black text-[#111111] animate-fade-in">
                <CheckCircle2 size={16} /> Saved &amp; deployed across campuses
              </span>
            )}
          </div>
        </div>
      )}

      {/* ── TAB 3: RBAC & ACCESS CONTROL ── */}
      {activeTab === 'security' && (
        <div className="bg-[#FFFFFF] p-6 rounded-3xl border border-[#111111]/15 shadow-xs max-w-3xl space-y-4">
          <h2 className="text-base font-black text-[#111111]">Role-Based Access Control (RBAC)</h2>
          <div className="divide-y divide-[#111111]/10 text-xs">
            <div className="py-3 flex justify-between items-center">
              <div>
                <p className="font-black text-[#111111]">Super Admin</p>
                <p className="text-[#111111]/60 text-[11px]">Deploy institutions, manage college admins, global system audit, AI parameters</p>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-[#111111] text-[#FFFFFF] font-black text-[10px]">ALL PRIVILEGES</span>
            </div>
            <div className="py-3 flex justify-between items-center">
              <div>
                <p className="font-black text-[#111111]">College Admin</p>
                <p className="text-[#111111]/60 text-[11px]">Manage campus counsellors, view anonymized trends, appointments &amp; offline records</p>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-[#FAFAFA] border border-[#111111]/20 text-[#111111] font-black text-[10px]">CAMPUS ROOT</span>
            </div>
            <div className="py-3 flex justify-between items-center">
              <div>
                <p className="font-black text-[#111111]">Licensed Counsellor</p>
                <p className="text-[#111111]/60 text-[11px]">Conduct student sessions, manage to-dos, log offline records, request identity under protocol</p>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-[#F4C542] border border-[#111111] text-[#111111] font-black text-[10px]">CLINICAL ACCESS</span>
            </div>
            <div className="py-3 flex justify-between items-center">
              <div>
                <p className="font-black text-[#111111]">Student (Anonymous)</p>
                <p className="text-[#111111]/60 text-[11px]">Private journals, BookMyShow appointments, AI emotional chat, digital detox, mind puzzles</p>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-[#FAFAFA] border border-[#111111]/20 text-[#111111] font-bold text-[10px]">PRIVACY-FIRST</span>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 4: AUDIT LOGS ── */}
      {activeTab === 'audit' && (
        <div className="bg-[#FFFFFF] p-6 rounded-3xl border border-[#111111]/15 shadow-xs max-w-4xl">
          <h2 className="text-base font-black text-[#111111] mb-4">Platform Audit Trails</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAFAFA] text-[#111111]/60 font-black uppercase tracking-wider text-[10px] border-b border-[#111111]/10">
                <tr>
                  <th className="p-3">Timestamp</th>
                  <th className="p-3">Campus</th>
                  <th className="p-3">Actor Role</th>
                  <th className="p-3">Action Description</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#111111]/10">
                <tr>
                  <td className="p-3 font-mono text-[11px] text-[#111111]/60">08/09/2026 18:45</td>
                  <td className="p-3 font-bold text-[#111111]">VIT-BVRM</td>
                  <td className="p-3 font-black text-[#111111]">Counsellor</td>
                  <td className="p-3 font-medium">Manual Offline Session recorded for alias BlueSky27</td>
                  <td className="p-3 text-[#111111] font-black">Verified</td>
                </tr>
                <tr>
                  <td className="p-3 font-mono text-[11px] text-[#111111]/60">08/09/2026 17:30</td>
                  <td className="p-3 font-bold text-[#111111]">VIT-BVRM</td>
                  <td className="p-3 font-black text-[#111111]">Admin</td>
                  <td className="p-3 font-medium">Monthly counselling privacy report generated</td>
                  <td className="p-3 text-[#111111] font-black">Success</td>
                </tr>
                <tr>
                  <td className="p-3 font-mono text-[11px] text-[#111111]/60">08/09/2026 16:15</td>
                  <td className="p-3 font-bold text-[#111111]">BVRITH-HYD</td>
                  <td className="p-3 font-black text-[#111111]">Counsellor</td>
                  <td className="p-3 font-medium">Completed BookMyShow audio session with Student_482</td>
                  <td className="p-3 text-[#111111] font-black">Archived</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── MODAL: Deploy New College ── */}
      {showAddCollege && (
        <div className="fixed inset-0 z-50 bg-[#111111]/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#FFFFFF] text-[#111111] w-full max-w-md rounded-3xl p-6 shadow-2xl border-2 border-[#111111] animate-scale-up space-y-4">
            <div>
              <h2 className="text-base font-black text-[#111111]">Deploy New Campus</h2>
              <p className="text-xs text-[#111111]/60 mt-0.5">
                Provision a new college instance with independent RBAC and dedicated counselling team.
              </p>
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
                  className="w-full p-2.5 bg-[#FAFAFA] border border-[#111111]/20 rounded-xl font-bold"
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
                  className="w-full p-2.5 bg-[#FAFAFA] border border-[#111111]/20 rounded-xl uppercase font-mono font-bold"
                />
              </div>

              <div>
                <label className="font-bold text-[#111111] block mb-1">Designated Administrator Name</label>
                <input
                  type="text"
                  placeholder="e.g. Dr. Suresh Varma"
                  value={newColAdmin}
                  onChange={(e) => setNewColAdmin(e.target.value)}
                  className="w-full p-2.5 bg-[#FAFAFA] border border-[#111111]/20 rounded-xl font-bold"
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
                  className="w-full p-2.5 bg-[#FAFAFA] border border-[#111111]/20 rounded-xl font-mono font-bold"
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
    </div>
  );
}
