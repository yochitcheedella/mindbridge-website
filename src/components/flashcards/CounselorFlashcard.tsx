import React from 'react';
import { Award, Globe, BookOpen, Calendar, Phone, Mail, Shield, CheckCircle2 } from 'lucide-react';
import type { CounselorData } from '../../data/counselors';

interface CounselorFlashcardProps {
  counselor: CounselorData;
  onSelectBooking?: (id: number) => void;
  onViewBio?: (counselor: CounselorData) => void;
  isCompact?: boolean;
}

export const CounselorFlashcard: React.FC<CounselorFlashcardProps> = ({
  counselor,
  onSelectBooking,
  onViewBio,
  isCompact = false,
}) => {
  if (isCompact) {
    return (
      <div 
        onClick={() => onViewBio?.(counselor)}
        className="aspect-[3/4] p-3 rounded-2xl bg-[#FFFFFF] border-2 border-[#111111] shadow-[3px_3px_0px_#111111] hover:shadow-[5px_5px_0px_#111111] hover:-translate-y-1 transition-all cursor-pointer flex flex-col justify-between group relative overflow-hidden"
      >
        {/* Flashcard Header Tab */}
        <div>
          <div className="flex items-center justify-between gap-1 mb-2">
            <span className="text-[9px] font-mono font-black uppercase px-1.5 py-0.5 rounded bg-[#F4C542] border border-[#111111] truncate max-w-[70%]">
              {counselor.acronym}
            </span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 border border-[#111111] shrink-0" title="Available" />
          </div>

          {/* Flashcard Photo: Rectangular Portrait Format */}
          <div className="w-full aspect-[4/3] rounded-xl overflow-hidden border border-[#111111] mb-2 bg-[#FAFAFA] relative">
            <img 
              src={counselor.avatar_url} 
              alt={counselor.name}
              className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-300"
              onError={(e) => { (e.target as HTMLImageElement).src = '/logo.png'; }}
            />
          </div>

          <h4 className="text-xs font-heading font-black text-[#111111] line-clamp-1">
            {counselor.name}
          </h4>
          <p className="text-[10px] text-[#111111]/70 font-semibold line-clamp-1 mt-0.5">
            {counselor.specialization.split('•')[0]}
          </p>
        </div>

        <div className="pt-2 border-t border-[#111111]/10 flex items-center justify-between text-[9px] font-mono text-[#111111]/60">
          <span>{counselor.experience}</span>
          <span className="font-bold text-[#111111] group-hover:text-amber-600"></span>
        </div>
      </div>
    );
  }

  return (
    <div className="aspect-[4/5] sm:aspect-auto sm:min-h-[480px] p-5 sm:p-6 rounded-3xl bg-[#FFFFFF] border-2 border-[#111111] shadow-[4px_4px_0px_#111111] hover:shadow-[6px_6px_0px_#111111] hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between group relative overflow-hidden">
      {/* Flashcard Top Index Line */}
      <div className="space-y-4">
        {/* Top Header Row */}
        <div className="flex items-start justify-between gap-2 pb-2 border-b border-[#111111]/10">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[10px] font-mono font-black uppercase px-2 py-0.5 rounded-md bg-[#F4C542] border border-[#111111] text-[#111111]">
              {counselor.institution}
            </span>
            {counselor.crn && (
              <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-[#111111] text-[#FFFFFF]">
                {counselor.crn}
              </span>
            )}
          </div>
          <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-300 shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Available
          </span>
        </div>

        {/* Portrait Photo + Bio Title (Rectangular Flashcard Portrait Frame) */}
        <div className="flex items-start gap-3.5">
          <div className="w-20 h-26 sm:w-24 sm:h-30 rounded-2xl overflow-hidden border-2 border-[#111111] shadow-xs bg-[#FAFAFA] shrink-0 relative">
            <img 
              src={counselor.avatar_url} 
              alt={counselor.name} 
              className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-300"
              onError={(e) => { (e.target as HTMLImageElement).src = '/logo.png'; }}
            />
          </div>

          <div className="min-w-0 flex-1 space-y-1">
            <h3 className="font-heading font-black text-base sm:text-lg text-[#111111] leading-snug">
              {counselor.name}
            </h3>
            <p className="text-xs font-bold text-[#111111]/75 line-clamp-2">
              {counselor.specialization}
            </p>
            {counselor.education && (
              <p className="text-[11px] font-mono text-[#111111]/60 line-clamp-1">
                🎓 {counselor.education}
              </p>
            )}
            <div className="flex items-center gap-2 pt-0.5 text-[11px] font-mono text-[#111111]">
              <span>⭐ <strong>{counselor.experience}</strong> Exp</span>
              <span>•</span>
              <span className="truncate">🗣️ {counselor.languages.split('&')[0]}</span>
            </div>
          </div>
        </div>

        {/* Quote / Summary Flashcard Body */}
        {counselor.quote && (
          <div className="p-3 rounded-2xl bg-[#FAFAFA] border border-[#111111]/10 text-xs text-[#111111]/85 italic font-serif leading-relaxed line-clamp-3">
            “{counselor.quote.replace('♡', '').trim()}”
          </div>
        )}

        {/* Focus Areas Badges */}
        {counselor.focus_areas && (
          <div className="flex flex-wrap gap-1">
            {counselor.focus_areas.slice(0, 4).map((area, idx) => (
              <span key={idx} className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-[#F4C542]/20 border border-[#F4C542]/40 text-[#111111] font-bold">
                {area.trim()}
              </span>
            ))}
            {counselor.focus_areas.length > 4 && (
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-md bg-[#111111]/5 text-[#111111]/60">
                +{counselor.focus_areas.length - 4} more
              </span>
            )}
          </div>
        )}
      </div>

      {/* Action Footer */}
      <div className="pt-4 mt-3 border-t border-[#111111]/10 grid grid-cols-2 gap-2">
        <button 
          onClick={() => onViewBio?.(counselor)}
          className="py-2.5 px-3 rounded-xl bg-[#FFFFFF] hover:bg-[#111111]/5 text-[#111111] text-xs font-bold border-2 border-[#111111]/25 hover:border-[#111111] transition-all text-center flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
        >
          <BookOpen size={14} />
          <span>Full Bio</span>
        </button>

        <button 
          onClick={() => onSelectBooking?.(counselor.id)}
          className="py-2.5 px-3 rounded-xl bg-[#F4C542] hover:bg-[#e0b435] text-[#111111] text-xs font-black border-2 border-[#111111] transition-all shadow-xs text-center flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
        >
          <Calendar size={14} />
          <span>Book Session</span>
        </button>
      </div>
    </div>
  );
};

export default CounselorFlashcard;
