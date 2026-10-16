import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdmin } from "@supabase/supabase-js";
import { sendEmail, escapeHtml } from "@/lib/email";
import { resolveRecipients, type AudienceFilter } from "@/lib/audience";

export const runtime = "nodejs";
export const maxDuration = 60;

type Body = {
  title: string;
  message: string;
  link?: string | null;
  link_label?: string | null;
  filter: AudienceFilter;
  send_email?: boolean;
};

export async function POST(req: Request) {
  console.log("[send-notification] VERSION-2 filter-based");

  // 1. Auth check
  const userSupabase = await createClient();
  const {
    data: { user },
  } = await userSupabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  }

  const { data: profile } = await userSupabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
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
    filter,
    send_email = false,
  } = body;

  if (!title?.trim() || !message?.trim()) {
    return NextResponse.json(
      { error: "Title and message are required" },
      { status: 400 }
    );
  }

  if (!filter?.mode) {
    return NextResponse.json(
      { error: "Missing filter.mode" },
      { status: 400 }
    );
  }

  // 3. Service role client
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!SUPABASE_URL || !SERVICE_KEY) {
    return NextResponse.json(
      { error: "Server misconfigured" },
      { status: 500 }
    );
  }

  const admin = createAdmin(SUPABASE_URL, SERVICE_KEY);

  // 4. Resolve recipients
  const resolved = await resolveRecipients(admin, filter);
  if (!resolved.ok) {
    console.error("[send-notification] resolve error:", resolved.error);
    return NextResponse.json({ error: resolved.error }, { status: 500 });
  }

  const recipientIds = resolved.userIds;

  if (recipientIds.length === 0) {
    return NextResponse.json(
      { error: "No recipients matched your filter" },
      { status: 400 }
    );
  }

  // 5. Derive the legacy audience value
  const audienceValue: string =
    filter.mode === "quick"
      ? filter.quick
      : filter.mode === "user"
      ? "user"
      : "segment";

  console.log(
    "[send-notification] audienceValue:",
    audienceValue,
    "recipients:",
    recipientIds.length
  );

  // 6. Create the notification row
  const { data: notif, error: notifErr } = await admin
    .from("notifications")
    .insert({
      title: title.trim(),
      message: message.trim(),
      link: link?.trim() || null,
      link_label: link_label?.trim() || null,
      audience: audienceValue,
      target_user: filter.mode === "user" ? filter.userId : null,
      audience_filter: filter.mode === "segment" ? filter : null,
      send_email,
      created_by: user.id,
      recipients: recipientIds.length,
    })
    .select("id")
    .single();

  if (notifErr || !notif) {
    console.error("[send-notification] insert error:", notifErr?.message);
    return NextResponse.json(
      { error: notifErr?.message ?? "Failed to create notification" },
      { status: 500 }
    );
  }

  // 7. Inbox rows
  const inboxRows = recipientIds.map((uid) => ({
    user_id: uid,
    notification_id: notif.id,
  }));

  const { error: inboxErr } = await admin
    .from("user_notifications")
    .insert(inboxRows);

  if (inboxErr) {
    console.error("[send-notification] inbox error:", inboxErr.message);
    return NextResponse.json({ error: inboxErr.message }, { status: 500 });
  }

  // 8. Optional emails
  let emailSent = 0;
  let emailFailed = 0;

  if (send_email) {
    for (const uid of recipientIds) {
      try {
        const { data: authUser } = await admin.auth.admin.getUserById(uid);
        const email = authUser?.user?.email;
        if (!email) {
          emailFailed++;
          continue;
        }

        await sendEmail({
          to: email,
          subject: title.trim(),
          html: buildNotificationEmail({
            title: title.trim(),
            message: message.trim(),
            link: link?.trim() || null,
            link_label: link_label?.trim() || null,
          }),
        });
        emailSent++;
      } catch (e: any) {
        console.error(
          "[send-notification] email failed for",
          uid,
          e?.message
        );
        emailFailed++;
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

/* ============================================================
   EMAIL TEMPLATE
   ============================================================ */
function buildNotificationEmail({
  title,
  message,
  link,
  link_label,
}: {
  title: string;
  message: string;
  link: string | null;
  link_label: string | null;
}) {
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://koyocode.vercel.app";
  const supportEmail = process.env.SMTP_USER ?? "koyocode@kowagurutech.ng";
  const fullLink = link ? `${siteUrl}${link}` : null;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(title)}</title>
</head>
<body style="margin:0;padding:0;background:#f4f6fb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#f4f6fb;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" role="presentation" style="max-width:600px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 8px 32px rgba(10,61,145,0.08);">
          <tr>
            <td style="background:linear-gradient(135deg,#0A3D91 0%,#1E90FF 100%);padding:36px 40px 28px;text-align:center;">
              <table cellpadding="0" cellspacing="0" role="presentation" align="center">
                <tr>
                  <td style="background:#ffffff;width:48px;height:48px;border-radius:12px;text-align:center;vertical-align:middle;font-size:24px;font-weight:900;color:#0A3D91;line-height:48px;box-shadow:0 4px 16px rgba(0,0,0,0.15);">
                    K
                  </td>
                </tr>
              </table>
              <h1 style="margin:20px 0 0;color:#ffffff;font-size:22px;font-weight:800;">
                KoyoCode
              </h1>
            </td>
          </tr>

          <tr>
            <td style="padding:40px;">
              <h2 style="margin:0 0 16px;color:#0f172a;font-size:22px;font-weight:800;">
                ${escapeHtml(title)}
              </h2>

              <p style="margin:0 0 16px;color:#475569;font-size:15px;line-height:1.7;white-space:pre-wrap;">
                ${escapeHtml(message)}
              </p>

              ${
                fullLink && link_label
                  ? `
                <table cellpadding="0" cellspacing="0" role="presentation" align="center" style="margin:32px 0;">
                  <tr>
                    <td style="border-radius:12px;background:#0A3D91;box-shadow:0 8px 24px rgba(10,61,145,0.3);">
                      <a href="${fullLink}" style="display:inline-block;padding:14px 36px;color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;border-radius:12px;">
                        ${escapeHtml(link_label)}
                      </a>
                    </td>
                  </tr>
                </table>
                `
                  : ""
              }

              <p style="margin:24px 0 0;color:#475569;font-size:14px;line-height:1.6;">
                Barka da zuwa,<br />
                <strong>The KoyoCode team</strong>
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding:24px 40px;background:#f8fafc;border-top:1px solid #e2e8f0;text-align:center;">
              <p style="margin:0 0 8px;color:#475569;font-size:13px;font-weight:600;">
                Koyi coding. Gina makomarka.
              </p>
              <p style="margin:0;color:#94a3b8;font-size:11px;line-height:1.6;">
                KoyoCode · New Generation Tech Academy<br />
                <a href="mailto:${supportEmail}" style="color:#1E90FF;text-decoration:none;">${supportEmail}</a>
              </p>
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