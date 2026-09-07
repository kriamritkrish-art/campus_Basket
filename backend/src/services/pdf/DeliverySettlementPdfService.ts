import PDFDocument from 'pdfkit';

export interface SettlementPdfRow {
  date: string;
  runnerName: string;
  runnerMobile: string;
  paymentType: string;
  referenceId: string;
  amount: number;
  payoutMethod: string;
  destination: string;
  utrReference?: string | null;
  status: string;
}

export interface DeliverySettlementPdfData {
  reportTitle: string;
  runnerScope: string;
  dateRangeText: string;
  generatedBy: string;
  generatedAt: Date;
  metrics: {
    totalEarned: number;
    totalSettled: number;
    pendingAmount: number;
    totalTransactions: number;
  };
  settlements: SettlementPdfRow[];
}

export class DeliverySettlementPdfService {
  /**
   * Generates a publication-grade PDF buffer for delivery boy settlements.
   */
  public static async generatePdf(data: DeliverySettlementPdfData): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({
        margin: 35,
        size: 'A4',
        info: {
          Title: data.reportTitle,
          Author: 'Campus Basket Platform',
          Subject: 'Delivery Boy Earnings & Settlement Statement',
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

      // --- HEADER SECTION ---
      doc.rect(35, 35, doc.page.width - 70, 68).fill('#f8fafc');

      doc.fillColor(primaryGreen).fontSize(15).font('Helvetica-Bold')
        .text('CAMPUS BASKET — DELIVERY FLEET SETTLEMENT STATEMENT', 48, 45);

      doc.fillColor(darkSlate).fontSize(10).font('Helvetica-Bold')
        .text('OFFICIAL LOGISTICS DISBURSAL & EARNINGS AUDIT RECORD', 48, 64);

      doc.fillColor(mutedSlate).fontSize(8).font('Helvetica')
        .text(`Scope: ${data.runnerScope.toUpperCase()}   |   Period: ${data.dateRangeText}`, 48, 78);

      doc.fontSize(8).fillColor(mutedSlate)
        .text(`Generated: ${data.generatedAt.toLocaleString('en-IN')}   |   Authorized By: ${data.generatedBy}`, 48, 88);

      // --- KPI CARDS GRID ---
      const startY = 115;
      const cardWidth = (doc.page.width - 70 - 15) / 4;
      const cardHeight = 50;

      const kpis = [
        { label: 'TOTAL EARNED', value: `INR ${Number(data.metrics.totalEarned).toLocaleString('en-IN')}`, color: '#16a34a' },
        { label: 'ALREADY SETTLED', value: `INR ${Number(data.metrics.totalSettled).toLocaleString('en-IN')}`, color: '#0284c7' },
        { label: 'PENDING APPROVAL', value: `INR ${Number(data.metrics.pendingAmount).toLocaleString('en-IN')}`, color: '#d97706' },
        { label: 'TOTAL ENTRIES', value: `${data.metrics.totalTransactions}`, color: '#6b21a8' }
      ];

      kpis.forEach((kpi, idx) => {
        const x = 35 + idx * (cardWidth + 5);
        doc.roundedRect(x, startY, cardWidth, cardHeight, 5).fillAndStroke('#ffffff', borderLine);
        doc.fillColor(mutedSlate).fontSize(6.5).font('Helvetica-Bold').text(kpi.label, x + 8, startY + 8);
        doc.fillColor(kpi.color).fontSize(12).font('Helvetica-Bold').text(kpi.value, x + 8, startY + 24);
      });

      // --- SETTLEMENT TABLE ---
      let tableY = startY + cardHeight + 14;

      doc.roundedRect(35, tableY, doc.page.width - 70, 20, 3).fill('#0f172a');
      doc.fillColor('#ffffff').fontSize(7).font('Helvetica-Bold');

      const colX = {
        date: 42,
        runner: 110,
        ref: 200,
        amount: 270,
        dest: 330,
        utr: 430,
        status: 500
      };

      doc.text('DATE', colX.date, tableY + 6);
      doc.text('RUNNER', colX.runner, tableY + 6);
      doc.text('REF ID', colX.ref, tableY + 6);
      doc.text('AMOUNT', colX.amount, tableY + 6);
      doc.text('ACCOUNT / UPI', colX.dest, tableY + 6);
      doc.text('UTR / REF NO', colX.utr, tableY + 6);
      doc.text('STATUS', colX.status, tableY + 6);

      tableY += 22;

      if (data.settlements.length === 0) {
        doc.rect(35, tableY, doc.page.width - 70, 40).fillAndStroke('#f8fafc', borderLine);
        doc.fillColor(mutedSlate).fontSize(9).font('Helvetica')
          .text('No settlement or payout records found for this selected filter criteria.', 50, tableY + 15);
      } else {
        data.settlements.forEach((row, i) => {
          if (tableY > doc.page.height - 65) {
            doc.addPage();
            tableY = 40;

            // Re-draw table header on new page
            doc.roundedRect(35, tableY, doc.page.width - 70, 20, 3).fill('#0f172a');
            doc.fillColor('#ffffff').fontSize(7).font('Helvetica-Bold');
            doc.text('DATE', colX.date, tableY + 6);
            doc.text('RUNNER', colX.runner, tableY + 6);
            doc.text('REF ID', colX.ref, tableY + 6);
            doc.text('AMOUNT', colX.amount, tableY + 6);
            doc.text('ACCOUNT / UPI', colX.dest, tableY + 6);
            doc.text('UTR / REF NO', colX.utr, tableY + 6);
            doc.text('STATUS', colX.status, tableY + 6);
            tableY += 22;
          }

          const rowBg = i % 2 === 0 ? '#ffffff' : '#f8fafc';
          doc.rect(35, tableY, doc.page.width - 70, 22).fill(rowBg);
          doc.rect(35, tableY + 21, doc.page.width - 70, 1).fill('#f1f5f9');

          doc.fillColor(darkSlate).fontSize(7).font('Helvetica');
          doc.text(row.date, colX.date, tableY + 6, { width: 65, lineBreak: false });

          doc.font('Helvetica-Bold').text(row.runnerName, colX.runner, tableY + 4, { width: 85, lineBreak: false });
          doc.fillColor(mutedSlate).fontSize(6).font('Helvetica').text(row.runnerMobile, colX.runner, tableY + 12);

          doc.fillColor(darkSlate).fontSize(7).font('Helvetica-Bold').text(row.referenceId, colX.ref, tableY + 6, { width: 65, lineBreak: false });

          doc.fillColor('#059669').fontSize(7.5).font('Helvetica-Bold').text(`INR ${Number(row.amount).toFixed(2)}`, colX.amount, tableY + 6, { width: 55 });

          doc.fillColor(darkSlate).fontSize(6.5).font('Helvetica').text(row.destination, colX.dest, tableY + 6, { width: 95, lineBreak: false });

          doc.fillColor(mutedSlate).fontSize(6.5).font('Helvetica').text(row.utrReference || '—', colX.utr, tableY + 6, { width: 65, lineBreak: false });

          // Status Badge Pill
          const isDistributed = row.status === 'DISTRIBUTED' || row.status === 'SETTLED';
          const isPending = row.status === 'PENDING';
          const badgeColor = isDistributed ? '#15803d' : isPending ? '#b45309' : '#b91c1c';

          doc.fillColor(badgeColor).fontSize(6.5).font('Helvetica-Bold').text(row.status, colX.status, tableY + 6);

          tableY += 22;
        });
      }

      // --- OFFICIAL FOOTER ---
      const footerY = doc.page.height - 40;
      doc.rect(35, footerY - 5, doc.page.width - 70, 1).fill(borderLine);
      doc.fillColor(mutedSlate).fontSize(7).font('Helvetica')
        .text('Campus Basket Logistics & Settlement Cell • Official institutional financial document • Generated via Antigravity Automated Protocol', 35, footerY + 2, {
          align: 'center',
          width: doc.page.width - 70
        });

      doc.end();
    });
  }
}
