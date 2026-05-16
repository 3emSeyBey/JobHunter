import { supabaseAdmin } from "@/lib/supabase";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { fmtDate } from "@/lib/utils";
import { CheckCircle2, XCircle, AlertTriangle, Loader2 } from "lucide-react";

export const dynamic = "force-dynamic";

function statusIcon(status: string) {
  if (status === "ok") return <CheckCircle2 className="h-4 w-4 text-emerald-400" />;
  if (status === "error") return <XCircle className="h-4 w-4 text-destructive" />;
  if (status === "partial") return <AlertTriangle className="h-4 w-4 text-amber-400" />;
  return <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />;
}

function statusBadge(status: string) {
  return (
    <Badge
      variant={status === "ok" ? "success" : status === "error" ? "destructive" : status === "partial" ? "warn" : "outline"}
    >
      {status}
    </Badge>
  );
}

function duration(start: string, end: string | null) {
  if (!end) return "—";
  const ms = new Date(end).getTime() - new Date(start).getTime();
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

export default async function Runs() {
  const c = supabaseAdmin();
  const { data } = await c.from("runs").select("*").order("started_at", { ascending: false }).limit(100);
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Runs</h1>
        <p className="text-sm text-muted-foreground">Execution history. Errors are traceable per source.</p>
      </div>
      <div className="grid grid-cols-1 gap-2">
        {(data || []).map((r: any) => (
          <Card key={r.id}>
            <CardHeader className="py-3">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2">
                  {statusIcon(r.status)}
                  <span className="font-medium mono">{r.source_slug || "ALL"}</span>
                  <span className="text-xs text-muted-foreground">· {r.trigger}</span>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <span className="mono text-muted-foreground">{fmtDate(r.started_at)}</span>
                  <span className="mono text-muted-foreground">{duration(r.started_at, r.finished_at)}</span>
                  {statusBadge(r.status)}
                </div>
              </div>
            </CardHeader>
            <CardContent className="py-3 text-sm space-y-1">
              <p className="mono text-xs">
                seen <b>{r.jobs_seen}</b> · new <b>{r.jobs_new}</b> · relevant <b className="text-accent">{r.jobs_relevant}</b> · errors <b>{r.errors?.length || 0}</b>
              </p>
              {r.log && <pre className="whitespace-pre-wrap text-xs text-muted-foreground mono">{r.log}</pre>}
              {r.errors?.length ? (
                <pre className="whitespace-pre-wrap text-xs text-destructive mono">{r.errors.join("\n")}</pre>
              ) : null}
            </CardContent>
          </Card>
        ))}
        {(!data || data.length === 0) && (
          <Card><CardContent className="py-12 text-center text-muted-foreground text-sm">No runs yet.</CardContent></Card>
        )}
      </div>
    </div>
  );
}
