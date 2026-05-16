import { supabaseAdmin } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import SettingsForm from "./SettingsForm";

export const dynamic = "force-dynamic";

export default async function Settings() {
  const c = supabaseAdmin();
  const { data } = await c.from("settings").select("*").eq("id", 1).single();
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
      <Card>
        <CardHeader><CardTitle>Global config</CardTitle></CardHeader>
        <CardContent><SettingsForm settings={data || {}} /></CardContent>
      </Card>
    </div>
  );
}
