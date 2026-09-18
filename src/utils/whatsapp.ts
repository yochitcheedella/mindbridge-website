/**
 * MindBridge AI — WhatsApp Messaging & Reminder Service
 * Official Dispatcher Sender: 9100972237 (Vishnu Wellness Centre Helpline)
 */

export const VWC_DISPATCHER_PHONE = '9100972237';
export const VWC_DISPATCHER_DISPLAY = '+91 9100972237';
export const VWC_HELPLINE_NAME = 'Vishnu Wellness Centre & MindBridge AI';

export interface WhatsAppDispatchLog {
  id: string;
  timestamp: string;
  type: 'screen_time_alert' | 'appointment_student_reminder' | 'appointment_counselor_notification' | 'test_alert';
  senderPhone: string;
  recipientPhone: string;
  recipientName: string;
  message: string;
  status: 'dispatched' | 'opened' | 'copied';
  url: string;
}

/**
 * Standardize phone number for WhatsApp URLs.
 * Ensures India country code (91) is present for 10-digit numbers.
 */
export function cleanPhoneNumber(phone: string): string {
  if (!phone) return '';
  let digits = phone.replace(/\D/g, '');
  
  if (digits.length === 10) {
    digits = `91${digits}`;
  } else if (digits.length === 11 && digits.startsWith('0')) {
    digits = `91${digits.slice(1)}`;
  } else if (digits.length === 13 && digits.startsWith('910')) {
    digits = `91${digits.slice(3)}`;
  } else if (digits.length === 12 && digits.startsWith('91')) {
    return digits;
  }
  return digits;
}

/**
 * Checks if a phone number is valid for WhatsApp dispatch.
 */
export function isValidWhatsAppPhone(phone: string): boolean {
  const cleaned = cleanPhoneNumber(phone);
  return cleaned.length >= 10;
}

/**
 * Formats a phone number for user-friendly UI display.
 */
export function formatDisplayPhone(phone: string): string {
  const cleaned = cleanPhoneNumber(phone);
  if (!cleaned || cleaned.length < 10) return phone && phone.trim() ? phone : 'Not Provided';
  if (cleaned.startsWith('91') && cleaned.length === 12) {
    return `+91 ${cleaned.slice(2, 7)} ${cleaned.slice(7)}`;
  }
  return phone;
}

/**
 * Generates an official WhatsApp Web / Mobile direct deep-link.
 * If phone number is omitted or invalid, creates a universal share link so
 * WhatsApp does not show an "Invalid Phone Number" error.
 */
export function getWhatsAppUrl(phoneNumber: string, message: string): string {
  const cleaned = cleanPhoneNumber(phoneNumber);
  const encoded = encodeURIComponent(message);
  if (!cleaned || cleaned.length < 10) {
    return `https://api.whatsapp.com/send?text=${encoded}`;
  }
  return `https://api.whatsapp.com/send?phone=${cleaned}&text=${encoded}`;
}

/**
 * Professional, polite and caring screen time exceeded message.
 */
export function buildScreenTimeAlertMessage(
  studentName: string,
  screenTimeMinutes: number,
  limitMinutes: number
): string {
  const hours = Math.floor(screenTimeMinutes / 60);
  const mins = screenTimeMinutes % 60;
  const timeFormatted = hours > 0 ? `${hours}h ${mins}m` : `${mins} minutes`;

  const limitHours = Math.floor(limitMinutes / 60);
  const limitMins = limitMinutes % 60;
  const limitFormatted = limitHours > 0 ? `${limitHours}h ${limitMins > 0 ? `${limitMins}m` : ''}` : `${limitMins} minutes`;

  const displayName = studentName?.trim() || 'Student';

  return `🌿 *MindBridge Digital Wellness Reminder* 🌿

Dear ${displayName},

Our digital well-being monitor noticed that you have exceeded your daily screen time goal of *${limitFormatted}* (Current active time: *${timeFormatted}*).

Continuous screen exposure can lead to digital eye strain, cognitive fatigue, and disrupted sleep rhythms. We warmly encourage you to take a gentle 5–10 minute mindful pause:
• 👁️ Rest your eyes using the 20-20-20 rule (look 20 feet away for 20 seconds)
• 💧 Sip a refreshing glass of water
• 🧘 Step away from your device and do a light physical stretch
• 🌿 Take three deep, calming breaths

Your mental and physical well-being is our utmost priority.

Warm regards,
*${VWC_HELPLINE_NAME}*
📞 Campus Helpline / Sender: ${VWC_DISPATCHER_DISPLAY}`;
}

