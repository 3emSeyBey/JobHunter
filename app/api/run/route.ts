// Manually trigger a scrape via GitHub Actions workflow_dispatch.
// Requires GH_DISPATCH_TOKEN (PAT with `workflow` + `repo` scopes) + GH_REPO env vars.
// Optional: GH_REF (default branch fallback if unset).
import { NextRequest, NextResponse } from "next/server";

const GH = "https://api.github.com";

async function ghDefaultBranch(repo: string, token: string): Promise<string> {
  const r = await fetch(`${GH}/repos/${repo}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
    cache: "no-store",
  });
  if (!r.ok) throw new Error(`repo lookup ${r.status}: ${await r.text()}`);
  const j = await r.json();
  return j.default_branch || "main";
}

export async function POST(req: NextRequest) {
  const token = process.env.GH_DISPATCH_TOKEN?.trim();
  // strip whitespace + trailing/leading slashes (common pasted-URL mistake)
  const repo = process.env.GH_REPO?.trim().replace(/^\/+|\/+$/g, "");
  if (!token || !repo) {
    return NextResponse.json(
      { error: "GH_DISPATCH_TOKEN and GH_REPO env vars required" },
      { status: 500 }
    );
  }
  if (!/^[^/\s]+\/[^/\s]+$/.test(repo)) {
    return NextResponse.json(
      { error: `GH_REPO must be 'owner/name' (got '${repo}')` },
      { status: 400 }
    );
  }
  let ref = process.env.GH_REF?.trim();
  try {
    if (!ref) ref = await ghDefaultBranch(repo, token);
  } catch (e: any) {
    return NextResponse.json(
      {
        error: `cannot resolve repo ${repo}: ${e.message}. Check GH_REPO (case-sensitive owner/name) and that GH_DISPATCH_TOKEN has repo scope.`,
      },
      { status: 500 }
    );
  }

  // Profile param: "both" (default) | "dev" | "psych"
  const url = new URL(req.url);
  const profileParam = (url.searchParams.get("profile") || "both").toLowerCase();
  const profile = ["both", "dev", "psych"].includes(profileParam) ? profileParam : "both";

  const ghUrl = `${GH}/repos/${repo}/actions/workflows/scrape.yml/dispatches`;
  const r = await fetch(ghUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
    body: JSON.stringify({ ref, inputs: { trigger: "manual", profile } }),
  });
  if (!r.ok) {
    const text = await r.text();
    return NextResponse.json(
      {
        error: `GH dispatch failed (${r.status}) on ${repo}@${ref}: ${text}. Common causes: workflow file not yet on the branch, GH_REPO case mismatch, PAT missing 'workflow' scope, or PAT lacks access to this repo.`,
      },
      { status: r.status }
    );
  }
  return NextResponse.redirect(new URL("/runs", req.url));
}
