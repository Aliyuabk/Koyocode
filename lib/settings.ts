import { createClient } from "@/lib/supabase/server";

export type PublicSettings = {
  support_email: string;
  support_email: string;
  certificate_require_payment: boolean;
  certificate_enabled: boolean;
  certificate_default_price_kobo: number;
  premium_courses_enabled: boolean;
  premium_default_preview_lessons: number;
  currency: string;
  ads_enabled: boolean;
  ads_client_id: string | null;
  ads_slots: Record<string, boolean>;
  ads_skip_for_admins: boolean;
};

const FALLBACK: PublicSettings = {
  certificate_enabled: false,
  certificate_default_price_kobo: 50000,
  premium_courses_enabled: false,
  premium_default_preview_lessons: 2,
  currency: "NGN",
  ads_enabled: false,
  ads_client_id: null,
  ads_slots: {},
  ads_skip_for_admins: true,
};

export async function getPublicSettings(): Promise<PublicSettings> {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("public_settings")
      .select("*")
      .maybeSingle();
    return { ...FALLBACK, ...(data ?? {}) };
  } catch {
    return FALLBACK;
  }
}

export function koboToNaira(kobo: number, currency = "NGN") {
  const symbol = currency === "NGN" ? "₦" : currency + " ";
  return `${symbol}${(kobo / 100).toLocaleString("en-NG", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}