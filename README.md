# JobHunter

AI-powered PH job scraper for Mack (Python dev) + Jenefer (psych / HR / CSR).
Twice-daily scrape across 11 boards, dedup, keyword pre-filter, Gemini Flash Lite relevance check per profile, email + Telegram notifications.

**$0 infra. Only paid component: Gemini API.**

## Architecture

```
┌──────────────────────────────────────────────────────────────┐
│  GH Actions cron  ──►  Python scrapers  ──►  Supabase (PG)  │
│                                  │                           │
│                                  ▼                           │
│                       keyword + LLM filter                   │
│                                  │                           │
│                                  ▼                           │
│                       Gmail SMTP + Telegram                  │
│                                                              │
│  Vercel (Next.js UI)  ◄──  Supabase  (config + dashboard)   │
│       │                                                      │
│       └──►  manual run via GH workflow_dispatch              │
└──────────────────────────────────────────────────────────────┘
```

| Layer       | Tech                          | Cost    |
|-------------|-------------------------------|---------|
| UI          | Next.js 14 on Vercel free     | $0      |
| DB + auth   | Supabase free (Postgres 500MB)| $0      |
| Scrapers    | Python on GH Actions          | $0 (public repo = unlimited mins) |
| Scheduling  | GH Actions cron               | $0      |
| LLM         | Gemini 2.5 Flash Lite         | **only paid** |
| Notify      | Gmail SMTP + Telegram Bot     | $0      |

## Sources

| Source             | Method                        | Profiles    | Notes |
|--------------------|-------------------------------|-------------|-------|
| Remotive           | JSON API                      | dev + psych | free, attribution requested |
| RemoteOK           | JSON API                      | dev + psych | requires non-default User-Agent |
| Himalayas          | JSON API (+ MCP available)    | dev + psych | 24h cache |
| We Work Remotely   | RSS                           | dev + psych | attribution required |
| HN Who Is Hiring   | Algolia API                   | dev         | monthly thread, remote-only filter |
| Greenhouse ATS     | Public board API (per slug)   | dev + psych | curated company list in `sources.config.slugs` |
| Lever ATS          | Public board API (per slug)   | dev + psych | curated |
| Ashby ATS          | Public board API (per slug)   | dev + psych | curated (includes Mercor) |
| Kalibrr            | Next.js `__NEXT_DATA__` parse | dev + psych | PH-native |
| Glints             | Sitemap walk                  | dev + psych | PH-native (sitemap is robots-permitted path) |
| OnlineJobs.ph      | Playwright login              | dev + psych | login required, 2 profiles |

### Hard-excluded (PH not eligible)
DataAnnotation · Prolific · UserInterviews · BELAY · Liveops · ETS/Pearson US-remote

## Workflow

1. **GH Actions** cron fires every hour (`scrape.yml`)
2. **Frequency gate** in the workflow checks `settings.cron_frequency` and skips if not the right hour
3. Per enabled source: `scrapers/orchestrator.py --source <slug>`
4. **Dedup intra-source** (`source_slug + external_id` unique)
5. **Dedup cross-source** (`content_hash = sha256(normalized title+company+description)`)
6. **Negative keyword** rejection (auto-fail)
7. **Positive keyword** match → assigns `matched_profile` (dev or psych based on which keyword set hits more)
8. **Gemini Flash Lite** classifies relevance with per-profile system prompt + profile metadata + job content → JSON `{relevant, score, reason, red_flags}`
9. If `relevant`: send Gmail + Telegram to the profile's `notify_email`
10. Write run log to `runs` table

## Setup

### 1. Supabase

- Create a project at supabase.com (free tier)
- SQL Editor → run `supabase/migrations/0001_init.sql` then `0002_seed.sql`
- Copy: project URL, anon key, service role key

### 2. Gmail SMTP

- Enable 2FA on the Gmail account
- Create an App Password (https://myaccount.google.com/apppasswords)
- Use that 16-char password as `GMAIL_APP_PASSWORD`

### 3. Telegram bot

- BotFather → `/newbot` → grab token
- Message your new bot → curl `https://api.telegram.org/bot<TOKEN>/getUpdates` to get your chat id
- (Optional) Set webhook to `https://<your-vercel-app>/api/telegram/webhook` for `/status`, `/jobs`, `/run` commands

### 4. Gemini API key

- https://aistudio.google.com/apikey → free dev key
- Default model: `gemini-2.5-flash-lite` (cheap)

### 5. GitHub

- Push this repo as **public** (unlimited Actions minutes — required for hourly cron without burning the 2000-min private budget)
- Settings → Secrets → Actions, add:
  - `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
  - `GEMINI_API_KEY`
  - `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`
  - `GMAIL_USER`, `GMAIL_APP_PASSWORD`

### 6. Vercel (UI)

- Import repo to Vercel
- Add env vars:
  - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
  - `GH_DISPATCH_TOKEN` (GitHub PAT with `workflow` scope), `GH_REPO` (e.g. `mackbacarisas/jobhunter`)
  - `TELEGRAM_BOT_TOKEN`
- Deploy

### 7. First run

- Visit the deployed UI → `/settings` → enter OnlineJobs.ph credentials for both profiles
- `/profiles` → review/edit Mack + Jenefer profile info
- `/sources` → confirm all sources are enabled (default)
- Dashboard → "Run scrape now" button dispatches the GH workflow

## Local dev

```bash
# UI
cp .env.example .env.local  # fill in keys
npm install
npm run dev   # http://localhost:3000

# Scrapers
cd scrapers
pip install -r requirements.txt
SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... GEMINI_API_KEY=... \
  python -m scrapers.orchestrator --source remotive
```

## Telegram commands

- `/status` — last run + counts
- `/jobs` or `/jobs dev` or `/jobs psych` — top 5 relevant jobs
- `/start` — get your chat id (one-time setup)

## File layout

```
app/                  Next.js App Router (UI + API routes)
  page.tsx            dashboard
  runs/               run history
  sources/            source toggles
  profiles/           profile editor (dev + psych)
  settings/           prompts, keywords, emails, OnlineJobs creds
  api/                CRUD + manual-run + telegram webhook
components/ui/        shadcn-style primitives
lib/                  supabase client + types
scrapers/             Python — one module per source + orchestrator
  base.py             BaseScraper ABC + content_hash
  registry.py         slug → class
  orchestrator.py     main entrypoint
  keyword_filter.py   pre-LLM cheap filter
  llm_filter.py       Gemini call
  notify.py           email + telegram
  db.py               Supabase helpers
supabase/migrations/  schema + seed
.github/workflows/    scrape.yml, scrape-onlinejobs.yml, keepalive.yml
```

## Maintenance

- **Add a new source**: write `scrapers/foo.py` with a `FooScraper(BaseScraper)`, register in `scrapers/registry.py`, insert a row in `sources` table.
- **Tune prompts**: `/settings` UI live-edits `settings.llm_prompt_dev` / `settings.llm_prompt_psych`.
- **Add curated companies (ATS)**: `/sources` → edit `config.slugs` for greenhouse/lever/ashby rows (currently via direct DB update — UI editor TODO).
- **Lower LLM cost**: tighten keyword filters so fewer posts reach the LLM (it only runs on keyword-matched jobs).
