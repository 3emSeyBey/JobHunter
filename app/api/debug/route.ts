import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET() {
  const env = {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL?.slice(0, 32) + "...",
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY
      ? `present (len=${process.env.SUPABASE_SERVICE_ROLE_KEY.length})`
      : "MISSING",
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "present" : "MISSING",
  };

  const c = supabaseAdmin();

  const probes: Record<string, unknown> = { env };

  for (const table of ["runs", "jobs", "sources", "profiles", "settings"]) {
    try {
      const head = await c.from(table).select("*", { count: "exact", head: true });
      probes[`${table}_count`] = head.count ?? null;
      probes[`${table}_error`] = head.error?.message ?? null;
    } catch (e: any) {
      probes[`${table}_threw`] = e?.message;
    }
  }

  try {
    const r = await c.from("runs").select("*").order("started_at", { ascending: false }).limit(5);
    probes.runs_sample = r.data;
    probes.runs_sample_error = r.error?.message ?? null;
  } catch (e: any) {
    probes.runs_sample_threw = e?.message;
  }

  return NextResponse.json(probes, { status: 200 });
}
