"""OnlineJobs.ph — requires employer/jobseeker login. Uses Playwright. Runs on a separate GH Actions workflow."""
from __future__ import annotations

import asyncio
import logging
import os
import re
from typing import AsyncIterator

from .base import BaseScraper, RawJob

log = logging.getLogger(__name__)


class OnlineJobsPHScraper(BaseScraper):
    """One scrape pass = one logged-in session per profile credential set."""

    slug = "onlinejobs_ph"

    def fetch(self):
        return list(self._run_async())

    def _run_async(self):
        try:
            return asyncio.run(self._fetch_async())
        except Exception:
            log.exception("onlinejobs_ph async failure")
            return []

    async def _fetch_async(self):
        from playwright.async_api import async_playwright

        credentials = self._credentials()
        if not credentials:
            log.warning("onlinejobs_ph: no credentials configured")
            return []

        queries = self.config.get("queries", ["python"])
        out: list[RawJob] = []
        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=True)
            for profile_slug, email, password in credentials:
                ctx = await browser.new_context(user_agent="Mozilla/5.0 JobHunter/0.1")
                page = await ctx.new_page()
                try:
                    await page.goto("https://www.onlinejobs.ph/jobseekers/login", wait_until="domcontentloaded")
                    await page.fill("input[name='username']", email)
                    await page.fill("input[name='password']", password)
                    await page.click("button[type='submit']")
                    await page.wait_for_load_state("networkidle", timeout=30000)
                except Exception as e:  # noqa: BLE001
                    log.warning("login failed for %s: %s", profile_slug, e)
                    await ctx.close()
                    continue

                for q in queries:
                    try:
                        await page.goto(
                            f"https://www.onlinejobs.ph/jobseekers/jobsearch?jobkeyword={q.replace(' ', '+')}",
                            wait_until="domcontentloaded",
                        )
                        await page.wait_for_selector("a[href*='/jobseekers/job/']", timeout=15000)
                    except Exception:
                        continue
                    anchors = await page.eval_on_selector_all(
                        "a[href*='/jobseekers/job/']",
                        "els => els.map(e => ({href: e.href, text: e.textContent || ''}))",
                    )
                    seen_urls: set[str] = set()
                    for a in anchors[:40]:
                        href = a["href"]
                        if href in seen_urls:
                            continue
                        seen_urls.add(href)
                        ext_id = href.rsplit("/", 1)[-1] or href
                        title = re.sub(r"\s+", " ", a["text"]).strip()[:200] or "(OnlineJobs.ph)"
                        out.append(
                            RawJob(
                                source_slug=self.slug,
                                external_id=ext_id,
                                url=href,
                                title=title,
                                company=None,
                                location="PH (remote)",
                                salary=None,
                                description="",
                                posted_at=None,
                            )
                        )
                await ctx.close()
            await browser.close()
        return out

    def _credentials(self) -> list[tuple[str, str, str]]:
        out: list[tuple[str, str, str]] = []
        for slug in ("dev", "psych"):
            email_key = f"OJ_{slug.upper()}_EMAIL"
            pw_key = f"OJ_{slug.upper()}_PASSWORD"
            email = self.secrets.get(email_key) or os.getenv(email_key)
            pw = self.secrets.get(pw_key) or os.getenv(pw_key)
            if email and pw:
                out.append((slug, email, pw))
        return out
