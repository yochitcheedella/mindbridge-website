import React, { useState } from 'react';
import { Shield, ArrowLeft } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { apiFetch } from '../utils/auth';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await apiFetch('/api/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      if (res.ok) {
        setMessage('If an account exists, an OTP has been sent. (Use 123456 for demo)');
        setTimeout(() => navigate(`/reset-password?email=${encodeURIComponent(email)}`), 3000);
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
        
        <h2 className="text-2xl font-heading font-bold text-center mb-2">Forgot Password</h2>
        <p className="text-text-muted text-center text-sm mb-6">Enter your university email to receive an OTP.</p>
        
        {message && (
          <div className="mb-4 p-3 bg-primary/10 text-primary text-sm rounded-lg text-center font-medium">
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
              placeholder="student@vishnu.edu.in"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary-hover transition-colors disabled:opacity-50"
          >
            {loading ? 'Sending...' : 'Send OTP'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link to="/login" className="inline-flex items-center gap-2 text-sm text-text-muted hover:text-primary transition-colors">
            <ArrowLeft size={16} /> Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}
