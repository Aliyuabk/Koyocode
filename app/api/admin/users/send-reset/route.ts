import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://koyocode.vercel.app";

export async function POST(req: Request) {
  if (!SUPABASE_URL || !SERVICE_KEY) {
    return NextResponse.json(
      { error: "Server misconfigured" },
      { status: 500 }
    );
  }

  let body: { user_id?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const { user_id } = body;
  if (!user_id) {
    return NextResponse.json({ error: "Missing user_id" }, { status: 400 });
  }

  const admin = createClient(SUPABASE_URL, SERVICE_KEY);

  // Fetch the target user's email
  const { data: userData, error: userErr } = await admin.auth.admin.getUserById(
    user_id
  );

  if (userErr || !userData?.user?.email) {
    return NextResponse.json(
      { error: "Could not find user email" },
      { status: 404 }
    );
  }

  const email = userData.user.email;

  const { error } = await admin.auth.resetPasswordForEmail(email, {
    redirectTo: `${SITE_URL}/reset-password`,
  });

  if (error) {
    console.error("[send-reset]", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, email });
}