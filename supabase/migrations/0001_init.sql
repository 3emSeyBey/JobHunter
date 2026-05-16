-- JobHunter schema. Single-user app. RLS off (gated by ADMIN_PASSWORD in UI + service-role key in scrapers).

create extension if not exists pgcrypto;

-- profiles: dev (Mack) and psych (Jenefer)
create table if not exists profiles (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug in ('dev','psych')),
  name text not null,
  email text not null,
  notify_email text not null,
  bio text not null default '',
  skills text[] not null default '{}',
  experience text not null default '',
  preferred_roles text[] not null default '{}',
  qualifications text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- sources: one row per job board scraper
create table if not exists sources (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  display_name text not null,
  scraper text not null,                  -- python module name e.g. 'remotive'
  enabled boolean not null default true,
  config jsonb not null default '{}'::jsonb,
  profile_slugs text[] not null default '{dev,psych}',
  created_at timestamptz not null default now()
);

-- jobs: scraped + filtered job posts
create table if not exists jobs (
  id uuid primary key default gen_random_uuid(),
  source_slug text not null,
  external_id text not null,              -- board-specific id
  content_hash text not null,             -- sha256 of normalized (title+company+description) for cross-source dedup
  url text not null,
  title text not null,
  company text,
  location text,
  salary text,
  description text not null default '',
  posted_at timestamptz,
  scraped_at timestamptz not null default now(),
  matched_profile text check (matched_profile in ('dev','psych')),
  relevant boolean not null default false,
  ai_score numeric,
  ai_reason text,
  keywords_matched text[] not null default '{}',
  notified boolean not null default false
);

create unique index if not exists jobs_source_extid_uniq on jobs (source_slug, external_id);
create index if not exists jobs_content_hash_idx on jobs (content_hash);
create index if not exists jobs_relevant_idx on jobs (relevant, scraped_at desc);
create index if not exists jobs_matched_profile_idx on jobs (matched_profile);

-- runs: scraper execution log
create table if not exists runs (
  id uuid primary key default gen_random_uuid(),
  source_slug text,
  trigger text not null default 'cron' check (trigger in ('cron','manual','telegram')),
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  status text not null default 'running' check (status in ('running','ok','error','partial')),
  jobs_seen int not null default 0,
  jobs_new int not null default 0,
  jobs_relevant int not null default 0,
  errors text[] not null default '{}',
  log text not null default ''
);

create index if not exists runs_started_idx on runs (started_at desc);
create index if not exists runs_status_idx on runs (status);

-- settings: single-row config table
create table if not exists settings (
  id int primary key default 1 check (id = 1),
  cron_frequency text not null default 'twice_daily' check (cron_frequency in ('twice_daily','hourly','every_6h','daily')),
  llm_prompt_dev text not null,
  llm_prompt_psych text not null,
  llm_model text not null default 'gemini-2.5-flash-lite',
  keywords_dev text[] not null default '{}',
  keywords_psych text[] not null default '{}',
  negative_keywords text[] not null default '{}',
  notify_emails text[] not null default '{}',
  telegram_enabled boolean not null default true,
  email_enabled boolean not null default true,
  onlinejobs_dev_email text,
  onlinejobs_dev_password text,
  onlinejobs_psych_email text,
  onlinejobs_psych_password text,
  updated_at timestamptz not null default now()
);

create or replace function touch_updated_at() returns trigger as $$
begin new.updated_at = now(); return new; end; $$ language plpgsql;

drop trigger if exists profiles_touch on profiles;
create trigger profiles_touch before update on profiles
for each row execute function touch_updated_at();

drop trigger if exists settings_touch on settings;
create trigger settings_touch before update on settings
for each row execute function touch_updated_at();
