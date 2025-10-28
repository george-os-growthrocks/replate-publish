// PDF Generation Utilities
// Install: npm install jspdf html2canvas

interface PDFReportData {
  title: string;
  subtitle?: string;
  date: string;
  sections: {
    title: string;
    content: string | JSX.Element;
    data?: Record<string, unknown>[];
  }[];
  branding?: {
    logo?: string;
    companyName?: string;
    website?: string;
  };
}

export async function generatePDFReport(data: PDFReportData): Promise<void> {
  // Dynamic import to avoid bundle bloat
  const jsPDF = (await import('jspdf')).default;
  const html2canvas = (await import('html2canvas')).default;

  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  let yPosition = 20;

  // Header
  pdf.setFontSize(24);
  pdf.setFont('helvetica', 'bold');
  pdf.text(data.title, pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 10;

  if (data.subtitle) {
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'normal');
    pdf.text(data.subtitle, pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 8;
  }

  // Date
  pdf.setFontSize(10);
  pdf.setTextColor(128, 128, 128);
  pdf.text(data.date, pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 15;

  // Branding
  if (data.branding) {
    pdf.setFontSize(8);
    if (data.branding.companyName) {
      pdf.text(data.branding.companyName, 20, pageHeight - 10);
    }
    if (data.branding.website) {
      pdf.text(data.branding.website, pageWidth - 20, pageHeight - 10, { align: 'right' });
    }
  }

  // Sections
  pdf.setTextColor(0, 0, 0);
  for (const section of data.sections) {
    // Check if need new page
    if (yPosition > pageHeight - 40) {
      pdf.addPage();
      yPosition = 20;
    }

    // Section title
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text(section.title, 20, yPosition);
    yPosition += 8;

    // Section content
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    
    if (typeof section.content === 'string') {
      const lines = pdf.splitTextToSize(section.content, pageWidth - 40);
      pdf.text(lines, 20, yPosition);
      yPosition += lines.length * 5 + 10;
    }

    // Table data if provided
    if (section.data && section.data.length > 0) {
      const tableHeaders = Object.keys(section.data[0]);
      const tableData = section.data.map(row => 
        tableHeaders.map(header => String(row[header] || ''))
      );

      // Simple table rendering
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'bold');
      
      let xPos = 20;
      const colWidth = (pageWidth - 40) / tableHeaders.length;
      
      // Headers
      tableHeaders.forEach((header) => {
        pdf.text(header, xPos, yPosition);
        xPos += colWidth;
      });
      
      yPosition += 6;
      pdf.setFont('helvetica', 'normal');

      // Rows
      tableData.slice(0, 10).forEach((row) => {
        xPos = 20;
        row.forEach((cell) => {
          const cellText = String(cell).substring(0, 20);
          pdf.text(cellText, xPos, yPosition);
          xPos += colWidth;
        });
        yPosition += 5;
        
        if (yPosition > pageHeight - 30) {
          pdf.addPage();
          yPosition = 20;
        }
      });

      yPosition += 10;
    }
  }

  // Save
  pdf.save(`${data.title.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}.pdf`);
}

// Quick export for dashboard/reports
export async function exportElementAsPDF(elementId: string, filename: string): Promise<void> {
  const html2canvas = (await import('html2canvas')).default;
  const jsPDF = (await import('jspdf')).default;

  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error(`Element with id "${elementId}" not found`);
  }

  const canvas = await html2canvas(element, {
    scale: 2,
    logging: false,
    useCORS: true,
  });

  const imgData = canvas.toDataURL('image/png');
  const pdf = new jsPDF('p', 'mm', 'a4');
  
  const imgWidth = 210;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;
  
  let heightLeft = imgHeight;
  let position = 0;

  pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
  heightLeft -= 297;

  while (heightLeft >= 0) {
    position = heightLeft - imgHeight;
    pdf.addPage();
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= 297;
  }

  pdf.save(filename);
}
