import PDFDocument from 'pdfkit';

export interface LedgerPdfRow {
  orderDate: string;
  orderNumber: string;
  studentName: string;
  studentEmail: string;
  studentRoll: string;
  providerName: string;
  deliveryBoyName: string;
  totalAmount: number;
  paymentMethod: string;
  onlinePaid: number;
  codAdvance: number;
  codCash: number;
  paymentStatus: string;
  cancellationRefundStatus: string;
  cancellationRefundAmount: number;
  returnRefundStatus: string;
  returnRefundAmount: number;
  refundTotal: number;
  finalCampusBasketEarning: number;
  orderStatus: string;
}

export interface LedgerPdfData {
  reportTitle: string;
  periodText: string;
  filtersText: {
    service?: string;
    paymentMethod?: string;
    paymentStatus?: string;
    refundStatus?: string;
    orderStatus?: string;
    provider?: string;
    deliveryBoy?: string;
    search?: string;
  };
  generatedBy: string;
  generatedAt: Date;
  metrics: {
    totalOrders: number;
    grossOrderValue: number;
    onlinePaid: number;
    codAdvance: number;
    codCash: number;
    refundsDistributed: number;
    finalCampusBasketEarning: number;
  };
  rows: LedgerPdfRow[];
}

export class GrossVolumePdfService {
  /**
   * Generates a landscape A4 "Order Payment & Settlement Report" PDF.
   * Completely excludes Institution Fee.
   */
  public static async generatePdf(data: LedgerPdfData): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({
        margin: 25,
        size: 'A4',
        layout: 'landscape',
        bufferPages: true,
        info: {
          Title: 'Campus Basket - Order Payment & Settlement Report',
          Author: 'Campus Basket Finance',
          Subject: 'Order Payment, Refund and Final Settlement Ledger',
          CreationDate: new Date()
        }
      });

      const buffers: Buffer[] = [];
      doc.on('data', (chunk) => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);

      const darkNavy = '#0F172A';
      const slateText = '#334155';
      const mutedSlate = '#64748B';
      const borderLine = '#CBD5E1';
      const greenAccent = '#16A34A';
      const blueAccent = '#0284C7';
      const orangeAccent = '#D97706';

      // --- HEADER ---
      doc.rect(25, 22, doc.page.width - 50, 48).fill('#F8FAFC');
      doc.rect(25, 22, doc.page.width - 50, 48).stroke('#E2E8F0');

      doc.fillColor(darkNavy).fontSize(13).font('Helvetica-Bold')
        .text('CAMPUS BASKET — ORDER PAYMENT & SETTLEMENT REPORT', 35, 30);

      doc.fillColor(slateText).fontSize(8.5).font('Helvetica')
        .text('Complete order-wise payment, refund and final earning records (Excluding Institution Fee)', 35, 45);

      const genDateStr = data.generatedAt.toLocaleString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      doc.fillColor(mutedSlate).fontSize(7.5).font('Helvetica')
        .text(`Period: ${data.periodText}   |   Audited Orders: ${data.metrics.totalOrders}   |   Generated: ${genDateStr}`, 35, 57);

      // --- ACTIVE FILTERS SUMMARY ---
      let filterY = 74;
      const activeFilters: string[] = [];
      if (data.filtersText.service && data.filtersText.service !== 'ALL') activeFilters.push(`Service: ${data.filtersText.service}`);
      if (data.filtersText.paymentMethod && data.filtersText.paymentMethod !== 'ALL') activeFilters.push(`Payment: ${data.filtersText.paymentMethod}`);
      if (data.filtersText.paymentStatus && data.filtersText.paymentStatus !== 'ALL') activeFilters.push(`Pay Status: ${data.filtersText.paymentStatus}`);
      if (data.filtersText.refundStatus && data.filtersText.refundStatus !== 'ALL') activeFilters.push(`Refund: ${data.filtersText.refundStatus}`);
      if (data.filtersText.orderStatus && data.filtersText.orderStatus !== 'ALL') activeFilters.push(`Order Status: ${data.filtersText.orderStatus}`);
      if (data.filtersText.provider && data.filtersText.provider !== 'ALL') activeFilters.push(`Provider: ${data.filtersText.provider}`);
      if (data.filtersText.deliveryBoy && data.filtersText.deliveryBoy !== 'ALL') activeFilters.push(`Delivery Boy: ${data.filtersText.deliveryBoy}`);
      if (data.filtersText.search) activeFilters.push(`Search: "${data.filtersText.search}"`);

