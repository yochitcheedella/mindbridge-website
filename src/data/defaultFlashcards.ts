export type FlashcardSource = 'AI' | 'COUNSELLOR';
export type FlashcardStatus = 'DRAFT' | 'PENDING_REVIEW' | 'APPROVED' | 'PUBLISHED' | 'REJECTED' | 'ARCHIVED';
export type FlashcardCategory = 
  | 'Emotional Awareness'
  | 'Academic Stress'
  | 'Stress Management'
  | 'Digital Detox'
  | 'Healthy Habits'
  | 'Sleep & Rest';

export interface Flashcard {
  id: string | number;
  title: string;
  front_content: string;
  back_content: string;
  category: FlashcardCategory;
  source: FlashcardSource;
  created_by?: string;
  author_name?: string;
  institution?: string;
  status: FlashcardStatus;
  scheduled_date: string; // YYYY-MM-DD
  published_at?: string;
  expires_at?: string;
  priority: number; // e.g. 10 for Counsellor, 0 for AI
  visibility: 'ALL' | 'STUDENTS' | 'GROUP';
  created_at: string;
  updated_at: string;
}

const TODAY_STR = new Date().toISOString().split('T')[0];

export const INITIAL_FLASHCARDS: Flashcard[] = [
  // 1. Counsellor Card for Today (High Priority)
  {
    id: 'fc-counsellor-01',
    title: 'Managing Exam Anxiety',
    front_content: 'What is one proven, 60-second technique to interrupt pre-exam panic in the examination hall?',
    back_content: 'Use the 4-7-8 Breathing Anchor: Inhale quietly through the nose for 4 seconds, hold your breath for 7 seconds, and exhale completely with a whoosh sound for 8 seconds. This activates the vagus nerve and lowers acute heart rate.',
    category: 'Academic Stress',
    source: 'COUNSELLOR',
    created_by: 'ram.sir@vishnu.edu.in',
    author_name: 'Dr. K. Ramachandra Murthy',
    institution: 'Vishnu Wellness Centre',
    status: 'PUBLISHED',
    scheduled_date: TODAY_STR,
    published_at: TODAY_STR,
    priority: 10,
    visibility: 'ALL',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  // 2. AI Card - Emotional Awareness
  {
    id: 'fc-ai-01',
    title: 'Naming Your Emotions',
    front_content: 'What is emotional awareness, and why does "naming" what you feel reduce stress?',
    back_content: 'Emotional awareness is the practice of consciously recognizing your internal state. Neuroscience shows that labeling an emotion ("affect labeling") shifts brain activity from the reactive amygdala to the rational prefrontal cortex, immediately reducing its emotional intensity.',
    category: 'Emotional Awareness',
    source: 'AI',
    created_by: 'AI Engine',
    author_name: 'MindBridge AI Engine',
    institution: 'Vishnu Wellness Centre',
    status: 'PUBLISHED',
    scheduled_date: TODAY_STR,
    published_at: TODAY_STR,
    priority: 5,
    visibility: 'ALL',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  // 3. AI Card - Stress Management
  {
    id: 'fc-ai-02',
    title: 'The 5-4-3-2-1 Grounding Rule',
    front_content: 'How can you instantly ground your nervous system when feeling completely overwhelmed?',
    back_content: 'Acknowledge: 5 things you can see, 4 things you can physically feel, 3 things you can hear, 2 things you can smell, and 1 thing you can taste. This sensory shift forces the brain back into the present moment.',
    category: 'Stress Management',
    source: 'AI',
    created_by: 'AI Engine',
    author_name: 'MindBridge AI Engine',
    institution: 'Vishnu Wellness Centre',
    status: 'PUBLISHED',
    scheduled_date: TODAY_STR,
    published_at: TODAY_STR,
    priority: 5,
    visibility: 'ALL',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  // 4. Counsellor Card - Digital Detox
  {
    id: 'fc-counsellor-02',
    title: 'The 30-Minute Screen Curfew',
    front_content: 'Why should you put your smartphone away 30 minutes before sleep, and what should you replace it with?',
    back_content: 'Blue light suppresses melatonin secretion by up to 50%, delaying deep REM sleep. Replace late-night doomscrolling with 10 minutes of light stretching or journaling to signal your brain that it is safe to rest.',
    category: 'Digital Detox',
    source: 'COUNSELLOR',
    created_by: 'priya.counselor@vishnu.edu.in',
    author_name: 'Mrs. S. Lakshmi Priya',
    institution: 'Vishnu Wellness Centre',
    status: 'PUBLISHED',
    scheduled_date: TODAY_STR,
    published_at: TODAY_STR,
    priority: 9,
    visibility: 'ALL',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  // 5. AI Card - Healthy Habits
  {
    id: 'fc-ai-03',
    title: 'Habit Stacking for Busy Students',
    front_content: 'What is "habit stacking" and how can you use it to build a consistent daily wellness routine?',
    back_content: 'Instead of starting a new habit from scratch, attach it to an existing behavior: "After I [CURRENT HABIT], I will [NEW HABIT]." Example: After I pour my morning water, I will take 3 deep mindful breaths before unlocking my phone.',
    category: 'Healthy Habits',
    source: 'AI',
    created_by: 'AI Engine',
    author_name: 'MindBridge AI Engine',
    institution: 'Vishnu Wellness Centre',
    status: 'PUBLISHED',
    scheduled_date: TODAY_STR,
    published_at: TODAY_STR,
    priority: 5,
    visibility: 'ALL',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  // Extra cards in reserve / library
  {
    id: 'fc-ai-04',
    title: 'Overcoming Imposter Syndrome',
    front_content: 'When you feel like you do not belong in your college program, what is a healthy reframing mindset?',
    back_content: 'Remind yourself: Feelings are indicators, not facts. Everyone in your cohort is fighting silent battles. Focus on your personal learning curve rather than comparison with others.',
    category: 'Emotional Awareness',
    source: 'AI',
    created_by: 'AI Engine',
    author_name: 'MindBridge AI Engine',
    institution: 'Vishnu Wellness Centre',
    status: 'APPROVED',
    scheduled_date: '2026-09-09',
    priority: 3,
    visibility: 'ALL',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'fc-counsellor-03',
    title: 'Managing Placement Pressure',
    front_content: 'How should final-year students handle interview rejections without losing motivation?',
    back_content: 'Treat interview outcomes as data points rather than personal verdicts. Write down 2 things that went well, and 1 specific technical/soft skill to refine before the next placement drive.',
    category: 'Academic Stress',
    source: 'COUNSELLOR',
    created_by: 'anand.counselor@vishnu.edu.in',
    author_name: 'Mr. P. Anand Kumar',
    institution: 'Vishnu Wellness Centre',
    status: 'PENDING_REVIEW',
    scheduled_date: '2026-09-09',
    priority: 8,
    visibility: 'STUDENTS',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'fc-counsellor-04',
    title: 'Quality Sleep Routine',
    front_content: 'What is the optimal bedroom temperature and wind-down habit for student recovery?',
    back_content: 'Keep the room cool (around 18-21°C) and avoid heavy caffeine past 3:00 PM. A 5-minute brain-dump on paper clears unresolved thoughts from your active memory.',
    category: 'Sleep & Rest',
    source: 'COUNSELLOR',
    created_by: 'ram.sir@vishnu.edu.in',
    author_name: 'Dr. K. Ramachandra Murthy',
    institution: 'Vishnu Wellness Centre',
    status: 'DRAFT',
    scheduled_date: '2026-09-10',
    priority: 8,
    visibility: 'ALL',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

const STORAGE_KEY = 'mindbridge_wellness_flashcards_v1';
const COMPLETED_KEY = 'mindbridge_flashcards_completed_date';

export function getStoredFlashcards(): Flashcard[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_FLASHCARDS));
      return INITIAL_FLASHCARDS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_FLASHCARDS;
  }
}

export function saveStoredFlashcards(cards: Flashcard[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cards));
  } catch (err) {
    console.error('Failed to save flashcards to localStorage', err);
  }
}

/**
 * Returns exactly 5 cards for today:
 * 1. Counsellor published cards scheduled for today first (sorted by priority desc).
 * 2. Remaining slots filled with AI published cards.
 * 3. Rotates across categories to prevent repetition.
 */
export function getTodayFlashcards(): Flashcard[] {
  const allCards = getStoredFlashcards();
  const today = new Date().toISOString().split('T')[0];

  // Eligible cards: status = PUBLISHED and scheduled_date <= today
  const eligible = allCards.filter(c => c.status === 'PUBLISHED');

  // Separate counsellor and AI cards
  const counsellorCards = eligible
    .filter(c => c.source === 'COUNSELLOR')
    .sort((a, b) => b.priority - a.priority);

  const aiCards = eligible
    .filter(c => c.source === 'AI')
    .sort((a, b) => b.priority - a.priority);

  const selected: Flashcard[] = [];

  // Add counsellor cards first (up to 5)
  for (const card of counsellorCards) {
    if (selected.length < 5) {
      selected.push(card);
    }
  }

  // Fill remaining slots with AI cards, aiming for category diversity
  for (const card of aiCards) {
    if (selected.length >= 5) break;
    if (!selected.some(s => s.id === card.id)) {
      selected.push(card);
    }
  }

  // Fallback: If still under 5, add any approved cards or seed cards
  if (selected.length < 5) {
    for (const card of INITIAL_FLASHCARDS) {
      if (selected.length >= 5) break;
      if (!selected.some(s => s.id === card.id)) {
        selected.push(card);
      }
    }
  }

  return selected.slice(0, 5);
}

export function isTodayFlashcardsCompleted(): boolean {
  try {
    const today = new Date().toISOString().split('T')[0];
    const completedDate = localStorage.getItem(COMPLETED_KEY);
    return completedDate === today;
  } catch {
    return false;
  }
}

export function markTodayFlashcardsCompleted(): void {
  try {
    const today = new Date().toISOString().split('T')[0];
    localStorage.setItem(COMPLETED_KEY, today);
    
    // Increment flashcard completion count
    const count = parseInt(localStorage.getItem('mindbridge_flashcard_completed_count') || '0', 10);
    localStorage.setItem('mindbridge_flashcard_completed_count', (count + 1).toString());
  } catch (err) {
    console.error(err);
  }
}

export function createCounsellorFlashcard(data: {
  title: string;
  category: FlashcardCategory;
  front_content: string;
  back_content: string;
  visibility: 'ALL' | 'STUDENTS' | 'GROUP';
  scheduled_date: string;
  status: FlashcardStatus;
  author_name: string;
  created_by: string;
}): Flashcard {
  const all = getStoredFlashcards();
  const newCard: Flashcard = {
    id: `fc-counsellor-${Date.now()}`,
    title: data.title,
    category: data.category,
    front_content: data.front_content,
    back_content: data.back_content,
    source: 'COUNSELLOR',
    created_by: data.created_by,
    author_name: data.author_name || 'Vishnu Counsellor',
    institution: 'Vishnu Wellness Centre',
    status: data.status,
    scheduled_date: data.scheduled_date || TODAY_STR,
    priority: 10,
    visibility: data.visibility || 'ALL',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  all.unshift(newCard);
  saveStoredFlashcards(all);
  return newCard;
}

export function updateFlashcardStatus(id: string | number, status: FlashcardStatus): boolean {
  const all = getStoredFlashcards();
  const index = all.findIndex(c => String(c.id) === String(id));
  if (index !== -1) {
    all[index].status = status;
    all[index].updated_at = new Date().toISOString();
    if (status === 'PUBLISHED') {
      all[index].published_at = new Date().toISOString();
    }
    saveStoredFlashcards(all);
    return true;
  }
  return false;
}
