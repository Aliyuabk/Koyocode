import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdmin } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const maxDuration = 30;

type Body = {
  title: string;
  message: string;
  link?: string | null;
  link_label?: string | null;
  audience: "all" | "students" | "admins" | "user";
  target_user?: string;
  send_email?: boolean;
};

export async function POST(req: Request) {
  console.log("[send-notification] START");

  // 1. Auth check
  const userSupabase = await createClient();
  const {
    data: { user },
  } = await userSupabase.auth.getUser();

  if (!user) {
    console.log("[send-notification] FAIL: not logged in");
    return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  }

  console.log("[send-notification] user:", user.id);

  const { data: profile } = await userSupabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    console.log("[send-notification] FAIL: not admin, role =", profile?.role);
    return NextResponse.json({ error: "Admin only" }, { status: 403 });
  }

  // 2. Parse body
  let body: Body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const {
    title,
    message,
    link,
    link_label,
    audience,
    target_user,
    send_email = false,
  } = body;

  if (!title?.trim() || !message?.trim()) {
    return NextResponse.json(
      { error: "Title and message are required" },
      { status: 400 }
    );
  }

  if (audience === "user" && !target_user) {
    return NextResponse.json(
      { error: "target_user required for audience=user" },
      { status: 400 }
    );
  }

  // 3. Service-role client
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!SUPABASE_URL || !SERVICE_KEY) {
    console.log("[send-notification] FAIL: missing service role env vars");
    return NextResponse.json(
      {
        error: "Server misconfigured",
        detail: "SUPABASE_SERVICE_ROLE_KEY missing",
      },
      { status: 500 }
    );
  }

  const admin = createAdmin(SUPABASE_URL, SERVICE_KEY);

  // 4. Resolve recipients
  let recipientIds: string[] = [];

  if (audience === "user" && target_user) {
    recipientIds = [target_user];
  } else {
    let query = admin.from("profiles").select("id, role");
    if (audience === "students") query = query.eq("role", "student");
    if (audience === "admins") query = query.eq("role", "admin");

    const { data: profiles, error } = await query;
    if (error) {
      console.log("[send-notification] FAIL: profiles query", error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    recipientIds = (profiles ?? []).map((p) => p.id);
  }

  console.log("[send-notification] recipients:", recipientIds.length);

  if (recipientIds.length === 0) {
    return NextResponse.json(
      { error: "No recipients matched your audience" },
      { status: 400 }
    );
  }

  // 5. Create the notification row
  const { data: notif, error: notifErr } = await admin
    .from("notifications")
    .insert({
      title: title.trim(),
      message: message.trim(),
      link: link?.trim() || null,
      link_label: link_label?.trim() || null,
      audience,
      target_user: audience === "user" ? target_user : null,
      send_email,
      created_by: user.id,
      recipients: recipientIds.length,
    })
    .select("id")
    .single();

  if (notifErr || !notif) {
    console.log("[send-notification] FAIL: insert notif", notifErr?.message);
    return NextResponse.json(
      { error: notifErr?.message ?? "Failed to create notification" },
      { status: 500 }
    );
  }

  console.log("[send-notification] notif created:", notif.id);

  // 6. Insert per-user inbox rows
  const inboxRows = recipientIds.map((uid) => ({
    user_id: uid,
    notification_id: notif.id,
  }));

  const { error: inboxErr } = await admin
    .from("user_notifications")
    .insert(inboxRows);

  if (inboxErr) {
    console.log("[send-notification] FAIL: insert inbox", inboxErr.message);
    return NextResponse.json({ error: inboxErr.message }, { status: 500 });
  }

  console.log("[send-notification] inbox rows inserted:", inboxRows.length);

  // 7. Optional email — skipped for now, add later
  let emailSent = 0;
  let emailFailed = 0;

  if (send_email) {
    // Email sending via nodemailer / Gmail SMTP
    const GMAIL_USER = process.env.GMAIL_USER;
    const GMAIL_APP_PASSWORD = process.env.GMAIL_APP_PASSWORD;

    if (GMAIL_USER && GMAIL_APP_PASSWORD) {
      try {
        const nodemailer = await import("nodemailer");
        const transporter = nodemailer.default.createTransport({
          host: "smtp.gmail.com",
          port: 587,
          secure: false,
          auth: { user: GMAIL_USER, pass: GMAIL_APP_PASSWORD },
        });

        for (const uid of recipientIds) {
          const { data: authUser } = await admin.auth.admin.getUserById(uid);
          const email = authUser?.user?.email;
          if (!email) {
            emailFailed++;
            continue;
          }

          try {
            await transporter.sendMail({
              from: `"KoyoCode" <${GMAIL_USER}>`,
              to: email,
              subject: title.trim(),
              html: `
                <div style="font-family:sans-serif;max-width:600px;margin:auto;padding:32px 20px;">
                  <h1 style="color:#0A3D91;font-size:22px;margin:0 0 16px;">${escapeHtml(title)}</h1>
                  <p style="color:#475569;font-size:15px;line-height:1.6;white-space:pre-wrap;">${escapeHtml(message)}</p>
                  ${
                    link
                      ? `<a href="${process.env.NEXT_PUBLIC_SITE_URL ?? ""}${link}" style="display:inline-block;margin-top:24px;background:#0A3D91;color:#fff;padding:14px 32px;border-radius:12px;text-decoration:none;font-weight:bold;">${escapeHtml(link_label || "Open")}</a>`
                      : ""
                  }
                  <hr style="border:none;border-top:1px solid #e2e8f0;margin:32px 0;">
                  <p style="color:#94a3b8;font-size:12px;">KoyoCode · New Generation Tech Academy</p>
                </div>
              `,
            });
            emailSent++;
          } catch {
            emailFailed++;
          }
        }
      } catch (e: any) {
        console.error("[send-notification] email setup error:", e?.message);
      }
    }
  }

  console.log(
    "[send-notification] SUCCESS:",
    recipientIds.length,
    "recipients,",
    emailSent,
    "emails sent"
  );

  return NextResponse.json({
    ok: true,
    notification_id: notif.id,
    recipients: recipientIds.length,
    email_sent: emailSent,
    email_failed: emailFailed,
  });
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}