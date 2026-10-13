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
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  }

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

  // Load settings
  const { data: settings } = await supabase
    .from("platform_settings")
    .select("payments_enabled, currency")
    .eq("id", 1)
    .maybeSingle();

  if (!settings?.payments_enabled) {
    return NextResponse.json(
      { error: "Payments are not enabled" },
      { status: 400 }
    );
  }

  // Verify Paystack secret key exists
  const paystackSecret = process.env.PAYSTACK_SECRET_KEY;
  if (!paystackSecret) {
    return NextResponse.json(
      { error: "Payment provider not configured" },
      { status: 500 }
    );
  }

  // Load course
  const { data: course } = await supabase
    .from("courses")
    .select(
      "id, title, slug, price_kobo, certificate_price_kobo, is_premium, certificate_enabled"
    )
    .eq("id", course_id)
    .single();

  if (!course) {
    return NextResponse.json({ error: "Course not found" }, { status: 404 });
  }

  // Verify user is enrolled
  const { data: enrollment } = await supabase
    .from("enrollments")
    .select("id, paid_at")
    .eq("user_id", user.id)
    .eq("course_id", course.id)
    .maybeSingle();

  if (!enrollment) {
    return NextResponse.json(
      { error: "You must be enrolled to pay" },
      { status: 403 }
    );
  }

  // Determine amount + target
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

    // Check all lessons completed + exam passed
    const { data: lessons } = await supabase
      .from("lessons")
      .select("id")
      .eq("course_id", course.id)
      .eq("is_published", true);

    const { data: progress } = await supabase
      .from("progress")
      .select("lesson_id, completed")
      .eq("user_id", user.id)
      .in("lesson_id", lessons?.map((l) => l.id) ?? []);

    const completedCount =
      progress?.filter((p) => p.completed).length ?? 0;
    if (completedCount < (lessons?.length ?? 0)) {
      return NextResponse.json(
        { error: "Complete all lessons first" },
        { status: 400 }
      );
    }

    const { data: attempt } = await supabase
      .from("exam_attempts")
      .select("passed, score")
      .eq("user_id", user.id)
      .eq("course_id", course.id)
      .maybeSingle();

    if (!attempt?.passed) {
      return NextResponse.json(
        { error: "Pass the final exam first" },
        { status: 400 }
      );
    }

    // Check if certificate already exists and paid
    const { data: existingCert } = await supabase
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

    // Certificate price
    const certPrice =
      course.certificate_price_kobo ??
      (await supabase
        .from("platform_settings")
        .select("certificate_default_price_kobo")
        .eq("id", 1)
        .single()
        .then((r) => r.data?.certificate_default_price_kobo ?? 50000));

    amountKobo = certPrice;

    // Need a certificate row to attach payment to
    if (existingCert) {
      targetId = existingCert.id;
    } else {
      // Create a pending certificate
      const { data: created } = await supabase
        .from("certificates")
        .insert({
          user_id: user.id,
          course_id: course.id,
          is_paid: false,
        })
        .select("id")
        .single();
      targetId = created?.id ?? null;
    }
  }

  if (amountKobo <= 0) {
    return NextResponse.json(
      { error: "Invalid amount" },
      { status: 400 }
    );
  }

  // Generate unique reference
  const reference = `KC_${type}_${Date.now()}_${user.id.slice(0, 8)}`;

  // Insert pending payment
  const { error: payErr } = await supabase.from("payments").insert({
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
    return NextResponse.json({ error: payErr.message }, { status: 500 });
  }

  // Initialize with Paystack
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const callbackUrl =
    callback_url ?? `${siteUrl}/payments/callback?reference=${reference}`;

  const paystackRes = await fetch(
    "https://api.paystack.co/transaction/initialize",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${paystackSecret}`,
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

  if (!paystackRes.ok) {
    const txt = await paystackRes.text();
    console.error("Paystack error:", txt);
    return NextResponse.json(
      { error: "Payment initialization failed", detail: txt.slice(0, 300) },
      { status: 502 }
    );
  }

  const paystackData = await paystackRes.json();

  return NextResponse.json({
    ok: true,
    reference,
    authorization_url: paystackData.data.authorization_url,
    access_code: paystackData.data.access_code,
  });
}