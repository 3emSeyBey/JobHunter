"use client";
import { useState } from "react";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Globe, Radio } from "lucide-react";

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
    <div className="flex items-center justify-between py-3 gap-3">
      <div className="flex items-start gap-3 min-w-0">
        <div className="mt-0.5 grid h-8 w-8 place-items-center rounded-md bg-secondary text-muted-foreground shrink-0">
          {source.slug === "onlinejobs_ph" ? <Globe className="h-4 w-4" /> : <Radio className="h-4 w-4" />}
        </div>
        <div className="min-w-0">
          <div className="font-medium truncate">{source.display_name}</div>
          <div className="text-xs text-muted-foreground mono truncate">
            {source.slug} · scraper={source.scraper}
          </div>
          <div className="mt-1 flex flex-wrap gap-1">
            {(source.profile_slugs || []).map((p: string) => (
              <Badge key={p} variant={p === "dev" ? "default" : "secondary"} className="text-[10px]">{p}</Badge>
            ))}
          </div>
        </div>
      </div>
      <Switch checked={enabled} onCheckedChange={toggle} disabled={busy} />
    </div>
  );
}
