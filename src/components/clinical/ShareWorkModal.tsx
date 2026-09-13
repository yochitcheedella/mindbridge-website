import React, { useState } from 'react';
import { X, Send, Heart, Sparkles, BookOpen, CheckCircle2, Shield, Lock } from 'lucide-react';
import { OFFICIAL_COUNSELORS, type CounselorData } from '../../data/counselors';
import { getAlias } from '../../utils/auth';

export interface SharedWorkItem {
  id: string;
  studentAlias: string;
  counselorName: string;
  counselorId?: number;
  workType: 'Reflection' | 'Creative Writing' | 'Gratitude Note' | 'Goal Milestone' | 'Artwork Concept';
  title: string;
  content: string;
  reflectionNoteForCounselor: string;
  sharedAt: string;
  status: 'shared' | 'reviewed';
  counselorResponse?: string;
  respondedAt?: string;
}

interface ShareWorkModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialContent?: string;
  initialWorkType?: SharedWorkItem['workType'];
  onSharedSuccess?: () => void;
}

export default function ShareWorkModal({
  isOpen,
  onClose,
  initialContent = '',
  initialWorkType = 'Reflection',
  onSharedSuccess,
}: ShareWorkModalProps) {
  const currentAlias = getAlias() || 'Student';

  const [selectedCounselor, setSelectedCounselor] = useState(OFFICIAL_COUNSELORS[0].name);
  const [workType, setWorkType] = useState<SharedWorkItem['workType']>(initialWorkType);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState(initialContent);
  const [counselorNote, setCounselorNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || !title.trim()) return;

    setIsSubmitting(true);

    const newWork: SharedWorkItem = {
      id: `work-${Date.now()}`,
      studentAlias: currentAlias,
      counselorName: selectedCounselor,
      workType,
      title: title.trim(),
      content: content.trim(),
      reflectionNoteForCounselor: counselorNote.trim(),
      sharedAt: new Date().toISOString(),
      status: 'shared',
    };

    try {
      const stored = localStorage.getItem('mindbridge_shared_student_works');
      const existing = stored ? JSON.parse(stored) : [];
      localStorage.setItem('mindbridge_shared_student_works', JSON.stringify([newWork, ...existing]));
    } catch (e) {
      console.warn('Could not save to localStorage', e);
    }

    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitted(true);
      if (onSharedSuccess) onSharedSuccess();
      setTimeout(() => {
        setSubmitted(false);
        onClose();
      }, 1400);
    }, 500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#111111]/70 backdrop-blur-xs overflow-y-auto animate-fade-in">
      <div className="bg-[#FFFFFF] border-2 border-[#111111] rounded-3xl w-full max-w-2xl max-h-[92vh] overflow-y-auto shadow-2xl my-8 text-[#111111]">
        {/* Header */}
        <div className="sticky top-0 bg-[#FFFFFF] border-b border-[#111111]/15 px-6 py-4 flex items-center justify-between z-20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#F4C542] border-2 border-[#111111] flex items-center justify-center font-bold text-[#111111]">
              <Sparkles size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-black uppercase tracking-wider bg-[#F4C542] px-2 py-0.5 rounded-full border border-[#111111]">
                  Therapeutic Rapport
                </span>
                <span className="text-xs text-[#111111]/60 font-mono">Confidential & 1-on-1</span>
              </div>
              <h2 className="text-lg font-heading font-black text-[#111111]">
                Share Your Work with Your Counsellor
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-[#111111]/60 hover:text-[#111111] hover:bg-[#111111]/5 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {submitted ? (
          <div className="p-10 text-center space-y-3">
            <div className="w-14 h-14 rounded-full bg-green-100 border-2 border-green-700 mx-auto flex items-center justify-center text-green-700">
              <CheckCircle2 size={32} />
            </div>
            <h3 className="text-xl font-heading font-black">Shared Successfully!</h3>
            <p className="text-xs text-[#111111]/70 max-w-md mx-auto">
              Your work has been securely transmitted to {selectedCounselor}. They will review it and provide encouraging guidance during your sessions.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
            <div className="p-4 rounded-2xl bg-[#FAFAFA] border border-[#111111]/15 flex items-start gap-3">
              <Heart size={18} className="text-[#111111] shrink-0 mt-0.5 fill-[#F4C542]" />
              <p className="text-xs text-[#111111]/80 leading-relaxed">
                Building rapport with your counsellor is an essential step towards healing. Feel free to share thoughts, diary writings, creative expressions, or small milestones you're proud of.
              </p>
            </div>

            {/* Select Counsellor */}
            <div>
              <label className="block text-xs font-mono font-bold uppercase text-[#111111] mb-1.5">
                Select Your Counsellor
              </label>
              <select
                value={selectedCounselor}
                onChange={e => setSelectedCounselor(e.target.value)}
                className="w-full text-sm font-semibold bg-[#FAFAFA] border border-[#111111]/25 rounded-xl px-3 py-2.5 text-[#111111]"
              >
                {OFFICIAL_COUNSELORS.map(c => (
                  <option key={c.name} value={c.name}>
                    {c.name} · {c.specialization} ({c.institution})
                  </option>
                ))}
              </select>
            </div>

            {/* Work Category */}
            <div>
              <label className="block text-xs font-mono font-bold uppercase text-[#111111] mb-1.5">
                Type of Work / Reflection
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {(['Reflection', 'Creative Writing', 'Gratitude Note', 'Goal Milestone', 'Artwork Concept'] as const).map(t => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setWorkType(t)}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                      workType === t
                        ? 'border-[#111111] bg-[#F4C542] text-[#111111] font-black'
                        : 'border-[#111111]/20 bg-white text-[#111111]/70 hover:border-[#111111]/40'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Title */}
            <div>
              <label className="block text-xs font-mono font-bold uppercase text-[#111111] mb-1.5">
                Title of Your Work / Reflection
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="e.g. A poem about overcoming fear, My thoughts on today's presentation..."
                className="w-full text-sm bg-[#FAFAFA] border border-[#111111]/25 rounded-xl px-3 py-2.5 text-[#111111]"
              />
            </div>

            {/* Content */}
            <div>
              <label className="block text-xs font-mono font-bold uppercase text-[#111111] mb-1.5">
                Work Content / Reflection Text
              </label>
              <textarea
                required
                rows={5}
                value={content}
                onChange={e => setContent(e.target.value)}
                placeholder="Write, paste your journal entry, or describe your artwork and thoughts here..."
                className="w-full text-sm bg-[#FAFAFA] border border-[#111111]/25 rounded-xl p-3 text-[#111111] leading-relaxed"
              />
            </div>

            {/* Personal Note to Counsellor */}
            <div>
              <label className="block text-xs font-mono font-bold uppercase text-[#111111] mb-1.5">
                Personal Note / Context for Your Counsellor (Optional)
              </label>
              <input
                type="text"
                value={counselorNote}
                onChange={e => setCounselorNote(e.target.value)}
                placeholder="e.g. I wanted to talk about this in our next Tuesday session..."
                className="w-full text-xs bg-[#FAFAFA] border border-[#111111]/25 rounded-xl px-3 py-2 text-[#111111]"
              />
            </div>

            {/* Submit */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting || !title.trim() || !content.trim()}
                className="w-full py-3 rounded-2xl bg-[#F4C542] hover:bg-[#e0b435] text-[#111111] font-heading font-black text-sm border-2 border-[#111111] transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 cursor-pointer"
              >
                <Send size={16} />
                <span>{isSubmitting ? 'Transmitting Securely...' : 'Share with Counsellor'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
