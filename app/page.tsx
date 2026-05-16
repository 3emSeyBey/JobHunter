import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabase";
import StatCard from "@/components/StatCard";
import RunButton from "@/components/RunButton";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fmtDate } from "@/lib/utils";
import { Briefcase, CircleCheck, Code2, UserSquare2, ExternalLink, Tag } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function Dashboard({
  searchParams,
}: {
  searchParams: { profile?: string; source?: string; view?: string };
}) {
  const c = supabaseAdmin();
  const view = searchParams.view === "rejected" ? "rejected" : "relevant";

  let q = c
    .from("jobs")
    .select("*")
    .order("scraped_at", { ascending: false })
    .limit(200);
  if (view === "relevant") q = q.eq("relevant", true);
  else q = q.eq("relevant", false).not("matched_profile", "is", null);
  if (searchParams.profile) q = q.eq("matched_profile", searchParams.profile);
  if (searchParams.source) q = q.eq("source_slug", searchParams.source);

  const { data: jobs } = await q;

  // Use head:true to get accurate counts without 1000-row default cap.
  const [totalRes, relevantRes, devRes, psychRes] = await Promise.all([
    c.from("jobs").select("*", { count: "exact", head: true }),
    c.from("jobs").select("*", { count: "exact", head: true }).eq("relevant", true),
    c.from("jobs").select("*", { count: "exact", head: true }).eq("relevant", true).eq("matched_profile", "dev"),
    c.from("jobs").select("*", { count: "exact", head: true }).eq("relevant", true).eq("matched_profile", "psych"),
  ]);
  const total = totalRes.count ?? 0;
  const relevantTotal = relevantRes.count ?? 0;
  const devCount = devRes.count ?? 0;
  const psychCount = psychRes.count ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Relevant job posts surfaced by the AI filter.</p>
        </div>
        <RunButton />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard icon={Briefcase} label="Scraped" value={total} hint="all-time" />
        <StatCard icon={CircleCheck} label="Relevant" value={relevantTotal} hint="passed AI filter" tone="accent" />
        <StatCard icon={Code2} label="Dev — Mack" value={devCount} tone="accent" />
        <StatCard icon={UserSquare2} label="Psych — Jenefer" value={psychCount} tone="accent" />
      </div>

      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="text-muted-foreground mr-1">profile:</span>
        <FilterPill href={`/?view=${view}`} active={!searchParams.profile} label="All" />
        <FilterPill href={`/?view=${view}&profile=dev`} active={searchParams.profile === "dev"} label="Dev" />
        <FilterPill href={`/?view=${view}&profile=psych`} active={searchParams.profile === "psych"} label="Psych" />
        <span className="ml-3 text-muted-foreground mr-1">view:</span>
        <FilterPill href={`/?view=relevant${searchParams.profile ? `&profile=${searchParams.profile}` : ""}`} active={view === "relevant"} label="Relevant" />
        <FilterPill href={`/?view=rejected${searchParams.profile ? `&profile=${searchParams.profile}` : ""}`} active={view === "rejected"} label="Rejected (debug)" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {(jobs || []).map((j: any) => (
          <JobCard key={j.id} job={j} />
        ))}
        {(!jobs || jobs.length === 0) && (
          <Card className="lg:col-span-2">
            <CardContent className="py-12 text-center text-muted-foreground">
              <Briefcase className="mx-auto h-8 w-8 opacity-30" />
              <p className="mt-3 text-sm">No relevant jobs yet. Trigger a scrape from the button above.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

function FilterPill({ href, active, label }: { href: string; active: boolean; label: string }) {
  return (
    <Link
      href={href}
      className={`rounded-full border px-3 py-1 transition-colors ${
        active ? "bg-accent text-accent-foreground border-accent" : "hover:bg-secondary"
      }`}
    >
      {label}
    </Link>
  );
}

function JobCard({ job }: { job: any }) {
  const score = job.ai_score ?? 0;
  const scoreColor =
    score >= 80 ? "text-emerald-400" : score >= 60 ? "text-amber-400" : "text-muted-foreground";
  return (
    <Card className="transition-colors hover:border-accent/40">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base leading-snug">{job.title}</CardTitle>
          <div className="flex gap-1 shrink-0">
            <Badge variant={job.matched_profile === "dev" ? "default" : "secondary"}>
              {job.matched_profile}
            </Badge>
            <Badge variant="outline" className="mono">{job.source_slug}</Badge>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          {job.company || "—"} · {job.location || "—"} · <span className="mono">{fmtDate(job.scraped_at)}</span>
        </p>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-center gap-3 text-xs">
          <span className={`mono font-semibold ${scoreColor}`}>{score}/100</span>
          {job.salary && <span className="text-muted-foreground">· {job.salary}</span>}
        </div>
        <p className="mt-2 text-sm">{job.ai_reason || "—"}</p>
        {job.keywords_matched?.length ? (
          <div className="mt-2 flex flex-wrap gap-1">
            {job.keywords_matched.slice(0, 5).map((k: string) => (
              <span key={k} className="inline-flex items-center gap-1 rounded-md bg-secondary px-2 py-0.5 text-[11px] text-muted-foreground">
                <Tag className="h-3 w-3" />
                {k}
              </span>
            ))}
          </div>
        ) : null}
        <div className="mt-3">
          <a
            className="inline-flex items-center gap-1 text-sm text-accent hover:underline"
            href={job.url}
            target="_blank"
            rel="noreferrer"
          >
            View posting <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
      </CardContent>
    </Card>
  );
}
