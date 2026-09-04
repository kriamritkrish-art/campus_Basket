import PDFDocument from 'pdfkit';

export interface OrderReceiptData {
  receiptNumber: string;
  orderNumber: string;
  orderId: string;
  createdAt: Date;
  student: {
    fullName: string;
    email: string;
    rollNumber: string;
    registrationNumber?: string;
    mobileNumber: string;
    hallName: string;
    roomNumber: string;
  };
  items: Array<{
    productName: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }>;
  subtotal: number;
  discountAmount: number;
  deliveryFee: number;
  totalAmount: number;
  paymentMethod: string;
  paymentStatus: string;
  transactionId?: string;
  status: string;
}

export class ReceiptPdfService {
  /**
   * Generates an official printable tax/order receipt PDF for a verified student order.
   */
  public static async generateReceipt(order: OrderReceiptData): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({
        margin: 40,
        size: 'A4',
        info: {
          Title: `Receipt-${order.receiptNumber}`,
          Author: 'NIT Durgapur Campus Services Platform',
          Subject: 'Official Student Order & Delivery Receipt'
        }
      });

      const buffers: Buffer[] = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);

      const primaryColor = '#0284c7';
      const darkColor = '#0f172a';
      const mutedColor = '#64748b';
      const borderColor = '#e2e8f0';

      // Header Banner
      doc.rect(40, 40, doc.page.width - 80, 75).fill('#f8fafc');

      doc.fillColor(primaryColor).fontSize(16).font('Helvetica-Bold')
        .text('NIT DURGAPUR CAMPUS SERVICES', 55, 52);

      doc.fillColor(darkColor).fontSize(10).font('Helvetica-Bold')
        .text('OFFICIAL STUDENT ORDER DELIVERY RECEIPT', 55, 72);

      doc.fillColor(mutedColor).fontSize(8).font('Helvetica')
        .text('Mahatma Gandhi Avenue, Durgapur, West Bengal 713209 • services@nitdgp.ac.in', 55, 87);

      // Receipt Metadata Badge
      doc.roundedRect(doc.page.width - 210, 50, 155, 55, 4).fillAndStroke('#ffffff', borderColor);
      doc.fillColor(mutedColor).fontSize(7).font('Helvetica-Bold').text('RECEIPT NO:', doc.page.width - 202, 57);
      doc.fillColor(primaryColor).fontSize(9).font('Helvetica-Bold').text(order.receiptNumber, doc.page.width - 202, 67);
      doc.fillColor(mutedColor).fontSize(7).text(`Date: ${order.createdAt.toLocaleDateString('en-IN')}`, doc.page.width - 202, 80);
      doc.text(`Order ID: ${order.orderNumber}`, doc.page.width - 202, 91);

      // Details Columns: Student & Delivery vs Payment Details
      const detailsY = 130;

      // Student box
      doc.roundedRect(40, detailsY, 250, 95, 6).fillAndStroke('#ffffff', borderColor);
      doc.fillColor(primaryColor).fontSize(8).font('Helvetica-Bold').text('DELIVERY RECIPIENT (STUDENT)', 52, detailsY + 10);
      doc.fillColor(darkColor).fontSize(10).font('Helvetica-Bold').text(order.student.fullName, 52, detailsY + 24);
      doc.fillColor(mutedColor).fontSize(8).font('Helvetica');
      doc.text(`Roll No: ${order.student.rollNumber}`, 52, detailsY + 40);
      doc.text(`Hostel: ${order.student.hallName} • Room ${order.student.roomNumber}`, 52, detailsY + 54);
      doc.text(`Email: ${order.student.email}`, 52, detailsY + 68);
      doc.text(`Mobile: ${order.student.mobileNumber}`, 52, detailsY + 80);

      // Payment Box
      const payX = doc.page.width - 40 - 250;
      doc.roundedRect(payX, detailsY, 250, 95, 6).fillAndStroke('#ffffff', borderColor);
      doc.fillColor(primaryColor).fontSize(8).font('Helvetica-Bold').text('PAYMENT & TRANSACTION AUDIT', payX + 12, detailsY + 10);
      doc.fillColor(darkColor).fontSize(9).font('Helvetica-Bold').text(`Method: ${order.paymentMethod}`, payX + 12, detailsY + 24);
      doc.fillColor(mutedColor).fontSize(8).font('Helvetica');
      doc.text(`Payment Status: ${order.paymentStatus}`, payX + 12, detailsY + 40);
      doc.text(`Order Fulfillment: ${order.status}`, payX + 12, detailsY + 54);
      doc.text(`Transaction ID: ${order.transactionId || 'TXN_CAMPUS_VERIFIED'}`, payX + 12, detailsY + 68);
      doc.text(`Time: ${order.createdAt.toLocaleTimeString('en-IN')}`, payX + 12, detailsY + 80);

      // Items Table Header
      const itemsHeaderY = 245;
      doc.rect(40, itemsHeaderY, doc.page.width - 80, 22).fill(primaryColor);
      doc.fillColor('#ffffff').fontSize(8).font('Helvetica-Bold');
      doc.text('#', 50, itemsHeaderY + 7);
      doc.text('ITEM DESCRIPTION', 75, itemsHeaderY + 7);
      doc.text('QTY', 360, itemsHeaderY + 7, { width: 35, align: 'right' });
      doc.text('UNIT PRICE', 410, itemsHeaderY + 7, { width: 60, align: 'right' });
      doc.text('AMOUNT', 485, itemsHeaderY + 7, { width: 60, align: 'right' });

      let rowY = itemsHeaderY + 22;
      order.items.forEach((item, idx) => {
        const isEven = idx % 2 === 0;
        if (isEven) {
          doc.rect(40, rowY, doc.page.width - 80, 20).fill('#f8fafc');
        }

        doc.fillColor(darkColor).fontSize(8).font('Helvetica');
        doc.text(`${idx + 1}`, 50, rowY + 6);
        doc.text(item.productName, 75, rowY + 6);
        doc.text(`${item.quantity}`, 360, rowY + 6, { width: 35, align: 'right' });
        doc.text(`₹${item.unitPrice.toFixed(2)}`, 410, rowY + 6, { width: 60, align: 'right' });
        doc.font('Helvetica-Bold').text(`₹${item.totalPrice.toFixed(2)}`, 485, rowY + 6, { width: 60, align: 'right' });

        rowY += 20;
      });

      // Price Summary Section
      const summaryStartY = Math.max(rowY + 15, 390);
      const summaryBoxX = doc.page.width - 240;

      doc.roundedRect(summaryBoxX, summaryStartY, 200, 105, 6).fillAndStroke('#ffffff', borderColor);

      doc.fillColor(mutedColor).fontSize(8).font('Helvetica');
      doc.text('Subtotal:', summaryBoxX + 15, summaryStartY + 12);
      doc.fillColor(darkColor).text(`₹${order.subtotal.toFixed(2)}`, summaryBoxX + 110, summaryStartY + 12, { width: 75, align: 'right' });

      doc.fillColor(mutedColor).text('Coupon Discount:', summaryBoxX + 15, summaryStartY + 30);
      doc.fillColor('#059669').text(`- ₹${order.discountAmount.toFixed(2)}`, summaryBoxX + 110, summaryStartY + 30, { width: 75, align: 'right' });

      doc.fillColor(mutedColor).text('Campus Delivery Fee:', summaryBoxX + 15, summaryStartY + 48);
      doc.fillColor(darkColor).text(`₹${order.deliveryFee.toFixed(2)}`, summaryBoxX + 110, summaryStartY + 48, { width: 75, align: 'right' });

      doc.moveTo(summaryBoxX + 15, summaryStartY + 68).lineTo(summaryBoxX + 185, summaryStartY + 68).strokeColor(borderColor).stroke();

      doc.fillColor(darkColor).fontSize(10).font('Helvetica-Bold').text('TOTAL PAID:', summaryBoxX + 15, summaryStartY + 78);
      doc.fillColor(primaryColor).fontSize(12).font('Helvetica-Bold').text(`₹${order.totalAmount.toFixed(2)}`, summaryBoxX + 100, summaryStartY + 76, { width: 85, align: 'right' });

      // Student declaration & campus policy
      doc.fillColor(darkColor).fontSize(8).font('Helvetica-Bold').text('Fulfillment Policy & Guidelines:', 40, summaryStartY + 15);
      doc.fillColor(mutedColor).fontSize(7).font('Helvetica')
        .text('1. Present room number and delivery receipt upon hostel gate / common room dispatch.', 40, summaryStartY + 30)
        .text('2. Dual-OTP authentication applies for laundry pickups and returns.', 40, summaryStartY + 43)
        .text('3. In case of discrepancies, contact services@nitdgp.ac.in within 24 hours of delivery.', 40, summaryStartY + 56);

      // Footer
      const footerY = doc.page.height - 45;
      doc.moveTo(40, footerY - 5).lineTo(doc.page.width - 40, footerY - 5).strokeColor(borderColor).stroke();
      doc.fillColor(mutedColor).fontSize(7).text('Computer-generated electronic receipt issued by NIT Durgapur Campus Marketplace Operations.', 40, footerY);

      doc.end();
    });
  }
}
