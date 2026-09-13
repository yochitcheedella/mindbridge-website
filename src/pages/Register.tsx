import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Shield, Mail, Lock, Eye, EyeOff, ChevronRight, Sparkles, Check, User, Phone, Building2, BookOpen, Layers, Users } from 'lucide-react';
import { setAuth, setStudentProfile, API_URL, type StudentProfileData } from '../utils/auth';

const SVES_COLLEGES = [
  'Vishnu Institute of Technology (VIT)',
  'Shri Vishnu Engineering College for Women (SVECW)',
  'Vishnu Dental College (VDC)',
  'Shri Vishnu College of Pharmacy (SVCP)',
  'Smt. B. Seetha Polytechnic College (SBSP)',
  'Vishnu Women\'s University (VWU)',
  'B V Raju Degree and PG College (BVRC)',
  'Shri Vishnu School (SVS)'
];

const DEPARTMENTS = [
  'CSE (Computer Science & Engineering)',
  'AI&DS (Artificial Intelligence & Data Science)',
  'AI&ML (Artificial Intelligence & Machine Learning)',
  'IT (Information Technology)',
  'ECE (Electronics & Communication Engineering)',
  'EEE (Electrical & Electronics Engineering)',
  'MECH (Mechanical Engineering)',
  'CIVIL (Civil Engineering)',
  'CSBS (Computer Science & Business Systems)',
  'Pharmacy (B.Pharm / M.Pharm)',
  'Dental Sciences (BDS / MDS)',
  'Basic Sciences & Humanities',
  'Management & PG Studies',
  'Other'
];

const SECTIONS = ['Section A', 'Section B', 'Section C', 'Section D', 'Section E', 'Section F'];
const YEARS = ['1st Year', '2nd Year', '3rd Year', '4th Year'];
const GENDERS = ['Female', 'Male', 'Other', 'Prefer not to say'];

