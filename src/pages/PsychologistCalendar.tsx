import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar, Clock, CheckCircle2, XCircle, RefreshCw,
  ChevronLeft, ChevronRight, User, PhoneCall,
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { apiFetch } from '../utils/auth';

interface AppointmentItem {
  id: number;
  anonymous_id: string;
  slot_time: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'rescheduled' | 'completed' | string;
  notes: string | null;
}

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  confirmed: { label: 'Confirmed', color: 'bg-[#FFFFFF] text-[#111111] border-2 border-[#111111]' },
  pending: { label: 'Pending', color: 'bg-[#F4C542]/20 text-[#111111] border border-[#F4C542]' },
  cancelled: { label: 'Cancelled', color: 'bg-[#111111]/5 text-[#111111]/60 border border-[#111111]/20' },
  rescheduled: { label: 'Rescheduled', color: 'bg-[#F4C542]/10 text-[#111111] border border-[#F4C542]/30' },
  completed: { label: 'Completed', color: 'bg-[#111111]/10 text-[#111111] border border-[#111111]/30' },
};

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'];

export default function PsychologistCalendar() {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState<AppointmentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [viewDate, setViewDate] = useState(new Date());
  const [tab, setTab] = useState<'calendar' | 'list'>('calendar');

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/api/appointments/psychologist');
      if (res.ok) {
        const data = await res.json();
        setAppointments(Array.isArray(data) ? data : []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAppointments(); }, []);

  const updateStatus = async (id: number, status: 'confirmed' | 'cancelled') => {
    try {
      await apiFetch(`/api/appointments/${id}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status }),
      });
      setAppointments(prev => prev.map(a => a.id === id ? { ...a, status } : a));
    } catch (e) {
      console.error(e);
    }
  };

  // Calendar helpers
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();

  const getApptsForDay = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return appointments.filter(a => a.slot_time.startsWith(dateStr));
  };

  const selectedAppts = selectedDate
    ? appointments.filter(a => {
        const d = new Date(a.slot_time);
        return d.getFullYear() === selectedDate.getFullYear() &&
          d.getMonth() === selectedDate.getMonth() &&
          d.getDate() === selectedDate.getDate();
      })
    : [];

  const upcoming = appointments
    .filter(a => new Date(a.slot_time) >= new Date() && a.status !== 'cancelled')
    .sort((a, b) => new Date(a.slot_time).getTime() - new Date(b.slot_time).getTime());

  return (
    <div className="flex-1 overflow-y-auto bg-[#FFFFFF] p-4 md:p-6 pb-24 text-[#111111]">
      <div className="max-w-5xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-heading font-black text-2xl text-[#111111] flex items-center gap-2">
              <Calendar className="text-[#111111]" size={24} />
              Appointment Calendar
            </h1>
            <p className="text-[#111111]/60 text-sm mt-0.5">
              {appointments.filter(a => a.status === 'confirmed').length} confirmed ·{' '}
              {appointments.filter(a => a.status === 'pending').length} pending
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchAppointments}
              className="flex items-center gap-1.5 px-3 py-2 bg-[#FFFFFF] border border-[#111111]/20 rounded-xl text-sm text-[#111111] hover:bg-[#111111]/5 transition-colors cursor-pointer"
            >
              <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            </button>
            <div className="flex bg-[#FFFFFF] border border-[#111111]/20 rounded-xl overflow-hidden p-0.5">
              {(['calendar', 'list'] as const).map(t => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`px-4 py-1.5 text-xs font-bold rounded-lg capitalize transition-all cursor-pointer ${
                    tab === t 
                      ? 'bg-[#F4C542] text-[#111111] shadow-sm' 
                      : 'text-[#111111]/60 hover:text-[#111111]'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        </div>

        {tab === 'calendar' ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Calendar Grid */}
            <div className="lg:col-span-2">
              <Card className="p-5 bg-[#FFFFFF] border-2 border-[#111111]/10 shadow-sm rounded-3xl">
                {/* Month Nav */}
                <div className="flex items-center justify-between mb-4">
                  <button
                    onClick={() => setViewDate(new Date(year, month - 1))}
                    className="p-2 hover:bg-[#111111]/5 rounded-xl transition-colors text-[#111111] cursor-pointer"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <h2 className="font-heading font-black text-base text-[#111111]">{MONTHS[month]} {year}</h2>
                  <button
                    onClick={() => setViewDate(new Date(year, month + 1))}
                    className="p-2 hover:bg-[#111111]/5 rounded-xl transition-colors text-[#111111] cursor-pointer"
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>

                {/* Day Headers */}
                <div className="grid grid-cols-7 mb-2">
                  {DAYS.map(d => (
                    <div key={d} className="text-center text-xs font-bold text-[#111111]/50 py-2">{d}</div>
                  ))}
                </div>

                {/* Day Cells */}
                <div className="grid grid-cols-7 gap-1.5">
                  {Array.from({ length: firstDay }).map((_, i) => (
                    <div key={`empty-${i}`} />
                  ))}
                  {Array.from({ length: daysInMonth }).map((_, i) => {
                    const day = i + 1;
                    const dayAppts = getApptsForDay(day);
                    const isToday = today.getDate() === day && today.getMonth() === month && today.getFullYear() === year;
                    const isSelected = selectedDate?.getDate() === day && selectedDate?.getMonth() === month && selectedDate?.getFullYear() === year;

                    return (
                      <button
                        key={day}
                        onClick={() => setSelectedDate(new Date(year, month, day))}
                        className={`relative aspect-square flex flex-col items-center justify-center rounded-2xl text-sm font-bold transition-all cursor-pointer
                          ${isSelected 
                            ? 'bg-[#F4C542] text-[#111111] border-2 border-[#111111] shadow-sm' 
                            : isToday 
                            ? 'bg-[#111111]/5 text-[#111111] border-2 border-[#111111]' 
                            : 'hover:bg-[#111111]/5 text-[#111111] border border-transparent'}`}
                      >
                        <span>{day}</span>
                        {dayAppts.length > 0 && (
                          <div className="flex gap-1 mt-1">
                            {dayAppts.slice(0, 3).map((a, idx) => (
                              <div
                                key={idx}
                                className={`w-1.5 h-1.5 rounded-full ${
                                  a.status === 'confirmed' ? 'bg-[#111111]' :
                                  a.status === 'cancelled' ? 'bg-[#111111]/30' : 'bg-[#F4C542] border border-[#111111]'
                                }`}
                              />
                            ))}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </Card>
            </div>

            {/* Selected Day Panel */}
            <div>
              <Card className="p-5 h-full bg-[#FFFFFF] border-2 border-[#111111]/10 shadow-sm rounded-3xl">
                <h3 className="font-heading font-black text-base text-[#111111] mb-4 flex items-center gap-2">
                  <Clock size={16} className="text-[#111111]" />
                  {selectedDate
                    ? `${MONTHS[selectedDate.getMonth()]} ${selectedDate.getDate()}`
                    : 'Select a date'}
                </h3>

                {!selectedDate ? (
                  <p className="text-[#111111]/50 text-sm">Click a date in the calendar to see booked sessions.</p>
                ) : selectedAppts.length === 0 ? (
                  <div className="text-center py-10">
                    <Calendar className="text-[#111111]/30 mx-auto mb-2" size={28} />
                    <p className="text-[#111111]/60 text-sm font-medium">No sessions on this day</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {selectedAppts.map(appt => (
                      <div key={appt.id} className="p-4 bg-[#FFFFFF] rounded-2xl border border-[#111111]/15 shadow-sm space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-xl bg-[#F4C542]/20 border border-[#111111]/10 flex items-center justify-center shrink-0">
                              <User size={14} className="text-[#111111]" />
                            </div>
                            <div>
                              <p className="text-xs font-bold text-[#111111] truncate max-w-[120px]">{appt.anonymous_id}</p>
                              <p className="text-[11px] text-[#111111]/60">
                                {new Date(appt.slot_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </p>
                            </div>
                          </div>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${(STATUS_CONFIG[appt.status] || STATUS_CONFIG.pending).color}`}>
                            {(STATUS_CONFIG[appt.status] || STATUS_CONFIG.pending).label}
                          </span>
                        </div>
                        
                        {appt.status === 'pending' && (
                          <div className="flex gap-2 pt-1">
                            <button
                              onClick={() => updateStatus(appt.id, 'confirmed')}
                              className="flex-1 flex items-center justify-center gap-1 py-2 bg-[#F4C542] hover:bg-[#e0b435] text-[#111111] border-2 border-[#111111] rounded-xl text-xs font-black transition-all cursor-pointer"
                            >
                              <CheckCircle2 size={13} /> Accept Booking
                            </button>
                            <button
                              onClick={() => updateStatus(appt.id, 'cancelled')}
                              className="flex-1 flex items-center justify-center gap-1 py-2 bg-white hover:bg-[#111111] hover:text-white text-[#111111] border border-[#111111] rounded-xl text-xs font-bold transition-all cursor-pointer"
                            >
                              <XCircle size={13} /> Decline
                            </button>
                          </div>
                        )}
                        {appt.status === 'confirmed' && (
                          <div className="pt-1">
                            <button
                              onClick={() => navigate(`/call/${appt.id}`)}
                              className="w-full flex items-center justify-center gap-1.5 py-2.5 bg-[#F4C542] hover:bg-[#e0b435] text-[#111111] border-2 border-[#111111] rounded-xl text-xs font-black transition-all shadow-sm active:scale-95 cursor-pointer"
                            >
                              <PhoneCall size={14} />
                              <span>Start Session</span>
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </div>
          </div>
        ) : (
          /* List View */
          <div className="space-y-3">
            <h2 className="font-heading font-black text-[#111111] text-lg">
              Upcoming Appointments ({upcoming.length})
            </h2>
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="w-8 h-8 border-2 border-[#111111]/30 border-t-[#111111] rounded-full animate-spin" />
              </div>
            ) : upcoming.length === 0 ? (
              <Card className="p-12 text-center bg-[#FFFFFF] border-2 border-[#111111]/10 rounded-3xl">
                <Calendar className="text-[#111111]/30 mx-auto mb-3" size={32} />
                <p className="text-[#111111]/60 font-medium">No upcoming appointments</p>
              </Card>
            ) : (
              upcoming.map(appt => (
                <Card key={appt.id} className="p-4 bg-[#FFFFFF] border border-[#111111]/15 shadow-sm rounded-2xl">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3.5">
                      <div className="w-12 h-12 rounded-xl bg-[#F4C542]/20 border border-[#111111]/10 flex flex-col items-center justify-center flex-shrink-0">
                        <span className="text-[#111111] font-black text-sm">
                          {new Date(appt.slot_time).getDate()}
                        </span>
                        <span className="text-[#111111]/60 text-[10px] uppercase font-bold">
                          {MONTHS[new Date(appt.slot_time).getMonth()].slice(0, 3)}
                        </span>
                      </div>
                      <div>
                        <p className="font-bold text-[#111111] text-sm">{appt.anonymous_id}</p>
                        <p className="text-[#111111]/60 text-xs flex items-center gap-1 mt-0.5">
                          <Clock size={11} className="text-[#111111]" />
                          {new Date(appt.slot_time).toLocaleString([], {
                            weekday: 'short', month: 'short', day: 'numeric',
                            hour: '2-digit', minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 self-end sm:self-auto">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${(STATUS_CONFIG[appt.status] || STATUS_CONFIG.pending).color}`}>
                        {(STATUS_CONFIG[appt.status] || STATUS_CONFIG.pending).label}
                      </span>
                      {appt.status === 'pending' && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => updateStatus(appt.id, 'confirmed')}
                            className="px-3 py-1.5 bg-[#F4C542] hover:bg-[#e0b435] text-[#111111] border-2 border-[#111111] rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1"
                          >
                            <CheckCircle2 size={13} /> Accept Booking
                          </button>
                          <button
                            onClick={() => updateStatus(appt.id, 'cancelled')}
                            className="px-3 py-1.5 bg-white hover:bg-[#111111] hover:text-white text-[#111111] border border-[#111111] rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                          >
                            <XCircle size={13} /> Decline
                          </button>
                        </div>
                      )}
                      {appt.status === 'confirmed' && (
                        <button
                          onClick={() => navigate(`/call/${appt.id}`)}
                          className="px-4 py-2 bg-[#F4C542] hover:bg-[#e0b435] text-[#111111] border-2 border-[#111111] rounded-xl text-xs font-black transition-all flex items-center gap-1.5 shadow-sm active:scale-95 cursor-pointer"
                        >
                          <PhoneCall size={14} />
                          <span>Start Session</span>
                        </button>
                      )}
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
