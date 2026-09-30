-- VOUCHT — post-migration checklist. Read-only: it changes nothing.
--
-- Run AFTER supabase/schema.sql and THEN
-- supabase/migrations/0001_harden_rls_and_trust_score.sql, each in its own
-- Supabase SQL editor run. Every query below has its expected result in a
-- comment; a mismatch means a step aborted and rolled back.

-- 1. Objects. Expect tables_found=8, views_found=2, rls_on_base_tables=8.
SELECT
  (SELECT count(*) FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name IN ('profiles','projects','milestones','deliveries',
                         'contracts','activity_log','subscriptions','profile_views')
  ) AS tables_found,
  (SELECT count(*) FROM information_schema.views
    WHERE table_schema = 'public'
      AND table_name IN ('public_profiles','public_deliveries')
  ) AS views_found,
  (SELECT count(*) FROM pg_class c
     JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relkind = 'r' AND c.relrowsecurity
  ) AS rls_on_base_tables;

-- 2. Policies per table. Every base table needs at least one; a table with
--    zero policies and RLS on blocks all traffic, including your own dashboard.
SELECT tablename, count(*) AS policies
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;

-- 3. Functions. Expect all nine, in this order.
SELECT p.proname
FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.proname IN ('recalculate_trust_score','mask_client_name',
                    'derive_delivery_timing','enforce_profile_column_rules',
                    'get_verification_request','record_verification',
                    'trust_score_on_activity_change','voucht_internal_write',
                    'handle_new_user')
ORDER BY p.proname;

-- 4. Triggers. Expect on_auth_user_created, derive_delivery_timing,
--    enforce_profile_column_rules, trust_score_on_projects,
--    trust_score_on_milestones, trust_score_on_deliveries.
SELECT tgname, relname
FROM pg_trigger t
  JOIN pg_class c ON c.oid = t.tgrelid
  JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND NOT t.tgisinternal
ORDER BY relname, tgname;

-- 5. trust_score must have NO default. column_default has to be NULL: a missing
--    score means "no verified work history", not 0 out of 100 and not a
--    placeholder number.
SELECT column_name, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'profiles'
  AND column_name = 'trust_score';

-- 6. Public surface. Expected, in order: true, false, true, true, false.
--    Anonymous visitors may read the projections and open a verification link,
--    never the raw profiles table or the internal write guard.
SELECT
  has_table_privilege('anon', 'public.public_profiles', 'select')          AS anon_reads_public_profiles,
  has_table_privilege('anon', 'public.profiles', 'select')                 AS anon_reads_raw_profiles,
  has_function_privilege('anon', 'public.get_verification_request(uuid)', 'execute')
                                                                            AS anon_can_open_verification,
  has_function_privilege('anon', 'public.record_verification(uuid,text,text)', 'execute')
                                                                            AS anon_can_record_verification,
  has_function_privilege('anon', 'public.voucht_internal_write()', 'execute')
                                                                            AS anon_can_internal_write;

-- 7. Empty-database sanity: zero rows is correct on a fresh project, and no
--    profile may carry a score before any verified delivery exists.
SELECT
  (SELECT count(*) FROM public.profiles)        AS profiles,
  (SELECT count(*) FROM public.deliveries)      AS deliveries,
  (SELECT count(*) FROM public.profiles WHERE trust_score IS NOT NULL) AS profiles_with_a_score;
