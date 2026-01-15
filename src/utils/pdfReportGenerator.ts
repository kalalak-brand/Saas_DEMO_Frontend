//utils/pdfReportGenerator.ts

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// --- Define Types for the data structure ---
// These types now match the transformed data from the store

interface QuestionHeader {
  id: string;
  text: string;
}

interface DailyData {
  // This is kept for type consistency but will be empty
  date: string;
  guestName?: string;
  roomNumber?: string;
  questionRatings: { [key: string]: number };
  dailyCompositeAvg: number | string;
  dailyQuestionAvg: number | string;
}

// ✅ NEW: Type for the data we *actually* have from the API
interface DailyBreakdownData {
  date: string;
  overallAverage: number;
  totalReviews: number;
}

interface MonthlyAverageItem {
  name: string;
  averages: (number | string)[]; // 12 numbers/strings, for Jan-Dec
}

interface YearlyAverageItem {
  name: string;
  value: number;
}

export interface FullReportData {
  questionHeaders: QuestionHeader[];
  dailyData: DailyData[]; // This will be empty, but we'll check
  dailyBreakdown: DailyBreakdownData[]; // ✅ NEW: This has our data
  monthlyData: {
    questions: MonthlyAverageItem[];
    composites: MonthlyAverageItem[];
  };
  yearlyData: {
    questions: YearlyAverageItem[];
    composites: YearlyAverageItem[];
  };
}

// Extend jsPDF interface
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

// --- Main PDF Generation Function ---
export const generateYearlyReportPDF = (
  reportData: FullReportData,
  year: number,
  category: 'room' | 'f&b' | 'cfc'
) => {
  const doc = new jsPDF({ orientation: 'landscape' });
  let currentY = 15;

  const checkPageEnd = (doc: jsPDF, yPosition: number, margin = 20) => {
    const pageHeight = doc.internal.pageSize.height;
    if (yPosition > pageHeight - margin) {
      doc.addPage();
      return 20;
    }
    return yPosition;
  };

  // --- 1. PDF Header ---
  doc.setFontSize(18);
  doc.text(`Full Yearly Report: ${year}`, 14, currentY);
  currentY += 8;
  doc.setFontSize(12);
  doc.text(`Category: ${category.toUpperCase()}`, 14, currentY);
  currentY += 10;

  // --- 2. Yearly Averages Table ---
  // (This section was correct)
  doc.setFontSize(14);
  doc.text('Yearly Averages', 14, currentY);
  currentY += 6;
  const yearlyBody = [
    ...reportData.yearlyData.composites.map(item => [item.name, item.value.toFixed(2)]),
    ...reportData.yearlyData.questions.map(item => [item.name, item.value.toFixed(2)]),
  ];
  autoTable(doc, {
    head: [['Item (Composite / Question)', 'Yearly Average']],
    body: yearlyBody,
    startY: currentY,
    theme: 'grid',
    headStyles: { fillColor: [101, 9, 51] },
  });
  // @ts-ignore
  currentY = (doc as any).lastAutoTable.finalY + 10;

  // --- 3. Monthly Averages Table ---
  // (This section was correct)
  currentY = checkPageEnd(doc, currentY, 40);
  doc.setFontSize(14);
  doc.text('Monthly Averages', 14, currentY);
  currentY += 6;
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthlyBody = [
    ...reportData.monthlyData.composites.map(item => [item.name, ...item.averages]),
    ...reportData.monthlyData.questions.map(item => [item.name, ...item.averages]),
  ];
  autoTable(doc, {
    head: [['Item (Composite / Question)', ...months]],
    body: monthlyBody,
    startY: currentY,
    theme: 'grid',
    headStyles: { fillColor: [101, 9, 51] },
    styles: { fontSize: 8 },
  });
  // @ts-ignore
  currentY = (doc as any).lastAutoTable.finalY + 10;

  // --- 4. Daily Averages Table ---
  // ✅ MODIFIED: This section is now changed to use the 'dailyBreakdown' data
  // which your API actually provides.
  doc.addPage(); // Start daily on a new page
  currentY = 20;
  doc.setFontSize(14);
  doc.text('Daily Averages', 14, currentY); // Changed title
  currentY += 6;

  // ✅ MODIFIED: New head for the data we have
  const dailyHead: string[] = ['Date', 'Overall Average', 'Total Reviews'];

  // ✅ MODIFIED: New body mapping for 'dailyBreakdown'
  const dailyBody = reportData.dailyBreakdown.map(entry => {
    const date = new Date(entry.date).toLocaleDateString('en-CA'); // YYYY-MM-DD
    return [
      date,
      entry.overallAverage.toFixed(2),
      entry.totalReviews.toString()
    ];
  });

  autoTable(doc, {
    head: [dailyHead],
    body: dailyBody,
    startY: currentY,
    theme: 'grid',
    headStyles: { fillColor: [101, 9, 51] },
    styles: { fontSize: 10, cellPadding: 2 }, // Font size can be larger now
    horizontalPageBreak: true,
  });

  // --- Save the PDF ---
  doc.save(`full_report_${category}_${year}.pdf`);
};
