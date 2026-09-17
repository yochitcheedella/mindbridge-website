import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { VISHNU_LOGO_BASE64 } from './reportAssetsBase64';

export interface CounselorMonthlyReportData {
  id: string;
  counselorName: string;
  counselorEmail: string;
  department: string;
  institution: string;
  month: string;
  year: number;
  submittedAt: string;
  
  // Section 1: Meetings & Administrative Activities
  administrativeMeetings: Array<{
    date?: string;
    meetingName?: string;
    purposeOutcome?: string;
    text?: string;
  }>;

  // Section 2: Summary of Activities Conducted
  activitiesConducted: Array<{
    date?: string;
    activityName?: string;
    targetAudience?: string;
    participantsCount?: number;
    keyTakeaway?: string;
    text?: string;
  }>;

  // Section 3: Counselling Sessions Breakdown
  sessionStats: {
    week1: number | string;
    week2: number | string;
    week3: number | string;
    week4: number | string;
    week5: number | string;
    total: number | string;
    week1Label?: string;
    week2Label?: string;
    week3Label?: string;
    week4Label?: string;
    week5Label?: string;
    academicStress?: number;
    emotionalAnxiety?: number;
    familyInterpersonal?: number;
    careerGuidance?: number;
    generalWellbeing?: number;
    crisisSos?: number;
    genderBreakdown?: { male: number; female: number; other: number };
  };

  // Section 4: Upcoming Goals
  upcomingGoals: string[];

