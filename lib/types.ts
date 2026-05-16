export type Profile = {
  id: string;
  slug: "dev" | "psych";
  name: string;
  email: string;
  notify_email: string;
  bio: string;
  skills: string[];
  experience: string;
  preferred_roles: string[];
  qualifications: string;
  created_at: string;
  updated_at: string;
};

export type Source = {
  id: string;
  slug: string;
  display_name: string;
  scraper: string;
  enabled: boolean;
  config: Record<string, unknown>;
  profile_slugs: string[];
  created_at: string;
};

export type Job = {
  id: string;
  source_slug: string;
  external_id: string;
  content_hash: string;
  url: string;
  title: string;
  company: string | null;
  location: string | null;
  salary: string | null;
  description: string;
  posted_at: string | null;
  scraped_at: string;
  matched_profile: "dev" | "psych" | null;
  relevant: boolean;
  ai_score: number | null;
  ai_reason: string | null;
  keywords_matched: string[];
  notified: boolean;
};

export type Run = {
  id: string;
  source_slug: string | null;
  trigger: "cron" | "manual" | "telegram";
  started_at: string;
  finished_at: string | null;
  status: "running" | "ok" | "error" | "partial";
  jobs_seen: number;
  jobs_new: number;
  jobs_relevant: number;
  errors: string[];
  log: string;
};

export type Settings = {
  id: string;
  cron_frequency: "twice_daily" | "hourly" | "every_6h" | "daily";
  llm_prompt_dev: string;
  llm_prompt_psych: string;
  llm_model: string;
  keywords_dev: string[];
  keywords_psych: string[];
  negative_keywords: string[];
  notify_emails: string[];
  telegram_enabled: boolean;
  email_enabled: boolean;
  onlinejobs_dev_email: string | null;
  onlinejobs_dev_password: string | null;
  onlinejobs_psych_email: string | null;
  onlinejobs_psych_password: string | null;
  updated_at: string;
};