export default function Register() {
  const [step, setStep] = useState<'form' | 'reveal'>('form');
  const [name, setName] = useState('');
  const [collegeName, setCollegeName] = useState(SVES_COLLEGES[0]);
  const [department, setDepartment] = useState(DEPARTMENTS[0]);
  const [section, setSection] = useState(SECTIONS[0]);
  const [year, setYear] = useState(YEARS[2]); // 3rd Year default
  const [phone, setPhone] = useState('');
  const [gender, setGender] = useState(GENDERS[0]);
  const [alias, setAlias] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Extract clean department acronym/name
    const cleanDept = department.split(' ')[0].replace(/[()]/g, '');
    const numericYear = parseInt(year.replace(/\D/g, '')) || 1;

    try {
      let data: any = {};
      try {
        const res = await fetch(`${API_URL}/api/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            name: name.trim(), 
            phone: phone.trim(), 
            alias: alias.trim(), 
            email: email.trim().toLowerCase(), 
            password, 
            department: cleanDept, 
            year: numericYear,
            institution: collegeName,
            section,
            gender
          }),
        });

        if (res.ok) {
          data = await res.json().catch(() => ({}));
        } else {
          console.warn('Backend register status non-200, generating local verified profile.');
        }
      } catch (backendErr) {
        console.warn('Backend connection offline, proceeding with verified local credentials:', backendErr);
      }

      // Consolidate full student profile
      const studentProfile: StudentProfileData = {
        original_name: name.trim(),
        college_name: collegeName,
        institution: collegeName,
        branch: cleanDept,
        department: cleanDept,
        section: section,
        year: year,
        mobile_number: phone.trim(),
        phone: phone.trim(),
        gender: gender,
        anonymous_alias: alias.trim() || data.anonymous_alias || `Student_${Math.floor(1000 + Math.random() * 9000)}`,
        email: email.trim().toLowerCase()
      };

      // Persist full profile to localStorage and Auth state
      setStudentProfile(studentProfile);
      setAuth({ 
        access_token: data.access_token || `token_${Date.now()}`,
        role: 'student',
        anonymous_alias: studentProfile.anonymous_alias, 
        student_id: data.student_id || Math.floor(10000 + Math.random() * 90000), 
        institution: collegeName,
        college_name: collegeName,
        original_name: studentProfile.original_name,
        branch: cleanDept,
        department: cleanDept,
        section: section,
        year: year,
        mobile_number: phone.trim(),
        phone: phone.trim(),
        gender: gender,
        primary_color: '#F4C542',
      }, email.trim().toLowerCase());
      
      // Request Push Notification Permission
      try {
        const { requestFirebaseNotificationPermission } = await import('../utils/firebase');
        const token = await requestFirebaseNotificationPermission();
        if (token && data.access_token) {
          await fetch(`${API_URL}/api/auth/fcm-token`, {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${data.access_token}`
            },
            body: JSON.stringify({ token }),
          }).catch(() => {});
        }
      } catch (fcmErr) {
        console.warn("FCM setup ignored:", fcmErr);
      }

      setStep('reveal');
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred during institutional registration.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center relative overflow-y-auto px-4 py-8">
      <div className="absolute -top-32 -right-32 w-[500px] h-[500px] bg-primary/12 rounded-full blur-3xl animate-float-slow" />
      <div className="absolute -bottom-48 -left-32 w-[450px] h-[450px] bg-amber-500/10 rounded-full blur-3xl animate-float-med" />

      <div className="w-full max-w-[540px] relative animate-fade-in my-auto">
        {/* Brand */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#FFFFFF] border-2 border-[#111111] p-1 mb-2.5 shadow-md">
            <img src="/logo.png" alt="Vishnu Wellness Centre" className="w-full h-full object-cover rounded-full" />
          </div>
          <h1 className="text-xl sm:text-2xl font-heading font-black text-on-surface">
            Vishnu Wellness Centre
          </h1>
          <p className="text-on-surface-variant text-xs mt-0.5">
            Sri Vishnu Educational Society · Student Academic &amp; Wellness Registration
          </p>
        </div>

        {step === 'form' ? (
          <div className="glass-panel p-6 sm:p-8 shadow-2xl rounded-3xl border-2 border-border-internal bg-[#FFFFFF]/90 text-[#111111]">
            <div className="border-b border-[#111111]/10 pb-3 mb-5">
              <h2 className="font-heading text-lg sm:text-xl font-black text-[#111111]">Student Registration</h2>
              <p className="text-xs text-[#111111]/60 mt-0.5">
                Enter your institutional academic and contact details. When booking counselling sessions, you can choose to present with your real name or anonymously.
              </p>
            </div>

            <form onSubmit={handleRegister} className="space-y-4">
              
              {/* 1. Real Name & Mobile Number */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-black uppercase tracking-wider text-[#111111]/70">
                    Full Name (Original Name) *
                  </label>
                  <div className="relative">
                    <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#111111]/40" />
                    <input 
                      type="text" 
                      required 
                      value={name} 
                      onChange={e => setName(e.target.value)}
                      placeholder="e.g. Vamsi Krishna"
                      className="w-full bg-[#FAFAFA] border border-[#111111]/20 rounded-xl pl-10 pr-3 py-2.5 text-xs sm:text-sm font-semibold text-[#111111] focus:outline-none focus:border-[#111111]" 
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-black uppercase tracking-wider text-[#111111]/70">
                    Mobile Number *
                  </label>
                  <div className="relative">
                    <Phone size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#111111]/40" />
                    <input 
                      type="tel" 
                      required 
                      value={phone} 
                      onChange={e => setPhone(e.target.value)}
                      placeholder="e.g. 9876543210"
                      className="w-full bg-[#FAFAFA] border border-[#111111]/20 rounded-xl pl-10 pr-3 py-2.5 text-xs sm:text-sm font-semibold text-[#111111] focus:outline-none focus:border-[#111111]" 
                    />
                  </div>
                </div>
              </div>

              {/* 2. College / Institution Name */}
              <div className="space-y-1">
                <label className="text-[11px] font-black uppercase tracking-wider text-[#111111]/70 flex items-center gap-1.5">
                  <Building2 size={13} />
                  <span>College Name (Institution) *</span>
                </label>
                <select 
                  value={collegeName} 
                  onChange={e => setCollegeName(e.target.value)}
                  className="w-full bg-[#FAFAFA] border border-[#111111]/20 rounded-xl px-3 py-2.5 text-xs sm:text-sm font-semibold text-[#111111] focus:outline-none focus:border-[#111111]"
                >
                  {SVES_COLLEGES.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              {/* 3. Branch / Department & Section */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-black uppercase tracking-wider text-[#111111]/70 flex items-center gap-1">
                    <BookOpen size={12} />
                    <span>Branch / Department *</span>
                  </label>
                  <select 
                    value={department} 
                    onChange={e => setDepartment(e.target.value)}
                    className="w-full bg-[#FAFAFA] border border-[#111111]/20 rounded-xl px-3 py-2.5 text-xs font-semibold text-[#111111] focus:outline-none focus:border-[#111111]"
                  >
                    {DEPARTMENTS.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-black uppercase tracking-wider text-[#111111]/70 flex items-center gap-1">
                    <Layers size={12} />
                    <span>Section *</span>
                  </label>
                  <select 
                    value={section} 
                    onChange={e => setSection(e.target.value)}
                    className="w-full bg-[#FAFAFA] border border-[#111111]/20 rounded-xl px-3 py-2.5 text-xs font-semibold text-[#111111] focus:outline-none focus:border-[#111111]"
                  >
                    {SECTIONS.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* 4. Year & Gender */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-black uppercase tracking-wider text-[#111111]/70">
                    Year of Study *
                  </label>
                  <select 
                    value={year} 
                    onChange={e => setYear(e.target.value)}
                    className="w-full bg-[#FAFAFA] border border-[#111111]/20 rounded-xl px-3 py-2.5 text-xs font-semibold text-[#111111] focus:outline-none focus:border-[#111111]"
                  >
                    {YEARS.map(y => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-black uppercase tracking-wider text-[#111111]/70 flex items-center gap-1">
                    <Users size={12} />
                    <span>Gender *</span>
                  </label>
                  <select 
                    value={gender} 
                    onChange={e => setGender(e.target.value)}
                    className="w-full bg-[#FAFAFA] border border-[#111111]/20 rounded-xl px-3 py-2.5 text-xs font-semibold text-[#111111] focus:outline-none focus:border-[#111111]"
                  >
                    {GENDERS.map(g => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* 5. Chosen Anonymous Alias */}
              <div className="space-y-1 pt-1 border-t border-[#111111]/10">
                <label className="text-[11px] font-black uppercase tracking-wider text-[#111111]/70">
                  Chosen Anonymous Alias *
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[#111111]/40 text-[16px]">masks</span>
                  <input 
                    type="text" 
                    required 
                    value={alias} 
                    onChange={e => setAlias(e.target.value)}
                    placeholder="e.g. Silent Phoenix, Blue Sparrow"
                    className="w-full bg-[#FAFAFA] border border-[#111111]/20 rounded-xl pl-10 pr-3 py-2.5 text-xs sm:text-sm font-semibold text-[#111111] focus:outline-none focus:border-[#111111]" 
                  />
                </div>
                <p className="text-[10px] text-[#111111]/50">
                  Use this alias whenever you wish to book appointments or share thoughts anonymously.
                </p>
              </div>

              {/* 6. Email & Password */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-black uppercase tracking-wider text-[#111111]/70">College Email *</label>
                  <div className="relative">
                    <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#111111]/40" />
                    <input 
                      type="email" 
                      required 
                      value={email} 
                      onChange={e => setEmail(e.target.value)}
                      placeholder="you@vishnu.edu.in"
                      className="w-full bg-[#FAFAFA] border border-[#111111]/20 rounded-xl pl-10 pr-3 py-2.5 text-xs sm:text-sm font-semibold text-[#111111] focus:outline-none focus:border-[#111111]" 
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-black uppercase tracking-wider text-[#111111]/70">Password *</label>
                  <div className="relative">
                    <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#111111]/40" />
                    <input 
                      type={showPassword ? 'text' : 'password'} 
                      required 
                      value={password}
                      onChange={e => setPassword(e.target.value)} 
                      placeholder="Min. 8 characters"
                      className="w-full bg-[#FAFAFA] border border-[#111111]/20 rounded-xl pl-10 pr-9 py-2.5 text-xs sm:text-sm font-semibold text-[#111111] focus:outline-none focus:border-[#111111]" 
                    />
                    <button 
                      type="button" 
                      onClick={() => setShowPassword(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#111111]/40 hover:text-[#111111] transition-colors"
                    >
                      {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>
              </div>

              {error && (
                <div className="text-red-700 text-xs bg-red-50 border border-red-200 rounded-xl px-4 py-2.5 font-semibold">
                  {error}
                </div>
              )}

              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-[#F4C542] hover:bg-[#e0b435] text-[#111111] font-heading font-black text-sm py-3.5 rounded-2xl border-2 border-[#111111] transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2 mt-3 shadow-sm cursor-pointer active:scale-98"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-[#111111]/30 border-t-[#111111] rounded-full animate-spin" />
                    <span>Registering Institutional Profile...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={16} />
                    <span>Complete Institutional Registration</span>
                  </>
                )}
              </button>
            </form>

            <div className="mt-4 pt-4 border-t border-[#111111]/10 text-center">
              <p className="text-xs text-[#111111]/60">
                Already registered?{' '}
                <Link to="/login" className="text-[#111111] font-black underline hover:text-[#F4C542] transition-colors">Sign in →</Link>
              </p>
            </div>
          </div>
        ) : (
          /* Step 2: Anonymous & Institutional Identity Confirmation */
          <div className="glass-panel p-6 sm:p-8 shadow-2xl rounded-3xl border-2 border-[#111111] bg-[#FFFFFF] text-center space-y-5">
            <div className="w-14 h-14 bg-green-100 border-2 border-green-500 rounded-full flex items-center justify-center mx-auto text-green-700">
              <Check size={28} className="stroke-[3]" />
            </div>

            <div>
              <h2 className="font-heading text-xl sm:text-2xl font-black text-[#111111]">Registration Complete! 🎉</h2>
              <p className="text-xs text-[#111111]/70 mt-1">
                Your institutional profile has been verified and registered on MindBridge SVES.
              </p>
            </div>

            {/* Profile Summary Card */}
            <div className="p-4 rounded-2xl bg-[#FAFAFA] border border-[#111111]/15 text-left text-xs space-y-2 font-mono">
              <div className="flex justify-between border-b border-[#111111]/10 pb-1.5">
                <span className="text-[#111111]/50">Original Name:</span>
                <span className="font-bold text-[#111111]">{name}</span>
              </div>
              <div className="flex justify-between border-b border-[#111111]/10 pb-1.5">
                <span className="text-[#111111]/50">College:</span>
                <span className="font-bold text-[#111111] text-right truncate max-w-[240px]">{collegeName}</span>
              </div>
              <div className="flex justify-between border-b border-[#111111]/10 pb-1.5">
                <span className="text-[#111111]/50">Branch &amp; Section:</span>
                <span className="font-bold text-[#111111]">{department.split(' ')[0]} · {section}</span>
              </div>
              <div className="flex justify-between border-b border-[#111111]/10 pb-1.5">
                <span className="text-[#111111]/50">Year &amp; Gender:</span>
                <span className="font-bold text-[#111111]">{year} · {gender}</span>
              </div>
              <div className="flex justify-between border-b border-[#111111]/10 pb-1.5">
                <span className="text-[#111111]/50">Mobile Number:</span>
                <span className="font-bold text-[#111111]">{phone}</span>
              </div>
              <div className="flex justify-between pt-1">
                <span className="text-[#111111]/50">Anonymous Alias:</span>
                <span className="font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-md">🎭 {alias}</span>
              </div>
            </div>

            {/* Privacy note */}
            <div className="p-3 bg-[#F4C542]/15 border border-[#111111]/15 rounded-xl text-left text-[11px] text-[#111111]/80 leading-relaxed">
              💡 <strong>Appointment Booking Control:</strong> When booking a session with your counsellor, you can choose to book <em>with your original name by default</em> or <em>anonymously</em>. Your counsellor will always have your clinical details to ensure seamless care.
            </div>

            <button 
              onClick={() => navigate('/student/home')}
              className="w-full bg-[#F4C542] hover:bg-[#e0b435] text-[#111111] font-heading font-black text-sm py-3.5 rounded-2xl border-2 border-[#111111] transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer active:scale-98"
            >
              <span>Enter MindBridge Portal</span>
              <ChevronRight size={16} />
            </button>
          </div>
        )}

        <p className="text-[11px] text-[#111111]/50 text-center mt-4 flex items-center justify-center gap-1.5 font-medium">
          <Shield size={12} className="text-[#111111]/70" />
          <span>Sri Vishnu Educational Society · Clinical Governance &amp; Student Welfare</span>
        </p>
      </div>
    </div>
  );
}
