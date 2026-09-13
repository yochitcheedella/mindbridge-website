import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

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
    date: string;
    meetingName: string;
    purposeOutcome: string;
  }>;

  // Section 2: Activities & Workshops
  activitiesConducted: Array<{
    date: string;
    activityName: string;
    targetAudience: string;
    participantsCount: number;
    keyTakeaway: string;
  }>;

  // Section 3: Counselling Sessions Weekly Breakdown
  sessionStats: {
    week1: number;
    week2: number;
    week3: number;
    week4: number;
    week5: number;
    total: number;
    // Categorical breakdown
    academicStress: number;
    emotionalAnxiety: number;
    familyInterpersonal: number;
    careerGuidance: number;
    generalWellbeing: number;
    crisisSos: number;
    genderBreakdown: { male: number; female: number; other: number };
  };

  // Section 4: Upcoming Goals
  upcomingGoals: string[];

  // Remarks / Clinical Notes
  generalRemarks: string;
}

export function generateCounselorMonthlyReportPDF(data: CounselorMonthlyReportData) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const primaryColor: [number, number, number] = [17, 17, 17]; // #111111
  const goldColor: [number, number, number] = [244, 197, 66]; // #F4C542
  const textMuted: [number, number, number] = [80, 80, 80];

  // Header Banner
  doc.setFillColor(...goldColor);
  doc.rect(0, 0, 210, 24, 'F');

  // Title in Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(...primaryColor);
  doc.text('SRI VISHNU EDUCATIONAL SOCIETY', 105, 10, { align: 'center' });
  doc.setFontSize(11);
  doc.text('VISHNU WELLNESS CENTRE — COUNSELLOR MONTHLY REPORT', 105, 17, { align: 'center' });

  // Subheader line
  doc.setDrawColor(...primaryColor);
  doc.setLineWidth(0.8);
  doc.line(14, 28, 196, 28);

  // Metadata Box
  doc.setFillColor(248, 249, 250);
  doc.roundedRect(14, 31, 182, 28, 2, 2, 'F');
  doc.setDrawColor(220, 220, 220);
  doc.setLineWidth(0.3);
  doc.roundedRect(14, 31, 182, 28, 2, 2, 'D');

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...primaryColor);
  doc.text('In-Charge Psychologist:', 18, 38);
  doc.setFont('helvetica', 'normal');
  doc.text(data.counselorName, 62, 38);

  doc.setFont('helvetica', 'bold');
  doc.text('Institution / Campus:', 18, 45);
  doc.setFont('helvetica', 'normal');
  doc.text(`${data.institution} (${data.department})`, 62, 45);

  doc.setFont('helvetica', 'bold');
  doc.text('Reporting Period:', 18, 52);
  doc.setFont('helvetica', 'normal');
  doc.text(`${data.month} ${data.year}`, 62, 52);

  doc.setFont('helvetica', 'bold');
  doc.text('Submission Date:', 125, 38);
  doc.setFont('helvetica', 'normal');
  doc.text(new Date(data.submittedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }), 160, 38);

  doc.setFont('helvetica', 'bold');
  doc.text('Total Consultations:', 125, 45);
  doc.setFont('helvetica', 'normal');
  doc.text(`${data.sessionStats.total} Sessions`, 160, 45);

  doc.setFont('helvetica', 'bold');
  doc.text('Status:', 125, 52);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(22, 101, 52);
  doc.text('OFFICIALLY FILED', 160, 52);

  let currentY = 64;

  // ── SECTION 1: MEETINGS & ADMINISTRATIVE ACTIVITIES ──
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(...primaryColor);
  doc.text('1. MEETINGS & ADMINISTRATIVE ACTIVITIES', 14, currentY);
  currentY += 3;

  const adminRows = data.administrativeMeetings.map(m => [
    m.date,
    m.meetingName,
    m.purposeOutcome
  ]);

  autoTable(doc, {
    startY: currentY,
    head: [['Date', 'Meeting / Discussion Title', 'Key Purpose & Actionable Outcome']],
    body: adminRows.length > 0 ? adminRows : [['-', 'No administrative meetings scheduled', 'N/A']],
    theme: 'grid',
    headStyles: {
      fillColor: primaryColor,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8.5,
      halign: 'left',
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [30, 30, 30],
      cellPadding: 2.5,
    },
    columnStyles: {
      0: { cellWidth: 25 },
      1: { cellWidth: 60 },
      2: { cellWidth: 97 },
    },
    margin: { left: 14, right: 14 },
  });

  currentY = (doc as any).lastAutoTable.finalY + 8;

  // ── SECTION 2: ACTIVITIES & WORKSHOPS CONDUCTED ──
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(...primaryColor);
  doc.text('2. SUMMARY OF ACTIVITIES & WORKSHOPS CONDUCTED', 14, currentY);
  currentY += 3;

  const actRows = data.activitiesConducted.map(a => [
    a.date,
    a.activityName,
    a.targetAudience,
    String(a.participantsCount),
    a.keyTakeaway
  ]);

  autoTable(doc, {
    startY: currentY,
    head: [['Date', 'Activity / Program Name', 'Target Audience', 'Count', 'Key Takeaway / Impact']],
    body: actRows.length > 0 ? actRows : [['-', 'None conducted during this period', '-', '0', '-']],
    theme: 'grid',
    headStyles: {
      fillColor: primaryColor,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8.5,
      halign: 'left',
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [30, 30, 30],
      cellPadding: 2.5,
    },
    columnStyles: {
      0: { cellWidth: 22 },
      1: { cellWidth: 50 },
      2: { cellWidth: 35 },
      3: { cellWidth: 15, halign: 'center' },
      4: { cellWidth: 60 },
    },
    margin: { left: 14, right: 14 },
  });

  currentY = (doc as any).lastAutoTable.finalY + 8;

  // ── SECTION 3: COUNSELLING SESSIONS DETAILED MATRIX ──
  // Check if we need page break
  if (currentY > 215) {
    doc.addPage();
    currentY = 20;
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(...primaryColor);
  doc.text('3. COUNSELLING SESSIONS TABLE (WEEKLY & CONCERN BREAKDOWN)', 14, currentY);
  currentY += 3;

  const weeklyRows = [
    [
      String(data.sessionStats.week1),
      String(data.sessionStats.week2),
      String(data.sessionStats.week3),
      String(data.sessionStats.week4),
      String(data.sessionStats.week5),
      String(data.sessionStats.total)
    ]
  ];

  autoTable(doc, {
    startY: currentY,
    head: [['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5', 'MONTH TOTAL']],
    body: weeklyRows,
    theme: 'grid',
    headStyles: {
      fillColor: [244, 197, 66],
      textColor: [17, 17, 17],
      fontStyle: 'bold',
      fontSize: 8.5,
      halign: 'center',
    },
    bodyStyles: {
      fontSize: 9,
      fontStyle: 'bold',
      textColor: [17, 17, 17],
      halign: 'center',
      cellPadding: 3,
    },
    margin: { left: 14, right: 14 },
  });

  currentY = (doc as any).lastAutoTable.finalY + 4;

  const concernRows = [
    ['Academic Stress & Exam Anxiety', String(data.sessionStats.academicStress)],
    ['Emotional Regulation & Generalized Anxiety', String(data.sessionStats.emotionalAnxiety)],
    ['Family & Interpersonal Relationships', String(data.sessionStats.familyInterpersonal)],
    ['Career Transition, Placement & Focus', String(data.sessionStats.careerGuidance)],
    ['General Wellbeing & Lifestyle Maintenance', String(data.sessionStats.generalWellbeing)],
    ['Critical Care / SOS Crisis Interventions', String(data.sessionStats.crisisSos)],
  ];

  autoTable(doc, {
    startY: currentY,
    head: [['Clinical & Developmental Concern Category', 'Number of Consultations']],
    body: concernRows,
    theme: 'grid',
    headStyles: {
      fillColor: primaryColor,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8.5,
    },
    bodyStyles: {
      fontSize: 8,
      cellPadding: 2,
    },
    columnStyles: {
      0: { cellWidth: 142 },
      1: { cellWidth: 40, halign: 'center', fontStyle: 'bold' },
    },
    margin: { left: 14, right: 14 },
  });

  currentY = (doc as any).lastAutoTable.finalY + 8;

  // ── SECTION 4: GOALS FOR UPCOMING MONTH & REMARKS ──
  if (currentY > 220) {
    doc.addPage();
    currentY = 20;
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(...primaryColor);
  doc.text('4. GOALS FOR THE UPCOMING MONTH', 14, currentY);
  currentY += 4;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(40, 40, 40);

  if (data.upcomingGoals && data.upcomingGoals.length > 0) {
    data.upcomingGoals.forEach((goal, idx) => {
      doc.text(`•  ${goal}`, 18, currentY);
      currentY += 4.5;
    });
  } else {
    doc.text('•  Maintain regular individualized therapeutic follow-ups and psycho-educational outreach.', 18, currentY);
    currentY += 4.5;
  }

  currentY += 4;
  if (data.generalRemarks) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(...primaryColor);
    doc.text('Clinical Observations & General Remarks:', 14, currentY);
    currentY += 4;
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8.5);
    doc.setTextColor(60, 60, 60);
    const splitRemarks = doc.splitTextToSize(data.generalRemarks, 180);
    doc.text(splitRemarks, 14, currentY);
    currentY += splitRemarks.length * 4.5 + 4;
  }

  // ── SIGN-OFF & ATTESTATION ──
  if (currentY > 230) {
    doc.addPage();
    currentY = 30;
  } else {
    currentY += 12;
  }

  doc.setDrawColor(200, 200, 200);
  doc.line(14, currentY, 196, currentY);
  currentY += 8;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...primaryColor);
  doc.text('Prepared & Submitted By:', 18, currentY);
  doc.text('Verified & Forwarded By:', 130, currentY);

  currentY += 5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text(data.counselorName, 18, currentY);
  doc.text('Head, Vishnu Wellness Centre', 130, currentY);

  currentY += 4;
  doc.setFontSize(8);
  doc.setTextColor(...textMuted);
  doc.text(`Consultant Psychologist · ${data.institution}`, 18, currentY);
  doc.text('Sri Vishnu Educational Society (SVES)', 130, currentY);

  // Footer on all pages
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(130, 130, 130);
    doc.text(
      `Vishnu Wellness Centre Confidential Documentation | Page ${i} of ${pageCount}`,
      105,
      287,
      { align: 'center' }
    );
  }

  // Save the PDF
  const filename = `VWC_Counsellor_Report_${data.counselorName.replace(/\s+/g, '_')}_${data.month}_${data.year}.pdf`;
  doc.save(filename);
}
