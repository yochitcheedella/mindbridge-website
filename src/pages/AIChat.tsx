import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { getAlias, getAuth, apiFetch, getWsBaseUrl } from '../utils/auth';

interface ChatMessage {
  id: string;
  sender: 'user' | 'ai' | 'counselor';
  text: string;
  timestamp: Date;
  risk_level?: string;
  risk_score?: number;
}

const RISK_COLORS: Record<string, string> = {
  green:    'bg-[#a1f3c3]/15 text-[#a1f3c3] border-[#a1f3c3]/25',
  yellow:   'bg-warning/15 text-warning border-warning/25',
  orange:   'bg-orange-400/15 text-orange-300 border-orange-400/25',
  red:      'bg-error/15 text-error border-error/25',
  critical: 'bg-error/20 text-error border-error/40 animate-pulse-slow',
};

const RISK_LABELS: Record<string, string> = {
  green: 'Safe', yellow: 'Mild Stress', orange: 'Moderate Risk',
  red: 'High Risk', critical: 'Critical',
};

export default function AIChat() {
  const [inputMessage, setInputMessage] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [currentRisk, setCurrentRisk] = useState<string>('green');
  const [wsStatus, setWsStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
  const [language, setLanguage] = useState('en-IN');
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  
  const wsRef = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const alias = getAlias();

  // Initialize Speech Recognition
  useEffect(() => {
    if (typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      
      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInputMessage(transcript);
        setIsListening(false);
      };
      
      recognitionRef.current.onerror = () => setIsListening(false);
      recognitionRef.current.onend = () => setIsListening(false);
    }
  }, []);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      if (recognitionRef.current) {
        recognitionRef.current.lang = language;
        recognitionRef.current.start();
        setIsListening(true);
      } else {
        alert("Microphone not supported on this browser.");
      }
    }
  };

  const speakText = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = language;
      setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
    }
  };

  const connectWS = () => {
    const auth = getAuth();
    if (!auth) {
      setWsStatus('disconnected');
      return;
    }
    
    setWsStatus('connecting');
    const ws = new WebSocket(`${getWsBaseUrl()}/api/chat/ws?token=${auth.access_token}`);

    ws.onopen = () => { setWsStatus('connected'); setIsTyping(false); };
    ws.onclose = () => { setWsStatus('disconnected'); };
    ws.onerror = () => { setWsStatus('disconnected'); };

    ws.onmessage = (event) => {
      setIsTyping(false);
      try {
        const data = JSON.parse(event.data);
        if (data.sender && data.text) {
          setMessages(prev => [...prev, {
            id: `${Date.now()}-${Math.random()}`,
            sender: data.sender,
            text: data.text,
            timestamp: new Date(),
            risk_level: data.risk_level,
            risk_score: data.risk_score,
          }]);
          if (data.risk_level) setCurrentRisk(data.risk_level);
          if (data.sender === 'ai' && !isSpeaking) {
             speakText(data.text);
          }
        }
      } catch {}
    };

    wsRef.current = ws;
  };

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await apiFetch('/api/chat/history');
        if (res.ok) {
          const data = await res.json();
          const historyMessages = data.map((msg: any) => ({
            id: msg.id,
            sender: msg.sender,
            text: msg.text,
            timestamp: new Date(msg.timestamp),
            risk_score: msg.sentiment_score
          }));
          setMessages(historyMessages);
        }
      } catch (err) {
        console.error('Failed to load chat history', err);
      }
    };

    fetchHistory().then(() => {
      connectWS();
    });
    
    return () => wsRef.current?.close();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSend = async () => {
    const textToSend = inputMessage.trim();
    if (!textToSend) return;
    const msg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: textToSend,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, msg]);
    setInputMessage('');
    setIsTyping(true);

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ text: textToSend, language }));
    } else {
      // Robust REST Fallback
      try {
        const res = await apiFetch('/api/chat/message', {
          method: 'POST',
          body: JSON.stringify({ message: textToSend, language }),
        });
        if (res.ok) {
          const data = await res.json();
          const replyText = data.text || data.response || data.reply || '';
          setMessages(prev => [...prev, {
            id: `${Date.now()}-${Math.random()}`,
            sender: 'ai',
            text: replyText,
            timestamp: new Date(),
            risk_level: data.risk_level || 'green',
            risk_score: data.risk_score || 0.1,
          }]);
          if (data.risk_level) setCurrentRisk(data.risk_level);
          if (!isSpeaking) speakText(replyText);
        }
      } catch (err) {
        console.error('REST Chat Fallback error', err);
      } finally {
        setIsTyping(false);
      }
    }
  };

  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  return (
    <div className="min-h-screen bg-canvas-global flex flex-col max-w-md mx-auto text-on-surface">
      {/* In-Page Subheader */}
      <header className="px-3 sm:px-4 py-2 sm:py-2.5 border-b border-border-internal flex items-center justify-between bg-surface-dim/95 backdrop-blur-xl sticky top-0 z-20">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <Link to="/student/home" className="p-1 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-bright transition-colors shrink-0">
            <span className="material-symbols-outlined text-[20px]">arrow_back</span>
          </Link>
          <div className="w-8 h-8 rounded-full bg-interactive-primary/20 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-interactive-primary text-[18px]">bolt</span>
          </div>
          <div className="min-w-0">
            <h1 className="font-heading text-xs sm:text-sm font-bold truncate">AI Guide</h1>
            <div className="flex items-center gap-1.5">
              <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${wsStatus === 'connected' ? 'bg-[#a1f3c3]' : wsStatus === 'connecting' ? 'bg-warning animate-pulse' : 'bg-error'}`} />
              <span className="text-[10px] text-on-surface-variant font-mono truncate">
                {wsStatus === 'connected' ? 'Anonymous session' : wsStatus === 'connecting' ? 'Connecting...' : 'Offline'}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <select 
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="bg-surface-container-high text-xs text-on-surface border border-border-internal rounded-lg px-1.5 py-1 focus:outline-none"
          >
            <option value="en-IN">English</option>
            <option value="hi-IN">Hindi</option>
            <option value="te-IN">Telugu</option>
            <option value="ta-IN">Tamil</option>
          </select>
          {currentRisk !== 'green' && (
            <span className={`px-2 py-0.5 rounded text-[10px] border font-bold ${RISK_COLORS[currentRisk]}`}>
              {RISK_LABELS[currentRisk]}
            </span>
          )}
        </div>
      </header>

      {/* Chat Messages */}
      <main className="flex-1 overflow-y-auto px-4 py-4 space-y-5 pb-52 md:pb-28">
        {/* Timestamp */}
        <div className="text-center">
          <span className="text-[10px] text-on-surface-variant bg-surface-dim px-3 py-1 rounded-full">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
          </span>
        </div>

        {messages.length === 0 && wsStatus === 'connected' && (
          <div className="text-center pt-6 text-on-surface-variant text-sm">
            <span className="material-symbols-outlined text-[24px] mx-auto mb-3 text-primary/40">lock</span>
            <p className="font-medium">Your safe space</p>
            <p className="text-xs mt-1 opacity-60">Everything you share here is anonymous and encrypted.</p>
          </div>
        )}

        {messages.map(msg => {
          if (msg.sender === 'ai') {
            return (
              <div key={msg.id} className="flex gap-md max-w-[85%] animate-fade-in">
                <div className="w-8 h-8 rounded-full bg-interactive-primary flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-on-primary text-[18px]">bolt</span>
                </div>
                <div className="space-y-sm">
                  <div className="bg-surface-container p-3 rounded-xl rounded-tl-none border border-border-internal text-on-surface text-sm">
                    {msg.text}
                  </div>
                  <span className="text-[10px] text-on-surface-variant opacity-60 px-1">MindBridge AI • {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>
            );
          } else if (msg.sender === 'counselor') {
            return (
              <div key={msg.id} className="flex gap-md max-w-[85%] animate-fade-in">
                <div className="w-8 h-8 rounded-full bg-[#ffb689]/20 flex items-center justify-center shrink-0 shadow-[0_0_10px_rgba(255,182,137,0.3)]">
                  <span className="material-symbols-outlined text-[#ffb689] text-[18px]">psychology</span>
                </div>
                <div className="space-y-sm">
                  <div className="p-3 rounded-xl rounded-tl-none bg-gradient-to-br from-[#ffb689]/20 to-[#ffdbc8]/10 border border-[#ffb689]/30 text-sm">
                    <p className="text-[10px] font-bold text-[#ffb689] mb-1 uppercase tracking-wider">Clinical Counselor</p>
                    {msg.text}
                  </div>
                  <span className="text-[10px] text-on-surface-variant opacity-60 px-1">Counselor • {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>
            );
          } else {
            return (
              <div key={msg.id} className="flex gap-md max-w-[85%] ml-auto flex-row-reverse animate-fade-in">
                <div className="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center shrink-0 border border-border-structural">
                  <span className="material-symbols-outlined text-on-surface-variant text-[18px]">person</span>
                </div>
                <div className="space-y-sm text-right">
                  <div className="bg-interactive-primary text-white p-3 rounded-xl rounded-tr-none border border-primary/20 shadow-lg shadow-interactive-primary/10 text-sm text-left">
                    {msg.text}
                  </div>
                  <span className="text-[10px] text-on-surface-variant opacity-60 px-1">Student • {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>
            );
          }
        })}

        {/* Typing Indicator */}
        {isTyping && (
          <div className="flex gap-md max-w-[85%] animate-fade-in">
            <div className="w-8 h-8 rounded-full bg-interactive-primary flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-on-primary text-[18px]">bolt</span>
            </div>
            <div className="bg-surface-container p-3 rounded-xl rounded-tl-none border border-border-internal text-on-surface flex items-center gap-1">
              {[0, 1, 2].map(i => (
                <div key={i} className="w-1.5 h-1.5 bg-on-surface-variant rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
              ))}
            </div>
          </div>
        )}

        {wsStatus === 'disconnected' && (
          <div className="text-center py-4">
            <p className="text-xs text-error mb-2">Connection lost</p>
            <button onClick={connectWS} className="text-xs text-interactive-primary hover:text-primary underline transition-colors">
              Reconnect
            </button>
          </div>
        )}

        <div ref={messagesEndRef} />
      </main>

      {/* Elevated Input Dock above Floating Bottom Navigation */}
      <div className="fixed bottom-[calc(4.5rem+env(safe-area-inset-bottom,0px))] md:bottom-0 left-0 right-0 max-w-md md:max-w-2xl mx-auto bg-panel-low/95 backdrop-blur-2xl border-t border-border-internal p-3 sm:p-4 z-40 rounded-t-2xl shadow-2xl shadow-black/90">
        <div className="relative">
          <textarea
            className="w-full bg-canvas-global border border-border-internal rounded-xl p-3 pr-24 focus:outline-none focus:border-interactive-primary transition-all resize-none text-on-surface placeholder:text-on-surface-variant/40 custom-scrollbar h-16 text-sm"
            placeholder="Share what's on your mind..."
            value={inputMessage}
            onChange={e => setInputMessage(e.target.value)}
            onKeyDown={handleKey}
          ></textarea>
          <div className="absolute bottom-3 right-3 flex gap-2">
            <button 
              onClick={toggleListening}
              className={`p-1.5 rounded text-on-surface-variant hover:text-interactive-primary transition-colors ${isListening ? 'text-error animate-pulse-slow' : ''}`}
              title="Voice Input"
            >
              <span className="material-symbols-outlined text-[20px]">{isListening ? 'mic_off' : 'mic'}</span>
            </button>
            <button 
              onClick={handleSend}
              className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${inputMessage.trim() ? 'bg-interactive-primary text-on-primary hover:brightness-110 shadow-lg shadow-interactive-primary/20' : 'bg-surface-container text-on-surface-variant opacity-50 cursor-not-allowed'}`}
              title="Send"
            >
              <span className="material-symbols-outlined text-[18px]">send</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
