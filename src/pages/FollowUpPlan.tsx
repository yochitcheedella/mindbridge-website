import React, { useState, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { Brain, CheckCircle2, Circle, RefreshCw, CalendarCheck, Info, Sparkles, TrendingUp } from 'lucide-react';
import { apiFetch } from '../utils/auth';
import { Badge } from '../components/ui/Badge';

interface Task {
  id: number;
  title: string;
  description: string;
  day_number: number;
  completed: boolean;
  completed_at: string | null;
}

interface Plan {
  id: number;
  title: string;
  rationale: string;
  status: string;
  created_at: string;
  tasks: Task[];
}

export default function FollowUpPlan() {
  const [plan, setPlan] = useState<Plan | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  const fetchPlan = async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/api/plans/active');
      if (res.ok) {
        const data = await res.json();
        setPlan(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlan();
  }, []);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const res = await apiFetch('/api/plans/generate', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setPlan(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setGenerating(false);
    }
  };

  const handleCompleteTask = async (taskId: number) => {
    try {
      // Optimistic update
      if (plan) {
        const newTasks = plan.tasks.map(t => t.id === taskId ? { ...t, completed: !t.completed } : t);
        setPlan({ ...plan, tasks: newTasks });
      }

      await apiFetch(`/api/plans/tasks/${taskId}/complete`, { method: 'POST' });
      fetchPlan();
    } catch (e) {
      console.error(e);
      fetchPlan(); // Revert on failure
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <div className="flex items-center gap-2 text-text-muted">
          <RefreshCw className="animate-spin" size={18} /> Loading your recovery plan...
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-background animate-fade-in relative">
      <div className="absolute top-0 left-0 w-full h-40 bg-gradient-to-b from-primary/5 to-transparent -z-10" />
      
      <div className="p-6 md:p-8 max-w-4xl mx-auto pb-24">
        <div className="mb-8 flex justify-between items-start">
          <div>
            <h1 className="font-heading font-bold text-3xl text-text flex items-center gap-3">
              <Brain className="text-primary" size={32} />
              AI Recovery Plan
            </h1>
            <p className="text-text-muted mt-2 text-sm max-w-2xl leading-relaxed">
              Based on your recent interactions, your AI Guide has prepared a personalized micro-habit plan to help you re-center and find your balance.
            </p>
          </div>
          
          <button 
            onClick={handleGenerate}
            disabled={generating}
            className="hidden md:flex px-4 py-2.5 bg-surface border border-border hover:border-primary/50 text-sm font-semibold rounded-xl items-center gap-2 transition-all shadow-sm group disabled:opacity-50"
          >
            {generating ? <RefreshCw className="animate-spin text-primary" size={16} /> : <Sparkles className="text-primary group-hover:scale-110 transition-transform" size={16} />}
            {plan ? "Generate New Plan" : "Create My Plan"}
          </button>
        </div>

        {!plan ? (
          <Card className="p-12 flex flex-col items-center justify-center text-center border-dashed bg-surface/50">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6">
              <Sparkles size={32} className="text-primary" />
            </div>
            <h3 className="font-heading font-bold text-xl mb-2">No Active Plan</h3>
            <p className="text-sm text-text-muted mb-8 max-w-md">
              You don't have an active recovery plan. Let your AI Guide analyze your recent mood logs and chats to create a personalized 3-day roadmap for you.
            </p>
            <button 
              onClick={handleGenerate}
              disabled={generating}
              className="px-6 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary-hover hover:scale-105 transition-all shadow-[0_0_20px_rgba(var(--color-primary),0.3)] disabled:opacity-50 flex items-center gap-2"
            >
              {generating ? <RefreshCw className="animate-spin" size={18} /> : <Brain size={18} />}
              Generate My Plan
            </button>
          </Card>
        ) : (
          <div className="space-y-6">
            <Card className="p-6 md:p-8 bg-gradient-to-br from-surface to-surface-bright border-primary/20 shadow-lg relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
              
              <div className="flex items-center justify-between mb-4 relative">
                <Badge variant="default" className="bg-primary/20 text-primary border border-primary/30">
                  ACTIVE PLAN
                </Badge>
                <span className="text-xs font-mono text-text-muted flex items-center gap-1">
                  <CalendarCheck size={14}/> {new Date(plan.created_at).toLocaleDateString()}
                </span>
              </div>
              
              <h2 className="font-heading font-bold text-2xl mb-3 relative">{plan.title}</h2>
              <div className="flex gap-3 text-sm text-text-muted items-start relative bg-surface/50 p-4 rounded-xl border border-border">
                <Info size={18} className="text-primary mt-0.5 shrink-0" />
                <p className="leading-relaxed italic">"{plan.rationale}"</p>
              </div>
              
              {/* Progress Bar */}
              <div className="mt-8 relative">
                <div className="flex justify-between text-xs font-semibold uppercase tracking-wider mb-2">
                  <span className="text-text-muted">Recovery Progress</span>
                  <span className="text-primary font-bold">
                    {Math.round((plan.tasks.filter(t => t.completed).length / plan.tasks.length) * 100)}%
                  </span>
                </div>
                <div className="h-3 bg-background rounded-full overflow-hidden border border-border">
                  <div 
                    className="h-full bg-gradient-to-r from-primary to-primary-hover transition-all duration-1000 ease-out"
                    style={{ width: `${(plan.tasks.filter(t => t.completed).length / plan.tasks.length) * 100}%` }}
                  />
                </div>
              </div>
            </Card>

            <div className="grid gap-4">
              <h3 className="font-heading font-semibold text-lg flex items-center gap-2 mt-4">
                <TrendingUp className="text-text-muted" size={18} /> Daily Action Items
              </h3>
              
              {plan.tasks.map((task, index) => (
                <Card 
                  key={task.id} 
                  className={`p-1 transition-all duration-300 ${task.completed ? 'bg-success/5 border-success/30' : 'hover:border-primary/40'}`}
                >
                  <div className="flex items-center">
                    <div 
                      className={`w-16 flex-shrink-0 flex flex-col items-center justify-center p-4 border-r border-border transition-colors ${task.completed ? 'text-success' : 'text-text-muted'}`}
                    >
                      <span className="text-[10px] font-bold uppercase tracking-widest mb-1">Day</span>
                      <span className="font-heading font-bold text-2xl leading-none">{task.day_number}</span>
                    </div>
                    
                    <div className="flex-1 p-4">
                      <h4 className={`font-semibold text-base mb-1 transition-colors ${task.completed ? 'text-text line-through opacity-70' : 'text-text'}`}>
                        {task.title}
                      </h4>
                      <p className={`text-sm transition-colors ${task.completed ? 'text-text-muted/60 line-through' : 'text-text-muted'}`}>
                        {task.description}
                      </p>
                    </div>
                    
                    <div className="p-4 pr-6">
                      <button 
                        onClick={() => handleCompleteTask(task.id)}
                        className={`transition-all hover:scale-110 ${task.completed ? 'text-success' : 'text-text-muted hover:text-primary'}`}
                      >
                        {task.completed ? <CheckCircle2 size={28} /> : <Circle size={28} />}
                      </button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
        
        {/* Mobile FAB */}
        <button 
          onClick={handleGenerate}
          disabled={generating}
          className="md:hidden fixed bottom-24 right-6 w-14 h-14 bg-primary text-white rounded-full flex items-center justify-center shadow-[0_4px_20px_rgba(var(--color-primary),0.4)] disabled:opacity-50"
        >
          {generating ? <RefreshCw className="animate-spin" size={24} /> : <Sparkles size={24} />}
        </button>
      </div>
    </div>
  );
}
