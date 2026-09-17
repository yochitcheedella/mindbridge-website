import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Image as ImageIcon, Send, Heart, MessageCircle, ShieldAlert, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getCampusFeed, createPost, deletePost, type FeedPost } from '../data/campusFeed';
import { getAuth, canPostCampusUpdates, isRamSir, isAdmin } from '../utils/auth';

const AdminFeedManager = () => {
  const navigate = useNavigate();
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [imageUrl, setImageUrl] = useState('');
  const [secondImageUrl, setSecondImageUrl] = useState('');
  const [caption, setCaption] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const [postError, setPostError] = useState('');
  const [postSuccess, setPostSuccess] = useState('');
  
  const auth = getAuth();
  const isAuthorized = canPostCampusUpdates();
  const ramSir = isRamSir();

  const authorName = ramSir ? 'Ram Prudhvi Teja' : (auth?.name || 'Vishnu Wellness Centre');
  const authorRole = ramSir ? 'Senior Wellness Counsellor · VIT' : 'Official Campus Update';
  const authorAvatar = ramSir ? '/counselors/ram_prudhvi_teja_head.jpg' : '/vishnu_wellness_logo.png';

  const loadPosts = () => {
    setPosts(getCampusFeed());
  };

  useEffect(() => {
    loadPosts();
  }, []);

  const handleCreatePost = (e: React.FormEvent) => {
    e.preventDefault();
    setPostError('');
    setPostSuccess('');

    if (!imageUrl.trim() || !caption.trim()) {
      setPostError('Please provide at least one image URL and a caption.');
      return;
    }

    if (!isAuthorized) {
      setPostError('Access Restricted: Only Admin and Ram Sir can publish campus posts.');
      return;
    }
    
    setIsPosting(true);
    setTimeout(() => {
      const slides = [imageUrl.trim()];
      if (secondImageUrl.trim()) {
        slides.push(secondImageUrl.trim());
      }

      const res = createPost({
        authorName,
        authorRole,
        authorAvatar,
        images: slides,
        imageUrl: slides[0],
        caption: caption.trim(),
        institution: ramSir ? 'Vishnu Institute of Technology' : 'Sri Vishnu Educational Society',
        counselorId: ramSir ? 1 : undefined,
      });

      setIsPosting(false);
      if (res.success) {
        setPostSuccess('✓ Post published to Campus Feed successfully!');
        setImageUrl('');
        setSecondImageUrl('');
        setCaption('');
        loadPosts();
        setTimeout(() => setPostSuccess(''), 4000);
      } else {
        setPostError(res.error || 'Failed to publish post.');
      }
    }, 400);
  };

  const handleDeletePost = (id: string) => {
    if (!isAuthorized) {
      alert('Only Admin and Ram Sir can delete posts.');
      return;
    }
    if (confirm('Are you sure you want to delete this post?')) {
      deletePost(id);
      loadPosts();
    }
  };

  // If not authorized (not Admin and not Ram Sir)
  if (!isAuthorized) {
    return (
      <div className="max-w-md mx-auto my-16 p-8 rounded-3xl bg-[#FFFFFF] border-3 border-[#111111] shadow-xl text-center space-y-4 animate-scale-up">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/15 border-2 border-rose-500 text-rose-600 flex items-center justify-center mx-auto">
          <ShieldAlert size={32} />
        </div>
        <h2 className="text-xl font-heading font-black text-[#111111]">
          Access Restricted
        </h2>
        <p className="text-xs text-[#111111]/70 leading-relaxed">
          Only <strong>Vishnu Wellness Centre Administrators</strong> and <strong>Senior Counsellor Ram Prudhvi Teja (Ram Sir)</strong> are authorized to publish and manage campus updates and wellness events.
        </p>
        <div className="pt-2">
          <button
            onClick={() => navigate('/student/campus-feed')}
            className="w-full py-3 rounded-2xl bg-[#F4C542] hover:bg-[#e0b435] border-2 border-[#111111] text-xs font-black text-[#111111] flex items-center justify-center gap-2 cursor-pointer transition-all"
          >
            <ArrowLeft size={14} />
            <span>Return to Campus Feed</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20 pt-4 animate-fade-in text-[#111111]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#111111]/10 gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black font-heading tracking-tight text-[#111111]">Manage Campus Feed</h1>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-400 text-[10px] font-black uppercase tracking-wider">
              {ramSir ? '👑 Ram Sir Authorized' : '🛡️ Admin Authorized'}
            </span>
          </div>
          <p className="text-xs text-[#111111]/60 font-medium mt-0.5">
            Posting as: <span className="font-bold text-[#111111]">{authorName}</span> ({authorRole})
          </p>
        </div>

        <button
          onClick={() => navigate('/student/campus-feed')}
          className="px-4 py-2 rounded-xl border border-[#111111]/20 bg-white hover:bg-[#111111]/5 text-xs font-bold transition-all flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
        >
          <ArrowLeft size={14} />
          <span>View Public Feed</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        {/* Create Post Form */}
        <div className="bg-[#FFFFFF] p-6 rounded-3xl border-2 border-[#111111] shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-[#111111]/10">
            <Plus size={20} className="text-[#F4C542]" />
            <h2 className="text-base font-black text-[#111111]">Create Instagram-Style Post</h2>
          </div>

          {postError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-300 text-rose-800 text-xs font-bold">
              {postError}
            </div>
          )}

          {postSuccess && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-bold flex items-center gap-1.5">
              <CheckCircle2 size={14} />
              <span>{postSuccess}</span>
            </div>
          )}

          <form onSubmit={handleCreatePost} className="space-y-3.5">
            <div>
              <label className="text-xs font-bold text-[#111111] uppercase tracking-wider mb-1 block">
                Slide 1 Image URL (Required)
              </label>
              <div className="relative">
                <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-[#111111]/40" size={16} />
                <input 
                  type="text" 
                  required
                  value={imageUrl}
                  onChange={e => setImageUrl(e.target.value)}
                  placeholder="e.g. /counselors/raw/page_7_img_0_589x719.jpeg or https://..."
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-[#FAFAFA] border border-[#111111]/20 focus:border-[#111111] text-xs font-medium outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-[#111111] uppercase tracking-wider mb-1 block">
                Slide 2 Image URL (Optional Carousel Slide)
              </label>
              <div className="relative">
                <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-[#111111]/40" size={16} />
                <input 
                  type="text" 
                  value={secondImageUrl}
                  onChange={e => setSecondImageUrl(e.target.value)}
                  placeholder="e.g. /counselors/raw/page_7_img_1_667x719.jpeg"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-[#FAFAFA] border border-[#111111]/20 focus:border-[#111111] text-xs font-medium outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-[#111111] uppercase tracking-wider mb-1 block">
                Caption
              </label>
              <textarea 
                required
                value={caption}
                onChange={e => setCaption(e.target.value)}
                placeholder="Write an announcement or guidance note for students..."
                rows={4}
                className="w-full p-3 rounded-xl bg-[#FAFAFA] border border-[#111111]/20 focus:border-[#111111] text-xs font-medium outline-none resize-none"
              />
            </div>

            <button 
              type="submit"
              disabled={isPosting || !imageUrl.trim() || !caption.trim()}
              className="w-full py-3 rounded-xl bg-[#F4C542] hover:bg-[#e0b435] disabled:opacity-40 text-[#111111] font-black tracking-wide border-2 border-[#111111] transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
            >
              {isPosting ? 'Publishing...' : 'Publish to Campus Feed'}
              <Send size={15} />
            </button>
          </form>
        </div>

        {/* Existing Posts Management */}
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-1">
            <h2 className="text-xs font-black text-[#111111] uppercase tracking-wider">
              Published Feed Posts ({posts.length})
            </h2>
          </div>

          <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
            {posts.map(post => (
              <div key={post.id} className="bg-[#FFFFFF] p-3.5 rounded-2xl border border-[#111111]/15 shadow-2xs flex gap-3">
                <div className="w-16 h-16 rounded-xl overflow-hidden border border-[#111111]/10 shrink-0 bg-[#111111]/5">
                  <img 
                    src={post.images?.[0] || post.imageUrl} 
                    alt="Post thumbnail" 
                    className="w-full h-full object-cover" 
                    onError={(e) => { (e.target as HTMLImageElement).src = '/logo.png'; }}
                  />
                </div>
                <div className="flex-1 min-w-0 flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-xs text-[#111111] line-clamp-2 font-bold">{post.caption}</p>
                      <button 
                        onClick={() => handleDeletePost(post.id)}
                        className="text-rose-500 hover:bg-rose-50 p-1 rounded-lg transition-colors shrink-0 cursor-pointer"
                        title="Delete Post"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                    <p className="text-[10px] font-mono text-[#111111]/50 mt-0.5">
                      By: {post.authorName} · {post.images?.length || 1} slide(s)
                    </p>
                  </div>
                  <div className="flex items-center gap-3 text-[10px] font-bold text-[#111111]/70 mt-1">
                    <span className="flex items-center gap-1"><Heart size={11} className="text-rose-500 fill-rose-500" /> {post.likes}</span>
                    <span className="flex items-center gap-1"><MessageCircle size={11} /> {post.comments.length}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminFeedManager;
