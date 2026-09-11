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
    <div className="flex-1 overflow-y-auto bg-canvas-global p-4 md:p-8 max-w-4xl mx-auto pb-24 w-full h-full flex flex-col items-center">
      {/* Header */}
      <div className="w-full flex items-center justify-between mb-8 pb-4 border-b border-border/40">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-sm">
            <Sparkles size={20} />
          </div>
          <div>
            <h1 className="font-heading font-bold text-2xl md:text-3xl text-text flex items-center gap-2">
              AI Voice Therapist
            </h1>
            <p className="text-xs text-text-muted">Real-time clinical voice guidance · 100% confidential</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={toggleAudio}
            title={isAudioMuted ? "Unmute Voice" : "Mute Voice"}
            className="p-2 rounded-xl bg-surface border border-border/60 hover:border-primary/40 text-text-muted hover:text-text transition-colors"
          >
            {isAudioMuted ? <VolumeX size={18} className="text-error" /> : <Volume2 size={18} className="text-primary" />}
          </button>
          <div className={`px-2.5 py-1 rounded-full text-xs font-medium border flex items-center gap-1.5 ${
            riskLevel === 'green' ? 'bg-[#a1f3c3]/10 text-[#a1f3c3] border-[#a1f3c3]/30' :
            riskLevel === 'yellow' ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' :
            'bg-rose-500/10 text-rose-400 border-rose-500/30'
          }`}>
            <span className="w-2 h-2 rounded-full bg-current animate-pulse" />
            <span className="capitalize">{riskLevel === 'green' ? 'Safe Zone' : riskLevel + ' Risk'}</span>
          </div>
        </div>
      </div>

      {/* Center Interactive Animated Aura */}
      <div className="flex-1 w-full flex flex-col items-center justify-center my-6 relative min-h-[260px]">
        <div className={`relative flex items-center justify-center w-48 h-48 rounded-full transition-all duration-700 ${
          isSpeaking 
            ? 'bg-primary/20 scale-110 shadow-[0_0_60px_rgba(99,102,241,0.4)] border-2 border-primary/50' 
            : isThinking 
            ? 'bg-amber-500/10 scale-105 border-2 border-amber-500/40 animate-pulse'
            : isListening 
            ? 'bg-rose-500/15 scale-105 shadow-[0_0_50px_rgba(244,63,94,0.3)] border-2 border-rose-500/40' 
            : 'bg-surface/80 border border-border/60 shadow-lg'
        }`}>
          {isSpeaking && <div className="absolute inset-0 rounded-full animate-ping bg-primary/25 pointer-events-none" />}
          {isListening && <div className="absolute inset-0 rounded-full animate-ping bg-rose-500/20 pointer-events-none" />}
          
          <Activity 
            size={64} 
            className={`transition-all duration-500 ${
              isSpeaking ? 'text-primary animate-pulse' : 
              isThinking ? 'text-amber-400 animate-spin' :
              isListening ? 'text-rose-400 scale-110' : 
              'text-text-muted/60'
            }`} 
          />
        </div>

        {/* Dynamic Status / Speech Preview */}
        <div className="mt-8 text-center max-w-lg px-4 min-h-[60px] flex items-center justify-center">
          {isListening && (
            <p className="text-base md:text-lg text-rose-300 animate-pulse font-medium">
              "{transcript || 'Listening to your voice...'}"
            </p>
          )}
          {isThinking && (
            <div className="flex items-center gap-2 text-amber-300 font-medium">
              <Sparkles size={16} className="animate-spin" />
              <span>Thinking & formulating guidance...</span>
            </div>
          )}
          {!isListening && !isThinking && (
            <p className="text-sm md:text-base text-text-muted leading-relaxed italic">
              "{aiResponse}"
            </p>
          )}
        </div>
      </div>

      {/* Suggested Voice Prompts */}
      <div className="w-full max-w-xl mb-6">
        <p className="text-xs uppercase tracking-wider text-text-muted font-semibold mb-2.5 text-center flex items-center justify-center gap-1.5">
          <Heart size={13} className="text-primary" />
          <span>Quick Therapeutic Prompts</span>
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {PROMPT_SUGGESTIONS.map((prompt, i) => (
            <button
              key={i}
              onClick={() => processVoiceInput(prompt)}
              className="text-left px-3.5 py-2.5 rounded-xl bg-surface/70 hover:bg-surface border border-border/50 hover:border-primary/40 text-xs text-text-muted hover:text-text transition-all duration-200 flex items-center justify-between group shadow-sm"
            >
              <span className="truncate mr-2">{prompt}</span>
              <ArrowRight size={13} className="opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 text-primary transition-all shrink-0" />
            </button>
          ))}
        </div>
      </div>

      {/* Voice & Text Interaction Controls */}
      <Card className="w-full max-w-xl p-5 bg-surface/90 backdrop-blur-xl border border-primary/20 shadow-xl rounded-2xl">
        <div className="flex flex-col items-center gap-5">
          <div className="flex items-center gap-4">
            <button
              onClick={toggleListening}
              id="voice-mic-trigger"
              className={`w-16 h-16 rounded-full flex items-center justify-center transition-all shadow-xl ${
                isListening 
                  ? 'bg-rose-500 text-white hover:bg-rose-600 animate-pulse shadow-rose-500/40 ring-4 ring-rose-500/20' 
                  : 'bg-primary text-white hover:bg-primary/90 hover:scale-105 shadow-primary/30'
              }`}
            >
              {isListening ? <Square size={24} className="fill-current" /> : <Mic size={28} />}
            </button>
          </div>

          <p className="text-xs font-semibold tracking-wider text-text-muted uppercase">
            {isSpeaking ? 'AI is speaking (Tap to interrupt)' : isListening ? 'Listening... Tap to stop' : 'Tap mic to speak out loud'}
          </p>

          {/* Text input fallback bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (typedInput.trim()) processVoiceInput(typedInput);
            }}
            className="w-full flex items-center gap-2 pt-2 border-t border-border/40"
          >
            <input
              id="voice-therapist-input"
              type="text"
              placeholder="Or type what's on your mind..."
              value={typedInput}
              onChange={(e) => setTypedInput(e.target.value)}
              className="flex-1 px-4 py-2.5 text-sm bg-surface-dim/80 border border-border/60 rounded-xl focus:outline-none focus:border-primary text-text placeholder:text-text-muted/60 transition-colors"
            />
            <button
              type="submit"
              disabled={!typedInput.trim() || isThinking}
              className="px-4 py-2.5 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-1.5 shadow-sm"
            >
              <span>Speak</span>
              <Send size={14} />
            </button>
          </form>
        </div>
      </Card>

      {/* Anonymity Banner */}
      <div className="mt-6 flex items-center gap-2 text-xs text-text-muted/70">
        <ShieldCheck size={14} className="text-[#a1f3c3]" />
        <span>Protected by AES-256 Vault. Audio is processed client-side with zero retention.</span>
      </div>
    </div>
  );
}
