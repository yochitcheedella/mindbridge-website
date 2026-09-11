import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  PhoneOff,
  ShieldCheck,
  Lock,
  UserCheck,
  AlertTriangle,
  ArrowLeft,
  Star,
  Check,
  FileText,
  Calendar,
  Home,
  Sparkles,
} from 'lucide-react';
import { apiFetch, getRole, getWsBaseUrl } from '../utils/auth';

interface CallTokenResponse {
  call_token: string;
  appointment_id: number;
  role: string;
  my_alias: string;
  peer_alias: string;
  status: string;
  slot_time?: string;
  counselor_name: string;
  student_identity: string;
}

const FEELING_OPTIONS = [
  'Relieved 😌',
  'Calmer 🌿',
  'Truly Heard 👂',
  'Hopeful ✨',
  'Need Time ⏳',
];

const FEEDBACK_TAGS = [
  'Empathetic & Warm',
  '100% Safe & Anonymous',
  'Helpful Coping Tools',
  'Zero Judgment',
  'Clear Next Steps',
];

export default function AnonymousAudioCall() {
  const { appointmentId } = useParams<{ appointmentId: string }>();
  const navigate = useNavigate();

  const [callData, setCallData] = useState<CallTokenResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [callConnected, setCallConnected] = useState(false);
  const [peerPresent, setPeerPresent] = useState(false);
  const [callDuration, setCallDuration] = useState(0);

  // Audio Controls
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [peerMuted, setPeerMuted] = useState(false);
  const [micAllowed, setMicAllowed] = useState(true);

  // Session Completed / Feedback State
  const [sessionCompleted, setSessionCompleted] = useState(false);
  const [feedbackRating, setFeedbackRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [selectedFeeling, setSelectedFeeling] = useState('Relieved 😌');
  const [selectedTags, setSelectedTags] = useState<string[]>(['100% Safe & Anonymous']);
  const [feedbackComment, setFeedbackComment] = useState('');
  const [submittingFeedback, setSubmittingFeedback] = useState(false);

  // WebRTC & WebSocket references
  const wsRef = useRef<WebSocket | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
  const timerIntervalRef = useRef<any>(null);

  const userRole = getRole() || 'student';
  const isPsychologist = userRole === 'psychologist' || userRole === 'admin';

  // ── Step 1: Check Appointment Ownership & Fetch Temporary Call Token ──
  useEffect(() => {
    if (!appointmentId) {
      setError('Appointment ID missing.');
      setLoading(false);
      return;
    }

    let isMounted = true;

    async function initCall() {
      try {
        setLoading(true);
        setError('');

        const res = await apiFetch(`/api/appointments/${appointmentId}/call-token`, {
          method: 'POST',
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.detail || 'Access denied: You cannot join this call room.');
        }

        const data: CallTokenResponse = await res.json();
        if (!isMounted) return;

        setCallData(data);
        setupWebRTCAndSignaling(data);
      } catch (err: any) {
        if (!isMounted) return;
        setError(err.message || 'Unable to establish secure call session.');
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    initCall();

    return () => {
      isMounted = false;
      cleanupCall();
    };
  }, [appointmentId]);

  // ── Step 2: Establish WebRTC Peer Connection and Signaling ──
  const setupWebRTCAndSignaling = async (tokenData: CallTokenResponse) => {
    try {
      const pc = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
        ],
      });
      peerConnectionRef.current = pc;

      // Remote stream
      pc.ontrack = (event) => {
        if (remoteAudioRef.current && event.streams[0]) {
          remoteAudioRef.current.srcObject = event.streams[0];
          remoteAudioRef.current.play().catch(() => {});
        }
      };

      // Microphone
      try {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
          localStreamRef.current = stream;
          stream.getTracks().forEach((track) => pc.addTrack(track, stream));
          setMicAllowed(true);
        }
      } catch (micErr) {
        console.warn('Microphone access unavailable or denied:', micErr);
        setMicAllowed(false);
      }

      // WebSocket connection
      const wsBase = getWsBaseUrl();
      const wsUrl = `${wsBase}/ws/call/${tokenData.appointment_id}?token=${encodeURIComponent(tokenData.call_token)}`;

      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      pc.onicecandidate = (event) => {
        if (event.candidate && ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'ice-candidate', candidate: event.candidate }));
        }
      };

      ws.onopen = () => {
        setCallConnected(true);
        startCallTimer();
      };

      ws.onmessage = async (event) => {
        try {
          const msg = JSON.parse(event.data);

          if (msg.type === 'peer-joined') {
            setPeerPresent(true);
            if (tokenData.role === 'student' && pc.signalingState === 'stable') {
              const offer = await pc.createOffer();
              await pc.setLocalDescription(offer);
              ws.send(JSON.stringify({ type: 'offer', sdp: offer }));
            }
          } else if (msg.type === 'room-state') {
            if (msg.peers && msg.peers.length > 0) {
              setPeerPresent(true);
            }
          } else if (msg.type === 'offer') {
            setPeerPresent(true);
            await pc.setRemoteDescription(new RTCSessionDescription(msg.sdp));
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            ws.send(JSON.stringify({ type: 'answer', sdp: answer }));
          } else if (msg.type === 'answer') {
            await pc.setRemoteDescription(new RTCSessionDescription(msg.sdp));
          } else if (msg.type === 'ice-candidate') {
            if (msg.candidate) {
              await pc.addIceCandidate(new RTCIceCandidate(msg.candidate)).catch(() => {});
            }
          } else if (msg.type === 'peer-mute-state') {
            setPeerMuted(msg.isMuted);
          } else if (msg.type === 'call-ended' || msg.type === 'peer-left') {
            setPeerPresent(false);
            finishSession();
          }
        } catch (e) {
          console.error('Signaling message error:', e);
        }
      };

      ws.onclose = () => {
        setCallConnected(false);
      };
    } catch (err) {
      console.error('Failed to setup audio call:', err);
    }
  };

  const startCallTimer = () => {
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    timerIntervalRef.current = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const toggleMute = () => {
    const nextMute = !isMuted;
    setIsMuted(nextMute);

    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach((t) => {
        t.enabled = !nextMute;
      });
    }

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'mute-state', isMuted: nextMute }));
    }
  };

  const toggleSpeaker = () => {
    const nextSpeaker = !isSpeakerOn;
    setIsSpeakerOn(nextSpeaker);
    if (remoteAudioRef.current) {
      remoteAudioRef.current.muted = !nextSpeaker;
    }
  };

  const finishSession = () => {
    cleanupCall();
    setSessionCompleted(true);

    // Auto mark completed if psychologist
    if (isPsychologist && appointmentId) {
      apiFetch(`/api/appointments/${appointmentId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status: 'completed' }),
      }).catch(() => {});
    }
  };

  const handleEndCall = () => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'hangup', reason: 'User hung up' }));
    }
    finishSession();
  };

  const cleanupCall = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
  };

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleSubmitFeedback = async () => {
    setSubmittingFeedback(true);
    try {
      if (appointmentId) {
        await apiFetch(`/api/appointments/${appointmentId}/feedback`, {
          method: 'POST',
          body: JSON.stringify({
            rating: feedbackRating,
            tags: `${selectedFeeling}, ${selectedTags.join(', ')}`,
            comment: feedbackComment.trim() || undefined,
          }),
        });
      }
    } catch (e) {
      console.warn('Feedback submit error:', e);
    } finally {
      setSubmittingFeedback(false);
      navigate('/student/appointments');
    }
  };

  // ── Render Error State ──
  if (error) {
    return (
      <div className="min-h-screen bg-[#070709] text-on-surface flex items-center justify-center p-4">
        <div className="max-w-md w-full glass-panel p-6 rounded-2xl border border-error/30 text-center shadow-2xl">
          <div className="w-14 h-14 rounded-full bg-error/15 text-error flex items-center justify-center mx-auto mb-4">
            <AlertTriangle size={28} />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Access Denied</h2>
          <p className="text-on-surface-variant text-sm mb-6 leading-relaxed">{error}</p>
          <button
            onClick={() => navigate(-1)}
            className="w-full py-3 px-4 bg-surface-container-high hover:bg-surface-container border border-border-internal rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2"
          >
            <ArrowLeft size={16} /> Return to Appointments
          </button>
        </div>
      </div>
    );
  }

  // ── Render Loading State ──
  if (loading || !callData) {
    return (
      <div className="min-h-screen bg-[#070709] text-on-surface flex flex-col items-center justify-center p-4">
        <div className="w-16 h-16 rounded-full border-4 border-primary/30 border-t-primary animate-spin mb-4" />
        <p className="text-white font-semibold">Verifying appointment credentials...</p>
        <p className="text-on-surface-variant text-xs mt-1">Generating anonymous encrypted session token</p>
      </div>
    );
  }

  const peerDisplayName = isPsychologist ? callData.peer_alias : callData.counselor_name;

  // ── Render Step: Session Completed & Anonymous Feedback Flow ──
  if (sessionCompleted) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0b0c10] via-[#08090d] to-[#040405] text-white flex flex-col items-center justify-center px-4 py-8 relative overflow-y-auto">
        <div className="w-full max-w-md glass-panel p-6 md:p-8 rounded-3xl border border-white/10 shadow-2xl animate-scale-in relative z-10">
          {isPsychologist ? (
            /* Counselor Post-Session View */
            <div className="space-y-6 text-center">
              <div className="w-16 h-16 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto">
                <Check size={32} />
              </div>

              <div>
                <h2 className="text-2xl font-bold font-heading text-white">Session Completed</h2>
                <p className="text-on-surface-variant text-sm mt-1">
                  Audio session with <span className="text-blue-400 font-semibold">{callData.peer_alias}</span> has concluded.
                </p>
                <div className="inline-block mt-2 font-mono text-xs text-white/70 bg-white/5 px-3 py-1 rounded-full border border-white/10">
                  Total Duration: {formatTime(callDuration)}
                </div>
              </div>

              <div className="pt-2 space-y-3 text-left">
                <button
                  onClick={() => navigate('/psychologist/soap-notes')}
                  className="w-full p-4 bg-primary/15 hover:bg-primary/25 border border-primary/30 rounded-2xl flex items-center justify-between transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-primary/20 text-primary">
                      <FileText size={20} />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-white">Document Clinical SOAP Notes</div>
                      <div className="text-xs text-on-surface-variant">Record observations under anonymous token</div>
                    </div>
                  </div>
                  <span className="text-primary text-sm font-semibold group-hover:translate-x-1 transition-transform">→</span>
                </button>

                <button
                  onClick={() => navigate('/psychologist/calendar')}
                  className="w-full p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl flex items-center justify-between transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-white/10 text-white">
                      <Calendar size={20} />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-white">Manage Calendar & Follow-up</div>
                      <div className="text-xs text-on-surface-variant">Schedule follow-up counseling appointments</div>
                    </div>
                  </div>
                  <span className="text-white/70 text-sm font-semibold group-hover:translate-x-1 transition-transform">→</span>
                </button>

                <button
                  onClick={() => navigate('/psychologist/dashboard')}
                  className="w-full py-3.5 bg-white/5 hover:bg-white/10 border border-border-internal rounded-xl font-semibold text-sm text-center transition-all flex items-center justify-center gap-2 text-on-surface"
                >
                  <Home size={16} /> Return to Clinical Dashboard
                </button>
              </div>
            </div>
          ) : (
            /* Student Post-Session Feedback View */
            <div className="space-y-6">
              <div className="text-center">
                <div className="w-14 h-14 rounded-2xl bg-primary/15 border border-primary/25 text-primary flex items-center justify-center mx-auto mb-3">
                  <Sparkles size={28} />
                </div>
                <h2 className="text-2xl font-bold font-heading text-white">Session Completed 🎉</h2>
                <p className="text-on-surface-variant text-xs mt-1">
                  How are you feeling after talking with {callData.counselor_name}?
                </p>
                <span className="inline-block mt-2 font-mono text-[11px] text-white/60 bg-white/5 px-2.5 py-0.5 rounded-full">
                  Duration: {formatTime(callDuration)}
                </span>
              </div>

              {/* Feelings Selector */}
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Current Mood</label>
                <div className="flex flex-wrap gap-2">
                  {FEELING_OPTIONS.map((f) => (
                    <button
                      key={f}
                      type="button"
                      onClick={() => setSelectedFeeling(f)}
                      className={`text-xs px-3 py-1.5 rounded-xl border transition-all ${
                        selectedFeeling === f
                          ? 'bg-primary/25 text-primary border-primary font-bold shadow-md shadow-primary/20'
                          : 'bg-surface-container-low border-border-internal text-on-surface-variant hover:text-white'
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>

              {/* Star Rating */}
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Session Rating</label>
                <div className="flex items-center justify-center gap-2 py-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => setFeedbackRating(star)}
                      className="p-1 transition-transform hover:scale-125 focus:outline-none"
                    >
                      <Star
                        size={28}
                        className={
                          (hoverRating || feedbackRating) >= star
                            ? 'text-amber-400 fill-amber-400'
                            : 'text-white/20'
                        }
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Anonymous Tags */}
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Session Highlights (Anonymous)</label>
                <div className="flex flex-wrap gap-1.5">
                  {FEEDBACK_TAGS.map((tag) => {
                    const active = selectedTags.includes(tag);
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => toggleTag(tag)}
                        className={`text-[11px] px-2.5 py-1 rounded-lg border transition-all ${
                          active
                            ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 font-semibold'
                            : 'bg-white/5 border-white/10 text-white/60 hover:text-white'
                        }`}
                      >
                        {tag}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Optional Comment */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Private Reflection / Feedback (Optional)</label>
                <textarea
                  value={feedbackComment}
                  onChange={(e) => setFeedbackComment(e.target.value)}
                  placeholder="Share any thoughts... (Counselor only sees: Blue Sparrow)"
                  rows={2}
                  className="w-full bg-surface-container-low border border-border-internal rounded-xl p-3 text-xs text-white placeholder-on-surface-variant focus:outline-none focus:border-interactive-primary resize-none"
                />
              </div>

              {/* Submit & Skip Actions */}
              <div className="space-y-2 pt-2">
                <button
                  onClick={handleSubmitFeedback}
                  disabled={submittingFeedback}
                  className="w-full py-3 bg-interactive-primary hover:brightness-110 text-white font-bold rounded-xl text-sm transition-all shadow-lg shadow-interactive-primary/20 disabled:opacity-50"
                >
                  {submittingFeedback ? 'Submitting...' : 'Submit Anonymous Feedback & Finish'}
                </button>
                <button
                  onClick={() => navigate('/student/appointments')}
                  className="w-full py-2.5 text-xs text-on-surface-variant hover:text-white transition-colors text-center"
                >
                  Skip & Return to Appointments
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Render Active Audio Call Screen ──
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0b0c10] via-[#08090d] to-[#040405] text-white flex flex-col justify-between items-center px-4 py-8 relative overflow-hidden select-none">
      <audio ref={remoteAudioRef} autoPlay playsInline />

      {/* Ambient background glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 w-72 h-72 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header Bar */}
      <div className="w-full max-w-md flex items-center justify-between z-10">
        <button
          onClick={handleEndCall}
          className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-on-surface-variant hover:text-white transition-all backdrop-blur-md"
        >
          <ArrowLeft size={18} />
        </button>

        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 backdrop-blur-md">
          <ShieldCheck size={14} className="text-green-400" />
          <span className="text-xs font-medium text-white/90">
            {isPsychologist ? 'MindBridge Call' : 'Encrypted Room'}
          </span>
        </div>

        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-500/15 border border-green-500/25">
          <span className="w-2 h-2 rounded-full bg-green-400 animate-ping" />
          <span className="text-[11px] font-semibold text-green-400">Live</span>
        </div>
      </div>

      {/* Center Stage: Calling Cards & Animated Wave Avatar */}
      <div className="flex-1 flex flex-col items-center justify-center w-full max-w-sm z-10 py-6">
        <div className="mb-4 text-center">
          {isPsychologist ? (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold">
              <UserCheck size={13} />
              <span>Counseling Client Session</span>
            </div>
          ) : (
            <div className="space-y-1">
              <span className="text-xs text-white/60 tracking-wider uppercase font-semibold">Counseling Session</span>
              <p className="text-xs text-primary font-medium flex items-center justify-center gap-1">
                <span>Your identity:</span>
                <span className="font-bold text-white bg-primary/20 px-2 py-0.5 rounded-md border border-primary/30">
                  {callData.student_identity}
                </span>
              </p>
            </div>
          )}
        </div>

        {/* Pulsing Avatar Container */}
        <div className="relative my-8 flex items-center justify-center">
          <div className="absolute w-44 h-44 rounded-full bg-primary/10 border border-primary/20 animate-ping opacity-40" />
          <div className="absolute w-36 h-36 rounded-full bg-primary/15 border border-primary/25 animate-pulse" />

          <div className="relative w-28 h-28 rounded-full bg-gradient-to-br from-indigo-500 via-primary to-purple-600 p-1 shadow-2xl shadow-primary/30 flex items-center justify-center">
            <div className="w-full h-full rounded-full bg-[#0d0e14] flex flex-col items-center justify-center text-center p-2">
              <span className="text-3xl mb-1">
                {isPsychologist ? '🔵' : '🧠'}
              </span>
              <span className="text-[11px] font-bold text-white/90 truncate max-w-[80px]">
                {peerDisplayName}
              </span>
            </div>
          </div>
        </div>

        {/* Displayed Peer Name & Live Timer */}
        <div className="text-center mt-2">
          <h2 className="text-2xl font-bold font-heading text-white tracking-tight flex items-center justify-center gap-2">
            {isPsychologist && <span className="text-blue-400">🔵</span>}
            {peerDisplayName}
          </h2>

          <div className="flex items-center justify-center gap-2 mt-2">
            <span className="font-mono text-xl text-white/90 tracking-widest font-semibold bg-white/5 px-3.5 py-1 rounded-full border border-white/10 shadow-inner">
              {formatTime(callDuration)}
            </span>
          </div>

          <p className="text-xs text-white/50 mt-2">
            {peerPresent ? (peerMuted ? 'Peer microphone is muted' : 'Connected via WebRTC') : 'Waiting for peer to join...'}
          </p>
        </div>

        {/* Strict Zero-PII Shielding Notice */}
        <div className="mt-6 w-full bg-white/[0.03] border border-white/10 rounded-xl p-3 text-center">
          {isPsychologist ? (
            <p className="text-[11px] text-white/70 flex items-center justify-center gap-1.5 leading-snug">
              <Lock size={12} className="text-blue-400 shrink-0" />
              <span>Shield Active: Student's real name, phone, and email are strictly hidden.</span>
            </p>
          ) : (
            <p className="text-[11px] text-white/70 flex items-center justify-center gap-1.5 leading-snug">
              <Lock size={12} className="text-green-400 shrink-0" />
              <span>Counselor only sees your anonymous alias: <strong>{callData.student_identity}</strong></span>
            </p>
          )}
        </div>
      </div>

      {/* Floating Bottom Controls Dock */}
      <div className="w-full max-w-sm z-10 pb-4">
        <div className="glass-panel backdrop-blur-2xl bg-[#14151e]/80 border border-white/10 rounded-3xl p-4 shadow-2xl flex items-center justify-around gap-4">
          <button
            onClick={toggleMute}
            className={`w-14 h-14 rounded-full flex flex-col items-center justify-center gap-1 transition-all active:scale-95 ${
              isMuted
                ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                : 'bg-white/10 hover:bg-white/15 text-white border border-white/10'
            }`}
            title={isMuted ? 'Unmute microphone' : 'Mute microphone'}
          >
            {isMuted ? <MicOff size={22} /> : <Mic size={22} />}
            <span className="text-[9px] font-medium opacity-80">{isMuted ? 'Unmute' : 'Mute'}</span>
          </button>

          <button
            onClick={toggleSpeaker}
            className={`w-14 h-14 rounded-full flex flex-col items-center justify-center gap-1 transition-all active:scale-95 ${
              !isSpeakerOn
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                : 'bg-white/10 hover:bg-white/15 text-white border border-white/10'
            }`}
            title={isSpeakerOn ? 'Turn speaker off' : 'Turn speaker on'}
          >
            {!isSpeakerOn ? <VolumeX size={22} /> : <Volume2 size={22} />}
            <span className="text-[9px] font-medium opacity-80">Speaker</span>
          </button>

          <button
            onClick={handleEndCall}
            className="w-14 h-14 rounded-full bg-red-600 hover:bg-red-500 text-white flex flex-col items-center justify-center gap-1 transition-all shadow-lg shadow-red-600/40 active:scale-95 border border-red-400/30"
            title="End Audio Call"
          >
            <PhoneOff size={22} />
            <span className="text-[9px] font-bold tracking-wide">End</span>
          </button>
        </div>
      </div>
    </div>
  );
}
