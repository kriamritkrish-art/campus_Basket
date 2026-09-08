import PDFDocument from 'pdfkit';

export interface GrossVolumePdfRow {
  date: string;
  orderNumber: string;
  studentId: string;
  studentName: string;
  serviceType: string;
  paymentMethod: string;
  grossAmount: number;
  onlineAmount: number;
  codAmount: number;
  retainedReturnFee: number;
  retainedCancellationFee: number;
  commission: number;
  netPlatformRevenue: number;
  status: string;
}

export interface GrossVolumePdfData {
  reportTitle: string;
  periodText: string;
  generatedBy: string;
  generatedAt: Date;
  metrics: {
    totalGrossVolume: number;
    totalOnlinePayments: number;
    totalCodCollected: number;
    totalCommissionEarned: number;
    totalRetainedReturnFees: number;
    totalRetainedCancellationFees: number;
    totalNetPlatformRevenue: number;
    totalOrdersCount: number;
  };
  rows: GrossVolumePdfRow[];
}

export class GrossVolumePdfService {
  /**
   * Generates an official publication-grade PDF buffer for platform gross volume and institutional revenue calculations.
   */
  public static async generatePdf(data: GrossVolumePdfData): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({
        margin: 30,
        size: 'A4',
        layout: 'landscape',
        info: {
          Title: data.reportTitle,
          Author: 'Campus Basket Platform',
          Subject: 'Total Gross Platform Volume & Institutional Revenue Breakdown',
          CreationDate: new Date()
        }
      });

