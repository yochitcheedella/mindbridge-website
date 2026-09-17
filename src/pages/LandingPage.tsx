import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Shield, Heart, Sparkles, Brain, Wind, Activity, Users,
  Calendar, PhoneCall, Download, ArrowRight, CheckCircle2,
  Lock, AlertTriangle, Play, Pause, RefreshCw, Smartphone,
  Monitor, ChevronRight, FileText, BarChart3, HelpCircle, Star, Building2
} from 'lucide-react';
import { getAuth } from '../utils/auth';
import { OFFICIAL_COUNSELORS, VISHNU_WELLNESS_CENTRE, type CounselorData } from '../data/counselors';
import CounselorFlashcard from '../components/flashcards/CounselorFlashcard';

const PSEUDONYMS = [
  { name: 'Sapphire Falcon #4102', avatar: '🦅', branch: 'CSE' },
  { name: 'Golden Sparrow #7721', avatar: '🐤', branch: 'AI & DS' },
  { name: 'Emerald Willow #9314', avatar: '🌿', branch: 'ECE' },
  { name: 'Amber Horizon #1893', avatar: '🌅', branch: 'MECH' },
  { name: 'Silver Pine #6284', avatar: '🌲', branch: 'CIVIL' },
  { name: 'Cobalt River #5541', avatar: '🌊', branch: 'EEE' },
];

