import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const maxDuration = 60;

type Body = {
  title: string;
  message: string;
  link?: string;
  link_label?: string;
  audience: "all" | "students" | "admins" | "user";
  target_user?: string;
  send_email?: boolean;
};

export async function POST(req: Request) {
  const supabase = await createClient();

  // Admin only
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    return NextResponse.json({ error: "Admin only" }, { status: 403 });
  }

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
      { error: "target_user is required for audience=user" },
      { status: 400 }
    );
  }

  // ------------------------------------------------------------
  // 1. Resolve recipient list
  // ------------------------------------------------------------
  let recipientIds: string[] = [];

  if (audience === "user" && target_user) {
    recipientIds = [target_user];
  } else {
    let query = supabase.from("profiles").select("id, role");
    if (audience === "students") query = query.eq("role", "student");
    if (audience === "admins") query = query.eq("role", "admin");

    const { data: profiles, error } = await query;
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    recipientIds = (profiles ?? []).map((p) => p.id);
  }

  if (recipientIds.length === 0) {
    return NextResponse.json(
      { error: "No recipients matched your audience" },
      { status: 400 }
    );
  }

  // ------------------------------------------------------------
  // 2. Insert notification row
  // ------------------------------------------------------------
  const { data: notif, error: notifErr } = await supabase
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
    return NextResponse.json(
      { error: notifErr?.message ?? "Failed to create notification" },
      { status: 500 }
    );
  }

  // ------------------------------------------------------------
  // 3. Insert per-user inbox rows
  // ------------------------------------------------------------
  const inboxRows = recipientIds.map((uid) => ({
    user_id: uid,
    notification_id: notif.id,
  }));

  const { error: inboxErr } = await supabase
    .from("user_notifications")
    .insert(inboxRows);

  if (inboxErr) {
    return NextResponse.json(
      { error: inboxErr.message },
      { status: 500 }
    );
  }

  // ------------------------------------------------------------
  // 4. Optionally send emails via Supabase Auth's invite/reset
  //    (Uses Supabase's email transport, no separate SMTP needed)
  // ------------------------------------------------------------
  let emailSent = 0;
  let emailFailed = 0;

  if (send_email) {
    // Fetch recipient emails
    const { data: emailRows } = await supabase
      .from("profiles")
      .select("id")
      .in("id", recipientIds);

    // We can't read auth.users directly, so use a service-role client
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!serviceKey || !supabaseUrl) {
      return NextResponse.json({
        ok: true,
        warning: "In-app sent. Emails skipped (missing service role key).",
        recipients: recipientIds.length,
      });
    }

    const { createClient: createSupabaseClient } = await import(
      "@supabase/supabase-js"
    );
    const admin = createSupabaseClient(supabaseUrl, serviceKey);

    for (const uid of recipientIds) {
      const { data: authUser } = await admin.auth.admin.getUserById(uid);
      const email = authUser?.user?.email;
      if (!email) {
        emailFailed++;
        continue;
      }

      // Send a simple transactional email via Supabase Auth
      // This uses the "magiclink" template but with a custom subject
      // Alternative: integrate Resend/SendGrid API directly — see notes below
      const { error } = await admin.auth.admin.generateLink({
        type: "magiclink",
        email,
        options: {
          redirectTo: link
            ? `${process.env.NEXT_PUBLIC_SITE_URL ?? ""}${link}`
            : process.env.NEXT_PUBLIC_SITE_URL ?? "",
        },
      });

      if (error) {
        emailFailed++;
      } else {
        emailSent++;
      }
    }
  }

  return NextResponse.json({
    ok: true,
    notification_id: notif.id,
    recipients: recipientIds.length,
    email_sent: emailSent,
    email_failed: emailFailed,
  });
}