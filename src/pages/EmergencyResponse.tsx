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
    badge: "Campus Security",
  },
  {
    title: "Tele-MANAS National Mental Health",
    desc: "Govt. of India 24/7 free institutional toll-free counseling helpline",
    icon: Phone,
    action: "Call 14416 / 1800-891-4416",
    href: "tel:14416",
    badge: "Govt. Toll-Free",
  },
  {
    title: "KIRAN National Mental Health Helpline",
    desc: "24/7 psychological support & early crisis intervention",
    icon: Phone,
    action: "Call 1800-599-0019",
    href: "tel:18005990019",
    badge: "24/7 Support",
  },
  {
    title: "Vishnu Health & Counseling Center",
    desc: "Walk-in confidential counseling on-campus (A-Block Ground Floor)",
    icon: Navigation,
    action: "Directions",
    href: "#campus-center",
    badge: "On-Campus",
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
    <div className="w-full max-w-xl mx-auto space-y-6 animate-fade-in text-[#111111] pb-20">
      {/* Back Link */}
      <div>
        <Link
          to={loggedIn ? "/student/home" : "/login"}
          className="inline-flex items-center gap-2 text-xs font-black text-[#111111] bg-[#FFFFFF] hover:bg-[#F4C542] transition-colors px-3.5 py-2 rounded-xl border-2 border-[#111111] shadow-xs cursor-pointer active:scale-95"
        >
          <ArrowLeft size={14} />
          <span>{loggedIn ? "Back to Student Dashboard" : "Back to Login"}</span>
        </Link>
      </div>

      <div className="bg-[#FFFFFF] p-6 sm:p-8 rounded-3xl border-2 border-[#111111] shadow-xl text-center relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-rose-600" />

        {/* Institutional Protocol Badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/15 text-rose-700 text-xs font-mono font-bold mb-4 border border-rose-500/30">
          <Building2 size={13} />
          <span>Vishnu College Institutional Crisis Protocol</span>
        </div>

        {/* Pulse Shield Icon Box */}
        <div className="w-20 h-20 bg-rose-500/15 border-2 border-rose-600 rounded-3xl flex items-center justify-center mx-auto mb-4 relative shadow-sm">
          <ShieldAlert size={40} className="text-rose-600" />
        </div>

        <h1 className="font-heading font-black text-2xl sm:text-3xl text-[#111111] mb-2 tracking-tight">
          Campus Crisis & SOS Response
        </h1>
        <p className="text-xs sm:text-sm text-[#111111]/70 mb-6 leading-relaxed max-w-md mx-auto font-medium">
          If you or a peer are experiencing acute psychological distress, panic, or a life safety emergency, immediate help is available. You are not alone.
        </p>

        {/* SOS Dispatch Button */}
        {loggedIn ? (
          <button
            onClick={handleSOS}
            disabled={sosSent || sending}
            className={`w-full py-4 px-6 rounded-2xl font-black text-sm sm:text-base transition-all duration-200 flex items-center justify-center gap-2 mb-6 cursor-pointer border-2 border-[#111111] shadow-md ${
              sosSent
                ? 'bg-emerald-500/15 text-emerald-800 border-emerald-600'
                : 'bg-rose-600 hover:bg-rose-700 text-white active:scale-98'
            }`}
          >
            {sending ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Dispatching Priority Campus Alert...</span>
              </>
            ) : sosSent ? (
              <>
                <HeartPulse size={20} className="text-emerald-700" />
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
          <div className="mb-6 p-4 rounded-2xl bg-[#FAFAFA] border-2 border-[#111111]/15 text-xs text-[#111111]">
            <p className="font-black text-rose-700 mb-1">Direct Helpline Access</p>
            <p className="text-[#111111]/70">For immediate phone support, tap any of the direct college and national lines below.</p>
          </div>
        )}

        {sosSent && (
          <div className="mb-6 p-4 rounded-2xl bg-emerald-500/15 border-2 border-emerald-600 text-xs text-emerald-900 flex items-start gap-3 text-left animate-slide-up">
            <Clock size={16} className="text-emerald-700 shrink-0 mt-0.5" />
            <p className="font-medium">
              Campus security dispatch and the on-duty Vishnu College clinical psychologist have received your distress signal. Stay in a safe place. Support is arriving.
            </p>
          </div>
        )}

        {/* Verified Resources List */}
        <div className="space-y-3 text-left">
          <p className="text-xs font-mono font-black uppercase tracking-wider text-[#111111]/60 text-center mb-3">
            Verified 24/7 Emergency Helplines
          </p>
          {CRISIS_RESOURCES.map(res => (
            <a
              href={res.href}
              key={res.title}
              className="flex items-center justify-between p-4 rounded-2xl border-2 border-[#111111]/15 hover:border-[#111111] bg-[#FFFFFF] hover:bg-[#FAFAFA] transition-all group shadow-xs"
            >
              <div className="flex items-start gap-3.5 pr-2">
                <div className="w-10 h-10 rounded-xl bg-[#F4C542] border-2 border-[#111111] flex items-center justify-center shrink-0 mt-0.5 text-[#111111]">
                  <res.icon size={18} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-heading font-black text-sm text-[#111111]">{res.title}</h3>
                    <span className="text-[10px] font-mono font-bold bg-[#111111]/5 px-2 py-0.5 rounded border border-[#111111]/10 text-[#111111]/70">
                      {res.badge}
                    </span>
                  </div>
                  <p className="text-xs text-[#111111]/65 mt-0.5 font-medium">{res.desc}</p>
                </div>
              </div>
              <div className="shrink-0 flex items-center gap-1.5 text-xs font-black bg-[#F4C542] group-hover:bg-[#e0b435] text-[#111111] px-3 py-1.5 rounded-xl border border-[#111111] shadow-2xs">
                <span>Call</span>
                <ExternalLink size={12} className="group-hover:translate-x-0.5 transition-transform" />
              </div>
            </a>
          ))}
        </div>

        <div className="mt-6 pt-4 border-t border-[#111111]/10 text-center">
          <p className="text-[11px] text-[#111111]/50 font-mono">
            Vishnu Institute of Technology Student Mental Health & Safety Charter
          </p>
        </div>
      </div>
    </div>
  );
}
