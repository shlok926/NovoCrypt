import nodemailer from 'nodemailer';
import { env } from '../config/env';

// For development, we can use a mock transporter or standard SMTP
// In production, this would be AWS SES, Resend, or SendGrid
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER || 'test@example.com',
    pass: process.env.SMTP_PASS || 'password',
  },
});

interface SendReportOptions {
  to: string;
  subject: string;
  text: string;
  html: string;
  attachments: {
    filename: string;
    content: Buffer | string;
    contentType: string;
  }[];
}

export async function sendEmailReport(options: SendReportOptions): Promise<boolean> {
  try {
    // If SMTP credentials aren't provided and we're not in production, mock it
    if (env.NODE_ENV !== 'production' && !process.env.SMTP_USER) {
      console.log(`[MOCK EMAIL] Sent "${options.subject}" to ${options.to} with ${options.attachments.length} attachments.`);
      return true;
    }

    const info = await transporter.sendMail({
      from: `"NovoCrypt Intelligence" <${process.env.SMTP_USER || 'no-reply@novocrypt.app'}>`,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
      attachments: options.attachments,
    });

    console.log(`Email sent: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
}
