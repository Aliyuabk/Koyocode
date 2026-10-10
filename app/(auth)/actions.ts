"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export type ActionState = { error?: string; success?: string } | null;
export type ProfileState = { error?: string; success?: string } | null;

/* ============================================================
   LOGIN
   ============================================================ */
export async function login(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const nextParam = String(formData.get("next") ?? "");

  if (!email || !password) {
    return { error: "Please fill in all fields." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) return { error: error.message };

  // Look up role to decide landing page
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let role = "student";
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    role = profile?.role ?? "student";
  }

  revalidatePath("/", "layout");

  // Priority: explicit ?next= > admin default > student default
  if (nextParam.startsWith("/")) {
    redirect(nextParam);
  }

  redirect(role === "admin" ? "/admin" : "/dashboard");
}

/* ============================================================
   SIGNUP
   ============================================================ */
export async function signup(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const full_name = String(formData.get("full_name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!full_name || !email || !password) {
    return { error: "Please fill in all fields." };
  }
  if (password.length < 6) {
    return { error: "Password must be at least 6 characters." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name } },
  });

  if (error) return { error: error.message };

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

/* ============================================================
   LOGOUT
   ============================================================ */
export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/");
}

/* ============================================================
   UPDATE PROFILE
   ============================================================ */
export async function updateProfile(
  _prev: ProfileState,
  formData: FormData
): Promise<ProfileState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "You must be logged in." };

  const full_name = String(formData.get("full_name") ?? "").trim();
  const avatar_url = String(formData.get("avatar_url") ?? "").trim();

  if (full_name.length < 2) {
    return { error: "Full name must be at least 2 characters." };
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      full_name,
      avatar_url: avatar_url || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/settings");
  revalidatePath("/", "layout");

  return { success: "Profile updated successfully." };
}