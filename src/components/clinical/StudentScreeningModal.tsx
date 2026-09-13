import React, { useState } from 'react';
import { 
  Shield, AlertTriangle, CheckCircle2, ChevronRight, 
  ChevronLeft, Sparkles, X, Heart, Building2, HelpCircle 
} from 'lucide-react';
import { apiFetch, getAlias } from '../../utils/auth';

export interface ScreeningResult {
  id: string;
  student_name: string;
  student_alias: string;
  studentAlias?: string;
  institution: string;
  department: string;
  year: string;
  yearOfStudy?: string;
  section: string;
  hostel_status: string;
  stayType?: string;
  gender?: string;
  whatsapp_number: string;
  whatsappNumber?: string;
  age: string;
  dass_scores: {
    depression: number;
    anxiety: number;
    stress: number;
    total: number;
  };
  dassScores?: {
    depression: number;
    anxiety: number;
    stress: number;
    total: number;
  };
  has_self_harm_thoughts: 'Yes' | 'No' | 'Maybe';
  recent_trauma: 'Yes' | 'No';
  issue_note?: string;
  contact_consent: string;
  risk_level: 'High' | 'Medium' | 'Low';
  riskTier?: 'High' | 'Medium' | 'Low';
  risk_score: number; // 0.0 to 1.0
  submitted_at: string;
  answers?: Record<string, any>;
}

export type ScreeningSubmission = ScreeningResult;

export interface StudentScreeningModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCompleted?: (result: ScreeningResult) => void;
  onComplete?: (result: ScreeningResult) => void;
}

const DASS_QUESTIONS = [
  { id: 'q10', type: 's', en: 'I found it hard to wind down', te: 'ఎంత ప్రయత్నించినా నా మనసు కుదుటపడలేదు. నాకు ప్రశాంతంగా ఉండటం కష్టమైపోయింది.' },
  { id: 'q11', type: 'a', en: 'I was aware of dryness of my mouth', te: 'నా నోరు పొడారడం/ఎండిపోవడం నాకు తెలుస్తుంది' },
  { id: 'q12', type: 'd', en: 'I couldn’t seem to experience any positive feeling at all', te: 'పరిస్థితుల నుండి మంచి అనుభవాలు పొందలేకున్నాను' },
  { id: 'q13', type: 'a', en: 'I experienced breathing difficulty (in absence of exertion)', te: 'నాకు శ్వాస తీసుకోవడం ఇబ్బందిగావుంది (శారీరక శ్రమ లేకపోయినా ఆయాసపడటం)' },
  { id: 'q14', type: 'd', en: 'I found it difficult to work up the initiative to do things', te: 'నాకు ఒక కొత్త పని మొదలుపెట్టడానికి కష్టంగావుంది/ఉత్సాహంగా లేదు' },
  { id: 'q15', type: 's', en: 'I tended to over-react to situations', te: 'నేను పరిస్థితులకు అతిగా స్పందిస్తున్నాను' },
  { id: 'q16', type: 'a', en: 'I experienced trembling (e.g. in the hands)', te: 'నాకు శరీరం వణుకుతున్నట్లు అనిపిస్తోంది (ఉదా: చేతులు వణకడం)' },
  { id: 'q17', type: 's', en: 'I felt that I was using a lot of nervous energy', te: 'నేను ఆందోళన చెందటం వలన చాలా శక్తిని ఖర్చుచేస్తున్నాను అని నాకు అనిపిస్తుంది' },
  { id: 'q18', type: 'a', en: 'I was worried about situations in which I might panic', te: 'నేను కొన్ని పరిస్థితులలో భయపడి నవ్వులపాలు అవుతానేమో అని చింతిస్తున్నాను' },
  { id: 'q19', type: 'd', en: 'I felt that I had nothing to look forward to', te: 'నా జీవితంలో ఎదురు చూసేలా ఏమి లేదని నాకు అనిపిస్తోంది' },
  { id: 'q20', type: 's', en: 'I found myself getting agitated', te: 'నేను అసహనానికి లోనవుతున్నాను అని అనిపిస్తోంది' },
  { id: 'q21', type: 's', en: 'I found it difficult to relax', te: 'నేను విశ్రాంతి తీసుకోవడానికి ఇబ్బంది పడుతున్నాను' },
  { id: 'q22', type: 'd', en: 'I felt down-hearted and blue', te: 'నాకు చాలా బాధగా, నిరాశగా అనిపిస్తోంది' },
  { id: 'q23', type: 's', en: 'I was intolerant of anything that kept me from what I was doing', te: 'నేను చేసే పనిని ఆపే దేనినైనా నేను సహించలేకపోతున్నాను' },
  { id: 'q24', type: 'a', en: 'I felt I was close to panic', te: 'నేను భయాందోళనకు గురవుతున్నానేమో అని అనిపిస్తోంది' },
  { id: 'q25', type: 'd', en: 'I was unable to become enthusiastic about anything', te: 'నేను దేనిగురించీ ఆసక్తిగా, ఉత్సాహంగా ఉండలేకపోతున్నాను' },
  { id: 'q26', type: 'd', en: 'I felt I wasn’t worth much as a person', te: 'నాకు నా పట్ల విలువ లేదనిపిస్తోంది' },
  { id: 'q27', type: 's', en: 'I felt that I was rather touchy', te: 'నాకు చిన్న విషయాలకు చిరాకు వస్తోంది' },
  { id: 'q28', type: 'a', en: 'I was aware of the action of my heart without physical exertion', te: 'నాకు శారీరక శ్రమ లేకపోయినా గుండె దడగా వుంటోంది (గుబులు, ఆందోళన)' },
  { id: 'q29', type: 'a', en: 'I felt scared without any good reason', te: 'సరిఅయిన కారణం లేకుండానే భయపడుతున్నాను' },
  { id: 'q30', type: 'd', en: 'I felt that life was meaningless', te: 'నా జీవితం అర్ధవంతంగా లేనిది/వ్యర్థం అని అనిపిస్తోంది' }
];

