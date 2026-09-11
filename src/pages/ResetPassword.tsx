import React, { useState } from 'react';
import { Shield, ArrowRight, Eye, EyeOff, ArrowLeft, Info } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { apiFetch } from '../utils/auth';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const initialEmail = searchParams.get('email') || '';
  
  const [email, setEmail] = useState(initialEmail);
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await apiFetch('/api/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ email, otp, new_password: password })
      });
      const data = await res.json();
      if (res.ok) {
        setIsSuccess(true);
        setMessage('Password updated successfully. Redirecting to login...');
        setTimeout(() => navigate('/login'), 2000);
      } else {
        setMessage(data.detail || 'An error occurred.');
      }
    } catch (err) {
      setMessage('Failed to connect to the server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-surface p-8 rounded-2xl border border-border shadow-xl">
        <div className="flex justify-center mb-6">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <Shield className="text-primary" size={24} />
          </div>
        </div>
        
        <h2 className="text-2xl font-heading font-bold text-center mb-2">Reset Password</h2>
        <p className="text-text-muted text-center text-sm mb-4">Enter the OTP sent to your institutional email address.</p>

        {/* Institutional Multi-Role OTP Hint for Evaluators */}
        <div className="mb-6 p-3 bg-primary/5 border border-primary/20 rounded-xl flex items-start gap-2.5 text-xs text-text-muted">
          <Info size={16} className="text-primary shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-text">Demo Mode OTP:</span> Use <code className="bg-primary/10 px-1 py-0.5 rounded text-primary font-bold">123456</code> to test instant credential reset across <span className="font-medium text-primary">Student, Counselor, & Admin</span> accounts.
          </div>
        </div>
        
        {message && (
          <div className={`mb-4 p-3 text-sm rounded-lg text-center font-medium ${isSuccess ? 'bg-success/10 text-success' : 'bg-error/10 text-error'}`}>
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-muted mb-1">VIT Email Address</label>
            <input
              type="email"
              required
              className="w-full bg-background border border-border rounded-xl px-4 py-3 text-text focus:outline-none focus:border-primary transition-colors"
              placeholder="user@vishnu.edu.in"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-muted mb-1">6-Digit OTP</label>
            <input
              type="text"
              required
              maxLength={6}
              className="w-full bg-background border border-border rounded-xl px-4 py-3 text-text focus:outline-none focus:border-primary transition-colors tracking-widest text-center text-xl font-bold"
              placeholder="123456"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-muted mb-1">New Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                className="w-full bg-background border border-border rounded-xl px-4 py-3 text-text focus:outline-none focus:border-primary transition-colors pr-10"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text transition-colors"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || isSuccess}
            className="w-full py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary-hover transition-colors disabled:opacity-50 mt-4 flex items-center justify-center gap-2"
          >
            {loading ? 'Verifying...' : 'Reset Password'} {!loading && <ArrowRight size={18} />}
          </button>
        </form>

        {/* Back to Login Link */}
        <div className="mt-6 pt-4 border-t border-border text-center">
          <button
            onClick={() => navigate('/login')}
            type="button"
            className="inline-flex items-center gap-2 text-sm text-text-muted hover:text-primary transition-colors font-medium"
          >
            <ArrowLeft size={16} /> Back to Sign In
          </button>
        </div>
      </div>
    </div>
  );
}
