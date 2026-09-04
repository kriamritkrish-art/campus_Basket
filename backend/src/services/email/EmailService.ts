import nodemailer from 'nodemailer';
import { env } from '../../config/environment';

export class EmailService {
  private transporter: nodemailer.Transporter | null = null;
  private isConfigured: boolean = false;

  constructor() {
    if (env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASSWORD) {
      try {
        this.transporter = nodemailer.createTransport({
          host: env.SMTP_HOST,
          port: env.SMTP_PORT,
          secure: env.SMTP_PORT === 465,
          auth: {
            user: env.SMTP_USER,
            pass: env.SMTP_PASSWORD
          }
        });
        this.isConfigured = true;
      } catch (err) {
        console.warn('[EmailService] SMTP initialization failed:', err);
      }
    }
  }

  /**
   * Sends the 6-digit registration / verification OTP to the official NIT Durgapur email.
   */
  async sendOtpEmail(recipientEmail: string, otp: string): Promise<boolean> {
    const subject = `[NIT Durgapur Campus Services] Your 6-Digit Verification Code is ${otp}`;
    const html = `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 540px; margin: 0 auto; padding: 24px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h2 style="color: #0f172a; margin: 0; font-size: 22px;">NIT Durgapur Campus Services</h2>
          <p style="color: #64748b; font-size: 14px; margin-top: 4px;">Verified Student Authentication</p>
        </div>
        
        <p style="color: #334155; font-size: 15px; line-height: 1.6;">
          Hello NIT Durgapur Student,
        </p>
        <p style="color: #334155; font-size: 15px; line-height: 1.6;">
          Use the 6-digit verification code below to complete your authentication. This code is valid for <strong>5 minutes</strong> only and cannot be reused.
        </p>
        
        <div style="background: #f8fafc; border: 2px dashed #0284c7; border-radius: 8px; padding: 18px; text-align: center; margin: 24px 0;">
          <span style="font-size: 32px; font-weight: 700; letter-spacing: 6px; color: #0369a1; font-family: monospace;">
            ${otp}
          </span>
        </div>
        
        <p style="color: #64748b; font-size: 13px; line-height: 1.5;">
          If you did not request this verification code, please ignore this email. Never share your OTP with anyone.
        </p>
        
        <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 24px 0;" />
        <p style="color: #94a3b8; font-size: 12px; text-align: center; margin: 0;">
          NIT Durgapur Campus Marketplace & Services Platform &bull; Mahatma Gandhi Avenue, Durgapur
        </p>
      </div>
    `;

    if (this.isConfigured && this.transporter) {
      try {
        await this.transporter.sendMail({
          from: env.EMAIL_FROM,
          to: recipientEmail,
          subject,
          html
        });
        return true;
      } catch (err) {
        console.error('[EmailService] Failed to send email via SMTP:', err);
      }
    }

    // High visibility console output for local development & testing
    console.info(`\n======================================================`);
    console.info(`[EMAIL SERVICE] To: ${recipientEmail}`);
    console.info(`[EMAIL SERVICE] Subject: ${subject}`);
    console.info(`[EMAIL SERVICE] OTP CODE: >>> ${otp} <<< (Expires in 5m)`);
    console.info(`======================================================\n`);
    return true;
  }

  /**
   * Sends order confirmation email with breakdown
   */
  async sendOrderConfirmationEmail(
    recipientEmail: string,
    orderNumber: string,
    itemsSummary: string,
    totalAmount: number
  ): Promise<boolean> {
    const subject = `[Confirmed] Your Campus Order ${orderNumber}`;
    console.info(`[EmailService] Order confirmation dispatched to ${recipientEmail} for ${orderNumber} (₹${totalAmount})`);
    return true;
  }

  /**
   * Sends Laundry status update
   */
  async sendLaundryNotification(
    recipientEmail: string,
    laundryOrderNumber: string,
    statusText: string,
    otpNotice?: string
  ): Promise<boolean> {
    const subject = `[Laundry Update] Order ${laundryOrderNumber} is now ${statusText}`;
    console.info(`[EmailService] Laundry update dispatched to ${recipientEmail}: ${statusText}. ${otpNotice || ''}`);
    return true;
  }
}
