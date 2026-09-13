import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export interface InstitutionStat {
  institution: string;
  code: string;
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
    avgSatisfactionIndex: string; // e.g. "94.8%"
    sosCrisisHandled: number;
    workshopsConducted: number;
  };
  institutionBreakdown: InstitutionStat[];
  concernDistribution: Array<{ concern: string; count: number; percentage: string }>;
  clinicalRiskSummary: {
    lowRisk: number;
    mediumRisk: number;
    highRiskEmergency: number;
  };
  keyInitiatives: Array<{ title: string; reach: string; impact: string }>;
  facultyTrainingSummary: string;
  upcomingDirectives: string[];
}

export function generateConsolidatedReportPDF(data: ConsolidatedReportData) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const primaryColor: [number, number, number] = [17, 17, 17];
  const goldColor: [number, number, number] = [244, 197, 66];
  const textMuted: [number, number, number] = [90, 90, 90];

  // ── HEADER ──
  doc.setFillColor(...goldColor);
  doc.rect(0, 0, 210, 26, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(...primaryColor);
  doc.text('SRI VISHNU EDUCATIONAL SOCIETY', 105, 10, { align: 'center' });
  doc.setFontSize(10.5);
  doc.text('CENTRAL VISHNU WELLNESS CENTRE — CONSOLIDATED MONTHLY REPORT', 105, 17, { align: 'center' });
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.text('Attachment 5 Comprehensive Institutional Wellbeing & Clinical Governance Audit', 105, 23, { align: 'center' });

  // Metadata Panel
  doc.setFillColor(248, 249, 250);
  doc.roundedRect(14, 30, 182, 25, 2, 2, 'F');
  doc.setDrawColor(220, 220, 220);
  doc.setLineWidth(0.3);
  doc.roundedRect(14, 30, 182, 25, 2, 2, 'D');

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...primaryColor);
  doc.text('Reporting Cycle:', 18, 37);
  doc.setFont('helvetica', 'normal');
  doc.text(`${data.month} ${data.year}`, 52, 37);

  doc.setFont('helvetica', 'bold');
  doc.text('Compiled By:', 18, 44);
  doc.setFont('helvetica', 'normal');
  doc.text(data.compiledBy, 52, 44);

  doc.setFont('helvetica', 'bold');
  doc.text('Approved By:', 18, 51);
  doc.setFont('helvetica', 'normal');
  doc.text(data.approvedBy, 52, 51);

  doc.setFont('helvetica', 'bold');
  doc.text('Total Campuses Covered:', 115, 37);
  doc.setFont('helvetica', 'normal');
  doc.text(`${data.institutionBreakdown.length} Institutions`, 160, 37);

  doc.setFont('helvetica', 'bold');
  doc.text('Grand Total Sessions:', 115, 44);
  doc.setFont('helvetica', 'normal');
  doc.text(`${data.executiveSummary.totalSessionsAcrossCampuses} Consultations`, 160, 44);

  doc.setFont('helvetica', 'bold');
  doc.text('Satisfaction Index:', 115, 51);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(22, 101, 52);
  doc.text(data.executiveSummary.avgSatisfactionIndex, 160, 51);

  let currentY = 60;

  // ── 1. EXECUTIVE SUMMARY TABLE ──
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...primaryColor);
  doc.text('1. EXECUTIVE SUMMARY & KEY INDICATORS', 14, currentY);
  currentY += 3;

  const execRows = [
    ['Total Enrolled Student Body Covered', `${data.executiveSummary.totalSocietyStudents.toLocaleString()} Students`],
    ['Total Clinical & Developmental Sessions', `${data.executiveSummary.totalSessionsAcrossCampuses} Completed Consultations`],
    ['Emergency / SOS Interventions Safeguarded', `${data.executiveSummary.sosCrisisHandled} Cases (100% De-escalated)`],
    ['Campus Wellness Workshops & Stalls', `${data.executiveSummary.workshopsConducted} Programs Conducted`],
    ['Harmonized Emotive Feedback Score', `${data.executiveSummary.avgSatisfactionIndex} Positive Resonance`]
  ];

  autoTable(doc, {
    startY: currentY,
    head: [['Strategic Metric', 'Consolidated Result']],
    body: execRows,
    theme: 'grid',
    headStyles: {
      fillColor: primaryColor,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
    },
    bodyStyles: {
      fontSize: 8,
      cellPadding: 2,
    },
    columnStyles: {
      0: { cellWidth: 120 },
      1: { cellWidth: 62, fontStyle: 'bold' },
    },
    margin: { left: 14, right: 14 },
  });

  currentY = (doc as any).lastAutoTable.finalY + 7;

  // ── 2. INSTITUTION-WISE SESSION BREAKDOWN (VIT, SVECW, VDC, SVCP, SBSP, VWU, BVRC) ──
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...primaryColor);
  doc.text('2. INSTITUTION-WISE SESSION BREAKDOWN', 14, currentY);
  currentY += 3;

  const instRows = data.institutionBreakdown.map(i => [
    i.institution,
    i.code,
    String(i.individualSessions),
    String(i.groupSessions),
    String(i.totalSessions),
    String(i.highRiskCount)
  ]);

  // Grand total row
  const sumIndiv = data.institutionBreakdown.reduce((acc, c) => acc + c.individualSessions, 0);
  const sumGroup = data.institutionBreakdown.reduce((acc, c) => acc + c.groupSessions, 0);
  const sumTot = data.institutionBreakdown.reduce((acc, c) => acc + c.totalSessions, 0);
  const sumHigh = data.institutionBreakdown.reduce((acc, c) => acc + c.highRiskCount, 0);

  instRows.push(['ALL INSTITUTIONS TOTAL', 'SVES', String(sumIndiv), String(sumGroup), String(sumTot), String(sumHigh)]);

  autoTable(doc, {
    startY: currentY,
    head: [['Institution Name', 'Code', 'Individual', 'Group', 'Total Sessions', 'High-Risk']],
    body: instRows,
    theme: 'grid',
    headStyles: {
      fillColor: [244, 197, 66],
      textColor: [17, 17, 17],
      fontStyle: 'bold',
      fontSize: 8,
    },
    bodyStyles: {
      fontSize: 7.5,
      cellPadding: 2,
    },
    columnStyles: {
      0: { cellWidth: 70 },
      1: { cellWidth: 22, halign: 'center' },
      2: { cellWidth: 22, halign: 'center' },
      3: { cellWidth: 22, halign: 'center' },
      4: { cellWidth: 26, halign: 'center', fontStyle: 'bold' },
      5: { cellWidth: 20, halign: 'center', textColor: [180, 40, 40] },
    },
    margin: { left: 14, right: 14 },
  });

  currentY = (doc as any).lastAutoTable.finalY + 7;

  // ── 3. CLINICAL STRATIFICATION & PRESENTING CONCERNS ──
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...primaryColor);
  doc.text('3. CLINICAL CONCERN CLASSIFICATION', 14, currentY);
  currentY += 3;

  const concernRows = data.concernDistribution.map(c => [
    c.concern,
    String(c.count),
    c.percentage
  ]);

  autoTable(doc, {
    startY: currentY,
    head: [['Presenting Category', 'Consultations', 'Proportion (%)']],
    body: concernRows,
    theme: 'grid',
    headStyles: {
      fillColor: primaryColor,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
    },
    bodyStyles: {
      fontSize: 7.5,
      cellPadding: 2,
    },
    columnStyles: {
      0: { cellWidth: 102 },
      1: { cellWidth: 40, halign: 'center' },
      2: { cellWidth: 40, halign: 'center', fontStyle: 'bold' },
    },
    margin: { left: 14, right: 14 },
  });

  currentY = (doc as any).lastAutoTable.finalY + 8;

  // Page 2: Key Initiatives, Digital Detox, Faculty Training & Strategic Objectives
  doc.addPage();
  currentY = 20;

  // Header Banner Page 2
  doc.setFillColor(...goldColor);
  doc.rect(0, 0, 210, 12, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...primaryColor);
  doc.text('SRI VISHNU EDUCATIONAL SOCIETY — CONSOLIDATED MONTHLY REPORT (CONT.)', 105, 8, { align: 'center' });

  // ── 4. STUDENT WELLBEING INITIATIVES (DIGITAL DETOX, MINDTAP) ──
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...primaryColor);
  doc.text('4. KEY WELLNESS INITIATIVES & DIGITAL DETOX CAMPAIGNS', 14, currentY);
  currentY += 3;

  const initRows = data.keyInitiatives.map(k => [
    k.title,
    k.reach,
    k.impact
  ]);

  autoTable(doc, {
    startY: currentY,
    head: [['Initiative / Campaign', 'Campus Reach', 'Clinical Impact & Observations']],
    body: initRows,
    theme: 'grid',
    headStyles: {
      fillColor: primaryColor,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
    },
    bodyStyles: {
      fontSize: 7.5,
      cellPadding: 2.5,
    },
    columnStyles: {
      0: { cellWidth: 55 },
      1: { cellWidth: 35 },
      2: { cellWidth: 92 },
    },
    margin: { left: 14, right: 14 },
  });

  currentY = (doc as any).lastAutoTable.finalY + 8;

  // ── 5. FACULTY & STAFF MENTAL HEALTH TRAINING ──
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...primaryColor);
  doc.text('5. FACULTY & MENTOR GATEKEEPER TRAINING', 14, currentY);
  currentY += 4;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(40, 40, 40);
  const facultyText = doc.splitTextToSize(data.facultyTrainingSummary, 182);
  doc.text(facultyText, 14, currentY);
  currentY += facultyText.length * 4 + 6;

  // ── 6. STRATEGIC OBJECTIVES & UPCOMING DIRECTIVES ──
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...primaryColor);
  doc.text('6. STRATEGIC OBJECTIVES FOR UPCOMING MONTH', 14, currentY);
  currentY += 4;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  data.upcomingDirectives.forEach(dir => {
    doc.text(`•  ${dir}`, 18, currentY);
    currentY += 4.5;
  });

  currentY += 10;

  // ── 7. SIGN-OFF & INSTITUTIONAL ATTESTATION ──
  doc.setDrawColor(200, 200, 200);
  doc.line(14, currentY, 196, currentY);
  currentY += 8;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...primaryColor);
  doc.text('Report Consolidated By:', 18, currentY);
  doc.text('Executive Review & Approved By:', 125, currentY);

  currentY += 5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text(data.compiledBy, 18, currentY);
  doc.text(data.approvedBy, 125, currentY);

  currentY += 4;
  doc.setFontSize(7.5);
  doc.setTextColor(...textMuted);
  doc.text('Admin Coordinator · Vishnu Wellness Centre', 18, currentY);
  doc.text('Dean of Student Affairs / Director, SVES', 125, currentY);

  // Footer on all pages
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(130, 130, 130);
    doc.text(
      `Central Vishnu Wellness Centre Institutional Wellbeing Governance | Page ${i} of ${pageCount}`,
      105,
      287,
      { align: 'center' }
    );
  }

  const filename = `SVES_Consolidated_Monthly_Report_${data.month}_${data.year}.pdf`;
  doc.save(filename);
}
