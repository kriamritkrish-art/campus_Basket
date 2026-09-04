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
          },
          connectionTimeout: 3000,
          greetingTimeout: 2000,
          socketTimeout: 4000
        });
        this.isConfigured = true;
      } catch (err) {
        console.warn('[EmailService] SMTP initialization failed:', err);
      }
    }
  }

  /**
   * Dispatches an email using Brevo REST API or Nodemailer SMTP
   */
  private async dispatchEmail(recipientEmail: string, subject: string, html: string): Promise<boolean> {
    // High visibility console output for local development & cloud logs
    console.info(`[EMAIL SERVICE] To: ${recipientEmail} | Subject: ${subject}`);

    // Option 1: Brevo REST API (Fastest, uses HTTPS port 443, never blocked by cloud firewalls)
    if (env.BREVO_API_KEY) {
      try {
        const fromMatch = env.EMAIL_FROM.match(/^(.*?)\s*<(.+?)>$/);
        const senderName = fromMatch ? fromMatch[1].trim() : 'NIT Durgapur Campus Services';
        const senderEmail = env.BREVO_SENDER_EMAIL || (fromMatch ? fromMatch[2].trim() : 'souravsenapati055@gmail.com');

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 7000);

        const res = await fetch('https://api.brevo.com/v3/smtp/email', {
          method: 'POST',
          signal: controller.signal,
          headers: {
            'accept': 'application/json',
            'api-key': env.BREVO_API_KEY,
            'content-type': 'application/json'
          },
          body: JSON.stringify({
            sender: { name: senderName, email: senderEmail },
            to: [{ email: recipientEmail }],
            subject,
            htmlContent: html
          })
        });
        clearTimeout(timeout);

        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          console.warn('[EmailService] Brevo API responded with error:', data);
        } else {
          console.info(`[EmailService] Email delivered successfully via Brevo API to ${recipientEmail} (MessageId: ${(data as any).messageId || 'ok'})`);
          return true;
        }
      } catch (err: any) {
        console.warn('[EmailService] Brevo dispatch exception:', err?.message || err);
      }
    }

    // Option 2: Nodemailer SMTP Relay (e.g. smtp-relay.brevo.com or custom SMTP)
    if (this.isConfigured && this.transporter) {
      this.transporter
        .sendMail({
          from: env.EMAIL_FROM,
          to: recipientEmail,
          subject,
          html
        })
        .then(() => {
          console.info(`[EmailService] Email delivered successfully via SMTP to ${recipientEmail}`);
        })
        .catch((err) => {
          console.warn('[EmailService] SMTP delivery notice:', err?.message || err);
        });
    }

    return true;
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

    console.info(`\n======================================================`);
    console.info(`[EMAIL SERVICE] To: ${recipientEmail}`);
    console.info(`[EMAIL SERVICE] Subject: ${subject}`);
    console.info(`[EMAIL SERVICE] OTP CODE: >>> ${otp} <<< (Expires in 5m)`);
    console.info(`======================================================\n`);

    return this.dispatchEmail(recipientEmail, subject, html);
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
    const html = `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 540px; margin: 0 auto; padding: 24px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px;">
        <h2 style="color: #2e7d32; margin-top: 0;">NIT Durgapur Campus Order Confirmed!</h2>
        <p>Order Number: <strong>${orderNumber}</strong></p>
        <p>Total Paid: <strong>₹${totalAmount}</strong></p>
        <p>Items: ${itemsSummary}</p>
        <p style="color: #64748b; font-size: 13px;">Our campus dispatch team has received your order and is preparing it for room delivery.</p>
      </div>
    `;
    return this.dispatchEmail(recipientEmail, subject, html);
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
    const html = `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 540px; margin: 0 auto; padding: 24px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px;">
        <h2 style="color: #0284c7; margin-top: 0;">NIT Durgapur Express Laundry Update</h2>
        <p>Order Number: <strong>${laundryOrderNumber}</strong></p>
        <p>Current Status: <strong>${statusText}</strong></p>
        ${otpNotice ? `<div style="padding: 12px; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; margin: 16px 0; color: #166534;">${otpNotice}</div>` : ''}
      </div>
    `;
    return this.dispatchEmail(recipientEmail, subject, html);
  }
}
