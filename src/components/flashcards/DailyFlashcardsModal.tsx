import React, { useState, useEffect } from 'react';
import { X, RotateCw, ArrowRight, CheckCircle2, Sparkles, Trophy, ChevronLeft, ChevronRight } from 'lucide-react';
import { 
  getTodayFlashcards, 
  markTodayFlashcardsCompleted, 
  isTodayFlashcardsCompleted,
  type Flashcard 
} from '../../data/defaultFlashcards';

interface DailyFlashcardsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCompleted?: () => void;
}

export default function DailyFlashcardsModal({ isOpen, onClose, onCompleted }: DailyFlashcardsModalProps) {
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [alreadyCompletedToday, setAlreadyCompletedToday] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const todayCards = getTodayFlashcards();
      setCards(todayCards);
      setCurrentIndex(0);
      setIsFlipped(false);
      const isDone = isTodayFlashcardsCompleted();
      setAlreadyCompletedToday(isDone);
      setCompleted(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const currentCard = cards[currentIndex] || cards[0];
  const totalCards = cards.length || 5;

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const handleNext = () => {
    setIsFlipped(false);
    if (currentIndex < totalCards - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      // Completed all 5 cards
      markTodayFlashcardsCompleted();
      setCompleted(true);
      if (onCompleted) onCompleted();
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setIsFlipped(false);
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    setIsFlipped(false);
    setCompleted(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#111111]/80 backdrop-blur-sm animate-fade-in font-sans">
      <div className="w-full max-w-md bg-[#FFFFFF] text-[#111111] rounded-3xl border-2 border-[#111111] shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* ── HEADER ── */}
        <div className="px-6 py-4 border-b border-[#111111]/10 flex items-center justify-between bg-[#FFFFFF]">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#F4C542] border border-[#111111]" />
            <h3 className="text-sm font-black uppercase tracking-wider text-[#111111]">
              Daily Wellness Deck
            </h3>
          </div>
          
          <div className="flex items-center gap-2">
            {!completed && (
              <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-full bg-[#111111]/5 border border-[#111111]/10 text-[#111111]">
                {String(currentIndex + 1).padStart(2, '0')} / {String(totalCards).padStart(2, '0')}
              </span>
            )}
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full border border-[#111111]/20 flex items-center justify-center text-[#111111] hover:bg-[#111111]/5 transition-colors"
              aria-label="Close"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* ── PROGRESS BAR ── */}
        {!completed && (
          <div className="w-full bg-[#111111]/10 h-1.5 overflow-hidden">
            <div 
              className="bg-[#F4C542] h-full transition-all duration-300"
              style={{ width: `${((currentIndex + 1) / totalCards) * 100}%` }}
            />
          </div>
        )}

        {/* ── BODY ── */}
        <div className="p-6 flex-1 flex flex-col justify-between overflow-y-auto">
          {completed ? (
            /* ── COMPLETION SCREEN ── */
            <div className="py-8 flex flex-col items-center text-center space-y-6 animate-scale-up">
              <div className="w-20 h-20 rounded-full bg-[#F4C542] border-2 border-[#111111] flex items-center justify-center shadow-lg">
                <Trophy size={40} className="text-[#111111]" />
              </div>

              <div className="space-y-2">
                <span className="text-xs uppercase font-bold tracking-widest text-[#111111]/60">
                  Daily Checkpoint
                </span>
                <h2 className="text-2xl font-black text-[#111111]">
                  Today's 5 cards completed! 🎉
                </h2>
                <p className="text-sm text-[#111111]/70 max-w-xs mx-auto">
                  You've absorbed today's essential wellness insights in less than 2 minutes.
                </p>
              </div>

              {/* Status summary pill */}
              <div className="p-4 rounded-2xl border border-[#111111]/10 bg-[#111111]/[0.02] w-full max-w-xs text-left space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#111111]/60 font-medium">Daily Streak:</span>
                  <span className="font-bold text-[#111111] flex items-center gap-1">
                    <span className="text-[#F4C542]">●</span> +1 Day Extended
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#111111]/60 font-medium">Insights Reviewed:</span>
                  <span className="font-bold text-[#111111]">5 / 5 Topics</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#111111]/60 font-medium">Next Deck:</span>
                  <span className="font-bold text-[#111111]">Tomorrow 06:00 AM</span>
                </div>
              </div>

              <div className="w-full space-y-2 pt-2">
                <button
                  onClick={onClose}
                  className="w-full py-3.5 px-4 rounded-xl bg-[#F4C542] hover:bg-[#e0b435] text-[#111111] font-black text-sm tracking-wide border-2 border-[#111111] transition-all shadow-md active:scale-98"
                >
                  Done for Today
                </button>
                <button
                  onClick={handleRestart}
                  className="w-full py-2.5 text-xs font-bold text-[#111111]/70 hover:text-[#111111] transition-colors"
                >
                  Review Today's Cards Again
                </button>
              </div>
            </div>
          ) : (
            /* ── INTERACTIVE 3D FLIP CARD ── */
            <div className="flex flex-col flex-1 justify-between space-y-6">
              
              {/* Category & Source Metadata */}
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-[#111111] text-[#FFFFFF]">
                  {currentCard?.category || 'Wellness Insight'}
                </span>

                {currentCard?.source === 'COUNSELLOR' ? (
                  <span className="text-xs font-bold px-3 py-1 rounded-full bg-[#F4C542] text-[#111111] border border-[#111111] flex items-center gap-1.5">
                    <span>👩‍⚕️</span>
                    <span>Counsellor's Tip</span>
                  </span>
                ) : (
                  <span className="text-xs font-bold px-3 py-1 rounded-full bg-[#111111]/5 text-[#111111] border border-[#111111]/15 flex items-center gap-1.5">
                    <span>🤖</span>
                    <span>AI Wellness Card</span>
                  </span>
                )}
              </div>

              {/* 3D Flip Card Container */}
              <div 
                className="relative w-full min-h-[260px] sm:min-h-[290px] cursor-pointer select-none"
                style={{ perspective: '1000px' }}
                onClick={handleFlip}
              >
                <div 
                  className="relative w-full h-full duration-500 transition-transform rounded-2xl"
                  style={{ 
                    transformStyle: 'preserve-3d',
                    transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)'
                  }}
                >
                  {/* FRONT SIDE (Question / Prompt) */}
                  <div 
                    className="absolute inset-0 w-full h-full p-6 sm:p-7 rounded-2xl border-2 border-[#111111] bg-[#FFFFFF] flex flex-col justify-between shadow-lg"
                    style={{ 
                      backfaceVisibility: 'hidden',
                      WebkitBackfaceVisibility: 'hidden'
                    }}
                  >
                    <div>
                      <span className="text-[11px] uppercase font-black tracking-wider text-[#111111]/40 block mb-2">
                        Question & Reflection
                      </span>
                      <h4 className="text-lg sm:text-xl font-black text-[#111111] leading-snug">
                        {currentCard?.front_content}
                      </h4>
                    </div>

                    <div className="pt-4 flex items-center justify-between border-t border-[#111111]/10">
                      <span className="text-xs font-semibold text-[#111111]/50 flex items-center gap-1.5">
                        <RotateCw size={13} />
                        <span>Tap card to see answer</span>
                      </span>
                      <span className="w-8 h-8 rounded-full bg-[#F4C542] border border-[#111111] flex items-center justify-center text-[#111111] font-bold text-xs">
                        ?
                      </span>
                    </div>
                  </div>

                  {/* BACK SIDE (Actionable Wisdom / Solution) */}
                  <div 
                    className="absolute inset-0 w-full h-full p-6 sm:p-7 rounded-2xl border-2 border-[#111111] bg-[#FFFFFF] flex flex-col justify-between shadow-lg"
                    style={{ 
                      backfaceVisibility: 'hidden',
                      WebkitBackfaceVisibility: 'hidden',
                      transform: 'rotateY(180deg)'
                    }}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] uppercase font-black tracking-wider text-[#111111]/40">
                          Practical Insight
                        </span>
                        {currentCard?.author_name && (
                          <span className="text-[10px] font-bold text-[#111111]/60">
                            By {currentCard.author_name}
                          </span>
                        )}
                      </div>
                      <p className="text-sm sm:text-base font-semibold text-[#111111] leading-relaxed">
                        {currentCard?.back_content}
                      </p>
                    </div>

                    <div className="pt-4 flex items-center justify-between border-t border-[#111111]/10">
                      <span className="text-xs font-semibold text-[#111111]/50 flex items-center gap-1.5">
                        <RotateCw size={13} />
                        <span>Tap to flip back</span>
                      </span>
                      <span className="w-8 h-8 rounded-full bg-[#F4C542] border border-[#111111] flex items-center justify-center text-[#111111]">
                        <CheckCircle2 size={16} />
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Navigation Controls */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={handlePrev}
                  disabled={currentIndex === 0}
                  className="px-4 py-3 rounded-xl border-2 border-[#111111] bg-[#FFFFFF] text-[#111111] font-bold text-xs disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[#111111]/5 transition-colors flex items-center justify-center"
                  aria-label="Previous card"
                >
                  <ChevronLeft size={16} />
                </button>

                <button
                  type="button"
                  onClick={handleNext}
                  className="flex-1 py-3.5 px-4 rounded-xl bg-[#F4C542] hover:bg-[#e0b435] text-[#111111] font-black text-sm tracking-wide border-2 border-[#111111] transition-all shadow-md active:scale-98 flex items-center justify-center gap-2"
                >
                  <span>{currentIndex < totalCards - 1 ? 'Next Card' : 'Complete Today\'s Deck'}</span>
                  <ArrowRight size={16} />
                </button>
              </div>

            </div>
          )}
        </div>

      </div>
    </div>
  );
}
