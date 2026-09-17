import React, { useState } from 'react';
import { X, Heart, Shield, CheckCircle2, Sparkles, Send, MessageSquare, PhoneCall, HelpCircle } from 'lucide-react';
import { OFFICIAL_COUNSELORS } from '../../data/counselors';
import { apiFetch, getAlias, getStudentProfile } from '../../utils/auth';

interface SessionFeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointmentId?: number | string;
  defaultFacilitator?: string;
  defaultProgram?: string;
  defaultInstitution?: string;
  defaultName?: string;
  defaultAttendeeRole?: 'Student' | 'Faculty' | 'Staff';
  onSubmitSuccess?: (feedbackData?: any) => void;
}

const INSTITUTIONS = [
  'Vishnu Institute of Technology (VIT)',
  'Shri Vishnu Engineering College for Women (SVECW)',
  'Vishnu Dental College (VDC)',
  'Smt.B.Seetha Polytechnic College (SBSP)',
  'SHRI VISHNU COLLEGE OF PHARMACY (SVCP)',
  'Shri Vishnu School (SVS)',
  'B V Raju Degree and PG College (BVRC)',
  'Sri Vishnu Educational Society (All Campuses)'
];

const COUNSELOR_NAMES = [
  'Ms. Devika Babu',
  'Mr. Ram Prudhvi Teja',
  'Ms. Angel Benny',
  'Ms. Akshitha',
  'Ms. Anumitha',
  'Ms. Sahithi',
  'Ms. Navya Sri'
];

// Innovative Non-Star 5-Tier Resonance Scale
const RESONANCE_LEVELS = [
  { value: 1, label: 'Awakening', desc: 'Needs Clarity', icon: '🌱', color: 'border-blue-300 bg-blue-50 text-blue-900' },
  { value: 2, label: 'Reflective', desc: 'Developing Insight', icon: '🌿', color: 'border-teal-300 bg-teal-50 text-teal-900' },
  { value: 3, label: 'Balanced', desc: 'Grounded & Safe', icon: '🌤️', color: 'border-amber-300 bg-amber-50 text-amber-900' },
  { value: 4, label: 'High Resonance', desc: 'Strong Clarity & Empathy', icon: '☀️', color: 'border-orange-300 bg-orange-50 text-orange-900' },
  { value: 5, label: 'Transformative', desc: 'Profoundly Impactful', icon: '✨', color: 'border-yellow-400 bg-yellow-100 text-yellow-950 ring-2 ring-[#F4C542]' },
];

const PULSE_MILESTONES: Record<number, string> = {
  1: 'Initial Touchpoint',
  2: 'Gentle Beginning',
  3: 'Gradual Safety',
  4: 'Constructive Rapport',
  5: 'Meaningful Dialogue',
  6: 'Supportive Empathy',
  7: 'Clear Breakthroughs',
  8: 'Deep Trust & Release',
  9: 'Empowering Transformation',
  10: 'Flourishing Harmony'
};

