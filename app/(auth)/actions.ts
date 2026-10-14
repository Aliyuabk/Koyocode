"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { isStrongEnough } from "@/lib/password";
import disposableDomains from "disposable-email-domains";

export type ActionState = { error?: string; success?: string } | null;
export type ProfileState = { error?: string; success?: string } | null;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SUPPORT_EMAIL =
  process.env.SMTP_USER ?? "koyocode@kowagurutech.ng";

/* ============================================================
   VALIDATION HELPERS
   ============================================================ */
function validateEmail(email: string) {
  const cleaned = email.trim().toLowerCase();
  if (!EMAIL_RE.test(cleaned)) {
    return { ok: false, error: "Please enter a valid email address." };
  }
  const domain = cleaned.split("@")[1];
  if (disposableDomains.includes(domain)) {
    return {
      ok: false,
      error: "Please use a real email address (not a temporary one).",
    };
  }
  return { ok: true, email: cleaned };
}

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
  const rawEmail = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  if (!full_name || !rawEmail || !password) {
    return { error: "Please fill in all fields." };
  }
  if (full_name.length < 2) {
    return { error: "Full name must be at least 2 characters." };
  }

  const emailCheck = validateEmail(rawEmail);
  if (!emailCheck.ok) {
    return { error: emailCheck.error };
  }
  const email = emailCheck.email;

  if (!isStrongEnough(password)) {
    return {
      error:
        "Password must be at least 8 characters and include an uppercase letter, a lowercase letter, and a number.",
    };
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
   FORGOT PASSWORD
   ============================================================ */
export async function forgotPassword(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const rawEmail = String(formData.get("email") ?? "").trim();

  if (!rawEmail) {
    return { error: "Please enter your email address." };
  }

  const emailCheck = validateEmail(rawEmail);
  if (!emailCheck.ok) {
    return { error: emailCheck.error };
  }

  const supabase = await createClient();

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  const { error } = await supabase.auth.resetPasswordForEmail(
    emailCheck.email,
    { redirectTo: `${siteUrl}/reset-password` }
  );

  if (error) {
    console.error("[forgot-password] error:", error.message);
    return {
      error:
        "We couldn't send the reset email right now. Please try again in a few minutes, or contact " +
        SUPPORT_EMAIL +
        " if the problem continues.",
    };
  }

  return {
    success:
      "If an account exists with that email, we've sent a password reset link. Check your inbox (and spam folder).",
  };
}

/* ============================================================
   RESET PASSWORD
   ============================================================ */
export async function resetPassword(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  if (!isStrongEnough(password)) {
    return {
      error:
        "Password must be at least 8 characters and include an uppercase letter, a lowercase letter, and a number.",
    };
  }
  if (password !== confirm) {
    return { error: "Passwords do not match." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });

  if (error) return { error: error.message };

  revalidatePath("/", "layout");
  redirect("/dashboard");
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