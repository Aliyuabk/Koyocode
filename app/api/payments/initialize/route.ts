import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const maxDuration = 30;

type Body = {
  type: "certificate" | "course";
  course_id: string;
  callback_url?: string;
};

export async function POST(req: Request) {
  console.log("[initialize] START");

  // ------------------------------------------------------------
  // 1. Auth check
  // ------------------------------------------------------------
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    console.log("[initialize] FAIL: not logged in");
    return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  }

  console.log("[initialize] user:", user.id);

  // ------------------------------------------------------------
  // 2. Parse body
  // ------------------------------------------------------------
  let body: Body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const { type, course_id, callback_url } = body;

  if (!type || !course_id) {
    return NextResponse.json(
      { error: "type and course_id required" },
      { status: 400 }
    );
  }

  // ------------------------------------------------------------
  // 3. Read settings via SERVICE ROLE (bypasses RLS quirks)
  // ------------------------------------------------------------
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!SUPABASE_URL || !SERVICE_KEY) {
    console.log("[initialize] FAIL: missing service role env vars");
    return NextResponse.json(
      {
        error: "Server misconfigured",
        detail: "Missing SUPABASE_SERVICE_ROLE_KEY on server",
      },
      { status: 500 }
    );
  }

  const { createClient: createAdmin } = await import("@supabase/supabase-js");
  const admin = createAdmin(SUPABASE_URL, SERVICE_KEY);

  const { data: settings, error: settingsErr } = await admin
    .from("platform_settings")
    .select("payments_enabled, currency, certificate_default_price_kobo")
    .eq("id", 1)
    .maybeSingle();

  console.log("[initialize] settings:", settings, settingsErr?.message);

  if (settingsErr) {
    return NextResponse.json(
      { error: "Could not read settings", detail: settingsErr.message },
      { status: 500 }
    );
  }

  if (!settings?.payments_enabled) {
    console.log("[initialize] FAIL: payments_enabled is false");
    return NextResponse.json(
      {
        error: "Payments are not enabled",
        detail:
          "Go to /admin/revenue → Overview → toggle Payments ON → Save",
      },
      { status: 400 }
    );
  }

  // ------------------------------------------------------------
  // 4. Verify Paystack secret key
  // ------------------------------------------------------------
  const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY;

  if (!PAYSTACK_SECRET) {
    console.log("[initialize] FAIL: missing PAYSTACK_SECRET_KEY");
    return NextResponse.json(
      {
        error: "Payment provider not configured",
        detail:
          "Add PAYSTACK_SECRET_KEY to environment variables (Vercel + .env.local)",
      },
      { status: 500 }
    );
  }

  if (!PAYSTACK_SECRET.startsWith("sk_")) {
    console.log("[initialize] FAIL: invalid Paystack secret format");
    return NextResponse.json(
      {
        error: "Invalid Paystack key",
        detail: "PAYSTACK_SECRET_KEY must start with sk_test_ or sk_live_",
      },
      { status: 500 }
    );
  }

  console.log("[initialize] paystack key loaded, prefix:", PAYSTACK_SECRET.slice(0, 12));

  // ------------------------------------------------------------
  // 5. Load course
  // ------------------------------------------------------------
  const { data: course, error: courseErr } = await admin
    .from("courses")
    .select(
      "id, title, slug, price_kobo, certificate_price_kobo, is_premium, certificate_enabled"
    )
    .eq("id", course_id)
    .maybeSingle();

  if (courseErr || !course) {
    console.log("[initialize] FAIL: course not found", course_id);
    return NextResponse.json(
      { error: "Course not found", detail: courseErr?.message },
      { status: 404 }
    );
  }

  console.log("[initialize] course:", course.slug, "premium:", course.is_premium);

  // ------------------------------------------------------------
  // 6. Verify enrollment
  // ------------------------------------------------------------
  const { data: enrollment } = await admin
    .from("enrollments")
    .select("id, paid_at")
    .eq("user_id", user.id)
    .eq("course_id", course.id)
    .maybeSingle();

  if (!enrollment) {
    console.log("[initialize] FAIL: not enrolled");
    return NextResponse.json(
      { error: "You must be enrolled to pay", detail: "Enroll first, then pay." },
      { status: 403 }
    );
  }

  // ------------------------------------------------------------
  // 7. Determine amount + target
  // ------------------------------------------------------------
  let amountKobo = 0;
  let targetId: string | null = null;

  if (type === "course") {
    if (!course.is_premium) {
      return NextResponse.json(
        { error: "This course is not premium" },
        { status: 400 }
      );
    }
    if (enrollment.paid_at) {
      return NextResponse.json(
        { error: "You already own this course" },
        { status: 400 }
      );
    }
    amountKobo = course.price_kobo;
    targetId = course.id;
  } else if (type === "certificate") {
    if (!course.certificate_enabled) {
      return NextResponse.json(
        { error: "Certificate is not available for this course" },
        { status: 400 }
      );
    }

    // Verify all lessons completed
    const { data: lessons } = await admin
      .from("lessons")
      .select("id")
      .eq("course_id", course.id)
      .eq("is_published", true);

    const { data: progress } = await admin
      .from("progress")
      .select("lesson_id, completed")
      .eq("user_id", user.id)
      .in("lesson_id", lessons?.map((l) => l.id) ?? []);

    const completedCount = progress?.filter((p) => p.completed).length ?? 0;
    if (completedCount < (lessons?.length ?? 0)) {
      return NextResponse.json(
        {
          error: "Complete all lessons first",
          detail: `${completedCount} of ${lessons?.length ?? 0} completed`,
        },
        { status: 400 }
      );
    }

    // Verify exam passed
    const { data: attempt } = await admin
      .from("exam_attempts")
      .select("passed")
      .eq("user_id", user.id)
      .eq("course_id", course.id)
      .maybeSingle();

    if (!attempt?.passed) {
      return NextResponse.json(
        { error: "Pass the final exam first" },
        { status: 400 }
      );
    }

    // Check existing certificate
    const { data: existingCert } = await admin
      .from("certificates")
      .select("id, is_paid")
      .eq("user_id", user.id)
      .eq("course_id", course.id)
      .maybeSingle();

    if (existingCert?.is_paid) {
      return NextResponse.json(
        { error: "Certificate already unlocked" },
        { status: 400 }
      );
    }

    const certPrice =
      course.certificate_price_kobo ??
      settings.certificate_default_price_kobo ??
      50000;

    amountKobo = certPrice;

    if (existingCert) {
      targetId = existingCert.id;
    } else {
      const { data: created } = await admin
        .from("certificates")
        .insert({ user_id: user.id, course_id: course.id, is_paid: false })
        .select("id")
        .single();
      targetId = created?.id ?? null;
    }
  }

  if (amountKobo <= 0) {
    return NextResponse.json(
      { error: "Invalid amount", detail: `Amount is ${amountKobo}` },
      { status: 400 }
    );
  }

  // ------------------------------------------------------------
  // 8. Create payment row
  // ------------------------------------------------------------
  const reference = `KC_${type}_${Date.now()}_${user.id.slice(0, 8)}`;

  const { error: payErr } = await admin.from("payments").insert({
    user_id: user.id,
    reference,
    amount_kobo: amountKobo,
    status: "pending",
    type,
    target_id: targetId,
    provider: "paystack",
    metadata: { course_id: course.id, course_slug: course.slug },
  });

  if (payErr) {
    console.log("[initialize] FAIL: could not create payment row", payErr.message);
    return NextResponse.json(
      { error: "Could not create payment", detail: payErr.message },
      { status: 500 }
    );
  }

  console.log("[initialize] payment row created:", reference, amountKobo);

  // ------------------------------------------------------------
  // 9. Call Paystack
  // ------------------------------------------------------------
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const callbackUrl =
    callback_url ?? `${siteUrl}/payments/callback?reference=${reference}`;

  const paystackRes = await fetch(
    "https://api.paystack.co/transaction/initialize",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: user.email,
        amount: amountKobo,
        reference,
        currency: settings.currency ?? "NGN",
        callback_url: callbackUrl,
        metadata: {
          type,
          course_id: course.id,
          user_id: user.id,
        },
      }),
    }
  );

  const raw = await paystackRes.text();

  if (!paystackRes.ok) {
    console.log("[initialize] FAIL: Paystack responded", paystackRes.status);
    console.log("[initialize] Paystack body:", raw.slice(0, 500));
    return NextResponse.json(
      {
        error: "Payment initialization failed",
        detail: raw.slice(0, 400),
        status: paystackRes.status,
      },
      { status: 502 }
    );
  }

  let paystackData: any;
  try {
    paystackData = JSON.parse(raw);
  } catch {
    return NextResponse.json(
      { error: "Invalid Paystack response", detail: raw.slice(0, 300) },
      { status: 502 }
    );
  }

  console.log("[initialize] SUCCESS:", reference);

  return NextResponse.json({
    ok: true,
    reference,
    authorization_url: paystackData?.data?.authorization_url,
    access_code: paystackData?.data?.access_code,
  });
}