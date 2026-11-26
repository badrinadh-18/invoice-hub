import nodemailer from 'nodemailer';
import { config } from '../config/env.js';

export const getTransporter = () => {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER || process.env.EMAIL_USER;
  const pass = process.env.SMTP_PASS || process.env.EMAIL_PASS;
  const service = process.env.SMTP_SERVICE; // e.g. 'gmail'

  // If explicit SMTP credentials are provided, use real SMTP transport
  if (service && user && pass) {
    return nodemailer.createTransport({
      service,
      auth: { user, pass }
    });
  }

  if (host && user && pass) {
    const port = parseInt(process.env.SMTP_PORT || '587', 10);
    const secure = process.env.SMTP_SECURE === 'true' || port === 465;
    return nodemailer.createTransport({
      host,
      port,
      secure,
      auth: { user, pass },
      tls: {
        rejectUnauthorized: process.env.NODE_ENV === 'production'
      }
    });
  }

  // Fallback: Stream transport when SMTP credentials are not yet configured
  return nodemailer.createTransport({
    streamTransport: true,
    newline: 'unix',
    buffer: true
  });
};

/**
 * Sends an email.
 * @param {string} to          Recipient email address.
 * @param {string} subject     Email subject.
 * @param {string} html        HTML body.
 */
export const sendEmail = async (to, subject, html) => {
  const transporter = getTransporter();
  const mailOptions = {
    from: process.env.EMAIL_FROM || '"InvoiceHub Security" <no-reply@invoicehub.com>',
    to,
    subject,
    html,
  };

  const info = await transporter.sendMail(mailOptions);
  if (info && info.message) {
    console.log('--- Outgoing Email Preview ---');
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(info.message.toString());
    console.log('--- End Outgoing Email ---');
  } else if (info) {
    console.log(`[Email Sent] Message dispatched to ${to}: ${info.messageId || 'Success'}`);
  }
  return info;
};