  // Remarks / Clinical Notes
  generalRemarks?: string;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

/**
 * Draws the official Vishnu Universal Learning vector logo or embeds official mark.
 */
export function drawVishnuHeaderLogo(doc: jsPDF, centerX: number, topY: number) {
  try {
    // Exact official logo embedding
    doc.addImage(VISHNU_LOGO_BASE64, 'PNG', centerX - 25.125, topY, 50.25, 58.5);
  } catch (e) {
    // Vector fallback if image fails
    const cx = centerX;
    const cy = topY + 24;
    const s = 14;

    doc.setFillColor(230, 81, 0);
    doc.triangle(cx, cy - s * 1.5, cx + s * 1.25, cy - s * 0.7, cx, cy - s * 0.2, 'F');
    doc.setFillColor(76, 175, 80);
    doc.triangle(cx + s * 1.25, cy - s * 0.7, cx + s * 1.25, cy + s * 0.7, cx + s * 0.2, cy, 'F');
    doc.setFillColor(139, 195, 74);
    doc.triangle(cx + s * 1.25, cy + s * 0.7, cx, cy + s * 1.5, cx, cy + s * 0.2, 'F');
    doc.setFillColor(63, 81, 181);
    doc.triangle(cx, cy + s * 1.5, cx - s * 1.25, cy + s * 0.7, cx - s * 0.2, cy, 'F');
    doc.setFillColor(156, 39, 176);
    doc.triangle(cx - s * 1.25, cy + s * 0.7, cx - s * 1.25, cy - s * 0.7, cx, cy - s * 0.2, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(20, 20, 20);
    doc.text('VISHNU', cx, cy + s * 1.5 + 8, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(80, 80, 80);
    doc.text('UNIVERSAL LEARNING', cx, cy + s * 1.5 + 13, { align: 'center' });
  }
}

/**
 * Generates the official Vishnu Wellness Centre Counsellor Monthly Report PDF.
 * Matches the official institutional document format (Pages 1 to 3).
 */
export function generateCounselorMonthlyReportPDF(data: CounselorMonthlyReportData) {
  // Exact Letter dimensions (612 x 792 pt = 8.5 x 11 in)
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: [612, 792],
  });

  const leftMargin = 72; // 1 inch
  const contentWidth = 468; // 612 - 144

  // ══════════════════════════════════════════════════════════════
  // PAGE 1: Header, Metadata, Meetings & Administrative Activities
  // ══════════════════════════════════════════════════════════════
  drawVishnuHeaderLogo(doc, 306, 97.5);

  // Big Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(23);
  doc.setTextColor(0, 0, 0);
  doc.text(`MONTHLY REPORT \u2013 ${data.month.toUpperCase()} ${data.year}`, leftMargin, 190);

  // Metadata block
  doc.setFontSize(11);
  let curY = 232;

  doc.setFont('helvetica', 'bold');
  doc.text('In-Charge Psychologist:', leftMargin, curY);
  doc.setFont('helvetica', 'normal');
  doc.text(` ${data.counselorName || 'Ram Prudhvi Teja'}`, leftMargin + 130, curY);

  curY += 14.5;
  doc.setFont('helvetica', 'bold');
  doc.text('Department:', leftMargin, curY);
  doc.setFont('helvetica', 'normal');
  doc.text(` ${data.department || 'Vishnu Wellness Centre'}`, leftMargin + 72, curY);

  curY += 14.5;
  doc.setFont('helvetica', 'bold');
  doc.text('Institution:', leftMargin, curY);
  doc.setFont('helvetica', 'normal');
  const instName = data.institution?.includes('Bhimavaram')
    ? data.institution
    : `${data.institution || 'Vishnu Institute of Technology (VIT)'}, Bhimavaram`;
  doc.text(` ${instName}`, leftMargin + 60, curY);

  // Section 1: Meetings & Administrative Activities
  curY = 294;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(17);
  doc.setTextColor(0, 0, 0);
  doc.text('Meetings & Administrative Activities', leftMargin, curY);

  curY = 328;
  doc.setFontSize(11);
  doc.setTextColor(0, 0, 0);

  const defaultMeetings = [
    'Attended the VEDIC Meeting on 24th August 2026 and discussed the activities and programmes conducted by the Vishnu Wellness Centre during July, along with updates and follow-up on ongoing wellness initiatives.',
    'Conducted a team meeting with the Wellness Counsellors to review ongoing activities and discuss upcoming events for the current and following months. The discussions included updates on previously planned initiatives, event planning and preparation, timelines, resource requirements, and coordination among team members. Duties and responsibilities were delegated for the month to ensure smooth execution of programmes, with follow-up on progress and necessary preparations for upcoming activities.',
    'Attended the Induction Programme for VWU & VIT on 23rd August 2026 as part of the institutional orientation and engagement activities.',
    'Attended the Learning & Development (L&D) Programme conducted by Ms. Akshitha on 28th and 29th August 2026.',
    'Created the Vishnu Wellness Centre Social Media Account to establish an online platform for sharing mental health awareness content, wellness initiatives, programmes, and student-support resources.',
    'Designed and prepared flyers and banners for upcoming wellness events in accordance with the Vishnu Wellness Calendar to support programme communication and campus-wide awareness.'
  ];

  const meetingsToRender: string[] = (data.administrativeMeetings && data.administrativeMeetings.length > 0)
    ? data.administrativeMeetings.map(m => m.text || (m.purposeOutcome ? `${m.meetingName ? `${m.meetingName}: ` : ''}${m.purposeOutcome}` : m.meetingName || ''))
    : defaultMeetings;

  meetingsToRender.forEach((mText) => {
    // Bullet symbol
    doc.setFont('helvetica', 'normal');
    doc.text('\u25CF', leftMargin, curY);

    const wrapped = doc.splitTextToSize(mText, contentWidth - 18);
    doc.text(wrapped, leftMargin + 14, curY);

    curY += wrapped.length * 13.8 + 8;
  });

  // ══════════════════════════════════════════════════════════════
  // PAGE 2: Summary of Activities Conducted, Sessions Table & Goals
  // ══════════════════════════════════════════════════════════════
  doc.addPage([612, 792]);

  // Section 2: Summary of Activities Conducted
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(23);
  doc.setTextColor(0, 0, 0);
  doc.text('Summary of Activities Conducted', leftMargin, 73);

  curY = 115;
  doc.setFontSize(11);

  const defaultActivities = [
    'Conducted an Orientation Programme for first-year students, introducing students to the importance of mental health and the psychological and wellness support services available through the Vishnu Wellness Centre.',
    'Recorded 5 episodes of the MINDTAP \u2013 Radio Vishnu programme, continuing the initiative of providing psychological awareness and wellness-oriented content to the campus community through radio.',
    'Successfully completed the Gatekeeper Training through the NIMHANS e-Learning Programme, strengthening knowledge and preparedness for identifying individuals experiencing psychological distress and facilitating appropriate support and referral.'
  ];

  const activitiesToRender: string[] = (data.activitiesConducted && data.activitiesConducted.length > 0)
    ? data.activitiesConducted.map(a => a.text || (a.keyTakeaway ? `${a.activityName ? `${a.activityName}: ` : ''}${a.keyTakeaway}` : a.activityName || ''))
    : defaultActivities;

  activitiesToRender.forEach((actText) => {
    doc.setFont('helvetica', 'normal');
    doc.text('\u25CF', leftMargin, curY);

    const wrapped = doc.splitTextToSize(actText, contentWidth - 18);
    doc.text(wrapped, leftMargin + 14, curY);

    curY += wrapped.length * 13.8 + 10;
  });

  // Section 3: Counselling Sessions – [Month] [Year]
  curY = 321;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(23);
  doc.setTextColor(0, 0, 0);
  doc.text(`Counselling Sessions \u2013 ${data.month} ${data.year}`, leftMargin, curY);

  const currentMonthIdx = MONTH_NAMES.findIndex(m => m.toLowerCase() === data.month.toLowerCase());
  const monthNumStr = currentMonthIdx >= 0 ? String(currentMonthIdx + 1).padStart(2, '0') : '08';
  const yearStr = String(data.year);

  const w1Label = data.sessionStats.week1Label || `01-${monthNumStr}-${yearStr} to 08-${monthNumStr}-${yearStr} (1st Week)`;
  const w2Label = data.sessionStats.week2Label || `10-${monthNumStr}-${yearStr} to 15-${monthNumStr}-${yearStr} (2nd Week)`;
  const w3Label = data.sessionStats.week3Label || `17-${monthNumStr}-${yearStr} to 22-${monthNumStr}-${yearStr} (3rd Week)`;
  const w4Label = data.sessionStats.week4Label || `24-${monthNumStr}-${yearStr} to 29-${monthNumStr}-${yearStr} (4th Week)`;
  const w5Label = data.sessionStats.week5Label || `31-${monthNumStr}-${yearStr} (5th Week)`;

  const tableRows = [
    [w1Label, data.sessionStats.week1 === 8 ? '8 + 3 day leave' : String(data.sessionStats.week1)],
    [w2Label, String(data.sessionStats.week2)],
    [w3Label, String(data.sessionStats.week3)],
    [w4Label, String(data.sessionStats.week4)],
    [w5Label, String(data.sessionStats.week5)],
    ['Total', String(data.sessionStats.total)],
  ];

  autoTable(doc, {
    startY: 386,
    head: [[`${data.month} ${data.year}`, 'Number of Sessions']],
    body: tableRows,
    theme: 'grid',
    headStyles: {
      fillColor: [255, 255, 255],
      textColor: [255, 0, 0], // Red header label in original format
      fontStyle: 'bold',
      fontSize: 10,
      halign: 'center',
      valign: 'middle',
      lineWidth: 0.5,
      lineColor: [0, 0, 0],
    },
    bodyStyles: {
      fillColor: [255, 255, 255],
      textColor: [0, 0, 0],
      fontSize: 10,
      fontStyle: 'bold',
      halign: 'center',
      valign: 'middle',
      lineWidth: 0.5,
      lineColor: [0, 0, 0],
      cellPadding: 3.5,
    },
    columnStyles: {
      0: { cellWidth: 184 },
      1: { cellWidth: 216 },
    },
    didParseCell: (dataHook) => {
      // The second header column in original is black
      if (dataHook.section === 'head' && dataHook.column.index === 1) {
        dataHook.cell.styles.textColor = [0, 0, 0];
      }
      if (dataHook.row.index === tableRows.length - 1) {
        dataHook.cell.styles.fontStyle = 'bold';
      }
    },
    margin: { left: 72.5 },
  });

  // Section 4: Goals for the Upcoming Month
  const nextMonthIdx = currentMonthIdx >= 0 ? (currentMonthIdx + 1) % 12 : 8;
  const nextMonthName = MONTH_NAMES[nextMonthIdx];

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(23);
  doc.setTextColor(0, 0, 0);
  doc.text('Goals for the Upcoming Month \u2013', leftMargin, 554);
  doc.text(`${nextMonthName} ${data.year}`, leftMargin, 578);

  const defaultGoals = [
    'Continue regular individual and group counselling sessions for students.',
    'Plan and conduct a Suicide Prevention Programme to promote awareness, help-seeking behaviour, early identification, and appropriate support.',
    'Conduct the COPE Programme on Open Mic to encourage student expression, participation, and open conversations around mental health and well-being.',
    'Conduct a Psychology Club/HOPE Club group session on \u201CUnderstanding Human Behaviour from a Layman\u2019s Perspective\u201D, helping students understand basic psychological concepts and everyday human behaviour in an accessible manner.'
  ];

  const goalsToRender = (data.upcomingGoals && data.upcomingGoals.length > 0)
    ? data.upcomingGoals
    : defaultGoals;

  // Goals 1, 2, 3 on Page 2
  curY = 616;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);

