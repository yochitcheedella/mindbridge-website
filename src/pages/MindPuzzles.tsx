import React, { useState, useEffect } from 'react';
import { 
  Puzzle, Sparkles, Brain, RefreshCw, Trophy, Heart, Smile, 
  Eye, CheckCircle2, ChevronRight, Play, RotateCcw, Zap, Target
} from 'lucide-react';

type GameType = 'memory' | 'breathing' | 'word' | 'number' | 'pattern' | 'focus';

export default function MindPuzzles() {
  const [activeGame, setActiveGame] = useState<GameType>('memory');

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 animate-fade-in text-[#111111] pb-16">
      {/* ── Top Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-[#111111]/10">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-heading font-black tracking-tight text-[#111111]">
              Mind Puzzle Games
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-[#F4C542]/20 text-[#111111] border border-[#F4C542] text-[11px] font-bold">
              Cognitive Wellness
            </span>
          </div>
          <p className="text-xs text-[#111111]/60 mt-1 font-medium">
            Relaxing mini-games for mindfulness, cognitive engagement, and stress relief.
          </p>
        </div>
      </div>

      {/* ── Game Selector Carousel Pills ── */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {[
          { type: 'memory' as GameType, label: '🧩 Memory Match' },
          { type: 'breathing' as GameType, label: '🧘 Breathing Game' },
          { type: 'word' as GameType, label: '🔤 Word Puzzle' },
          { type: 'number' as GameType, label: '🔢 Number Puzzle' },
          { type: 'pattern' as GameType, label: '🧠 Pattern Recognition' },
          { type: 'focus' as GameType, label: '🎯 Focus Challenge' },
        ].map(item => (
          <button
            key={item.type}
            onClick={() => setActiveGame(item.type)}
            className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center justify-center gap-1.5 ${
              activeGame === item.type
                ? 'bg-[#F4C542] text-[#111111] border-2 border-[#111111] font-black shadow-sm'
                : 'bg-[#FFFFFF] border border-[#111111]/20 text-[#111111]/70 hover:text-[#111111] hover:bg-[#111111]/5'
            }`}
          >
            <span>{item.label}</span>
          </button>
        ))}
      </div>

      {/* ── Active Game Stage ── */}
      <div className="bg-[#FFFFFF] p-5 sm:p-8 rounded-3xl border-2 border-[#111111]/10 shadow-sm flex flex-col">
        <div className="flex-1 w-full flex flex-col justify-center">
          {activeGame === 'memory' && <MemoryMatchGame />}
          {activeGame === 'breathing' && <BreathingGame />}
          {activeGame === 'word' && <WordPuzzleGame />}
          {activeGame === 'number' && <NumberPuzzleGame />}
          {activeGame === 'pattern' && <PatternGame />}
          {activeGame === 'focus' && <FocusChallengeGame />}
        </div>

        {/* Footnote Disclaimer */}
        <div className="mt-8 pt-4 border-t border-[#111111]/10 text-center">
          <p className="text-[11px] text-[#111111]/50 font-medium">
            Mind Puzzle Games are lightweight relaxation activities designed for stress relief and cognitive engagement.
          </p>
        </div>
      </div>
    </div>
  );
}

/* =========================================================================
   1. MEMORY MATCH GAME
   ========================================================================= */
const MEMORY_SYMBOLS = ['🌸', '🌊', '☀️', '🌱', '🕊️', '🧘'];

function MemoryMatchGame() {
  const [cards, setCards] = useState<Array<{ id: number; symbol: string; flipped: boolean; matched: boolean }>>([]);
  const [selected, setSelected] = useState<number[]>([]);
  const [moves, setMoves] = useState<number>(0);
  const [won, setWon] = useState<boolean>(false);

  const initGame = () => {
    const deck = [...MEMORY_SYMBOLS, ...MEMORY_SYMBOLS]
      .sort(() => Math.random() - 0.5)
      .map((symbol, idx) => ({ id: idx, symbol, flipped: false, matched: false }));
    setCards(deck);
    setSelected([]);
    setMoves(0);
    setWon(false);
  };

  useEffect(() => {
    initGame();
  }, []);

  const handleCardClick = (idx: number) => {
    if (cards[idx].flipped || cards[idx].matched || selected.length === 2) return;
    const newCards = [...cards];
    newCards[idx].flipped = true;
    setCards(newCards);

    const newSelected = [...selected, idx];
    setSelected(newSelected);

    if (newSelected.length === 2) {
      setMoves((m) => m + 1);
      const [first, second] = newSelected;
      if (cards[first].symbol === cards[second].symbol) {
        newCards[first].matched = true;
        newCards[second].matched = true;
        setCards(newCards);
        setSelected([]);
        if (newCards.every((c) => c.matched)) {
          setWon(true);
        }
      } else {
        setTimeout(() => {
          newCards[first].flipped = false;
          newCards[second].flipped = false;
          setCards([...newCards]);
          setSelected([]);
        }, 900);
      }
    }
  };

  return (
    <div className="w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h2 className="text-base font-heading font-black text-[#111111]">🧩 Mindful Memory Match</h2>
          <p className="text-xs text-[#111111]/60">Flip cards to match peaceful wellness symbols.</p>
        </div>
        <div className="flex items-center gap-3 self-start sm:self-auto">
          <span className="text-xs font-bold text-[#111111] bg-[#111111]/5 px-3 py-1.5 rounded-xl border border-[#111111]/10">
            Moves: {moves}
          </span>
          <button
            onClick={initGame}
            className="p-2 rounded-xl text-[#111111]/60 hover:text-[#111111] hover:bg-[#111111]/5 transition-colors cursor-pointer"
            title="Restart"
          >
            <RotateCcw size={16} />
          </button>
        </div>
      </div>

      {won ? (
        <div className="text-center py-12 px-4 bg-[#F4C542]/15 rounded-3xl border-2 border-[#111111] space-y-3 max-w-md mx-auto">
          <Trophy size={40} className="text-[#111111] mx-auto" />
          <h3 className="text-lg font-heading font-black text-[#111111]">Wonderful Focus!</h3>
          <p className="text-xs text-[#111111]/75">You matched all pairs in {moves} moves.</p>
          <button
            onClick={initGame}
            className="px-6 py-2.5 rounded-xl bg-[#F4C542] hover:bg-[#e0b435] text-[#111111] text-xs font-black border-2 border-[#111111] shadow-sm transition-all cursor-pointer"
          >
            Play Again
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2.5 sm:gap-3 max-w-lg mx-auto w-full">
          {cards.map((card, idx) => (
            <button
              key={card.id}
              onClick={() => handleCardClick(idx)}
              className={`aspect-square w-full rounded-2xl border-2 text-2xl sm:text-3xl flex items-center justify-center transition-all duration-300 cursor-pointer ${
                card.flipped || card.matched
                  ? 'bg-[#F4C542]/20 border-[#111111] shadow-sm scale-95'
                  : 'bg-[#111111]/5 border-[#111111]/15 hover:border-[#111111]'
              }`}
            >
              {card.flipped || card.matched ? card.symbol : '✦'}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* =========================================================================
   2. INTERACTIVE BREATHING GAME
   ========================================================================= */
function BreathingGame() {
  const [phase, setPhase] = useState<'Inhale' | 'Hold' | 'Exhale'>('Inhale');
  const [count, setCount] = useState<number>(4);
  const [cycles, setCycles] = useState<number>(0);

  useEffect(() => {
    let timer = setInterval(() => {
      setCount((prev) => {
        if (prev > 1) return prev - 1;
        if (phase === 'Inhale') {
          setPhase('Hold');
          return 4;
        } else if (phase === 'Hold') {
          setPhase('Exhale');
          return 4;
        } else {
          setPhase('Inhale');
          setCycles((c) => c + 1);
          return 4;
        }
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [phase]);

  return (
    <div className="text-center py-4 max-w-md mx-auto w-full">
      <h2 className="text-base font-heading font-black text-[#111111]">🧘 Harmonious Breathing Guide</h2>
      <p className="text-xs text-[#111111]/60 mb-8">4-4-4 Box breathing to regulate heart rate & calm the nervous system.</p>

      <div className="relative w-52 h-52 sm:w-60 sm:h-60 mx-auto flex items-center justify-center">
        {/* Animated expanding circle */}
        <div
          className="absolute inset-0 rounded-full bg-[#F4C542]/25 transition-all duration-1000 ease-in-out"
          style={{
            transform: phase === 'Inhale' ? 'scale(1.15)' : phase === 'Hold' ? 'scale(1.15)' : 'scale(0.85)',
          }}
        />

        <div className="relative z-10 w-40 h-40 sm:w-48 sm:h-48 rounded-full bg-[#FFFFFF] border-4 border-[#111111] shadow-md flex flex-col items-center justify-center">
          <span className="text-[11px] sm:text-xs font-black uppercase tracking-wider text-[#111111]">
            {phase === 'Inhale' ? 'Breathe In ↑' : phase === 'Hold' ? 'Hold ●' : 'Breathe Out ↓'}
          </span>
          <span className="text-3xl sm:text-4xl font-black text-[#111111] mt-1">{count}</span>
          <span className="text-[10px] font-bold text-[#111111]/50 mt-1">Seconds</span>
        </div>
      </div>

      <p className="mt-8 text-xs font-bold text-[#111111]">
        Completed Cycles: <span className="text-[#111111] font-black">{cycles}</span>
      </p>
    </div>
  );
}

/* =========================================================================
   3. MINDFUL WORD PUZZLE
   ========================================================================= */
const WORDS = [
  { scrambled: 'M L A C', answer: 'CALM', hint: 'State of tranquility and peace' },
  { scrambled: 'T H E R B A E', answer: 'BREATHE', hint: 'Inhale peace, exhale tension' },
  { scrambled: 'E R E S N E', answer: 'SERENE', hint: 'Calm, peaceful, and untroubled' },
  { scrambled: 'S C U O F', answer: 'FOCUS', hint: 'Directing mindful attention' },
  { scrambled: 'C A P E E', answer: 'PEACE', hint: 'Harmony of the inner spirit' },
];

function WordPuzzleGame() {
  const [idx, setIdx] = useState(0);
  const [guess, setGuess] = useState('');
  const [status, setStatus] = useState<'idle' | 'correct' | 'wrong'>('idle');
  const [score, setScore] = useState(0);

  const current = WORDS[idx];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (guess.trim().toUpperCase() === current.answer) {
      setStatus('correct');
      setScore((s) => s + 1);
      setTimeout(() => {
        setStatus('idle');
        setGuess('');
        setIdx((i) => (i + 1) % WORDS.length);
      }, 1200);
    } else {
      setStatus('wrong');
      setTimeout(() => setStatus('idle'), 1000);
    }
  };

  return (
    <div className="max-w-md mx-auto text-center py-4 w-full">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-base font-heading font-black text-[#111111] text-left">🔤 Mindful Word Unscramble</h2>
          <p className="text-xs text-[#111111]/60 text-left">Unscramble positive words for clarity.</p>
        </div>
        <span className="text-xs font-bold text-[#111111] bg-[#F4C542]/20 border border-[#F4C542] px-3 py-1 rounded-xl shrink-0">
          Score: {score}
        </span>
      </div>

      <div className="p-6 bg-[#111111]/5 rounded-2xl border border-[#111111]/10 mb-4">
        <span className="text-xs font-bold text-[#111111]/50 uppercase tracking-widest">Scrambled Letters</span>
        <h3 className="text-3xl font-black text-[#111111] tracking-widest mt-2">{current.scrambled}</h3>
        <p className="text-xs text-[#111111]/70 mt-2 italic">Hint: "{current.hint}"</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          type="text"
          value={guess}
          onChange={(e) => setGuess(e.target.value)}
          placeholder="Type your answer..."
          className="w-full text-center text-lg font-black uppercase tracking-wider py-3 bg-[#FFFFFF] border-2 border-[#111111] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#F4C542]"
        />

        <button
          type="submit"
          className="w-full py-3 rounded-2xl bg-[#F4C542] hover:bg-[#e0b435] text-[#111111] text-xs font-black border-2 border-[#111111] transition-all shadow-sm cursor-pointer"
        >
          Check Word
        </button>

        {status === 'correct' && (
          <p className="text-xs font-black text-[#111111] animate-fade-in">✨ Brilliant! That's correct!</p>
        )}
        {status === 'wrong' && (
          <p className="text-xs font-bold text-[#111111]/60 animate-fade-in">Try again gently...</p>
        )}
      </form>
    </div>
  );
}

/* =========================================================================
   4. NUMBER PUZZLE GAME (Sequence Match)
   ========================================================================= */
function NumberPuzzleGame() {
  const [seq, setSeq] = useState<number[]>([2, 4, 6, 0, 10]);
  const [ans, setAns] = useState<number>(8);
  const [options, setOptions] = useState<number[]>([7, 8, 9, 12]);
  const [feedback, setFeedback] = useState<string>('');

  const nextPuzzle = () => {
    const start = Math.floor(Math.random() * 5) + 1;
    const diff = Math.floor(Math.random() * 3) + 2;
    const full = [start, start + diff, start + diff * 2, start + diff * 3, start + diff * 4];
    const correct = full[3];
    full[3] = 0; // blank
    setSeq(full);
    setAns(correct);
    setOptions([correct, correct + 1, correct - 1, correct + 2].sort(() => Math.random() - 0.5));
    setFeedback('');
  };

  const handleSelect = (num: number) => {
    if (num === ans) {
      setFeedback('Correct! Well calculated.');
      setTimeout(nextPuzzle, 1200);
    } else {
      setFeedback('Keep looking at the intervals.');
    }
  };

  return (
    <div className="max-w-md mx-auto text-center py-4 w-full">
      <h2 className="text-base font-heading font-black text-[#111111]">🔢 Number Pattern Sequence</h2>
      <p className="text-xs text-[#111111]/60 mb-6">Find the missing number in the harmonic progression.</p>

      <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 mb-6">
        {seq.map((n, i) => (
          <div
            key={i}
            className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center text-base sm:text-lg font-black border-2 ${
              n === 0
                ? 'border-[#111111] bg-[#F4C542] text-[#111111]'
                : 'border-[#111111]/20 bg-[#FFFFFF] text-[#111111]'
            }`}
          >
            {n === 0 ? '?' : n}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {options.map((opt) => (
          <button
            key={opt}
            onClick={() => handleSelect(opt)}
            className="py-3 rounded-2xl border-2 border-[#111111] bg-[#FFFFFF] hover:bg-[#F4C542] text-[#111111] font-black text-sm transition-all cursor-pointer"
          >
            {opt}
          </button>
        ))}
      </div>

      {feedback && (
        <p className="mt-4 text-xs font-bold text-[#111111] animate-fade-in">{feedback}</p>
      )}
    </div>
  );
}

/* =========================================================================
   5. PATTERN RECOGNITION GAME
   ========================================================================= */
function PatternGame() {
  const patterns = [
    { seq: ['🔴', '🟡', '⚫', '🔴', '🟡'], next: '⚫', opts: ['⚫', '⚪', '🔴', '🟡'] },
    { seq: ['▲', '■', '▲', '■', '▲'], next: '■', opts: ['●', '■', '▲', '◆'] },
  ];
  const [step, setStep] = useState(0);
  const [result, setResult] = useState('');

  const current = patterns[step % patterns.length];

  const handlePick = (choice: string) => {
    if (choice === current.next) {
      setResult('Spot on! Excellent pattern recognition.');
      setTimeout(() => {
        setResult('');
        setStep((s) => s + 1);
      }, 1000);
    } else {
      setResult('Almost! Take another close look.');
    }
  };

  return (
    <div className="max-w-md mx-auto text-center py-4 w-full">
      <h2 className="text-base font-heading font-black text-[#111111]">🧠 Pattern Recognition</h2>
      <p className="text-xs text-[#111111]/60 mb-6">Complete the logical shape progression.</p>

      <div className="flex flex-wrap items-center justify-center gap-2 mb-6">
        {current.seq.map((sym, i) => (
          <span key={i} className="text-xl sm:text-2xl p-2.5 sm:p-3 bg-[#111111]/5 rounded-2xl border border-[#111111]/10">
            {sym}
          </span>
        ))}
        <span className="text-xl sm:text-2xl p-2.5 sm:p-3 bg-[#F4C542] text-[#111111] rounded-2xl border-2 border-[#111111] font-black">
          ?
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {current.opts.map((opt, i) => (
          <button
            key={i}
            onClick={() => handlePick(opt)}
            className="py-3 text-xl bg-[#FFFFFF] hover:bg-[#F4C542]/20 border-2 border-[#111111]/20 hover:border-[#111111] rounded-2xl transition-all cursor-pointer"
          >
            {opt}
          </button>
        ))}
      </div>

      {result && <p className="mt-4 text-xs font-bold text-[#111111] animate-fade-in">{result}</p>}
    </div>
  );
}

/* =========================================================================
   6. FOCUS CHALLENGE GAME
   ========================================================================= */
function FocusChallengeGame() {
  const [activeTarget, setActiveTarget] = useState<number>(1);
  const [score, setScore] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(15);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  useEffect(() => {
    let interval: any = null;
    if (isPlaying && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((t) => t - 1);
      }, 1000);
    } else if (timeLeft === 0 && isPlaying) {
      setIsPlaying(false);
    }
    return () => clearInterval(interval);
  }, [isPlaying, timeLeft]);

  const startGame = () => {
    setScore(0);
    setTimeLeft(15);
    setIsPlaying(true);
    setActiveTarget(Math.floor(Math.random() * 9));
  };

  const handleTap = (idx: number) => {
    if (!isPlaying) return;
    if (idx === activeTarget) {
      setScore((s) => s + 1);
      setActiveTarget(Math.floor(Math.random() * 9));
    }
  };

  return (
    <div className="max-w-xs mx-auto text-center py-4 w-full">
      <h2 className="text-base font-heading font-black text-[#111111]">🎯 Mindful Focus Challenge</h2>
      <p className="text-xs text-[#111111]/60 mb-4">Tap the highlighted target to calibrate hand-eye calmness.</p>

      <div className="flex justify-between text-xs font-bold mb-4 px-1">
        <span>Time: {timeLeft}s</span>
        <span className="text-[#111111] font-black">Hits: {score}</span>
      </div>

      <div className="grid grid-cols-3 gap-2.5 sm:gap-3 mb-6">
        {Array.from({ length: 9 }).map((_, idx) => (
          <button
            key={idx}
            onClick={() => handleTap(idx)}
            className={`aspect-square w-full rounded-2xl border-2 transition-all flex items-center justify-center cursor-pointer ${
              idx === activeTarget && isPlaying
                ? 'bg-[#F4C542] border-[#111111] scale-105 shadow-sm'
                : 'bg-[#111111]/5 border-[#111111]/10'
            }`}
          >
            {idx === activeTarget && isPlaying && <Target size={24} className="text-[#111111]" />}
          </button>
        ))}
      </div>

      {!isPlaying ? (
        <button
          onClick={startGame}
          className="w-full py-3 rounded-2xl bg-[#F4C542] hover:bg-[#e0b435] text-[#111111] text-xs font-black border-2 border-[#111111] transition-all shadow-sm cursor-pointer"
        >
          {timeLeft === 0 ? 'Try Again' : 'Play Mind Puzzle'}
        </button>
      ) : (
        <p className="text-xs text-[#111111]/60">Keep rhythmic focus...</p>
      )}
    </div>
  );
}
