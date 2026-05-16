// Telegram bot webhook — supports /status, /jobs, /run commands.
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

const TG_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

async function tgReply(chatId: number, text: string) {
  if (!TG_TOKEN) return;
  await fetch(`https://api.telegram.org/bot${TG_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text: text.slice(0, 4000),
      parse_mode: "HTML",
      disable_web_page_preview: false,
    }),
  });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const msg = body.message;
  if (!msg?.text) return NextResponse.json({ ok: true });

  const text: string = msg.text.trim();
  const chatId: number = msg.chat.id;
  const c = supabaseAdmin();

  if (text.startsWith("/status")) {
    const { data: lastRun } = await c.from("runs").select("*").order("started_at", { ascending: false }).limit(1).single();
    const { data: counts } = await c.from("jobs").select("matched_profile, relevant");
    const dev = counts?.filter((j: any) => j.matched_profile === "dev" && j.relevant).length ?? 0;
    const psych = counts?.filter((j: any) => j.matched_profile === "psych" && j.relevant).length ?? 0;
    await tgReply(
      chatId,
      `<b>JobHunter status</b>
last run: ${lastRun?.source_slug || "ALL"} · <b>${lastRun?.status || "?"}</b>
at ${lastRun?.started_at}
relevant total — dev: ${dev}, psych: ${psych}`
    );
  } else if (text.startsWith("/jobs")) {
    const profile = text.includes("psych") ? "psych" : text.includes("dev") ? "dev" : null;
    let q = c.from("jobs").select("title, company, url, source_slug, ai_score, matched_profile").eq("relevant", true);
    if (profile) q = q.eq("matched_profile", profile);
    const { data } = await q.order("scraped_at", { ascending: false }).limit(5);
    const lines = (data || []).map((j: any) => `• [${j.matched_profile}] ${j.title} — ${j.company || j.source_slug} (${j.ai_score})\n${j.url}`);
    await tgReply(chatId, lines.join("\n\n") || "No relevant jobs yet.");
  } else if (text.startsWith("/run")) {
    await tgReply(chatId, "Manual trigger: open the web UI or push to main to dispatch a run.");
  } else if (text.startsWith("/start") || text.startsWith("/help")) {
    await tgReply(
      chatId,
      `<b>JobHunter bot</b>
/status — last run + counts
/jobs [dev|psych] — top 5 relevant jobs
/run — how to trigger a manual scan
Chat ID: <code>${chatId}</code> — set this as TELEGRAM_CHAT_ID`
    );
  }

  return NextResponse.json({ ok: true });
}