  const page2Goals = goalsToRender.slice(0, 3);
  page2Goals.forEach((goal, idx) => {
    doc.text(`${idx + 1}.`, leftMargin + 18, curY);
    const wrapped = doc.splitTextToSize(goal, contentWidth - 36);
    doc.text(wrapped, leftMargin + 34, curY);
    curY += wrapped.length * 14.5 + 8;
  });

  // ══════════════════════════════════════════════════════════════
  // PAGE 3: Goal 4 + Prepared by Sign-off
  // ══════════════════════════════════════════════════════════════
  doc.addPage([612, 792]);

  curY = 73;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(0, 0, 0);

  const page3Goals = goalsToRender.slice(3);
  page3Goals.forEach((goal, idx) => {
    const itemNum = 4 + idx;
    doc.text(`${itemNum}.`, leftMargin + 18, curY);
    const wrapped = doc.splitTextToSize(goal, contentWidth - 36);
    doc.text(wrapped, leftMargin + 34, curY);
    curY += wrapped.length * 14.5 + 8;
  });

  // Prepared by Sign-off
  curY = Math.max(curY + 20, 155);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('Prepared by:', leftMargin, curY);

  curY += 15;
  doc.setFont('helvetica', 'bold');
  doc.text(data.counselorName || 'Ram Prudhvi Teja', leftMargin, curY);

  curY += 14.5;
  doc.setFont('helvetica', 'normal');
  doc.text('Senior Wellness Counsellor & Incharge', leftMargin, curY);

  curY += 14.5;
  doc.text('Vishnu Wellness Centre', leftMargin, curY);

  // Save the PDF
  const filename = `VWC_Counsellor_Report_${(data.counselorName || 'Ram_Prudhvi_Teja').replace(/\s+/g, '_')}_${data.month}_${data.year}.pdf`;
  doc.save(filename);
}
