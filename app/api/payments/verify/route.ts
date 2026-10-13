import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const { reference } = await req.json();

  if (!reference) {
    return NextResponse.json({ error: "Missing reference" }, { status: 400 });
  }

  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret) {
    return NextResponse.json({ error: "Not configured" }, { status: 500 });
  }

  // Ask Paystack directly
  const res = await fetch(
    `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
    {
      headers: { Authorization: `Bearer ${secret}` },
    }
  );

  if (!res.ok) {
    const txt = await res.text();
    return NextResponse.json(
      { error: "Verification failed", detail: txt.slice(0, 300) },
      { status: 502 }
    );
  }

  const data = await res.json();

  if (data?.data?.status !== "success") {
    return NextResponse.json({
      ok: false,
      status: data?.data?.status ?? "unknown",
    });
  }

  // Now update our DB the same way the webhook does
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const admin = createClient(supabaseUrl, serviceKey);

  const { data: payment } = await admin
    .from("payments")
    .select("*")
    .eq("reference", reference)
    .maybeSingle();

  if (!payment) {
    return NextResponse.json({ error: "Payment not found" }, { status: 404 });
  }

  // Already processed? Return success
  if (payment.status === "success") {
    return NextResponse.json({ ok: true, status: "success" });
  }

  // Update payment
  await admin
    .from("payments")
    .update({
      status: "success",
      paid_at: new Date().toISOString(),
    })
    .eq("id", payment.id);

  // Grant access
  if (payment.type === "course" && payment.target_id) {
    await admin
      .from("enrollments")
      .update({
        paid_at: new Date().toISOString(),
        payment_reference: reference,
        amount_paid_kobo: payment.amount_kobo,
      })
      .eq("user_id", payment.user_id)
      .eq("course_id", payment.target_id);
  }

  if (payment.type === "certificate" && payment.target_id) {
    await admin
      .from("certificates")
      .update({
        is_paid: true,
        paid_at: new Date().toISOString(),
        payment_reference: reference,
      })
      .eq("id", payment.target_id);
  }

  // Log activity
  await admin.from("activity_log").insert({
    user_id: payment.user_id,
    action: `${payment.type}_paid`,
    entity_type: payment.type,
    entity_id: payment.target_id,
    metadata: { amount_kobo: payment.amount_kobo, reference, source: "verify" },
  });

  return NextResponse.json({ ok: true, status: "success" });
}