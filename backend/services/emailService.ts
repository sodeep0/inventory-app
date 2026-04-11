import nodemailer from 'nodemailer';
import { logger } from '../utils/logger';

interface EmailOptions {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

let transporter: nodemailer.Transporter | null = null;

export const getTransporter = (): nodemailer.Transporter | null => {
  if (transporter) return transporter;

  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS) {
    logger.warn('Email configuration is missing. Skipping email send.');
    return null;
  }

  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: parseInt(SMTP_PORT, 10),
    secure: parseInt(SMTP_PORT, 10) === 465,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  });

  return transporter;
};

export const sendEmail = async ({ to, subject, text, html }: EmailOptions): Promise<boolean> => {
  const mailTransporter = getTransporter();
  if (!mailTransporter) return false;

  try {
    const from = process.env.FROM_EMAIL || process.env.SMTP_USER;
    await mailTransporter.sendMail({
      from,
      to,
      subject,
      text,
      html: html || text,
    });

    logger.info(`Email sent to ${to}: ${subject}`);
    return true;
  } catch (error) {
    logger.error(`Failed to send email to ${to}: ${error}`);
    return false;
  }
};

export const sendLowStockAlert = async ({
  to,
  itemName,
  sku,
  quantity,
  threshold,
}: {
  to: string;
  itemName: string;
  sku: string;
  quantity: number;
  threshold: number;
}): Promise<boolean> => {
  const subject = `Low Stock Alert: ${itemName}`;
  const text = `Your item "${itemName}" (SKU: ${sku}) is running low on stock. Current quantity: ${quantity}. Low stock threshold: ${threshold}. Please consider restocking soon.`;
  const html = `
    <div style="font-family: sans-serif; padding: 20px; max-width: 500px;">
      <h2 style="color: #16697A; margin-bottom: 16px;">Low Stock Alert</h2>
      <p>The following item is running low on stock:</p>
      <table style="border-collapse: collapse; width: 100%; margin: 16px 0;">
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Item</strong></td>
          <td style="padding: 8px; border-bottom: 1px solid #eee;">${itemName}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>SKU</strong></td>
          <td style="padding: 8px; border-bottom: 1px solid #eee;">${sku}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Current Quantity</strong></td>
          <td style="padding: 8px; border-bottom: 1px solid #eee; color: #d32f2f;">${quantity}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Low Stock Threshold</strong></td>
          <td style="padding: 8px; border-bottom: 1px solid #eee;">${threshold}</td>
        </tr>
      </table>
      <p style="color: #666;">Please consider restocking soon.</p>
    </div>
  `;

  return sendEmail({ to, subject, text, html });
};