export const StudentScreeningModal: React.FC<StudentScreeningModalProps> = ({
  isOpen,
  onClose,
  onCompleted,
}) => {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1); // 1: Demographics, 2: DASS-21, 3: Critical safety, 4: Consent & Submit

  // Demographics
  const [name, setName] = useState('');
  const [institution, setInstitution] = useState('Vishnu Institute of Technology (VIT)');
  const [department, setDepartment] = useState('Computer Science & Engineering');
  const [year, setYear] = useState('2nd Year');
  const [section, setSection] = useState('A Section');
  const [hostel, setHostel] = useState('Hostel');
  const [age, setAge] = useState('Above 18');
  const [whatsapp, setWhatsapp] = useState('');

  // DASS-21 answers: key -> 0 | 1 | 2 | 3
  const [dassAnswers, setDassAnswers] = useState<Record<string, number>>({});

  // Critical items
  const [selfHarm, setSelfHarm] = useState<'Yes' | 'No' | 'Maybe'>('No');
  const [trauma, setTrauma] = useState<'Yes' | 'No'>('No');
  const [issueNote, setIssueNote] = useState('');
  const [mayContact, setMayContact] = useState('Yes, I would like to receive support from my wellness counsellor');

  // Consent
  const [agreedConfidential, setAgreedConfidential] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submittedResult, setSubmittedResult] = useState<ScreeningResult | null>(null);

  if (!isOpen) return null;

  const handleDassChange = (id: string, val: number) => {
    setDassAnswers(prev => ({ ...prev, [id]: val }));
  };

  const calculateEvaluation = () => {
    let sRaw = 0;
    let aRaw = 0;
    let dRaw = 0;

    DASS_QUESTIONS.forEach(q => {
      const val = dassAnswers[q.id] || 0;
      if (q.type === 's') sRaw += val;
      if (q.type === 'a') aRaw += val;
      if (q.type === 'd') dRaw += val;
    });

    const depressionScore = dRaw * 2;
    const anxietyScore = aRaw * 2;
    const stressScore = sRaw * 2;
    const totalDass = depressionScore + anxietyScore + stressScore;

    // High risk: self-harm thoughts = Yes, or severe subscales
    let riskLevel: 'High' | 'Medium' | 'Low' = 'Low';
    let riskScore = totalDass / 126; // normalized 0 to 1

    if (selfHarm === 'Yes' || depressionScore >= 21 || anxietyScore >= 15 || stressScore >= 26) {
      riskLevel = 'High';
      riskScore = Math.max(0.75, riskScore);
    } else if (selfHarm === 'Maybe' || depressionScore >= 14 || anxietyScore >= 10 || stressScore >= 19) {
      riskLevel = 'Medium';
      riskScore = Math.max(0.45, riskScore);
    } else {
      riskLevel = 'Low';
      riskScore = Math.min(0.35, riskScore);
    }

    return {
      dass_scores: {
        depression: depressionScore,
        anxiety: anxietyScore,
        stress: stressScore,
        total: totalDass
      },
      risk_level: riskLevel,
      risk_score: parseFloat(riskScore.toFixed(2))
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const evaluation = calculateEvaluation();
    const result: ScreeningResult = {
      id: `scr-${Date.now()}`,
      student_name: name || getAlias() || 'Student',
      student_alias: getAlias() || 'Student #4821',
      studentAlias: getAlias() || 'Student #4821',
      institution,
      department,
      year,
      yearOfStudy: year,
      section,
      hostel_status: hostel,
      stayType: hostel,
      whatsapp_number: whatsapp,
      whatsappNumber: whatsapp,
      age,
      dass_scores: evaluation.dass_scores,
      dassScores: evaluation.dass_scores,
      has_self_harm_thoughts: selfHarm,
      recent_trauma: trauma,
      issue_note: issueNote,
      contact_consent: mayContact,
      risk_level: evaluation.risk_level,
      riskTier: evaluation.risk_level,
      risk_score: evaluation.risk_score,
      submitted_at: new Date().toISOString()
    };

    // Save to local storage for instant sync with Counsellor portal
    try {
      const stored = localStorage.getItem('mindbridge_screening_results');
      const list = stored ? JSON.parse(stored) : [];
      localStorage.setItem('mindbridge_screening_results', JSON.stringify([result, ...list]));
      localStorage.setItem('mindbridge_student_screened', 'true');
    } catch {}

    // Also attempt backend risk API update
    try {
      await apiFetch('/api/risk/evaluate', {
        method: 'POST',
        body: JSON.stringify({
          risk_score: result.risk_score,
          factors: {
            dass: result.dass_scores,
            self_harm: selfHarm,
            institution
          }
        })
      });
    } catch {}

    setSubmitting(false);
    setSubmittedResult(result);
    onCompleted?.(result);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#111111]/70 backdrop-blur-xs animate-fade-in">
      <div className="bg-[#FFFFFF] text-[#111111] w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl border-2 border-[#111111] p-6 sm:p-8 shadow-2xl relative space-y-6 hide-scrollbar">
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 rounded-full bg-[#111111]/5 hover:bg-[#111111]/10 text-[#111111] flex items-center justify-center transition-colors cursor-pointer"
        >
          <X size={18} />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="Vishnu Wellness Centre" className="w-10 h-10 rounded-full object-cover border border-[#111111]/20 bg-white" />
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#F4C542] border border-[#111111] text-[10px] font-mono font-black uppercase">
              Mandatory Campus Health Form
            </div>
            <h2 className="font-heading font-black text-lg sm:text-xl text-[#111111] mt-0.5">
              Student Wellbeing Screening Form
            </h2>
          </div>
        </div>

        {/* Success Confirmation View */}
        {submittedResult ? (
          <div className="p-6 rounded-2xl bg-[#FAFAFA] border-2 border-[#111111] text-center space-y-4 animate-scale-in">
            <div className="w-16 h-16 rounded-full bg-emerald-100 border-2 border-emerald-500 text-emerald-600 flex items-center justify-center mx-auto text-2xl">
              ✓
            </div>
            <h3 className="font-heading font-black text-xl text-[#111111]">
              Screening Submitted Successfully
            </h3>
            <p className="text-xs sm:text-sm text-[#111111]/75 max-w-md mx-auto leading-relaxed">
              Thank you for completing your mandatory wellness check. Your designated campus wellness counsellor at <strong>{submittedResult.institution}</strong> has received your confidential evaluation.
            </p>

            {/* Risk Tier Badge Result */}
            <div className="p-4 rounded-xl bg-[#FFFFFF] border border-[#111111]/15 max-w-sm mx-auto space-y-2">
              <span className="text-[11px] font-mono font-bold text-[#111111]/60 uppercase">Evaluation Result</span>
              <div className="flex items-center justify-center gap-2">
                <span className={`px-3 py-1 rounded-full font-mono font-black text-xs ${
                  submittedResult.risk_level === 'High' 
                    ? 'bg-rose-100 text-rose-800 border border-rose-300' 
                    : submittedResult.risk_level === 'Medium'
                    ? 'bg-amber-100 text-amber-800 border border-amber-300'
                    : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                }`}>
                  {submittedResult.risk_level.toUpperCase()} PRIORITY
                </span>
                <span className="text-xs font-mono text-[#111111]/70">
                  Risk Score: {Math.round(submittedResult.risk_score * 100)}%
                </span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl bg-[#F4C542] hover:bg-[#e0b435] text-[#111111] font-black text-xs border-2 border-[#111111] shadow-xs cursor-pointer"
            >
              Back to Student Portal
            </button>
          </div>
        ) : (
          <>
            {/* Step Navigation Dots */}
            <div className="flex items-center justify-between border-b border-[#111111]/10 pb-3 text-xs font-mono font-bold">
              <span className={`px-3 py-1 rounded-xl transition-all ${step === 1 ? 'bg-[#111111] text-[#FFFFFF]' : 'text-[#111111]/60'}`}>
                1. Demographics
              </span>
              <span className={`px-3 py-1 rounded-xl transition-all ${step === 2 ? 'bg-[#111111] text-[#FFFFFF]' : 'text-[#111111]/60'}`}>
                2. DASS-21 (21 Items)
              </span>
              <span className={`px-3 py-1 rounded-xl transition-all ${step === 3 ? 'bg-[#111111] text-[#FFFFFF]' : 'text-[#111111]/60'}`}>
                3. Safety &amp; Trauma
              </span>
              <span className={`px-3 py-1 rounded-xl transition-all ${step === 4 ? 'bg-[#111111] text-[#FFFFFF]' : 'text-[#111111]/60'}`}>
                4. Consent &amp; Submit
              </span>
            </div>

            {/* STEP 1: Demographics */}
            {step === 1 && (
              <div className="space-y-4 animate-fade-in">
                <p className="text-xs text-[#111111]/75 leading-relaxed bg-[#FAFAFA] p-3.5 rounded-2xl border border-[#111111]/10">
                  Please provide your academic and residential details. All information is confidential and accessible only by your designated campus wellness counsellor.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-[#111111] uppercase tracking-wider mb-1">
                      Student Full Name *
                    </label>
                    <input 
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Rahul Sharma"
                      className="w-full px-4 py-2.5 rounded-xl bg-[#FAFAFA] border border-[#111111]/20 text-xs font-semibold focus:outline-none focus:border-[#111111]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#111111] uppercase tracking-wider mb-1">
                      Institution Name *
                    </label>
                    <select
                      value={institution}
                      onChange={(e) => setInstitution(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-[#FAFAFA] border border-[#111111]/20 text-xs font-bold focus:outline-none focus:border-[#111111]"
                    >
                      <option value="Vishnu Institute of Technology (VIT)">Vishnu Institute of Technology (VIT)</option>
                      <option value="Shri Vishnu Engineering College for Women (SVECW)">Shri Vishnu Engineering College for Women (SVECW)</option>
                      <option value="Vishnu Dental College (VDC)">Vishnu Dental College (VDC)</option>
                      <option value="Smt.B.Seetha Polytechnic College (SBSP)">Smt.B.Seetha Polytechnic College (SBSP)</option>
                      <option value="SHRI VISHNU COLLEGE OF PHARMACY (SVCP)">SHRI VISHNU COLLEGE OF PHARMACY (SVCP)</option>
                      <option value="B V Raju Degree and PG College (BVRC)">B V Raju Degree and PG College (BVRC)</option>
                      <option value="Shri Vishnu School (SVS)">Shri Vishnu School (SVS)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#111111] uppercase tracking-wider mb-1">
                      Department / Branch *
                    </label>
                    <input 
                      type="text"
                      required
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      placeholder="e.g. CSE, ECE, BDS, Pharmacy"
                      className="w-full px-4 py-2.5 rounded-xl bg-[#FAFAFA] border border-[#111111]/20 text-xs font-semibold focus:outline-none focus:border-[#111111]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-bold text-[#111111] uppercase tracking-wider mb-1">
                        Year
                      </label>
                      <select
                        value={year}
                        onChange={(e) => setYear(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl bg-[#FAFAFA] border border-[#111111]/20 text-xs font-bold focus:outline-none focus:border-[#111111]"
                      >
                        <option value="1st Year">1st Year</option>
                        <option value="2nd Year">2nd Year</option>
                        <option value="3rd Year">3rd Year</option>
                        <option value="4th Year">4th Year</option>
                        <option value="5th Year">5th Year</option>
                        <option value="6th Year">6th Year</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#111111] uppercase tracking-wider mb-1">
                        Section
                      </label>
                      <select
                        value={section}
                        onChange={(e) => setSection(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl bg-[#FAFAFA] border border-[#111111]/20 text-xs font-bold focus:outline-none focus:border-[#111111]"
                      >
                        <option value="A Section">A Section</option>
                        <option value="B Section">B Section</option>
                        <option value="C Section">C Section</option>
                        <option value="D Section">D Section</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#111111] uppercase tracking-wider mb-1">
                      Hostel / Day Scholar
                    </label>
                    <select
                      value={hostel}
                      onChange={(e) => setHostel(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-[#FAFAFA] border border-[#111111]/20 text-xs font-bold focus:outline-none focus:border-[#111111]"
                    >
                      <option value="Hostel">Hostel Resident</option>
                      <option value="Day Scholar">Day Scholar</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#111111] uppercase tracking-wider mb-1">
                      WhatsApp Contact Number *
                    </label>
                    <input 
                      type="tel"
                      required
                      value={whatsapp}
                      onChange={(e) => setWhatsapp(e.target.value)}
                      placeholder="+91 9876543210"
                      className="w-full px-4 py-2.5 rounded-xl bg-[#FAFAFA] border border-[#111111]/20 text-xs font-semibold focus:outline-none focus:border-[#111111]"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="px-5 py-2.5 rounded-xl bg-[#F4C542] hover:bg-[#e0b435] text-[#111111] font-black text-xs border-2 border-[#111111] shadow-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>Proceed to DASS-21</span>
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: DASS-21 Questionnaire */}
            {step === 2 && (
              <div className="space-y-5 animate-fade-in">
                <div className="p-3.5 rounded-2xl bg-[#FAFAFA] border border-[#111111]/10 text-xs text-[#111111]/80 space-y-1">
                  <p className="font-bold text-[#111111]">
                    How much did each statement apply to you over the past week? (గత ఒక వారం రోజులలో మీకు ఎలా అనిపించిందో గుర్తు చేసుకోండి)
                  </p>
                  <p className="font-mono text-[11px] text-[#111111]/60">
                    Scale: 0 = Did not apply at all • 1 = To some degree • 2 = Considerable degree • 3 = Very much/most of the time
                  </p>
                </div>

                <div className="space-y-3 max-h-[440px] overflow-y-auto pr-1">
                  {DASS_QUESTIONS.map((q, idx) => {
                    const currentVal = dassAnswers[q.id] ?? 0;
                    return (
                      <div key={q.id} className="p-3.5 rounded-2xl bg-[#FFFFFF] border border-[#111111]/15 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="text-xs font-black text-[#111111]">
                              {idx + 1}. {q.en}
                            </span>
                            <p className="text-[11px] text-[#111111]/70 font-medium mt-0.5">
                              {q.te}
                            </p>
                          </div>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#FAFAFA] border border-[#111111]/10 font-bold shrink-0">
                            {q.type.toUpperCase()}
                          </span>
                        </div>

                        {/* 4-point radio buttons */}
                        <div className="grid grid-cols-4 gap-1.5 pt-1">
                          {[0, 1, 2, 3].map((val) => (
                            <button
                              key={val}
                              type="button"
                              onClick={() => handleDassChange(q.id, val)}
                              className={`py-1.5 px-2 rounded-xl text-xs font-mono font-bold transition-all text-center cursor-pointer ${
                                currentVal === val
                                  ? 'bg-[#111111] text-[#FFFFFF] shadow-xs'
                                  : 'bg-[#FAFAFA] text-[#111111]/70 hover:bg-[#111111]/5 border border-[#111111]/10'
                              }`}
                            >
                              {val} {val === 0 ? '(None)' : val === 3 ? '(Most)' : ''}
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="flex justify-between pt-4 border-t border-[#111111]/10">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="px-4 py-2 rounded-xl border border-[#111111] text-xs font-bold text-[#111111] flex items-center gap-1 cursor-pointer"
                  >
                    <ChevronLeft size={14} /> Back
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep(3)}
                    className="px-5 py-2.5 rounded-xl bg-[#F4C542] hover:bg-[#e0b435] text-[#111111] font-black text-xs border-2 border-[#111111] shadow-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>Safety Questions</span>
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: Critical Safety & Trauma Questions */}
            {step === 3 && (
              <div className="space-y-5 animate-fade-in">
                <div className="p-4 rounded-2xl bg-amber-50 border-2 border-amber-300 text-amber-900 space-y-1">
                  <span className="font-heading font-black text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <AlertTriangle size={14} />
                    <span>Important Clinical Safety Questions</span>
                  </span>
                  <p className="text-xs text-amber-800/90 leading-relaxed">
                    Please answer with complete honesty. Your wellness counsellor is here to support you in a completely judgment-free safe space.
                  </p>
                </div>

                {/* Self-harm thoughts */}
                <div className="p-4 rounded-2xl bg-[#FFFFFF] border-2 border-[#111111]/20 space-y-3">
                  <label className="block text-xs sm:text-sm font-heading font-black text-[#111111]">
                    During the past 2 weeks, have you had thoughts that life is not worth living or thoughts of harming yourself?
                    <span className="block text-xs font-medium text-[#111111]/70 mt-0.5">
                      (గత రెండు వారాల్లో, "బ్రతకడం అనవసరమని" లేదా "నాకు నేనే హాని చేసుకోవాలనే" ఆలోచనలు మీకు వచ్చాయా?)
                    </span>
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['No', 'Maybe', 'Yes'] as const).map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setSelfHarm(opt)}
                        className={`py-2 px-3 rounded-xl text-xs font-black transition-all cursor-pointer ${
                          selfHarm === opt
                            ? opt === 'Yes' ? 'bg-rose-600 text-white shadow-xs' : 'bg-[#111111] text-white shadow-xs'
                            : 'bg-[#FAFAFA] text-[#111111]/70 border border-[#111111]/15'
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Recent Trauma */}
                <div className="p-4 rounded-2xl bg-[#FFFFFF] border-2 border-[#111111]/20 space-y-3">
                  <label className="block text-xs sm:text-sm font-heading font-black text-[#111111]">
                    Have you experienced or witnessed any traumatic or very upsetting events recently?
                    <span className="block text-xs font-medium text-[#111111]/70 mt-0.5">
                      (మీరు ఈ మధ్య కాలంలో ఏమైనా బాధను కలిగించేది లేదా మనశ్శాంతి కోల్పోయేలా చేసిన సంఘటనలు చూసారా లేదా అనుభవించారా?)
                    </span>
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {(['No', 'Yes'] as const).map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setTrauma(opt)}
                        className={`py-2 px-3 rounded-xl text-xs font-black transition-all cursor-pointer ${
                          trauma === opt
                            ? 'bg-[#111111] text-white shadow-xs'
                            : 'bg-[#FAFAFA] text-[#111111]/70 border border-[#111111]/15'
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Optional Issue Note */}
                <div>
                  <label className="block text-xs font-bold text-[#111111] uppercase tracking-wider mb-1">
                    Any Issue you want to Mention (Optional):
                  </label>
                  <textarea 
                    rows={3}
                    value={issueNote}
                    onChange={(e) => setIssueNote(e.target.value)}
                    placeholder="Describe anything that is currently stressing you or causing emotional strain..."
                    className="w-full px-4 py-3 rounded-xl bg-[#FAFAFA] border border-[#111111]/20 text-xs sm:text-sm font-medium focus:outline-none focus:border-[#111111]"
                  />
                </div>

                <div className="flex justify-between pt-4 border-t border-[#111111]/10">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="px-4 py-2 rounded-xl border border-[#111111] text-xs font-bold text-[#111111] flex items-center gap-1 cursor-pointer"
                  >
                    <ChevronLeft size={14} /> Back
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep(4)}
                    className="px-5 py-2.5 rounded-xl bg-[#F4C542] hover:bg-[#e0b435] text-[#111111] font-black text-xs border-2 border-[#111111] shadow-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>Consent &amp; Review</span>
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 4: Consent & Submission */}
            {step === 4 && (
              <form onSubmit={handleSubmit} className="space-y-5 animate-fade-in">
                <div className="p-4 rounded-2xl bg-[#FAFAFA] border-2 border-[#111111]/15 space-y-3">
                  <h4 className="font-heading font-black text-sm text-[#111111] uppercase tracking-wider">
                    My Consent &amp; Understanding
                  </h4>
                  <p className="text-xs text-[#111111]/75 leading-relaxed">
                    Your responses will be kept strictly confidential and will only be accessed by your authorized campus Wellness Counsellor at <strong>{institution}</strong>. Completing this form does not mean you have a psychiatric condition or clinical diagnosis.
                  </p>

                  <label className="flex items-start gap-2.5 text-xs text-[#111111] cursor-pointer pt-2">
                    <input 
                      type="checkbox"
                      required
                      checked={agreedConfidential}
                      onChange={(e) => setAgreedConfidential(e.target.checked)}
                      className="mt-0.5 rounded border-[#111111] text-[#111111] focus:ring-0"
                    />
                    <span>
                      I agree that the information provided is confidential and I consent to my designated wellness counsellor contacting me for free student psychological support if needed.
                    </span>
                  </label>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#111111] uppercase tracking-wider mb-1.5">
                    If you require personal support, may we contact you?
                  </label>
                  <select
                    value={mayContact}
                    onChange={(e) => setMayContact(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-[#FAFAFA] border border-[#111111]/20 text-xs font-bold focus:outline-none focus:border-[#111111]"
                  >
                    <option value="Yes, I would like to receive support from my wellness counsellor">
                      Yes, I would like to receive support from my wellness counsellor
                    </option>
                    <option value="Not at the moment.">
                      Not at the moment.
                    </option>
                    <option value="I may need support in the future.">
                      I may need support in the future.
                    </option>
                  </select>
                </div>

                <div className="flex justify-between pt-4 border-t border-[#111111]/10">
                  <button
                    type="button"
                    onClick={() => setStep(3)}
                    className="px-4 py-2 rounded-xl border border-[#111111] text-xs font-bold text-[#111111] flex items-center gap-1 cursor-pointer"
                  >
                    <ChevronLeft size={14} /> Back
                  </button>
                  <button
                    type="submit"
                    disabled={submitting || !agreedConfidential}
                    className="px-6 py-3 rounded-xl bg-[#F4C542] hover:bg-[#e0b435] text-[#111111] font-black text-xs sm:text-sm border-2 border-[#111111] shadow-sm flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <CheckCircle2 size={16} />
                    <span>{submitting ? 'Submitting Form...' : 'Submit Mandatory Screening'}</span>
                  </button>
                </div>
              </form>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default StudentScreeningModal;
