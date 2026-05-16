// Manually trigger a scrape via GitHub Actions workflow_dispatch.
// Requires GH_DISPATCH_TOKEN (PAT with workflow scope) + GH_REPO env vars.
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const token = process.env.GH_DISPATCH_TOKEN;
  const repo = process.env.GH_REPO;
  if (!token || !repo) {
    return NextResponse.json(
      { error: "GH_DISPATCH_TOKEN and GH_REPO env vars required" },
      { status: 500 }
    );
  }
  const url = `https://api.github.com/repos/${repo}/actions/workflows/scrape.yml/dispatches`;
  const r = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
    body: JSON.stringify({ ref: "main", inputs: { trigger: "manual" } }),
  });
  if (!r.ok) {
    const text = await r.text();
    return NextResponse.json({ error: text }, { status: r.status });
  }
  return NextResponse.redirect(new URL("/runs", req.url));
}