/**
 * Professional session booking confirmation reminder for the student.
 * Includes student name (or alias), counsellor name, college name, department, year, scheduled slot, and session mode.
 */
export function buildStudentBookingMessage(params: {
  studentName: string;
  counselorName: string;
  collegeName?: string;
  department?: string;
  year?: string | number;
  counselorInstitution?: string;
  counselorPhone?: string;
  slotTime: string;
  mode: string;
  bookingMode?: 'original' | 'anonymous';
}): string {
  const { studentName, counselorName, collegeName, department, year, counselorInstitution, counselorPhone, slotTime, mode, bookingMode } = params;
  const dateObj = new Date(slotTime);
  const dateFormatted = !isNaN(dateObj.getTime())
    ? dateObj.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    : slotTime;
  const timeFormatted = !isNaN(dateObj.getTime())
    ? dateObj.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })
    : '';

  const displayCounselorPhone = counselorPhone ? formatDisplayPhone(counselorPhone) : 'Campus Wellness Centre';
  const effectiveCollege = collegeName || counselorInstitution || 'Vishnu Institute of Technology (VIT)';

  return `🗓️ *MindBridge Counselling Session Booking Confirmation* 🗓️

Dear ${studentName || 'Student'},

Your confidential counselling session has been successfully booked with *${counselorName}*. Please find your booking details below:

📋 *Booking & Session Details:*
• 👤 *Student Name (or Alias):* ${studentName || 'Student'} ${bookingMode === 'anonymous' ? '(Anonymous Alias)' : '(Verified Name)'}
• 🏛️ *College Name:* ${effectiveCollege}
• 📚 *Department:* ${department || 'General'}
• 🎓 *Year:* ${year || 'N/A'}
• 👨‍⚕️ *Counsellor:* ${counselorName}${counselorInstitution ? ` (${counselorInstitution})` : ''}
• 📅 *Scheduled Slot:* ${dateFormatted} at ${timeFormatted}
• 🎯 *Session Mode:* ${mode}
• 📞 *Counsellor Contact:* ${displayCounselorPhone}
• 🏛️ *Location:* Vishnu Wellness Centre / Online MindBridge Portal

💡 *Preparation Tips:*
Please find a quiet, comfortable space and be ready 5 minutes before your scheduled slot. Your privacy, dignity, and feelings are unconditionally protected with us.

If you ever need to reschedule, please visit your MindBridge portal or reach out.

Warm regards,
*${VWC_HELPLINE_NAME}*
📞 Official Sender / Helpline: ${VWC_DISPATCHER_DISPLAY}`;
}

/**
 * Professional clinical intake alert notification for the counsellor.
 * Includes student name (or alias), college name, department, year, scheduled slot, and session mode.
 */
export function buildCounselorBookingMessage(params: {
  counselorName: string;
  studentName: string;
  studentPhone: string;
  collegeName?: string;
  institution?: string;
  department?: string;
  year?: string | number;
  slotTime: string;
  mode: string;
  bookingMode?: 'original' | 'anonymous';
}): string {
  const { counselorName, studentName, studentPhone, collegeName, institution, department, year, slotTime, mode, bookingMode } = params;
  const dateObj = new Date(slotTime);
  const dateFormatted = !isNaN(dateObj.getTime())
    ? dateObj.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    : slotTime;
  const timeFormatted = !isNaN(dateObj.getTime())
    ? dateObj.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })
    : '';

  const displayStudentPhone = studentPhone ? formatDisplayPhone(studentPhone) : 'Provided via Portal';
  const effectiveCollege = collegeName || institution || 'Vishnu Institute of Technology (VIT)';

  return `🔔 *Clinical Intake Alert — MindBridge Counselling* 🔔

Dear ${counselorName},

A student has scheduled a counselling consultation with you. Please review the clinical intake details below:

📋 *Clinical Intake Details:*
• 👤 *Student Name (or Alias):* ${studentName} ${bookingMode === 'anonymous' ? '(Anonymous Alias)' : '(Verified Name)'}
• 🏛️ *College Name:* ${effectiveCollege}
• 📚 *Department:* ${department || 'General'}
• 🎓 *Year:* ${year || 'N/A'}
• 📅 *Scheduled Slot:* ${dateFormatted} at ${timeFormatted}
• 🎯 *Session Mode:* ${mode}
• 📞 *Student WhatsApp:* ${displayStudentPhone}

Please log in to your MindBridge Counsellor Dashboard to review the student's clinical intake or start the consultation at the scheduled time.

Best regards,
*${VWC_HELPLINE_NAME}*
📞 Official Sender / Dispatcher: ${VWC_DISPATCHER_DISPLAY}`;
}

