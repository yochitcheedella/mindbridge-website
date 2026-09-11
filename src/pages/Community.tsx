import React, { useState, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { MessageSquare, ThumbsUp, AlertCircle, Plus, Send, Users } from 'lucide-react';
import { apiFetch } from '../utils/auth';

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
  replies?: Reply[]; // Loaded on demand
}

export default function Community() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  
  const [expandedPostId, setExpandedPostId] = useState<number | null>(null);
  const [replyContent, setReplyContent] = useState('');

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const res = await apiFetch('/api/community/posts');
      if (res.ok) {
        const data = await res.json();
        setPosts(data);
      }
    } catch (e) {
      console.error('Failed to fetch posts', e);
    }
  };

  const handleCreatePost = async () => {
    if (!newTitle.trim() || !newContent.trim()) return;
    try {
      const res = await apiFetch('/api/community/posts', {
        method: 'POST',
        body: JSON.stringify({ title: newTitle, content: newContent })
      });
      if (res.ok) {
        setNewTitle('');
        setNewContent('');
        setIsCreating(false);
        fetchPosts();
      }
    } catch (e) {
      console.error('Failed to create post', e);
    }
  };

  const handleUpvote = async (postId: number) => {
    try {
      const res = await apiFetch(`/api/community/posts/${postId}/upvote`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setPosts(posts.map(p => p.id === postId ? { ...p, upvotes: data.upvotes } : p));
      }
    } catch (e) {
      console.error('Failed to upvote', e);
    }
  };

  const handleReport = async (postId: number) => {
    if (!confirm('Are you sure you want to report this post?')) return;
    try {
      const res = await apiFetch(`/api/community/posts/${postId}/report`, { method: 'POST' });
      if (res.ok) {
        alert('Post has been reported to the moderators.');
      }
    } catch (e) {
      console.error('Failed to report', e);
    }
  };

  const toggleExpand = async (postId: number) => {
    if (expandedPostId === postId) {
      setExpandedPostId(null);
      return;
    }
    
    setExpandedPostId(postId);
    // Fetch post details (including replies)
    try {
      const res = await apiFetch(`/api/community/posts/${postId}`);
      if (res.ok) {
        const data = await res.json();
        setPosts(posts.map(p => p.id === postId ? { ...p, replies: data.replies } : p));
      }
    } catch (e) {
      console.error('Failed to fetch post details', e);
    }
  };

  const handleReply = async (postId: number) => {
    if (!replyContent.trim()) return;
    try {
      const res = await apiFetch(`/api/community/posts/${postId}/replies`, {
        method: 'POST',
        body: JSON.stringify({ content: replyContent })
      });
      if (res.ok) {
        const newReply = await res.json();
        setReplyContent('');
        setPosts(posts.map(p => {
          if (p.id === postId) {
            return {
              ...p,
              reply_count: p.reply_count + 1,
              replies: [...(p.replies || []), newReply]
            };
          }
          return p;
        }));
      }
    } catch (e) {
      console.error('Failed to post reply', e);
    }
  };

  return (
    <div className="min-h-screen bg-background text-text p-4 md:p-8 pt-12 md:pt-16 pb-24 max-w-2xl mx-auto animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Community</h1>
          <p className="text-text-muted">A safe, anonymous space to share and support.</p>
        </div>
        <button 
          onClick={() => setIsCreating(!isCreating)}
          className="bg-primary hover:bg-primary-hover text-white p-3 rounded-xl transition-colors shadow-lg shadow-primary/20"
        >
          <Plus size={24} />
        </button>
      </div>

      {isCreating && (
        <Card className="mb-6 p-4 border border-primary/30">
          <h2 className="text-lg font-semibold text-white mb-3">Create Anonymous Post</h2>
          <input 
            type="text"
            placeholder="Title"
            className="w-full bg-surface-dim border border-border rounded-xl px-4 py-3 text-white placeholder:text-text-muted mb-3 focus:outline-none focus:border-primary transition-colors"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
          />
          <textarea
            rows={4}
            placeholder="Share what's on your mind..."
            className="w-full bg-surface-dim border border-border rounded-xl px-4 py-3 text-white placeholder:text-text-muted mb-4 focus:outline-none focus:border-primary transition-colors resize-none"
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
          />
          <div className="flex justify-end gap-3">
            <button 
              onClick={() => setIsCreating(false)}
              className="px-4 py-2 rounded-lg text-text hover:bg-surface-bright transition-colors"
            >
              Cancel
            </button>
            <button 
              onClick={handleCreatePost}
              className="px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary-hover transition-colors font-medium"
            >
              Post Anonymously
            </button>
          </div>
        </Card>
      )}

      <div className="space-y-4">
        {posts.map(post => (
          <Card key={post.id} className="p-4 transition-all">
            <div className="flex items-start justify-between mb-2">
              <h3 className="text-lg font-semibold text-white">{post.title}</h3>
              <span className="text-xs text-text-muted">
                {new Date(post.created_at).toLocaleDateString()}
              </span>
            </div>
            <p className="text-text mb-4 whitespace-pre-wrap">{post.content}</p>
            
            <div className="flex items-center gap-4 border-t border-border pt-3">
              <button 
                onClick={() => handleUpvote(post.id)}
                className="flex items-center gap-1.5 text-text-muted hover:text-primary transition-colors"
              >
                <ThumbsUp size={16} />
                <span className="text-sm">{post.upvotes}</span>
              </button>
              
              <button 
                onClick={() => toggleExpand(post.id)}
                className="flex items-center gap-1.5 text-text-muted hover:text-primary transition-colors"
              >
                <MessageSquare size={16} />
                <span className="text-sm">{post.reply_count} Replies</span>
              </button>

              <div className="flex-1" />
              
              <button 
                onClick={() => handleReport(post.id)}
                title="Report Abuse"
                className="text-text-muted hover:text-error transition-colors"
              >
                <AlertCircle size={16} />
              </button>
            </div>

            {/* Expanded Replies Section */}
            {expandedPostId === post.id && (
              <div className="mt-4 pt-4 border-t border-border/50 space-y-3">
                {post.replies?.length === 0 && (
                  <p className="text-sm text-text-muted text-center py-2">No replies yet. Be the first!</p>
                )}
                {post.replies?.map(reply => (
                  <div key={reply.id} className="bg-surface-dim rounded-lg p-3">
                    <p className="text-sm text-white mb-1">{reply.content}</p>
                    <span className="text-[10px] text-text-muted">
                      {new Date(reply.created_at).toLocaleString()}
                    </span>
                  </div>
                ))}
                
                <div className="flex items-center gap-2 mt-3">
                  <input 
                    type="text"
                    placeholder="Add an anonymous reply..."
                    className="flex-1 bg-surface-dim border border-border rounded-lg px-3 py-2 text-sm text-white placeholder:text-text-muted focus:outline-none focus:border-primary transition-colors"
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleReply(post.id)}
                  />
                  <button 
                    onClick={() => handleReply(post.id)}
                    className="bg-primary hover:bg-primary-hover text-white p-2 rounded-lg transition-colors"
                  >
                    <Send size={16} />
                  </button>
                </div>
              </div>
            )}
          </Card>
        ))}
        {posts.length === 0 && (
          <div className="text-center py-12 text-text-muted">
            <Users size={48} className="mx-auto mb-4 opacity-50" />
            <p>No posts yet. Start the conversation!</p>
          </div>
        )}
      </div>
    </div>
  );
}
