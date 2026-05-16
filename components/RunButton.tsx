"use client";
import { useState } from "react";
import { Play, ChevronDown, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const OPTIONS = [
  { value: "both", label: "Run for both profiles" },
  { value: "dev", label: "Run — Dev (Mack) only" },
  { value: "psych", label: "Run — Psych (Jenefer) only" },
];

export default function RunButton() {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  async function run(profile: string) {
    setBusy(profile);
    setMsg(null);
    setOpen(false);
    try {
      const r = await fetch(`/api/run?profile=${profile}`, { method: "POST", redirect: "manual" });
      if (r.status >= 200 && r.status < 400) {
        setMsg(`Dispatched · ${profile === "both" ? "all profiles" : profile}`);
      } else {
        const t = await r.text().catch(() => "");
        setMsg(`Error ${r.status}: ${t.slice(0, 160)}`);
      }
    } catch (e: any) {
      setMsg(`Network: ${e.message}`);
    } finally {
      setBusy(null);
      setTimeout(() => setMsg(null), 4000);
    }
  }

  return (
    <div className="relative inline-block">
      <div className="flex">
        <Button onClick={() => run("both")} disabled={!!busy} className="rounded-r-none">
          {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Play className="mr-2 h-4 w-4" />}
          {busy ? `Running ${busy}...` : "Run scrape"}
        </Button>
        <Button
          variant="default"
          onClick={() => setOpen((v) => !v)}
          disabled={!!busy}
          className="rounded-l-none border-l border-background/30 px-2"
          aria-label="run options"
        >
          <ChevronDown className="h-4 w-4" />
        </Button>
      </div>
      {open && (
        <div className="absolute right-0 mt-1 w-56 rounded-md border bg-card p-1 shadow-lg z-20">
          {OPTIONS.map((o) => (
            <button
              key={o.value}
              onClick={() => run(o.value)}
              className="block w-full text-left rounded-sm px-3 py-2 text-sm hover:bg-secondary"
            >
              {o.label}
            </button>
          ))}
        </div>
      )}
      {msg && (
        <p className="absolute right-0 top-full mt-1 text-xs text-muted-foreground whitespace-nowrap">{msg}</p>
      )}
    </div>
  );
}
