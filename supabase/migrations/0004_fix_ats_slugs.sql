-- Cleanup: remove ATS slugs that 404 in 2026 + fix Glints (sitemap was 403'd).
-- Idempotent; safe to re-run.

update sources
set config = jsonb_build_object(
  'slugs', jsonb_build_array(
    'khanacademy','duolingo','stripe','brex','airbnb','shopify',
    'wikimediafoundation','airtable','benchling','discord'
  )
)
where slug = 'greenhouse';

update sources
set config = jsonb_build_object(
  'slugs', jsonb_build_array(
    'palantir','figma','netflix','spotify'
  )
)
where slug = 'lever';

update sources
set config = jsonb_build_object(
  'slugs', jsonb_build_array(
    'mercor','vercel','linear','posthog','ramp','plaid','notion','scaleai'
  )
)
where slug = 'ashby';

-- Glints sitemap is blocked. Disable until we wire up a different entry.
update sources set enabled = false where slug = 'glints';
