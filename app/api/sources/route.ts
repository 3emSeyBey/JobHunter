import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const { id, enabled, config, profile_slugs } = body;
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const patch: Record<string, unknown> = {};
  if (typeof enabled === "boolean") patch.enabled = enabled;
  if (config !== undefined) patch.config = config;
  if (Array.isArray(profile_slugs)) patch.profile_slugs = profile_slugs;

  const { error } = await supabaseAdmin().from("sources").update(patch).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
