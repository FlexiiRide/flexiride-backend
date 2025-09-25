/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */

import sgMail, { MailDataRequired } from '@sendgrid/mail';

function getSendGridApiKey(): string {
  const key = process.env.SENDGRID_API_KEY;
  if (!key) throw new Error('SENDGRID_API_KEY is not set');
  return key;
}

function getFromEmail(): string {
  const from = process.env.FROM_EMAIL;
  if (!from) throw new Error('FROM_EMAIL is not set');
  return from;
}

export async function sendEmail(to: string, subject: string, html: string) {
  // Set API key at runtime
  sgMail.setApiKey(getSendGridApiKey());

  const msg: MailDataRequired = {
    to,
    from: getFromEmail(),
    subject,
    html,
  };

  try {
    await sgMail.send(msg);
    console.log('Email sent successfully');
  } catch (err: unknown) {
    if (err instanceof Error) {
      console.error('Error sending email:', err.message);
    } else {
      console.error('Unknown error sending email:', err);
    }
  }
}