export default function LandingPage() {
  const navigate = useNavigate();
  const auth = getAuth();

  // Selected counselor for modal bio view
  const [selectedCounselor, setSelectedCounselor] = useState<CounselorData | null>(null);

  // Interactive Anonymity Demo State
  const [demoIndex, setDemoIndex] = useState(0);
  const [animatingId, setAnimatingId] = useState(false);

  // Interactive Breathwork Demo State
  const [isBreathing, setIsBreathing] = useState(false);
  const [breathPhase, setBreathPhase] = useState<'Inhale' | 'Hold' | 'Exhale'>('Inhale');
  const [breathTimer, setBreathTimer] = useState(4);

  // Active Showcase Tab
  const [activeTab, setActiveTab] = useState<'student' | 'psychologist' | 'admin' | 'super_admin'>('student');

  // Cycle Anonymity Demo
  const cyclePseudonym = () => {
    setAnimatingId(true);
    setTimeout(() => {
      setDemoIndex((prev) => (prev + 1) % PSEUDONYMS.length);
      setAnimatingId(false);
    }, 250);
  };

  // Breathwork loop
  useEffect(() => {
    if (!isBreathing) return;
    const interval = setInterval(() => {
      setBreathTimer((prev) => {
        if (prev > 1) return prev - 1;
        if (breathPhase === 'Inhale') {
          setBreathPhase('Hold');
          return 7;
        } else if (breathPhase === 'Hold') {
          setBreathPhase('Exhale');
          return 8;
        } else {
          setBreathPhase('Inhale');
          return 4;
        }
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isBreathing, breathPhase]);

  return (
    <div className="min-h-screen bg-[#FFFFFF] text-[#111111] font-sans antialiased selection:bg-[#F4C542] selection:text-[#111111]">
      
      {/* ── Top Campus Emergency Ticker ── */}
      <div className="bg-[#111111] text-[#FFFFFF] text-xs font-mono py-2 px-4 flex items-center justify-between border-b border-[#111111]/20">
        <div className="container mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-[#F4C542] animate-pulse"></span>
            <span className="font-bold text-[#F4C542] tracking-wider uppercase">VIT Official Wellness Portal</span>
            <span className="hidden sm:inline text-[#FFFFFF]/50">|</span>
            <span className="hidden sm:inline text-[#FFFFFF]/80">Vishnu Institute of Technology (Autonomous), Bhimavaram</span>
          </div>
          <div className="flex items-center gap-4 text-xs font-sans">
            <span className="text-[#FFFFFF]/70 hidden md:inline">Need immediate support?</span>
            <a 
              href="tel:14416" 
              className="inline-flex items-center gap-1.5 bg-[#F4C542] text-[#111111] font-black px-2.5 py-0.5 rounded-full hover:bg-[#FFFFFF] transition-colors"
            >
              <PhoneCall size={11} />
              Tele-MANAS: 14416 (24/7 Free)
            </a>
          </div>
        </div>
      </div>

      {/* ── Main Sticky Header ── */}
      <header className="sticky top-0 z-40 bg-[#FFFFFF]/90 backdrop-blur-md border-b border-[#111111]/10">
        <div className="container mx-auto px-4 lg:px-8 h-20 flex items-center justify-between">
          
          {/* Logo & Institution Branding */}
          <Link to="/" className="flex items-center gap-3.5 group">
            <div className="w-12 h-12 rounded-2xl bg-[#111111] border-2 border-[#111111] p-0.5 flex items-center justify-center overflow-hidden shadow-xs group-hover:scale-105 transition-transform">
              <img 
                src="/vishnu_app_icon.png" 
                alt="MindBridge Logo" 
                className="w-full h-full object-cover rounded-xl"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-heading font-black text-xl text-[#111111] tracking-tight">MindBridge<span className="text-[#F4C542]">.</span></span>
                <span className="bg-[#F4C542] text-[#111111] text-[10px] font-mono font-black uppercase px-2 py-0.5 rounded-full border border-[#111111]">
                  VIT CAMPUS
                </span>
              </div>
              <span className="block text-[11px] font-medium text-[#111111]/60 tracking-wider">
                SVES WELLNESS CENTRE
              </span>
            </div>
          </Link>

          {/* Navigation Links (Desktop) */}
          <nav className="hidden lg:flex items-center gap-8 text-sm font-semibold text-[#111111]/80">
            <a href="#features" className="hover:text-[#111111] transition-colors">Features</a>
            <a href="#portals" className="hover:text-[#111111] transition-colors">Role Portals</a>
            <a href="#counselors" className="hover:text-[#111111] transition-colors">Counselors</a>
            <a href="#anonymity" className="hover:text-[#111111] transition-colors">Anonymity Vault</a>
            <a href="#breathwork" className="hover:text-[#111111] transition-colors">Quick Calm</a>
            <Link 
              to="/admin/dashboard" 
              className="text-xs font-mono font-black uppercase px-2.5 py-1 rounded-lg bg-[#FAFAFA] border border-[#111111]/30 hover:border-[#111111] hover:bg-[#F4C542] text-[#111111] transition-all"
            >
              Admin
            </Link>
            <Link 
              to="/superadmin/dashboard" 
              className="text-xs font-mono font-black uppercase px-2.5 py-1 rounded-lg bg-[#F4C542] border border-[#111111] text-[#111111] hover:bg-[#e0b435] transition-all shadow-xs"
            >
              Super Admin
            </Link>
            <a href="#download" className="hover:text-[#111111] transition-colors flex items-center gap-1.5 text-[#111111]">
              <Download size={15} className="text-[#111111]" />
              Download APK <span className="bg-[#111111] text-[#FFFFFF] text-[10px] font-mono px-1.5 py-0.2 rounded-md">v1.7</span>
            </a>
          </nav>

          {/* Action CTAs */}
          <div className="flex items-center gap-3">
            {auth?.access_token ? (
              <button
                onClick={() => {
                  if (auth.role === 'psychologist') navigate('/psychologist/dashboard');
                  else if (auth.role === 'admin') navigate('/admin/dashboard');
                  else navigate('/student/home');
                }}
                className="bg-[#F4C542] text-[#111111] font-black text-sm px-5 py-2.5 rounded-xl border-2 border-[#111111] shadow-[2px_2px_0px_#111111] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition-all flex items-center gap-2"
              >
                <span>Enter Dashboard</span>
                <ArrowRight size={16} />
              </button>
            ) : (
              <>
                <Link
                  to="/login"
                  className="hidden sm:inline-flex text-sm font-bold text-[#111111] hover:text-[#111111]/70 px-4 py-2 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="bg-[#111111] text-[#FFFFFF] font-bold text-sm px-5 py-2.5 rounded-xl border-2 border-[#111111] hover:bg-[#F4C542] hover:text-[#111111] hover:border-[#111111] transition-all flex items-center gap-2 shadow-xs"
                >
                  <span>Student Sign Up</span>
                  <ArrowRight size={16} />
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ── Hero Section ── */}
      <section className="relative overflow-hidden pt-12 pb-20 lg:pt-20 lg:pb-28 border-b border-[#111111]/10 bg-gradient-to-b from-[#FFFFFF] via-[#FAFAFA] to-[#FFFFFF]">
        <div className="container mx-auto px-4 lg:px-8">
          
          <div className="max-w-4xl mx-auto text-center">
            
            {/* Live Campus Pill */}
            <div className="inline-flex items-center gap-2 bg-[#FFFFFF] border-2 border-[#111111] px-4 py-1.5 rounded-full shadow-[2px_2px_0px_#111111] mb-8">
              <span className="w-2.5 h-2.5 rounded-full bg-[#10B981] animate-ping"></span>
              <span className="text-xs font-mono font-bold tracking-tight text-[#111111] uppercase">
                Now Live for VIT Students & Faculty • 100% Zero-PII Anonymity
              </span>
            </div>

            {/* Main Headline */}
            <h1 className="font-heading font-black text-4xl sm:text-6xl lg:text-7xl tracking-tight text-[#111111] leading-[1.08] mb-6">
              No Student Should <br className="hidden sm:inline" />
              <span className="relative inline-block">
                <span className="relative z-10">Suffer in Silence.</span>
                <span className="absolute left-0 right-0 bottom-2 sm:bottom-3 h-4 sm:h-6 bg-[#F4C542] -rotate-1 -z-0 opacity-80 rounded-sm"></span>
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-lg sm:text-xl text-[#111111]/70 max-w-2xl mx-auto font-normal leading-relaxed mb-10">
              MindBridge AI is the dedicated, confidential mental wellbeing ecosystem engineered exclusively for 
              <strong> Vishnu Institute of Technology</strong>. Instant empathetic AI counseling, peer circles, and direct clinical appointments without fear of stigma.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-14">
              <Link
                to="/login"
                className="w-full sm:w-auto bg-[#F4C542] text-[#111111] font-black text-base px-8 py-4 rounded-2xl border-2 border-[#111111] shadow-[4px_4px_0px_#111111] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all flex items-center justify-center gap-3"
              >
                <Sparkles size={20} />
                <span>Launch Student Web Portal</span>
                <ArrowRight size={18} />
              </Link>
              
              <a
                href="/MindBridge-VIT-v1.7.apk"
                download="MindBridge-VIT-v1.7.apk"
                className="w-full sm:w-auto bg-[#FFFFFF] text-[#111111] font-bold text-base px-7 py-4 rounded-2xl border-2 border-[#111111] shadow-[4px_4px_0px_#111111] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all flex items-center justify-center gap-3"
              >
                <Download size={20} />
                <span>Download Android APK (v1.7)</span>
              </a>

              <Link
                to="/login"
                className="w-full sm:w-auto text-[#111111]/80 hover:text-[#111111] font-bold text-sm px-5 py-4 flex items-center justify-center gap-1.5"
              >
                <span>Psychologist & Staff Login</span>
                <ChevronRight size={16} />
              </Link>
            </div>

            {/* Institutional Trust Highlights */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto pt-6 border-t border-[#111111]/10">
              <div className="flex flex-col items-center text-center p-3">
                <span className="font-heading font-black text-2xl text-[#111111]">100%</span>
                <span className="text-xs font-semibold text-[#111111]/60 mt-0.5">Encrypted Anonymity</span>
              </div>
              <div className="flex flex-col items-center text-center p-3">
                <span className="font-heading font-black text-2xl text-[#111111]">24/7</span>
                <span className="text-xs font-semibold text-[#111111]/60 mt-0.5">AI Therapy Support</span>
              </div>
              <div className="flex flex-col items-center text-center p-3">
                <span className="font-heading font-black text-2xl text-[#111111]">7+</span>
                <span className="text-xs font-semibold text-[#111111]/60 mt-0.5">VIT Psychologists</span>
              </div>
              <div className="flex flex-col items-center text-center p-3">
                <span className="font-heading font-black text-2xl text-[#111111]">6 Branches</span>
                <span className="text-xs font-semibold text-[#111111]/60 mt-0.5">CSE, AI&DS, ECE & more</span>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* ── Interactive Anonymity Demo Section ── */}
      <section id="anonymity" className="py-20 bg-[#FAFAFA] border-b border-[#111111]/10">
        <div className="container mx-auto px-4 lg:px-8">
          
          <div className="max-w-4xl mx-auto bg-[#FFFFFF] rounded-3xl border-2 border-[#111111] p-6 sm:p-10 shadow-[6px_6px_0px_#111111]">
            <div className="flex flex-col md:flex-row items-center gap-8">
              
              <div className="flex-1 text-left">
                <div className="inline-flex items-center gap-2 bg-[#F4C542] text-[#111111] text-xs font-mono font-black px-3 py-1 rounded-full border border-[#111111] mb-4">
                  <Lock size={12} />
                  <span>ZERO-PII CRYPTOGRAPHIC VAULT</span>
                </div>
                <h2 className="font-heading font-black text-2xl sm:text-3xl text-[#111111] tracking-tight mb-3">
                  Your identity is never exposed. Not even to counselors.
                </h2>
                <p className="text-sm text-[#111111]/70 leading-relaxed mb-6">
                  When you register with your institutional <code className="bg-[#111111]/5 px-1.5 py-0.5 rounded font-mono text-xs text-[#111111]">@vishnu.edu.in</code> email, 
                  it is symmetrically salted and locked in an offline AES-256 vault. Your chats, journals, and bookings are 
                  conducted under dynamically generated anonymous pseudonyms.
                </p>

                <button
                  onClick={cyclePseudonym}
                  className="bg-[#111111] text-[#FFFFFF] font-bold text-xs px-4 py-2.5 rounded-xl border border-[#111111] hover:bg-[#F4C542] hover:text-[#111111] transition-all flex items-center gap-2"
                >
                  <RefreshCw size={14} className={animatingId ? 'animate-spin' : ''} />
                  <span>Simulate Identity Generation</span>
                </button>
              </div>

              {/* Interactive Card */}
              <div className="w-full md:w-80 bg-[#FAFAFA] rounded-2xl border-2 border-[#111111] p-6 text-center shadow-xs">
                <div className="text-[10px] uppercase font-mono font-bold tracking-widest text-[#111111]/50 mb-4">
                  Public Campus Display Token
                </div>
                
                <div className={`transition-all duration-250 transform ${animatingId ? 'opacity-30 scale-95' : 'opacity-100 scale-100'}`}>
                  <div className="w-20 h-20 mx-auto rounded-2xl bg-[#F4C542] border-2 border-[#111111] flex items-center justify-center text-3xl shadow-xs mb-3">
                    {PSEUDONYMS[demoIndex].avatar}
                  </div>
                  <div className="font-heading font-black text-lg text-[#111111]">
                    {PSEUDONYMS[demoIndex].name}
                  </div>
                  <div className="inline-block mt-1 text-xs font-mono font-semibold text-[#111111]/60 bg-[#FFFFFF] px-2.5 py-0.5 rounded-full border border-[#111111]/15">
                    Branch: {PSEUDONYMS[demoIndex].branch} (VIT)
                  </div>
                </div>

                <div className="mt-5 pt-4 border-t border-[#111111]/10 flex items-center justify-between text-[11px] font-mono text-[#111111]/60">
                  <span>Vault Status:</span>
                  <span className="text-[#10B981] font-bold flex items-center gap-1">
                    <CheckCircle2 size={12} /> Salted & Encrypted
                  </span>
                </div>
              </div>

            </div>
          </div>

        </div>
      </section>

      {/* ── The Three Portals Section ── */}
      <section id="portals" className="py-20 lg:py-28 bg-[#FFFFFF] border-b border-[#111111]/10">
        <div className="container mx-auto px-4 lg:px-8">
          
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h2 className="font-heading font-black text-3xl sm:text-5xl text-[#111111] tracking-tight mb-4">
              Three Portals. One United Campus.
            </h2>
            <p className="text-base text-[#111111]/70">
              MindBridge AI seamlessly bridges students, campus clinical psychologists, and institutional leadership 
              while maintaining strict role-based data boundaries.
            </p>

            {/* Portal Tab Switcher */}
            <div className="flex items-center justify-center gap-1.5 mt-8 p-1.5 bg-[#FAFAFA] border-2 border-[#111111] rounded-2xl max-w-xl mx-auto shadow-xs flex-wrap sm:flex-nowrap">
              <button
                onClick={() => setActiveTab('student')}
                className={`flex-1 py-2 px-3 rounded-xl font-bold text-xs transition-all ${
                  activeTab === 'student'
                    ? 'bg-[#111111] text-[#FFFFFF]'
                    : 'text-[#111111]/70 hover:text-[#111111]'
                }`}
              >
                Student Sanctuary
              </button>
              <button
                onClick={() => setActiveTab('psychologist')}
                className={`flex-1 py-2 px-3 rounded-xl font-bold text-xs transition-all ${
                  activeTab === 'psychologist'
                    ? 'bg-[#111111] text-[#FFFFFF]'
                    : 'text-[#111111]/70 hover:text-[#111111]'
                }`}
              >
                Clinical Suite
              </button>
              <button
                onClick={() => setActiveTab('admin')}
                className={`flex-1 py-2 px-3 rounded-xl font-bold text-xs transition-all ${
                  activeTab === 'admin'
                    ? 'bg-[#111111] text-[#FFFFFF]'
                    : 'text-[#111111]/70 hover:text-[#111111]'
                }`}
              >
                Institutional Admin
              </button>
              <button
                onClick={() => setActiveTab('super_admin')}
                className={`flex-1 py-2 px-3 rounded-xl font-bold text-xs transition-all ${
                  activeTab === 'super_admin'
                    ? 'bg-[#F4C542] text-[#111111] border border-[#111111] shadow-xs'
                    : 'text-[#111111]/70 hover:text-[#111111]'
                }`}
              >
                Super Admin (Root)
              </button>
            </div>
          </div>

          {/* Tab Content Display */}
          <div className="max-w-5xl mx-auto">
            {activeTab === 'student' && (
              <div className="grid md:grid-cols-3 gap-6 animate-fade-in">
                
                <div className="p-6 rounded-3xl bg-[#FAFAFA] border-2 border-[#111111] shadow-[4px_4px_0px_#111111] flex flex-col justify-between">
                  <div>
                    <div className="w-12 h-12 rounded-2xl bg-[#F4C542] border-2 border-[#111111] flex items-center justify-center text-[#111111] mb-4">
                      <Brain size={24} />
                    </div>
                    <h3 className="font-heading font-black text-xl text-[#111111] mb-2">AI Therapy Companion</h3>
                    <p className="text-sm text-[#111111]/70 leading-relaxed">
                      Instant conversational CBT counseling powered by real-time streaming WebSocket intelligence. 
                      Available 24/7 during late-night exam stress or acute anxiety.
                    </p>
                  </div>
                  <div className="mt-6 pt-4 border-t border-[#111111]/10 flex items-center justify-between text-xs font-bold text-[#111111]">
                    <span>Real-time Biomarkers</span>
                    <Link to="/login" className="flex items-center gap-1 hover:text-[#F4C542]">Explore AI <ArrowRight size={14} /></Link>
                  </div>
                </div>

                <div className="p-6 rounded-3xl bg-[#FAFAFA] border-2 border-[#111111] shadow-[4px_4px_0px_#111111] flex flex-col justify-between">
                  <div>
                    <div className="w-12 h-12 rounded-2xl bg-[#F4C542] border-2 border-[#111111] flex items-center justify-center text-[#111111] mb-4">
                      <Wind size={24} />
                    </div>
                    <h3 className="font-heading font-black text-xl text-[#111111] mb-2">Calm Canopy & CBT Studio</h3>
                    <p className="text-sm text-[#111111]/70 leading-relaxed">
                      Interactive 4-7-8 breathwork, cognitive distortion reframing, binaural soundscapes, 
                      and mental fitness puzzles designed to break ruminative anxiety loops.
                    </p>
                  </div>
                  <div className="mt-6 pt-4 border-t border-[#111111]/10 flex items-center justify-between text-xs font-bold text-[#111111]">
                    <span>Interactive Audio</span>
                    <Link to="/login" className="flex items-center gap-1 hover:text-[#F4C542]">Explore Studio <ArrowRight size={14} /></Link>
                  </div>
                </div>

                <div className="p-6 rounded-3xl bg-[#FAFAFA] border-2 border-[#111111] shadow-[4px_4px_0px_#111111] flex flex-col justify-between">
                  <div>
                    <div className="w-12 h-12 rounded-2xl bg-[#F4C542] border-2 border-[#111111] flex items-center justify-center text-[#111111] mb-4">
                      <Calendar size={24} />
                    </div>
                    <h3 className="font-heading font-black text-xl text-[#111111] mb-2">Counselor Appointments</h3>
                    <p className="text-sm text-[#111111]/70 leading-relaxed">
                      Book discrete in-person or anonymous audio sessions with licensed VIT campus psychologists. 
                      Multi-state booking machine ensures seamless counselor acceptance.
                    </p>
                  </div>
                  <div className="mt-6 pt-4 border-t border-[#111111]/10 flex items-center justify-between text-xs font-bold text-[#111111]">
                    <span>7 Verified Counselors</span>
                    <Link to="/login" className="flex items-center gap-1 hover:text-[#F4C542]">Book Session <ArrowRight size={14} /></Link>
                  </div>
                </div>

              </div>
            )}

            {activeTab === 'psychologist' && (
              <div className="grid md:grid-cols-3 gap-6 animate-fade-in">
                
                <div className="p-6 rounded-3xl bg-[#FAFAFA] border-2 border-[#111111] shadow-[4px_4px_0px_#111111] flex flex-col justify-between">
                  <div>
                    <div className="w-12 h-12 rounded-2xl bg-[#F4C542] border-2 border-[#111111] flex items-center justify-center text-[#111111] mb-4">
                      <Activity size={24} />
                    </div>
                    <h3 className="font-heading font-black text-xl text-[#111111] mb-2">Real-Time Risk Radar</h3>
                    <p className="text-sm text-[#111111]/70 leading-relaxed">
                      Prioritized clinical triage queue automatically ranks student distress levels 
                      synthesizing mood check-ins, journal sentiments, and chat biomarkers.
                    </p>
                  </div>
                  <div className="mt-6 pt-4 border-t border-[#111111]/10 flex items-center justify-between text-xs font-bold text-[#111111]">
                    <span>Zero False Alarm Engine</span>
                    <Link to="/psychologist/dashboard" className="flex items-center gap-1 hover:text-[#F4C542]">Staff Triage <ArrowRight size={14} /></Link>
                  </div>
                </div>

                <div className="p-6 rounded-3xl bg-[#FAFAFA] border-2 border-[#111111] shadow-[4px_4px_0px_#111111] flex flex-col justify-between">
                  <div>
                    <div className="w-12 h-12 rounded-2xl bg-[#F4C542] border-2 border-[#111111] flex items-center justify-center text-[#111111] mb-4">
                      <FileText size={24} />
                    </div>
                    <h3 className="font-heading font-black text-xl text-[#111111] mb-2">SOAP Clinical Notes</h3>
                    <p className="text-sm text-[#111111]/70 leading-relaxed">
                      Standardized Subjective, Objective, Assessment, and Plan documentation editor. 
                      Streamlines patient continuity while maintaining strict confidentiality.
                    </p>
                  </div>
                  <div className="mt-6 pt-4 border-t border-[#111111]/10 flex items-center justify-between text-xs font-bold text-[#111111]">
                    <span>Clinical Compliance</span>
                    <Link to="/psychologist/soap-notes" className="flex items-center gap-1 hover:text-[#F4C542]">SOAP Editor <ArrowRight size={14} /></Link>
                  </div>
                </div>

                <div className="p-6 rounded-3xl bg-[#FAFAFA] border-2 border-[#111111] shadow-[4px_4px_0px_#111111] flex flex-col justify-between">
                  <div>
                    <div className="w-12 h-12 rounded-2xl bg-[#F4C542] border-2 border-[#111111] flex items-center justify-center text-[#111111] mb-4">
                      <Shield size={24} />
                    </div>
                    <h3 className="font-heading font-black text-xl text-[#111111] mb-2">Emergency Identity Reveal</h3>
                    <p className="text-sm text-[#111111]/70 leading-relaxed">
                      Cryptographically enforced multi-party protocol that decrypts student contact info 
                      only during verified life-threatening crises with permanent audit trail.
                    </p>
                  </div>
                  <div className="mt-6 pt-4 border-t border-[#111111]/10 flex items-center justify-between text-xs font-bold text-[#111111]">
                    <span>Multi-Key Protocol</span>
                    <Link to="/psychologist/dashboard" className="flex items-center gap-1 hover:text-[#F4C542]">Clinical Radar <ArrowRight size={14} /></Link>
                  </div>
                </div>

              </div>
            )}

            {activeTab === 'admin' && (
              <div className="grid md:grid-cols-3 gap-6 animate-fade-in">
                
                <div className="p-6 rounded-3xl bg-[#FAFAFA] border-2 border-[#111111] shadow-[4px_4px_0px_#111111] flex flex-col justify-between">
                  <div>
                    <div className="w-12 h-12 rounded-2xl bg-[#F4C542] border-2 border-[#111111] flex items-center justify-center text-[#111111] mb-4">
                      <BarChart3 size={24} />
                    </div>
                    <h3 className="font-heading font-black text-xl text-[#111111] mb-2">Department Heatmaps</h3>
                    <p className="text-sm text-[#111111]/70 leading-relaxed">
                      Real-time macro analytics across academic departments (CSE, AI&DS, ECE, MECH, CIVIL) 
                      detecting exam burnout clusters before failure occurs.
                    </p>
                  </div>
                  <div className="mt-6 pt-4 border-t border-[#111111]/10 flex items-center justify-between text-xs font-bold text-[#111111]">
                    <span>Institutional Oversight</span>
                    <Link to="/admin/dashboard" className="flex items-center gap-1 hover:text-[#F4C542]">Admin Suite <ArrowRight size={14} /></Link>
                  </div>
                </div>

                <div className="p-6 rounded-3xl bg-[#FAFAFA] border-2 border-[#111111] shadow-[4px_4px_0px_#111111] flex flex-col justify-between">
                  <div>
                    <div className="w-12 h-12 rounded-2xl bg-[#F4C542] border-2 border-[#111111] flex items-center justify-center text-[#111111] mb-4">
                      <Users size={24} />
                    </div>
                    <h3 className="font-heading font-black text-xl text-[#111111] mb-2">Counselor Management</h3>
                    <p className="text-sm text-[#111111]/70 leading-relaxed">
                      Onboard, manage, and verify campus psychologists and visiting counselors. 
                      Assign clinical specialties, set office hours, and review capacity.
                    </p>
                  </div>
                  <div className="mt-6 pt-4 border-t border-[#111111]/10 flex items-center justify-between text-xs font-bold text-[#111111]">
                    <span>Staff Rostering</span>
                    <Link to="/admin/users" className="flex items-center gap-1 hover:text-[#F4C542]">Manage Staff <ArrowRight size={14} /></Link>
                  </div>
                </div>

                <div className="p-6 rounded-3xl bg-[#FAFAFA] border-2 border-[#111111] shadow-[4px_4px_0px_#111111] flex flex-col justify-between">
                  <div>
                    <div className="w-12 h-12 rounded-2xl bg-[#F4C542] border-2 border-[#111111] flex items-center justify-center text-[#111111] mb-4">
                      <Download size={24} />
                    </div>
                    <h3 className="font-heading font-black text-xl text-[#111111] mb-2">Exportable Audit Reports</h3>
                    <p className="text-sm text-[#111111]/70 leading-relaxed">
                      Generate official institutional wellbeing summaries in CSV and JSON formats 
                      for academic accreditation (NAAC / NBA) and student welfare boards.
                    </p>
                  </div>
                  <div className="mt-6 pt-4 border-t border-[#111111]/10 flex items-center justify-between text-xs font-bold text-[#111111]">
                    <span>Accreditation Ready</span>
                    <Link to="/admin/reports" className="flex items-center gap-1 hover:text-[#F4C542]">Generate Reports <ArrowRight size={14} /></Link>
                  </div>
                </div>

              </div>
            )}

            {activeTab === 'super_admin' && (
              <div className="grid md:grid-cols-3 gap-6 animate-fade-in">
                
                <div className="p-6 rounded-3xl bg-[#FFFFFF] border-2 border-[#111111] shadow-[4px_4px_0px_#111111] flex flex-col justify-between">
                  <div>
                    <div className="w-12 h-12 rounded-2xl bg-[#F4C542] border-2 border-[#111111] flex items-center justify-center text-[#111111] mb-4">
                      <Building2 size={24} />
                    </div>
                    <h3 className="font-heading font-black text-xl text-[#111111] mb-2">Multi-Campus Provisioning</h3>
                    <p className="text-sm text-[#111111]/70 leading-relaxed">
                      Centralized deployment engine managing 7 Sri Vishnu Educational Society campuses 
                      (VIT, BVRITH, SVECW, VDC, SVCP, SBSP, BVRC) with one-click institution onboarding.
                    </p>
                  </div>
                  <div className="mt-6 pt-4 border-t border-[#111111]/10 flex items-center justify-between text-xs font-bold text-[#111111]">
                    <span>Society Governance</span>
                    <Link to="/superadmin/dashboard" className="flex items-center gap-1 hover:text-[#F4C542]">Campus Console <ArrowRight size={14} /></Link>
                  </div>
                </div>

                <div className="p-6 rounded-3xl bg-[#FFFFFF] border-2 border-[#111111] shadow-[4px_4px_0px_#111111] flex flex-col justify-between">
                  <div>
                    <div className="w-12 h-12 rounded-2xl bg-[#F4C542] border-2 border-[#111111] flex items-center justify-center text-[#111111] mb-4">
                      <FileText size={24} />
                    </div>
                    <h3 className="font-heading font-black text-xl text-[#111111] mb-2">Attachment 5 Society Reports</h3>
                    <p className="text-sm text-[#111111]/70 leading-relaxed">
                      Generate official society-level consolidated reports aggregating clinical intake across all 
                      counselors, crisis SOS interventions, and monthly student satisfaction ratings.
                    </p>
                  </div>
                  <div className="mt-6 pt-4 border-t border-[#111111]/10 flex items-center justify-between text-xs font-bold text-[#111111]">
                    <span>Vector PDF Export</span>
                    <Link to="/superadmin/dashboard" className="flex items-center gap-1 hover:text-[#F4C542]">Central Repository <ArrowRight size={14} /></Link>
                  </div>
                </div>

                <div className="p-6 rounded-3xl bg-[#FFFFFF] border-2 border-[#111111] shadow-[4px_4px_0px_#111111] flex flex-col justify-between">
                  <div>
                    <div className="w-12 h-12 rounded-2xl bg-[#F4C542] border-2 border-[#111111] flex items-center justify-center text-[#111111] mb-4">
                      <Shield size={24} />
                    </div>
                    <h3 className="font-heading font-black text-xl text-[#111111] mb-2">AI Sentinel &amp; Root Guard</h3>
                    <p className="text-sm text-[#111111]/70 leading-relaxed">
                      Configure clinical reasoning engines (Google Gemini, OpenAI GPT-4o, Air-Gapped Local), 
                      set society-wide SOS escalation thresholds, and review cryptographic access audits.
                    </p>
                  </div>
                  <div className="mt-6 pt-4 border-t border-[#111111]/10 flex items-center justify-between text-xs font-bold text-[#111111]">
                    <span>Root RBAC Control</span>
                    <Link to="/superadmin/dashboard" className="flex items-center gap-1 hover:text-[#F4C542]">Configure AI &amp; RBAC <ArrowRight size={14} /></Link>
                  </div>
                </div>

              </div>
            )}
          </div>

        </div>
      </section>

      {/* ── Official Counselors & Psychologists Showcase ── */}
      <section id="counselors" className="py-20 lg:py-28 bg-[#FFFFFF] border-b border-[#111111]/10">
        <div className="container mx-auto px-4 lg:px-8">
          
          <div className="max-w-3xl mx-auto text-center mb-16">
            <div className="inline-flex items-center gap-2.5 bg-[#FAFAFA] border-2 border-[#111111] px-4 py-1.5 rounded-full shadow-xs mb-4">
              <img 
                src={VISHNU_WELLNESS_CENTRE.logo_url} 
                alt="Vishnu Wellness Centre Logo" 
                className="w-5 h-5 rounded-full object-cover"
                onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
              />
              <span className="text-xs font-mono font-bold tracking-tight text-[#111111] uppercase">
                {VISHNU_WELLNESS_CENTRE.name} • {VISHNU_WELLNESS_CENTRE.tagline}
              </span>
            </div>

            <h2 className="font-heading font-black text-3xl sm:text-5xl text-[#111111] tracking-tight mb-4">
              Meet Our Certified Campus Counselors
            </h2>
            <p className="text-base text-[#111111]/70 max-w-2xl mx-auto">
              Dedicated, compassionate, and experienced mental health professionals assigned across Sri Vishnu Educational Society campuses to support every student.
            </p>
          </div>

          {/* Counselor Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {OFFICIAL_COUNSELORS.map((counselor) => (
              <CounselorFlashcard
                key={counselor.id}
                counselor={counselor}
                onSelectBooking={() => navigate('/login')}
                onViewBio={(c) => setSelectedCounselor(c)}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ── Interactive Quick Calm Breathwork Section ── */}
      <section id="breathwork" className="py-20 bg-[#FAFAFA] border-b border-[#111111]/10">
        <div className="container mx-auto px-4 lg:px-8">
          
          <div className="max-w-2xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-[#F4C542] text-[#111111] text-xs font-mono font-bold px-3 py-1 rounded-full border border-[#111111] mb-4">
              <Wind size={14} />
              <span>INSTANT RELIEF • 4-7-8 METHOD</span>
            </div>
            
            <h2 className="font-heading font-black text-3xl sm:text-4xl text-[#111111] tracking-tight mb-3">
              Take a 60-second breathing pause.
            </h2>
            <p className="text-sm text-[#111111]/70 mb-10">
              Inhale peace for 4s, hold clarity for 7s, and exhale tension for 8s. Scientifically proven to slow heart rate.
            </p>

            {/* Breathing Visualizer */}
            <div className="relative w-64 h-64 mx-auto flex items-center justify-center mb-8">
              
              {/* Outer Pulsing Ring */}
              <div 
                className={`absolute inset-0 rounded-full border-4 border-[#F4C542] transition-all duration-1000 ${
                  isBreathing && breathPhase === 'Inhale' 
                    ? 'scale-110 opacity-100' 
                    : isBreathing && breathPhase === 'Hold' 
                    ? 'scale-105 opacity-80' 
                    : 'scale-90 opacity-40'
                }`}
              />

              {/* Core Circle */}
              <div 
                className={`w-48 h-48 rounded-full bg-[#111111] border-4 border-[#111111] text-[#FFFFFF] flex flex-col items-center justify-center transition-all duration-1000 shadow-xl ${
                  isBreathing && breathPhase === 'Inhale' 
                    ? 'scale-105 bg-[#111111]' 
                    : isBreathing && breathPhase === 'Exhale' 
                    ? 'scale-95 bg-[#1a1a1a]' 
                    : 'scale-100 bg-[#111111]'
                }`}
              >
                {isBreathing ? (
                  <>
                    <span className="text-xs font-mono font-bold uppercase tracking-widest text-[#F4C542] mb-1">
                      {breathPhase}
                    </span>
                    <span className="font-heading font-black text-5xl">
                      {breathTimer}s
                    </span>
                  </>
                ) : (
                  <>
                    <Wind size={36} className="text-[#F4C542] mb-2" />
                    <span className="font-heading font-bold text-sm">Ready to Relax</span>
                  </>
                )}
              </div>

            </div>

            {/* Button Controls */}
            <button
              onClick={() => {
                setIsBreathing(!isBreathing);
                setBreathPhase('Inhale');
                setBreathTimer(4);
              }}
              className="bg-[#111111] text-[#FFFFFF] font-bold text-sm px-6 py-3 rounded-2xl border-2 border-[#111111] hover:bg-[#F4C542] hover:text-[#111111] transition-all inline-flex items-center gap-2 shadow-[3px_3px_0px_#111111]"
            >
              {isBreathing ? <Pause size={16} /> : <Play size={16} />}
              <span>{isBreathing ? 'Pause Breathing' : 'Start 4-7-8 Breathwork'}</span>
            </button>

          </div>

        </div>
      </section>

      {/* ── Download APK & Multi-Platform Section ── */}
      <section id="download" className="py-20 lg:py-28 bg-[#FFFFFF] border-b border-[#111111]/10">
        <div className="container mx-auto px-4 lg:px-8">
          
          <div className="max-w-5xl mx-auto bg-[#111111] text-[#FFFFFF] rounded-3xl p-8 sm:p-14 border-2 border-[#111111] shadow-[8px_8px_0px_#F4C542]">
            <div className="grid md:grid-cols-2 gap-10 items-center">
              
              <div>
                <div className="inline-flex items-center gap-2 bg-[#F4C542] text-[#111111] text-xs font-mono font-black px-3 py-1 rounded-full mb-4">
                  <Smartphone size={14} />
                  <span>ANDROID APK RELEASE • v1.7</span>
                </div>
                
                <h2 className="font-heading font-black text-3xl sm:text-4xl text-[#FFFFFF] tracking-tight mb-4">
                  Carry MindBridge in Your Pocket.
                </h2>
                
                <p className="text-sm text-[#FFFFFF]/75 leading-relaxed mb-6">
                  Install the official Android application built specifically for Vishnu Institute of Technology. 
                  Enjoy ultra-fast biometric app entry, offline audio breathwork, and instant background crisis triage.
                </p>

                <div className="space-y-3 mb-8 text-xs font-mono text-[#FFFFFF]/80">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-[#F4C542]" />
                    <span>Package: <strong className="text-[#FFFFFF]">MindBridge-VIT-v1.7.apk</strong> (~45 MB)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-[#F4C542]" />
                    <span>Android 8.0 (Oreo) to Android 15+ Compatible</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-[#F4C542]" />
                    <span>Zero Adware • Zero Trackers • Direct Institutional Build</span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-4">
                  <a
                    href="/MindBridge-VIT-v1.7.apk"
                    download="MindBridge-VIT-v1.7.apk"
                    className="bg-[#F4C542] text-[#111111] font-black text-sm px-6 py-3.5 rounded-xl hover:bg-[#FFFFFF] transition-all inline-flex items-center gap-2"
                  >
                    <Download size={18} />
                    <span>Download APK Directly</span>
                  </a>
                  
                  <Link
                    to="/login"
                    className="bg-[#FFFFFF]/10 text-[#FFFFFF] font-bold text-sm px-5 py-3.5 rounded-xl hover:bg-[#FFFFFF]/20 transition-all inline-flex items-center gap-2"
                  >
                    <Monitor size={18} />
                    <span>Use Web Version Instead</span>
                  </Link>
                </div>
              </div>

              {/* QR Code / Phone Graphic Preview */}
              <div className="flex flex-col items-center justify-center p-8 bg-[#FFFFFF]/5 rounded-2xl border border-[#FFFFFF]/10 text-center">
                <div className="w-44 h-44 bg-[#FFFFFF] p-3 rounded-2xl border-2 border-[#F4C542] mb-4 flex items-center justify-center shadow-lg">
                  {/* Visual QR Simulator */}
                  <div className="w-full h-full flex flex-col items-center justify-center border-2 border-dashed border-[#111111] rounded-xl p-2 bg-[#FAFAFA]">
                    <Smartphone size={40} className="text-[#111111] mb-2" />
                    <span className="text-[10px] font-mono font-bold text-[#111111] leading-tight">
                      SCAN TO INSTALL ON PHONE
                    </span>
                    <span className="text-[9px] font-mono text-[#111111]/60 mt-1">
                      v1.7 Android Build
                    </span>
                  </div>
                </div>
                <div className="text-xs font-mono text-[#F4C542] font-bold">
                  Direct Campus Download
                </div>
                <div className="text-[11px] text-[#FFFFFF]/60 mt-1 max-w-xs">
                  Scan with your phone camera to download the APK directly over campus Wi-Fi.
                </div>
              </div>

            </div>
          </div>

        </div>
      </section>

      {/* ── Campus Emergency Crisis Helplines ── */}
      <section id="helplines" className="py-16 bg-[#FAFAFA] border-b border-[#111111]/10">
        <div className="container mx-auto px-4 lg:px-8">
          
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-[#EF4444] text-[#FFFFFF] flex items-center justify-center font-bold">
                <AlertTriangle size={20} />
              </div>
              <div>
                <h3 className="font-heading font-black text-xl text-[#111111]">
                  Emergency Contacts & Campus Helplines
                </h3>
                <p className="text-xs text-[#111111]/70">
                  If you or someone you know is in acute danger or distress, reach out immediately.
                </p>
              </div>
            </div>

            <div className="grid sm:grid-cols-3 gap-4">
              
              <div className="p-4 rounded-2xl bg-[#FFFFFF] border-2 border-[#111111] shadow-xs">
                <div className="text-[10px] font-mono font-bold uppercase text-[#111111]/60">National Helpline</div>
                <div className="font-heading font-black text-lg text-[#111111] mt-0.5">Tele-MANAS</div>
                <div className="text-xs text-[#111111]/70 mt-1">Government 24/7 Mental Health Care</div>
                <a 
                  href="tel:14416"
                  className="mt-3 inline-flex items-center gap-1.5 text-xs font-black text-[#111111] bg-[#F4C542] px-3 py-1.5 rounded-lg border border-[#111111]"
                >
                  <PhoneCall size={12} /> Dial 14416 (Toll-Free)
                </a>
              </div>

              <div className="p-4 rounded-2xl bg-[#FFFFFF] border-2 border-[#111111] shadow-xs">
                <div className="text-[10px] font-mono font-bold uppercase text-[#111111]/60">VIT Campus Health</div>
                <div className="font-heading font-black text-lg text-[#111111] mt-0.5">Medical Centre</div>
                <div className="text-xs text-[#111111]/70 mt-1">On-campus doctor & nurse station</div>
                <a 
                  href="tel:08816250815"
                  className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-[#111111] bg-[#FAFAFA] px-3 py-1.5 rounded-lg border border-[#111111]/20 hover:bg-[#111111] hover:text-[#FFFFFF] transition-colors"
                >
                  <PhoneCall size={12} /> 08816-250815
                </a>
              </div>

              <div className="p-4 rounded-2xl bg-[#FFFFFF] border-2 border-[#111111] shadow-xs">
                <div className="text-[10px] font-mono font-bold uppercase text-[#111111]/60">SVES Security</div>
                <div className="font-heading font-black text-lg text-[#111111] mt-0.5">Campus Ambulance</div>
                <div className="text-xs text-[#111111]/70 mt-1">24/7 Main Gate & Rapid Response</div>
                <a 
                  href="tel:08816250800"
                  className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-[#111111] bg-[#FAFAFA] px-3 py-1.5 rounded-lg border border-[#111111]/20 hover:bg-[#111111] hover:text-[#FFFFFF] transition-colors"
                >
                  <PhoneCall size={12} /> 08816-250800
                </a>
              </div>

            </div>
          </div>

        </div>
      </section>

      {/* ── Institutional Footer ── */}
      <footer className="bg-[#111111] text-[#FFFFFF] py-14">
        <div className="container mx-auto px-4 lg:px-8">
          
          <div className="grid md:grid-cols-4 gap-8 mb-12">
            
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-xl bg-[#F4C542] border border-[#FFFFFF] flex items-center justify-center font-heading font-black text-[#111111]">
                  MB
                </div>
                <span className="font-heading font-black text-xl text-[#FFFFFF]">MindBridge AI</span>
              </div>
              <p className="text-xs text-[#FFFFFF]/70 max-w-sm leading-relaxed mb-4">
                Institutional Anonymous Mental Health & Psychological Triage Ecosystem for Vishnu Institute of Technology (VIT), 
                Shri Vishnu Educational Society (SVES), Bhimavaram, Andhra Pradesh.
              </p>
              <div className="text-[11px] font-mono text-[#F4C542]">
                Verified Production Build v1.7.0 • Render Cloud API
              </div>
            </div>

            <div>
              <div className="font-heading font-bold text-sm text-[#FFFFFF] mb-3">Campus Portals</div>
              <ul className="space-y-2 text-xs text-[#FFFFFF]/70">
                <li><Link to="/login" className="hover:text-[#F4C542] transition-colors">Student Sanctuary</Link></li>
                <li><Link to="/login" className="hover:text-[#F4C542] transition-colors">Psychologist Clinical Radar</Link></li>
                <li><Link to="/login" className="hover:text-[#F4C542] transition-colors">Executive Administration</Link></li>
                <li><Link to="/register" className="hover:text-[#F4C542] transition-colors">Register Anonymous Account</Link></li>
                <li><a href="/MindBridge-VIT-v1.7.apk" className="hover:text-[#F4C542] transition-colors">Download Android APK</a></li>
              </ul>
            </div>

            <div>
              <div className="font-heading font-bold text-sm text-[#FFFFFF] mb-3">Legal & Confidentiality</div>
              <ul className="space-y-2 text-xs text-[#FFFFFF]/70">
                <li><span>Zero-PII Storage Policy</span></li>
                <li><span>AES-256 Offline Key Vault</span></li>
                <li><span>UGC Campus Mental Health Guidelines</span></li>
                <li><span>SVES Student Welfare Council</span></li>
              </ul>
            </div>

          </div>

          <div className="pt-8 border-t border-[#FFFFFF]/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-[#FFFFFF]/50">
            <div>
              © 2026 Vishnu Institute of Technology (VIT). All rights reserved.
            </div>
            <div>
              Designed & Engineered for Student Wellbeing
            </div>
          </div>

        </div>
      </footer>

      {/* ── Counselor Profile Modal ── */}
      {selectedCounselor && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#111111]/70 backdrop-blur-xs animate-fade-in"
          onClick={() => setSelectedCounselor(null)}
        >
          <div 
            className="bg-[#FFFFFF] border-2 border-[#111111] rounded-3xl max-w-xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 shadow-[8px_8px_0px_#111111] relative animate-scale-up"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedCounselor(null)}
              className="absolute top-5 right-5 w-8 h-8 rounded-full border border-[#111111]/20 flex items-center justify-center text-[#111111] hover:bg-[#111111] hover:text-[#FFFFFF] transition-colors cursor-pointer"
            >
              ✕
            </button>

            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 mb-6 text-center sm:text-left">
              <img 
                src={selectedCounselor.full_photo_url || selectedCounselor.avatar_url} 
                alt={selectedCounselor.name} 
                className="w-24 h-32 object-cover rounded-2xl border-2 border-[#111111] shadow-xs bg-[#FAFAFA]"
                onError={(e) => { (e.target as HTMLImageElement).src = selectedCounselor.avatar_url; }}
              />
              <div className="space-y-1 flex-1">
                <div className="flex flex-wrap items-center gap-1.5 justify-center sm:justify-start">
                  <span className="text-[10px] font-mono font-bold bg-[#F4C542] text-[#111111] px-2.5 py-0.5 rounded-full border border-[#111111]">
                    {selectedCounselor.institution}
                  </span>
                  {selectedCounselor.crn && (
                    <span className="text-[10px] font-mono font-bold bg-[#111111] text-[#FFFFFF] px-2 py-0.5 rounded-md">
                      {selectedCounselor.crn}
                    </span>
                  )}
                </div>
                <h3 className="font-heading font-black text-2xl text-[#111111]">
                  {selectedCounselor.name}
                </h3>
                <p className="text-xs font-bold text-[#111111]/70">
                  {selectedCounselor.specialization}
                </p>
                {selectedCounselor.education && (
                  <p className="text-xs font-mono text-[#111111]/80 bg-[#FAFAFA] p-1.5 rounded-lg border border-[#111111]/10">
                    🎓 <strong>Qualifications:</strong> {selectedCounselor.education}
                  </p>
                )}
                <div className="text-xs font-mono text-[#111111]/60 pt-1">
                  ⭐ {selectedCounselor.experience} Experience • 🗣️ {selectedCounselor.languages}
                </div>
              </div>
            </div>

            {selectedCounselor.summary && (
              <div className="mb-5 p-4 rounded-2xl bg-[#FAFAFA] border border-[#111111]/10 space-y-1">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#111111]">
                  Professional Summary
                </h4>
                <p className="text-xs sm:text-sm text-[#111111]/85 leading-relaxed">
                  {selectedCounselor.summary}
                </p>
              </div>
            )}

            {selectedCounselor.focus_areas && selectedCounselor.focus_areas.length > 0 && (
              <div className="mb-5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#111111] mb-2">
                  Areas of Expertise & Focus
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {selectedCounselor.focus_areas.map((area, idx) => (
                    <span key={idx} className="text-xs font-medium bg-[#FFFFFF] border border-[#111111]/20 px-2.5 py-1 rounded-xl text-[#111111]">
                      {area}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {selectedCounselor.quote && (
              <div className="mb-6 p-4 rounded-2xl bg-[#F4C542]/10 border border-[#F4C542]/30 text-xs italic font-serif text-[#111111] text-center">
                “{selectedCounselor.quote.replace('♡', '').trim()} ♡”
              </div>
            )}

            <div className="flex items-center gap-3 pt-4 border-t border-[#111111]/10">
              <button
                onClick={() => setSelectedCounselor(null)}
                className="flex-1 py-3 rounded-xl border border-[#111111] text-[#111111] font-bold text-xs hover:bg-[#FAFAFA] transition-colors cursor-pointer"
              >
                Close
              </button>
              <Link
                to="/login"
                className="flex-1 py-3 rounded-xl bg-[#F4C542] text-[#111111] font-black text-xs border border-[#111111] hover:bg-[#e0b435] transition-colors shadow-xs flex items-center justify-center gap-1.5"
              >
                <span>Book Session with {selectedCounselor.name.split(' ')[0]}</span>
                <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
