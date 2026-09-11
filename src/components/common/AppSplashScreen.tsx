import React, { useState, useEffect } from 'react';

interface AppSplashScreenProps {
  onComplete: () => void;
  durationMs?: number;
}

export const AppSplashScreen: React.FC<AppSplashScreenProps> = ({ 
  onComplete, 
  durationMs = 1900 
}) => {
  const [stage, setStage] = useState<number>(0);
  const [isExiting, setIsExiting] = useState<boolean>(false);

  useEffect(() => {
    // Stage 1 (200ms): Emblem reveals with gentle scale & fade
    const t1 = setTimeout(() => setStage(1), 200);
    // Stage 2 (650ms): Brand typography reveals
    const t2 = setTimeout(() => setStage(2), 650);
    // Stage 3 (1050ms): Tagline and wellness lotus reveal
    const t3 = setTimeout(() => setStage(3), 1050);
    // Stage 4 (1500ms): Complete logo stabilizes
    const t4 = setTimeout(() => setStage(4), 1500);
    // Exit transition starts 350ms before duration
    const tExit = setTimeout(() => setIsExiting(true), durationMs - 350);
    // Completion
    const tDone = setTimeout(() => onComplete(), durationMs);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
      clearTimeout(tExit);
      clearTimeout(tDone);
    };
  }, [durationMs, onComplete]);

  return (
    <div 
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-white select-none transition-opacity duration-350 ease-out overflow-hidden ${
        isExiting ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
      style={{
        paddingTop: 'env(safe-area-inset-top, 0px)',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
    >
      {/* ── Top-Left Subtle Wellness Curves (Teal & Blue) ── */}
      <div 
        className="absolute -top-16 -left-16 w-64 h-64 rounded-full pointer-events-none transition-opacity duration-1000"
        style={{
          background: 'radial-gradient(circle, rgba(56, 189, 248, 0.22) 0%, rgba(14, 165, 233, 0.08) 50%, transparent 75%)',
          filter: 'blur(32px)',
          opacity: stage >= 1 ? 1 : 0
        }}
      />
      <div 
        className="absolute -top-24 -left-8 w-48 h-48 rounded-full pointer-events-none transition-opacity duration-1000"
        style={{
          background: 'radial-gradient(circle, rgba(20, 184, 166, 0.18) 0%, transparent 70%)',
          filter: 'blur(28px)',
          opacity: stage >= 1 ? 1 : 0
        }}
      />

      {/* ── Bottom-Right Subtle Wellness Curves (Yellow & Cyan) ── */}
      <div 
        className="absolute -bottom-16 -right-16 w-72 h-72 rounded-full pointer-events-none transition-opacity duration-1000"
        style={{
          background: 'radial-gradient(circle, rgba(245, 158, 11, 0.16) 0%, rgba(251, 191, 36, 0.08) 45%, transparent 70%)',
          filter: 'blur(36px)',
          opacity: stage >= 2 ? 1 : 0
        }}
      />
      <div 
        className="absolute -bottom-10 -right-6 w-52 h-52 rounded-full pointer-events-none transition-opacity duration-1000"
        style={{
          background: 'radial-gradient(circle, rgba(6, 182, 212, 0.15) 0%, transparent 70%)',
          filter: 'blur(30px)',
          opacity: stage >= 2 ? 1 : 0
        }}
      />

      {/* ── Main Brand Presentation ── */}
      <div className="relative z-10 flex flex-col items-center justify-center text-center px-6 max-w-sm">
        
        {/* Vishnu Wellness Centre Emblem */}
        <div 
          className="relative transition-all duration-700 ease-out"
          style={{
            opacity: stage >= 1 ? 1 : 0,
            transform: stage >= 1 ? 'scale(1) translateY(0)' : 'scale(0.88) translateY(12px)',
          }}
        >
          <img 
            src="/vishnu_wellness_logo.png" 
            alt="Vishnu Wellness Centre" 
            className="w-56 sm:w-64 max-h-56 object-contain drop-shadow-sm"
          />
        </div>

        {/* MindBridge AI Sub-Identity Badge */}
        <div 
          className="mt-6 flex flex-col items-center transition-all duration-600 delay-100 ease-out"
          style={{
            opacity: stage >= 3 ? 1 : 0,
            transform: stage >= 3 ? 'translateY(0)' : 'translateY(8px)',
          }}
        >
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-50 border border-slate-200/80 shadow-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[11px] font-semibold text-slate-800 tracking-wide uppercase">
              MindBridge AI · VIT
            </span>
          </div>

          <p className="mt-2 text-[11px] font-medium text-slate-400 tracking-wider uppercase">
            Private · Anonymous · 24/7 Wellness
          </p>
        </div>

        {/* Clean Subtle Loading Line */}
        <div className="w-28 h-1 bg-slate-100 rounded-full mt-7 overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-blue-600 via-teal-500 to-amber-500 rounded-full transition-all duration-1200 ease-out"
            style={{
              width: stage === 0 ? '0%' : stage === 1 ? '35%' : stage === 2 ? '70%' : '100%'
            }}
          />
        </div>

      </div>
    </div>
  );
};
