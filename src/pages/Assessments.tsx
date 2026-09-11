import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, RotateCcw, ChevronRight, Brain, AlertCircle, Sparkles, Shield, BarChart3, TrendingUp } from 'lucide-react';
import { apiFetch, isLoggedIn } from '../utils/auth';

// ─── PHQ-9 (Depression Screening) ──────────────────────────────────────────────
const PHQ9 = {
  id: 'phq9' as const,
  name: 'PHQ-9',
  title: 'Depression & Mood Screening',
  subtitle: 'Patient Health Questionnaire (9 Clinical Items)',
  emoji: '🧠',
  color: 'from-blue-600 to-indigo-700',
  intro: 'Over the last 2 weeks, how often have you been bothered by any of the following occurrences?',
  options: ['Not at all (0 pts)', 'Several days (1 pt)', 'More than half the days (2 pts)', 'Nearly every day (3 pts)'],
  questions: [
    'Little interest or pleasure in doing academic or personal activities',
    'Feeling down, depressed, isolated, or hopeless',
    'Trouble falling or staying asleep, or sleeping significantly too much',
    'Feeling chronically tired or having depleted physical energy',
    'Poor appetite or emotional overeating',
    'Feeling negative about yourself — feeling that you are a failure or let your family down',
    'Trouble concentrating on lectures, programming tasks, or readings',
    'Moving or speaking so slowly that others noticed, or being unusually restless and jittery',
    'Intrusive thoughts that you would be better off entirely absent or self-harming in some way',
  ],
  interpret: (score: number) => {
    if (score <= 4)  return { label: 'Minimal',             color: 'text-emerald-400', bg: 'bg-emerald-500/20 border-emerald-500/40', advice: 'Your responses suggest healthy mood equilibrium. Keep maintaining your supportive habits!' };
    if (score <= 9)  return { label: 'Mild Depression',     color: 'text-amber-300',   bg: 'bg-amber-500/20 border-amber-500/40',   advice: 'Mild symptoms observed. Consider leveraging our CBT Reframing suite or speaking to a peer campus counselor.' };
    if (score <= 14) return { label: 'Moderate Depression', color: 'text-orange-400',  bg: 'bg-orange-500/20 border-orange-500/40',  advice: 'Moderate stress load. Booking a confident clinical counseling session via the platform is highly recommended.' };
    if (score <= 19) return { label: 'Moderately Severe',   color: 'text-rose-400',    bg: 'bg-rose-500/20 border-rose-500/40',    advice: 'Significant depressive interference. Please connect with a VIT counselor this week for a supportive care plan.' };
    return            { label: 'Severe Depression',       color: 'text-red-500 font-extrabold animate-pulse', bg: 'bg-red-600/30 border-red-500', advice: 'Critical depressive exhaustion detected. Please utilize our Emergency Crisis SOS immediately to connect with clinical support.' };
  },
};

// ─── GAD-7 (Anxiety Screening) ─────────────────────────────────────────────────
const GAD7 = {
  id: 'gad7' as const,
  name: 'GAD-7',
  title: 'Anxiety & Worry Screening',
  subtitle: 'Generalised Anxiety Disorder Protocol (7 Items)',
  emoji: '💭',
  color: 'from-emerald-600 to-teal-700',
  intro: 'Over the last 2 weeks, how often have you felt overwhelmed by the following challenges?',
  options: ['Not at all (0 pts)', 'Several days (1 pt)', 'More than half the days (2 pts)', 'Nearly every day (3 pts)'],
  questions: [
    'Feeling nervous, anxious, tightly keyed up, or on edge',
    'Not being able to stop or calm persistent anxious worries',
    'Worrying uncontrollably about assignments, placements, or family expectations',
    'Inability to truly rest or relax your physical musculature',
    'Being so restless that sitting still during classes or study sessions feels extremely uncomfortable',
    'Becoming unusually irritable, frustrated, or reactive with peers',
    'An abrupt sense of dread or fear as if an unavoidable emergency or failure might occur',
  ],
  interpret: (score: number) => {
    if (score <= 4)  return { label: 'Minimal Anxiety', color: 'text-emerald-400', bg: 'bg-emerald-500/20 border-emerald-500/40', advice: 'Your general nervous system stability appears resilient and well-regulated.' };
    if (score <= 9)  return { label: 'Mild Anxiety',    color: 'text-amber-300',   bg: 'bg-amber-500/20 border-amber-500/40',   advice: 'Noticeable nervous stress present. Try engaging our 4-4-4-4 Box Breathing studio before examinations.' };
    if (score <= 14) return { label: 'Moderate Anxiety',color: 'text-orange-400',  bg: 'bg-orange-500/20 border-orange-500/40',  advice: 'Anxiety is actively draining focus. Schedule a 1-on-1 discussion with a psychologist to build coping strategies.' };
    return            { label: 'Severe Anxiety',  color: 'text-rose-500 font-bold',  bg: 'bg-rose-500/20 border-rose-500',      advice: 'Severe anxiety reactivity. Please reach out to our professional counselor team for immediate anxiety de-escalation.' };
  },
};

