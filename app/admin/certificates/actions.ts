"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { issueCertificateForUser } from "@/lib/certificates";

export type AdminIssueResult =
  | { ok: true; verification_code: string }
  | { ok: false; error: string };

export async function adminIssueCertificate(
  userId: string,
  courseId: string
): Promise<AdminIssueResult> {
  const supabase = await createClient();
  const {
    data: { user: admin },
  } = await supabase.auth.getUser();
  if (!admin) return { ok: false, error: "Not logged in." };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", admin.id)
    .single();
  if (profile?.role !== "admin") {
    return { ok: false, error: "Admin only." };
  }

  const res = await issueCertificateForUser(userId, courseId);
  if (!res.ok) return { ok: false, error: res.reason };

  revalidatePath("/admin/certificates");
  revalidatePath("/dashboard/certificates");
  return { ok: true, verification_code: res.cert.verification_code };
}