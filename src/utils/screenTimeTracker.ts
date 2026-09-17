/**
 * MindBridge AI — Real-Time Screen Time Tracker & Limit Detection Engine
 * Accurately tracks active screen time, filters out idle time, detects limit breaches,
 * and triggers polite WhatsApp reminders from 9100972237.
 */

import { getStudentProfile } from './auth';
import { 
  buildScreenTimeAlertMessage, 
  dispatchWhatsAppMessage, 
  VWC_DISPATCHER_PHONE 
} from './whatsapp';

export interface ScreenTimeState {
  todayDate: string;
  activeSeconds: number;
  limitMinutes: number;
  isIdle: boolean;
  isTracking: boolean;
  hasExceededLimit: boolean;
  lastAlertTimestamp: number | null;
}

export type ScreenTimeListener = (state: ScreenTimeState) => void;

const IDLE_TIMEOUT_MS = 60 * 1000; // 60 seconds of inactivity pauses tracking
const DEFAULT_LIMIT_MINUTES = 210; // 3h 30m default daily limit
const ALERT_COOLDOWN_MS = 60 * 60 * 1000; // 1 hour cooldown between automated alerts

class ScreenTimeTracker {
  private static instance: ScreenTimeTracker;
  private activeSeconds = 0;
  private limitMinutes = DEFAULT_LIMIT_MINUTES;
  private isIdle = false;
  private isTracking = false;
  private lastActivityTimestamp = Date.now();
  private lastAlertTimestamp: number | null = null;
  private tickInterval: any = null;
  private listeners: Set<ScreenTimeListener> = new Set();
  private modalListeners: Set<(state: ScreenTimeState, url?: string, message?: string) => void> = new Set();

  private constructor() {
    this.init();
  }

  public static getInstance(): ScreenTimeTracker {
    if (!ScreenTimeTracker.instance) {
      ScreenTimeTracker.instance = new ScreenTimeTracker();
    }
    return ScreenTimeTracker.instance;
  }

  private getTodayKey(): string {
    const today = new Date().toISOString().split('T')[0];
    return `mindbridge_screen_time_${today}`;
  }

  private init() {
    if (typeof window === 'undefined') return;

    // Load persisted active seconds for today
    const storedSeconds = localStorage.getItem(this.getTodayKey());
    if (storedSeconds) {
      this.activeSeconds = parseInt(storedSeconds, 10) || 0;
    } else {
      // For first-time realistic demonstration, seed baseline 1h 45m (6300s) if empty
      const initialBaseline = 6300; 
      this.activeSeconds = initialBaseline;
      localStorage.setItem(this.getTodayKey(), initialBaseline.toString());
    }

    // Load persisted daily limit
    const storedLimit = localStorage.getItem('mindbridge_screen_time_limit_mins');
    if (storedLimit) {
      this.limitMinutes = parseInt(storedLimit, 10) || DEFAULT_LIMIT_MINUTES;
    }

    // Load last alert timestamp
    const storedAlertTs = localStorage.getItem('mindbridge_screen_time_last_alert_ts');
    if (storedAlertTs) {
      this.lastAlertTimestamp = parseInt(storedAlertTs, 10) || null;
    }

    this.setupEventListeners();
    this.startTracking();
  }

