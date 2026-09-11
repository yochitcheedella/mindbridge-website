import React, { useState, useEffect } from 'react';
import {
  Users, Plus, Trash2, Brain, CheckCircle2, XCircle,
  Search, RefreshCw, Mail, ToggleLeft, ToggleRight,
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { apiFetch } from '../utils/auth';

interface Psychologist {
  id: number;
  name: string;
  specialization: string | null;
  email: string | null;
  is_active: boolean;
}

export default function AdminUsers() {
  const [psychologists, setPsychologists] = useState<Psychologist[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [form, setForm] = useState({
    name: '', specialization: '', email: '', password: '',
  });

  const fetchPsychologists = async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/api/admin/psychologists');
      if (res.ok) {
        const data = await res.json();
        setPsychologists(Array.isArray(data) ? data : []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPsychologists(); }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');
    try {
      const res = await apiFetch('/api/admin/psychologists', {
        method: 'POST',
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Failed to add psychologist');
      }
      const data = await res.json();
      setPsychologists(prev => [...prev, data]);
      setForm({ name: '', specialization: '', email: '', password: '' });
      setShowAddForm(false);
      setSuccess(`Psychologist "${data.name}" added successfully.`);
      setTimeout(() => setSuccess(''), 4000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggle = async (psych: Psychologist) => {
    try {
      const res = await apiFetch(`/api/admin/psychologists/${psych.id}`, {
        method: 'PUT',
        body: JSON.stringify({ is_active: !psych.is_active }),
      });
      if (res.ok) {
        setPsychologists(prev => prev.map(p =>
          p.id === psych.id ? { ...p, is_active: !p.is_active } : p
        ));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Deactivate "${name}"? They will no longer be able to log in.`)) return;
    try {
      await apiFetch(`/api/admin/psychologists/${id}`, { method: 'DELETE' });
      setPsychologists(prev => prev.map(p => p.id === id ? { ...p, is_active: false } : p));
    } catch (e) {
      console.error(e);
    }
  };

  const filtered = psychologists.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.email?.toLowerCase().includes(search.toLowerCase()) ?? false) ||
    (p.specialization?.toLowerCase().includes(search.toLowerCase()) ?? false)
  );

  const active = filtered.filter(p => p.is_active);
  const inactive = filtered.filter(p => !p.is_active);

  return (
    <div className="flex-1 overflow-y-auto bg-background p-4 md:p-6 pb-24">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-bold text-2xl text-white flex items-center gap-2">
              <Users className="text-purple-400" size={24} />
              User Management
            </h1>
            <p className="text-text-muted text-sm mt-0.5">
              Manage VIT psychologist accounts · {active.length} active
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchPsychologists}
              className="p-2 bg-surface border border-border rounded-xl text-text-muted hover:text-white transition-colors"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            </button>
            <button
              onClick={() => setShowAddForm(v => !v)}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-sm font-semibold transition-colors shadow-lg shadow-purple-500/20"
            >
              <Plus size={16} /> Add Psychologist
            </button>
          </div>
        </div>

        {/* Success / Error banners */}
        {success && (
          <div className="mb-4 flex items-center gap-2 px-4 py-3 bg-green-500/10 border border-green-500/20 rounded-xl text-green-400 text-sm">
            <CheckCircle2 size={16} /> {success}
          </div>
        )}

        {/* Add Psychologist Form */}
        {showAddForm && (
          <Card className="p-5 mb-5 border-purple-500/30">
            <h2 className="font-semibold text-white mb-4 flex items-center gap-2">
              <Plus size={16} className="text-purple-400" /> Add New Psychologist
            </h2>
            <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-text-muted mb-1.5 font-medium">Full Name *</label>
                <input
                  required value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="Dr. Priya Sharma"
                  className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-text placeholder-text-muted focus:outline-none focus:border-purple-500/50 transition-all"
                />
              </div>
              <div>
                <label className="block text-xs text-text-muted mb-1.5 font-medium">Specialization</label>
                <input
                  value={form.specialization}
                  onChange={e => setForm(f => ({ ...f, specialization: e.target.value }))}
                  placeholder="Anxiety & Depression"
                  className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-text placeholder-text-muted focus:outline-none focus:border-purple-500/50 transition-all"
                />
              </div>
              <div>
                <label className="block text-xs text-text-muted mb-1.5 font-medium">Email Address *</label>
                <input
                  required type="email" value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  placeholder="psychologist@vishnu.edu.in"
                  className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-text placeholder-text-muted focus:outline-none focus:border-purple-500/50 transition-all"
                />
              </div>
              <div>
                <label className="block text-xs text-text-muted mb-1.5 font-medium">Initial Password *</label>
                <input
                  required type="password" value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  placeholder="Secure password"
                  className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-text placeholder-text-muted focus:outline-none focus:border-purple-500/50 transition-all"
                />
              </div>

              {error && (
                <div className="md:col-span-2 text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                  {error}
                </div>
              )}

              <div className="md:col-span-2 flex items-center gap-3">
                <button
                  type="submit" disabled={submitting}
                  className="px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-50"
                >
                  {submitting ? 'Adding...' : 'Add Psychologist'}
                </button>
                <button
                  type="button" onClick={() => { setShowAddForm(false); setError(''); }}
                  className="px-6 py-2.5 bg-surface border border-border text-text-muted hover:text-white rounded-xl text-sm transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </Card>
        )}

        {/* Search */}
        <Card className="p-4 mb-4">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              type="text" placeholder="Search by name, email, or specialization..."
              value={search} onChange={e => setSearch(e.target.value)}
              className="w-full bg-background border border-border rounded-xl pl-9 pr-4 py-2.5 text-sm text-text placeholder-text-muted focus:outline-none focus:border-purple-500/50 transition-all"
            />
          </div>
        </Card>

        {/* Active Psychologists */}
        <h2 className="font-semibold text-white mb-3 flex items-center gap-2">
          <CheckCircle2 size={16} className="text-green-400" />
          Active ({active.length})
        </h2>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
          </div>
        ) : active.length === 0 ? (
          <Card className="p-8 text-center mb-6">
            <Brain className="text-text-muted mx-auto mb-2" size={24} />
            <p className="text-text-muted text-sm">No active psychologists</p>
            <p className="text-xs text-text-muted/60 mt-1">Add a psychologist using the button above.</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
            {active.map(psych => (
              <Card key={psych.id} className="p-4 border-green-500/10">
                <div className="flex items-start gap-3">
                  <div className="w-11 h-11 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center flex-shrink-0">
                    <Brain className="text-blue-400" size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-white text-sm">{psych.name}</p>
                    {psych.specialization && (
                      <p className="text-xs text-text-muted mt-0.5">{psych.specialization}</p>
                    )}
                    {psych.email && (
                      <p className="text-xs text-text-muted/60 mt-0.5 flex items-center gap-1">
                        <Mail size={10} /> {psych.email}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => handleToggle(psych)}
                      className="p-1.5 text-text-muted hover:text-yellow-400 transition-colors"
                      title="Deactivate"
                    >
                      <ToggleRight size={18} className="text-green-400" />
                    </button>
                    <button
                      onClick={() => handleDelete(psych.id, psych.name)}
                      className="p-1.5 text-text-muted hover:text-red-400 transition-colors"
                      title="Remove"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-green-500/20 text-green-400 border border-green-500/30 rounded-full text-xs font-semibold">
                    Active
                  </span>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Inactive Psychologists */}
        {inactive.length > 0 && (
          <>
            <h2 className="font-semibold text-white mb-3 flex items-center gap-2">
              <XCircle size={16} className="text-red-400" />
              Inactive ({inactive.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {inactive.map(psych => (
                <Card key={psych.id} className="p-4 opacity-60">
                  <div className="flex items-start gap-3">
                    <div className="w-11 h-11 rounded-xl bg-surface border border-border flex items-center justify-center flex-shrink-0">
                      <Brain className="text-text-muted" size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-text-muted text-sm">{psych.name}</p>
                      {psych.specialization && (
                        <p className="text-xs text-text-muted/60 mt-0.5">{psych.specialization}</p>
                      )}
                    </div>
                    <button
                      onClick={() => handleToggle(psych)}
                      className="p-1.5 text-text-muted hover:text-green-400 transition-colors"
                      title="Reactivate"
                    >
                      <ToggleLeft size={18} />
                    </button>
                  </div>
                  <div className="mt-2">
                    <span className="px-2 py-0.5 bg-red-500/20 text-red-400 border border-red-500/30 rounded-full text-xs font-semibold">
                      Inactive
                    </span>
                  </div>
                </Card>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
