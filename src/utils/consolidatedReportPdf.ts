import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { drawVishnuHeaderLogo } from './counselorReportPdf';
import {
  VISHNU_LOGO_BASE64,
  P5_WORKSHOP_IMG_BASE64,
  P7_FLYERS_IMG_BASE64,
  P7_INSTA_IMG_BASE64,
  P10_IMG1_BASE64,
  P10_IMG2_BASE64,
  P10_IMG3_BASE64,
  P10_IMG4_BASE64,
} from './reportAssetsBase64';

export interface InstitutionStat {
  institution: string;
  code: string;
  counselorName?: string;
  activeStudents: number;
  individualSessions: number;
  groupSessions: number;
  totalSessions: number;
  highRiskCount: number;
}

export interface ConsolidatedReportData {
  id: string;
  reportTitle: string;
  month: string;
  year: number;
  compiledBy: string;
  approvedBy: string;
  submittedAt: string;
  executiveSummary: {
    totalSocietyStudents: number;
    totalSessionsAcrossCampuses: number;
    avgSatisfactionIndex: string;
    sosCrisisHandled: number;
    workshopsConducted: number;
  };
  institutionBreakdown: InstitutionStat[];
  concernDistribution?: Array<{ concern: string; count: number; percentage: string }>;
  clinicalRiskSummary?: {
    lowRisk: number;
    mediumRisk: number;
    highRiskEmergency: number;
  };
  keyInitiatives?: Array<{ title: string; reach: string; impact: string }>;
  facultyTrainingSummary?: string;
  upcomingDirectives?: string[];
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

/**
 * Generates the official Shri Vishnu Educational Society (SVES)
 * Central Vishnu Wellness Centre Consolidated Monthly Report PDF.
 * Matches the official institutional document format (Pages 1 to 10) with 100% fidelity.
 */
export function generateConsolidatedReportPDF(data: ConsolidatedReportData) {
  // Standard Letter dimensions: 612 x 792 pt
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: [612, 792],
  });

  const leftMargin = 72; // 1 inch
  const contentWidth = 468; // 612 - 144
  const maroonColor: [number, number, number] = [152, 0, 0]; // 0x980000 official table header maroon

  const currentMonthIdx = MONTH_NAMES.findIndex(m => m.toLowerCase() === data.month.toLowerCase());
  const nextMonthIdx = currentMonthIdx >= 0 ? (currentMonthIdx + 1) % 12 : 8;
  const nextMonthName = MONTH_NAMES[nextMonthIdx];

  const totalSessionsCount = data.executiveSummary?.totalSessionsAcrossCampuses || 195;

  // ══════════════════════════════════════════════════════════════
  // PAGE 1: Header Logo, Society Titles & 1. Executive Summary (Part 1)
  // ══════════════════════════════════════════════════════════════
  drawVishnuHeaderLogo(doc, 306, 97.5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(23);
  doc.setTextColor(0, 0, 0);
  doc.text('SHRI VISHNU EDUCATIONAL SOCIETY', 306, 190, { align: 'center' });

  doc.setFontSize(17);
  doc.text('VISHNU WELLNESS CENTRE', 306, 238, { align: 'center' });

  doc.text(`CONSOLIDATED MONTHLY REPORT \u2013 ${data.month.toUpperCase()} ${data.year}`, 306, 284, { align: 'center' });

  // 1. Executive Summary
  doc.setFontSize(23);
  doc.text('1. Executive Summary', leftMargin, 346);

  const execRowsPage1 = [
    ['Institutions Covered / Represented', '8'],
    ['Individual Counselling Sessions Reported', String(totalSessionsCount)],
    ['Student Group Sessions Reported', '7+'],
    ['Digital Detox Programme Participants', '45'],
    ['MINDTAP Episodes Recorded', '5'],
    ['Faculty Training', 'Batch 1 Completed'],
  ];

  autoTable(doc, {
    startY: 408,
    head: [['Particulars', `${data.month} ${data.year}`]],
    body: execRowsPage1,
    theme: 'grid',
    headStyles: {
      fillColor: [255, 255, 255],
      textColor: maroonColor,
      fontStyle: 'bold',
      fontSize: 11,
      lineWidth: 0.5,
      lineColor: [0, 0, 0],
      valign: 'middle',
    },
    bodyStyles: {
      fillColor: [255, 255, 255],
      textColor: [0, 0, 0],
      fontStyle: 'bold',
      fontSize: 11,
      lineWidth: 0.5,
      lineColor: [0, 0, 0],
      cellPadding: 4,
      valign: 'middle',
    },
    columnStyles: {
      0: { cellWidth: 232 },
      1: { cellWidth: 116, halign: 'center' },
    },
    margin: { left: 72.5 },
  });

  // ══════════════════════════════════════════════════════════════
  // PAGE 2: Exec Summary (Part 2), 2. Institution Summary, 3. Follow-up Intro
  // ══════════════════════════════════════════════════════════════
  doc.addPage([612, 792]);

  const execRowsPage2 = [
    ['Wellness Team L&D Programme', '2 Days'],
    ['Gatekeeper Training', 'Completed'],
    ['Mind Gazette', 'Issue 1 Developed'],
    ['Wellness Social Media', 'Initiated / Developed'],
  ];

  autoTable(doc, {
    startY: 72.5,
    body: execRowsPage2,
    theme: 'grid',
    bodyStyles: {
      fillColor: [255, 255, 255],
      textColor: [0, 0, 0],
      fontStyle: 'bold',
      fontSize: 11,
      lineWidth: 0.5,
      lineColor: [0, 0, 0],
      cellPadding: 4,
      valign: 'middle',
    },
    columnStyles: {
      0: { cellWidth: 232 },
      1: { cellWidth: 116, halign: 'center' },
    },
    margin: { left: 72.5 },
  });

  // 2. Institution-wise Counselling Summary
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(23);
  doc.setTextColor(0, 0, 0);
  doc.text('2. Institution-wise Counselling Summary', leftMargin, 280);

  const defaultInstBreakdown = [
    { inst: 'VIT', counselor: 'Ram Prudhvi Teja', count: 31 },
    { inst: 'SVECW + VIT', counselor: 'Sahithi Challa', count: 32 },
    { inst: 'VDC', counselor: 'Angel', count: 29 },
    { inst: 'SVCP', counselor: 'Akshitha Selvaraj', count: 27 },
    { inst: 'SBSP', counselor: 'Bantu Anumitha', count: 28 },
    { inst: "Vishnu Women's University", counselor: 'Wellness Counsellor', count: 46 },
    { inst: 'B.V. Raju College', counselor: 'G. Navya Sri', count: 2 },
  ];

  const instRows: string[][] = (data.institutionBreakdown && data.institutionBreakdown.length > 0)
    ? data.institutionBreakdown.map(i => [i.institution, i.counselorName || 'Wellness Counsellor', String(i.individualSessions)])
    : defaultInstBreakdown.map(i => [i.inst, i.counselor, String(i.count)]);

  const sumSessions = instRows.reduce((acc, r) => acc + (Number(r[2]) || 0), 0) || totalSessionsCount;
  instRows.push(['Total Reported Sessions', '', String(sumSessions)]);

  autoTable(doc, {
    startY: 346,
    head: [['Institution / Area', 'Counsellor / Reporting Source', 'Individual Sessions']],
    body: instRows,
    theme: 'grid',
    headStyles: {
      fillColor: [255, 255, 255],
      textColor: maroonColor,
      fontStyle: 'bold',
      fontSize: 11,
      lineWidth: 0.5,
      lineColor: [0, 0, 0],
      valign: 'middle',
    },
    bodyStyles: {
      fillColor: [255, 255, 255],
      textColor: [0, 0, 0],
      fontSize: 11,
      fontStyle: 'bold',
      lineWidth: 0.5,
      lineColor: [0, 0, 0],
      cellPadding: 3.5,
      valign: 'middle',
    },
    columnStyles: {
      0: { cellWidth: 145 },
      1: { cellWidth: 167, halign: 'center' },
      2: { cellWidth: 109, halign: 'center' },
    },
    didParseCell: (hook) => {
      if (hook.row.index === instRows.length - 1) {
        hook.cell.styles.fontStyle = 'bold';
      }
    },
    margin: { left: 72.5 },
  });

  // 3. Student Counselling & Follow-up Intro
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(23);
  doc.text('3. Student Counselling & Follow-up', leftMargin, 643);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(`During ${data.month}, the Wellness Centre continued:`, leftMargin, 685);

  // ══════════════════════════════════════════════════════════════
  // PAGE 3: Follow-up Bullets, Notes & 4. Major Student Programmes
  // ══════════════════════════════════════════════════════════════
  doc.addPage([612, 792]);

  let curY = 72;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(0, 0, 0);

  const followUpBullets = [
    'Individual counselling for students.',
    'Counselling for referred and walk-in students.',
    'Follow-up sessions after screening.',
    'First-year student check-ins following screening.',
    'Continued documentation and updating of student case files.',
    'Follow-up support for students requiring continued assistance.'
  ];

  followUpBullets.forEach((bullet) => {
    doc.text('\u25CF', leftMargin + 18, curY);
    doc.text(bullet, leftMargin + 34, curY);
    curY += 14.5;
  });

  curY += 12;
  const vdcNote = 'At VDC, the reported 29 sessions included regular counselling as well as screening follow-up sessions.';
  const vwuNote = 'At VWU, 35 clients availed counselling services through 46 sessions during the month.';
  doc.text(doc.splitTextToSize(vdcNote, contentWidth), leftMargin, curY);
  curY += 28;
  doc.text(doc.splitTextToSize(vwuNote, contentWidth), leftMargin, curY);

  // 4. Major Student Programmes
  curY = 278;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(23);
  doc.text('4. Major Student Programmes', leftMargin, curY);

  // Vishnu Dental College
  curY = 326;
  doc.setFontSize(13);
  doc.text('Vishnu Dental College:', leftMargin, curY);

  curY = 360;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('Two student programmes were conducted for 1st BDS students:', leftMargin, curY);

  curY = 387;
  ['Know Your Worth', 'Confidence Beyond the Comfort Zone'].forEach((p) => {
    doc.text('\u25CF', leftMargin + 18, curY);
    doc.text(p, leftMargin + 34, curY);
    curY += 14.5;
  });

  curY += 12;
  doc.text(
    doc.splitTextToSize('Faculty training was also initiated, with Batch 1 completed and subsequent batches continuing.', contentWidth),
    leftMargin,
    curY
  );

  // Vishnu Women's University
  curY = 475;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text("Vishnu Women's University:", leftMargin, curY);

  curY = 510;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(
    doc.splitTextToSize('Sessions on Managing Stress & Emotions were conducted for 2nd- and 3rd-year IT students.', contentWidth),
    leftMargin,
    curY
  );

  curY += 28;
  const vwuText = 'A 1st Year B.Tech Orientation Programme was also conducted covering student well-being, common college-related challenges, support services and the Vishnu Wellness Centre.';
  doc.text(doc.splitTextToSize(vwuText, contentWidth), leftMargin, curY);

  // Vishnu School
  curY = 613;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('Vishnu School:', leftMargin, curY);

  curY = 647;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('3 group sessions were conducted for Class 10 students:', leftMargin, curY);

  curY = 674;
  [
    '1. Perspective-taking through character activities',
    '2. Personal preferences and influences',
    '3. Emotional awareness'
  ].forEach((s) => {
    doc.text(s, leftMargin + 18, curY);
    curY += 14.5;
  });

  // ══════════════════════════════════════════════════════════════
  // PAGE 4: B.V. Raju College, 5. Digital Detox, 6. Faculty Dev
  // ══════════════════════════════════════════════════════════════
  doc.addPage([612, 792]);

  curY = 105;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('B.V. Raju College:', leftMargin, curY);

  curY = 139;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('As part of the newly initiated Wellness Centre services:', leftMargin, curY);

  curY = 166;
  [
    '4 group sessions conducted.',
    '2 individual counselling sessions conducted.',
    'Counselling services introduced to students.',
    'Coordination initiated with COPE representatives.',
    'World Suicide Prevention Day programme planning initiated.'
  ].forEach((b) => {
    doc.text('\u25CF', leftMargin + 18, curY);
    doc.text(b, leftMargin + 34, curY);
    curY += 14.5;
  });

  // 5. Digital Detox Programme
  curY = 290;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(23);
  doc.text('5. Digital Detox Programme', leftMargin, curY);

  curY = 338;
  doc.setFontSize(13);
  doc.text('Smt. B. Seetha Polytechnic', leftMargin, curY);

  curY = 372;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(`A Digital Detox Programme was conducted on 29 ${data.month} ${data.year} for:`, leftMargin, curY);

  curY = 401;
  doc.setFontSize(13);
  doc.text('45 Hostel Students', leftMargin, curY);

  curY = 430;
  doc.setFontSize(11);
  doc.text(
    doc.splitTextToSize('Students spent approximately 5 hours without mobile phones and digital devices and participated in:', contentWidth),
    leftMargin,
    curY
  );

  curY = 471;
  ['Interactive games', 'Dance', 'Music', 'Group activities', 'Recreational activities'].forEach((a) => {
    doc.text('\u25CF', leftMargin + 18, curY);
    doc.text(a, leftMargin + 34, curY);
    curY += 14.5;
  });

  curY = 556;
  doc.text('The programme was co-facilitated by Anumitha and Sahithi.', leftMargin, curY);

  // 6. Faculty Development & Team Learning
  curY = 621;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(23);
  doc.text('6. Faculty Development & Team Learning', leftMargin, curY);

  curY = 665;
  doc.setFontSize(13);
  doc.text('Faculty Training:', leftMargin, curY);

  // ══════════════════════════════════════════════════════════════
  // PAGE 5: Faculty Training Text, L&D Workshop Photo & 7. Suicide Prevention
  // ══════════════════════════════════════════════════════════════
  doc.addPage([612, 792]);

  curY = 72;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(
    doc.splitTextToSize(`The second set of Faculty Training Sessions was initiated during ${data.month}, with Batch 1 completed and further batches continuing.`, contentWidth),
    leftMargin,
    curY
  );

  curY = 115;
  doc.setFontSize(13);
  doc.text('Wellness Team L&D:', leftMargin, curY);

  curY = 145;
  doc.setFontSize(11);
  doc.text(
    doc.splitTextToSize(`A two-day Learning & Development programme was conducted on 28–29 ${data.month} for the Wellness Counsellors on:`, contentWidth),
    leftMargin,
    curY
  );

  curY = 186;
  doc.text('\u201CPsychosomatic Conditions: A Holistic Approach to Counselling.\u201D', leftMargin, curY);

  curY = 212;
  doc.text('The programme was conducted by Ms. Akshitha Selvaraj.', leftMargin, curY);

  // Workshop photo
  try {
    doc.addImage(P5_WORKSHOP_IMG_BASE64, 'JPEG', 109.5, 238.5, 364.5, 240);
  } catch (e) {
    console.warn('Failed to embed P5 image', e);
  }

  // 7. Suicide Prevention & Professional Development
  curY = 532;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(23);
  doc.text('7. Suicide Prevention & Professional', leftMargin, curY);
  doc.text('Development', leftMargin, curY + 30);

  curY = 605;
  doc.setFontSize(11);
  const gatekeeperText = 'The Wellness team completed the NIMHANS Digital Academy \u2013 Primer on Suicide Prevention: A Gatekeeper Training Approach.';
  doc.text(doc.splitTextToSize(gatekeeperText, contentWidth), leftMargin, curY);

  curY = 646;
  doc.text("The training strengthened the team's preparedness for:", leftMargin, curY);

  curY = 672;
  ['Early identification', 'Appropriate response', 'Referral'].forEach((g) => {
    doc.text('\u25CF', leftMargin + 18, curY);
    doc.text(g, leftMargin + 34, curY);
    curY += 14.5;
  });

  // ══════════════════════════════════════════════════════════════
  // PAGE 6: 7. Suicide Cont., 8. MINDTAP, 9. Outreach
  // ══════════════════════════════════════════════════════════════
  doc.addPage([612, 792]);

  curY = 72;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('\u25CF', leftMargin + 18, curY);
  doc.text('Student safety support', leftMargin + 34, curY);

  curY = 99;
  doc.text(
    doc.splitTextToSize('The team also began preparations for World Suicide Prevention Day programmes across institutions.', contentWidth),
    leftMargin,
    curY
  );

  // 8. MINDTAP – Radio Vishnu
  curY = 179;
  doc.setFontSize(23);
  doc.text('8. MINDTAP \u2013 Radio Vishnu', leftMargin, curY);

  curY = 221;
  doc.setFontSize(11);
  doc.text(`The MINDTAP initiative continued during ${data.month}.`, leftMargin, curY);

  curY = 250;
  doc.setFontSize(13);
  doc.text('5 Episodes Recorded', leftMargin, curY);

  curY = 279;
  doc.setFontSize(11);
  const radioText = 'The episodes were recorded as part of the continued effort to provide wellness and awareness content to the campus community through Radio Vishnu.';
  doc.text(doc.splitTextToSize(radioText, contentWidth), leftMargin, curY);

  // 9. Wellness Centre Communication & Outreach
  curY = 359;
  doc.setFontSize(23);
  doc.text('9. Wellness Centre Communication &', leftMargin, curY);
  doc.text('Outreach', leftMargin, curY + 30);

  curY = 433;
  doc.setFontSize(13);
  doc.text('Social Media', leftMargin, curY);

  curY = 462;
  doc.setFontSize(11);
  doc.text(
    doc.splitTextToSize(`The Vishnu Wellness Centre's social media presence was initiated and developed during ${data.month}.`, contentWidth),
    leftMargin,
    curY
  );

  curY = 503;
  doc.text('The initial focus included:', leftMargin, curY);

  curY = 530;
  [
    'Introducing the Wellness Centre',
    'Sharing its vision and services',
    'Introducing counsellors',
    'Creating awareness about available student support'
  ].forEach((s) => {
    doc.text('\u25CF', leftMargin + 18, curY);
    doc.text(s, leftMargin + 34, curY);
    curY += 14.5;
  });

  // ══════════════════════════════════════════════════════════════
  // PAGE 7: Social Media Images, Mind Gazette, 10. Orientation
  // ══════════════════════════════════════════════════════════════
  doc.addPage([612, 792]);

  try {
    doc.addImage(P7_FLYERS_IMG_BASE64, 'JPEG', 109.5, 73.5, 409.5, 219.75);
    doc.addImage(P7_INSTA_IMG_BASE64, 'PNG', 109.5, 299.0, 418.5, 180.0);
  } catch (e) {
    console.warn('Failed to embed P7 images', e);
  }

  curY = 498;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('The Mind Gazette', leftMargin, curY);

  curY = 527;
  doc.setFontSize(11);
  const gazetteText = 'Issue 1 of \u201CThe Mind Gazette\u201D, a monthly mental-health newsletter, was conceptualized and developed in collaboration with the Student Success Centre.';
  doc.text(doc.splitTextToSize(gazetteText, contentWidth), leftMargin, curY);

  // 10. Orientation & Student Outreach
  curY = 607;
  doc.setFontSize(23);
  doc.text('10. Orientation & Student Outreach', leftMargin, curY);

  curY = 649;
  doc.setFontSize(11);
  doc.text(`During ${data.month}, the Wellness Centre participated in:`, leftMargin, curY);

  curY = 675;
  [
    'VWU & VIT Induction Programme',
    '1st Year B.Tech Orientation',
    'Student awareness programmes'
  ].forEach((o) => {
    doc.text('\u25CF', leftMargin + 18, curY);
    doc.text(o, leftMargin + 34, curY);
    curY += 14.5;
  });

  // ══════════════════════════════════════════════════════════════
  // PAGE 8: 10. Orientation Cont., 11. Key Achievements, 12. Institutional Dev
  // ══════════════════════════════════════════════════════════════
  doc.addPage([612, 792]);

  curY = 72;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  [
    'Group sessions',
    'Screening follow-ups',
    'Counselling service introductions'
  ].forEach((o) => {
    doc.text('\u25CF', leftMargin + 18, curY);
    doc.text(o, leftMargin + 34, curY);
    curY += 14.5;
  });

  curY = 128;
  const indText = 'The VWU & VIT induction programme included students and parents and provided an introduction to institutional resources and student support systems.';
  doc.text(doc.splitTextToSize(indText, contentWidth), leftMargin, curY);

  // 11. Key Achievements
  curY = 235;
  doc.setFontSize(23);
  doc.text(`11. Key Achievements \u2013 ${data.month} ${data.year}`, leftMargin, curY);

  curY = 283;
  doc.setFontSize(17);
  doc.text(`${data.month.toUpperCase()} AT A GLANCE`, leftMargin, curY);

  curY = 319;
  doc.setFontSize(13);
  [
    `${totalSessionsCount} :  Individual Counselling Sessions Reported`,
    '7+:  Student Group Sessions',
    '45:  Students in Digital Detox Programme',
    '5:  MINDTAP Episodes Recorded',
    '2 Days:  Wellness Team L&D Programme'
  ].forEach((ach) => {
    doc.text(ach, leftMargin, curY);
    curY += 32.5;
  });

  // 12. Key Institutional Developments
  curY = 519;
  doc.setFontSize(23);
  doc.text('12. Key Institutional Developments', leftMargin, curY);

  curY = 561;
  doc.setFontSize(11);
  const devIntro = `During ${data.month}, the Wellness Centre progressed from primarily delivering counselling services towards a more structured, preventive and institution-wide wellness model through:`;
  doc.text(doc.splitTextToSize(devIntro, contentWidth), leftMargin, curY);

  curY = 616;
  [
    'Counselling and follow-up',
    'Student screening',
    'Group awareness programmes',
    'Digital Detox initiatives',
    'Faculty training',
    'Counsellor training',
    'Suicide-prevention preparedness'
  ].forEach((d) => {
    doc.text('\u25CF', leftMargin + 18, curY);
    doc.text(d, leftMargin + 34, curY);
    curY += 14.5;
  });

  // ══════════════════════════════════════════════════════════════
  // PAGE 9: 12. Developments Cont. & 13. Priorities for Next Month
  // ══════════════════════════════════════════════════════════════
  doc.addPage([612, 792]);

  curY = 72;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  [
    'MINDTAP content creation',
    'Mind Gazette development',
    'Social media outreach',
    'New institutional expansion',
    'Standardized documentation and reporting'
  ].forEach((d) => {
    doc.text('\u25CF', leftMargin + 18, curY);
    doc.text(d, leftMargin + 34, curY);
    curY += 14.5;
  });

  // 13. Priorities
  curY = 196;
  doc.setFontSize(23);
  doc.text(`13. Priorities for ${nextMonthName} ${data.year}`, leftMargin, curY);

  curY = 240;
  doc.setFontSize(13);
  doc.text('Student Programmes', leftMargin, curY);

  curY = 269;
  doc.setFontSize(11);
  [
    'World Suicide Prevention Day programmes',
    'Open Mic / COPE programme',
    'Group sessions across institutions',
    "Freshers' orientation",
    'Student screening',
    'Digital Detox programmes'
  ].forEach((sp) => {
    doc.text('\u25CF', leftMargin + 18, curY);
    doc.text(sp, leftMargin + 34, curY);
    curY += 14.5;
  });

  curY = 371;
  doc.setFontSize(13);
  doc.text('Counselling', leftMargin, curY);

  curY = 400;
  doc.setFontSize(11);
  [
    'Continue individual counselling',
    'Follow-up sessions for existing students',
    'Screening-based check-ins',
    'Continued case-file documentation'
  ].forEach((cp) => {
    doc.text('\u25CF', leftMargin + 18, curY);
    doc.text(cp, leftMargin + 34, curY);
    curY += 14.5;
  });

  curY = 472;
  doc.setFontSize(13);
  doc.text('Institutional Outreach', leftMargin, curY);

  curY = 501;
  doc.setFontSize(11);
  [
    'Expand Wellness services at B.V. Raju College',
    'Conduct awareness sessions across all three years',
    'Strengthen student engagement through Student PRs',
    'Continue Psychology / Wellness Club activities'
  ].forEach((io) => {
    doc.text('\u25CF', leftMargin + 18, curY);
    doc.text(io, leftMargin + 34, curY);
    curY += 14.5;
  });

  curY = 573;
  doc.setFontSize(13);
  doc.text('Team Development', leftMargin, curY);

  curY = 602;
  doc.setFontSize(11);
  [
    'Continue Faculty Training batches',
    'Continue professional development',
    'Strengthen counsellor coordination and supervision'
  ].forEach((td) => {
    doc.text('\u25CF', leftMargin + 18, curY);
    doc.text(td, leftMargin + 34, curY);
    curY += 14.5;
  });

  curY = 658;
  const closingText = `The ${nextMonthName} plans reported by the counsellors include Suicide Prevention Day programmes, Open Mic, group sessions, follow-up counselling, screening and fresher orientation.`;
  doc.text(doc.splitTextToSize(closingText, contentWidth), leftMargin, curY);

  // ══════════════════════════════════════════════════════════════
  // PAGE 10: Event Photo Gallery (4 Official Campuses Photos)
  // ══════════════════════════════════════════════════════════════
  doc.addPage([612, 792]);

  try {
    // Top Row: 2 Photos side by side
    doc.addImage(P10_IMG1_BASE64, 'JPEG', 73.5, 75.0, 146.25, 195.0);
    doc.addImage(P10_IMG2_BASE64, 'JPEG', 222.75, 73.5, 164.25, 196.5);

    // Middle Photo: Future Leaders Stage
    doc.addImage(P10_IMG3_BASE64, 'JPEG', 73.5, 275.7, 313.5, 176.25);

    // Bottom Photo: Counsellors Meeting Room
    doc.addImage(P10_IMG4_BASE64, 'JPEG', 73.5, 457.7, 312.75, 181.5);
  } catch (e) {
    console.warn('Failed to embed Page 10 photos', e);
  }

  // Save the PDF
  const filename = `SVES_Consolidated_Monthly_Report_${data.month}_${data.year}.pdf`;
  doc.save(filename);
}
