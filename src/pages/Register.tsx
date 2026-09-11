import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Shield, Mail, Lock, Eye, EyeOff, ChevronRight, Sparkles, Check, User, Phone } from 'lucide-react';
import { setAuth, API_URL } from '../utils/auth';

const DEPARTMENTS = ['CSE', 'AI&DS', 'AI&ML', 'EEE', 'IT', 'CSBS', 'ECE', 'MECH', 'CIVIL', 'Other'];

export default function Register() {
  const [step, setStep] = useState<'form' | 'reveal'>('form');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [alias, setAlias] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [department, setDepartment] = useState('CSE');
  const [year, setYear] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();



  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
        const numericYear = typeof year === 'number' ? year : (parseInt(String(year).replace(/\D/g, '')) || 1);
        const res = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name: name.trim(), 
          phone: phone.trim(), 
          alias: alias.trim(), 
          email: email.trim().toLowerCase(), 
          password, 
          department, 
          year: numericYear 
        }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        const msg = typeof d.detail === 'string'
          ? d.detail
          : (Array.isArray(d.detail)
              ? d.detail.map((x: any) => x.msg || x).join(', ')
              : (d.message || 'Registration failed'));
        throw new Error(msg);
      }
      const data = await res.json();
      setAuth({ 
        access_token: data.access_token,
        role: 'student',
        anonymous_alias: data.anonymous_alias, 
        student_id: data.student_id, 
        institution: data.institution,
        primary_color: data.primary_color || '#6366f1',
      });
      
      // Request Push Notification Permission
      try {
        const { requestFirebaseNotificationPermission } = await import('../utils/firebase');
        const token = await requestFirebaseNotificationPermission();
        if (token) {
          await fetch(`${API_URL}/api/auth/fcm-token`, {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${data.access_token}`
            },
            body: JSON.stringify({ token }),
          });
        }
      } catch (fcmErr) {
        console.warn("FCM setup failed:", fcmErr);
      }

      setStep('reveal');
    } catch (err: any) {
      if (err.message === 'Failed to fetch' || err.name === 'TypeError') {
        setError("Connecting to server... If the server was idle, it may take 15-30 seconds to respond. Please tap again.");
      } else {
        setError(err.message || 'An unexpected error occurred during institutional registration.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center relative overflow-y-auto px-4 py-12">
      <div className="absolute -top-32 -right-32 w-[500px] h-[500px] bg-primary/12 rounded-full blur-3xl animate-float-slow" />
      <div className="absolute -bottom-48 -left-32 w-[450px] h-[450px] bg-purple-900/15 rounded-full blur-3xl animate-float-med" />

      <div className="w-full max-w-[440px] relative animate-fade-in my-auto">
        {/* Brand */}
        <div className="text-center mb-7">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 border border-primary/30 p-1 mb-3 shadow-lg shadow-primary/15">
            <img src="/logo.png" alt="Vishnu Wellness Centre" className="w-full h-full object-cover rounded-full drop-shadow-md" />
          </div>
          <h1 className="text-2xl font-heading font-bold text-on-surface">
            Vishnu Wellness Centre
          </h1>
          <p className="text-on-surface-variant text-sm mt-1">Sri Vishnu Educational Society · Your identity stays anonymous.</p>
        </div>

        {step === 'form' ? (
          <div className="glass-panel p-8 shadow-2xl shadow-black/40 rounded-2xl border border-border-internal">
            <h2 className="font-heading text-xl font-bold mb-1 text-on-surface">Create your account</h2>
            <p className="text-on-surface-variant text-sm mb-6">Choose your alias. Your real details are securely encrypted.</p>

            <form onSubmit={handleRegister} className="space-y-4">
              
              <div className="grid grid-cols-2 gap-3">
                {/* Real Name */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Real Name</label>
                  <div className="relative">
                    <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant" />
                    <input type="text" required value={name} onChange={e => setName(e.target.value)}
                      placeholder="Jane Doe"
                      className="w-full bg-surface-container-low border border-border-internal rounded-xl pl-10 pr-4 py-3 text-sm text-on-surface placeholder-on-surface-variant focus:outline-none focus:border-interactive-primary transition-all" />
                  </div>
                </div>

                {/* Phone */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Phone</label>
                  <div className="relative">
                    <Phone size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant" />
                    <input type="tel" required value={phone} onChange={e => setPhone(e.target.value)}
                      placeholder="+91..."
                      className="w-full bg-surface-container-low border border-border-internal rounded-xl pl-10 pr-4 py-3 text-sm text-on-surface placeholder-on-surface-variant focus:outline-none focus:border-interactive-primary transition-all" />
                  </div>
                </div>
              </div>

              {/* Alias */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Chosen Anonymous Name (Visible to Counselors)</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant text-[16px]">masks</span>
                  <input type="text" required value={alias} onChange={e => setAlias(e.target.value)}
                    placeholder="e.g. Blue Sparrow"
                    className="w-full bg-surface-container-low border border-border-internal rounded-xl pl-10 pr-4 py-3 text-sm text-on-surface placeholder-on-surface-variant focus:outline-none focus:border-interactive-primary transition-all" />
                </div>
                <p className="text-[11px] text-on-surface-variant/80">
                  This anonymous name will be visible to psychologists during counseling sessions. If another student already uses it, a private tag (e.g. #4821) is automatically appended.
                </p>
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">College Email</label>
                <div className="relative">
                  <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant" />
                  <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                    placeholder="you@vishnu.edu.in"
                    className="w-full bg-surface-container-low border border-border-internal rounded-xl pl-10 pr-4 py-3 text-sm text-on-surface placeholder-on-surface-variant focus:outline-none focus:border-interactive-primary transition-all" />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Password</label>
                <div className="relative">
                  <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant" />
                  <input type={showPassword ? 'text' : 'password'} required value={password}
                    onChange={e => setPassword(e.target.value)} placeholder="Min. 8 characters"
                    className="w-full bg-surface-container-low border border-border-internal rounded-xl pl-10 pr-10 py-3 text-sm text-on-surface placeholder-on-surface-variant focus:outline-none focus:border-interactive-primary transition-all" />
                  <button type="button" onClick={() => setShowPassword(v => !v)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface transition-colors">
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>


              {/* Department + Year */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Department</label>
                  <select value={department} onChange={e => setDepartment(e.target.value)} style={{ colorScheme: 'dark' }}
                    className="w-full bg-surface-container-low border border-border-internal rounded-xl px-3 py-3 text-sm text-on-surface focus:outline-none focus:border-interactive-primary transition-all">
                    {DEPARTMENTS.map(d => <option key={d} value={d} style={{ background: '#131317' }}>{d}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Year</label>
                  <select value={year} onChange={e => setYear(Number(e.target.value))} style={{ colorScheme: 'dark' }}
                    className="w-full bg-surface-container-low border border-border-internal rounded-xl px-3 py-3 text-sm text-on-surface focus:outline-none focus:border-interactive-primary transition-all">
                    {[1, 2, 3, 4].map(y => <option key={y} value={y} style={{ background: '#131317' }}>Year {y}</option>)}
                  </select>
                </div>
              </div>

              {error && (
                <div className="text-error text-sm bg-error/10 border border-error/20 rounded-lg px-4 py-3">{error}</div>
              )}

              <button type="submit" disabled={loading}
                className="w-full bg-interactive-primary hover:brightness-110 text-on-primary font-bold py-3 rounded-xl transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2 mt-2 shadow-lg shadow-interactive-primary/20">
                {loading ? (
                  <><div className="w-4 h-4 border-2 border-on-primary/30 border-t-on-primary rounded-full animate-spin" /> Creating account...</>
                ) : (
                  <><Sparkles size={16} /><span>Create Anonymous Identity</span></>
                )}
              </button>
            </form>

            <div className="mt-5 pt-5 border-t border-border-internal text-center">
              <p className="text-sm text-on-surface-variant">
                Already have an account?{' '}
                <Link to="/login" className="text-primary hover:brightness-110 font-bold transition-colors">Sign in →</Link>
              </p>
            </div>
          </div>
        ) : (
          /* Step 2: Anonymous Identity Reveal */
          <div className="glass-panel p-8 shadow-2xl shadow-black/40 rounded-2xl border border-border-internal animate-scale-in text-center">
            <div className="w-16 h-16 bg-[#a1f3c3]/15 border border-[#a1f3c3]/30 rounded-full flex items-center justify-center mx-auto mb-5">
              <Check size={28} className="text-[#a1f3c3]" />
            </div>
            <h2 className="font-heading text-2xl font-bold mb-2 text-on-surface">You're in! 🎉</h2>
            <p className="text-on-surface-variant text-sm mb-7">
              Your identity has been created. This is how you'll be known throughout the platform — no one can link this to you.
            </p>

            {/* Alias Card */}
            <div className="bg-primary/10 border border-primary/25 rounded-2xl p-6 mb-6">
              <p className="text-xs text-on-surface-variant uppercase tracking-wider font-semibold mb-2">Your Chosen Alias</p>
              <p className="font-heading text-2xl font-bold text-primary tracking-wide">{alias}</p>
              <p className="text-xs text-on-surface-variant mt-3 leading-relaxed">
                Psychologists and institution staff will only ever see this name — never your real identity.
              </p>
            </div>

            {/* Privacy bullets */}
            <div className="space-y-2.5 text-left mb-7">
              {[
                'Your real name and email are securely encrypted',
                'Counselors only see your chosen alias',
                'Identity revealed only in verified emergencies',
                'All conversations are completely private',
              ].map(pt => (
                <div key={pt} className="flex items-start gap-2.5 text-sm text-on-surface-variant">
                  <Check size={14} className="text-[#a1f3c3] shrink-0 mt-0.5" />
                  {pt}
                </div>
              ))}
            </div>

            <button onClick={() => navigate('/student/home')}
              className="w-full bg-interactive-primary hover:brightness-110 text-on-primary font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-interactive-primary/20">
              Enter Dashboard <ChevronRight size={16} />
            </button>
          </div>
        )}

        <p className="text-xs text-on-surface-variant text-center mt-4 flex items-center justify-center gap-1.5">
          <Shield size={10} className="text-primary" />
          Privacy-first · VIT-only platform · FERPA aligned
        </p>
      </div>
    </div>
  );
}
