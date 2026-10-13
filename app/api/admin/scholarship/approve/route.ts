import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { createClient as createUserClient } from "@/lib/supabase/server";
import { createClient as createAdmin } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(req: Request) {
  // ============================================================
  // 1. Verify caller is admin
  // ============================================================
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

  // ============================================================
  // 2. Parse body
  // ============================================================
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const { application_id } = body;
  if (!application_id) {
    return NextResponse.json(
      { error: "application_id required" },
      { status: 400 }
    );
  }

  // ============================================================
  // 3. Load application using service role
  // ============================================================
  const admin = createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: app, error: appErr } = await admin
    .from("scholarship_applications")
    .select("*")
    .eq("id", application_id)
    .maybeSingle();

  if (appErr || !app) {
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

  if (!app.course_id) {
    return NextResponse.json(
      { error: "No course attached to this application" },
      { status: 400 }
    );
  }

  // ============================================================
  // 4. Load course details for the email
  // ============================================================
  const { data: course } = await admin
    .from("courses")
    .select("id, title, icon, slug")
    .eq("id", app.course_id)
    .maybeSingle();

  // ============================================================
  // 5. Create or find the auth user
  // ============================================================
  const tempPassword = generatePassword();

  // Check if a user with this email already exists
  const { data: existingUsers } = await admin.auth.admin.listUsers();
  const existing = existingUsers?.users?.find(
    (u) => u.email?.toLowerCase() === app.email.toLowerCase()
  );

  let userId: string;
  let userIsNew = false;

  if (existing) {
    userId = existing.id;
  } else {
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
    userIsNew = true;
  }

  // ============================================================
  // 6. Enroll + grant premium access
  // ============================================================
  const { data: existingEnrollment } = await admin
    .from("enrollments")
    .select("id")
    .eq("user_id", userId)
    .eq("course_id", app.course_id)
    .maybeSingle();

  if (existingEnrollment) {
    await admin
      .from("enrollments")
      .update({
        paid_at: new Date().toISOString(),
        payment_reference: "SCHOLARSHIP",
        amount_paid_kobo: 0,
      })
      .eq("id", existingEnrollment.id);
  } else {
    await admin.from("enrollments").insert({
      user_id: userId,
      course_id: app.course_id,
      paid_at: new Date().toISOString(),
      payment_reference: "SCHOLARSHIP",
      amount_paid_kobo: 0,
    });
  }

  // ============================================================
  // 7. Mark application approved
  // ============================================================
  await admin
    .from("scholarship_applications")
    .update({
      status: "approved",
      user_id: userId,
      reviewed_at: new Date().toISOString(),
      reviewed_by: user.id,
    })
    .eq("id", application_id);

  // ============================================================
  // 8. Send the welcome email via Gmail SMTP
  // ============================================================
  let emailSent = false;
  let emailError: string | null = null;

  const GMAIL_USER = process.env.GMAIL_USER;
  const GMAIL_APP_PASSWORD = process.env.GMAIL_APP_PASSWORD;
  const SITE_URL =
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://koyocode.vercel.app";

  if (GMAIL_USER && GMAIL_APP_PASSWORD && userIsNew) {
    try {
      const transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 587,
        secure: false,
        auth: {
          user: GMAIL_USER,
          pass: GMAIL_APP_PASSWORD,
        },
      });

      const firstName = app.full_name.split(" ")[0] || "friend";
      const courseTitle = course?.title ?? "your course";
      const courseIcon = course?.icon ?? "📘";

      await transporter.sendMail({
        from: `"KoyoCode" <${GMAIL_USER}>`,
        to: app.email,
        subject: `🎓 Welcome to KoyoCode, ${firstName}! Your scholarship is approved`,
        html: buildWelcomeEmail({
          firstName,
          fullName: app.full_name,
          email: app.email,
          password: tempPassword,
          courseTitle,
          courseIcon,
          siteUrl: SITE_URL,
        }),
      });

      emailSent = true;
      console.log("[scholarship] welcome email sent to:", app.email);
    } catch (e: any) {
      emailError = e?.message ?? "Unknown email error";
      console.error("[scholarship] email failed:", emailError);
    }
  } else if (!userIsNew) {
    console.log("[scholarship] user already existed, skipping email");
  } else {
    console.warn(
      "[scholarship] GMAIL_USER or GMAIL_APP_PASSWORD not configured"
    );
  }

  // ============================================================
  // 9. Return success
  // ============================================================
  return NextResponse.json({
    ok: true,
    user_id: userId,
    temp_password: tempPassword,
    email_sent: emailSent,
    email_error: emailError,
    already_existed: !userIsNew,
  });
}

