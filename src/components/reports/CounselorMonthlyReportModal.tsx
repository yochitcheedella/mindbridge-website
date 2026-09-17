import React, { useState } from 'react';
import { X, FileText, Download, CheckCircle2, Plus, Trash2, Calendar, Building, Award } from 'lucide-react';
import { generateCounselorMonthlyReportPDF, type CounselorMonthlyReportData } from '../../utils/counselorReportPdf';
import { VISHNU_WELLNESS_CENTRE } from '../../data/counselors';

interface CounselorMonthlyReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultCounselorName?: string;
  defaultInstitution?: string;
  onSaveReport?: (report: CounselorMonthlyReportData) => void;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export default function CounselorMonthlyReportModal({
  isOpen,
  onClose,
  defaultCounselorName = 'Ram Prudhvi Teja',
  defaultInstitution = 'Vishnu Institute of Technology (VIT), Bhimavaram',
  onSaveReport,
}: CounselorMonthlyReportModalProps) {
  const currentMonthIdx = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const [counselorName, setCounselorName] = useState(defaultCounselorName);
  const [institution, setInstitution] = useState(defaultInstitution);
  const [department, setDepartment] = useState('Vishnu Wellness Centre');
  const [month, setMonth] = useState('August');
  const [year, setYear] = useState(2026);

  // Section 1: Meetings & Administrative Activities
  const [meetings, setMeetings] = useState([
    { date: '24/08/2026', meetingName: 'VEDIC Meeting', purposeOutcome: 'Discussed July wellness centre activities & programmes, with updates and follow-up on ongoing wellness initiatives.' },
    { date: '10/08/2026', meetingName: 'Wellness Counsellors Team Coordination Meeting', purposeOutcome: 'Reviewed ongoing activities and delegated responsibilities for smooth execution of monthly programmes.' },
    { date: '23/08/2026', meetingName: 'Induction Programme for VWU & VIT', purposeOutcome: 'Participated in institutional orientation and student-parent wellness engagement.' },
    { date: '28-29/08/2026', meetingName: 'Learning & Development (L&D) Programme', purposeOutcome: 'Attended session conducted by Ms. Akshitha on Psychosomatic Conditions: A Holistic Approach.' },
    { date: '15/08/2026', meetingName: 'Vishnu Wellness Centre Social Media Account', purposeOutcome: 'Established official digital platform for mental health awareness content and student-support resources.' },
    { date: '20/08/2026', meetingName: 'Wellness Campaign Event Flyers & Banners', purposeOutcome: 'Designed promotional assets in accordance with the Vishnu Wellness Calendar for campus-wide reach.' },
  ]);

  // Section 2: Summary of Activities Conducted
  const [activities, setActivities] = useState([
    { date: '12/08/2026', activityName: 'First-Year Student Mental Health Orientation', targetAudience: '1st Year Students', participantsCount: 420, keyTakeaway: 'Introduced mental health importance and psychological wellness support services.' },
    { date: '18/08/2026', activityName: 'MINDTAP – Radio Vishnu Series', targetAudience: 'Campus Community', participantsCount: 1500, keyTakeaway: 'Recorded 5 radio awareness episodes on stress resilience and emotional wellness.' },
    { date: '25/08/2026', activityName: 'NIMHANS Gatekeeper Suicide Prevention Training', targetAudience: 'Wellness Counsellors', participantsCount: 8, keyTakeaway: 'Strengthened preparedness for early identification, distress referral, and safety support.' },
  ]);

  // Section 3: Counselling Sessions
  const [week1, setWeek1] = useState(8);
  const [week2, setWeek2] = useState(10);
  const [week3, setWeek3] = useState(7);
  const [week4, setWeek4] = useState(5);
  const [week5, setWeek5] = useState(1);

  // Concerns
  const [academicStress, setAcademicStress] = useState(14);
  const [emotionalAnxiety, setEmotionalAnxiety] = useState(9);
  const [familyInterpersonal, setFamilyInterpersonal] = useState(4);
  const [careerGuidance, setCareerGuidance] = useState(3);
  const [generalWellbeing, setGeneralWellbeing] = useState(1);
  const [crisisSos, setCrisisSos] = useState(0);

  // Section 4: Upcoming Goals
  const [goals, setGoals] = useState([
    'Continue regular individual and group counselling sessions for students.',
    'Plan and conduct a Suicide Prevention Programme to promote awareness, help-seeking behaviour, early identification, and appropriate support.',
    'Conduct the COPE Programme on Open Mic to encourage student expression, participation, and open conversations around mental health and well-being.',
    'Conduct a Psychology Club/HOPE Club group session on “Understanding Human Behaviour from a Layman’s Perspective”, helping students understand basic psychological concepts and everyday human behaviour in an accessible manner.'
  ]);

  const [remarks, setRemarks] = useState(
    'Individual counselling sessions reported reached 31 for the month. Orientation for first years and NIMHANS Gatekeeper training completed successfully.'
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  if (!isOpen) return null;

  const totalSessions = Number(week1) + Number(week2) + Number(week3) + Number(week4) + Number(week5);

  const handleAddMeeting = () => {
    setMeetings(prev => [...prev, { date: 'New Date', meetingName: '', purposeOutcome: '' }]);
  };

  const handleRemoveMeeting = (idx: number) => {
    setMeetings(prev => prev.filter((_, i) => i !== idx));
  };

  const handleAddActivity = () => {
    setActivities(prev => [...prev, { date: 'New Date', activityName: '', targetAudience: '', participantsCount: 0, keyTakeaway: '' }]);
  };

  const handleRemoveActivity = (idx: number) => {
    setActivities(prev => prev.filter((_, i) => i !== idx));
  };

  const handleAddGoal = () => {
    setGoals(prev => [...prev, '']);
  };

  const handleRemoveGoal = (idx: number) => {
    setGoals(prev => prev.filter((_, i) => i !== idx));
  };

  const buildReportData = (): CounselorMonthlyReportData => {
    return {
      id: `report-${Date.now()}`,
      counselorName,
      counselorEmail: 'counselor@vishnu.edu.in',
      department,
      institution,
      month,
      year,
      submittedAt: new Date().toISOString(),
      administrativeMeetings: meetings,
      activitiesConducted: activities,
      sessionStats: {
        week1: Number(week1),
        week2: Number(week2),
        week3: Number(week3),
        week4: Number(week4),
        week5: Number(week5),
        total: totalSessions,
        academicStress: Number(academicStress),
        emotionalAnxiety: Number(emotionalAnxiety),
        familyInterpersonal: Number(familyInterpersonal),
        careerGuidance: Number(careerGuidance),
        generalWellbeing: Number(generalWellbeing),
        crisisSos: Number(crisisSos),
        genderBreakdown: { male: 12, female: 35, other: 1 },
      },
      upcomingGoals: goals.filter(g => g.trim().length > 0),
      generalRemarks: remarks,
    };
  };

  const handleSaveAndExport = () => {
    setIsSubmitting(true);
    const reportData = buildReportData();

    // Persist in localStorage
    try {
      const stored = localStorage.getItem('mindbridge_counselor_monthly_reports');
      const existing = stored ? JSON.parse(stored) : [];
      const updated = [reportData, ...existing];
      localStorage.setItem('mindbridge_counselor_monthly_reports', JSON.stringify(updated));
    } catch (e) {
      console.warn('Error saving report to localStorage', e);
    }

    if (onSaveReport) {
      onSaveReport(reportData);
    }

    // Generate zero-alignment PDF
    generateCounselorMonthlyReportPDF(reportData);

    setSaveSuccess(true);
    setIsSubmitting(false);
    setTimeout(() => {
      setSaveSuccess(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#111111]/70 backdrop-blur-xs overflow-y-auto animate-fade-in">
      <div className="bg-[#FFFFFF] border-2 border-[#111111] rounded-3xl w-full max-w-4xl max-h-[92vh] overflow-y-auto shadow-2xl my-8 text-[#111111]">
        {/* Header */}
        <div className="sticky top-0 bg-[#FFFFFF] border-b border-[#111111]/15 px-6 py-4 flex items-center justify-between z-20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#F4C542] border-2 border-[#111111] flex items-center justify-center font-bold text-[#111111]">
              <FileText size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-black uppercase tracking-wider bg-[#F4C542] px-2 py-0.5 rounded-full border border-[#111111]">
                  Attachment 4 Format
                </span>
                <span className="text-xs text-[#111111]/60 font-mono">SVES Institutional Protocol</span>
              </div>
              <h2 className="text-lg font-heading font-black text-[#111111]">
                Counsellor Monthly Report Generator
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-[#111111]/60 hover:text-[#111111] hover:bg-[#111111]/5 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 sm:p-8 space-y-8">
          {/* Metadata Section */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-5 rounded-2xl bg-[#FAFAFA] border border-[#111111]/15">
            <div>
              <label className="block text-xs font-mono font-bold uppercase text-[#111111]/70 mb-1">
                In-Charge Psychologist
              </label>
              <input
                type="text"
                value={counselorName}
                onChange={e => setCounselorName(e.target.value)}
                className="w-full text-sm font-semibold bg-[#FFFFFF] border border-[#111111]/30 rounded-xl px-3 py-2 text-[#111111] focus:outline-hidden focus:border-[#111111]"
              />
            </div>
            <div>
              <label className="block text-xs font-mono font-bold uppercase text-[#111111]/70 mb-1">
                Institution / Campus
              </label>
              <input
                type="text"
                value={institution}
                onChange={e => setInstitution(e.target.value)}
                className="w-full text-sm font-semibold bg-[#FFFFFF] border border-[#111111]/30 rounded-xl px-3 py-2 text-[#111111] focus:outline-hidden focus:border-[#111111]"
              />
            </div>
            <div>
              <label className="block text-xs font-mono font-bold uppercase text-[#111111]/70 mb-1">
                Reporting Month & Year
              </label>
              <div className="flex gap-2">
                <select
                  value={month}
                  onChange={e => setMonth(e.target.value)}
                  className="w-2/3 text-sm font-semibold bg-[#FFFFFF] border border-[#111111]/30 rounded-xl px-3 py-2 text-[#111111] focus:outline-hidden focus:border-[#111111]"
                >
                  {MONTH_NAMES.map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
                <input
                  type="number"
                  value={year}
                  onChange={e => setYear(Number(e.target.value))}
                  className="w-1/3 text-sm font-semibold bg-[#FFFFFF] border border-[#111111]/30 rounded-xl px-3 py-2 text-[#111111] focus:outline-hidden focus:border-[#111111]"
                />
              </div>
            </div>
          </div>

          {/* 1. Administrative Meetings */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-heading font-black uppercase tracking-wider text-[#111111] flex items-center gap-2">
                <span>1. Meetings & Administrative Activities</span>
                <span className="text-xs font-mono font-normal text-[#111111]/60">({meetings.length})</span>
              </h3>
              <button
                onClick={handleAddMeeting}
                className="text-xs font-bold font-mono text-[#111111] bg-[#FAFAFA] hover:bg-[#F4C542] px-3 py-1 rounded-lg border border-[#111111] transition-all flex items-center gap-1"
              >
                <Plus size={13} /> Add Meeting
              </button>
            </div>
            <div className="space-y-2">
              {meetings.map((m, idx) => (
                <div key={idx} className="p-3 bg-[#FFFFFF] border border-[#111111]/15 rounded-xl flex flex-col sm:flex-row gap-2 items-start sm:items-center">
                  <input
                    type="text"
                    value={m.date}
                    placeholder="DD/MM/YYYY"
                    onChange={e => {
                      const updated = [...meetings];
                      updated[idx].date = e.target.value;
                      setMeetings(updated);
                    }}
                    className="w-28 text-xs font-mono font-semibold bg-[#FAFAFA] border border-[#111111]/20 rounded-lg px-2 py-1.5"
                  />
                  <input
                    type="text"
                    value={m.meetingName}
                    placeholder="Meeting Title / Stakeholders"
                    onChange={e => {
                      const updated = [...meetings];
                      updated[idx].meetingName = e.target.value;
                      setMeetings(updated);
                    }}
                    className="flex-1 text-xs font-semibold bg-[#FAFAFA] border border-[#111111]/20 rounded-lg px-2 py-1.5"
                  />
                  <input
                    type="text"
                    value={m.purposeOutcome}
                    placeholder="Purpose & Outcome"
                    onChange={e => {
                      const updated = [...meetings];
                      updated[idx].purposeOutcome = e.target.value;
                      setMeetings(updated);
                    }}
                    className="flex-1 text-xs bg-[#FAFAFA] border border-[#111111]/20 rounded-lg px-2 py-1.5"
                  />
                  <button
                    onClick={() => handleRemoveMeeting(idx)}
                    className="text-[#111111]/40 hover:text-red-600 p-1.5 rounded-lg"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* 2. Activities Conducted */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-heading font-black uppercase tracking-wider text-[#111111] flex items-center gap-2">
                <span>2. Summary of Activities & Workshops Conducted</span>
                <span className="text-xs font-mono font-normal text-[#111111]/60">({activities.length})</span>
              </h3>
              <button
                onClick={handleAddActivity}
                className="text-xs font-bold font-mono text-[#111111] bg-[#FAFAFA] hover:bg-[#F4C542] px-3 py-1 rounded-lg border border-[#111111] transition-all flex items-center gap-1"
              >
                <Plus size={13} /> Add Activity
              </button>
            </div>
            <div className="space-y-2">
              {activities.map((a, idx) => (
                <div key={idx} className="p-3 bg-[#FFFFFF] border border-[#111111]/15 rounded-xl space-y-2">
                  <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
                    <input
                      type="text"
                      value={a.date}
                      placeholder="Date"
                      onChange={e => {
                        const updated = [...activities];
                        updated[idx].date = e.target.value;
                        setActivities(updated);
                      }}
                      className="w-28 text-xs font-mono font-semibold bg-[#FAFAFA] border border-[#111111]/20 rounded-lg px-2 py-1.5"
                    />
                    <input
                      type="text"
                      value={a.activityName}
                      placeholder="Workshop / Program Name"
                      onChange={e => {
                        const updated = [...activities];
                        updated[idx].activityName = e.target.value;
                        setActivities(updated);
                      }}
                      className="flex-1 text-xs font-bold bg-[#FAFAFA] border border-[#111111]/20 rounded-lg px-2 py-1.5"
                    />
                    <input
                      type="text"
                      value={a.targetAudience}
                      placeholder="Target Group (e.g. 2nd Year B.Tech)"
                      onChange={e => {
                        const updated = [...activities];
                        updated[idx].targetAudience = e.target.value;
                        setActivities(updated);
                      }}
                      className="w-48 text-xs bg-[#FAFAFA] border border-[#111111]/20 rounded-lg px-2 py-1.5"
                    />
                    <input
                      type="number"
                      value={a.participantsCount}
                      placeholder="Count"
                      onChange={e => {
                        const updated = [...activities];
                        updated[idx].participantsCount = Number(e.target.value);
                        setActivities(updated);
                      }}
                      className="w-20 text-xs text-center font-mono font-bold bg-[#FAFAFA] border border-[#111111]/20 rounded-lg px-2 py-1.5"
                    />
                    <button
                      onClick={() => handleRemoveActivity(idx)}
                      className="text-[#111111]/40 hover:text-red-600 p-1.5 rounded-lg"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <input
                    type="text"
                    value={a.keyTakeaway}
                    placeholder="Key Impact / Clinical Takeaway / Core Outcome"
                    onChange={e => {
                      const updated = [...activities];
                      updated[idx].keyTakeaway = e.target.value;
                      setActivities(updated);
                    }}
                    className="w-full text-xs text-[#111111]/80 bg-[#FAFAFA] border border-[#111111]/15 rounded-lg px-2.5 py-1.5"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* 3. Counselling Sessions Table */}
          <div className="space-y-4">
            <h3 className="text-sm font-heading font-black uppercase tracking-wider text-[#111111]">
              3. Counselling Sessions Table (Weekly & Focus Areas)
            </h3>

            {/* Weekly grid */}
            <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
              <div className="p-3 bg-[#FAFAFA] border border-[#111111]/20 rounded-xl text-center">
                <span className="block text-[10px] font-mono uppercase font-bold text-[#111111]/60">Week 1</span>
                <input
                  type="number"
                  value={week1}
                  onChange={e => setWeek1(Number(e.target.value))}
                  className="w-full text-center text-lg font-black bg-transparent"
                />
              </div>
              <div className="p-3 bg-[#FAFAFA] border border-[#111111]/20 rounded-xl text-center">
                <span className="block text-[10px] font-mono uppercase font-bold text-[#111111]/60">Week 2</span>
                <input
                  type="number"
                  value={week2}
                  onChange={e => setWeek2(Number(e.target.value))}
                  className="w-full text-center text-lg font-black bg-transparent"
                />
              </div>
              <div className="p-3 bg-[#FAFAFA] border border-[#111111]/20 rounded-xl text-center">
                <span className="block text-[10px] font-mono uppercase font-bold text-[#111111]/60">Week 3</span>
                <input
                  type="number"
                  value={week3}
                  onChange={e => setWeek3(Number(e.target.value))}
                  className="w-full text-center text-lg font-black bg-transparent"
                />
              </div>
              <div className="p-3 bg-[#FAFAFA] border border-[#111111]/20 rounded-xl text-center">
                <span className="block text-[10px] font-mono uppercase font-bold text-[#111111]/60">Week 4</span>
                <input
                  type="number"
                  value={week4}
                  onChange={e => setWeek4(Number(e.target.value))}
                  className="w-full text-center text-lg font-black bg-transparent"
                />
              </div>
              <div className="p-3 bg-[#FAFAFA] border border-[#111111]/20 rounded-xl text-center">
                <span className="block text-[10px] font-mono uppercase font-bold text-[#111111]/60">Week 5</span>
                <input
                  type="number"
                  value={week5}
                  onChange={e => setWeek5(Number(e.target.value))}
                  className="w-full text-center text-lg font-black bg-transparent"
                />
              </div>
              <div className="p-3 bg-[#F4C542] border-2 border-[#111111] rounded-xl text-center col-span-2 sm:col-span-1">
                <span className="block text-[10px] font-mono uppercase font-black text-[#111111]">TOTAL</span>
                <span className="text-xl font-heading font-black text-[#111111]">{totalSessions}</span>
              </div>
            </div>

            {/* Concern breakdown */}
            <div className="p-4 bg-[#FFFFFF] border border-[#111111]/20 rounded-2xl space-y-3">
              <span className="text-xs font-mono font-bold uppercase text-[#111111]/70 block">
                Session Distribution by Concern Category:
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-[#111111]/70 block mb-1">Academic Stress</label>
                  <input
                    type="number"
                    value={academicStress}
                    onChange={e => setAcademicStress(Number(e.target.value))}
                    className="w-full text-xs font-bold bg-[#FAFAFA] border border-[#111111]/20 rounded-lg p-2"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-[#111111]/70 block mb-1">Emotional & Anxiety</label>
                  <input
                    type="number"
                    value={emotionalAnxiety}
                    onChange={e => setEmotionalAnxiety(Number(e.target.value))}
                    className="w-full text-xs font-bold bg-[#FAFAFA] border border-[#111111]/20 rounded-lg p-2"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-[#111111]/70 block mb-1">Family & Relationships</label>
                  <input
                    type="number"
                    value={familyInterpersonal}
                    onChange={e => setFamilyInterpersonal(Number(e.target.value))}
                    className="w-full text-xs font-bold bg-[#FAFAFA] border border-[#111111]/20 rounded-lg p-2"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-[#111111]/70 block mb-1">Career Guidance</label>
                  <input
                    type="number"
                    value={careerGuidance}
                    onChange={e => setCareerGuidance(Number(e.target.value))}
                    className="w-full text-xs font-bold bg-[#FAFAFA] border border-[#111111]/20 rounded-lg p-2"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-[#111111]/70 block mb-1">General Wellbeing</label>
                  <input
                    type="number"
                    value={generalWellbeing}
                    onChange={e => setGeneralWellbeing(Number(e.target.value))}
                    className="w-full text-xs font-bold bg-[#FAFAFA] border border-[#111111]/20 rounded-lg p-2"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-[#111111]/70 block mb-1">Crisis SOS Escalations</label>
                  <input
                    type="number"
                    value={crisisSos}
                    onChange={e => setCrisisSos(Number(e.target.value))}
                    className="w-full text-xs font-bold bg-[#FAFAFA] border border-[#111111]/20 rounded-lg p-2"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 4. Upcoming Goals */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-heading font-black uppercase tracking-wider text-[#111111]">
                4. Goals for the Upcoming Month
              </h3>
              <button
                onClick={handleAddGoal}
                className="text-xs font-bold font-mono text-[#111111] bg-[#FAFAFA] hover:bg-[#F4C542] px-3 py-1 rounded-lg border border-[#111111] transition-all flex items-center gap-1"
              >
                <Plus size={13} /> Add Goal
              </button>
            </div>
            <div className="space-y-2">
              {goals.map((g, idx) => (
                <div key={idx} className="flex gap-2 items-center">
                  <span className="w-5 text-xs font-mono font-bold text-[#111111]/50">{idx + 1}.</span>
                  <input
                    type="text"
                    value={g}
                    onChange={e => {
                      const updated = [...goals];
                      updated[idx] = e.target.value;
                      setGoals(updated);
                    }}
                    className="flex-1 text-xs font-semibold bg-[#FAFAFA] border border-[#111111]/20 rounded-xl px-3 py-2 text-[#111111]"
                  />
                  <button
                    onClick={() => handleRemoveGoal(idx)}
                    className="text-[#111111]/40 hover:text-red-600 p-1.5"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Clinical Remarks */}
          <div className="space-y-2">
            <h3 className="text-sm font-heading font-black uppercase tracking-wider text-[#111111]">
              Clinical Remarks & Overall Observations
            </h3>
            <textarea
              rows={3}
              value={remarks}
              onChange={e => setRemarks(e.target.value)}
              className="w-full text-xs bg-[#FAFAFA] border border-[#111111]/20 rounded-2xl p-3 text-[#111111] focus:outline-hidden focus:border-[#111111]"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="sticky bottom-0 bg-[#FFFFFF] border-t border-[#111111]/15 px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4 z-20">
          <div className="flex items-center gap-2 text-xs font-mono text-[#111111]/70">
            <CheckCircle2 size={16} className="text-green-600" />
            <span>Attachment 4 Vector Engine Ready (Zero Layout Drift)</span>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={onClose}
              className="w-full sm:w-auto px-5 py-2.5 rounded-2xl border border-[#111111]/30 font-bold text-xs hover:bg-[#111111]/5 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveAndExport}
              disabled={isSubmitting}
              className="w-full sm:w-auto px-6 py-2.5 rounded-2xl bg-[#F4C542] hover:bg-[#e0b435] border-2 border-[#111111] font-black text-xs text-[#111111] flex items-center justify-center gap-2 shadow-sm transition-all"
            >
              <Download size={15} />
              <span>{saveSuccess ? 'Saved & Exported!' : 'Save & Export PDF (Attachment 4)'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
