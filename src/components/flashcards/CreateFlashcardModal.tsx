import React, { useState } from 'react';
import { X, Sparkles, Check, Send, Save } from 'lucide-react';
import { 
  createCounsellorFlashcard, 
  type FlashcardCategory, 
  type Flashcard 
} from '../../data/defaultFlashcards';
import { getAuth } from '../../utils/auth';

interface CreateFlashcardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCardCreated: (card: Flashcard) => void;
}

const CATEGORIES: FlashcardCategory[] = [
  'Academic Stress',
  'Emotional Awareness',
  'Stress Management',
  'Digital Detox',
  'Healthy Habits',
  'Sleep & Rest',
];

export default function CreateFlashcardModal({ isOpen, onClose, onCardCreated }: CreateFlashcardModalProps) {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<FlashcardCategory>('Academic Stress');
  const [frontContent, setFrontContent] = useState('');
  const [backContent, setBackContent] = useState('');
  const [visibility, setVisibility] = useState<'ALL' | 'STUDENTS' | 'GROUP'>('ALL');
  const [scheduledDate, setScheduledDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const auth = getAuth();
  const authorName = auth?.name || 'Dr. K. Ramachandra Murthy';
  const authorEmail = 'counsellor@vishnu.edu.in';

  const handleSubmit = (asDraft: boolean) => {
    if (!title.trim()) {
      setError('Please provide a title for the wellness card');
      return;
    }
    if (!frontContent.trim() || !backContent.trim()) {
      setError('Both front prompt and back insight must be filled');
      return;
    }

    const newCard = createCounsellorFlashcard({
      title: title.trim(),
      category,
      front_content: frontContent.trim(),
      back_content: backContent.trim(),
      visibility,
      scheduled_date: scheduledDate,
      status: asDraft ? 'DRAFT' : 'PENDING_REVIEW',
      author_name: authorName,
      created_by: authorEmail,
    });

    onCardCreated(newCard);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#111111]/80 backdrop-blur-sm animate-fade-in font-sans">
      <div className="w-full max-w-lg bg-[#FFFFFF] text-[#111111] rounded-3xl border-2 border-[#111111] shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-[#111111]/10 flex items-center justify-between bg-[#FFFFFF]">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#F4C542] border border-[#111111]" />
            <h3 className="text-sm font-black uppercase tracking-wider text-[#111111]">
              Create Wellness Card
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full border border-[#111111]/20 flex items-center justify-center text-[#111111] hover:bg-[#111111]/5 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4 overflow-y-auto flex-1">
          {error && (
            <div className="p-3 rounded-xl border border-[#111111] bg-[#F4C542]/20 text-xs font-bold text-[#111111]">
              {error}
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-[#111111]/80 mb-1.5">
              Title
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => { setTitle(e.target.value); setError(''); }}
              placeholder="e.g. Managing Exam Stress"
              className="w-full bg-[#FFFFFF] border-2 border-[#111111] rounded-xl px-4 py-2.5 text-sm text-[#111111] placeholder-[#111111]/40 focus:outline-none focus:ring-2 focus:ring-[#F4C542]"
            />
          </div>

          {/* Category Dropdown */}
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-[#111111]/80 mb-1.5">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as FlashcardCategory)}
              className="w-full bg-[#FFFFFF] border-2 border-[#111111] rounded-xl px-4 py-2.5 text-sm text-[#111111] focus:outline-none focus:ring-2 focus:ring-[#F4C542] font-medium"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Front Prompt */}
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-[#111111]/80 mb-1.5 flex items-center justify-between">
              <span>Front (Question / Reflection Prompt)</span>
              <span className="text-[10px] text-[#111111]/40 font-mono">Visible first</span>
            </label>
            <textarea
              rows={3}
              required
              value={frontContent}
              onChange={(e) => { setFrontContent(e.target.value); setError(''); }}
              placeholder="e.g. What is one simple way to reduce exam stress in 60 seconds?"
              className="w-full bg-[#FFFFFF] border-2 border-[#111111] rounded-xl p-3 text-sm text-[#111111] placeholder-[#111111]/40 focus:outline-none focus:ring-2 focus:ring-[#F4C542]"
            />
          </div>

          {/* Back Insight */}
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-[#111111]/80 mb-1.5 flex items-center justify-between">
              <span>Back (Actionable Wisdom / Solution)</span>
              <span className="text-[10px] text-[#111111]/40 font-mono">Revealed on flip</span>
            </label>
            <textarea
              rows={4}
              required
              value={backContent}
              onChange={(e) => { setBackContent(e.target.value); setError(''); }}
              placeholder="e.g. Break large tasks into smaller achievable steps and practice 4-7-8 breathing."
              className="w-full bg-[#FFFFFF] border-2 border-[#111111] rounded-xl p-3 text-sm text-[#111111] placeholder-[#111111]/40 focus:outline-none focus:ring-2 focus:ring-[#F4C542]"
            />
          </div>

          {/* Visibility & Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-[#111111]/80 mb-1.5">
                Visibility
              </label>
              <div className="space-y-1.5">
                <label className="flex items-center gap-2 text-xs font-bold text-[#111111] cursor-pointer">
                  <input
                    type="radio"
                    name="visibility"
                    checked={visibility === 'ALL'}
                    onChange={() => setVisibility('ALL')}
                    className="accent-[#111111]"
                  />
                  <span>All Students</span>
                </label>
                <label className="flex items-center gap-2 text-xs font-bold text-[#111111] cursor-pointer">
                  <input
                    type="radio"
                    name="visibility"
                    checked={visibility === 'STUDENTS'}
                    onChange={() => setVisibility('STUDENTS')}
                    className="accent-[#111111]"
                  />
                  <span>Targeted Cohort</span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-[#111111]/80 mb-1.5">
                Publish / Schedule Date
              </label>
              <input
                type="date"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                className="w-full bg-[#FFFFFF] border-2 border-[#111111] rounded-xl px-3 py-2 text-xs font-bold text-[#111111] focus:outline-none focus:ring-2 focus:ring-[#F4C542]"
              />
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-[#111111]/10 bg-[#FFFFFF] flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => handleSubmit(true)}
            className="px-4 py-2.5 rounded-xl border-2 border-[#111111] text-[#111111] font-bold text-xs hover:bg-[#111111]/5 transition-colors flex items-center gap-1.5"
          >
            <Save size={14} />
            <span>Save Draft</span>
          </button>
          <button
            type="button"
            onClick={() => handleSubmit(false)}
            className="px-5 py-2.5 rounded-xl bg-[#F4C542] hover:bg-[#e0b435] text-[#111111] font-black text-xs border-2 border-[#111111] transition-all shadow-md active:scale-95 flex items-center gap-1.5"
          >
            <Send size={14} />
            <span>Submit for Review</span>
          </button>
        </div>

      </div>
    </div>
  );
}
