import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { fmtDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function Dashboard({
  searchParams,
}: {
  searchParams: { profile?: string; source?: string };
}) {
  const c = supabaseAdmin();
  let q = c
    .from("jobs")
    .select("*")
    .eq("relevant", true)
    .order("scraped_at", { ascending: false })
    .limit(200);
  if (searchParams.profile) q = q.eq("matched_profile", searchParams.profile);
  if (searchParams.source) q = q.eq("source_slug", searchParams.source);

  const { data: jobs } = await q;

  const counts = await c
    .from("jobs")
    .select("matched_profile, relevant", { count: "exact", head: false });
  const total = counts.data?.length ?? 0;
  const devCount = counts.data?.filter((j) => j.matched_profile === "dev" && j.relevant).length ?? 0;
  const psychCount = counts.data?.filter((j) => j.matched_profile === "psych" && j.relevant).length ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Relevant jobs</h1>
        <form action="/api/run" method="POST">
          <Button type="submit">Run scrape now</Button>
        </form>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Card><CardHeader><CardTitle>Total scraped</CardTitle></CardHeader><CardContent className="text-3xl">{total}</CardContent></Card>
        <Card><CardHeader><CardTitle>Relevant — Dev (Mack)</CardTitle></CardHeader><CardContent className="text-3xl">{devCount}</CardContent></Card>
        <Card><CardHeader><CardTitle>Relevant — Psych (Jenefer)</CardTitle></CardHeader><CardContent className="text-3xl">{psychCount}</CardContent></Card>
      </div>

      <div className="flex flex-wrap gap-2 text-sm">
        <Link href="/" className="underline">All</Link>
        <Link href="/?profile=dev" className="underline">Dev only</Link>
        <Link href="/?profile=psych" className="underline">Psych only</Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {(jobs || []).map((j: any) => (
          <Card key={j.id}>
            <CardHeader>
              <div className="flex items-start justify-between gap-2">
                <CardTitle className="text-base">{j.title}</CardTitle>
                <div className="flex gap-1 shrink-0">
                  <Badge variant={j.matched_profile === "dev" ? "default" : "secondary"}>
                    {j.matched_profile}
                  </Badge>
                  <Badge variant="outline">{j.source_slug}</Badge>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                {j.company || "—"} · {j.location || "—"} · score {j.ai_score ?? "?"}/100 · {fmtDate(j.scraped_at)}
              </p>
            </CardHeader>
            <CardContent>
              <p className="text-sm">{j.ai_reason || "—"}</p>
              {j.salary ? <p className="mt-1 text-xs text-muted-foreground">Salary: {j.salary}</p> : null}
              <div className="mt-3 flex items-center gap-2">
                <a className="text-sm underline" href={j.url} target="_blank" rel="noreferrer">View post →</a>
                {j.keywords_matched?.length ? (
                  <span className="text-xs text-muted-foreground">{j.keywords_matched.slice(0, 4).join(", ")}</span>
                ) : null}
              </div>
            </CardContent>
          </Card>
        ))}
        {(!jobs || jobs.length === 0) && (
          <Card><CardContent className="py-8 text-center text-muted-foreground">No relevant jobs yet. Run a scrape.</CardContent></Card>
        )}
      </div>
    </div>
  );
}
