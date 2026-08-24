import nodemailer, { type Transporter } from "nodemailer";

/**
 * MS Exchange email transport (solution doc §4.3).
 *
 * Default transport is SMTP with TLS (port 587), per the doc's primary
 * recommendation. If Hub IT confirms EWS instead (open item, doc §8), swap
 * the implementation of `sendExchangeMail` below for an EWS client — every
 * caller (appointment + support actions) goes through this one function, so
 * that's the only file that needs to change.
 *
 * Local/dev fallback: if EXCHANGE_SMTP_HOST/USER/PASSWORD are not set, mail
 * is logged instead of sent ("dry-run mode") so the app is runnable without
 * real Exchange credentials.
 */

export type MailAttachment = {
  filename: string;
  content: Buffer;
  contentType?: string;
};

export type MailMessage = {
  to: string;
  subject: string;
  text: string;
  replyTo?: string;
  attachments?: MailAttachment[];
};

let cachedTransporter: Transporter | null = null;
let dryRunWarned = false;

function getTransporter(): Transporter | null {
  if (cachedTransporter) return cachedTransporter;

  const host = process.env.EXCHANGE_SMTP_HOST;
  const user = process.env.EXCHANGE_SMTP_USER;
  const pass = process.env.EXCHANGE_SMTP_PASSWORD;

  if (!host || !user || !pass) return null;

  const port = Number(process.env.EXCHANGE_SMTP_PORT) || 587;
  cachedTransporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    requireTLS: port !== 465,
    auth: { user, pass },
  });
  return cachedTransporter;
}

export async function sendExchangeMail(message: MailMessage): Promise<void> {
  const transporter = getTransporter();
  const from = process.env.EXCHANGE_MAIL_FROM || process.env.EXCHANGE_SMTP_USER;

  if (!transporter || !from) {
    if (!dryRunWarned) {
      console.warn(
        "[mailer] EXCHANGE_SMTP_HOST/USER/PASSWORD/EXCHANGE_MAIL_FROM not fully configured — " +
          "running in dry-run mode, emails will be logged instead of sent."
      );
      dryRunWarned = true;
    }
    console.info("[mailer] dry-run: would send email", {
      to: message.to,
      subject: message.subject,
      replyTo: message.replyTo,
      attachments: message.attachments?.map((a) => a.filename),
    });
    return;
  }

  await transporter.sendMail({
    from,
    to: message.to,
    subject: message.subject,
    text: message.text,
    replyTo: message.replyTo,
    attachments: message.attachments,
  });
}