      if (activeFilters.length > 0) {
        doc.fillColor(mutedSlate).fontSize(7).font('Helvetica-Bold')
          .text(`ACTIVE FILTERS: ${activeFilters.join('   •   ')}`, 35, filterY);
        filterY += 12;
      }

      // --- TOP 7 SUMMARY CARDS ---
      const cardY = filterY;
      const cards = [
        { label: 'TOTAL ORDERS', val: `${data.metrics.totalOrders} Orders`, color: darkNavy },
        { label: 'GROSS ORDER VALUE', val: `INR ${data.metrics.grossOrderValue.toFixed(2)}`, color: '#0F766E' },
        { label: 'ONLINE PAID', val: `INR ${data.metrics.onlinePaid.toFixed(2)}`, color: blueAccent },
        { label: 'COD ADVANCE', val: `INR ${data.metrics.codAdvance.toFixed(2)}`, color: '#6366F1' },
        { label: 'COD CASH', val: `INR ${data.metrics.codCash.toFixed(2)}`, color: '#8B5CF6' },
        { label: 'REFUNDS DISTRIBUTED', val: `INR ${data.metrics.refundsDistributed.toFixed(2)}`, color: orangeAccent },
        { label: 'CAMPUS BASKET EARNING', val: `INR ${data.metrics.finalCampusBasketEarning.toFixed(2)}`, color: greenAccent }
      ];

      const cardW = (doc.page.width - 50 - (cards.length - 1) * 5) / cards.length;
      const cardH = 34;

      cards.forEach((c, idx) => {
        const x = 25 + idx * (cardW + 5);
        doc.roundedRect(x, cardY, cardW, cardH, 3).fillAndStroke('#FFFFFF', '#E2E8F0');
        doc.fillColor(mutedSlate).fontSize(5.5).font('Helvetica-Bold').text(c.label, x + 5, cardY + 5);
        doc.fillColor(c.color).fontSize(8).font('Helvetica-Bold').text(c.val, x + 5, cardY + 17);
      });

      // --- TABLE SETUP ---
      let tableY = cardY + cardH + 10;

      // Column widths (Total width ~ 792 pt for A4 Landscape - 50 margin = 792):
      // Date(55), Order#(58), Student(80), Provider(65), Delivery(65), Gross(50), Method(40), Online(48), COD Adv(46), COD Cash(46), Status(48), Cancel Ref(60), Return Ref(60), Ref Tot(45), CB Earn(50) = ~ 766
      const cols = [
        { label: 'ORDER DATE', x: 28, w: 55, align: 'left' },
        { label: 'ORDER ID', x: 84, w: 58, align: 'left' },
        { label: 'STUDENT', x: 143, w: 76, align: 'left' },
        { label: 'PROVIDER', x: 220, w: 60, align: 'left' },
        { label: 'DELIVERY BOY', x: 281, w: 60, align: 'left' },
        { label: 'TOTAL', x: 342, w: 45, align: 'right' },
        { label: 'METHOD', x: 388, w: 35, align: 'center' },
        { label: 'ONLINE', x: 424, w: 44, align: 'right' },
        { label: 'COD ADV.', x: 469, w: 44, align: 'right' },
        { label: 'COD CASH', x: 514, w: 44, align: 'right' },
        { label: 'PAY STATUS', x: 559, w: 45, align: 'center' },
        { label: 'CANCEL REFUND', x: 605, w: 56, align: 'center' },
        { label: 'RETURN REFUND', x: 662, w: 56, align: 'center' },
        { label: 'REFUND TOT', x: 719, w: 44, align: 'right' },
        { label: 'CB EARNING', x: 764, w: 48, align: 'right' }
      ];

