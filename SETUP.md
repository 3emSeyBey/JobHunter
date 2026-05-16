# Quick setup checklist

## Free accounts to create

- [ ] Supabase (https://supabase.com) — free Postgres
- [ ] Vercel (https://vercel.com) — free Next.js hosting
- [ ] Google AI Studio (https://aistudio.google.com/apikey) — free Gemini API key
- [ ] GitHub — for the repo + Actions cron (**make it public** for unlimited minutes)
- [ ] Telegram BotFather (search `@BotFather` in Telegram) — free bot
- [ ] Gmail App Password (https://myaccount.google.com/apppasswords) — needs 2FA enabled

## OnlineJobs.ph

- [ ] Register **jobseeker** account for Mack (dev) — verify email
- [ ] Register **jobseeker** account for Jenefer (psych) — verify email
- [ ] Enter both credential sets at `/settings` once UI is deployed

## Env vars

### Vercel (UI)
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
GH_DISPATCH_TOKEN=         # GitHub PAT with workflow scope, for /api/run
GH_REPO=                   # e.g. mackbacarisas/jobhunter
TELEGRAM_BOT_TOKEN=        # for webhook handler
```

### GitHub repo secrets (scrapers)
```
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
GEMINI_API_KEY=
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=
GMAIL_USER=
GMAIL_APP_PASSWORD=
```

## DB bootstrap

In Supabase SQL editor:
1. Paste + run `supabase/migrations/0001_init.sql`
2. Paste + run `supabase/migrations/0002_seed.sql`

This creates tables + seeds defaults (both profiles, all 11 sources enabled, twice-daily cron, both notify emails, Gemini Flash Lite prompts for dev + psych).

## First run

```
# from GitHub repo:
Actions tab → "scrape" workflow → "Run workflow" → trigger=manual
```

Or from the deployed Vercel UI dashboard → click "Run scrape now" button (requires `GH_DISPATCH_TOKEN` env).

## Telegram webhook (optional)

After deploying to Vercel:
```
curl -X POST "https://api.telegram.org/bot<TOKEN>/setWebhook" \
  -d "url=https://<your-vercel-app>.vercel.app/api/telegram/webhook"
```

Then DM your bot `/start` to get the chat id, add as `TELEGRAM_CHAT_ID` secret.
