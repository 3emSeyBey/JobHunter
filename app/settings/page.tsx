import { supabaseAdmin } from "@/lib/supabase";
import SettingsForm from "./SettingsForm";

export const dynamic = "force-dynamic";

export default async function Settings() {
  const c = supabaseAdmin();
  const { data } = await c.from("settings").select("*").eq("id", 1).single();
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">Configure prompts, keywords, notifications, credentials, and cron cadence.</p>
      </div>
      <SettingsForm settings={data || {}} />
    </div>
  );
}
