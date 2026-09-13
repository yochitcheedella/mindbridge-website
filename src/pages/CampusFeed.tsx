import React, { useState, useEffect } from 'react';
import { Heart, MessageCircle, Share2, MoreHorizontal, Send } from 'lucide-react';
import { getCampusFeed, toggleLike, addComment } from '../data/campusFeed';
import type { FeedPost } from '../data/campusFeed';
import { getAuth } from '../utils/auth';

const CampusFeed = () => {
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const auth = getAuth();
  const currentUserName = auth?.name || 'Anonymous Student';

  const loadPosts = () => {
    setPosts(getCampusFeed());
  };

  useEffect(() => {
    loadPosts();
    
    // Polling or event listener could go here if this was a real backend,
    // for now we'll just check every 5 seconds to simulate real-time updates.
    const interval = setInterval(loadPosts, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleLike = (postId: string) => {
    setPosts(toggleLike(postId));
  };

  const handleCommentSubmit = (e: React.FormEvent, postId: string) => {
    e.preventDefault();
    const text = commentInputs[postId]?.trim();
    if (text) {
      setPosts(addComment(postId, currentUserName, text));
      setCommentInputs(prev => ({ ...prev, [postId]: '' }));
    }
  };

  const formatTimestamp = (isoString: string) => {
    const date = new Date(isoString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    return 'Just now';
  };

  return (
    <div className="max-w-xl mx-auto space-y-6 pb-20 pt-4 animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black font-heading tracking-tight text-[#111111]">Campus Feed</h1>
          <p className="text-xs text-[#111111]/60 font-medium">Updates & moments from Vishnu Wellness Centre</p>
        </div>
      </div>

      {posts.map(post => (
        <div key={post.id} className="bg-[#FFFFFF] border border-[#111111]/15 rounded-[1.5rem] overflow-hidden shadow-sm flex flex-col">
          {/* Post Header */}
          <div className="p-3 sm:p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img 
                src={post.authorAvatar} 
                alt={post.authorName} 
                className="w-10 h-10 rounded-full border border-[#111111]/10 object-cover"
                onError={(e) => { (e.target as HTMLImageElement).src = '/logo.png'; }}
              />
              <div>
                <h3 className="text-sm font-bold text-[#111111]">{post.authorName}</h3>
                <p className="text-[10px] font-mono text-[#111111]/60">{post.authorRole}</p>
              </div>
            </div>
            <button className="text-[#111111]/50 hover:text-[#111111] p-1 rounded-full transition-colors">
              <MoreHorizontal size={20} />
            </button>
          </div>

          {/* Post Image */}
          {post.imageUrl && (
            <div className="w-full aspect-square bg-[#111111]/5 border-y border-[#111111]/10">
              <img 
                src={post.imageUrl} 
                alt="Post content" 
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Post Actions */}
          <div className="p-3 sm:p-4 flex flex-col gap-3">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => handleLike(post.id)}
                className={`transition-transform active:scale-90 ${post.likedByCurrentUser ? 'text-rose-500' : 'text-[#111111] hover:text-[#111111]/70'}`}
              >
                <Heart size={26} className={post.likedByCurrentUser ? "fill-rose-500" : ""} />
              </button>
              <button className="text-[#111111] hover:text-[#111111]/70 transition-transform active:scale-90">
                <MessageCircle size={26} />
              </button>
              <button className="text-[#111111] hover:text-[#111111]/70 transition-transform active:scale-90">
                <Share2 size={24} />
              </button>
            </div>

            {/* Likes */}
            <div className="font-bold text-sm text-[#111111]">
              {post.likes} {post.likes === 1 ? 'like' : 'likes'}
            </div>

            {/* Caption */}
            {post.caption && (
              <div className="text-sm text-[#111111]">
                <span className="font-bold mr-2">{post.authorName}</span>
                <span>{post.caption}</span>
              </div>
            )}

            {/* Comments */}
            {post.comments.length > 0 && (
              <div className="space-y-1.5 mt-1">
                {post.comments.slice(0, 3).map(comment => (
                  <div key={comment.id} className="text-sm flex gap-2">
                    <span className="font-bold text-[#111111] shrink-0">{comment.authorName}</span>
                    <span className="text-[#111111]/80 break-words">{comment.text}</span>
                  </div>
                ))}
                {post.comments.length > 3 && (
                  <button className="text-xs text-[#111111]/50 font-medium">
                    View all {post.comments.length} comments
                  </button>
                )}
              </div>
            )}

            <div className="text-[10px] font-mono text-[#111111]/50 uppercase tracking-widest mt-1">
              {formatTimestamp(post.timestamp)}
            </div>
          </div>

          {/* Add Comment Input */}
          <form 
            onSubmit={(e) => handleCommentSubmit(e, post.id)} 
            className="border-t border-[#111111]/10 p-3 sm:px-4 sm:py-3 flex items-center gap-3 bg-[#FAFAFA]"
          >
            <input
              type="text"
              placeholder="Add a comment..."
              className="flex-1 bg-transparent border-none focus:ring-0 text-sm placeholder:text-[#111111]/40"
              value={commentInputs[post.id] || ''}
              onChange={(e) => setCommentInputs(prev => ({ ...prev, [post.id]: e.target.value }))}
            />
            <button 
              type="submit"
              disabled={!(commentInputs[post.id]?.trim())}
              className="text-[#F4C542] hover:text-[#e0b435] disabled:opacity-50 disabled:hover:text-[#F4C542] font-bold text-sm transition-colors"
            >
              Post
            </button>
          </form>
        </div>
      ))}
      
      {posts.length === 0 && (
        <div className="text-center p-12 border-2 border-dashed border-[#111111]/20 rounded-3xl">
          <p className="text-[#111111]/50 font-medium">No posts yet. Check back soon!</p>
        </div>
      )}
    </div>
  );
};

export default CampusFeed;