      const buffers: Buffer[] = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);

      const primaryGreen = '#2e7d32';
      const darkSlate = '#0f172a';
      const mutedSlate = '#64748b';
      const borderLine = '#e2e8f0';

      // --- HEADER BANNER ---
      doc.rect(30, 30, doc.page.width - 60, 60).fill('#f8fafc');
      doc.rect(30, 30, doc.page.width - 60, 60).stroke(borderLine);

      doc.fillColor(primaryGreen).fontSize(14).font('Helvetica-Bold')
        .text('CAMPUS BASKET — INSTITUTIONAL COMMERCE PLATFORM', 40, 40);

      doc.fillColor(darkSlate).fontSize(9.5).font('Helvetica-Bold')
        .text('TOTAL GROSS PLATFORM VOLUME & REVENUE BREAKDOWN STATEMENT', 40, 56);

      doc.fillColor(mutedSlate).fontSize(7.5).font('Helvetica')
        .text(`Reporting Period: ${data.periodText}   |   Orders Audited: ${data.metrics.totalOrdersCount}   |   Generated: ${data.generatedAt.toLocaleString('en-IN')}`, 40, 70);

      // --- KPI CARDS ROW ---
      const startY = 98;
      const kpis = [
        { label: 'GROSS VOLUME', val: `INR ${Number(data.metrics.totalGrossVolume).toLocaleString('en-IN')}`, color: '#16a34a' },
        { label: 'ONLINE PAID', val: `INR ${Number(data.metrics.totalOnlinePayments).toLocaleString('en-IN')}`, color: '#0284c7' },
        { label: 'COD RECONCILED', val: `INR ${Number(data.metrics.totalCodCollected).toLocaleString('en-IN')}`, color: '#4f46e5' },
        { label: 'COMMISSION (5%)', val: `INR ${Number(data.metrics.totalCommissionEarned).toLocaleString('en-IN')}`, color: '#7c3aed' },
        { label: 'RETURN CHARGES', val: `INR ${Number(data.metrics.totalRetainedReturnFees).toLocaleString('en-IN')}`, color: '#d97706' },
        { label: 'CANCEL CHARGES', val: `INR ${Number(data.metrics.totalRetainedCancellationFees).toLocaleString('en-IN')}`, color: '#dc2626' },
        { label: 'NET REVENUE', val: `INR ${Number(data.metrics.totalNetPlatformRevenue).toLocaleString('en-IN')}`, color: '#059669' }
      ];

      const cardW = (doc.page.width - 60 - (kpis.length - 1) * 6) / kpis.length;
      const cardH = 38;

      kpis.forEach((k, idx) => {
        const x = 30 + idx * (cardW + 6);
        doc.roundedRect(x, startY, cardW, cardH, 4).fillAndStroke('#ffffff', borderLine);
        doc.fillColor(mutedSlate).fontSize(6).font('Helvetica-Bold').text(k.label, x + 6, startY + 6);
        doc.fillColor(k.color).fontSize(9).font('Helvetica-Bold').text(k.val, x + 6, startY + 18);
      });

      // --- DATA TABLE ---
      let tableY = startY + cardH + 12;

      const drawTableHeader = (yPos: number) => {
        doc.roundedRect(30, yPos, doc.page.width - 60, 18, 3).fill('#0f172a');
        doc.fillColor('#ffffff').fontSize(6.5).font('Helvetica-Bold');

        doc.text('DATE', 36, yPos + 5);
        doc.text('ORDER #', 86, yPos + 5);
        doc.text('STUDENT (ID/NAME)', 166, yPos + 5);
        doc.text('SERVICE', 280, yPos + 5);
        doc.text('METHOD', 340, yPos + 5);
        doc.text('GROSS (INR)', 410, yPos + 5);
        doc.text('ONLINE', 470, yPos + 5);
        doc.text('COD', 525, yPos + 5);
        doc.text('RET. FEE', 575, yPos + 5);
        doc.text('CNC. FEE', 630, yPos + 5);
        doc.text('COMM.(5%)', 685, yPos + 5);
        doc.text('NET REVENUE', 745, yPos + 5);
      };

      drawTableHeader(tableY);
      tableY += 20;

      if (data.rows.length === 0) {
        doc.rect(30, tableY, doc.page.width - 60, 35).fillAndStroke('#f8fafc', borderLine);
        doc.fillColor(mutedSlate).fontSize(8).font('Helvetica')
          .text('No matching transaction records found for the selected filter parameters.', 40, tableY + 13);
      } else {
        data.rows.forEach((row, i) => {
          if (tableY > doc.page.height - 45) {
            doc.addPage();
            tableY = 35;
            drawTableHeader(tableY);
            tableY += 20;
          }

          const bg = i % 2 === 0 ? '#ffffff' : '#f8fafc';
          doc.rect(30, tableY, doc.page.width - 60, 17).fillAndStroke(bg, borderLine);

          doc.fillColor(darkSlate).fontSize(6.5).font('Helvetica');
          doc.text(row.date, 36, tableY + 5);
          doc.font('Helvetica-Bold').text(row.orderNumber, 86, tableY + 5);
          doc.font('Helvetica').text(`${row.studentId} • ${row.studentName.slice(0, 18)}`, 166, tableY + 5);
          doc.text(row.serviceType, 280, tableY + 5);
          doc.text(row.paymentMethod.replace('CASH_ON_DELIVERY', 'COD'), 340, tableY + 5);

          doc.font('Helvetica-Bold').text(row.grossAmount.toFixed(2), 410, tableY + 5);
          doc.font('Helvetica').fillColor('#0284c7').text(row.onlineAmount > 0 ? row.onlineAmount.toFixed(2) : '-', 470, tableY + 5);
          doc.fillColor('#4f46e5').text(row.codAmount > 0 ? row.codAmount.toFixed(2) : '-', 525, tableY + 5);
          doc.fillColor(row.retainedReturnFee > 0 ? '#d97706' : mutedSlate)
            .text(row.retainedReturnFee > 0 ? `+${row.retainedReturnFee.toFixed(2)}` : '-', 575, tableY + 5);
          doc.fillColor(row.retainedCancellationFee > 0 ? '#dc2626' : mutedSlate)
            .text(row.retainedCancellationFee > 0 ? `+${row.retainedCancellationFee.toFixed(2)}` : '-', 630, tableY + 5);
          doc.fillColor('#7c3aed').text(row.commission.toFixed(2), 685, tableY + 5);
          doc.fillColor('#059669').font('Helvetica-Bold').text(row.netPlatformRevenue.toFixed(2), 745, tableY + 5);

          tableY += 17;
        });

        // Totals Footer Row
        if (tableY > doc.page.height - 40) {
          doc.addPage();
          tableY = 35;
        }

        doc.rect(30, tableY, doc.page.width - 60, 20).fill('#0f172a');
        doc.fillColor('#ffffff').fontSize(7).font('Helvetica-Bold');
        doc.text('TOTAL SUMMARY', 36, tableY + 6);
        doc.text(`INR ${data.metrics.totalGrossVolume.toFixed(2)}`, 410, tableY + 6);
        doc.text(`INR ${data.metrics.totalOnlinePayments.toFixed(2)}`, 470, tableY + 6);
        doc.text(`INR ${data.metrics.totalCodCollected.toFixed(2)}`, 525, tableY + 6);
        doc.text(`INR ${data.metrics.totalRetainedReturnFees.toFixed(2)}`, 575, tableY + 6);
        doc.text(`INR ${data.metrics.totalRetainedCancellationFees.toFixed(2)}`, 630, tableY + 6);
        doc.text(`INR ${data.metrics.totalCommissionEarned.toFixed(2)}`, 685, tableY + 6);
        doc.text(`INR ${data.metrics.totalNetPlatformRevenue.toFixed(2)}`, 745, tableY + 6);
      }

      doc.end();
    });
  }
}
