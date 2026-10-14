import { createClient } from "@/lib/supabase/server";

/* ============================================================
   PUBLIC SETTINGS — read-only view of platform settings
   ============================================================ */
export type PublicSettings = {
  certificate_enabled: boolean;
  certificate_default_price_kobo: number;
  certificate_require_payment: boolean;
  premium_courses_enabled: boolean;
  premium_default_preview_lessons: number;
  currency: string;
  ads_enabled: boolean;
  ads_client_id: string | null;
  ads_slots: Record<string, boolean>;
  ads_skip_for_admins: boolean;
  ads_skip_on_exam: boolean;
  ads_skip_on_checkout: boolean;
  support_email: string;
  scholarship_enabled: boolean;
  scholarship_title: string;
  scholarship_description: string;
  scholarship_max_seats: number;
};

const FALLBACK: PublicSettings = {
  certificate_enabled: false,
  certificate_default_price_kobo: 50000,
  certificate_require_payment: true,
  premium_courses_enabled: false,
  premium_default_preview_lessons: 2,
  currency: "NGN",
  ads_enabled: false,
  ads_client_id: null,
  ads_slots: {},
  ads_skip_for_admins: true,
  ads_skip_on_exam: true,
  ads_skip_on_checkout: true,
  support_email: "koyocode@kowagurutech.ng",
  scholarship_enabled: false,
  scholarship_title: "KoyoCode Scholarship Program",
  scholarship_description:
    "Apply for a free seat in our premium courses.",
  scholarship_max_seats: 30,
};

/* ============================================================
   READ SETTINGS
   Safe to call from any server component or server action.
   Falls back to FALLBACK if the view is missing or errors.
   ============================================================ */
export async function getPublicSettings(): Promise<PublicSettings> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("public_settings")
      .select("*")
      .maybeSingle();

    if (error || !data) return FALLBACK;

    return {
      certificate_enabled:
        data.certificate_enabled ?? FALLBACK.certificate_enabled,
      certificate_default_price_kobo:
        data.certificate_default_price_kobo ??
        FALLBACK.certificate_default_price_kobo,
      certificate_require_payment:
        data.certificate_require_payment ??
        FALLBACK.certificate_require_payment,
      premium_courses_enabled:
        data.premium_courses_enabled ?? FALLBACK.premium_courses_enabled,
      premium_default_preview_lessons:
        data.premium_default_preview_lessons ??
        FALLBACK.premium_default_preview_lessons,
      currency: data.currency ?? FALLBACK.currency,
      ads_enabled: data.ads_enabled ?? FALLBACK.ads_enabled,
      ads_client_id: data.ads_client_id ?? FALLBACK.ads_client_id,
      ads_slots: data.ads_slots ?? FALLBACK.ads_slots,
      ads_skip_for_admins:
        data.ads_skip_for_admins ?? FALLBACK.ads_skip_for_admins,
      ads_skip_on_exam: data.ads_skip_on_exam ?? FALLBACK.ads_skip_on_exam,
      ads_skip_on_checkout:
        data.ads_skip_on_checkout ?? FALLBACK.ads_skip_on_checkout,
      support_email: data.support_email ?? FALLBACK.support_email,
      scholarship_enabled:
        data.scholarship_enabled ?? FALLBACK.scholarship_enabled,
      scholarship_title:
        data.scholarship_title ?? FALLBACK.scholarship_title,
      scholarship_description:
        data.scholarship_description ?? FALLBACK.scholarship_description,
      scholarship_max_seats:
        data.scholarship_max_seats ?? FALLBACK.scholarship_max_seats,
    };
  } catch {
    return FALLBACK;
  }
}

/* ============================================================
   FORMATTING HELPERS
   ============================================================ */
export function koboToNaira(kobo: number, currency = "NGN") {
  const symbol = currency === "NGN" ? "₦" : currency + " ";
  return `${symbol}${(kobo / 100).toLocaleString("en-NG", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}

export function nairaToKobo(naira: number) {
  return Math.max(0, Math.round(naira * 100));
}