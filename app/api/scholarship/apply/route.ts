import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const maxDuration = 30;

const MOTIVATION_MIN = 10;
const NAME_MIN = 2;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Body = {
  full_name: string;
  email: string;
  phone?: string;
  city?: string;
  age_range?: string;
  background?: string;
  motivation: string;
  course_id?: string;
};

export async function POST(req: Request) {
  // 1. Parse body
  let body: Body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const {
    full_name,
    email,
    phone,
    city,
    age_range,
    background,
    motivation,
    course_id,
  } = body;

  // 2. Basic presence check
  if (!full_name?.trim() || !email?.trim() || !motivation?.trim()) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 }
    );
  }

  // 3. Name length
  if (full_name.trim().length < NAME_MIN) {
    return NextResponse.json(
      { error: `Name must be at least ${NAME_MIN} characters` },
      { status: 400 }
    );
  }

  // 4. Email format
  const emailClean = email.trim().toLowerCase();
  if (!EMAIL_RE.test(emailClean)) {
    return NextResponse.json(
      { error: "Invalid email format" },
      { status: 400 }
    );
  }

  // 5. Motivation length — now 10 characters
  if (motivation.trim().length < MOTIVATION_MIN) {
    return NextResponse.json(
      { error: `Motivation must be at least ${MOTIVATION_MIN} characters` },
      { status: 400 }
    );
  }

  // 6. Service role client — bypasses RLS
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!SUPABASE_URL || !SERVICE_KEY) {
    console.error("[apply] missing service role env vars");
    return NextResponse.json(
      { error: "Server misconfigured" },
      { status: 500 }
    );
  }

  const admin = createClient(SUPABASE_URL, SERVICE_KEY);

  // 7. Check for duplicate — one application per email
  const { data: existing } = await admin
    .from("scholarship_applications")
    .select("id, status")
    .eq("email", emailClean)
    .maybeSingle();

  if (existing) {
    return NextResponse.json(
      {
        error:
          existing.status === "approved"
            ? "This email has already been approved for a scholarship."
            : existing.status === "rejected"
            ? "This email's previous application was rejected."
            : "You have already applied with this email.",
      },
      { status: 409 }
    );
  }

  // 8. Verify the email was actually verified via the code flow
  //    (prevents someone bypassing the form and POSTing directly)
  const { data: verifiedRow } = await admin
    .from("email_verifications")
    .select("id, used, expires_at")
    .eq("email", emailClean)
    .eq("purpose", "scholarship")
    .eq("used", true)
    .gte("expires_at", new Date(Date.now() - 30 * 60 * 1000).toISOString())
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!verifiedRow) {
    return NextResponse.json(
      { error: "Please verify your email before submitting." },
      { status: 403 }
    );
  }

  // 9. Insert the application
  const { data: inserted, error: insertErr } = await admin
    .from("scholarship_applications")
    .insert({
      full_name: full_name.trim(),
      email: emailClean,
      phone: phone?.trim() || null,
      city: city?.trim() || null,
      age_range: age_range || null,
      background: background || null,
      motivation: motivation.trim(),
      course_id: course_id || null,
      status: "pending",
    })
    .select("id")
    .single();

  if (insertErr) {
    console.error("[apply] insert error:", insertErr.message);
    return NextResponse.json(
      { error: insertErr.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true, id: inserted.id });
}