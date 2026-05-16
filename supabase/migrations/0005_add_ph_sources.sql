-- Add JobStreet PH, VirtualStaff.ph, HireTalent.ph as scrape sources.
-- All enabled by default. User can toggle off via UI if undesired.

insert into sources (slug, display_name, scraper, enabled, config, profile_slugs) values
  ('jobstreet',    'JobStreet PH (JSON API · robots-disallowed)', 'jobstreet',    true,
    '{"queries":["python developer","backend developer","virtual assistant","human resources","customer service","data entry","admin assistant"],"page_size":30,"pages":1}'::jsonb,
    array['dev','psych']),
  ('virtualstaff', 'VirtualStaff.ph (HTML · best-effort)',         'virtualstaff', true,
    '{"queries":["python","virtual assistant","human resources","customer service","data entry"]}'::jsonb,
    array['dev','psych']),
  ('hiretalent',   'HireTalent.ph (SEO landing · marketplace)',    'hiretalent',   true,
    '{"terms":["python","backend","developer","virtual-assistant","hr","customer-service","data-entry","research","ai"]}'::jsonb,
    array['dev','psych'])
on conflict (slug) do update set
  display_name = excluded.display_name,
  scraper = excluded.scraper,
  config = excluded.config,
  profile_slugs = excluded.profile_slugs;