// ─── MBI-Student (Academic Burnout Inventory) ──────────────────────────────────
const BURNOUT = {
  id: 'burnout' as const,
  name: 'MBI-S',
  title: 'Academic Burnout & Exhaustion',
  subtitle: 'Student Burnout Inventory (8 Items)',
  emoji: '⚡',
  color: 'from-purple-600 to-fuchsia-700',
  intro: 'Reflect on your emotional and mental energy levels regarding engineering academics over the past month:',
  options: ['Never (0 pts)', 'Rarely (1 pt)', 'Frequently (2 pts)', 'Always (3 pts)'],
  questions: [
    'I feel emotionally drained and completely exhausted by coursework and coding deadlines',
    'Attending morning classes or opening academic notes feels like an unbearable chore',
    'I have developed an indifferent or cynical attitude toward my degree and career future',
    'I doubt my innate competence to absorb difficult technical engineering concepts',
    'I feel isolated from classmate peers during group projects or lab sessions',
    'My sleep quality is continuously degraded by thoughts of academic performance',
    'I feel like I am expending immense daily effort without commensurate personal reward or comprehension',
    'I find myself procrastinating simply due to sheer cognitive overwhelm',
  ],
  interpret: (score: number) => {
    if (score <= 5)   return { label: 'Vibrant Energy',    color: 'text-emerald-400', bg: 'bg-emerald-500/20 border-emerald-500/40', advice: 'High academic engagement and healthy motivation balance.' };
    if (score <= 12)  return { label: 'Early Fatigue',     color: 'text-amber-300',   bg: 'bg-amber-500/20 border-amber-500/40',   advice: 'Beginning signs of mental strain. Prioritize sleep hygiene and scheduled recreational breaks.' };
    if (score <= 18)  return { label: 'High Burnout Risk', color: 'text-orange-400',  bg: 'bg-orange-500/20 border-orange-500/40',  advice: 'Significant burnout warning. Re-evaluate personal study workload and connect with a faculty mentor or counselor.' };
    return             { label: 'Critical Exhaustion', color: 'text-rose-500 font-extrabold', bg: 'bg-rose-500/30 border-rose-500',   advice: 'Academic depletion reached critical thresholds. Professional guidance is necessary to recalibrate expectations and restore mental vitality.' };
  },
};

const ASSESSMENTS = [PHQ9, GAD7, BURNOUT] as const;
type AssessmentId = 'phq9' | 'gad7' | 'burnout';
const STORAGE_KEY = 'mindbridge_assessments_v2';

interface AssessmentResult {
  id: string;
  assessmentId: AssessmentId;
  score: number;
  label: string;
  date: string;
}

