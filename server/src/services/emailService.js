import nodemailer from 'nodemailer';
import { config } from '../config/env.js';

// For development, use a console transport that logs email content instead of sending.
// In production, configure SMTP credentials via environment variables.
let transporter;
if (process.env.NODE_ENV === 'production') {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
} else {
  // Console transport: emails are printed to stdout.
  transporter = nodemailer.createTransport({
    streamTransport: true,
    newline: 'unix',
    buffer: true,
  });
}

/**
 * Sends an email.
 * @param {string} to          Recipient email address.
 * @param {string} subject     Email subject.
 * @param {string} html        HTML body.
 */
export const sendEmail = async (to, subject, html) => {
  const mailOptions = {
    from: process.env.EMAIL_FROM || 'no-reply@invoicehub.com',
    to,
    subject,
    html,
  };

  const info = await transporter.sendMail(mailOptions);
  // In console transport, info.message contains the full message.
  if (process.env.NODE_ENV !== 'production') {
    console.log('--- Email Preview (development) ---');
    console.log(info.message.toString());
    console.log('--- End Email Preview ---');
  }
  return info;
};

