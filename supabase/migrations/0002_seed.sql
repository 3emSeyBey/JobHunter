-- Seed defaults

insert into profiles (slug, name, email, notify_email, bio, skills, experience, preferred_roles, qualifications)
values
  ('dev', 'Mack Cloyd Bacarisas', 'mackcloydbacarisas@gmail.com', 'mackcloydbacarisas@gmail.com',
   '10x Python developer, AI-augmented, freelance startup background. PH-based. Looking for part-time remote dev work.',
   array['python','fastapi','django','flask','postgres','typescript','nextjs','react','ai integration','langchain','openai api','automation','scraping','rest api','graphql','docker'],
   'Senior-level. Multiple freelance projects with startups doing fast-paced development. Heavy AI-tooling for productivity multiplier.',
   array['python developer','backend engineer','full stack engineer','ai engineer','automation engineer','part-time developer','contract developer'],
   'Self-taught + practitioner. Strong portfolio of shipped startup work. AI-native engineer.'),
  ('psych', 'Jenefer Candado', 'jenefercandado@gmail.com', 'jenefercandado@gmail.com',
   'Psychology diploma graduate (non-licensed). OJT experience as psychometrician and HR. Currently Sam''s Club customer service / credit specialist. Looking for part-time remote office/HR/admin/CSR/research-assistant work.',
   array['customer service','credit specialist','psychometrician ojt','hr ojt','assessment','test administration','data entry','administrative','english communication','microsoft office','google workspace'],
   'Currently customer service representative at Sam''s Club (credit specialist). Prior OJT in psychometrician and HR roles. Beginner-friendly office and admin work.',
   array['virtual assistant','customer service rep','hr assistant','recruiting assistant','research assistant','data entry','administrative assistant','content moderator','survey researcher','item writer assistant','ai trainer'],
   'Psychology diploma graduate. Not licensed (cannot do clinical testing). OJT-level experience.')
on conflict (slug) do nothing;

insert into sources (slug, display_name, scraper, enabled, config, profile_slugs) values
  ('remotive',       'Remotive (JSON API)',              'remotive',       true, '{}'::jsonb,                                                                                  array['dev','psych']),
  ('remoteok',       'RemoteOK (JSON API)',              'remoteok',       true, '{}'::jsonb,                                                                                  array['dev','psych']),
  ('himalayas',      'Himalayas (JSON API)',             'himalayas',      true, '{}'::jsonb,                                                                                  array['dev','psych']),
  ('wwr',            'We Work Remotely (RSS)',           'wwr',            true, '{}'::jsonb,                                                                                  array['dev','psych']),
  ('hn',             'HN Who Is Hiring (Algolia)',       'hn',             true, '{}'::jsonb,                                                                                  array['dev']),
  ('greenhouse',     'Greenhouse ATS (curated)',         'greenhouse',     true, '{"slugs":["khanacademy","duolingo","scale","ramp","notion","stripe","brex","plaid"]}'::jsonb, array['dev','psych']),
  ('lever',          'Lever ATS (curated)',              'lever',          true, '{"slugs":["loom","circle","retool","supabase"]}'::jsonb,                                       array['dev','psych']),
  ('ashby',          'Ashby ATS (curated)',              'ashby',          true, '{"slugs":["mercor","vercel","linear","posthog"]}'::jsonb,                                      array['dev','psych']),
  ('kalibrr',        'Kalibrr PH (HTML)',                'kalibrr',        true, '{"queries":["python","backend","virtual assistant","hr","customer service","data entry"]}'::jsonb, array['dev','psych']),
  ('glints',         'Glints PH (sitemap)',              'glints',         true, '{"country":"ph"}'::jsonb,                                                                       array['dev','psych']),
  ('onlinejobs_ph',  'OnlineJobs.ph (Playwright login)', 'onlinejobs_ph',  true, '{"queries":["python","virtual assistant","hr","data entry","research"]}'::jsonb,               array['dev','psych'])
on conflict (slug) do nothing;

insert into settings (id, cron_frequency, llm_prompt_dev, llm_prompt_psych, llm_model,
                      keywords_dev, keywords_psych, negative_keywords, notify_emails)
values (
  1,
  'twice_daily',
  $$You are evaluating a remote job post for a senior Python developer (Mack) who is AI-augmented and PH-based.

PROFILE:
- Senior Python (FastAPI/Django/Flask), TypeScript/Next.js, Postgres, AI integrations (LangChain, OpenAI/Gemini APIs), automation, scraping.
- Wants PART-TIME or CONTRACT remote work. Open to full-time only if compensation is high and async-friendly.
- PH-based (UTC+8). Needs Wise/Payoneer/PayPal/Crypto-friendly payout. NOT eligible for US-onsite/US-only roles.

EVALUATE the job post and reply with strict JSON:
{
  "relevant": true|false,
  "score": 0-100,
  "reason": "<one sentence>",
  "red_flags": ["<flag>", ...]
}

MARK NOT RELEVANT if:
- Requires US/EU work authorization
- Requires on-site / hybrid
- Junior-only (under 2 years)
- Non-tech (sales, marketing, design — unless engineering-adjacent)
- Scam signals (vague description, no company, weekly pay <$5/hr in USD-equivalent for senior work)

MARK RELEVANT if:
- Python/backend/full-stack/AI engineering remote-friendly contract or part-time
- Senior or mid-senior level
- Async-friendly or PH-timezone overlap acceptable
- Clear company + role + pay range

Return JSON ONLY.$$,
  $$You are evaluating a remote job post for a PH-based psychology diploma graduate (Jenefer) with OJT background in psychometrician and HR, currently doing customer service (credit specialist at Sam's Club).

PROFILE:
- Non-licensed (CANNOT take roles requiring clinical psych license)
- OJT-level experience in HR and psychometrician work
- Strong CSR / credit specialist experience (current job)
- Skills: English communication, data entry, MS Office, Google Workspace, assessment administration, basic HR
- Wants PART-TIME remote. PH-based (UTC+8). Wise/Payoneer/PayPal/GCash payout.

EVALUATE the job post and reply with strict JSON:
{
  "relevant": true|false,
  "score": 0-100,
  "reason": "<one sentence>",
  "red_flags": ["<flag>", ...]
}

MARK NOT RELEVANT if:
- Requires licensed psychologist / clinical license
- Requires US work authorization
- Requires advanced degree (MA/PhD)
- Heavy technical coding (Python, SQL deep) — that is the partner's lane
- Scam signals (no company, vague, MLM, "earn $5000/week from home")

MARK RELEVANT if:
- VA, HR assistant, recruiting coordinator, CSR, credit/collections, data entry, research assistant
- Survey / item writer / AI trainer / content moderator
- Beginner-friendly office/admin remote work
- Async or PH-timezone overlap, part-time hours
- Clear company + role + payout method PH-compatible

Return JSON ONLY.$$,
  'gemini-2.5-flash-lite',
  array['python','fastapi','django','flask','backend','full stack','ai engineer','automation','scraping','part-time','contract','remote','async'],
  array['virtual assistant','va','customer service','csr','credit','collections','data entry','hr assistant','recruiting','research assistant','admin','psychometrician','item writer','ai trainer','annotator','content moderator'],
  array['must be us citizen','us only','onsite','on-site','w-2','green card','clearance required','equity only','unpaid'],
  array['mackcloydbacarisas@gmail.com','jenefercandado@gmail.com']
) on conflict (id) do nothing;
