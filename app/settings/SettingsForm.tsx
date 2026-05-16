"use client";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";

const FREQ_OPTIONS = [
  { value: "twice_daily", label: "Twice daily (default)" },
  { value: "daily", label: "Daily" },
  { value: "every_6h", label: "Every 6 hours" },
  { value: "hourly", label: "Hourly" },
];

export default function SettingsForm({ settings }: { settings: any }) {
  const [s, setS] = useState({
    cron_frequency: settings.cron_frequency || "twice_daily",
    llm_prompt_dev: settings.llm_prompt_dev || "",
    llm_prompt_psych: settings.llm_prompt_psych || "",
    llm_model: settings.llm_model || "gemini-2.5-flash-lite",
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
        keywords_dev: s.keywords_dev.split(",").map((x) => x.trim()).filter(Boolean),
        keywords_psych: s.keywords_psych.split(",").map((x) => x.trim()).filter(Boolean),
        negative_keywords: s.negative_keywords.split(",").map((x) => x.trim()).filter(Boolean),
        notify_emails: s.notify_emails.split(",").map((x) => x.trim()).filter(Boolean),
      }),
    });
    setSaving(false);
    setSaved(r.ok);
  }

  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <h3 className="font-semibold">Cron frequency</h3>
        <select
          className="h-9 rounded-md border border-input bg-transparent px-3 text-sm"
          value={s.cron_frequency}
          onChange={(e) => setS({ ...s, cron_frequency: e.target.value })}
        >
          {FREQ_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <p className="text-xs text-muted-foreground">
          GitHub Actions cron actually runs every hour and skips runs based on this setting. Twice daily = 00:00 + 12:00 UTC.
        </p>
      </section>

      <section className="space-y-3">
        <h3 className="font-semibold">LLM</h3>
        <div>
          <Label>Model</Label>
          <Input value={s.llm_model} onChange={(e) => setS({ ...s, llm_model: e.target.value })} />
        </div>
        <div>
          <Label>Dev (Mack) prompt</Label>
          <Textarea
            rows={10}
            value={s.llm_prompt_dev}
            onChange={(e) => setS({ ...s, llm_prompt_dev: e.target.value })}
          />
        </div>
        <div>
          <Label>Psych (Jenefer) prompt</Label>
          <Textarea
            rows={10}
            value={s.llm_prompt_psych}
            onChange={(e) => setS({ ...s, llm_prompt_psych: e.target.value })}
          />
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="font-semibold">Keywords</h3>
        <p className="text-xs text-muted-foreground">Used to route jobs to the right profile + skip LLM cost on unrelated posts.</p>
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
      </section>

      <section className="space-y-3">
        <h3 className="font-semibold">Notifications</h3>
        <div className="flex items-center gap-3">
          <Switch checked={s.email_enabled} onCheckedChange={(v) => setS({ ...s, email_enabled: v })} />
          <Label>Email enabled</Label>
        </div>
        <div className="flex items-center gap-3">
          <Switch checked={s.telegram_enabled} onCheckedChange={(v) => setS({ ...s, telegram_enabled: v })} />
          <Label>Telegram enabled</Label>
        </div>
        <div>
          <Label>Notify emails (comma-separated — fallback if profile.notify_email missing)</Label>
          <Input value={s.notify_emails} onChange={(e) => setS({ ...s, notify_emails: e.target.value })} />
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="font-semibold">OnlineJobs.ph credentials</h3>
        <p className="text-xs text-muted-foreground">Two logins (one per profile) — login is required by the site.</p>
        <div className="grid grid-cols-2 gap-2">
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
        </div>
      </section>

      <div className="flex items-center gap-2 pt-2">
        <Button onClick={save} disabled={saving}>{saving ? "Saving..." : "Save settings"}</Button>
        {saved && <span className="text-xs text-green-600">Saved</span>}
      </div>
    </div>
  );
}
