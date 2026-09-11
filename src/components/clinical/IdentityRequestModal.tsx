import React, { useState } from 'react';
import { ShieldAlert, X, AlertTriangle, UserCheck } from 'lucide-react';
import { API_URL } from '../../utils/auth';

interface IdentityRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  anonymousId: string;
  onSuccess: (data: any) => void;
}

export function IdentityRequestModal({ isOpen, onClose, anonymousId, onSuccess }: IdentityRequestModalProps) {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [identityData, setIdentityData] = useState<{real_name: string, real_email: string, real_phone: string} | null>(null);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleRequest = async () => {
    if (!reason.trim()) {
      setError("You must provide a clinical justification for this breach of anonymity.");
      return;
    }
    setLoading(true);
    setError('');
    
    try {
      const res = await fetch(`${API_URL}/api/psychologist/student/${encodeURIComponent(anonymousId)}/request-identity`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason })
      });
      const data = await res.json();
      if (res.ok) {
        setIdentityData(data);
        onSuccess(data);
      } else {
        setError(data.detail || "Request denied. Identity reveals are strictly for critical risk cases.");
      }
    } catch (err) {
      setError("Failed to connect to server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
      <div className="bg-surface border border-border w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-fade-in relative">
        <button onClick={onClose} className="absolute top-4 right-4 p-2 text-text-muted hover:text-text bg-background/50 rounded-full transition-colors">
          <X size={20} />
        </button>

        {!identityData ? (
          <div className="p-8">
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 rounded-2xl bg-error/10 border-2 border-error/20 flex items-center justify-center animate-pulse">
                <ShieldAlert className="text-error" size={32} />
              </div>
            </div>
            
            <h2 className="text-2xl font-heading font-black text-center mb-2">Emergency Identity Reveal</h2>
            <p className="text-text-muted text-center text-sm mb-6 leading-relaxed">
              You are requesting to break the anonymity of student <span className="font-mono font-bold text-text">{anonymousId}</span>. 
              This action is strictly audited and only permitted when there is an imminent risk of self-harm or threat to life.
            </p>

            {error && (
              <div className="mb-6 p-4 rounded-xl bg-error/10 text-error text-sm font-medium border border-error/20 flex items-start gap-3">
                <AlertTriangle size={18} className="flex-shrink-0 mt-0.5" />
                <p>{error}</p>
              </div>
            )}

            <div className="mb-6">
              <label className="block text-sm font-bold text-text mb-2">Clinical Justification (Required for Audit)</label>
              <textarea
                className="w-full h-32 bg-background border border-border rounded-xl p-4 text-text focus:outline-none focus:border-error transition-colors"
                placeholder="Detail the imminent risk factors that necessitate breaking anonymity..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </div>

            <div className="flex gap-4">
              <button onClick={onClose} className="flex-1 py-4 font-bold text-text bg-background hover:bg-surface-bright rounded-xl transition-colors border border-border">
                Cancel
              </button>
              <button onClick={handleRequest} disabled={loading} className="flex-1 py-4 font-bold text-white bg-error hover:bg-red-600 rounded-xl transition-colors shadow-lg shadow-error/20 disabled:opacity-50">
                {loading ? 'Requesting...' : 'I Confirm, Break Anonymity'}
              </button>
            </div>
          </div>
        ) : (
          <div className="p-8 text-center animate-fade-in">
             <div className="flex justify-center mb-6">
              <div className="w-16 h-16 rounded-2xl bg-success/10 border-2 border-success/20 flex items-center justify-center">
                <UserCheck className="text-success" size={32} />
              </div>
            </div>
            <h2 className="text-2xl font-heading font-black mb-2 text-success">Identity Revealed</h2>
            <p className="text-text-muted text-sm mb-8">
              An immutable record (<code className="text-primary font-mono font-bold">CLINICAL_IDENTITY_REVEAL</code>) has been permanently committed to the database <strong className="text-text">AuditLog</strong> table in accordance with SRS Section 16.
            </p>
            
            <div className="bg-background border border-border rounded-xl p-6 text-left space-y-4 mb-8">
              <div>
                <p className="text-xs text-text-muted font-bold uppercase tracking-wider mb-1">Legal Name</p>
                <p className="text-lg font-medium">{identityData.real_name}</p>
              </div>
              <div>
                <p className="text-xs text-text-muted font-bold uppercase tracking-wider mb-1">VIT Email Address</p>
                <p className="text-lg font-medium">{identityData.real_email}</p>
              </div>
              <div>
                <p className="text-xs text-text-muted font-bold uppercase tracking-wider mb-1">Emergency Phone</p>
                <p className="text-lg font-medium">{identityData.real_phone}</p>
              </div>
            </div>

            <button onClick={onClose} className="w-full py-4 font-bold text-white bg-primary hover:bg-primary-hover rounded-xl transition-colors shadow-lg shadow-primary/20">
              Close & Initiate Protocol
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
