import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdmin } from "@supabase/supabase-js";
import { countRecipients, type AudienceFilter } from "@/lib/audience";

export const runtime = "nodejs";
export const maxDuration = 15;

export async function POST(req: Request) {
  // Auth check
  const userSupabase = await createClient();
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

  // Parse filter
  let filter: AudienceFilter;
  try {
    const body = await req.json();
    filter = body.filter;
    if (!filter?.mode) throw new Error("Missing filter.mode");
  } catch {
    return NextResponse.json({ error: "Invalid filter" }, { status: 400 });
  }

  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!SUPABASE_URL || !SERVICE_KEY) {
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
  }

  const admin = createAdmin(SUPABASE_URL, SERVICE_KEY);
  const res = await countRecipients(admin, filter);
  if (!res.ok) {
    return NextResponse.json({ error: res.error }, { status: 500 });
  }
  return NextResponse.json({ ok: true, count: res.count });
}