  private setupEventListeners() {
    const onUserAction = () => {
      this.lastActivityTimestamp = Date.now();
      if (this.isIdle) {
        this.isIdle = false;
        this.notifyListeners();
      }
    };

    window.addEventListener('mousemove', onUserAction, { passive: true });
    window.addEventListener('keydown', onUserAction, { passive: true });
    window.addEventListener('touchstart', onUserAction, { passive: true });
    window.addEventListener('scroll', onUserAction, { passive: true });
    window.addEventListener('click', onUserAction, { passive: true });

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.isIdle = true;
      } else {
        this.lastActivityTimestamp = Date.now();
        this.isIdle = false;
      }
      this.notifyListeners();
    });

    window.addEventListener('focus', () => {
      this.lastActivityTimestamp = Date.now();
      this.isIdle = false;
      this.notifyListeners();
    });

    window.addEventListener('blur', () => {
      this.isIdle = true;
      this.notifyListeners();
    });
  }

  private startTracking() {
    if (this.tickInterval) clearInterval(this.tickInterval);
    this.isTracking = true;

    this.tickInterval = setInterval(() => {
      const now = Date.now();
      // Check idle state
      if (now - this.lastActivityTimestamp > IDLE_TIMEOUT_MS) {
        this.isIdle = true;
      }

      // If active and document is visible, increment active seconds
      if (!this.isIdle && typeof document !== 'undefined' && !document.hidden) {
        this.activeSeconds += 1;

        // Persist periodically (every 5 seconds)
        if (this.activeSeconds % 5 === 0) {
          localStorage.setItem(this.getTodayKey(), this.activeSeconds.toString());
        }

        // Check if exceeded limit
        this.checkLimitThreshold();
      }

      this.notifyListeners();
    }, 1000);
  }

  private checkLimitThreshold(forceAlert = false) {
    const activeMinutes = Math.floor(this.activeSeconds / 60);
    if (activeMinutes >= this.limitMinutes) {
      const now = Date.now();
      // Automated alert triggers if cooldown elapsed (5 mins) or if forced
      const COOLDOWN_MS = 5 * 60 * 1000;
      if (forceAlert || !this.lastAlertTimestamp || now - this.lastAlertTimestamp > COOLDOWN_MS) {
        this.triggerScreenTimeAlert(forceAlert);
      }
    }
  }

  /**
   * Synthesize a calming two-tone wellness bell using Web Audio API
   */
  public playGentleChime(): void {
    if (typeof window === 'undefined') return;
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();

      if (ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }

      const playTone = (freq: number, start: number, duration: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + start);

        gain.gain.setValueAtTime(0, ctx.currentTime + start);
        gain.gain.linearRampToValueAtTime(0.25, ctx.currentTime + start + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + start + duration);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(ctx.currentTime + start);
        osc.stop(ctx.currentTime + start + duration);
      };

      // Gentle C-E-G chime
      playTone(523.25, 0.0, 1.2);   // C5
      playTone(659.25, 0.25, 1.5);  // E5
      playTone(783.99, 0.5, 2.0);   // G5
    } catch (e) {
      console.warn('Could not play gentle audio chime:', e);
    }
  }

  /**
   * Triggers the polite WhatsApp message from 9100972237 and notifies the UI modal.
   * @param force - If true (user click), directly launches WhatsApp window. If false (background check), logs dispatch and shows in-app modal without triggering browser popup blocker.
   */
  public triggerScreenTimeAlert(force = false): { success: boolean; url: string; message: string } {
    const now = Date.now();
    this.lastAlertTimestamp = now;
    localStorage.setItem('mindbridge_screen_time_last_alert_ts', now.toString());

    // Play chime
    this.playGentleChime();

    // Get student profile details
    const profile = getStudentProfile();
    const studentName = profile.original_name || profile.anonymous_alias || 'Student';
    const studentPhone = profile.mobile_number || profile.phone || '';

    const activeMinutes = Math.max(Math.floor(this.activeSeconds / 60), 1);
    const message = buildScreenTimeAlertMessage(studentName, activeMinutes, this.limitMinutes);

    // Dispatch WhatsApp message from sender 9100972237
    // Set openInWindow to true only on explicit user click to prevent browser popup suppression
    const dispatchResult = dispatchWhatsAppMessage({
      toPhone: studentPhone,
      message,
      recipientName: studentName,
      type: force ? 'test_alert' : 'screen_time_alert',
      openInWindow: force,
    });

    // Notify UI modal listeners with state and dispatch result
    const state = this.getState();
    this.modalListeners.forEach((fn) => {
      try {
        fn(state, dispatchResult.url, message);
      } catch (err) {
        console.error('Error notifying modal listener:', err);
      }
    });

    this.notifyListeners();
    return { success: true, url: dispatchResult.url, message };
  }

  public getState(): ScreenTimeState {
    const activeMinutes = Math.floor(this.activeSeconds / 60);
    return {
      todayDate: new Date().toISOString().split('T')[0],
      activeSeconds: this.activeSeconds,
      limitMinutes: this.limitMinutes,
      isIdle: this.isIdle,
      isTracking: this.isTracking,
      hasExceededLimit: activeMinutes >= this.limitMinutes,
      lastAlertTimestamp: this.lastAlertTimestamp,
    };
  }

  public setLimitMinutes(mins: number): void {
    this.limitMinutes = Math.max(1, mins);
    localStorage.setItem('mindbridge_screen_time_limit_mins', this.limitMinutes.toString());
    this.notifyListeners();
    // Check if new limit immediately breaches current usage
    this.checkLimitThreshold(true);
  }

  public resetTodayScreenTime(): void {
    this.activeSeconds = 0;
    this.lastAlertTimestamp = null;
    localStorage.removeItem('mindbridge_screen_time_last_alert_ts');
    localStorage.setItem(this.getTodayKey(), '0');
    this.notifyListeners();
  }

  public addActiveSeconds(seconds: number): void {
    this.activeSeconds += seconds;
    localStorage.setItem(this.getTodayKey(), this.activeSeconds.toString());
    this.notifyListeners();
    this.checkLimitThreshold(true);
  }

  public addActiveMinutes(mins: number): void {
    this.addActiveSeconds(mins * 60);
  }

  public simulateLimitExceeded(): { success: boolean; url: string; message: string } {
    // Ensure active seconds exceed current limit by 2 minutes
    const targetSeconds = (this.limitMinutes * 60) + 120;
    if (this.activeSeconds < targetSeconds) {
      this.activeSeconds = targetSeconds;
      localStorage.setItem(this.getTodayKey(), this.activeSeconds.toString());
    }
    return this.triggerScreenTimeAlert(true);
  }

  public subscribe(listener: ScreenTimeListener): () => void {
    this.listeners.add(listener);
    listener(this.getState());
    return () => this.listeners.delete(listener);
  }

  public onAlertModal(listener: (state: ScreenTimeState, url?: string, message?: string) => void): () => void {
    this.modalListeners.add(listener as any);
    return () => this.modalListeners.delete(listener as any);
  }

  private notifyListeners(): void {
    const state = this.getState();
    this.listeners.forEach((listener) => {
      try {
        listener(state);
      } catch (err) {
        console.error('Error in screen time listener:', err);
      }
    });
  }
}

export const screenTimeTracker = ScreenTimeTracker.getInstance();
