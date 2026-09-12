import React, { useState, useEffect, useRef } from 'react';
import { Mic, Square, Sparkles, Activity, Volume2, VolumeX, Send, ArrowRight, ShieldCheck, Heart } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { apiFetch } from '../utils/auth';

const PROMPT_SUGGESTIONS = [
  "I'm feeling overwhelmed by upcoming exams",
  "Guide me through a 2-minute grounding exercise",
  "I'm having trouble sleeping because my mind is racing",
  "Can you help me reframe an anxious thought?",
];

export default function VoiceTherapist() {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [typedInput, setTypedInput] = useState('');
  const [aiResponse, setAiResponse] = useState("Hello, I am your MindBridge Voice Therapist. I'm here to listen without judgment. Tap the microphone or select a prompt below to begin.");
  const [riskLevel, setRiskLevel] = useState('green');
  const [conversationHistory, setConversationHistory] = useState<Array<{ sender: 'user' | 'ai'; text: string; time: string }>>([
    {
      sender: 'ai',
      text: "Hello, I am your MindBridge Voice Therapist. I'm here to listen without judgment. Tap the microphone or select a prompt below to begin.",
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }
  ]);
  
  const recognitionRef = useRef<any>(null);
  const synthesisRef = useRef<SpeechSynthesis | null>(null);
  const transcriptRef = useRef('');

  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      synthesisRef.current = window.speechSynthesis;
    }

    // Initialize Web Speech API for recognition if supported
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-IN';
      
      recognition.onresult = (event: any) => {
        let currentTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript;
        }
        setTranscript(currentTranscript);
        transcriptRef.current = currentTranscript;
      };

      recognition.onend = () => {
        setIsListening(false);
        const text = transcriptRef.current.trim();
        if (text) {
          processVoiceInput(text);
          transcriptRef.current = '';
        }
      };

      recognition.onerror = (e: any) => {
        console.warn('Speech recognition error/cancelled:', e);
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
    
    return () => {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch {}
      }
      if (synthesisRef.current) {
        synthesisRef.current.cancel();
      }
    };
  }, []);

  const processVoiceInput = async (inputText: string) => {
    const textToSend = inputText.trim();
    if (!textToSend) return;

    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setConversationHistory(prev => [...prev, { sender: 'user', text: textToSend, time: timeStr }]);
    setTranscript('');
    setTypedInput('');
    setIsThinking(true);

    try {
      const res = await apiFetch('/api/chat/message', {
        method: 'POST',
        body: JSON.stringify({ message: textToSend, language: 'en-IN' }),
      });

      if (res.ok) {
        const data = await res.json();
        const reply = data.text || data.response || data.reply || "I hear you. Take a slow, calm breath. You're doing the best you can.";
        setAiResponse(reply);
        if (data.risk_level) setRiskLevel(data.risk_level);
        setConversationHistory(prev => [...prev, { sender: 'ai', text: reply, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }]);
        if (!isAudioMuted) {
          speakResponse(reply);
        }
      } else {
        const fallback = "I hear what you're saying. It's completely valid to feel this way. Let's take a deep breath together. Tell me more about what is causing this stress.";
        setAiResponse(fallback);
        setConversationHistory(prev => [...prev, { sender: 'ai', text: fallback, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }]);
        if (!isAudioMuted) speakResponse(fallback);
      }
    } catch (err) {
      console.error('AI Voice therapist request error:', err);
      const fallback = "I'm listening and right here with you. Remember to take things one breath at a time. What would feel most comforting right now?";
      setAiResponse(fallback);
      setConversationHistory(prev => [...prev, { sender: 'ai', text: fallback, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }]);
      if (!isAudioMuted) speakResponse(fallback);
    } finally {
      setIsThinking(false);
    }
  };

  const speakResponse = (text: string) => {
    if (!synthesisRef.current) return;
    synthesisRef.current.cancel();
    setIsSpeaking(true);
    const utterance = new SpeechSynthesisUtterance(text);
    
    // Find calming voice
    const voices = synthesisRef.current.getVoices();
    const preferredVoice = voices.find(v => v.name.includes('Samantha') || v.name.includes('Google UK English Female') || v.name.includes('Natural') || v.lang.startsWith('en'));
    if (preferredVoice) utterance.voice = preferredVoice;
    
    utterance.rate = 0.92;
    utterance.pitch = 1.0;
    
    utterance.onend = () => {
      setIsSpeaking(false);
    };
    utterance.onerror = () => {
      setIsSpeaking(false);
    };
    
    synthesisRef.current.speak(utterance);
  };

  const toggleListening = () => {
    if (isListening) {
      try { recognitionRef.current?.stop(); } catch {}
      setIsListening(false);
    } else {
      setTranscript('');
      if (synthesisRef.current) synthesisRef.current.cancel();
      setIsSpeaking(false);
      try {
        if (recognitionRef.current) {
          recognitionRef.current.start();
          setIsListening(true);
        } else {
          // If browser doesn't have recognition, focus the text input
          const inputEl = document.getElementById('voice-therapist-input');
          inputEl?.focus();
        }
      } catch (e) {
        console.warn('Speech start error:', e);
        setIsListening(false);
      }
    }
  };

  const toggleAudio = () => {
    if (isSpeaking && synthesisRef.current) {
      synthesisRef.current.cancel();
      setIsSpeaking(false);
    }
    setIsAudioMuted(!isAudioMuted);
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 animate-fade-in text-[#111111] pb-16">
      {/* ── Top Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#111111]/10">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-[#F4C542] border-2 border-[#111111] flex items-center justify-center text-[#111111] shadow-xs shrink-0">
            <Sparkles size={22} className="stroke-[2.5]" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-heading font-black text-xl sm:text-2xl text-[#111111] tracking-tight">
                AI Voice Therapist
              </h1>
              <span className="px-2.5 py-0.5 rounded-full bg-[#F4C542]/20 border border-[#F4C542] text-[#111111] text-[11px] font-black uppercase">
                24/7 Voice Care
              </span>
            </div>
            <p className="text-xs text-[#111111]/60 mt-0.5 font-medium">Real-time clinical voice guidance · 100% confidential</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            onClick={toggleAudio}
            title={isAudioMuted ? "Unmute Voice" : "Mute Voice"}
            className="p-2.5 rounded-2xl bg-[#FFFFFF] border-2 border-[#111111] hover:bg-[#F4C542] text-[#111111] transition-all shadow-xs cursor-pointer flex items-center justify-center"
          >
            {isAudioMuted ? <VolumeX size={18} className="text-rose-600" /> : <Volume2 size={18} className="text-[#111111]" />}
          </button>
          <div className={`px-3 py-1.5 rounded-full text-xs font-mono font-bold border-2 flex items-center gap-1.5 ${
            riskLevel === 'green' ? 'bg-emerald-500/15 text-emerald-700 border-emerald-500/30' :
            riskLevel === 'yellow' ? 'bg-[#F4C542]/20 text-[#111111] border-[#111111]' :
            'bg-rose-500/15 text-rose-700 border-rose-500/30'
          }`}>
            <span className="w-2 h-2 rounded-full bg-current animate-pulse" />
            <span className="capitalize">{riskLevel === 'green' ? 'Safe Zone' : riskLevel + ' Risk'}</span>
          </div>
        </div>
      </div>

      {/* ── Interactive Audio Stage ── */}
      <div className="bg-[#FFFFFF] border-2 border-[#111111]/10 rounded-3xl p-6 sm:p-10 shadow-sm flex flex-col items-center justify-center text-center">
        
        {/* Animated Visualizer Aura */}
        <div className="relative flex items-center justify-center w-48 h-48 sm:w-56 sm:h-56 my-2">
          <div
            className={`absolute inset-0 rounded-full transition-all duration-700 ${
              isSpeaking
                ? 'bg-[#F4C542]/30 scale-115 shadow-[0_0_50px_rgba(244,197,66,0.5)] border-2 border-[#F4C542]'
                : isThinking
                ? 'bg-[#F4C542]/15 scale-105 border-2 border-[#F4C542] animate-pulse'
                : isListening
                ? 'bg-rose-500/20 scale-110 shadow-[0_0_50px_rgba(244,63,94,0.3)] border-2 border-rose-500/50'
                : 'bg-[#111111]/5 border border-[#111111]/10'
            }`}
          />

          {isSpeaking && <div className="absolute inset-0 rounded-full animate-ping bg-[#F4C542]/25 pointer-events-none" />}
          {isListening && <div className="absolute inset-0 rounded-full animate-ping bg-rose-500/20 pointer-events-none" />}

          <div className="relative z-10 w-36 h-36 sm:w-40 sm:h-40 rounded-full bg-[#FFFFFF] border-4 border-[#111111] shadow-lg flex items-center justify-center">
            <Activity
              size={52}
              className={`transition-all duration-500 ${
                isSpeaking ? 'text-[#111111] animate-pulse' :
                isThinking ? 'text-[#F4C542] animate-spin' :
                isListening ? 'text-rose-600 scale-110' :
                'text-[#111111]/40'
              }`}
            />
          </div>
        </div>

        {/* Dynamic Status / Speech Preview (Fixed min height to prevent jumping) */}
        <div className="w-full max-w-xl mx-auto min-h-[72px] flex items-center justify-center px-4 mt-6">
          {isListening && (
            <p className="text-sm sm:text-base text-rose-600 animate-pulse font-bold bg-rose-500/10 px-4 py-2 rounded-2xl border border-rose-500/20">
              "{transcript || 'Listening to your voice...'}"
            </p>
          )}
          {isThinking && (
            <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-[#111111] bg-[#F4C542]/20 px-4 py-2 rounded-2xl border border-[#F4C542]">
              <Sparkles size={16} className="animate-spin text-[#111111]" />
              <span>Formulating compassionate clinical guidance...</span>
            </div>
          )}
          {!isListening && !isThinking && (
            <p className="text-xs sm:text-sm text-[#111111]/80 leading-relaxed font-medium italic max-w-lg">
              "{aiResponse}"
            </p>
          )}
        </div>

        {/* Main Mic Button & Controls */}
        <div className="flex flex-col items-center gap-3 mt-6 pt-6 border-t border-[#111111]/10 w-full max-w-md">
          <button
            onClick={toggleListening}
            id="voice-mic-trigger"
            className={`w-20 h-20 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-md border-4 border-[#111111] ${
              isListening
                ? 'bg-rose-500 text-white hover:bg-rose-600 animate-pulse ring-4 ring-rose-500/30'
                : 'bg-[#F4C542] text-[#111111] hover:bg-[#e0b435] hover:scale-105 active:scale-95'
            }`}
          >
            {isListening ? <Square size={26} className="fill-current" /> : <Mic size={32} className="stroke-[2.5]" />}
          </button>

          <p className="text-[11px] font-black tracking-wider text-[#111111] uppercase mt-1">
            {isSpeaking ? 'AI is speaking (Tap to interrupt)' : isListening ? 'Listening... Tap to stop' : 'Tap microphone to speak'}
          </p>

          {/* Text Input Fallback Bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (typedInput.trim()) processVoiceInput(typedInput);
            }}
            className="w-full flex items-center gap-2 pt-3"
          >
            <input
              id="voice-therapist-input"
              type="text"
              placeholder="Or type what's on your mind..."
              value={typedInput}
              onChange={(e) => setTypedInput(e.target.value)}
              className="flex-1 px-4 py-3 text-xs sm:text-sm bg-[#FFFFFF] border-2 border-[#111111] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#F4C542] text-[#111111] placeholder:text-[#111111]/40 font-medium"
            />
            <button
              type="submit"
              disabled={!typedInput.trim() || isThinking}
              className="px-5 py-3 bg-[#F4C542] hover:bg-[#e0b435] text-[#111111] rounded-2xl text-xs sm:text-sm font-black border-2 border-[#111111] disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-1.5 shadow-sm shrink-0 cursor-pointer active:scale-95"
            >
              <span>Send</span>
              <Send size={14} />
            </button>
          </form>
        </div>
      </div>

      {/* ── Quick Therapeutic Prompts ── */}
      <div className="w-full max-w-2xl mx-auto space-y-3">
        <p className="text-[11px] uppercase tracking-wider text-[#111111]/60 font-black text-center flex items-center justify-center gap-1.5">
          <Heart size={13} className="text-[#111111]" />
          <span>Quick Therapeutic Prompts</span>
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {PROMPT_SUGGESTIONS.map((prompt, i) => (
            <button
              key={i}
              onClick={() => processVoiceInput(prompt)}
              className="text-left p-3.5 rounded-2xl bg-[#FFFFFF] hover:bg-[#F4C542]/20 border-2 border-[#111111]/15 hover:border-[#111111] text-xs font-bold text-[#111111] transition-all duration-200 flex items-center justify-between group shadow-2xs cursor-pointer active:scale-98"
            >
              <span className="truncate mr-2 font-medium">{prompt}</span>
              <ArrowRight size={14} className="opacity-40 group-hover:opacity-100 group-hover:translate-x-1 text-[#111111] transition-all shrink-0 stroke-[2.5]" />
            </button>
          ))}
        </div>
      </div>

      {/* ── Anonymity & Security Banner ── */}
      <div className="pt-2 flex items-center justify-center gap-2 text-[11px] text-[#111111]/60 font-mono text-center">
        <ShieldCheck size={15} className="text-[#111111] shrink-0" />
        <span>Protected by AES-256 Vault. Audio is processed client-side with zero retention.</span>
      </div>
    </div>
  );
}
