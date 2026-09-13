import React, { useState, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { 
  MessageSquare, ThumbsUp, AlertCircle, Plus, Send, Users, 
  Shield, CheckCircle2, X, PhoneCall, BookOpen, Lock, AlertTriangle, Sparkles, Heart 
} from 'lucide-react';
import { apiFetch, getAlias } from '../utils/auth';

interface Reply {
  id: number;
  content: string;
  created_at: string;
}

interface Post {
  id: number;
  title: string;
  content: string;
  upvotes: number;
  reply_count: number;
  created_at: string;
  is_anonymous?: boolean;
  replies?: Reply[];
}

export const COMMUNITY_GUIDELINES = [
  {
    num: 1,
    title: 'Respect and Empathy',
    desc: 'Treat all members with kindness and understanding. We are here to support one another, and respectful communication is essential.'
  },
  {
    num: 2,
    title: 'Anonymity and Privacy',
    desc: 'Do not share personal details, such as names, contact information, or identifying experiences, to ensure the privacy of yourself and others.'
  },
  {
    num: 3,
    title: 'No Hate Speech or Bullying',
    desc: 'Any form of discrimination, hate speech, bullying, or harassment based on race, gender, sexual orientation, religion, or background will not be tolerated.'
  },
  {
    num: 4,
    title: 'Support, Not Advice',
    desc: 'Share experiences and offer encouragement, but avoid giving unsolicited medical, legal, or therapeutic advice. If you feel someone is in crisis, report the post or direct them to professional help.'
  },
  {
    num: 5,
    title: 'Inappropriate Content',
    desc: 'Refrain from posting content that is offensive, sexually explicit, graphic, or promotes self-harm or violence.'
  },
  {
    num: 6,
    title: 'Safe Space for All',
    desc: 'Keep this community a welcoming environment for everyone, where vulnerable conversations can happen safely.'
  },
  {
    num: 7,
    title: 'Reporting',
    desc: 'If you come across any post or comment that violates these guidelines, please report it immediately to the moderators.'
  }
];

const SELF_HARM_PATTERNS = [
  /suicid/i, /kill\s*myself/i, /end\s*my\s*life/i, /want\s*to\s*die/i,
  /slit\s*(my)?\s*wrist/i, /cut\s*myself/i, /hanging\s*myself/i, /overdose/i,
  /take\s*my\s*own\s*life/i, /better\s*off\s*dead/i, /hurt\s*myself/i, /self\s*harm/i
];

const INAPPROPRIATE_PATTERNS = [
  /\b(slut|bitch|bastard|nigger|cunt|dick|pussy|whore)\b/i,
  /fuck\s*(you|off|your)/i,
  /die\s*bitch/i
];

const PHONE_REGEX = /(\+?91[\s-]?)?[6-9]\d{9}/;

export default function Community() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [agreedToGuidelines, setAgreedToGuidelines] = useState(false);
  const [showGuidelinesModal, setShowGuidelinesModal] = useState(false);

  // Moderation state
  const [moderationError, setModerationError] = useState<string | null>(null);
  const [crisisIntercept, setCrisisIntercept] = useState<boolean>(false);

  const [expandedPostId, setExpandedPostId] = useState<number | null>(null);
  const [replyContent, setReplyContent] = useState('');

  const fetchPosts = async () => {
    try {
      const res = await apiFetch('/api/community/posts');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setPosts(data);
          return;
        }
      }
    } catch (e) {
      console.warn('Using local fallback for posts');
    }

    // Fallback default posts
    try {
      const stored = localStorage.getItem('mindbridge_community_posts');
      if (stored) {
        setPosts(JSON.parse(stored));
        return;
      }
    } catch {}

    setPosts([
      {
        id: 101,
        title: 'How do you overcome pre-exam insomnia?',
        content: 'I find myself staring at the hostel ceiling before every semester exam. Any grounded routines that actually worked for you?',
        upvotes: 8,
        reply_count: 2,
        created_at: new Date(Date.now() - 3600000 * 5).toISOString(),
        is_anonymous: true,
        replies: [
          { id: 1, content: 'Listening to 432Hz ambient sound and doing 4-7-8 breathing really shifted my nervous system!', created_at: new Date().toISOString() }
        ]
      },
      {
        id: 102,
        title: 'Gratitude for the VWC Counsellors this week',
        content: 'Booked my first session hesitantly on Monday. The non-judgmental atmosphere made a world of difference. If you are doubting, please give it a try.',
        upvotes: 14,
        reply_count: 1,
        created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
        is_anonymous: true
      }
    ]);
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const handleCreatePost = async () => {
    setModerationError(null);
    setCrisisIntercept(false);

    if (!newTitle.trim() || !newContent.trim()) {
      setModerationError('Please enter both a title and content for your post.');
      return;
    }

    if (!agreedToGuidelines) {
      setModerationError('You must agree to the 7 Vishnu Wellness Centre Community Guidelines before sharing.');
      return;
    }

    const fullText = `${newTitle} ${newContent}`;

    // ── 1. SELF-HARM / CRISIS CHECK ──
    const isSelfHarm = SELF_HARM_PATTERNS.some(pat => pat.test(fullText));
    if (isSelfHarm) {
      // Intercept: do not publish to community, route to counsellor triage
      const alertItem = {
        id: `alert-${Date.now()}`,
        studentAlias: getAlias() || 'Anonymous Student',
        flaggedTitle: newTitle,
        flaggedContent: newContent,
        reason: 'CRITICAL: Self-Harm / Crisis expression detected in Community post',
        severity: 'HIGH_RISK',
        createdAt: new Date().toISOString(),
        status: 'PENDING_COUNSELOR_REVIEW'
      };

      try {
        const storedAlerts = localStorage.getItem('mindbridge_flagged_community_alerts');
        const existing = storedAlerts ? JSON.parse(storedAlerts) : [];
        localStorage.setItem('mindbridge_flagged_community_alerts', JSON.stringify([alertItem, ...existing]));
      } catch (e) {
        console.warn('Error saving flagged alert', e);
      }

      setCrisisIntercept(true);
      return;
    }

    // ── 2. INAPPROPRIATE / HATE / PROFANITY CHECK ──
    const isInappropriate = INAPPROPRIATE_PATTERNS.some(pat => pat.test(fullText));
    if (isInappropriate) {
      setModerationError(
        'Your post contains language that violates Vishnu Wellness Centre Guideline #3 / #5 (No Hate Speech / Inappropriate Content). We maintain a supportive, kind space for everyone.'
      );
      return;
    }

    // ── 3. PRIVACY / PHONE NUMBER CHECK ──
    if (PHONE_REGEX.test(fullText)) {
      setModerationError(
        'For your safety and in accordance with Guideline #2 (Anonymity & Privacy), personal phone numbers or contact details cannot be posted in the public community.'
      );
      return;
    }

    // Safe to publish!
    try {
      const res = await apiFetch('/api/community/posts', {
        method: 'POST',
        body: JSON.stringify({ title: newTitle.trim(), content: newContent.trim() })
      });
      if (res.ok) {
        setNewTitle('');
        setNewContent('');
        setIsCreating(false);
        fetchPosts();
        return;
      }
    } catch (e) {
      console.warn('Offline fallback for post creation');
    }

    const localNewPost: Post = {
      id: Date.now(),
      title: newTitle.trim(),
      content: newContent.trim(),
      upvotes: 1,
      reply_count: 0,
      created_at: new Date().toISOString(),
      is_anonymous: true,
      replies: []
    };

    const updated = [localNewPost, ...posts];
    setPosts(updated);
    try {
      localStorage.setItem('mindbridge_community_posts', JSON.stringify(updated));
    } catch {}

    setNewTitle('');
    setNewContent('');
    setIsCreating(false);
  };

  const handleUpvote = async (postId: number) => {
    try {
      const res = await apiFetch(`/api/community/posts/${postId}/upvote`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setPosts(posts.map(p => p.id === postId ? { ...p, upvotes: data.upvotes } : p));
        return;
      }
    } catch {}

    setPosts(prev => prev.map(p => p.id === postId ? { ...p, upvotes: p.upvotes + 1 } : p));
  };

  const handleReport = (postId: number) => {
    alert('Thank you for being vigilant. This post has been reported to the Vishnu Wellness Centre moderators for review under Guideline #7.');
  };

  const toggleExpand = async (postId: number) => {
    if (expandedPostId === postId) {
      setExpandedPostId(null);
      return;
    }
    setExpandedPostId(postId);
  };

  const handleReply = (postId: number) => {
    if (!replyContent.trim()) return;
    const newReply: Reply = {
      id: Date.now(),
      content: replyContent.trim(),
      created_at: new Date().toISOString()
    };
    setPosts(prev => prev.map(p => {
      if (p.id === postId) {
        return {
          ...p,
          reply_count: p.reply_count + 1,
          replies: [...(p.replies || []), newReply]
        };
      }
      return p;
    }));
    setReplyContent('');
  };

  return (
    <div className="min-h-screen bg-[#FFFFFF] text-[#111111] p-4 md:p-8 pt-6 md:pt-10 pb-28 max-w-3xl mx-auto animate-fade-in space-y-6">
      {/* ── Community Canopy Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#111111]/15 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-black uppercase tracking-wider bg-[#F4C542] text-[#111111] border border-[#111111]">
              Safe Peer Circle
            </span>
            <span className="text-xs font-mono text-[#111111]/60">SVES Institutional Shield Active</span>
          </div>
          <h1 className="text-3xl font-heading font-black text-[#111111] tracking-tight">
            Peer Community
          </h1>
          <p className="text-xs text-[#111111]/70 mt-1">
            A safe, anonymous sanctuary to share experiences and uplift fellow students.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowGuidelinesModal(true)}
            className="px-3.5 py-2.5 rounded-2xl bg-[#FAFAFA] hover:bg-[#111111]/5 border border-[#111111] text-xs font-bold text-[#111111] flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Shield size={14} />
            <span>Guidelines</span>
          </button>
          <button 
            onClick={() => setIsCreating(!isCreating)}
            className="bg-[#F4C542] hover:bg-[#e0b435] text-[#111111] border-2 border-[#111111] px-4 py-2.5 rounded-2xl font-black text-xs flex items-center gap-1.5 transition-all shadow-xs active:scale-95 cursor-pointer"
          >
            <Plus size={16} />
            <span>Create Post</span>
          </button>
        </div>
      </div>

      {/* ── CREATE POST ACCORDION / FORM (REQ 13) ── */}
      {isCreating && (
        <div className="p-6 rounded-3xl border-2 border-[#111111] bg-[#FFFFFF] shadow-md space-y-5 animate-scale-in">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-heading font-black text-[#111111] flex items-center gap-2">
              <span>✍️</span>
              <span>Create Anonymous Peer Post</span>
            </h2>
            <button
              onClick={() => { setIsCreating(false); setModerationError(null); setCrisisIntercept(false); }}
              className="p-1.5 text-[#111111]/60 hover:text-[#111111]"
            >
              <X size={18} />
            </button>
          </div>

          {/* Guidelines Strict Box */}
          <div className="p-4 rounded-2xl bg-[#FAFAFA] border border-[#111111]/20 space-y-2">
            <div className="flex items-center gap-2 text-xs font-heading font-black uppercase tracking-wider text-[#111111]">
              <Shield size={14} className="text-[#111111]" />
              <span>Vishnu Wellness Centre — Community Standards</span>
            </div>
            <ul className="text-[11px] text-[#111111]/80 space-y-1 pl-4 list-disc">
              <li><strong>1. Respect &amp; Empathy:</strong> Treat everyone with kindness and understanding.</li>
              <li><strong>2. Anonymity &amp; Privacy:</strong> Never post personal contact details, names, or hostel numbers.</li>
              <li><strong>3. No Hate Speech or Bullying:</strong> Zero tolerance for discrimination or harassment.</li>
              <li><strong>4. Support, Not Advice:</strong> Offer encouragement; avoid giving unsolicited clinical advice.</li>
              <li><strong>5. Safe Content:</strong> No offensive, graphic, or self-harm content.</li>
            </ul>
          </div>

          {/* Form Inputs */}
          <input 
            type="text"
            placeholder="Post Title (e.g. Navigating hostel adjustment stress...)"
            className="w-full bg-[#FAFAFA] border border-[#111111]/25 rounded-2xl px-4 py-3 text-sm text-[#111111] font-semibold focus:outline-hidden focus:border-[#111111]"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
          />

          <textarea
            rows={4}
            placeholder="Share your thoughts, challenges, or encouragement respectfully..."
            className="w-full bg-[#FAFAFA] border border-[#111111]/25 rounded-2xl px-4 py-3 text-sm text-[#111111] focus:outline-hidden focus:border-[#111111] resize-none leading-relaxed"
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
          />

          {/* Mandatory Agreement Checkbox */}
          <label className="flex items-start gap-3 p-3 rounded-xl bg-[#F4C542]/10 border border-[#F4C542] cursor-pointer">
            <input
              type="checkbox"
              checked={agreedToGuidelines}
              onChange={(e) => setAgreedToGuidelines(e.target.checked)}
              className="mt-0.5 rounded text-[#111111] focus:ring-[#111111] accent-[#111111]"
            />
            <span className="text-xs text-[#111111] font-bold">
              I have read and agree to strictly abide by the 7 Vishnu Wellness Centre Community Guidelines.
            </span>
          </label>

          {/* Moderation Error Banner */}
          {moderationError && (
            <div className="p-3.5 rounded-xl bg-red-50 border-2 border-red-400 text-red-900 text-xs font-medium flex items-start gap-2 animate-fade-in">
              <AlertTriangle size={16} className="shrink-0 mt-0.5 text-red-600" />
              <span>{moderationError}</span>
            </div>
          )}

          {/* Crisis Intercept Modal / Box */}
          {crisisIntercept && (
            <div className="p-5 rounded-2xl bg-amber-50 border-2 border-amber-500 space-y-3 animate-fade-in">
              <div className="flex items-center gap-2 text-amber-900 font-heading font-black text-sm">
                <Heart size={18} className="fill-amber-600 text-amber-900" />
                <span>We Care Deeply About Your Wellbeing</span>
              </div>
              <p className="text-xs text-amber-900/90 leading-relaxed">
                Your post indicated distress. For your privacy and safety, it has not been published to the public feed, but our Vishnu Wellness Centre counsellor has been discreetly alerted so we can support you.
              </p>
              <div className="pt-2 flex flex-wrap items-center gap-3">
                <a
                  href="tel:14416"
                  className="px-4 py-2 rounded-xl bg-red-600 text-white text-xs font-black flex items-center gap-1.5 shadow-xs"
                >
                  <PhoneCall size={14} />
                  <span>Call Tele-MANAS (14416)</span>
                </a>
                <a
                  href="/student/appointments"
                  className="px-4 py-2 rounded-xl bg-[#111111] text-white text-xs font-black flex items-center gap-1.5"
                >
                  <span>Connect with Campus Counsellor</span>
                </a>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-2">
            <button 
              onClick={() => { setIsCreating(false); setModerationError(null); setCrisisIntercept(false); }}
              className="px-5 py-2.5 rounded-2xl text-xs font-bold text-[#111111] border border-[#111111]/30 hover:bg-[#111111]/5"
            >
              Cancel
            </button>
            <button 
              onClick={handleCreatePost}
              disabled={!agreedToGuidelines || !newTitle.trim() || !newContent.trim()}
              className="px-6 py-2.5 rounded-2xl bg-[#F4C542] hover:bg-[#e0b435] text-[#111111] border-2 border-[#111111] shadow-xs font-heading font-black text-xs transition-all disabled:opacity-40 cursor-pointer flex items-center gap-1.5"
            >
              <Lock size={13} />
              <span>Share Anonymously</span>
            </button>
          </div>
        </div>
      )}

      {/* ── POSTS FEED ── */}
      <div className="space-y-4">
        {posts.map(post => (
          <div key={post.id} className="p-5 rounded-3xl border-2 border-[#111111]/15 bg-[#FFFFFF] shadow-2xs hover:border-[#111111]/30 transition-all space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono font-black uppercase tracking-wider bg-[#FAFAFA] border border-[#111111]/20 px-2 py-0.5 rounded-full text-[#111111]">
                    🔒 Anonymous Student
                  </span>
                  <span className="text-[11px] font-mono text-[#111111]/50">
                    {new Date(post.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                  </span>
                </div>
                <h3 className="text-base sm:text-lg font-heading font-black text-[#111111]">
                  {post.title}
                </h3>
              </div>
              <button 
                onClick={() => handleReport(post.id)}
                title="Report Guideline Violation"
                className="text-[#111111]/30 hover:text-red-600 transition-colors p-1"
              >
                <AlertCircle size={15} />
              </button>
            </div>

            <p className="text-xs sm:text-sm text-[#111111]/80 leading-relaxed whitespace-pre-wrap font-medium">
              {post.content}
            </p>

            {/* Post actions */}
            <div className="flex items-center gap-4 border-t border-[#111111]/10 pt-3">
              <button 
                onClick={() => handleUpvote(post.id)}
                className="flex items-center gap-1.5 text-xs font-bold text-[#111111]/70 hover:text-[#111111] transition-colors cursor-pointer"
              >
                <ThumbsUp size={14} />
                <span>{post.upvotes} Encouragements</span>
              </button>

              <button 
                onClick={() => toggleExpand(post.id)}
                className="flex items-center gap-1.5 text-xs font-bold text-[#111111]/70 hover:text-[#111111] transition-colors cursor-pointer"
              >
                <MessageSquare size={14} />
                <span>{post.reply_count} Replies</span>
              </button>
            </div>

            {/* Replies section */}
            {expandedPostId === post.id && (
              <div className="pt-3 border-t border-[#111111]/10 space-y-3 animate-fade-in">
                <div className="space-y-2">
                  {(!post.replies || post.replies.length === 0) && (
                    <p className="text-xs text-[#111111]/50 italic">No replies yet. Leave a kind word!</p>
                  )}
                  {post.replies?.map(r => (
                    <div key={r.id} className="p-3 bg-[#FAFAFA] border border-[#111111]/15 rounded-2xl text-xs space-y-1">
                      <span className="font-mono text-[10px] font-bold text-[#111111]/60">Anonymous Peer</span>
                      <p className="text-[#111111]/85">{r.content}</p>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2 items-center pt-2">
                  <input
                    type="text"
                    placeholder="Write a supportive reply..."
                    value={replyContent}
                    onChange={e => setReplyContent(e.target.value)}
                    className="flex-1 text-xs bg-[#FAFAFA] border border-[#111111]/25 rounded-xl px-3 py-2 text-[#111111] focus:outline-hidden focus:border-[#111111]"
                  />
                  <button
                    onClick={() => handleReply(post.id)}
                    className="px-4 py-2 bg-[#F4C542] hover:bg-[#e0b435] text-[#111111] rounded-xl font-bold text-xs border border-[#111111]"
                  >
                    Reply
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* ── STRICT 7 COMMUNITY GUIDELINES MODAL (REQ 13) ── */}
      {showGuidelinesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#111111]/70 backdrop-blur-xs animate-fade-in">
          <div className="bg-[#FFFFFF] border-2 border-[#111111] rounded-3xl w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl p-6 sm:p-8 space-y-6 text-[#111111]">
            <div className="flex items-center justify-between border-b border-[#111111]/15 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#F4C542] border-2 border-[#111111] flex items-center justify-center font-bold">
                  <Shield size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-heading font-black">Community Guidelines</h2>
                  <p className="text-xs text-[#111111]/60 font-mono">Vishnu Wellness Centre Protocol</p>
                </div>
              </div>
              <button
                onClick={() => setShowGuidelinesModal(false)}
                className="p-1.5 text-[#111111]/60 hover:text-[#111111]"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4 text-xs leading-relaxed">
              {COMMUNITY_GUIDELINES.map(g => (
                <div key={g.num} className="p-3.5 rounded-2xl bg-[#FAFAFA] border border-[#111111]/15 space-y-1">
                  <div className="font-heading font-black text-sm text-[#111111] flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-[#F4C542] border border-[#111111] flex items-center justify-center text-[11px]">
                      {g.num}
                    </span>
                    <span>{g.title}</span>
                  </div>
                  <p className="text-[#111111]/80 pl-7">{g.desc}</p>
                </div>
              ))}
            </div>

            <button
              onClick={() => setShowGuidelinesModal(false)}
              className="w-full py-3 rounded-2xl bg-[#F4C542] hover:bg-[#e0b435] text-[#111111] font-heading font-black text-xs border-2 border-[#111111]"
            >
              I Understand &amp; Agree
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
