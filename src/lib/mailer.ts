import nodemailer from "nodemailer";

// Lazily construct the transporter so importing this module never throws
// (e.g. during `next build` page-data collection, when env vars may not be
// available). The transporter is only created when an email is actually sent.
let _transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter {
  if (!_transporter) {
    _transporter = nodemailer.createTransport({
      host: "smtp-mail.outlook.com",
      port: 587,
      secure: false,
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS,
      },
    });
  }
  return _transporter;
}

export const FROM_EMAIL = process.env.GMAIL_USER || "";
export const STUDIO_EMAIL = process.env.GMAIL_USER || "";

export async function sendMail(opts: {
  to: string | string[];
  cc?: string | string[];
  subject: string;
  html: string;
  attachments?: { filename: string; content: Buffer }[];
}) {
  return getTransporter().sendMail({
    from: FROM_EMAIL,
    to: opts.to,
    cc: opts.cc,
    subject: opts.subject,
    html: opts.html,
    attachments: opts.attachments,
  });
}
