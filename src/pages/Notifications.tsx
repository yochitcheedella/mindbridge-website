import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckCircle, Info, AlertTriangle, RefreshCw } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { apiFetch } from '../utils/auth';
import { Badge } from '../components/ui/Badge';

interface Notification {
  id: number;
  title: string;
  message: string;
  is_read: boolean;
  type: 'info' | 'success' | 'warning' | 'error';
  appointment_id?: number;
}

export default function Notifications() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/api/notifications');
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const markAsRead = async (id: number) => {
    try {
      // Optimistic update
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
      await apiFetch(`/api/notifications/${id}/read`, { method: 'POST' });
    } catch (e) {
      console.error(e);
    }
  };

  const getIcon = (type: string) => {
    switch(type) {
      case 'success': return <CheckCircle className="text-success" size={20} />;
      case 'warning': return <AlertTriangle className="text-warning" size={20} />;
      case 'error': return <AlertTriangle className="text-error" size={20} />;
      default: return <Info className="text-primary" size={20} />;
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <RefreshCw className="animate-spin text-text-muted" size={24} />
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-background p-6 md:p-8 max-w-3xl mx-auto pb-24 w-full">
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-heading font-bold text-3xl flex items-center gap-3">
          <Bell className="text-primary" size={32} />
          Notifications
        </h1>
        {notifications.filter(n => !n.is_read).length > 0 && (
          <Badge variant="default" className="bg-primary/20 text-primary">
            {notifications.filter(n => !n.is_read).length} Unread
          </Badge>
        )}
      </div>

      {notifications.length === 0 ? (
        <Card className="p-8 text-center text-text-muted border-dashed">
          <Bell size={32} className="mx-auto mb-4 opacity-50" />
          <p>You're all caught up!</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {notifications.map(n => (
            <Card 
              key={n.id} 
              className={`p-4 transition-all ${n.is_read ? 'opacity-70 bg-surface/50' : 'bg-surface border-primary/20 shadow-sm'}`}
            >
              <div className="flex items-start gap-4">
                <div className="mt-1 p-2 rounded-full bg-background border border-border">
                  {getIcon(n.type)}
                </div>
                <div className="flex-1">
                  <h3 className={`font-semibold ${n.is_read ? 'text-text' : 'text-text'}`}>
                    {n.title}
                  </h3>
                  <p className="text-sm text-text-muted mt-1">{n.message}</p>
                </div>
                <div className="flex items-center gap-2">
                  {n.appointment_id && (
                    <button
                      onClick={() => navigate(`/call/${n.appointment_id}`)}
                      className="text-xs bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border border-emerald-500/30 px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 shadow-sm active:scale-95 animate-pulse"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      <span>Join Call</span>
                    </button>
                  )}
                  {!n.is_read && (
                    <button 
                      onClick={() => markAsRead(n.id)}
                      className="text-xs font-semibold text-primary hover:bg-primary/10 px-3 py-1.5 rounded-lg transition-colors"
                    >
                      Mark Read
                    </button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
