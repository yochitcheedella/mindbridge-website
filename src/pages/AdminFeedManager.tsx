import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Image as ImageIcon, Send, Heart, MessageCircle } from 'lucide-react';
import { getCampusFeed, createPost, deletePost } from '../data/campusFeed';
import type { FeedPost } from '../data/campusFeed';
import { getAuth } from '../utils/auth';

const AdminFeedManager = () => {
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [imageUrl, setImageUrl] = useState('');
  const [caption, setCaption] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  
  const auth = getAuth();
  const authorName = auth?.name || 'Wellness Admin';
  const authorRole = auth?.role === 'super_admin' ? 'Official Campus Update' : 'Wellness Update';

  const loadPosts = () => {
    setPosts(getCampusFeed());
  };

  useEffect(() => {
    loadPosts();
  }, []);

  const handleCreatePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageUrl || !caption) return;
    
    setIsPosting(true);
    // Simulate network delay
    setTimeout(() => {
      createPost({
        authorName,
        authorRole,
        authorAvatar: '/vishnu_wellness_logo.png', // Or use admin's actual avatar if available
        imageUrl,
        caption
      });
      setImageUrl('');
      setCaption('');
      setIsPosting(false);
      loadPosts();
    }, 600);
  };

  const handleDeletePost = (id: string) => {
    if (confirm('Are you sure you want to delete this post?')) {
      deletePost(id);
      loadPosts();
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black font-heading tracking-tight text-[#111111]">Manage Campus Feed</h1>
          <p className="text-xs text-[#111111]/60 font-medium">Create and moderate Instagram-style wellness updates</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Create Post Form */}
        <div className="bg-[#FFFFFF] p-6 rounded-3xl border-2 border-[#111111]/15 shadow-sm space-y-5 h-fit sticky top-24">
          <div className="flex items-center gap-2 pb-4 border-b border-[#111111]/10">
            <Plus size={20} className="text-[#F4C542]" />
            <h2 className="text-lg font-bold text-[#111111]">Create New Post</h2>
          </div>

          <form onSubmit={handleCreatePost} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-[#111111] uppercase tracking-wider mb-1.5 block">Image URL</label>
              <div className="relative">
                <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-[#111111]/40" size={16} />
                <input 
                  type="url" 
                  required
                  value={imageUrl}
                  onChange={e => setImageUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/photo-..."
                  className="w-full pl-9 pr-4 py-3 rounded-xl bg-[#FAFAFA] border border-[#111111]/20 focus:border-[#111111] focus:ring-2 focus:ring-[#111111]/10 transition-all text-sm outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-[#111111] uppercase tracking-wider mb-1.5 block">Caption</label>
              <textarea 
                required
                value={caption}
                onChange={e => setCaption(e.target.value)}
                placeholder="Write an engaging caption... Add hashtags too!"
                rows={4}
                className="w-full p-3 rounded-xl bg-[#FAFAFA] border border-[#111111]/20 focus:border-[#111111] focus:ring-2 focus:ring-[#111111]/10 transition-all text-sm outline-none resize-none"
              />
            </div>

            {/* Preview Image */}
            {imageUrl && (
              <div className="relative w-full aspect-video rounded-xl overflow-hidden border border-[#111111]/20 bg-[#111111]/5">
                <img 
                  src={imageUrl} 
                  alt="Preview" 
                  className="w-full h-full object-cover"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
                <div className="absolute top-2 left-2 bg-[#111111]/80 backdrop-blur-sm text-white text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase">
                  Image Preview
                </div>
              </div>
            )}

            <button 
              type="submit"
              disabled={isPosting || !imageUrl || !caption}
              className="w-full py-3.5 rounded-xl bg-[#F4C542] hover:bg-[#e0b435] disabled:opacity-50 text-[#111111] font-black tracking-wide border-2 border-[#111111] transition-all flex items-center justify-center gap-2 active:scale-95"
            >
              {isPosting ? 'Publishing...' : 'Publish Post to Feed'}
              <Send size={16} />
            </button>
          </form>
        </div>

        {/* Existing Posts Management */}
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-2">
            <h2 className="text-sm font-bold text-[#111111] uppercase tracking-wider">Recent Posts ({posts.length})</h2>
          </div>

          {posts.map(post => (
            <div key={post.id} className="bg-[#FFFFFF] p-4 rounded-2xl border border-[#111111]/15 shadow-sm flex gap-4">
              <div className="w-20 h-20 rounded-xl overflow-hidden border border-[#111111]/10 shrink-0 bg-[#111111]/5">
                <img src={post.imageUrl} alt="Post thumbnail" className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 min-w-0 flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-xs text-[#111111] line-clamp-2 font-medium">{post.caption}</p>
                    <button 
                      onClick={() => handleDeletePost(post.id)}
                      className="text-rose-500 hover:bg-rose-50 p-1.5 rounded-lg transition-colors shrink-0"
                      title="Delete Post"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <p className="text-[10px] font-mono text-[#111111]/50 mt-1">
                    {new Date(post.timestamp).toLocaleString()}
                  </p>
                </div>
                <div className="flex items-center gap-3 text-[11px] font-bold text-[#111111]/70 mt-2">
                  <span className="flex items-center gap-1"><Heart size={12} className="text-rose-500" /> {post.likes}</span>
                  <span className="flex items-center gap-1"><MessageCircle size={12} /> {post.comments.length}</span>
                </div>
              </div>
            </div>
          ))}

          {posts.length === 0 && (
            <div className="text-center p-8 border-2 border-dashed border-[#111111]/15 rounded-2xl bg-[#FAFAFA]">
              <p className="text-[#111111]/50 text-xs font-bold">No active posts.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminFeedManager;
