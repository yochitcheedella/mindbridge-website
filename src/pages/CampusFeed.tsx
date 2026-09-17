import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Heart, MessageCircle, Share2, Bookmark, ChevronLeft, ChevronRight, 
  Send, MoreHorizontal, Calendar, Sparkles, Check, ArrowRight, User,
  Plus, X, ShieldAlert, Image as ImageIcon, ShieldCheck, Lock
} from 'lucide-react';
import { getCampusFeed, toggleLike, addComment, createPost, type FeedPost } from '../data/campusFeed';
import { getAuth, getStudentProfile, canPostCampusUpdates, isRamSir, isAdmin } from '../utils/auth';

export default function CampusFeed() {
  const navigate = useNavigate();
  const [posts, setPosts] = useState<FeedPost[]>(() => getCampusFeed());
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});
  const [savedPosts, setSavedPosts] = useState<Record<string, boolean>>({});
  const [doubleTapHeart, setDoubleTapHeart] = useState<Record<string, boolean>>({});
  const [copiedToast, setCopiedToast] = useState(false);
  const [activeSlideMap, setActiveSlideMap] = useState<Record<string, number>>({});

  // ── Role & Permission State ──
  const auth = getAuth();
  const studentProfile = getStudentProfile();
  const currentUserName = studentProfile.original_name || auth?.name || studentProfile.anonymous_alias || 'Student';

  // Compute authorization: Only Admin and Ram Sir can post
  const isAuthorizedToPost = canPostCampusUpdates();
  const isRamSirActive = isRamSir();

  // ── Create Post Modal State (Only for Admin / Ram Sir) ──
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newSlide1, setNewSlide1] = useState('');
  const [newSlide2, setNewSlide2] = useState('');
  const [newCaption, setNewCaption] = useState('');
  const [isSubmittingPost, setIsSubmittingPost] = useState(false);
  const [createPostMsg, setCreatePostMsg] = useState('');

  const loadPosts = () => {
    setPosts(getCampusFeed());
  };

  useEffect(() => {
    loadPosts();

    const handleSync = () => loadPosts();
    window.addEventListener('mindbridge_campus_feed_sync', handleSync);
    window.addEventListener('storage', handleSync);

    return () => {
      window.removeEventListener('mindbridge_campus_feed_sync', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, []);

  const handleLike = (postId: string) => {
    const updated = toggleLike(postId);
    setPosts(updated);
  };

  const handleDoubleTap = (postId: string) => {
    setDoubleTapHeart(prev => ({ ...prev, [postId]: true }));
    setTimeout(() => {
      setDoubleTapHeart(prev => ({ ...prev, [postId]: false }));
    }, 900);

    const post = posts.find(p => p.id === postId);
    if (post && !post.likedByCurrentUser) {
      handleLike(postId);
    }
  };

  const handleCommentSubmit = (e: React.FormEvent, postId: string) => {
    e.preventDefault();
    const text = commentInputs[postId]?.trim();
    if (!text) return;

    const updated = addComment(postId, currentUserName, text);
    setPosts(updated);
    setCommentInputs(prev => ({ ...prev, [postId]: '' }));
    setExpandedComments(prev => ({ ...prev, [postId]: true }));
  };

  const handleToggleSave = (postId: string) => {
    setSavedPosts(prev => ({ ...prev, [postId]: !prev[postId] }));
  };

  const handleShare = (post: FeedPost) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(`${window.location.origin}/student/campus-feed#${post.id}`);
      setCopiedToast(true);
      setTimeout(() => setCopiedToast(false), 3000);
    }
  };

  const handleCreateNewPost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthorizedToPost) {
      alert('Only Admin and Ram Sir can publish posts.');
      return;
    }
    if (!newSlide1.trim() || !newCaption.trim()) return;

    setIsSubmittingPost(true);
    setTimeout(() => {
      const slides = [newSlide1.trim()];
      if (newSlide2.trim()) {
        slides.push(newSlide2.trim());
      }

      const authorName = isRamSirActive 
        ? 'Ram Prudhvi Teja' 
        : (auth?.name || 'Vishnu Wellness Centre');
      
      const authorRole = isRamSirActive 
        ? 'Senior Wellness Counsellor · VIT' 
        : 'Official Campus Update';

      const authorAvatar = isRamSirActive 
        ? '/counselors/ram_prudhvi_teja_head.jpg' 
        : '/vishnu_wellness_logo.png';

      const res = createPost({
        authorName,
        authorRole,
        authorAvatar,
        images: slides,
        imageUrl: slides[0],
        caption: newCaption.trim(),
        institution: isRamSirActive ? 'Vishnu Institute of Technology' : 'Sri Vishnu Educational Society',
        counselorId: isRamSirActive ? 1 : undefined,
      });

      setIsSubmittingPost(false);
      if (res.success) {
        setCreatePostMsg('✓ Post published to Campus Feed!');
        setNewSlide1('');
        setNewSlide2('');
        setNewCaption('');
        loadPosts();
        setTimeout(() => {
          setCreatePostMsg('');
          setShowCreateModal(false);
        }, 1200);
      }
    }, 400);
  };

  const formatTimestamp = (isoString: string) => {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  return (
    <div className="max-w-xl mx-auto space-y-5 pb-28 pt-4 px-3 sm:px-4 animate-fade-in text-[#111111]">
      {/* ── Top Header with Exclusive Authorization Controls ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#111111]/10 gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black font-heading tracking-tight text-[#111111]">
              Campus Feed
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-[#F4C542]/25 text-[#111111] border border-[#F4C542] text-[10px] font-black uppercase tracking-wider">
              VWC Official
            </span>
          </div>
          <p className="text-xs text-[#111111]/60 font-medium mt-0.5">
            Meet our 7 Dedicated Wellness Counsellors · Slide to view complete profiles &amp; support guides
          </p>
        </div>

        {/* Action Controls: Only visible when Admin or Ram Sir */}
        {isAuthorizedToPost && (
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-3.5 py-1.5 rounded-xl bg-[#F4C542] hover:bg-[#e0b435] text-[#111111] text-xs font-black border-2 border-[#111111] shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
            >
              <Plus size={14} />
              <span>Create Post</span>
            </button>
          </div>
        )}
      </div>

      {/* ── Toast Notification ── */}
      {copiedToast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-[#111111] text-white text-xs font-bold px-4 py-2 rounded-full shadow-lg flex items-center gap-2 animate-scale-up">
          <Check size={14} className="text-[#F4C542]" />
          <span>Post link copied to clipboard!</span>
        </div>
      )}

      {/* ── Posts Stream ── */}
      <div className="space-y-6">
        {posts.map((post) => {
          const slides = post.images && post.images.length > 0 
            ? post.images 
            : post.imageUrl ? [post.imageUrl] : [];
          
          const currentSlide = activeSlideMap[post.id] || 0;
          const totalSlides = slides.length;

          const setSlide = (newIdx: number) => {
            if (newIdx >= 0 && newIdx < totalSlides) {
              setActiveSlideMap(prev => ({ ...prev, [post.id]: newIdx }));
            }
          };

          return (
            <article 
              key={post.id} 
              id={post.id}
              className="bg-[#FFFFFF] border-2 border-[#111111] rounded-[1.75rem] overflow-hidden shadow-xs flex flex-col transition-all hover:shadow-md"
            >
              {/* Post Header */}
              <div className="p-3.5 sm:p-4 flex items-center justify-between border-b border-[#111111]/10">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-full p-[2px] bg-gradient-to-tr from-[#F4C542] via-rose-500 to-purple-600 shrink-0">
                    <img 
                      src={post.authorAvatar} 
                      alt={post.authorName} 
                      className="w-full h-full rounded-full object-cover border border-white"
                      onError={(e) => { (e.target as HTMLImageElement).src = '/logo.png'; }}
                    />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h3 className="text-sm font-black text-[#111111] truncate">{post.authorName}</h3>
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" title="Active Counsellor" />
                    </div>
                    <p className="text-[11px] text-[#111111]/60 font-medium truncate">{post.authorRole}</p>
                  </div>
                </div>

                {/* Direct Action: Book Session Button */}
                {post.counselorId ? (
                  <button
                    onClick={() => navigate(`/student/appointments?counselorId=${post.counselorId}`)}
                    className="px-3 py-1.5 rounded-xl bg-[#F4C542] hover:bg-[#e0b435] text-[#111111] text-xs font-black border border-[#111111] transition-all flex items-center gap-1 shrink-0 shadow-2xs cursor-pointer active:scale-95"
                  >
                    <Calendar size={13} />
                    <span>Book Session</span>
                  </button>
                ) : (
                  <button 
                    onClick={() => navigate('/student/appointments')}
                    className="px-3 py-1.5 rounded-xl bg-[#111111]/5 hover:bg-[#111111]/10 text-[#111111] text-xs font-bold border border-[#111111]/15 transition-all shrink-0 cursor-pointer"
                  >
                    All Counsellors
                  </button>
                )}
              </div>

              {/* ── Carousel Slide Display (Instagram-Style) ── */}
              {totalSlides > 0 && (
                <div className="relative w-full aspect-[4/5] sm:aspect-square bg-[#111111]/5 select-none overflow-hidden group">
                  
                  {/* Sliding Track */}
                  <div 
                    className="flex w-full h-full transition-transform duration-300 ease-out"
                    style={{ transform: `translateX(-${currentSlide * 100}%)` }}
                    onDoubleClick={() => handleDoubleTap(post.id)}
                  >
                    {slides.map((src, sIdx) => (
                      <div 
                        key={sIdx} 
                        className="w-full h-full shrink-0 flex items-center justify-center bg-[#111111]/5 relative"
                      >
                        <img 
                          src={src} 
                          alt={`Slide ${sIdx + 1} for ${post.authorName}`}
                          className="w-full h-full object-cover sm:object-contain bg-white"
                          loading="lazy"
                        />
                      </div>
                    ))}
                  </div>

                  {/* Big Popping Heart on Double Tap */}
                  {doubleTapHeart[post.id] && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
                      <Heart size={84} className="text-rose-500 fill-rose-500 drop-shadow-2xl animate-ping" />
                    </div>
                  )}

                  {/* Top-Right Slide Number Pill (e.g. 1/2) */}
                  {totalSlides > 1 && (
                    <div className="absolute top-3 right-3 z-10 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-xs text-white text-[11px] font-bold font-mono shadow-sm">
                      {currentSlide + 1}/{totalSlides}
                    </div>
                  )}

                  {/* Left Arrow Button */}
                  {totalSlides > 1 && currentSlide > 0 && (
                    <button
                      onClick={(e) => { e.stopPropagation(); setSlide(currentSlide - 1); }}
                      className="absolute left-3 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-white/90 hover:bg-white text-[#111111] flex items-center justify-center shadow-md transition-all cursor-pointer hover:scale-110 active:scale-90"
                      aria-label="Previous slide"
                    >
                      <ChevronLeft size={20} />
                    </button>
                  )}

                  {/* Right Arrow Button */}
                  {totalSlides > 1 && currentSlide < totalSlides - 1 && (
                    <button
                      onClick={(e) => { e.stopPropagation(); setSlide(currentSlide + 1); }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-white/90 hover:bg-white text-[#111111] flex items-center justify-center shadow-md transition-all cursor-pointer hover:scale-110 active:scale-90"
                      aria-label="Next slide"
                    >
                      <ChevronRight size={20} />
                    </button>
                  )}

                  {/* Bottom Pagination Dots */}
                  {totalSlides > 1 && (
                    <div className="absolute bottom-3 inset-x-0 z-10 flex items-center justify-center gap-1.5 pointer-events-none">
                      {slides.map((_, dotIdx) => (
                        <span
                          key={dotIdx}
                          className={`rounded-full transition-all duration-300 ${
                            dotIdx === currentSlide
                              ? 'w-2.5 h-2.5 bg-[#F4C542] ring-2 ring-black/40'
                              : 'w-1.5 h-1.5 bg-white/70 shadow-2xs'
                          }`}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ── Post Action Bar ── */}
              <div className="p-3.5 sm:p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {/* Like Button */}
                    <button 
                      onClick={() => handleLike(post.id)}
                      className="transition-transform active:scale-75 focus:outline-none cursor-pointer flex items-center gap-1.5 group"
                      aria-label="Like post"
                    >
                      <Heart 
                        size={25} 
                        className={`transition-colors ${
                          post.likedByCurrentUser 
                            ? 'text-rose-500 fill-rose-500' 
                            : 'text-[#111111] group-hover:text-rose-500'
                        }`} 
                      />
                    </button>

                    {/* Comment Icon */}
                    <button 
                      onClick={() => setExpandedComments(prev => ({ ...prev, [post.id]: !prev[post.id] }))}
                      className="text-[#111111] hover:text-[#111111]/70 transition-transform active:scale-75 cursor-pointer flex items-center gap-1.5"
                      aria-label="View comments"
                    >
                      <MessageCircle size={25} />
                    </button>

                    {/* Share Button */}
                    <button 
                      onClick={() => handleShare(post)}
                      className="text-[#111111] hover:text-[#111111]/70 transition-transform active:scale-75 cursor-pointer"
                      title="Share post link"
                    >
                      <Share2 size={23} />
                    </button>
                  </div>

                  {/* Bookmark Button */}
                  <button
                    onClick={() => handleToggleSave(post.id)}
                    className="text-[#111111] transition-transform active:scale-75 cursor-pointer"
                    title={savedPosts[post.id] ? 'Unsave' : 'Save post'}
                  >
                    <Bookmark 
                      size={24} 
                      className={savedPosts[post.id] ? 'fill-[#111111] text-[#111111]' : 'text-[#111111]'} 
                    />
                  </button>
                </div>

                {/* Likes Counter */}
                <div className="text-xs font-black text-[#111111]">
                  {post.likes.toLocaleString()} {post.likes === 1 ? 'like' : 'likes'}
                </div>

                {/* Caption with Linebreaks */}
                <div className="text-xs text-[#111111] leading-relaxed">
                  <span className="font-black mr-2">{post.authorName}</span>
                  <span className="whitespace-pre-line text-[#111111]/90">{post.caption}</span>
                </div>

                {/* Timestamp */}
                <div className="text-[10px] font-mono uppercase tracking-wider text-[#111111]/50">
                  {formatTimestamp(post.timestamp)}
                </div>

                {/* ── Comments Section ── */}
                <div className="space-y-2 pt-2 border-t border-[#111111]/10">
                  {post.comments.length > 0 && (
                    <div className="space-y-1.5">
                      {(expandedComments[post.id] ? post.comments : post.comments.slice(-2)).map((comment) => (
                        <div key={comment.id} className="text-xs flex items-start gap-2 bg-[#111111]/[0.02] p-2 rounded-xl">
                          <div className="w-5 h-5 rounded-full bg-[#111111]/10 flex items-center justify-center shrink-0 text-[10px] font-bold text-[#111111]">
                            {comment.authorName.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className="font-bold text-[#111111] mr-1.5">{comment.authorName}</span>
                            <span className="text-[#111111]/85 break-words">{comment.text}</span>
                            <span className="block text-[9px] text-[#111111]/40 font-mono mt-0.5">
                              {formatTimestamp(comment.timestamp)}
                            </span>
                          </div>
                        </div>
                      ))}

                      {post.comments.length > 2 && (
                        <button
                          onClick={() => setExpandedComments(prev => ({ ...prev, [post.id]: !prev[post.id] }))}
                          className="text-[11px] font-bold text-[#111111]/60 hover:text-[#111111] cursor-pointer"
                        >
                          {expandedComments[post.id] 
                            ? 'Hide extra comments' 
                            : `View all ${post.comments.length} comments`}
                        </button>
                      )}
                    </div>
                  )}

                  {/* Add Comment Form */}
                  <form 
                    onSubmit={(e) => handleCommentSubmit(e, post.id)} 
                    className="flex items-center gap-2 pt-1.5"
                  >
                    <input
                      type="text"
                      value={commentInputs[post.id] || ''}
                      onChange={(e) => setCommentInputs(prev => ({ ...prev, [post.id]: e.target.value }))}
                      placeholder={`Add a comment for ${post.authorName}...`}
                      className="flex-1 px-3.5 py-2 rounded-xl bg-[#111111]/5 border border-[#111111]/10 text-xs font-medium placeholder-[#111111]/40 focus:outline-none focus:ring-2 focus:ring-[#F4C542] focus:bg-white transition-all"
                    />
                    <button
                      type="submit"
                      disabled={!commentInputs[post.id]?.trim()}
                      className="px-3.5 py-2 rounded-xl bg-[#111111] text-white text-xs font-bold disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[#333333] transition-all flex items-center gap-1 shrink-0 cursor-pointer"
                    >
                      <Send size={12} />
                      <span>Post</span>
                    </button>
                  </form>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {/* ── MODAL: CREATE CAMPUS POST (AUTHORIZED ONLY: ADMIN & RAM SIR) ── */}
      {showCreateModal && isAuthorizedToPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <form onSubmit={handleCreateNewPost} className="bg-[#FFFFFF] p-6 sm:p-7 rounded-3xl border-3 border-[#111111] max-w-md w-full space-y-4 shadow-2xl animate-scale-up relative">
            <button
              type="button"
              onClick={() => setShowCreateModal(false)}
              className="absolute top-4 right-4 p-1 rounded-xl hover:bg-[#111111]/10 text-[#111111] cursor-pointer"
            >
              <X size={18} />
            </button>

            <div>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 text-[10px] font-black uppercase tracking-wider">
                {isRamSirActive ? '👑 Publishing as Ram Sir' : '🛡️ Publishing as VWC Admin'}
              </span>
              <h2 className="text-lg font-heading font-black text-[#111111] mt-1.5">
                Create New Campus Feed Post
              </h2>
              <p className="text-xs text-[#111111]/60">
                Share institutional wellness guidance, multi-slide photo updates, and student announcements.
              </p>
            </div>

            {createPostMsg && (
              <div className="p-3 rounded-xl bg-emerald-100 text-emerald-900 text-xs font-bold flex items-center gap-2">
                <Check size={14} />
                <span>{createPostMsg}</span>
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-[#111111] uppercase tracking-wider mb-1 block">
                  Slide 1 Image URL (Required)
                </label>
                <div className="relative">
                  <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-[#111111]/40" size={15} />
                  <input
                    type="text"
                    required
                    placeholder="e.g. /counselors/raw/page_7_img_0_589x719.jpeg"
                    value={newSlide1}
                    onChange={(e) => setNewSlide1(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#FAFAFA] border border-[#111111]/20 text-xs font-medium focus:outline-none focus:border-[#111111]"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-[#111111] uppercase tracking-wider mb-1 block">
                  Slide 2 Image URL (Optional Carousel Slide)
                </label>
                <div className="relative">
                  <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-[#111111]/40" size={15} />
                  <input
                    type="text"
                    placeholder="e.g. /counselors/raw/page_7_img_1_667x719.jpeg"
                    value={newSlide2}
                    onChange={(e) => setNewSlide2(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#FAFAFA] border border-[#111111]/20 text-xs font-medium focus:outline-none focus:border-[#111111]"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-[#111111] uppercase tracking-wider mb-1 block">
                  Caption &amp; Message
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="Write an encouraging wellness message or campus notice..."
                  value={newCaption}
                  onChange={(e) => setNewCaption(e.target.value)}
                  className="w-full p-3 rounded-xl bg-[#FAFAFA] border border-[#111111]/20 text-xs font-medium focus:outline-none focus:border-[#111111] resize-none"
                />
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2 border-t border-[#111111]/10">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 rounded-xl border border-[#111111]/20 text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmittingPost || !newSlide1.trim() || !newCaption.trim()}
                className="px-5 py-2 rounded-xl bg-[#F4C542] hover:bg-[#e0b435] text-[#111111] font-black text-xs border-2 border-[#111111] transition-all flex items-center gap-1.5 disabled:opacity-40"
              >
                {isSubmittingPost ? 'Publishing...' : 'Publish to Feed'}
                <Send size={13} />
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
