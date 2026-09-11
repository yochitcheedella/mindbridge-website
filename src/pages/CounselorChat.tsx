import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Phone,
  Send,
  ShieldCheck,
  Lock,
  Sparkles,
  UserCheck,
  AlertCircle,
  RefreshCw,
  Calendar,
} from 'lucide-react';
import { apiFetch, getAlias } from '../utils/auth';

interface Message {
  id: string;
  sender: 'user' | 'counselor';
  text: string;
  risk_score?: number;
  timestamp?: string;
}

interface CounselorInfo {
  name: string;
  specialization: string;
  is_online: boolean;
  appointment_id?: number | null;
  appointment_status?: string | null;
}

export default function CounselorChat() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryApptId = searchParams.get('appointmentId');

  const [counselor, setCounselor] = useState<CounselorInfo>({
    name: 'Dr. Ananya Sharma',
    specialization: 'Clinical Psychologist',
    is_online: true,
    appointment_id: queryApptId ? parseInt(queryApptId, 10) : null,
  });

  const [studentAlias, setStudentAlias] = useState<string>(getAlias() || 'Blue Sparrow #4821');
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeAppointmentId = counselor.appointment_id || (queryApptId ? parseInt(queryApptId, 10) : null);

  const fetchHistory = async () => {
    try {
      const res = await apiFetch('/api/chat/counselor/history');
      if (res.ok) {
        const data = await res.json();
        if (data.student_alias) setStudentAlias(data.student_alias);
        if (data.counselor) {
          setCounselor((prev) => ({
            ...prev,
            ...data.counselor,
            appointment_id: prev.appointment_id || data.counselor.appointment_id,
          }));
        }
        if (Array.isArray(data.messages)) {
          setMessages(data.messages);
        }
      }
    } catch (e) {
      console.warn('Failed to fetch counselor chat history:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
    // Poll every 3 seconds for new counselor messages
    const interval = setInterval(fetchHistory, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = inputText.trim();
    if (!text || sending) return;

    setInputText('');
    setSending(true);

    // Optimistic message append
    const tempId = `temp-${Date.now()}`;
    const optimisticMsg: Message = {
      id: tempId,
      sender: 'user',
      text,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimisticMsg]);

    try {
      const res = await apiFetch('/api/chat/counselor/send', {
        method: 'POST',
        body: JSON.stringify({
          text,
          appointment_id: activeAppointmentId,
        }),
      });

      if (res.ok) {
        const savedMsg = await res.json();
        setMessages((prev) =>
          prev.map((m) => (m.id === tempId ? { ...savedMsg, sender: 'user' } : m))
        );
      }
    } catch (err) {
      console.error('Error sending message to counselor:', err);
    } finally {
      setSending(false);
    }
  };

  const handleStartAudioCall = () => {
    if (activeAppointmentId) {
      navigate(`/call/${activeAppointmentId}`);
    } else {
      // Direct student to book/confirm session first
      navigate('/student/appointments');
    }
  };

  const formatTime = (iso?: string) => {
    if (!iso) return '';
    const d = new Date(iso);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="min-h-screen bg-[#070709] text-white flex flex-col justify-between max-w-4xl mx-auto border-x border-border-internal/50 shadow-2xl relative">
      {/* ── Top Header Bar (Psychologist info + Call button with Notch Safe-Area) ── */}
      <header className="sticky top-0 z-20 bg-[#0d0e14]/95 backdrop-blur-xl border-b border-border-internal px-4 py-3 pt-[calc(0.75rem+env(safe-area-inset-top,0px))] flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <button
            onClick={() => navigate(-1)}
            className="p-1.5 rounded-xl text-on-surface-variant hover:text-white hover:bg-white/5 transition-all shrink-0"
            title="Go back"
          >
            <ArrowLeft size={18} />
          </button>

          <div className="relative shrink-0">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-br from-indigo-500/30 to-primary/20 border border-primary/30 flex items-center justify-center text-lg sm:text-xl shadow-md">
              🧠
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-[#0d0e14]" />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <h1 className="font-heading font-bold text-sm sm:text-base text-white truncate">{counselor.name}</h1>
              <span className="text-[9px] sm:text-[10px] bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.5 rounded font-semibold flex items-center gap-1 shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Online
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-on-surface-variant truncate">{counselor.specialization}</p>
          </div>
        </div>

        {/* Action: Instant Audio Call Launcher */}
        <button
          onClick={handleStartAudioCall}
          className="p-2 sm:px-3 sm:py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/35 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-lg shadow-emerald-500/10 active:scale-95 shrink-0"
          title={activeAppointmentId ? 'Start Private Audio Call' : 'Book Session to Call'}
        >
          <Phone size={14} />
          <span className="hidden xs:inline text-[11px]">Audio Call</span>
        </button>
      </header>

      {/* ── Privacy Shield & Identity Banner ── */}
      <div className="bg-primary/10 border-b border-primary/20 px-3 sm:px-4 py-2 flex items-center justify-between text-xs z-10">
        <div className="flex items-center gap-2 text-primary font-medium min-w-0">
          <ShieldCheck size={15} className="shrink-0 text-emerald-400" />
          <span className="text-[11px] sm:text-xs truncate">
            Chatting as: <strong className="text-white bg-primary/20 px-1.5 py-0.5 rounded border border-primary/30 font-mono">{studentAlias}</strong>
          </span>
        </div>
        <span className="text-[10px] text-on-surface-variant font-mono hidden md:inline shrink-0">
          🔒 Real identity & roll # hidden
        </span>
      </div>

      {/* ── Message Thread ── */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-12">
        {/* Welcome note */}
        <div className="text-center my-4">
          <div className="inline-block bg-white/[0.04] border border-white/10 rounded-2xl px-4 py-2 text-xs text-on-surface-variant max-w-md">
            🔒 This is a secure, end-to-end shielded clinical conversation with Vishnu Institute psychologists. Only your anonymous alias is shared.
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 text-on-surface-variant gap-2">
            <RefreshCw className="animate-spin text-primary" size={24} />
            <span className="text-xs">Loading conversation history...</span>
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-12 text-on-surface-variant space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-2xl">
              💬
            </div>
            <p className="text-sm font-medium text-white">Start your confidential conversation</p>
            <p className="text-xs max-w-sm mx-auto text-on-surface-variant">
              Share what is on your mind. {counselor.name} will respond directly under your anonymous identity.
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const isStudent = msg.sender === 'user';
            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isStudent ? 'items-end' : 'items-start'} animate-slide-up`}
              >
                {/* Sender label */}
                <span className="text-[10px] text-on-surface-variant/80 mb-1 px-1 font-semibold flex items-center gap-1">
                  {isStudent ? (
                    <>
                      <span className="text-primary font-mono">{studentAlias}</span>
                    </>
                  ) : (
                    <>
                      <span className="text-blue-400 font-bold">{counselor.name}</span>
                      <span className="text-[9px] bg-blue-500/20 text-blue-300 px-1 rounded">Psychologist</span>
                    </>
                  )}
                </span>

                {/* Message Bubble */}
                <div
                  className={`max-w-[85%] sm:max-w-[70%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-md ${
                    isStudent
                      ? 'bg-gradient-to-r from-interactive-primary to-indigo-600 text-white rounded-tr-none border border-interactive-primary/40'
                      : 'bg-surface-container-high border border-border-internal text-white rounded-tl-none'
                  }`}
                >
                  <p className="whitespace-pre-wrap break-words">{msg.text}</p>
                  <div
                    className={`text-[10px] mt-1.5 text-right font-mono ${
                      isStudent ? 'text-white/70' : 'text-on-surface-variant'
                    }`}
                  >
                    {formatTime(msg.timestamp)}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* ── Audio Call Launcher Banner & Input Dock (Elevated above Floating Nav) ── */}
      <div className="sticky bottom-0 z-30 bg-[#0d0e14]/95 backdrop-blur-2xl border-t border-border-internal p-3 sm:p-4 space-y-2 mb-[calc(4.5rem+env(safe-area-inset-bottom,0px))] md:mb-0">
        {/* One-tap Audio Call action strip */}
        <div className="flex items-center justify-between bg-white/[0.03] hover:bg-white/[0.06] border border-white/10 rounded-xl px-3.5 py-2 transition-all">
          <div className="flex items-center gap-2 text-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-white/80">Need to talk live right now?</span>
          </div>
          <button
            onClick={handleStartAudioCall}
            className="text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition-colors"
          >
            <Phone size={13} />
            <span>Start Audio Call →</span>
          </button>
        </div>

        {/* Message Input Form */}
        <form onSubmit={handleSendMessage} className="flex items-center gap-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={`Message ${counselor.name}... (as ${studentAlias})`}
            className="flex-1 bg-surface-container-lowest border border-border-internal rounded-xl px-4 py-3 text-sm text-white placeholder-on-surface-variant focus:outline-none focus:border-interactive-primary transition-all"
          />
          <button
            type="submit"
            disabled={!inputText.trim() || sending}
            className="p-3 bg-interactive-primary hover:brightness-110 text-white rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed shrink-0 shadow-lg shadow-interactive-primary/20 active:scale-95"
            title="Send Message"
          >
            <Send size={18} />
          </button>
        </form>
      </div>
    </div>
  );
}
