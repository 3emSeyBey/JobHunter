import { supabaseAdmin } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ProfileForm from "./ProfileForm";

export const dynamic = "force-dynamic";

export default async function Profiles() {
  const c = supabaseAdmin();
  const { data } = await c.from("profiles").select("*").order("slug");
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight">Profiles</h1>
      <p className="text-sm text-muted-foreground">Profile context is passed to the LLM with every job, so it can decide fit.</p>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {(data || []).map((p: any) => (
          <Card key={p.id}>
            <CardHeader>
              <CardTitle>{p.slug.toUpperCase()} — {p.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <ProfileForm profile={p} />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
