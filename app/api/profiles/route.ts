import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const { id, ...patch } = body;
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  const { error } = await supabaseAdmin().from("profiles").update(patch).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
