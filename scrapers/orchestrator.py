"""Main entrypoint. Runs all enabled sources or a single source.

Usage:
  python -m scrapers.orchestrator                 # all enabled
  python -m scrapers.orchestrator --source remotive
  python -m scrapers.orchestrator --source onlinejobs_ph
"""
from __future__ import annotations

import argparse
import logging
import os
import sys
from typing import Any

from . import db
from .keyword_filter import check_negative, suggest_profile
from .llm_filter import classify
from .notify import email_send, format_job_email, format_job_telegram, telegram_send
from .registry import build

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s: %(message)s",
)
log = logging.getLogger("orchestrator")


def _profile_secrets(settings: dict[str, Any]) -> dict[str, str]:
    """Pull OnlineJobs.ph creds from DB settings into env-style dict."""
    out: dict[str, str] = {}
    for slug in ("dev", "psych"):
        e = settings.get(f"onlinejobs_{slug}_email")
        p = settings.get(f"onlinejobs_{slug}_password")
        if e:
            out[f"OJ_{slug.upper()}_EMAIL"] = e
        if p:
            out[f"OJ_{slug.upper()}_PASSWORD"] = p
    return out


def process_source(
    c,
    source: dict[str, Any],
    settings: dict[str, Any],
    profiles_by_slug: dict[str, dict],
    profile_filter: str | None = None,
) -> dict[str, int]:
    slug = source["slug"]
    run_id = db.start_run(c, trigger=os.environ.get("RUN_TRIGGER", "cron"), source_slug=slug)
    seen = new = relevant = 0
    errors: list[str] = []
    log_lines: list[str] = []

    try:
        secrets = _profile_secrets(settings) if slug == "onlinejobs_ph" else {}
        scraper = build(slug, source.get("config") or {}, secrets=secrets)
        result = scraper.run()
        errors.extend(result.errors)
        seen = len(result.jobs)
        log_lines.append(f"fetched {seen} raw")

        # intra-source dedup (external_id)
        ids = [j.external_id for j in result.jobs]
        existing_ids = db.existing_external_ids(c, slug, ids)
        fresh_by_extid = [j for j in result.jobs if j.external_id not in existing_ids]
        log_lines.append(f"{len(fresh_by_extid)} new by external_id (filtered {len(existing_ids)} dupes)")

        # cross-source dedup (content_hash)
        records = [j.to_record() for j in fresh_by_extid]
        hashes = [r["content_hash"] for r in records]
        existing_hashes = db.existing_content_hashes(c, hashes)
        records = [r for r in records if r["content_hash"] not in existing_hashes]
        log_lines.append(f"{len(records)} new after cross-source dedup ({len(existing_hashes)} cross-source dupes)")

        # keyword pre-filter + profile suggestion + confidence scoring
        min_conf = int(settings.get("min_confidence", 3) or 3)
        skipped_low_conf = 0
        prepared: list[dict[str, Any]] = []
        for r in records:
            title = r.get("title", "") or ""
            desc = r.get("description", "") or ""
            company = r.get("company") or ""
            text_all = f"{title} {desc}"

            # Hard reject 1: negative keyword anywhere
            neg = check_negative(text_all, settings.get("negative_keywords", []) or [])
            if neg:
                r["matched_profile"] = None
                r["relevant"] = False
                r["ai_reason"] = f"negative keyword: {neg}"
                r["keywords_matched"] = []
                prepared.append(r)
                continue

            # Hard reject 2: empty body — common scraper-fallback row, useless to classify
            if len(desc.strip()) < 60 and not title:
                r["matched_profile"] = None
                r["relevant"] = False
                r["ai_reason"] = "stub: empty description"
                r["keywords_matched"] = []
                prepared.append(r)
                continue

            allowed_profiles = source.get("profile_slugs") or ["dev", "psych"]
            if profile_filter and profile_filter in ("dev", "psych"):
                allowed_profiles = [p for p in allowed_profiles if p == profile_filter]
            dev_kw = settings.get("keywords_dev", []) if "dev" in allowed_profiles else []
            psych_kw = settings.get("keywords_psych", []) if "psych" in allowed_profiles else []

            profile_slug, hits, confidence = suggest_profile(title, desc, company, dev_kw, psych_kw)
            r["keywords_matched"] = hits

            # Confidence gate: skip LLM if below threshold
            if not profile_slug or confidence < min_conf:
                r["matched_profile"] = None
                r["relevant"] = False
                r["ai_reason"] = (
                    f"low confidence ({confidence}/10, threshold {min_conf})"
                    if profile_slug
                    else "no keyword match"
                )
                skipped_low_conf += 1
                prepared.append(r)
                continue

            r["matched_profile"] = profile_slug
            r["ai_score"] = confidence * 10  # provisional, LLM overwrites
            r["relevant"] = False  # to be set by LLM
            prepared.append(r)

        log_lines.append(f"keyword-gate: {skipped_low_conf} skipped (low conf < {min_conf})")

        # bulk insert (so we have ids); only those with matched_profile are sent to LLM
        new = db.insert_jobs(c, prepared)
        log_lines.append(f"inserted {new} jobs into DB")

        # fetch back with ids for the ones to classify
        candidates = [r for r in prepared if r.get("matched_profile") and not r.get("ai_reason")]
        if candidates:
            # re-query to get DB-assigned ids
            chunks = [candidates[i : i + 100] for i in range(0, len(candidates), 100)]
            for chunk in chunks:
                ext_ids = [r["external_id"] for r in chunk]
                rows = (
                    c.table("jobs")
                    .select("id, external_id, title, company, location, salary, url, description, matched_profile, source_slug")
                    .eq("source_slug", slug)
                    .in_("external_id", ext_ids)
                    .execute()
                ).data or []
                for job in rows:
                    profile_slug = job.get("matched_profile")
                    if not profile_slug:
                        continue
                    profile = profiles_by_slug.get(profile_slug)
                    if not profile:
                        continue
                    prompt = settings[f"llm_prompt_{profile_slug}"]
                    verdict = classify(job, profile, prompt, settings.get("llm_model", "gemini-2.5-flash-lite"))
                    db.update_job(
                        c,
                        job["id"],
                        relevant=verdict["relevant"],
                        ai_score=verdict["score"],
                        ai_reason=verdict["reason"],
                    )
                    if verdict["relevant"]:
                        relevant += 1
                        # notify
                        merged = {**job, **verdict, "source_slug": slug}
                        notified_email = False
                        notified_tg = False
                        if settings.get("email_enabled"):
                            subj, html = format_job_email(merged, profile)
                            to = [profile.get("notify_email")] if profile.get("notify_email") else (settings.get("notify_emails") or [])
                            notified_email = email_send(to, subj, html)
                        if settings.get("telegram_enabled"):
                            notified_tg = telegram_send(format_job_telegram(merged, profile))
                        if notified_email or notified_tg:
                            db.update_job(c, job["id"], notified=True)

        status = "ok" if not errors else "partial"
    except Exception as e:  # noqa: BLE001
        log.exception("source %s top-level failed", slug)
        errors.append(f"{type(e).__name__}: {e}")
        status = "error"

    db.finish_run(
        c,
        run_id,
        status=status,
        jobs_seen=seen,
        jobs_new=new,
        jobs_relevant=relevant,
        errors=errors,
        log="\n".join(log_lines),
    )
    return {"seen": seen, "new": new, "relevant": relevant, "errors": len(errors)}


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--source", help="Run a single source slug (default: all enabled)")
    ap.add_argument("--profile", choices=["dev", "psych"], help="Restrict to one profile")
    args = ap.parse_args()

    c = db.client()
    settings = db.load_settings(c)
    if not settings:
        log.error("no settings row (id=1). Run migrations.")
        return 2
    profiles = {p["slug"]: p for p in db.load_profiles(c)}
    sources = db.load_enabled_sources(c)
    if args.source:
        sources = [s for s in sources if s["slug"] == args.source]
        if not sources:
            log.error("source %s not found or disabled", args.source)
            return 3

    summary: dict[str, dict[str, int]] = {}
    for source in sources:
        # source-level skip if profile filter excludes this source entirely
        ps = source.get("profile_slugs") or ["dev", "psych"]
        if args.profile and args.profile not in ps:
            log.info("skip %s — profile_slugs=%s does not include %s", source["slug"], ps, args.profile)
            continue
        log.info("=== source: %s (profile=%s) ===", source["slug"], args.profile or "both")
        summary[source["slug"]] = process_source(c, source, settings, profiles, profile_filter=args.profile)

    log.info("run summary: %s", summary)
    if settings.get("telegram_enabled"):
        lines = ["<b>JobHunter run complete</b>"]
        for slug, s in summary.items():
            lines.append(f"• {slug}: seen={s['seen']} new={s['new']} relevant={s['relevant']} err={s['errors']}")
        telegram_send("\n".join(lines))
    return 0


if __name__ == "__main__":
    sys.exit(main())
