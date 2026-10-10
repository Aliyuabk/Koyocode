import { createClient } from "@/lib/supabase/server";
import CertificatesManager from "@/components/admin/CertificatesManager";

export default async function AdminCertificatesPage() {
  const supabase = await createClient();
  const { data: certs } = await supabase
    .from("certificates")
    .select(
      "id, issued_at, verification_code, user:profiles(full_name), course:courses(title, icon)"
    )
    .order("issued_at", { ascending: false });

  return <CertificatesManager rows={(certs ?? []) as any} />;
}