/**
 * Professional session confirmation reminder when counsellor accepts appointment.
 */
export function buildStudentConfirmationMessage(params: {
  studentName: string;
  counselorName: string;
  collegeName?: string;
  department?: string;
  year?: string | number;
  slotTime: string;
  mode: string;
  meetingLink?: string;
}): string {
  const { studentName, counselorName, collegeName, department, year, slotTime, mode, meetingLink } = params;
  const dateObj = new Date(slotTime);
  const dateFormatted = !isNaN(dateObj.getTime())
    ? dateObj.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    : slotTime;
  const timeFormatted = !isNaN(dateObj.getTime())
    ? dateObj.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })
    : '';

  const effectiveCollege = collegeName || 'Vishnu Institute of Technology (VIT)';

  return `✅ *MindBridge Session Confirmed — Vishnu Wellness Centre* ✅

Dear ${studentName || 'Student'},

Great news! Your counselling consultation has been officially *CONFIRMED* by *${counselorName}*.

📋 *Confirmed Session Details:*
• 👤 *Student Name (or Alias):* ${studentName || 'Student'}
• 🏛️ *College Name:* ${effectiveCollege}
• 📚 *Department:* ${department || 'General'}
• 🎓 *Year:* ${year || 'N/A'}
• 👨‍⚕️ *Counsellor:* ${counselorName}
• 📅 *Scheduled Slot:* ${dateFormatted} at ${timeFormatted}
• 🎯 *Session Mode:* ${mode}
• 🏛️ *Location:* Vishnu Wellness Centre / Online MindBridge Portal
${meetingLink ? `• 🔗 *Call Link:* ${meetingLink}\n` : ''}
Please join promptly at your scheduled time. We look forward to supporting your well-being journey.

Warm regards,
*${VWC_HELPLINE_NAME}*
📞 Official Sender / Helpline: ${VWC_DISPATCHER_DISPLAY}`;
}

const LOGS_STORAGE_KEY = 'mindbridge_whatsapp_logs';

/**
 * Retrieve local dispatch history.
 */
export function getWhatsAppLogs(): WhatsAppDispatchLog[] {
  try {
    const raw = localStorage.getItem(LOGS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Record a WhatsApp message in the audit log.
 */
export function logWhatsAppMessage(log: Omit<WhatsAppDispatchLog, 'id' | 'timestamp' | 'senderPhone'>): WhatsAppDispatchLog {
  const fullLog: WhatsAppDispatchLog = {
    id: `wa_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    timestamp: new Date().toISOString(),
    senderPhone: VWC_DISPATCHER_PHONE,
    ...log,
  };

  try {
    const logs = getWhatsAppLogs();
    const updated = [fullLog, ...logs].slice(0, 50);
    localStorage.setItem(LOGS_STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.warn('Could not save WhatsApp log:', err);
  }

  return fullLog;
}

/**
 * Dispatches a WhatsApp message by generating the URL, opening the WhatsApp
 * interface, and persisting the record.
 */
export function dispatchWhatsAppMessage(params: {
  toPhone: string;
  message: string;
  recipientName: string;
  type: WhatsAppDispatchLog['type'];
  openInWindow?: boolean;
}): { success: boolean; url: string; log: WhatsAppDispatchLog } {
  const { toPhone, message, recipientName, type, openInWindow = true } = params;
  const url = getWhatsAppUrl(toPhone, message);

  const log = logWhatsAppMessage({
    type,
    recipientPhone: toPhone,
    recipientName,
    message,
    status: 'dispatched',
    url,
  });

  if (openInWindow && typeof window !== 'undefined') {
    try {
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch (e) {
      console.warn('Popup blocked or unable to window.open:', e);
    }
  }

  return { success: true, url, log };
}
