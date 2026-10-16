"use server";

import { createClient } from "@supabase/supabase-js";

/* ============================================================
   ENV
   ============================================================ */
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

function getAdminClient() {
  if (!SUPABASE_URL || !SERVICE_KEY) {
    throw new Error("Server misconfigured: missing Supabase env vars");
  }
  return createClient(SUPABASE_URL, SERVICE_KEY);
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CODE_TTL_MINUTES = 15;

/* ============================================================
   sendVerificationCode
   Generates a 6-digit code, stores it, and (in this scaffold)
   returns it so you can wire up email delivery later.
   ============================================================ */
export async function sendVerificationCode(email: string) {
  const emailClean = email?.trim().toLowerCase();

  if (!emailClean || !EMAIL_RE.test(emailClean)) {
    return { ok: false, error: "Please enter a valid email address." };
  }

  let admin;
  try {
    admin = getAdminClient();
  } catch (e: any) {
    console.error("[sendVerificationCode]", e.message);
    return { ok: false, error: "Server misconfigured." };
  }

  // Rate limit: if a code was created in the last 60 seconds, refuse
  const oneMinuteAgo = new Date(Date.now() - 60 * 1000).toISOString();
  const { data: recent } = await admin
    .from("email_verifications")
    .select("id")
    .eq("email", emailClean)
    .eq("purpose", "scholarship")
    .gte("created_at", oneMinuteAgo)
    .limit(1)
    .maybeSingle();

  if (recent) {
    return {
      ok: false,
      error: "Please wait 60 seconds before requesting another code.",
    };
  }

  // Invalidate any previous unused codes for this email
  await admin
    .from("email_verifications")
    .update({ used: true })
    .eq("email", emailClean)
    .eq("purpose", "scholarship")
    .eq("used", false);

  // Generate a 6-digit code
  const code = String(Math.floor(100000 + Math.random() * 900000));

  const { error: insertErr } = await admin
    .from("email_verifications")
    .insert({
      email: emailClean,
      code,
      purpose: "scholarship",
      used: false,
      expires_at: new Date(
        Date.now() + CODE_TTL_MINUTES * 60 * 1000
      ).toISOString(),
    });

  if (insertErr) {
    console.error("[sendVerificationCode] insert:", insertErr.message);
    return { ok: false, error: "Could not generate a code. Try again." };
  }

  // ============================================================
  // TODO: Send the code by email here.
  // ============================================================
  // Until you wire up an email provider (Resend, SendGrid, SMTP),
  // log the code to the server console for testing:
  console.log(`[scholarship] Verification code for ${emailClean}: ${code}`);

  return { ok: true };
}

/* ============================================================
   verifyCode
   Checks a code against email_verifications. On success, marks
   the row as used=true so it cannot be replayed.
   ============================================================ */
export async function verifyCode(email: string, code: string) {
  const emailClean = email?.trim().toLowerCase();
  const codeClean = code?.trim();

  if (!emailClean || !EMAIL_RE.test(emailClean)) {
    return { ok: false, error: "Invalid email address." };
  }
  if (!/^\d{6}$/.test(codeClean)) {
    return { ok: false, error: "Please enter the 6-digit code." };
  }

  let admin;
  try {
    admin = getAdminClient();
  } catch (e: any) {
    console.error("[verifyCode]", e.message);
    return { ok: false, error: "Server misconfigured." };
  }

  // Find the most recent unused code for this email
  const { data: row, error: fetchErr } = await admin
    .from("email_verifications")
    .select("id, code, used, expires_at, created_at")
    .eq("email", emailClean)
    .eq("purpose", "scholarship")
    .eq("used", false)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (fetchErr) {
    console.error("[verifyCode] fetch:", fetchErr.message);
    return { ok: false, error: "Could not verify the code. Try again." };
  }

  if (!row) {
    return {
      ok: false,
      error: "No active code found. Please request a new one.",
    };
  }

  // Expiry check
  if (new Date(row.expires_at).getTime() < Date.now()) {
    return {
      ok: false,
      error: "This code has expired. Please request a new one.",
    };
  }

  // Code match
  if (row.code !== codeClean) {
    return { ok: false, error: "Incorrect code. Please try again." };
  }

  // Mark as used
  const { error: updateErr } = await admin
    .from("email_verifications")
    .update({ used: true })
    .eq("id", row.id);

  if (updateErr) {
    console.error("[verifyCode] update:", updateErr.message);
    return { ok: false, error: "Could not verify the code. Try again." };
  }

  return { ok: true };
}