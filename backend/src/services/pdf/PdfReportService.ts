import PDFDocument from 'pdfkit';

export interface ReportSummaryData {
  reportTitle: string;
  categoryName?: string;
  dateRangeText: string;
  generatedBy: string;
  generatedAt: Date;
  metrics: {
    totalRevenue: number;
    totalOrders: number;
    unitsSold: number;
    averageOrderValue: number;
    cancelledOrders: number;
    refundsAmount: number;
    pendingOrders?: number;
  };
  products: Array<{
    name: string;
    category?: string;
    unitsSold: number;
    ordersCount: number;
    revenue: number;
    avgPrice: number;
  }>;
  hallBreakdown?: Array<{
    hallName: string;
    ordersCount: number;
    revenue: number;
  }>;
}

export class PdfReportService {
  /**
   * Generates a publication-grade PDF report buffer for institutional administrative use.
   */
  public static async generateReport(data: ReportSummaryData): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({
        margin: 40,
        size: 'A4',
        info: {
          Title: data.reportTitle,
          Author: 'NIT Durgapur Campus Services Platform',
          Subject: 'Administrative Operations & Performance Report',
          CreationDate: new Date()
        }
      });

      const buffers: Buffer[] = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);

      const primaryColor = '#0284c7'; // Sky-600
      const darkColor = '#0f172a'; // Slate-900
      const mutedColor = '#64748b'; // Slate-500
      const borderLineColor = '#e2e8f0'; // Slate-200

      // --- HEADER SECTION ---
      doc.rect(40, 40, doc.page.width - 80, 65).fill('#f8fafc');

      doc.fillColor(primaryColor).fontSize(16).font('Helvetica-Bold')
        .text('NATIONAL INSTITUTE OF TECHNOLOGY DURGAPUR', 55, 50);

      doc.fillColor(darkColor).fontSize(11).font('Helvetica-Bold')
        .text('CAMPUS SERVICES PLATFORM — ADMINISTRATIVE AUDIT REPORT', 55, 70);

      doc.fillColor(mutedColor).fontSize(9).font('Helvetica')
        .text(`Report Subject: ${data.reportTitle.toUpperCase()}   |   Period: ${data.dateRangeText}`, 55, 87);

      doc.fontSize(8).fillColor(mutedColor)
        .text(`Generated: ${data.generatedAt.toLocaleString('en-IN')}   |   Operator: ${data.generatedBy}`, 55, 97);

      // --- KPI CARDS GRID ---
      const startY = 125;
      const cardWidth = (doc.page.width - 80 - 15) / 4;
      const cardHeight = 55;

      const kpiItems = [
        { label: 'TOTAL REVENUE', value: `INR ${data.metrics.totalRevenue.toLocaleString('en-IN')}`, color: '#059669' },
        { label: 'TOTAL ORDERS', value: `${data.metrics.totalOrders}`, color: '#0284c7' },
        { label: 'UNITS DELIVERED', value: `${data.metrics.unitsSold}`, color: '#4f46e5' },
        { label: 'AVG ORDER VALUE', value: `INR ${Math.round(data.metrics.averageOrderValue)}`, color: '#d97706' }
      ];

      kpiItems.forEach((kpi, idx) => {
        const x = 40 + idx * (cardWidth + 5);
        doc.roundedRect(x, startY, cardWidth, cardHeight, 6).fillAndStroke('#ffffff', borderLineColor);
        doc.fillColor(mutedColor).fontSize(7).font('Helvetica-Bold').text(kpi.label, x + 8, startY + 10);
        doc.fillColor(kpi.color).fontSize(13).font('Helvetica-Bold').text(kpi.value, x + 8, startY + 26);
      });

      // Secondary summary bar
      const subKpiY = startY + cardHeight + 8;
      doc.roundedRect(40, subKpiY, doc.page.width - 80, 24, 4).fill('#f1f5f9');
      doc.fillColor(darkColor).fontSize(8).font('Helvetica')
        .text(
          `Operational Balance: Cancelled Orders: ${data.metrics.cancelledOrders}   |   Refunded: INR ${data.metrics.refundsAmount.toLocaleString('en-IN')}   |   Active Scope: ${data.categoryName || 'All Campus Divisions'}`,
          50,
          subKpiY + 7
        );

      // --- TABLE SECTION: PRODUCT & SERVICE PERFORMANCE ---
      const tableStartY = subKpiY + 38;
      doc.fillColor(darkColor).fontSize(12).font('Helvetica-Bold')
        .text('Product & Service Line Distribution', 40, tableStartY);

      const theadY = tableStartY + 20;
      doc.rect(40, theadY, doc.page.width - 80, 20).fill(primaryColor);

      doc.fillColor('#ffffff').fontSize(8).font('Helvetica-Bold');
      doc.text('#', 48, theadY + 6);
      doc.text('ITEM / SERVICE SPECIFICATION', 70, theadY + 6);
      doc.text('CATEGORY', 260, theadY + 6);
      doc.text('UNITS SOLD', 350, theadY + 6, { width: 50, align: 'right' });
      doc.text('ORDERS', 415, theadY + 6, { width: 45, align: 'right' });
      doc.text('REVENUE (INR)', 470, theadY + 6, { width: 75, align: 'right' });

      let currentY = theadY + 20;
      data.products.slice(0, 18).forEach((item, index) => {
        const isEven = index % 2 === 0;
        if (isEven) {
          doc.rect(40, currentY, doc.page.width - 80, 18).fill('#f8fafc');
        }

        doc.fillColor(darkColor).fontSize(8).font('Helvetica');
        doc.text(`${index + 1}`, 48, currentY + 5);
        doc.text(item.name.substring(0, 36), 70, currentY + 5);
        doc.fillColor(mutedColor).text(item.category || data.categoryName || 'General', 260, currentY + 5);
        doc.fillColor(darkColor).text(`${item.unitsSold}`, 350, currentY + 5, { width: 50, align: 'right' });
        doc.text(`${item.ordersCount}`, 415, currentY + 5, { width: 45, align: 'right' });
        doc.font('Helvetica-Bold').text(`₹${item.revenue.toLocaleString('en-IN')}`, 470, currentY + 5, { width: 75, align: 'right' });

        currentY += 18;
      });

      // --- HALL DISTRIBUTION SUMMARY IF PRESENT ---
      if (data.hallBreakdown && data.hallBreakdown.length > 0 && currentY < 680) {
        currentY += 15;
        doc.fillColor(darkColor).fontSize(11).font('Helvetica-Bold')
          .text('Hostel Residence Hall Distribution Overview', 40, currentY);

        currentY += 16;
        const hallCardWidth = (doc.page.width - 80 - 20) / 4;
        data.hallBreakdown.slice(0, 4).forEach((h, hIdx) => {
          const hX = 40 + hIdx * (hallCardWidth + 5);
          doc.roundedRect(hX, currentY, hallCardWidth, 38, 4).fillAndStroke('#ffffff', borderLineColor);
          doc.fillColor(darkColor).fontSize(8).font('Helvetica-Bold').text(h.hallName, hX + 6, currentY + 6);
          doc.fillColor(mutedColor).fontSize(7).font('Helvetica').text(`${h.ordersCount} orders`, hX + 6, currentY + 17);
          doc.fillColor(primaryColor).fontSize(8).font('Helvetica-Bold').text(`₹${h.revenue}`, hX + 6, currentY + 26);
        });
      }

      // --- FOOTER & SIGN-OFF ---
      const footerY = doc.page.height - 50;
      doc.moveTo(40, footerY - 5).lineTo(doc.page.width - 40, footerY - 5).strokeColor(borderLineColor).stroke();

      doc.fillColor(mutedColor).fontSize(7).font('Helvetica')
        .text('NIT Durgapur Campus Services Platform • System Generated Administrative Document • Verified by Security Operations Cell', 40, footerY);

      doc.text(`Page 1 of 1 • Internal Audit Circulation`, doc.page.width - 200, footerY, { width: 160, align: 'right' });

      doc.end();
    });
  }
}
