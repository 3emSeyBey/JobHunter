import { supabaseAdmin } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { fmtDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function Runs() {
  const c = supabaseAdmin();
  const { data } = await c.from("runs").select("*").order("started_at", { ascending: false }).limit(100);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight">Scrape runs</h1>
      <div className="grid grid-cols-1 gap-2">
        {(data || []).map((r: any) => (
          <Card key={r.id}>
            <CardHeader className="py-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">
                  {r.source_slug || "ALL"} · <span className="font-normal text-muted-foreground">{r.trigger}</span>
                </CardTitle>
                <Badge variant={r.status === "ok" ? "success" : r.status === "error" ? "destructive" : r.status === "partial" ? "warn" : "outline"}>
                  {r.status}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                {fmtDate(r.started_at)} → {fmtDate(r.finished_at)}
              </p>
            </CardHeader>
            <CardContent className="py-3 text-sm">
              <p>seen: {r.jobs_seen} · new: {r.jobs_new} · relevant: {r.jobs_relevant} · errors: {r.errors?.length || 0}</p>
              {r.log && <pre className="mt-2 whitespace-pre-wrap text-xs text-muted-foreground">{r.log}</pre>}
              {r.errors?.length ? (
                <pre className="mt-2 whitespace-pre-wrap text-xs text-destructive">{r.errors.join("\n")}</pre>
              ) : null}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
