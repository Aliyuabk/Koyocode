import { NextResponse } from "next/server";
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const raw = await req.text();
  const signature = req.headers.get("x-paystack-signature");
  const secret = process.env.PAYSTACK_SECRET_KEY;

  if (!secret) {
    return NextResponse.json({ error: "Not configured" }, { status: 500 });
  }

  // Verify signature
  const hash = crypto
    .createHmac("sha512", secret)
    .update(raw)
    .digest("hex");

  if (hash !== signature) {
    console.error("Invalid Paystack signature");
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  let event: any;
  try {
    event = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Only handle charge.success
  if (event.event !== "charge.success") {
    return NextResponse.json({ ok: true });
  }

  const { reference, amount, status } = event.data;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const admin = createClient(supabaseUrl, serviceKey);

  // Look up payment
  const { data: payment } = await admin
    .from("payments")
    .select("*")
    .eq("reference", reference)
    .maybeSingle();

  if (!payment) {
    console.error("Payment not found:", reference);
    return NextResponse.json({ ok: true });
  }

  // Idempotency — already processed
  if (payment.status === "success") {
    return NextResponse.json({ ok: true });
  }

  // Amount mismatch — reject
  if (amount !== payment.amount_kobo) {
    console.error("Amount mismatch:", amount, payment.amount_kobo);
    await admin
      .from("payments")
      .update({ status: "failed" })
      .eq("id", payment.id);
    return NextResponse.json({ ok: true });
  }

  // Mark payment successful
  await admin
    .from("payments")
    .update({
      status: "success",
      paid_at: new Date().toISOString(),
      metadata: { ...(payment.metadata ?? {}), paystack_status: status },
    })
    .eq("id", payment.id);

  // Grant access based on type
  if (payment.type === "course" && payment.target_id) {
    await admin
      .from("enrollments")
      .update({
        paid_at: new Date().toISOString(),
        payment_reference: reference,
        amount_paid_kobo: amount,
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
    metadata: {
      amount_kobo: amount,
      reference,
    },
  });

  return NextResponse.json({ ok: true });
}