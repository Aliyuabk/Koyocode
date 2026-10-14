import nodemailer, { type Transporter } from "nodemailer";

/* ============================================================
   SMTP TRANSPORTER (singleton)
   ============================================================ */
let cachedTransporter: Transporter | null = null;

export function getTransporter(): Transporter {
  if (cachedTransporter) return cachedTransporter;

  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT ?? 465);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASSWORD;

  if (!host || !user || !pass) {
    throw new Error(
      "SMTP not configured. Set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD in .env.local and Vercel."
    );
  }

  cachedTransporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });

  return cachedTransporter;
}

/* ============================================================
   FROM ADDRESS
   ============================================================ */
export function getFromAddress() {
  const name = process.env.SMTP_FROM_NAME ?? "KoyoCode";
  const user = process.env.SMTP_USER ?? "koyocode@kowagurutech.ng";
  return `"${name}" <${user}>`;
}

/* ============================================================
   SEND EMAIL
   ============================================================ */
export async function sendEmail({
  to,
  subject,
  html,
  replyTo,
}: {
  to: string | string[];
  subject: string;
  html: string;
  replyTo?: string;
}) {
  const transporter = getTransporter();
  return transporter.sendMail({
    from: getFromAddress(),
    to,
    subject,
    html,
    replyTo,
  });
}

/* ============================================================
   HTML ESCAPE
   ============================================================ */
export function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}