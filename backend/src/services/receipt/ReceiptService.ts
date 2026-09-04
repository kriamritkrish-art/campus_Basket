import { generateReceiptNumber } from '../../utils/crypto';

export interface ReceiptItem {
  name: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

export interface ReceiptData {
  receiptNumber: string;
  orderNumber: string;
  orderType: 'PRODUCT' | 'LAUNDRY';
  date: string;
  student: {
    name: string;
    email: string;
    rollNumber: string;
    hall: string;
    room: string;
  };
  items: ReceiptItem[];
  subtotal: number;
  discount: number;
  deliveryFee: number;
  total: number;
  payment: {
    method: string;
    status: string;
    transactionId?: string;
    collectedAt?: string;
  };
}

export class ReceiptService {
  /**
   * Constructs the structured JSON data for a receipt
   */
  public buildReceiptData(params: {
    orderNumber: string;
    orderType: 'PRODUCT' | 'LAUNDRY';
    student: {
      name: string;
      email: string;
      rollNumber: string;
      hall: string;
      room: string;
    };
    items: ReceiptItem[];
    subtotal: number;
    discount: number;
    deliveryFee: number;
    total: number;
    payment: {
      method: string;
      status: string;
      transactionId?: string;
    };
  }): ReceiptData {
    return {
      receiptNumber: generateReceiptNumber(),
      orderNumber: params.orderNumber,
      orderType: params.orderType,
      date: new Date().toISOString(),
      student: params.student,
      items: params.items,
      subtotal: params.subtotal,
      discount: params.discount,
      deliveryFee: params.deliveryFee,
      total: params.total,
      payment: params.payment
    };
  }

  /**
   * Generates a clean, modern, printable HTML invoice template
   */
  public generateHtmlInvoice(receipt: ReceiptData): string {
    const itemsHtml = receipt.items
      .map(
        (item) => `
        <tr style="border-bottom: 1px solid #f1f5f9;">
          <td style="padding: 12px 0; color: #1e293b; font-weight: 500;">${item.name}</td>
          <td style="padding: 12px 0; text-align: center; color: #64748b;">${item.quantity}</td>
          <td style="padding: 12px 0; text-align: right; color: #64748b;">₹${item.unitPrice.toFixed(2)}</td>
          <td style="padding: 12px 0; text-align: right; color: #0f172a; font-weight: 600;">₹${item.amount.toFixed(2)}</td>
        </tr>
      `
      )
      .join('');

    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <title>Receipt ${receipt.receiptNumber} - NIT Durgapur</title>
        <style>
          @page { size: A4; margin: 20mm; }
          body { font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, sans-serif; color: #0f172a; margin: 0; padding: 24px; }
          .receipt-container { max-width: 700px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; padding: 32px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
          .header { display: flex; justify-content: space-between; border-bottom: 2px solid #0284c7; padding-bottom: 16px; margin-bottom: 24px; }
          .badge { display: inline-block; padding: 4px 10px; border-radius: 9999px; font-size: 12px; font-weight: 600; background: #e0f2fe; color: #0369a1; }
          table { width: 100%; border-collapse: collapse; margin: 24px 0; }
          th { text-align: left; padding: 8px 0; color: #64748b; font-size: 13px; text-transform: uppercase; border-bottom: 2px solid #e2e8f0; }
          .print-btn { display: inline-block; background: #0284c7; color: #fff; padding: 10px 20px; border-radius: 6px; text-decoration: none; font-weight: 600; margin-bottom: 20px; cursor: pointer; border: none; }
          @media print { .no-print { display: none !important; } .receipt-container { border: none; box-shadow: none; padding: 0; } }
        </style>
      </head>
      <body>
        <div class="no-print" style="text-align: right; max-width: 700px; margin: 0 auto 12px;">
          <button class="print-btn" onclick="window.print()">Print / Save as PDF</button>
        </div>
        <div class="receipt-container">
          <div class="header">
            <div>
              <h1 style="margin: 0; font-size: 20px; color: #0284c7;">NIT Durgapur Campus Services</h1>
              <p style="margin: 4px 0 0; color: #64748b; font-size: 13px;">Official Verified Student Marketplace</p>
            </div>
            <div style="text-align: right;">
              <span class="badge">Official Receipt</span>
              <p style="margin: 6px 0 0; font-size: 13px; font-weight: 600;">${receipt.receiptNumber}</p>
            </div>
          </div>

          <div style="display: flex; justify-content: space-between; margin-bottom: 24px; font-size: 14px;">
            <div>
              <p style="color: #64748b; margin: 0 0 4px; font-size: 12px; text-transform: uppercase;">Billed To:</p>
              <strong style="color: #0f172a;">${receipt.student.name}</strong><br>
              <span style="color: #475569;">${receipt.student.email}</span><br>
              <span style="color: #475569;">Roll: ${receipt.student.rollNumber}</span><br>
              <span style="color: #475569;">${receipt.student.hall}, Room ${receipt.student.room}</span>
            </div>
            <div style="text-align: right;">
              <p style="color: #64748b; margin: 0 0 4px; font-size: 12px; text-transform: uppercase;">Order Details:</p>
              <strong>Order ID:</strong> ${receipt.orderNumber}<br>
              <strong>Date:</strong> ${new Date(receipt.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}<br>
              <strong>Payment Method:</strong> ${receipt.payment.method}<br>
              <strong>Payment Status:</strong> <span style="color: #16a34a; font-weight: 600;">${receipt.payment.status}</span>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Service / Product Item</th>
                <th style="text-align: center;">Qty</th>
                <th style="text-align: right;">Unit Price</th>
                <th style="text-align: right;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>

          <div style="margin-left: auto; width: 280px; font-size: 14px;">
            <div style="display: flex; justify-content: space-between; padding: 4px 0; color: #64748b;">
              <span>Subtotal:</span>
              <span>₹${receipt.subtotal.toFixed(2)}</span>
            </div>
            ${receipt.discount > 0 ? `
            <div style="display: flex; justify-content: space-between; padding: 4px 0; color: #16a34a;">
              <span>Discount:</span>
              <span>-₹${receipt.discount.toFixed(2)}</span>
            </div>` : ''}
            <div style="display: flex; justify-content: space-between; padding: 4px 0; color: #64748b;">
              <span>Delivery / Service Fee:</span>
              <span>₹${receipt.deliveryFee.toFixed(2)}</span>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 10px 0; border-top: 2px solid #0f172a; margin-top: 8px; font-size: 16px; font-weight: 700; color: #0f172a;">
              <span>Final Total Paid:</span>
              <span>₹${receipt.total.toFixed(2)}</span>
            </div>
          </div>

          <div style="margin-top: 36px; padding-top: 16px; border-top: 1px solid #f1f5f9; text-align: center; font-size: 12px; color: #94a3b8;">
            National Institute of Technology Durgapur &bull; Student Services Cell &bull; Support: services@nitdgp.ac.in
          </div>
        </div>
      </body>
      </html>
    `;
  }
}
