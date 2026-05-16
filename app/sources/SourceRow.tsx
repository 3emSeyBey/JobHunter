"use client";
import { useState } from "react";
import { Switch } from "@/components/ui/switch";

export default function SourceRow({ source }: { source: any }) {
  const [enabled, setEnabled] = useState<boolean>(source.enabled);
  const [busy, setBusy] = useState(false);

  async function toggle(next: boolean) {
    setBusy(true);
    setEnabled(next);
    try {
      const r = await fetch("/api/sources", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id: source.id, enabled: next }),
      });
      if (!r.ok) setEnabled(!next);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex items-center justify-between py-2 border-b last:border-0">
      <div>
        <div className="font-medium">{source.display_name}</div>
        <div className="text-xs text-muted-foreground">
          slug: {source.slug} · scraper: {source.scraper} · profiles: {(source.profile_slugs || []).join(", ")}
        </div>
      </div>
      <Switch checked={enabled} onCheckedChange={toggle} disabled={busy} />
    </div>
  );
}
