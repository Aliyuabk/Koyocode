import { NextResponse } from "next/server";
import { createClient as createUserClient } from "@/lib/supabase/server";
import { createClient as createAdmin } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(req: Request) {
  // Verify caller is admin
  const userSupabase = await createUserClient();
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

  const body = await req.json();
  const { application_id } = body;

  if (!application_id) {
    return NextResponse.json(
      { error: "application_id required" },
      { status: 400 }
    );
  }

  const admin = createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Load application
  const { data: app } = await admin
    .from("scholarship_applications")
    .select("*")
    .eq("id", application_id)
    .maybeSingle();

  if (!app) {
    return NextResponse.json(
      { error: "Application not found" },
      { status: 404 }
    );
  }

  if (app.status === "approved") {
    return NextResponse.json(
      { error: "Already approved" },
      { status: 400 }
    );
  }

  // Generate a temporary password
  const tempPassword = generatePassword();

  // Try to find an existing auth user with this email
  const { data: existingUsers } = await admin.auth.admin.listUsers();
  const existing = existingUsers?.users?.find(
    (u) => u.email?.toLowerCase() === app.email.toLowerCase()
  );

  let userId: string;

  if (existing) {
    userId = existing.id;
  } else {
    // Create the auth user
    const { data: created, error: createErr } =
      await admin.auth.admin.createUser({
        email: app.email,
        password: tempPassword,
        email_confirm: true,
        user_metadata: {
          full_name: app.full_name,
          scholarship: true,
        },
      });

    if (createErr || !created.user) {
      return NextResponse.json(
        { error: createErr?.message ?? "Failed to create user" },
        { status: 500 }
      );
    }

    userId = created.user.id;
  }

  // Enroll them and grant premium access
  if (app.course_id) {
    const { data: enrollment } = await admin
      .from("enrollments")
      .select("id")
      .eq("user_id", userId)
      .eq("course_id", app.course_id)
      .maybeSingle();

    if (!enrollment) {
      await admin.from("enrollments").insert({
        user_id: userId,
        course_id: app.course_id,
        paid_at: new Date().toISOString(),
        payment_reference: "SCHOLARSHIP",
        amount_paid_kobo: 0,
      });
    } else {
      await admin
        .from("enrollments")
        .update({
          paid_at: new Date().toISOString(),
          payment_reference: "SCHOLARSHIP",
          amount_paid_kobo: 0,
        })
        .eq("id", enrollment.id);
    }
  }

  // Update application
  await admin
    .from("scholarship_applications")
    .update({
      status: "approved",
      user_id: userId,
      reviewed_at: new Date().toISOString(),
      reviewed_by: user.id,
    })
    .eq("id", application_id);

  // Send welcome email via Resend (if configured)
  const resendKey = process.env.RESEND_API_KEY;

  if (resendKey) {
    try {
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${resendKey}`,
        },
        body: JSON.stringify({
          from: "KoyoCode <noreply@koyocode.com.ng>",
          to: app.email,
          subject: "🎓 Your KoyoCode Scholarship is approved!",
          html: `
            <div style="font-family:sans-serif;max-width:600px;margin:auto;padding:40px 20px;">
              <h1 style="color:#0A3D91;">Barka da zuwa, ${app.full_name.split(" ")[0]}!</h1>
              <p style="font-size:16px;line-height:1.6;color:#475569;">
                Congratulations! Your KoyoCode Scholarship application has been approved.
              </p>
              <p style="font-size:16px;line-height:1.6;color:#475569;">
                We&apos;ve created your account and enrolled you in your requested course. You can now log in and start learning.
              </p>
              <div style="background:#f1f5f9;padding:20px;border-radius:12px;margin:24px 0;">
                <p style="margin:0;font-size:14px;"><strong>Email:</strong> ${app.email}</p>
                <p style="margin:8px 0 0;font-size:14px;"><strong>Temporary password:</strong> ${tempPassword}</p>
              </div>
              <a href="https://koyocode.vercel.app/login" style="display:inline-block;background:#0A3D91;color:#fff;padding:14px 32px;border-radius:12px;text-decoration:none;font-weight:bold;margin-top:8px;">Log in and start →</a>
              <p style="font-size:14px;color:#94a3b8;margin-top:32px;">Please change your password after your first login.</p>
              <p style="font-size:14px;color:#94a3b8;">Koyi coding. Gina makomarka.</p>
            </div>
          `,
        }),
      });
    } catch (e) {
      console.error("Email send failed:", e);
    }
  }

  return NextResponse.json({
    ok: true,
    user_id: userId,
    temp_password: tempPassword,
    email_sent: !!resendKey,
  });
}

function generatePassword() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  let out = "";
  for (let i = 0; i < 12; i++) {
    out += chars[Math.floor(Math.random() * chars.length)];
  }
  return out + "@1";
}