      const drawTableHeader = (y: number) => {
        doc.roundedRect(25, y, doc.page.width - 50, 16, 2).fill('#0F172A');
        doc.fillColor('#FFFFFF').fontSize(5.5).font('Helvetica-Bold');
        cols.forEach((col) => {
          doc.text(col.label, col.x, y + 4.5, { width: col.w, align: col.align as any });
        });
      };

      drawTableHeader(tableY);
      tableY += 18;

      if (data.rows.length === 0) {
        doc.rect(25, tableY, doc.page.width - 50, 30).fillAndStroke('#F8FAFC', '#E2E8F0');
        doc.fillColor(mutedSlate).fontSize(8).font('Helvetica')
          .text('No matching orders found for the active filter parameters.', 35, tableY + 10);
        tableY += 35;
      } else {
        data.rows.forEach((r, idx) => {
          if (tableY > doc.page.height - 45) {
            doc.addPage();
            tableY = 25;
            drawTableHeader(tableY);
            tableY += 18;
          }

          const bg = idx % 2 === 0 ? '#FFFFFF' : '#F8FAFC';
          const rowH = 15;
          doc.rect(25, tableY, doc.page.width - 50, rowH).fillAndStroke(bg, '#E2E8F0');

          doc.fillColor(darkNavy).fontSize(5.5).font('Helvetica');
          // 1. Date
          doc.text(r.orderDate, cols[0].x, tableY + 4, { width: cols[0].w, ellipsis: true });
          // 2. Order ID
          doc.font('Helvetica-Bold').text(r.orderNumber, cols[1].x, tableY + 4, { width: cols[1].w, ellipsis: true });
          // 3. Student
          doc.font('Helvetica').text(`${r.studentName.slice(0, 14)}`, cols[2].x, tableY + 4, { width: cols[2].w, ellipsis: true });
          // 4. Provider
          doc.text(r.providerName.slice(0, 12), cols[3].x, tableY + 4, { width: cols[3].w, ellipsis: true });
          // 5. Delivery Boy
          doc.text(r.deliveryBoyName.slice(0, 12), cols[4].x, tableY + 4, { width: cols[4].w, ellipsis: true });
          // 6. Total Amount
          doc.font('Helvetica-Bold').text(r.totalAmount.toFixed(2), cols[5].x, tableY + 4, { width: cols[5].w, align: 'right' });
          // 7. Method
          doc.font('Helvetica').text(r.paymentMethod === 'CASH_ON_DELIVERY' ? 'COD' : 'ONLINE', cols[6].x, tableY + 4, { width: cols[6].w, align: 'center' });
          // 8. Online Paid
          doc.fillColor('#0284C7').text(r.onlinePaid > 0 ? r.onlinePaid.toFixed(2) : '-', cols[7].x, tableY + 4, { width: cols[7].w, align: 'right' });
          // 9. COD Advance
          doc.fillColor('#6366F1').text(r.codAdvance > 0 ? r.codAdvance.toFixed(2) : (r.paymentMethod === 'ONLINE' ? 'N/A' : '0.00'), cols[8].x, tableY + 4, { width: cols[8].w, align: 'right' });
          // 10. COD Cash
          doc.fillColor('#8B5CF6').text(r.codCash > 0 ? r.codCash.toFixed(2) : (r.paymentMethod === 'ONLINE' ? 'N/A' : '0.00'), cols[9].x, tableY + 4, { width: cols[9].w, align: 'right' });
          // 11. Payment Status
          doc.fillColor(r.paymentStatus === 'PAID' ? greenAccent : (r.paymentStatus === 'REFUNDED' ? '#DC2626' : orangeAccent))
            .text(r.paymentStatus.replace('_', ' '), cols[10].x, tableY + 4, { width: cols[10].w, align: 'center', ellipsis: true });

          // 12. Cancel Refund: Status + Amt
          const cancelText = r.cancellationRefundStatus === 'DISTRIBUTED'
            ? `DIST ₹${r.cancellationRefundAmount.toFixed(0)}`
            : r.cancellationRefundStatus === 'CLAIMED'
            ? `CLM ₹${r.cancellationRefundAmount.toFixed(0)}`
            : r.cancellationRefundStatus === 'NOT_APPLICABLE'
            ? 'N/A'
            : 'UNCLAIMED';
          doc.fillColor(r.cancellationRefundStatus === 'DISTRIBUTED' ? greenAccent : (r.cancellationRefundStatus === 'CLAIMED' ? orangeAccent : mutedSlate))
            .text(cancelText, cols[11].x, tableY + 4, { width: cols[11].w, align: 'center' });

          // 13. Return Refund: Status + Amt
          const returnText = r.returnRefundStatus === 'DISTRIBUTED'
            ? `DIST ₹${r.returnRefundAmount.toFixed(0)}`
            : r.returnRefundStatus === 'CLAIMED'
            ? `CLM ₹${r.returnRefundAmount.toFixed(0)}`
            : r.returnRefundStatus === 'NOT_APPLICABLE'
            ? 'N/A'
            : 'UNCLAIMED';
          doc.fillColor(r.returnRefundStatus === 'DISTRIBUTED' ? greenAccent : (r.returnRefundStatus === 'CLAIMED' ? orangeAccent : mutedSlate))
            .text(returnText, cols[12].x, tableY + 4, { width: cols[12].w, align: 'center' });

          // 14. Refund Total
          doc.fillColor(r.refundTotal > 0 ? orangeAccent : mutedSlate).font('Helvetica-Bold')
            .text(r.refundTotal > 0 ? r.refundTotal.toFixed(2) : '0.00', cols[13].x, tableY + 4, { width: cols[13].w, align: 'right' });

          // 15. Final Campus Basket Earning
          doc.fillColor(greenAccent).font('Helvetica-Bold')
            .text(r.finalCampusBasketEarning.toFixed(2), cols[14].x, tableY + 4, { width: cols[14].w, align: 'right' });

          tableY += rowH;
        });

        // --- REPORT TOTALS ROW ---
        if (tableY > doc.page.height - 40) {
          doc.addPage();
          tableY = 25;
        }

        doc.rect(25, tableY, doc.page.width - 50, 18).fill('#0F172A');
        doc.fillColor('#FFFFFF').fontSize(6).font('Helvetica-Bold');
        doc.text('REPORT TOTALS', 35, tableY + 5.5);
        doc.text(`INR ${data.metrics.grossOrderValue.toFixed(2)}`, cols[5].x, tableY + 5.5, { width: cols[5].w, align: 'right' });
        doc.text(`INR ${data.metrics.onlinePaid.toFixed(2)}`, cols[7].x, tableY + 5.5, { width: cols[7].w, align: 'right' });
        doc.text(`INR ${data.metrics.codAdvance.toFixed(2)}`, cols[8].x, tableY + 5.5, { width: cols[8].w, align: 'right' });
        doc.text(`INR ${data.metrics.codCash.toFixed(2)}`, cols[9].x, tableY + 5.5, { width: cols[9].w, align: 'right' });
        doc.text(`INR ${data.metrics.refundsDistributed.toFixed(2)}`, cols[13].x, tableY + 5.5, { width: cols[13].w, align: 'right' });
        doc.text(`INR ${data.metrics.finalCampusBasketEarning.toFixed(2)}`, cols[14].x, tableY + 5.5, { width: cols[14].w, align: 'right' });
      }

      // --- FOOTER ON ALL PAGES ---
      const range = doc.bufferedPageRange();
      for (let i = 0; i < range.count; i++) {
        doc.switchToPage(i);
        doc.fillColor(mutedSlate).fontSize(6.5).font('Helvetica')
          .text('Campus Basket — Order Payment & Settlement Report', 25, doc.page.height - 18, { align: 'left' });
        doc.text(`Page ${i + 1} of ${range.count}`, 0, doc.page.height - 18, { align: 'center' });
        doc.text(`Confidential Financial Audit • Generated ${genDateStr}`, doc.page.width - 250, doc.page.height - 18, { width: 225, align: 'right' });
      }

      doc.end();
    });
  }
}