export default function SessionFeedbackModal({
  isOpen,
  onClose,
  appointmentId,
  defaultFacilitator = 'Ms. Devika Babu',
  defaultProgram = 'Individual Counselling & Emotional Wellness Session',
  defaultInstitution,
  defaultName,
  defaultAttendeeRole = 'Student',
  onSubmitSuccess
}: SessionFeedbackModalProps) {
  const currentAlias = getAlias() || '';
  const studentProfile = getStudentProfile();

  // Form State
  const [name, setName] = useState(defaultName || currentAlias || studentProfile.original_name || 'Anonymous');
  const [attendeeRole, setAttendeeRole] = useState<'Student' | 'Faculty' | 'Staff'>(defaultAttendeeRole);
  const [institution, setInstitution] = useState(defaultInstitution || INSTITUTIONS[1]); // SVECW default
  const [facilitator, setFacilitator] = useState(defaultFacilitator);
  const [programName, setProgramName] = useState(defaultProgram);

  // Sync state when modal opens or session props change
  React.useEffect(() => {
    if (isOpen) {
      if (defaultFacilitator) setFacilitator(defaultFacilitator);
      if (defaultProgram) setProgramName(defaultProgram);
      if (defaultInstitution) setInstitution(defaultInstitution);
      if (defaultName) setName(defaultName);
      if (defaultAttendeeRole) setAttendeeRole(defaultAttendeeRole);
    }
  }, [isOpen, defaultFacilitator, defaultProgram, defaultInstitution, defaultName, defaultAttendeeRole]);

  // 5-stage non-star emotive ratings
  const [q7Objectives, setQ7Objectives] = useState<number>(4);
  const [q8Interactive, setQ8Interactive] = useState<number>(5);
  const [q9Relevance, setQ9Relevance] = useState<number>(5);
  const [q10Knowledge, setQ10Knowledge] = useState<number>(4);

  // 10-stage non-star therapeutic pulse
  const [q11OverallPulse, setQ11OverallPulse] = useState<number>(9);

  // Future connection
  const [approachCounsellor, setApproachCounsellor] = useState(
    'Yes, I would like to connect with a counsellor.'
  );
  const [moreSessions, setMoreSessions] = useState<'Yes' | 'No' | 'Maybe'>('Yes');
  const [whatsapp, setWhatsapp] = useState('');
  const [topicsRequested, setTopicsRequested] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const feedbackPayload = {
      id: `fb-${Date.now()}`,
      appointmentId: appointmentId ? Number(appointmentId) : undefined,
      submittedAt: new Date().toISOString(),
      name: name.trim() || 'Anonymous Student',
      attendeeRole,
      institution,
      facilitator,
      programName,
      ratings: {
        objectivesExplained: q7Objectives,
        interactiveEngaging: q8Interactive,
        contentRelevant: q9Relevance,
        usefulKnowledgeGained: q10Knowledge,
        overallTherapeuticPulse: q11OverallPulse,
      },
      approachCounsellor,
      moreSessions,
      whatsapp: whatsapp.trim(),
      topicsRequested: topicsRequested.trim(),
    };

    // 1. Record in mindbridge_session_feedbacks list
    try {
      const stored = localStorage.getItem('mindbridge_session_feedbacks');
      const existing = stored ? JSON.parse(stored) : [];
      localStorage.setItem('mindbridge_session_feedbacks', JSON.stringify([feedbackPayload, ...existing]));
    } catch (err) {
      console.warn('Could not save feedback to localStorage', err);
    }

    // 2. Record explicit mapping for this appointmentId in mindbridge_completed_session_feedbacks
    if (appointmentId) {
      try {
        const storedMap = localStorage.getItem('mindbridge_completed_session_feedbacks');
        const compMap = storedMap ? JSON.parse(storedMap) : {};
        compMap[String(appointmentId)] = {
          feedbackId: feedbackPayload.id,
          submittedAt: feedbackPayload.submittedAt,
          facilitator,
          therapeuticPulse: q11OverallPulse,
          objectivesScore: q7Objectives,
        };
        localStorage.setItem('mindbridge_completed_session_feedbacks', JSON.stringify(compMap));

        // Update local booked appointments status to 'completed' with feedback
        const apptsRaw = localStorage.getItem('mindbridge_booked_appointments');
        if (apptsRaw) {
          const appts = JSON.parse(apptsRaw);
          const found = appts.find((a: any) => String(a.id) === String(appointmentId));
          if (found) {
            found.status = 'completed';
            found.has_feedback = true;
            found.feedback_id = feedbackPayload.id;
            localStorage.setItem('mindbridge_booked_appointments', JSON.stringify(appts));
          }
        }

        // Remove pending feedback flag for this session
        const pendingRaw = localStorage.getItem('mindbridge_pending_feedback_session');
        if (pendingRaw) {
          const pending = JSON.parse(pendingRaw);
          if (String(pending.appointmentId) === String(appointmentId)) {
            localStorage.removeItem('mindbridge_pending_feedback_session');
          }
        }
      } catch (err) {
        console.warn('Error recording feedback status for appointment:', err);
      }

      // 3. Sync to backend API endpoint
      try {
        await apiFetch(`/api/appointments/${appointmentId}/feedback`, {
          method: 'POST',
          body: JSON.stringify({
            rating: q7Objectives,
            tags: `${facilitator}, Pulse: ${q11OverallPulse}/10, Role: ${attendeeRole}`,
            comment: topicsRequested.trim() || `Therapeutic pulse: ${q11OverallPulse}/10. ${approachCounsellor}`,
          }),
        });
      } catch (apiErr) {
        console.warn('Backend feedback submission notice:', apiErr);
      }
    }

    // 4. Dispatch browser event for real-time reactivity across components
    window.dispatchEvent(
      new CustomEvent('mindbridge_session_feedback_recorded', {
        detail: feedbackPayload,
      })
    );

    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitted(true);
      if (onSubmitSuccess) onSubmitSuccess(feedbackPayload);
      setTimeout(() => {
        setSubmitted(false);
        onClose();
      }, 1500);
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#111111]/70 backdrop-blur-xs overflow-y-auto animate-fade-in">
      <div className="bg-[#FFFFFF] border-2 border-[#111111] rounded-3xl w-full max-w-3xl max-h-[92vh] overflow-y-auto shadow-2xl my-8 text-[#111111]">
        {/* Header Canopy */}
        <div className="sticky top-0 bg-[#FFFFFF] border-b border-[#111111]/15 px-6 py-4 flex items-center justify-between z-20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#F4C542] border-2 border-[#111111] flex items-center justify-center font-bold text-[#111111]">
              <Heart size={20} className="fill-[#111111]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-black uppercase tracking-wider bg-[#F4C542] px-2 py-0.5 rounded-full border border-[#111111]">
                  Official Feedback Form
                </span>
                <span className="text-xs text-[#111111]/60 font-mono">Confidential & Non-Star Resonance</span>
              </div>
              <h2 className="text-lg font-heading font-black text-[#111111]">
                Vishnu Wellness Centre – Session Feedback
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

        {/* Form Body */}
        {submitted ? (
          <div className="p-12 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-green-100 border-2 border-green-700 mx-auto flex items-center justify-center text-green-700">
              <CheckCircle2 size={36} />
            </div>
            <h3 className="text-2xl font-heading font-black text-[#111111]">
              Thank You for Your Feedback!
            </h3>
            <p className="text-sm text-[#111111]/70 max-w-md mx-auto">
              Your valuable reflections help us elevate our counselling support and create a safer, more empathetic campus environment.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-7">
            {/* Confidential notice banner */}
            <div className="p-4 rounded-2xl bg-[#FAFAFA] border border-[#111111]/15 flex items-start gap-3">
              <Shield size={18} className="text-[#111111] shrink-0 mt-0.5" />
              <p className="text-xs text-[#111111]/80 leading-relaxed">
                Thank you for participating in our wellness program. The form will take less than 2 minutes to complete. Your responses remain confidential under VWC ethics guidelines.
              </p>
            </div>

            {/* Q1: Name */}
            <div>
              <label className="block text-xs font-mono font-bold uppercase text-[#111111] mb-1.5">
                1. Name (Optional / Anonymous Alias)
              </label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Leave blank or enter your preferred alias"
                className="w-full text-sm bg-[#FAFAFA] border border-[#111111]/25 rounded-xl px-3 py-2.5 text-[#111111] focus:outline-hidden focus:border-[#111111]"
              />
            </div>

            {/* Q2: Attended role */}
            <div>
              <label className="block text-xs font-mono font-bold uppercase text-[#111111] mb-1.5">
                2. I attended this session as a
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['Student', 'Faculty', 'Staff'] as const).map(role => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => setAttendeeRole(role)}
                    className={`py-2 px-3 rounded-xl border-2 text-xs font-bold transition-all ${
                      attendeeRole === role
                        ? 'border-[#111111] bg-[#F4C542] text-[#111111] shadow-xs'
                        : 'border-[#111111]/20 bg-white text-[#111111]/70 hover:border-[#111111]/40'
                    }`}
                  >
                    {role}
                  </button>
                ))}
              </div>
            </div>

            {/* Q3: Institution */}
            <div>
              <label className="block text-xs font-mono font-bold uppercase text-[#111111] mb-1.5">
                3. Institution Name
              </label>
              <select
                value={institution}
                onChange={e => setInstitution(e.target.value)}
                className="w-full text-sm bg-[#FAFAFA] border border-[#111111]/25 rounded-xl px-3 py-2.5 text-[#111111] focus:outline-hidden focus:border-[#111111]"
              >
                {INSTITUTIONS.map(inst => (
                  <option key={inst} value={inst}>{inst}</option>
                ))}
              </select>
            </div>

            {/* Q4 & Q5: Facilitator and Program */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono font-bold uppercase text-[#111111] mb-1.5">
                  4. Facilitator / Wellness Counsellor
                </label>
                <select
                  value={facilitator}
                  onChange={e => setFacilitator(e.target.value)}
                  className="w-full text-sm bg-[#FAFAFA] border border-[#111111]/25 rounded-xl px-3 py-2.5 text-[#111111] focus:outline-hidden focus:border-[#111111]"
                >
                  {COUNSELOR_NAMES.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-mono font-bold uppercase text-[#111111] mb-1.5">
                  5. Name of the Program Attended
                </label>
                <input
                  type="text"
                  value={programName}
                  onChange={e => setProgramName(e.target.value)}
                  className="w-full text-sm bg-[#FAFAFA] border border-[#111111]/25 rounded-xl px-3 py-2.5 text-[#111111] focus:outline-hidden focus:border-[#111111]"
                />
              </div>
            </div>

            {/* SECTION: INNOVATIVE EMOTIVE RESONANCE MATRIX (NO STARS) */}
            <div className="border-t-2 border-b-2 border-[#111111]/15 py-6 space-y-6">
              <div className="flex items-center gap-2">
                <Sparkles size={18} className="text-[#111111]" />
                <h3 className="text-sm font-heading font-black uppercase tracking-wider text-[#111111]">
                  6. Session Statements — Emotive Resonance Matrix (No Stars)
                </h3>
              </div>

              {/* Q7: Objectives explained */}
              <div className="space-y-2">
                <p className="text-xs font-bold text-[#111111]">
                  7. The objectives of the session were clearly explained:
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {RESONANCE_LEVELS.map(lvl => (
                    <button
                      key={lvl.value}
                      type="button"
                      onClick={() => setQ7Objectives(lvl.value)}
                      className={`p-2.5 rounded-xl border text-left flex flex-col transition-all cursor-pointer ${
                        q7Objectives === lvl.value
                          ? `${lvl.color} border-2 border-[#111111] shadow-xs`
                          : 'bg-white border-[#111111]/15 hover:border-[#111111]/40'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-base">{lvl.icon}</span>
                        <span className="text-[10px] font-mono font-black">{lvl.value}/5</span>
                      </div>
                      <span className="text-xs font-black mt-1">{lvl.label}</span>
                      <span className="text-[10px] opacity-70 leading-tight">{lvl.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Q8: Interactive & Engaging */}
              <div className="space-y-2">
                <p className="text-xs font-bold text-[#111111]">
                  8. The session was interactive and engaging:
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {RESONANCE_LEVELS.map(lvl => (
                    <button
                      key={lvl.value}
                      type="button"
                      onClick={() => setQ8Interactive(lvl.value)}
                      className={`p-2.5 rounded-xl border text-left flex flex-col transition-all cursor-pointer ${
                        q8Interactive === lvl.value
                          ? `${lvl.color} border-2 border-[#111111] shadow-xs`
                          : 'bg-white border-[#111111]/15 hover:border-[#111111]/40'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-base">{lvl.icon}</span>
                        <span className="text-[10px] font-mono font-black">{lvl.value}/5</span>
                      </div>
                      <span className="text-xs font-black mt-1">{lvl.label}</span>
                      <span className="text-[10px] opacity-70 leading-tight">{lvl.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Q9: Relevance */}
              <div className="space-y-2">
                <p className="text-xs font-bold text-[#111111]">
                  9. The session content was relevant and useful, and the examples & activities helped me understand the topic:
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {RESONANCE_LEVELS.map(lvl => (
                    <button
                      key={lvl.value}
                      type="button"
                      onClick={() => setQ9Relevance(lvl.value)}
                      className={`p-2.5 rounded-xl border text-left flex flex-col transition-all cursor-pointer ${
                        q9Relevance === lvl.value
                          ? `${lvl.color} border-2 border-[#111111] shadow-xs`
                          : 'bg-white border-[#111111]/15 hover:border-[#111111]/40'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-base">{lvl.icon}</span>
                        <span className="text-[10px] font-mono font-black">{lvl.value}/5</span>
                      </div>
                      <span className="text-xs font-black mt-1">{lvl.label}</span>
                      <span className="text-[10px] opacity-70 leading-tight">{lvl.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Q10: Useful knowledge */}
              <div className="space-y-2">
                <p className="text-xs font-bold text-[#111111]">
                  10. I gained useful knowledge or skills from this session:
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {RESONANCE_LEVELS.map(lvl => (
                    <button
                      key={lvl.value}
                      type="button"
                      onClick={() => setQ10Knowledge(lvl.value)}
                      className={`p-2.5 rounded-xl border text-left flex flex-col transition-all cursor-pointer ${
                        q10Knowledge === lvl.value
                          ? `${lvl.color} border-2 border-[#111111] shadow-xs`
                          : 'bg-white border-[#111111]/15 hover:border-[#111111]/40'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-base">{lvl.icon}</span>
                        <span className="text-[10px] font-mono font-black">{lvl.value}/5</span>
                      </div>
                      <span className="text-xs font-black mt-1">{lvl.label}</span>
                      <span className="text-[10px] opacity-70 leading-tight">{lvl.desc}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Q11: Overall 10-Point Therapeutic Connection Pulse */}
            <div className="space-y-3 p-5 rounded-2xl bg-[#FAFAFA] border border-[#111111]/15">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <label className="text-xs font-mono font-bold uppercase text-[#111111]">
                  11. Overall Therapeutic Pulse Rating (1 to 10 Scale)
                </label>
                <div className="px-3 py-1 rounded-full bg-[#F4C542] border border-[#111111] text-[11px] font-mono font-black">
                  {q11OverallPulse}/10 · {PULSE_MILESTONES[q11OverallPulse]}
                </div>
              </div>
              <p className="text-xs text-[#111111]/60">
                Select your overall feeling of safety, connection, and progress during this session.
              </p>

              <div className="grid grid-cols-10 gap-1.5 pt-2">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(score => {
                  const isSelected = q11OverallPulse === score;
                  return (
                    <button
                      key={score}
                      type="button"
                      onClick={() => setQ11OverallPulse(score)}
                      className={`h-11 rounded-xl font-heading font-black text-sm flex items-center justify-center transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-[#111111] text-[#F4C542] scale-110 shadow-md ring-2 ring-[#F4C542]'
                          : score <= q11OverallPulse
                          ? 'bg-[#F4C542]/50 text-[#111111] hover:bg-[#F4C542]'
                          : 'bg-white border border-[#111111]/20 text-[#111111]/60 hover:border-[#111111]'
                      }`}
                    >
                      {score}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Q12: Approach counsellor */}
            <div>
              <label className="block text-xs font-mono font-bold uppercase text-[#111111] mb-2">
                12. Would you like to approach your counsellor after this session?
              </label>
              <div className="space-y-2">
                {[
                  'Yes, I would like to connect with a counsellor.',
                  'Maybe, I may need support in the future.',
                  'No, I do not require support at this time.'
                ].map(opt => (
                  <label
                    key={opt}
                    className={`flex items-center gap-3 p-3 rounded-xl border text-xs font-medium cursor-pointer transition-all ${
                      approachCounsellor === opt
                        ? 'bg-[#F4C542]/20 border-[#111111] text-[#111111] font-bold'
                        : 'bg-white border-[#111111]/15 text-[#111111]/80 hover:border-[#111111]/40'
                    }`}
                  >
                    <input
                      type="radio"
                      name="approach"
                      checked={approachCounsellor === opt}
                      onChange={() => setApproachCounsellor(opt)}
                      className="accent-[#111111]"
                    />
                    <span>{opt}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Q13: More sessions */}
            <div>
              <label className="block text-xs font-mono font-bold uppercase text-[#111111] mb-2">
                13. Would you like more sessions from our wellness team?
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['Yes', 'No', 'Maybe'] as const).map(opt => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setMoreSessions(opt)}
                    className={`py-2 px-3 rounded-xl border-2 text-xs font-bold transition-all ${
                      moreSessions === opt
                        ? 'border-[#111111] bg-[#F4C542] text-[#111111]'
                        : 'border-[#111111]/20 bg-white text-[#111111]/70'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            {/* Q14: WhatsApp */}
            <div>
              <label className="block text-xs font-mono font-bold uppercase text-[#111111] mb-1">
                14. Your Contact Details (WhatsApp Number)
              </label>
              <p className="text-[11px] text-[#111111]/60 mb-2">
                Only your wellness counsellor will contact you and your details will be kept confidential and under our records safely.
              </p>
              <input
                type="tel"
                value={whatsapp}
                onChange={e => setWhatsapp(e.target.value)}
                placeholder="+91 98765 43210 (Optional)"
                className="w-full text-sm bg-[#FAFAFA] border border-[#111111]/25 rounded-xl px-3 py-2.5 text-[#111111]"
              />
            </div>

            {/* Q15: Topics */}
            <div>
              <label className="block text-xs font-mono font-bold uppercase text-[#111111] mb-1">
                15. If yes, what topics would you like us to cover?
              </label>
              <textarea
                rows={2}
                value={topicsRequested}
                onChange={e => setTopicsRequested(e.target.value)}
                placeholder="e.g. Overcoming imposter syndrome, sleep management, handling peer pressure..."
                className="w-full text-xs bg-[#FAFAFA] border border-[#111111]/25 rounded-xl p-3 text-[#111111]"
              />
            </div>

            {/* Submit Button */}
            <div className="pt-3">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 rounded-2xl bg-[#F4C542] hover:bg-[#e0b435] text-[#111111] font-heading font-black text-sm border-2 border-[#111111] transition-all flex items-center justify-center gap-2 shadow-sm active:scale-[0.99] cursor-pointer disabled:opacity-50"
              >
                <Send size={16} />
                <span>{isSubmitting ? 'Submitting Feedback...' : 'Submit Wellness Feedback'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