export default function Assessments() {
  const navigate = useNavigate();
  const [active, setActive] = useState<AssessmentId | null>(null);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [result, setResult] = useState<{ score: number; label: string; color: string; bg: string; advice: string } | null>(null);
  const [history, setHistory] = useState<AssessmentResult[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    try { 
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setHistory(JSON.parse(raw)); 
    } catch {}
  }, []);

  const assessment = active ? ASSESSMENTS.find(a => a.id === active)! : null;
  const totalQ = assessment?.questions.length ?? 0;
  const answered = Object.keys(answers).length;
  const canSubmit = answered === totalQ;

  const handleSubmit = async () => {
    if (!assessment || !canSubmit) return;
    setIsSubmitting(true);
    const score = Object.values(answers).reduce((a, b) => a + b, 0);
    const interp = assessment.interpret(score);
    setResult({ score, ...interp });

    const entry: AssessmentResult = { 
      id: `${Date.now()}`, 
      assessmentId: active!, 
      score, 
      label: interp.label, 
      date: new Date().toISOString() 
    };
    const updated = [entry, ...history].slice(0, 25);
    setHistory(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

    // Sync securely with backend clinical dashboard if user is authenticated
    if (isLoggedIn()) {
      try {
        await apiFetch('/api/clinical/assessments', {
          method: 'POST',
          body: JSON.stringify({
            test_type: active,
            score: score,
            severity_label: interp.label,
            answers: answers
          })
        });
      } catch (err) {
        console.warn("Backend assessment sync deferred offline");
      }
    }
    setIsSubmitting(false);
  };

  const handleReset = () => { setActive(null); setAnswers({}); setResult(null); };

  return (
    <div className="space-y-8 max-w-5xl mx-auto animate-fade-in">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 rounded-3xl bg-surface-container border border-border-structural">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => (active && !result) ? handleReset() : (active && result) ? setResult(null) : navigate(-1)}
            className="w-11 h-11 rounded-2xl bg-surface-container-high hover:bg-white/10 flex items-center justify-center text-on-surface-variant hover:text-white transition-all border border-border-structural"
            title="Return"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-interactive-primary/20 text-secondary-fixed text-xs font-mono font-bold uppercase tracking-wider mb-2">
              <Brain size={14} />
              <span>Standardized Clinical Psychometrics</span>
            </div>
            <h1 className="text-3xl font-heading font-extrabold text-white">
              {assessment ? `${assessment.name} — ${assessment.title}` : 'Clinical Diagnostic Suite'}
            </h1>
            <p className="text-xs sm:text-sm text-on-surface-variant max-w-2xl mt-1">
              {assessment ? `Completion Progress: ${answered} of ${totalQ} questions answered` : 'Gold-standard clinical psychological questionnaires utilized by institutional mental health professionals.'}
            </p>
          </div>
        </div>
      </div>

      {/* Main Selection Grid */}
      {!active && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {ASSESSMENTS.map((a) => (
              <div 
                key={a.id}
                className="glass-panel p-7 rounded-3xl border border-border-structural hover:border-interactive-primary transition-all duration-300 flex flex-col justify-between group cursor-pointer hover:shadow-2xl hover:scale-[1.01]"
                onClick={() => { setActive(a.id); setAnswers({}); setResult(null); }}
              >
                <div>
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${a.color} flex items-center justify-center text-2xl mb-5 shadow-lg group-hover:scale-110 transition-transform`}>
                    {a.emoji}
                  </div>
                  <h2 className="text-xl font-heading font-extrabold text-white mb-1 group-hover:text-secondary-fixed transition-colors">
                    {a.name} • {a.title}
                  </h2>
                  <h3 className="text-xs font-mono text-secondary-fixed/90 uppercase font-bold mb-3">{a.subtitle}</h3>
                  <p className="text-xs text-on-surface-variant leading-relaxed">{a.intro}</p>
                </div>

                <div className="mt-6 pt-4 border-t border-border-structural/80 flex items-center justify-between text-xs font-bold text-interactive-primary group-hover:text-white transition-colors">
                  <span>Begin Clinical Screening</span>
                  <ChevronRight size={18} className="transform group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            ))}
          </div>

          {/* Historical Test Logs */}
          {history.length > 0 && (
            <div className="glass-panel p-7 rounded-3xl border border-border-structural space-y-4">
              <div className="flex items-center gap-3">
                <TrendingUp className="text-secondary-fixed" size={22} />
                <h3 className="text-lg font-heading font-bold text-white">Your Historical Screening Trend</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {history.map((h) => {
                  const item = ASSESSMENTS.find(a => a.id === h.assessmentId) || ASSESSMENTS[0];
                  return (
                    <div key={h.id} className="p-4 rounded-2xl bg-surface-container-low border border-border-structural flex items-center justify-between">
                      <div>
                        <div className="font-bold text-sm text-white">{item.name} Test</div>
                        <div className="text-[11px] font-mono text-on-surface-variant mt-0.5">
                          {new Date(h.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-base font-mono font-black text-secondary-fixed">{h.score} pts</div>
                        <div className="text-[11px] font-semibold text-on-surface-variant/90">{h.label}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Active Questionnaire UI */}
      {active && !result && assessment && (
        <div className="space-y-6 max-w-3xl mx-auto">
          <div className="p-5 rounded-2xl bg-surface-container-low border border-border-structural text-sm text-on-surface-variant flex items-center gap-3">
            <Shield className="text-secondary-fixed shrink-0" size={24} />
            <div>
              <span className="font-bold text-white block">Client Anonymity Protection Actve</span>
              Your honest self-rating helps calculate appropriate counselor interventions. No personal identification is ever shared without authorization.
            </div>
          </div>

          <div className="space-y-6">
            {assessment.questions.map((q, idx) => {
              const selectedOpt = answers[idx];
              return (
                <div key={idx} className="glass-panel p-6 sm:p-7 rounded-3xl border border-border-structural space-y-4">
                  <div className="flex items-start gap-3">
                    <span className="w-7 h-7 rounded-full bg-interactive-primary/20 border border-interactive-primary/50 text-secondary-fixed font-mono font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <h3 className="font-heading font-bold text-white text-base sm:text-lg leading-relaxed">
                      {q}
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
                    {assessment.options.map((opt, optIdx) => {
                      const isChosen = selectedOpt === optIdx;
                      return (
                        <button
                          key={optIdx}
                          onClick={() => setAnswers(prev => ({ ...prev, [idx]: optIdx }))}
                          className={`p-3.5 rounded-2xl border text-left font-medium text-xs sm:text-sm transition-all flex items-center justify-between ${
                            isChosen
                              ? 'bg-gradient-to-r from-interactive-primary to-interactive-primary/80 border-white text-white font-bold shadow-lg shadow-interactive-primary/30 scale-[1.01]'
                              : 'bg-surface-container hover:bg-surface-container-high border-border-structural text-on-surface-variant hover:text-white'
                          }`}
                        >
                          <span>{opt}</span>
                          {isChosen && <CheckCircle2 size={16} className="text-secondary-fixed" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-4 flex items-center justify-between">
            <button
              onClick={handleReset}
              className="px-6 py-3 rounded-2xl bg-surface-container hover:bg-surface-container-high text-on-surface-variant text-sm font-semibold transition-colors border border-border-structural"
            >
              Cancel Screening
            </button>

            <button
              onClick={handleSubmit}
              disabled={!canSubmit || isSubmitting}
              className="px-8 py-4 rounded-2xl bg-gradient-to-r from-interactive-primary to-secondary hover:brightness-110 disabled:opacity-40 text-on-primary font-heading font-bold text-sm sm:text-base flex items-center gap-3 shadow-xl transition-all duration-200 shadow-interactive-primary/30"
            >
              <span>Generate Diagnostic Analysis</span>
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      )}

      {/* Diagnostic Result Screen */}
      {result && assessment && (
        <div className="glass-panel p-8 sm:p-12 rounded-[32px] border border-border-structural max-w-3xl mx-auto text-center space-y-8 animate-scale-in">
          <div>
            <div className="w-20 h-20 mx-auto rounded-3xl bg-surface-container border border-border-structural flex items-center justify-center text-4xl mb-4 shadow-xl">
              {assessment.emoji}
            </div>
            <h2 className="text-2xl sm:text-3xl font-heading font-black text-white">{assessment.name} Diagnostic Summary</h2>
            <p className="text-sm text-on-surface-variant mt-1">Screening completed on {new Date().toLocaleDateString()}</p>
          </div>

          <div className={`p-8 rounded-3xl border ${result.bg} max-w-xl mx-auto space-y-3 shadow-lg`}>
            <div className="text-xs uppercase font-mono tracking-widest text-white font-semibold">Clinical Stratification Label</div>
            <div className={`text-3xl sm:text-4xl font-heading font-extrabold ${result.color}`}>
              {result.label}
            </div>
            <div className="text-sm font-mono text-on-surface-variant font-bold">
              Aggregated Severity Score: <span className="text-white text-lg font-black">{result.score}</span> / {totalQ * 3}
            </div>
          </div>

          <div className="p-6 rounded-3xl bg-surface-container-low border border-border-structural text-left max-w-xl mx-auto space-y-3">
            <div className="flex items-center gap-2 text-secondary-fixed font-bold text-xs uppercase font-mono">
              <Sparkles size={16} />
              <span>Recommended Therapist Next Steps</span>
            </div>
            <p className="text-sm text-on-surface-variant/90 leading-relaxed font-sans">
              {result.advice}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <button
              onClick={() => navigate('/student/appointments')}
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-interactive-primary to-secondary text-on-primary font-heading font-extrabold text-sm shadow-xl shadow-interactive-primary/30 transition-all hover:brightness-110"
            >
              Book Confidential Counselor Session
            </button>

            <button
              onClick={() => { setActive(null); setResult(null); }}
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-surface-container hover:bg-surface-container-high text-white font-semibold text-sm transition-colors border border-border-structural"
            >
              Return to Screening Dashboard
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
