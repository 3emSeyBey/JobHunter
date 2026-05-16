import { supabaseAdmin } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import SourceRow from "./SourceRow";

export const dynamic = "force-dynamic";

export default async function Sources() {
  const c = supabaseAdmin();
  const { data } = await c.from("sources").select("*").order("slug");
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Sources</h1>
        <p className="text-sm text-muted-foreground">Toggle which job boards the cron scrapes.</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Boards</CardTitle>
          <CardDescription>11 sources configured · disabled boards skipped at scrape time</CardDescription>
        </CardHeader>
        <CardContent className="divide-y divide-border">
          {(data || []).map((s: any) => (
            <SourceRow key={s.id} source={s} />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
