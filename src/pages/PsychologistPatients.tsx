import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, AlertTriangle, Search, Filter,
  ChevronRight, TrendingDown, TrendingUp, Minus,
  RefreshCw, Shield,
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { apiFetch } from '../utils/auth';

interface Patient {
  anonymous_id: string;
  risk_score: number;
  department: string;
  year: number;
}

const getRiskLevel = (score: number) => {
  if (score >= 0.86) return { label: 'Critical', color: 'bg-red-500/20 text-red-400 border-red-500/30', dot: 'bg-red-500', icon: AlertTriangle };
  if (score >= 0.61) return { label: 'High', color: 'bg-orange-500/20 text-orange-400 border-orange-500/30', dot: 'bg-orange-500', icon: TrendingDown };
  if (score >= 0.31) return { label: 'Moderate', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', dot: 'bg-yellow-500', icon: Minus };
  return { label: 'Low', color: 'bg-green-500/20 text-green-400 border-green-500/30', dot: 'bg-green-500', icon: TrendingUp };
};

export default function PsychologistPatients() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterLevel, setFilterLevel] = useState<'all' | 'critical' | 'high' | 'moderate' | 'low'>('all');
  const navigate = useNavigate();

  const fetchPatients = async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/api/risk/queue');
      if (res.ok) {
        const data = await res.json();
        setPatients(Array.isArray(data) ? data : []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPatients(); }, []);

  const filtered = patients.filter(p => {
    const matchSearch = p.anonymous_id.toLowerCase().includes(search.toLowerCase()) ||
      p.department.toLowerCase().includes(search.toLowerCase());
    if (!matchSearch) return false;
    const level = getRiskLevel(p.risk_score).label.toLowerCase();
    if (filterLevel === 'all') return true;
    return level === filterLevel;
  });

  const stats = {
    critical: patients.filter(p => p.risk_score >= 0.86).length,
    high: patients.filter(p => p.risk_score >= 0.61 && p.risk_score < 0.86).length,
    moderate: patients.filter(p => p.risk_score >= 0.31 && p.risk_score < 0.61).length,
    low: patients.filter(p => p.risk_score < 0.31).length,
  };

  return (
    <div className="flex-1 overflow-y-auto bg-background p-4 md:p-6 pb-24">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-bold text-2xl text-white flex items-center gap-2">
              <Users className="text-blue-400" size={24} />
              All Patients
            </h1>
            <p className="text-text-muted text-sm mt-0.5">
              Anonymous patient list — sorted by risk score
            </p>
          </div>
          <button
            onClick={fetchPatients}
            className="flex items-center gap-2 px-3 py-2 bg-surface border border-border rounded-xl text-sm text-text-muted hover:text-white transition-colors"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>

        {/* Risk Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {[
            { key: 'critical', label: 'Critical', color: 'border-red-500/30 bg-red-500/5', dot: 'bg-red-500', text: 'text-red-400' },
            { key: 'high', label: 'High', color: 'border-orange-500/30 bg-orange-500/5', dot: 'bg-orange-500', text: 'text-orange-400' },
            { key: 'moderate', label: 'Moderate', color: 'border-yellow-500/30 bg-yellow-500/5', dot: 'bg-yellow-500', text: 'text-yellow-400' },
            { key: 'low', label: 'Low', color: 'border-green-500/30 bg-green-500/5', dot: 'bg-green-500', text: 'text-green-400' },
          ].map(({ key, label, color, dot, text }) => (
            <button
              key={key}
              onClick={() => setFilterLevel(filterLevel === key as any ? 'all' : key as any)}
              className={`p-4 rounded-2xl border ${color} transition-all ${filterLevel === key ? 'ring-2 ring-white/10' : ''}`}
            >
              <div className="flex items-center gap-2 mb-1">
                <div className={`w-2 h-2 rounded-full ${dot}`} />
                <span className={`text-xs font-semibold ${text}`}>{label}</span>
              </div>
              <p className="font-bold text-2xl text-white">{stats[key as keyof typeof stats]}</p>
            </button>
          ))}
        </div>

        {/* Search + Filter */}
        <Card className="p-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
              <input
                type="text"
                placeholder="Search by alias or department..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full bg-background border border-border rounded-xl pl-9 pr-4 py-2.5 text-sm text-text placeholder-text-muted focus:outline-none focus:border-blue-500/50 transition-all"
              />
            </div>
            <div className="flex items-center gap-1 text-xs text-text-muted">
              <Filter size={12} />
              <span>{filtered.length} shown</span>
            </div>
          </div>
        </Card>

        {/* Patient List */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <Card className="p-12 text-center">
            <Users className="text-text-muted mx-auto mb-3" size={32} />
            <p className="text-text-muted">No patients found</p>
            <p className="text-xs text-text-muted/60 mt-1">
              {patients.length === 0
                ? 'No students have risk scores yet.'
                : 'Try adjusting your search or filter.'}
            </p>
          </Card>
        ) : (
          <div className="space-y-3">
            {filtered.map(patient => {
              const risk = getRiskLevel(patient.risk_score);
              const RiskIcon = risk.icon;
              return (
                <Card
                  key={patient.anonymous_id}
                  className="p-4 hover:border-blue-500/30 transition-all cursor-pointer group"
                  onClick={() => navigate('/psychologist/dashboard', { state: { selectedAlias: patient.anonymous_id } })}
                >
                  <div className="flex items-center gap-4">
                    {/* Avatar */}
                    <div className="w-11 h-11 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center flex-shrink-0">
                      <Shield className="text-blue-400" size={18} />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold text-white text-sm truncate">{patient.anonymous_id}</p>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${risk.color} flex items-center gap-1`}>
                          <RiskIcon size={10} />
                          {risk.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-text-muted">
                        <span>{patient.department}</span>
                        <span>·</span>
                        <span>Year {patient.year}</span>
                      </div>
                    </div>

                    {/* Risk Score */}
                    <div className="text-right flex-shrink-0">
                      <p className="font-bold text-lg text-white">{Math.round(patient.risk_score * 100)}</p>
                      <p className="text-xs text-text-muted">Risk Score</p>
                    </div>

                    {/* Arrow */}
                    <ChevronRight size={16} className="text-text-muted group-hover:text-blue-400 group-hover:translate-x-1 transition-all" />
                  </div>

                  {/* Risk Progress Bar */}
                  <div className="mt-3 h-1.5 bg-surface rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        patient.risk_score >= 0.86 ? 'bg-red-500' :
                        patient.risk_score >= 0.61 ? 'bg-orange-500' :
                        patient.risk_score >= 0.31 ? 'bg-yellow-500' : 'bg-green-500'
                      }`}
                      style={{ width: `${patient.risk_score * 100}%` }}
                    />
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
