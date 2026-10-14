import nodemailer, { type Transporter } from "nodemailer";

/* ============================================================
   GMAIL SMTP TRANSPORTER (singleton)
   ============================================================ */
let cachedTransporter: Transporter | null = null;

export function getTransporter(): Transporter {
  if (cachedTransporter) return cachedTransporter;

  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;

  if (!user || !pass) {
    throw new Error(
      "Gmail SMTP not configured. Set GMAIL_USER and GMAIL_APP_PASSWORD in .env.local."
    );
  }

  cachedTransporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
      user,
      pass,
    },
  });

  return cachedTransporter;
}

/* ============================================================
   FROM ADDRESS
   ============================================================ */
export function getFromAddress() {
  const name = process.env.EMAIL_FROM_NAME ?? "KoyoCode";
  const user = process.env.GMAIL_USER ?? "koyocode@kowagurutech.ng";
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