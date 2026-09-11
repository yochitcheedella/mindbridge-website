import React, { useState } from 'react';
import { ShieldAlert, Phone, Navigation, ArrowLeft, HeartPulse, Clock, Building2, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import { apiFetch, isLoggedIn } from '../utils/auth';

const CRISIS_RESOURCES = [
  {
    title: "Vishnu Campus Emergency Response",
    desc: "24/7 on-duty Vishnu College security & emergency health desk",
    icon: Phone,
    action: "Call +91 8816-250864",
    href: "tel:+918816250864",
    color: "bg-rose-500/10 text-rose-300 border-rose-500/30 hover:border-rose-500/60 hover:bg-rose-500/15",
  },
  {
    title: "Tele-MANAS National Mental Health",
    desc: "Govt. of India 24/7 free institutional toll-free counseling helpline",
    icon: Phone,
    action: "Call 14416 / 1800-891-4416",
    href: "tel:14416",
    color: "bg-indigo-500/10 text-indigo-300 border-indigo-500/30 hover:border-indigo-500/60 hover:bg-indigo-500/15",
  },
  {
    title: "KIRAN National Mental Health Helpline",
    desc: "24/7 psychological support & early crisis intervention",
    icon: Phone,
    action: "Call 1800-599-0019",
    href: "tel:18005990019",
    color: "bg-teal-500/10 text-teal-300 border-teal-500/30 hover:border-teal-500/60 hover:bg-teal-500/15",
  },
  {
    title: "Vishnu Health & Counseling Center",
    desc: "Walk-in confidential counseling on-campus (A-Block Ground Floor)",
    icon: Navigation,
    action: "Campus Map & Directions",
    href: "#campus-center",
    color: "bg-purple-500/10 text-purple-300 border-purple-500/30 hover:border-purple-500/60 hover:bg-purple-500/15",
  }
];

export default function EmergencyResponse() {
  const [sosSent, setSosSent] = useState(false);
  const [sending, setSending] = useState(false);
  const loggedIn = isLoggedIn();

  const handleSOS = async () => {
    if (!loggedIn) {
      alert('Please log in with your VIT student account to dispatch an emergency alert.');
      return;
    }

    setSending(true);
    try {
      const res = await apiFetch('/api/emergency/sos', { method: 'POST' });
      if (res.ok) {
        setSosSent(true);
      }
    } catch (err) {
      console.error('Failed to dispatch SOS', err);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0d14] text-white flex flex-col items-center justify-center p-4 py-8 relative overflow-hidden">
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-rose-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-lg animate-fade-in relative z-10">
        {/* Back Link */}
        <Link
          to={loggedIn ? "/student/home" : "/login"}
          className="inline-flex items-center gap-2 text-xs font-semibold text-white/60 hover:text-white mb-6 transition-colors px-3 py-1.5 rounded-xl bg-white/5 border border-white/10"
        >
          <ArrowLeft size={14} />
          <span>{loggedIn ? "Back to Student Dashboard" : "Back to Login"}</span>
        </Link>

        <div className="bg-surface/90 backdrop-blur-2xl p-6 sm:p-8 rounded-3xl border border-rose-500/30 shadow-2xl shadow-black/80 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-rose-500 via-amber-500 to-rose-500 animate-pulse" />

          {/* Institutional Badge */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 text-xs font-mono mb-4 border border-rose-500/30">
            <Building2 size={12} />
            <span>Vishnu College Institutional Crisis Protocol</span>
          </div>

          <div className="w-20 h-20 bg-rose-500/15 border-2 border-rose-500/40 rounded-3xl flex items-center justify-center mx-auto mb-5 relative shadow-xl shadow-rose-500/20">
            <div className="absolute inset-0 rounded-3xl border border-rose-400/30 animate-ping" />
            <ShieldAlert size={38} className="text-rose-400" />
          </div>

          <h1 className="font-heading font-black text-2xl sm:text-3xl text-white mb-2 tracking-tight">
            Campus Crisis & SOS Response
          </h1>
          <p className="text-sm text-white/70 mb-7 leading-relaxed max-w-md mx-auto">
            If you or a peer are experiencing acute psychological distress, panic, or a life safety emergency, immediate help is available. You are not alone.
          </p>

          {/* SOS Dispatch Button */}
          {loggedIn ? (
            <button
              onClick={handleSOS}
              disabled={sosSent || sending}
              className={`w-full py-4 px-6 rounded-2xl font-bold text-base transition-all duration-300 flex items-center justify-center gap-2 mb-6 ${
                sosSent
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white shadow-xl shadow-rose-600/30 hover:scale-[1.01]'
              }`}
            >
              {sending ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Dispatching Priority Campus Alert...</span>
                </>
              ) : sosSent ? (
                <>
                  <HeartPulse size={20} className="text-emerald-400" />
                  <span>Alert Active — Help is on the way</span>
                </>
              ) : (
                <>
                  <ShieldAlert size={20} />
                  <span>Dispatch Emergency SOS to On-Call Psychologist</span>
                </>
              )}
            </button>
          ) : (
            <div className="mb-6 p-4 rounded-2xl bg-white/5 border border-white/10 text-xs text-white/80">
              <p className="font-semibold text-rose-300 mb-1">Direct Helpline Access</p>
              <p>For immediate phone support, tap any of the direct college and national lines below.</p>
            </div>
          )}

          {sosSent && (
            <div className="mb-6 p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 text-xs text-emerald-200 flex items-start gap-3 text-left animate-slide-up">
              <Clock size={16} className="text-emerald-400 shrink-0 mt-0.5" />
              <p>
                Campus security dispatch and the on-duty Vishnu College clinical psychologist have received your distress signal. Stay in a safe place. Support is arriving.
              </p>
            </div>
          )}

          {/* Resources List */}
          <div className="space-y-3 text-left">
            <p className="text-xs font-mono font-bold uppercase tracking-wider text-white/50 text-center mb-2">
              Verified Emergency Lines
            </p>
            {CRISIS_RESOURCES.map(res => (
              <a
                href={res.href}
                key={res.title}
                className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${res.color} group`}
              >
                <div className="flex items-start gap-3 pr-2">
                  <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0 mt-0.5">
                    <res.icon size={18} />
                  </div>
                  <div>
                    <h3 className="font-heading font-bold text-sm text-white">{res.title}</h3>
                    <p className="text-xs text-white/60 mt-0.5">{res.desc}</p>
                  </div>
                </div>
                <div className="shrink-0 flex items-center gap-1 text-xs font-bold uppercase tracking-wider">
                  <span>{res.action.split(' ')[0]}</span>
                  <ExternalLink size={12} className="group-hover:translate-x-0.5 transition-transform" />
                </div>
              </a>
            ))}
          </div>

          <div className="mt-6 pt-4 border-t border-white/10 text-center">
            <p className="text-[11px] text-white/40">
              Vishnu Institute of Technology Student Mental Health & Safety Charter
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
