"use client";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Clock, Sparkles, Tag, BellRing, KeyRound, Save, CheckCircle2 } from "lucide-react";

const FREQ_OPTIONS = [
  { value: "twice_daily", label: "Twice daily — 00:00 + 12:00 UTC (default)" },
  { value: "daily", label: "Daily — 00:00 UTC" },
  { value: "every_6h", label: "Every 6 hours" },
  { value: "hourly", label: "Hourly" },
];

export default function SettingsForm({ settings }: { settings: any }) {
  const [s, setS] = useState({
    cron_frequency: settings.cron_frequency || "twice_daily",
    llm_prompt_dev: settings.llm_prompt_dev || "",
    llm_prompt_psych: settings.llm_prompt_psych || "",
    llm_model: settings.llm_model || "gemini-2.5-flash-lite",
    min_confidence: settings.min_confidence ?? 3,
    keywords_dev: (settings.keywords_dev || []).join(", "),
    keywords_psych: (settings.keywords_psych || []).join(", "),
    negative_keywords: (settings.negative_keywords || []).join(", "),
    notify_emails: (settings.notify_emails || []).join(", "),
    telegram_enabled: !!settings.telegram_enabled,
    email_enabled: !!settings.email_enabled,
    onlinejobs_dev_email: settings.onlinejobs_dev_email || "",
    onlinejobs_dev_password: settings.onlinejobs_dev_password || "",
    onlinejobs_psych_email: settings.onlinejobs_psych_email || "",
    onlinejobs_psych_password: settings.onlinejobs_psych_password || "",
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function save() {
    setSaving(true);
    setSaved(false);
    const r = await fetch("/api/settings", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        ...s,
        min_confidence: Math.max(0, Math.min(10, Number(s.min_confidence) || 0)),
        keywords_dev: s.keywords_dev.split(",").map((x: string) => x.trim()).filter(Boolean),
        keywords_psych: s.keywords_psych.split(",").map((x: string) => x.trim()).filter(Boolean),
        negative_keywords: s.negative_keywords.split(",").map((x: string) => x.trim()).filter(Boolean),
        notify_emails: s.notify_emails.split(",").map((x: string) => x.trim()).filter(Boolean),
      }),
    });
    setSaving(false);
    setSaved(r.ok);
    if (r.ok) setTimeout(() => setSaved(false), 3000);
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Clock className="h-5 w-5 text-accent" />
            <div>
              <CardTitle>Schedule</CardTitle>
              <CardDescription>Cron cadence. Workflow fires hourly + skips runs based on this.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <select
            className="h-9 w-full max-w-md rounded-md border border-input bg-background px-3 text-sm"
            value={s.cron_frequency}
            onChange={(e) => setS({ ...s, cron_frequency: e.target.value })}
          >
            {FREQ_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Sparkles className="h-5 w-5 text-accent" />
            <div>
              <CardTitle>LLM filter</CardTitle>
              <CardDescription>Gemini model + per-profile system prompts.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="max-w-md">
            <Label>Model</Label>
            <Input value={s.llm_model} onChange={(e) => setS({ ...s, llm_model: e.target.value })} className="mono" />
          </div>
          <div>
            <Label>Dev (Mack) prompt</Label>
            <Textarea
              rows={12}
              className="mono text-xs"
              value={s.llm_prompt_dev}
              onChange={(e) => setS({ ...s, llm_prompt_dev: e.target.value })}
            />
          </div>
          <div>
            <Label>Psych (Jenefer) prompt</Label>
            <Textarea
              rows={12}
              className="mono text-xs"
              value={s.llm_prompt_psych}
              onChange={(e) => setS({ ...s, llm_prompt_psych: e.target.value })}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Tag className="h-5 w-5 text-accent" />
            <div>
              <CardTitle>Keywords</CardTitle>
              <CardDescription>Route jobs to the right profile + skip LLM cost on unrelated posts.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Label>Dev keywords</Label>
            <Textarea rows={2} value={s.keywords_dev} onChange={(e) => setS({ ...s, keywords_dev: e.target.value })} />
          </div>
          <div>
            <Label>Psych keywords</Label>
            <Textarea rows={2} value={s.keywords_psych} onChange={(e) => setS({ ...s, keywords_psych: e.target.value })} />
          </div>
          <div>
            <Label>Negative keywords (auto-reject)</Label>
            <Textarea rows={2} value={s.negative_keywords} onChange={(e) => setS({ ...s, negative_keywords: e.target.value })} />
          </div>
          <div className="rounded-md border border-accent/30 bg-accent/5 p-3 space-y-2">
            <Label>LLM confidence gate (min score 0–10)</Label>
            <p className="text-xs text-muted-foreground">
              Jobs below this score skip the LLM (saves tokens). Title-keyword = +3, body-keyword = +1, stub description = −2, no company = −1.
              Default <span className="mono">3</span> = one title hit OR three body hits required.
            </p>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min={0}
                max={10}
                step={1}
                value={s.min_confidence}
                onChange={(e) => setS({ ...s, min_confidence: Number(e.target.value) })}
                className="flex-1 accent-accent"
              />
              <span className="mono w-8 text-right text-sm">{s.min_confidence}</span>
            </div>
            <p className="text-[11px] text-muted-foreground">
              <b>0</b> = call LLM on every keyword-matching job (most $) ·
              <b> 3</b> = balanced ·
              <b> 6+</b> = only very high-confidence matches (cheapest, may miss)
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <BellRing className="h-5 w-5 text-accent" />
            <div>
              <CardTitle>Notifications</CardTitle>
              <CardDescription>Where new matches are delivered.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-3">
            <Switch checked={s.email_enabled} onCheckedChange={(v: boolean) => setS({ ...s, email_enabled: v })} />
            <Label>Email enabled (Gmail SMTP)</Label>
          </div>
          <div className="flex items-center gap-3">
            <Switch checked={s.telegram_enabled} onCheckedChange={(v: boolean) => setS({ ...s, telegram_enabled: v })} />
            <Label>Telegram enabled</Label>
          </div>
          <div>
            <Label>Notify emails (fallback if profile email missing)</Label>
            <Input value={s.notify_emails} onChange={(e) => setS({ ...s, notify_emails: e.target.value })} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <KeyRound className="h-5 w-5 text-accent" />
            <div>
              <CardTitle>OnlineJobs.ph credentials</CardTitle>
              <CardDescription>Login required by the site. One account per profile.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <Label>Dev account email</Label>
            <Input value={s.onlinejobs_dev_email} onChange={(e) => setS({ ...s, onlinejobs_dev_email: e.target.value })} />
          </div>
          <div>
            <Label>Dev account password</Label>
            <Input type="password" value={s.onlinejobs_dev_password} onChange={(e) => setS({ ...s, onlinejobs_dev_password: e.target.value })} />
          </div>
          <div>
            <Label>Psych account email</Label>
            <Input value={s.onlinejobs_psych_email} onChange={(e) => setS({ ...s, onlinejobs_psych_email: e.target.value })} />
          </div>
          <div>
            <Label>Psych account password</Label>
            <Input type="password" value={s.onlinejobs_psych_password} onChange={(e) => setS({ ...s, onlinejobs_psych_password: e.target.value })} />
          </div>
        </CardContent>
      </Card>

      <div className="sticky bottom-4 z-10 flex justify-end">
        <div className="flex items-center gap-2 rounded-md border bg-card/95 backdrop-blur p-2 shadow-lg">
          {saved && (
            <span className="inline-flex items-center gap-1 text-xs text-emerald-400 mr-1">
              <CheckCircle2 className="h-3.5 w-3.5" /> Saved
            </span>
          )}
          <Button onClick={save} disabled={saving}>
            <Save className="mr-2 h-4 w-4" />
            {saving ? "Saving..." : "Save settings"}
          </Button>
        </div>
      </div>
    </div>
  );
}
