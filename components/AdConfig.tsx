export default function AdConfig({
  enabled,
  clientId,
  slots,
}: {
  enabled: boolean;
  clientId: string | null;
  slots: Record<string, boolean>;
}) {
  return (
    <script
      id="ads-config"
      type="application/json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify({ enabled, clientId, slots }),
      }}
    />
  );
}