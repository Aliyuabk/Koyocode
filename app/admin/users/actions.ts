"use server";

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://koyocode.vercel.app";

function getAdmin() {
  if (!SUPABASE_URL || !SERVICE_KEY) {
    throw new Error("Missing Supabase service env vars");
  }
  return createClient(SUPABASE_URL, SERVICE_KEY);
}

/* ============================================================
   SEND PASSWORD RESET — admin-initiated
   ============================================================ */
export async function adminSendPasswordReset(userEmail: string) {
  if (!userEmail?.trim()) {
    return { ok: false, error: "Missing email." };
  }

  let admin;
  try {
    admin = getAdmin();
  } catch {
    return { ok: false, error: "Server misconfigured." };
  }

  const emailClean = userEmail.trim().toLowerCase();

  const { error } = await admin.auth.resetPasswordForEmail(emailClean, {
    redirectTo: `${SITE_URL}/reset-password`,
  });

  if (error) {
    console.error("[adminSendPasswordReset]", error.message);
    return { ok: false, error: error.message };
  }

  return { ok: true };
}

/* ============================================================
   SEND INDIVIDUAL NOTIFICATION — in-app + optional email

   This forwards the request to /api/admin/notifications/send,
   which handles:
     · notification + user_notifications rows
     · SMTP email via nodemailer (if send_email = true)

   We pass the admin's session cookie through so the API route's
   auth check passes.
   ============================================================ */
export async function adminSendUserNotification(params: {
  userId: string;
  title: string;
  message: string;
  link?: string;
  linkLabel?: string;
  sendEmail?: boolean;
}) {
  const { userId, title, message, link, linkLabel, sendEmail } = params;

  if (!userId || !title?.trim() || !message?.trim()) {
    return { ok: false, error: "Missing required fields." };
  }

  // Import cookies() lazily so this file can also be imported
  // from non-request contexts without breaking.
  const { cookies } = await import("next/headers");
  const cookieStore = await cookies();
  const cookieHeader = cookieStore
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join("; ");

  const res = await fetch(`${SITE_URL}/api/admin/notifications/send`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      cookie: cookieHeader,
    },
    body: JSON.stringify({
      title: title.trim(),
      message: message.trim(),
      link: link?.trim() || null,
      link_label: linkLabel?.trim() || null,
      audience: "user",
      target_user: userId,
      send_email: !!sendEmail,
    }),
    cache: "no-store",
  });

  let data: any = null;
  try {
    data = await res.json();
  } catch {
    data = null;
  }

  if (!res.ok) {
    console.error(
      "[adminSendUserNotification] API error:",
      res.status,
      data?.error
    );
    return { ok: false, error: data?.error ?? `Request failed (${res.status})` };
  }

  return {
    ok: true,
    id: data?.notification_id,
    emailSent: data?.email_sent ?? 0,
    emailFailed: data?.email_failed ?? 0,
  };
}