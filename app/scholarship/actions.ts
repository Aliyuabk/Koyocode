"use server";

import { createClient } from "@supabase/supabase-js";
import { sendEmail, escapeHtml } from "@/lib/email";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function getAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

function generateCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/* ============================================================
   SEND CODE
   ============================================================ */
export async function sendVerificationCode(email: string) {
  const cleaned = email.trim().toLowerCase();

  if (!EMAIL_RE.test(cleaned)) {
    return { ok: false as const, error: "Please enter a valid email address." };
  }

  const admin = getAdmin();

  // Rate limit: 1 code per 60 seconds per email
  const { data: recent } = await admin
    .from("email_verifications")
    .select("created_at")
    .eq("email", cleaned)
    .eq("purpose", "scholarship")
    .eq("used", false)
    .gt("created_at", new Date(Date.now() - 60_000).toISOString())
    .maybeSingle();

  if (recent) {
    return {
      ok: false as const,
      error: "Please wait 60 seconds before requesting another code.",
    };
  }

  // Invalidate old codes
  await admin
    .from("email_verifications")
    .update({ used: true })
    .eq("email", cleaned)
    .eq("purpose", "scholarship")
    .eq("used", false);

  // Create new
  const code = generateCode();
  const { error: insErr } = await admin.from("email_verifications").insert({
    email: cleaned,
    code,
    purpose: "scholarship",
  });

  if (insErr) {
    console.error("[sendVerificationCode] insert error:", insErr.message);
    return {
      ok: false as const,
      error: "Could not generate code. Please try again.",
    };
  }

  // Send
  try {
    await sendEmail({
      to: cleaned,
      subject: `${code} is your KoyoCode verification code`,
      html: buildCodeEmail(code),
    });
  } catch (e: any) {
    console.error("[sendVerificationCode] email error:", e?.message);
    return {
      ok: false as const,
      error:
        "We couldn't send the code right now. Please try again in a few minutes.",
    };
  }

  return { ok: true as const };
}

/* ============================================================
   VERIFY CODE
   ============================================================ */
export async function verifyCode(email: string, code: string) {
  const cleaned = email.trim().toLowerCase();
  const trimmed = code.trim();

  if (!EMAIL_RE.test(cleaned) || !/^\d{6}$/.test(trimmed)) {
    return { ok: false as const, error: "Invalid code." };
  }

  const admin = getAdmin();

  const { data: row } = await admin
    .from("email_verifications")
    .select("id, code, expires_at")
    .eq("email", cleaned)
    .eq("purpose", "scholarship")
    .eq("used", false)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!row) {
    return {
      ok: false as const,
      error: "No active code. Please request a new one.",
    };
  }

  if (new Date(row.expires_at) < new Date()) {
    return {
      ok: false as const,
      error: "This code has expired. Please request a new one.",
    };
  }

  if (row.code !== trimmed) {
    return { ok: false as const, error: "Incorrect code." };
  }

  await admin
    .from("email_verifications")
    .update({ used: true })
    .eq("id", row.id);

  return { ok: true as const, email: cleaned };
}

/* ============================================================
   EMAIL TEMPLATE
   ============================================================ */
function buildCodeEmail(code: string) {
  return `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#f4f6fb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#f4f6fb;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="520" cellpadding="0" cellspacing="0" role="presentation" style="max-width:520px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 8px 32px rgba(10,61,145,0.08);">
          <tr>
            <td style="background:linear-gradient(135deg,#0A3D91 0%,#1E90FF 100%);padding:32px 40px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:800;">KoyoCode</h1>
              <p style="margin:8px 0 0;color:#bfdbfe;font-size:12px;font-weight:600;letter-spacing:0.05em;text-transform:uppercase;">New Generation Tech Academy</p>
            </td>
          </tr>
          <tr>
            <td style="padding:40px;text-align:center;">
              <p style="margin:0 0 12px;color:#0f172a;font-size:16px;font-weight:700;">Your verification code</p>
              <p style="margin:0 0 24px;color:#475569;font-size:14px;">Enter this code to verify your email and continue with your scholarship application.</p>
              <div style="display:inline-block;padding:16px 32px;background:#f0f9ff;border:1px solid #bae6fd;border-radius:12px;">
                <p style="margin:0;font-family:monospace;font-size:32px;font-weight:900;letter-spacing:8px;color:#0c4a6e;">${escapeHtml(code)}</p>
              </div>
              <p style="margin:24px 0 0;color:#94a3b8;font-size:12px;">This code expires in 15 minutes.</p>
              <p style="margin:8px 0 0;color:#94a3b8;font-size:12px;">If you didn't request this, ignore this email.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}