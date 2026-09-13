import React, { useState, useEffect } from 'react';
import { 
  Calendar, MapPin, Clock, Users, Sparkles, CheckCircle2, 
  Search, Filter, Heart, ArrowRight, Share2, Tag, BellRing 
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { OFFICIAL_COUNSELORS, VISHNU_WELLNESS_CENTRE } from '../data/counselors';

export interface WellnessEvent {
  id: string;
  title: string;
  category: 'Workshop' | 'Orientation' | 'Awareness' | 'Interactive Club' | 'Digital Detox';
  institution: string;
  date: string;
  time: string;
  venue: string;
  facilitator: string;
  facilitator_role: string;
  description: string;
  attendees_count: number;
  max_capacity: number;
  tags: string[];
  is_featured?: boolean;
}

export const INITIAL_EVENTS: WellnessEvent[] = [
  {
    id: 'evt-1',
    title: 'COPE Open Mic: Voices of Wellness & Student Expression',
    category: 'Interactive Club',
    institution: 'Vishnu Institute of Technology (VIT)',
    date: '18 Sept 2026',
    time: '4:30 PM - 6:30 PM',
    venue: 'Open Air Amphitheatre, Academic Block 2',
    facilitator: 'Ram Prudhvi Teja',
    facilitator_role: 'Senior Wellness Counsellor & Incharge',
    description: 'An open, non-judgmental space for students to share poetry, music, lived experiences, and thoughts on emotional resilience. Refreshments and certificate of participation provided.',
    attendees_count: 85,
    max_capacity: 150,
    tags: ['COPE Club', 'Music & Poetry', 'Peer Support'],
    is_featured: true,
  },
  {
    id: 'evt-2',
    title: '5-Hour Digital Detox: Unplug & Connect Challenge',
    category: 'Digital Detox',
    institution: 'Smt. B. Seetha Polytechnic College (SBSP)',
    date: '21 Sept 2026',
    time: '2:00 PM - 7:00 PM',
    venue: 'Hostel Recreation Grounds & Lawn',
    facilitator: 'Bantu Anumitha & Sahithi Challa',
    facilitator_role: 'Wellness Counsellor & Forensic Psychologist',
    description: 'Spend 5 wholesome hours without smartphones or screens! Enjoy acoustic jam sessions, retro team games, group dance, mindfulness art, and real peer conversations.',
    attendees_count: 64,
    max_capacity: 80,
    tags: ['Digital Detox', 'Interactive Games', 'Hostel Special'],
    is_featured: true,
  },
  {
    id: 'evt-3',
    title: 'Know Your Worth & Confidence Beyond Comfort Zone',
    category: 'Workshop',
    institution: 'Vishnu Dental College (VDC)',
    date: '24 Sept 2026',
    time: '10:30 AM - 12:30 PM',
    venue: 'VDC Mini Auditorium, Ground Floor',
    facilitator: 'Angel Mariam Benny',
    facilitator_role: 'Wellness Counsellor, VDC',
    description: 'Tailored for healthcare and clinical students facing clinical exam anxiety, self-doubt, and patient interaction stress. Practical cognitive toolkits provided.',
    attendees_count: 48,
    max_capacity: 60,
    tags: ['Self-Worth', 'Confidence', 'Exam Resilience'],
  },
  {
    id: 'evt-4',
    title: 'MINDTAP Radio Vishnu: Live Interactive Wellness Broadcast',
    category: 'Awareness',
    institution: 'Sri Vishnu Educational Society (All Campuses)',
    date: '26 Sept 2026',
    time: '5:00 PM - 6:00 PM',
    venue: 'Radio Vishnu 90.4 FM Studio & Online Stream',
    facilitator: 'Ram Prudhvi Teja & Guest Counsellors',
    facilitator_role: 'Radio Vishnu Host',
    description: 'Tune in to our monthly campus broadcast answering anonymous student dilemmas on hostel life, peer relationships, and academic focus.',
    attendees_count: 310,
    max_capacity: 500,
    tags: ['Radio Vishnu', 'Anonymous Q&A', 'MindTap'],
  },
  {
    id: 'evt-5',
    title: 'HOPE Club: Understanding Human Behaviour from a Layman’s Perspective',
    category: 'Interactive Club',
    institution: 'Vishnu Women\'s University (VWU)',
    date: '28 Sept 2026',
    time: '3:30 PM - 5:00 PM',
    venue: 'Seminar Hall 3, Department of IT',
    facilitator: 'Devika Babu',
    facilitator_role: 'Wellness Counsellor, VWU',
    description: 'Demystifying human emotions, micro-habits, interpersonal boundaries, and psychology without complex jargon. Fun psychoeducational activities included!',
    attendees_count: 52,
    max_capacity: 75,
    tags: ['HOPE Club', 'Human Behavior', 'Psychoeducation'],
  },
  {
    id: 'evt-6',
    title: 'Freshers Wellness Orientation: Thriving in College Life',
    category: 'Orientation',
    institution: 'Shri Vishnu College of Pharmacy (SVCP)',
    date: '30 Sept 2026',
    time: '11:00 AM - 1:00 PM',
    venue: 'SVCP Main Auditorium',
    facilitator: 'Akshitha Selvaraj',
    facilitator_role: 'Wellness Counsellor, SVCP',
    description: 'Introduction to confidential counselling services, free psychological support, stress management techniques, and meeting your designated campus counsellor.',
    attendees_count: 120,
    max_capacity: 200,
    tags: ['Freshers 2026', 'Campus Transition', 'VWC Intro'],
  }
];

export default function StudentEvents() {
  const [events, setEvents] = useState<WellnessEvent[]>(() => {
    try {
      const stored = localStorage.getItem('mindbridge_campus_events');
      return stored ? JSON.parse(stored) : INITIAL_EVENTS;
    } catch {
      return INITIAL_EVENTS;
    }
  });

  const [registeredIds, setRegisteredIds] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem('mindbridge_registered_events');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedCampus, setSelectedCampus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [toastMessage, setToastMessage] = useState<string>('');

  const handleRegister = (eventId: string, title: string) => {
    let updated: string[];
    if (registeredIds.includes(eventId)) {
      updated = registeredIds.filter(id => id !== eventId);
      setToastMessage(`Unregistered from "${title}"`);
    } else {
      updated = [...registeredIds, eventId];
      setToastMessage(`🎉 Successfully registered for "${title}"! Check your notifications.`);
    }
    setRegisteredIds(updated);
    localStorage.setItem('mindbridge_registered_events', JSON.stringify(updated));
    setTimeout(() => setToastMessage(''), 4000);
  };

  const filteredEvents = events.filter(e => {
    const matchesCategory = selectedCategory === 'ALL' || e.category === selectedCategory;
    const matchesCampus = selectedCampus === 'ALL' || e.institution.toLowerCase().includes(selectedCampus.toLowerCase());
    const matchesSearch = 
      e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.facilitator.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesCampus && matchesSearch;
  });

  const categories = ['ALL', 'Workshop', 'Orientation', 'Awareness', 'Interactive Club', 'Digital Detox'];
  const campuses = ['ALL', 'VIT', 'SVECW', 'VDC', 'SVCP', 'SBSP', 'VWU'];

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in max-w-7xl mx-auto pb-24 text-[#111111]">
      {/* ── Toast Alert ── */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 p-4 rounded-2xl bg-[#F4C542] border-2 border-[#111111] shadow-xl text-[#111111] font-black text-xs sm:text-sm flex items-center gap-3 animate-slide-up">
          <Sparkles size={18} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ── Top Hero Canopy ── */}
      <div className="rounded-3xl bg-[#FFFFFF] border-2 border-[#111111] p-6 sm:p-8 shadow-sm relative overflow-hidden">
        <div className="max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F4C542] border border-[#111111] text-xs font-mono font-black uppercase">
            <Calendar size={13} />
            <span>Vishnu Wellness Centre (VWC) • Campus Events</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-heading font-black tracking-tight text-[#111111]">
            Empowering Programmes & Student Workshops
          </h1>
          <p className="text-sm sm:text-base text-[#111111]/75 leading-relaxed">
            Join our expert wellness counsellors for life-enriching group sessions, open mic events, digital detox camps, and mindfulness workshops across all Sri Vishnu campuses.
          </p>
          <div className="flex flex-wrap items-center gap-2 pt-2">
            <span className="text-xs font-mono font-bold bg-[#FAFAFA] px-3 py-1 rounded-xl border border-[#111111]/15">
              🎓 100% Free for All Students
            </span>
            <span className="text-xs font-mono font-bold bg-[#FAFAFA] px-3 py-1 rounded-xl border border-[#111111]/15">
              🤝 Non-Judgmental Spaces
            </span>
            <span className="text-xs font-mono font-bold bg-[#FAFAFA] px-3 py-1 rounded-xl border border-[#111111]/15">
              📜 Official Participation Recognition
            </span>
          </div>
        </div>
      </div>

      {/* ── Search & Filter Controls ── */}
      <div className="p-4 sm:p-5 rounded-3xl bg-[#FFFFFF] border border-[#111111]/15 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#111111]/50" size={18} />
            <input 
              type="text"
              placeholder="Search event title, speaker or topic..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-[#FAFAFA] border border-[#111111]/15 text-xs sm:text-sm font-medium focus:outline-none focus:border-[#111111] transition-all"
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
            <span className="text-xs font-mono font-bold text-[#111111]/60 whitespace-nowrap">Campus:</span>
            {campuses.map(campus => (
              <button
                key={campus}
                onClick={() => setSelectedCampus(campus)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  selectedCampus === campus
                    ? 'bg-[#111111] text-[#FFFFFF]'
                    : 'bg-[#FAFAFA] text-[#111111]/70 hover:bg-[#111111]/5 border border-[#111111]/15'
                }`}
              >
                {campus}
              </button>
            ))}
          </div>
        </div>

        {/* Category Filter Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <span className="text-xs font-mono font-bold text-[#111111]/60 whitespace-nowrap">Category:</span>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-[#F4C542] text-[#111111] border-2 border-[#111111] shadow-xs'
                  : 'bg-[#FAFAFA] text-[#111111]/70 hover:bg-[#111111]/5 border border-[#111111]/15'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* ── Events Grid ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredEvents.map((event) => {
          const isRegistered = registeredIds.includes(event.id);
          return (
            <div 
              key={event.id}
              className={`rounded-3xl p-6 bg-[#FFFFFF] border-2 transition-all flex flex-col justify-between shadow-xs hover:-translate-y-1 ${
                event.is_featured ? 'border-[#111111] ring-2 ring-[#F4C542]/40' : 'border-[#111111]/15 hover:border-[#111111]'
              }`}
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <span className="px-2.5 py-1 rounded-lg bg-[#F4C542]/20 border border-[#F4C542]/50 text-[#111111] text-[10px] font-mono font-black uppercase">
                    {event.category}
                  </span>
                  {event.is_featured && (
                    <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                      <Sparkles size={11} /> Featured
                    </span>
                  )}
                </div>

                <div>
                  <h3 className="text-base sm:text-lg font-heading font-black text-[#111111] leading-snug">
                    {event.title}
                  </h3>
                  <p className="text-xs text-[#111111]/70 mt-2 line-clamp-3 leading-relaxed">
                    {event.description}
                  </p>
                </div>

                {/* Event Logistics Metadata */}
                <div className="space-y-2 pt-2 border-t border-[#111111]/10 text-xs text-[#111111]/80 font-medium">
                  <div className="flex items-center gap-2">
                    <Calendar size={14} className="text-[#111111] shrink-0" />
                    <span>{event.date} • <strong className="text-[#111111]">{event.time}</strong></span>
                  </div>
                  <div className="flex items-start gap-2">
                    <MapPin size={14} className="text-[#111111] shrink-0 mt-0.5" />
                    <span className="line-clamp-1">{event.venue}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users size={14} className="text-[#111111] shrink-0" />
                    <span className="truncate">Facilitator: <strong className="text-[#111111]">{event.facilitator}</strong></span>
                  </div>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-1 pt-1">
                  {event.tags.map(t => (
                    <span key={t} className="text-[9px] font-mono px-2 py-0.5 rounded-md bg-[#FAFAFA] border border-[#111111]/15 text-[#111111]/70">
                      #{t}
                    </span>
                  ))}
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-5 mt-4 border-t border-[#111111]/10 flex items-center justify-between gap-3">
                <div className="text-[11px] font-mono text-[#111111]/60">
                  <strong className="text-[#111111] font-bold">{event.attendees_count + (isRegistered ? 1 : 0)}</strong> / {event.max_capacity} Seats
                </div>

                <button
                  onClick={() => handleRegister(event.id, event.title)}
                  className={`px-4 py-2.5 rounded-2xl font-black text-xs transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 ${
                    isRegistered
                      ? 'bg-emerald-500 text-white border-2 border-[#111111] shadow-xs'
                      : 'bg-[#F4C542] hover:bg-[#e0b435] text-[#111111] border-2 border-[#111111] shadow-xs'
                  }`}
                >
                  {isRegistered ? (
                    <>
                      <CheckCircle2 size={14} />
                      <span>Registered</span>
                    </>
                  ) : (
                    <>
                      <BellRing size={14} />
                      <span>RSVP Free</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