/* ============================================================
   HELPERS
   ============================================================ */
function generatePassword() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  let out = "";
  for (let i = 0; i < 12; i++) {
    out += chars[Math.floor(Math.random() * chars.length)];
  }
  return out + "@1";
}

function buildWelcomeEmail({
  firstName,
  fullName,
  email,
  password,
  courseTitle,
  courseIcon,
  siteUrl,
}: {
  firstName: string;
  fullName: string;
  email: string;
  password: string;
  courseTitle: string;
  courseIcon: string;
  siteUrl: string;
}) {
  const loginUrl = `${siteUrl}/login`;
  const dashboardUrl = `${siteUrl}/dashboard`;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Welcome to KoyoCode</title>
</head>
<body style="margin:0;padding:0;background:#f4f6fb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#f4f6fb;padding:40px 16px;">
    <tr>
      <td align="center">

        <table width="600" cellpadding="0" cellspacing="0" role="presentation" style="max-width:600px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 8px 32px rgba(10,61,145,0.08);">

          <!-- HEADER -->
          <tr>
            <td style="background:linear-gradient(135deg,#0A3D91 0%,#1E90FF 100%);padding:40px 40px 32px;text-align:center;">
              <table cellpadding="0" cellspacing="0" role="presentation" align="center">
                <tr>
                  <td style="background:#ffffff;width:56px;height:56px;border-radius:14px;text-align:center;vertical-align:middle;font-size:28px;font-weight:900;color:#0A3D91;line-height:56px;box-shadow:0 4px 16px rgba(0,0,0,0.15);">
                    K
                  </td>
                </tr>
              </table>
              <h1 style="margin:24px 0 4px;color:#ffffff;font-size:24px;font-weight:800;letter-spacing:-0.5px;">
                KoyoCode
              </h1>
              <p style="margin:0;color:#bfdbfe;font-size:13px;font-weight:600;letter-spacing:0.05em;text-transform:uppercase;">
                New Generation Tech Academy
              </p>
            </td>
          </tr>

          <!-- BODY -->
          <tr>
            <td style="padding:40px;">

              <h2 style="margin:0 0 12px;color:#0f172a;font-size:24px;font-weight:800;">
                🎓 Congratulations, ${escapeHtml(firstName)}!
              </h2>

              <p style="margin:0 0 16px;color:#475569;font-size:15px;line-height:1.6;">
                Your KoyoCode Scholarship application has been <strong style="color:#059669;">approved</strong>. We&apos;re excited to welcome you to the program.
              </p>

              <p style="margin:0 0 16px;color:#475569;font-size:15px;line-height:1.6;">
                Your account is ready and you&apos;re already enrolled in:
              </p>

              <table cellpadding="0" cellspacing="0" role="presentation" width="100%" style="margin:16px 0 24px;background:#f0f9ff;border:1px solid #bae6fd;border-radius:12px;">
                <tr>
                  <td style="padding:20px;text-align:center;">
                    <p style="margin:0;font-size:32px;">${courseIcon}</p>
                    <p style="margin:8px 0 0;color:#0c4a6e;font-size:18px;font-weight:800;">
                      ${escapeHtml(courseTitle)}
                    </p>
                    <p style="margin:4px 0 0;color:#0369a1;font-size:13px;font-weight:600;">
                      Full lifetime access · Free scholarship
                    </p>
                  </td>
                </tr>
              </table>

              <h3 style="margin:0 0 12px;color:#0f172a;font-size:16px;font-weight:800;">
                🔑 Your login details
              </h3>

              <table cellpadding="0" cellspacing="0" role="presentation" width="100%" style="margin:0 0 24px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;">
                <tr>
                  <td style="padding:16px 20px;border-bottom:1px solid #e2e8f0;">
                    <p style="margin:0 0 4px;color:#64748b;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;">
                      Login page
                    </p>
                    <a href="${loginUrl}" style="color:#1E90FF;font-size:14px;font-weight:700;font-family:monospace;text-decoration:none;word-break:break-all;">
                      ${loginUrl}
                    </a>
                  </td>
                </tr>
                <tr>
                  <td style="padding:16px 20px;border-bottom:1px solid #e2e8f0;">
                    <p style="margin:0 0 4px;color:#64748b;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;">
                      Email
                    </p>
                    <p style="margin:0;color:#0f172a;font-size:14px;font-weight:700;font-family:monospace;word-break:break-all;">
                      ${escapeHtml(email)}
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:16px 20px;background:#ecfdf5;">
                    <p style="margin:0 0 4px;color:#047857;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;">
                      Temporary password
                    </p>
                    <p style="margin:0;color:#065f46;font-size:18px;font-weight:900;font-family:monospace;letter-spacing:1px;">
                      ${escapeHtml(password)}
                    </p>
                  </td>
                </tr>
              </table>

              <!-- CTA -->
              <table cellpadding="0" cellspacing="0" role="presentation" align="center" style="margin:32px 0;">
                <tr>
                  <td style="border-radius:12px;background:#0A3D91;box-shadow:0 8px 24px rgba(10,61,145,0.3);">
                    <a href="${loginUrl}" style="display:inline-block;padding:16px 40px;color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;border-radius:12px;">
                      Log in and start learning →
                    </a>
                  </td>
                </tr>
              </table>

              <!-- WARNING -->
              <table cellpadding="0" cellspacing="0" role="presentation" width="100%" style="margin:24px 0;border-left:3px solid #f59e0b;background:#fffbeb;border-radius:0 8px 8px 0;">
                <tr>
                  <td style="padding:16px 20px;">
                    <p style="margin:0;color:#78350f;font-size:13px;line-height:1.6;">
                      <strong>⚠ Change your password after logging in.</strong><br />
                      Go to <strong>Dashboard → Settings</strong> to set your own password and update your profile.
                    </p>
                  </td>
                </tr>
              </table>

              <h3 style="margin:32px 0 12px;color:#0f172a;font-size:16px;font-weight:800;">
                📋 What you committed to
              </h3>
              <ul style="margin:0 0 24px;padding-left:20px;color:#475569;font-size:14px;line-height:1.8;">
                <li>Complete the course within 30 days</li>
                <li>Fill in a short feedback form on completion</li>
                <li>Write a 2-sentence testimonial if you&apos;d recommend it</li>
              </ul>

              <p style="margin:0 0 16px;color:#475569;font-size:14px;line-height:1.6;">
                If you have any questions, reply to this email — I read every reply personally.
              </p>

              <p style="margin:24px 0 0;color:#475569;font-size:14px;line-height:1.6;">
                Barka da zuwa!<br />
                <strong>Aliyu Abubakar</strong><br />
                <span style="color:#94a3b8;">Founder, KoyoCode</span>
              </p>

            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td style="padding:24px 40px;background:#f8fafc;border-top:1px solid #e2e8f0;text-align:center;">
              <p style="margin:0 0 8px;color:#475569;font-size:13px;font-weight:600;">
                Koyi coding. Gina makomarka.
              </p>
              <p style="margin:0;color:#94a3b8;font-size:11px;line-height:1.6;">
                KoyoCode · New Generation Tech Academy<br />
                <a href="${siteUrl}" style="color:#1E90FF;text-decoration:none;">${siteUrl.replace(/^https?:\/\//, "")}</a>
              </p>
            </td>
          </tr>

        </table>

        <p style="margin:24px 0 0;color:#94a3b8;font-size:11px;line-height:1.6;text-align:center;">
          You received this email because you applied for a KoyoCode Scholarship.
        </p>

      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}