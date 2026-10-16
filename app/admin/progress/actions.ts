"use server";

import { createClient } from "@supabase/supabase-js";
import { createClient as createUserClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import {
  getEnrollmentProgress,
  buildNudgeContent,
} from "@/lib/progress-helpers";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://koyocode.vercel.app";

function getAdmin() {
  if (!SUPABASE_URL || !SERVICE_KEY) {
    throw new Error("Missing Supabase env vars");
  }
  return createClient(SUPABASE_URL, SERVICE_KEY);
}

async function assertAdmin() {
  const supabase = await createUserClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, error: "Not logged in" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "admin") {
    return { ok: false as const, error: "Admin only" };
  }

  return { ok: true as const, adminId: user.id };
}

/* ============================================================
   PREVIEW — compute the nudge without sending
   ============================================================ */
export async function previewNudge(userId: string, courseId: string) {
  const guard = await assertAdmin();
  if (!guard.ok) return guard;

  const admin = getAdmin();
  const progress = await getEnrollmentProgress(admin, userId, courseId);
  if (!progress) return { ok: false as const, error: "Progress not found" };

  return {
    ok: true as const,
    progress,
    content: buildNudgeContent(progress),
  };
}

/* ============================================================
   SEND — direct DB write, no fetch hop
   ============================================================ */
export async function sendNudge(params: {
  userId: string;
  courseId: string;
  title?: string;
  message?: string;
  sendEmail?: boolean;
}) {
  const guard = await assertAdmin();
  if (!guard.ok) return guard;

  const admin = getAdmin();
  const progress = await getEnrollmentProgress(
    admin,
    params.userId,
    params.courseId
  );
  if (!progress) return { ok: false as const, error: "Progress not found" };

  const built = buildNudgeContent(progress);
  const title = params.title?.trim() || built.title;
  const message = params.message?.trim() || built.message;

  // 1. Insert the notification row
  const { data: notif, error: notifErr } = await admin
    .from("notifications")
    .insert({
      title,
      message,
      link: built.link,
      link_label: built.linkLabel,
      audience: "user",
      target_user: params.userId,
      send_email: !!params.sendEmail,
      created_by: guard.adminId,
      recipients: 1,
    })
    .select("id")
    .single();

  if (notifErr || !notif) {
    console.error("[sendNudge] notif insert:", notifErr?.message);
    return {
      ok: false as const,
      error: notifErr?.message ?? "Failed to create notification",
    };
  }

  // 2. Link it into the user's inbox
  const { error: inboxErr } = await admin.from("user_notifications").insert({
    user_id: params.userId,
    notification_id: notif.id,
    read: false,
  });

  if (inboxErr) {
    console.error("[sendNudge] inbox insert:", inboxErr.message);
    await admin.from("notifications").delete().eq("id", notif.id);
    return { ok: false as const, error: inboxErr.message };
  }

  // 3. Optional email
  let emailSent = 0;
  if (params.sendEmail) {
    try {
      const { data: authUser } = await admin.auth.admin.getUserById(
        params.userId
      );
      const email = authUser?.user?.email;
      if (email) {
        const { sendEmail, escapeHtml } = await import("@/lib/email");
        const fullLink = `${SITE_URL}${built.link}`;
        await sendEmail({
          to: email,
          subject: title,
          html: `
            <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:600px;margin:0 auto;padding:24px;">
              <h2 style="color:#0f172a;margin:0 0 16px;">${escapeHtml(title)}</h2>
              <p style="color:#475569;line-height:1.7;white-space:pre-wrap;">${escapeHtml(message)}</p>
              <p style="margin-top:24px;">
                <a href="${fullLink}" style="background:#0A3D91;color:#fff;padding:14px 32px;border-radius:12px;text-decoration:none;font-weight:700;display:inline-block;">
                  ${escapeHtml(built.linkLabel)}
                </a>
              </p>
              <p style="color:#94a3b8;font-size:12px;margin-top:32px;">
                KoyoCode · New Generation Tech Academy
              </p>
            </div>
          `,
        });
        emailSent = 1;
      }
    } catch (e: any) {
      console.error("[sendNudge] email failed:", e?.message);
    }
  }

  revalidatePath("/admin/progress");
  return { ok: true as const, notificationId: notif.id, emailSent };
}

/* ============================================================
   BULK — loop over targets
   ============================================================ */
export async function sendBulkNudge(params: {
  targets: { userId: string; courseId: string }[];
  sendEmail?: boolean;
}) {
  const guard = await assertAdmin();
  if (!guard.ok) return guard;

  if (!params.targets?.length) {
    return { ok: false as const, error: "No targets selected" };
  }

  let sent = 0;
  let failed = 0;
  const errors: string[] = [];

  for (const t of params.targets) {
    const res = await sendNudge({
      userId: t.userId,
      courseId: t.courseId,
      sendEmail: params.sendEmail,
    });
    if (res.ok) sent++;
    else {
      failed++;
      if (errors.length < 3 && res.error) errors.push(res.error);
    }
  }

  revalidatePath("/admin/progress");
  return { ok: true as const, sent, failed, sampleErrors: errors };
}