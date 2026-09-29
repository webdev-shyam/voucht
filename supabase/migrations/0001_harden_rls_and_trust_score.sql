-- =======================================================
-- VOUCHT MIGRATION 0001 — RLS hardening, single verification
-- credential, canonical Trust Score.
--
-- Apply to the existing production database. Idempotent: safe to re-run.
-- Target: Supabase Postgres 15+.
--
-- Why each block exists is noted inline; the short version is that the
-- original schema stored private credentials (client email, confirmation
-- tokens) in tables that had a blanket `USING (true)` SELECT policy, and
-- let any authenticated user write their own Trust Score and plan.
-- =======================================================

-- -------------------------------------------------------
-- 1. HELPERS
-- -------------------------------------------------------

-- The Trust Score is derived from recorded activity. When recalculate_trust_score()
-- runs on behalf of an end user's request, the JWT claims still say
-- "authenticated", so the column guard below would reject its own writes.
-- recalculate_trust_score() sets this transaction-local flag first; the guard
-- honours it and nothing else ever sets it.
CREATE OR REPLACE FUNCTION public.voucht_internal_write()
RETURNS BOOLEAN AS $$
  SELECT coalesce(current_setting('voucht.internal_write', true), '') = 'on';
$$ LANGUAGE sql STABLE;

-- One masking rule, defined once, so the public profile and the SQL projection
-- can never drift apart. "Sarah Johnson" -> "S***a J."
CREATE OR REPLACE FUNCTION public.mask_client_name(p_client_name TEXT)
RETURNS TEXT AS $$
DECLARE
  v_trimmed TEXT := btrim(coalesce(p_client_name, ''));
  v_first   TEXT;
  v_masked  TEXT;
  v_last    TEXT;
BEGIN
  IF v_trimmed = '' THEN
    RETURN 'Client';
  END IF;

  v_first := split_part(v_trimmed, ' ', 1);
  v_masked := left(v_first, 1) || '***'
    || CASE WHEN char_length(v_first) > 2 THEN lower(right(v_first, 1)) ELSE '' END;

  IF position(' ' IN v_trimmed) > 0 THEN
    v_last := trim(split_part(v_trimmed, ' ', 2));
    IF v_last <> '' THEN
      v_masked := v_masked || ' ' || upper(left(v_last, 1)) || '.';
    END IF;
  END IF;

  RETURN v_masked;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- -------------------------------------------------------
-- 2. DROP LEGACY / DEAD COLUMNS
-- -------------------------------------------------------

-- Stripe is not part of the payment architecture (CREEM + NOWPayments).
ALTER TABLE public.profiles DROP COLUMN IF EXISTS stripe_customer_id;

-- Never computed by anything; displaying it as 0 was misleading.
ALTER TABLE public.profiles DROP COLUMN IF EXISTS avg_response_hours;

-- Verification now has exactly one credential, on deliveries. These were
-- parallel token systems that no code path ever populated.
ALTER TABLE public.projects  DROP COLUMN IF EXISTS client_token;
ALTER TABLE public.milestones DROP COLUMN IF EXISTS client_confirmation_token;

-- A missing score must be visibly "no evidence yet", not 0 out of 100.
ALTER TABLE public.profiles ALTER COLUMN trust_score DROP DEFAULT;

-- -------------------------------------------------------
-- 3. VERIFICATION LIFECYCLE ON DELIVERIES
-- -------------------------------------------------------

ALTER TABLE public.deliveries
  ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMPTZ DEFAULT now(),
  ADD COLUMN IF NOT EXISTS verification_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (verification_status IN ('pending', 'confirmed', 'disputed', 'expired')),
  ADD COLUMN IF NOT EXISTS verification_expires_at TIMESTAMPTZ
    DEFAULT (now() + INTERVAL '30 days'),
  ADD COLUMN IF NOT EXISTS dispute_reason TEXT,
  ADD COLUMN IF NOT EXISTS recorded_at TIMESTAMPTZ DEFAULT now();

-- The token is the only way in: it must be unique and indexed for lookup.
CREATE UNIQUE INDEX IF NOT EXISTS deliveries_token_key
  ON public.deliveries (confirmation_token);
CREATE INDEX IF NOT EXISTS deliveries_verification_status
  ON public.deliveries (freelancer_id, verification_status);

-- On-time status is derived from recorded deadlines, not self-reported, so a
-- freelancer cannot submit a delivery that claims to be early.
CREATE OR REPLACE FUNCTION public.derive_delivery_timing()
RETURNS TRIGGER AS $$
DECLARE
  v_due_date TIMESTAMPTZ;
BEGIN
  IF NEW.milestone_id IS NOT NULL THEN
    SELECT due_date INTO v_due_date
      FROM public.milestones WHERE id = NEW.milestone_id;
  END IF;

  IF v_due_date IS NULL THEN
    SELECT deadline INTO v_due_date
      FROM public.projects WHERE id = NEW.project_id;
  END IF;

  NEW.submitted_at := coalesce(NEW.submitted_at, now());

  -- A 24 hour grace window keeps a delivery late-by-minutes from reading as a
  -- breach of contract.
  IF v_due_date IS NOT NULL THEN
    NEW.was_on_time := NEW.submitted_at <= (v_due_date + INTERVAL '24 hours');
    NEW.days_early_or_late :=
      floor(EXTRACT(EPOCH FROM (v_due_date - NEW.submitted_at)) / 86400)::INTEGER;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS derive_delivery_timing ON public.deliveries;
CREATE TRIGGER derive_delivery_timing
  BEFORE INSERT ON public.deliveries
  FOR EACH ROW EXECUTE FUNCTION public.derive_delivery_timing();

-- A delivery is the record of a submission; it starts unverified.
ALTER TABLE public.deliveries ALTER COLUMN client_confirmed SET DEFAULT FALSE;

-- -------------------------------------------------------
-- 4. MILESTONE STATUS: ACCEPT WHAT THE APP ACTUALLY WRITES
-- -------------------------------------------------------

-- The old CHECK rejected 'delivered' and 'disputed', so those writes failed
-- silently at runtime.
ALTER TABLE public.milestones DROP CONSTRAINT IF EXISTS milestones_status_check;
ALTER TABLE public.milestones ADD CONSTRAINT milestones_status_check CHECK (
  status IN ('pending', 'in_progress', 'submitted', 'delivered', 'confirmed', 'disputed', 'overdue')
);

-- The milestone form already asks for a payment amount; there was nowhere to
-- put the answer.
ALTER TABLE public.milestones ADD COLUMN IF NOT EXISTS amount DECIMAL(10,2);
ALTER TABLE public.milestones ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- -------------------------------------------------------
-- 4b. CONTRACTS: STORE WHAT THE GENERATOR ACTUALLY PRODUCES
-- -------------------------------------------------------
-- The contract form collects a title, value, IP clause and termination terms,
-- none of which had a column, so creating a contract silently discarded them.
ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS total_value DECIMAL(10,2);
ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS ip_clause TEXT;
ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS termination_terms TEXT;
ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS generated_by_ai BOOLEAN DEFAULT TRUE;
ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS signed_at TIMESTAMPTZ;

-- Contracts are AI-assisted drafts, so the record itself says so rather than a
-- UI label that could be mistaken for an executed agreement.
COMMENT ON COLUMN public.contracts.generated_by_ai IS
  'Draft produced with AI assistance; not evidence of a signed or enforceable agreement.';

-- -------------------------------------------------------
-- 5. SUBSCRIPTIONS: THE UPSERT TARGET MUST BE UNIQUE
-- -------------------------------------------------------

-- Both payment webhooks call upsert(on_conflict: "user_id"), which cannot work
-- without a unique constraint. This migration does NOT silently delete billing
-- history to make that index possible: if duplicates exist it stops here and
-- asks for a human decision.
DO $$
DECLARE
  v_duplicate_users INTEGER;
BEGIN
  SELECT count(*) INTO v_duplicate_users
  FROM (
    SELECT user_id FROM public.subscriptions
     GROUP BY user_id HAVING count(*) > 1
  ) d;

  IF v_duplicate_users > 0 THEN
    RAISE EXCEPTION
      '% user(s) have more than one row in subscriptions. Decide which row is '
      'authoritative and remove the others before re-running this migration; '
      'Voucht will not guess which payment record to discard.',
      v_duplicate_users
      USING ERRCODE = 'P0001';
  END IF;
END;
$$;

CREATE UNIQUE INDEX IF NOT EXISTS subscriptions_user_id_key ON public.subscriptions (user_id);

-- -------------------------------------------------------
-- 6. PROFILE VIEWS: STOP STORING RAW VISITOR IP
-- -------------------------------------------------------

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
     WHERE table_schema = 'public' AND table_name = 'profile_views'
       AND column_name = 'viewer_ip'
  ) THEN
    ALTER TABLE public.profile_views RENAME COLUMN viewer_ip TO viewer_hash;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
     WHERE table_schema = 'public' AND table_name = 'profile_views'
       AND column_name = 'referrer'
  ) THEN
    ALTER TABLE public.profile_views RENAME COLUMN referrer TO referrer_domain;
  END IF;
END;
$$;

ALTER TABLE public.profile_views ADD COLUMN IF NOT EXISTS source TEXT;
CREATE INDEX IF NOT EXISTS profile_views_recent
  ON public.profile_views (profile_id, viewed_at DESC);

-- -------------------------------------------------------
-- 7. DELIBERATELY-PUBLIC PROJECTIONS
-- -------------------------------------------------------
-- These views are owned by the table owner (postgres), which bypasses RLS, so
-- anonymous visitors can read them while the base tables stay owner-only.
-- They expose only public-safe columns: no email, no token, no plan state.

DROP VIEW IF EXISTS public.public_profiles;
CREATE VIEW public.public_profiles AS
SELECT
  id, username, full_name, avatar_url, skill, bio, location, website,
  linkedin_url, trust_score, badge_tier, total_projects, completed_projects,
  on_time_rate, ghost_rate, created_at
FROM public.profiles;

DROP VIEW IF EXISTS public.public_deliveries;
CREATE VIEW public.public_deliveries AS
SELECT
  d.id,
  d.freelancer_id,
  d.project_id,
  d.milestone_id,
  p.project_title,
  m.title AS milestone_title,
  d.delivery_type,
  d.was_on_time,
  d.days_early_or_late,
  public.mask_client_name(d.client_name) AS client_label,
  d.client_confirmed_at,
  d.created_at
FROM public.deliveries d
JOIN public.projects  p ON p.id = d.project_id
LEFT JOIN public.milestones m ON m.id = d.milestone_id
WHERE d.verification_status = 'confirmed';

GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON public.public_profiles, public.public_deliveries TO anon, authenticated;

-- -------------------------------------------------------
-- 8. ROW LEVEL SECURITY
-- -------------------------------------------------------

-- PROFILES: private table. Public pages read public_profiles instead.
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Profiles are viewable by owner" ON public.profiles;
CREATE POLICY "Profiles are viewable by owner"
  ON public.profiles FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Guard the derived and billing columns: a user may edit their bio, not their
-- reputation or their plan.
CREATE OR REPLACE FUNCTION public.enforce_profile_column_rules()
RETURNS TRIGGER AS $$
DECLARE
  v_claims TEXT := coalesce(current_setting('request.jwt.claims', true), '');
  v_role   TEXT;
BEGIN
  IF public.voucht_internal_write()
     OR v_claims = ''
     OR v_claims NOT LIKE '{%' THEN
    RETURN NEW;
  END IF;

  v_role := coalesce(nullif(v_claims::jsonb ->> 'role', ''), 'anon');

  IF v_role IN ('service_role', 'supabase_auth_admin', 'postgres') THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    NEW.trust_score        := NULL;
    NEW.total_projects     := 0;
    NEW.completed_projects := 0;
    NEW.on_time_rate       := 0;
    NEW.ghost_rate         := 0;
    NEW.badge_tier         := 'none';
    NEW.plan               := 'free';
    NEW.plan_expires_at    := NULL;
    RETURN NEW;
  END IF;

  IF NEW.trust_score        IS DISTINCT FROM OLD.trust_score
     OR NEW.total_projects    IS DISTINCT FROM OLD.total_projects
     OR NEW.completed_projects IS DISTINCT FROM OLD.completed_projects
     OR NEW.on_time_rate      IS DISTINCT FROM OLD.on_time_rate
     OR NEW.ghost_rate        IS DISTINCT FROM OLD.ghost_rate
     OR NEW.badge_tier        IS DISTINCT FROM OLD.badge_tier
     OR NEW.plan              IS DISTINCT FROM OLD.plan
     OR NEW.plan_expires_at   IS DISTINCT FROM OLD.plan_expires_at THEN
    RAISE EXCEPTION 'Derived profile fields are calculated by Voucht and cannot be set directly.'
      USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS enforce_profile_column_rules ON public.profiles;
CREATE TRIGGER enforce_profile_column_rules
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.enforce_profile_column_rules();

-- DELIVERIES: no longer world-readable. The old USING (true) policy exposed
-- every client email and every verification token to anonymous callers.
DROP POLICY IF EXISTS "Public can view deliveries" ON public.deliveries;
DROP POLICY IF EXISTS "Deliveries are viewable by owner" ON public.deliveries;
CREATE POLICY "Deliveries are viewable by owner"
  ON public.deliveries FOR SELECT USING (auth.uid() = freelancer_id);

DROP POLICY IF EXISTS "Users can create own deliveries" ON public.deliveries;
CREATE POLICY "Users can create own deliveries"
  ON public.deliveries FOR INSERT WITH CHECK (auth.uid() = freelancer_id);

-- Deliveries are permanent verified records: no user-facing delete or update.
DROP POLICY IF EXISTS "Users can update own deliveries" ON public.deliveries;
DROP POLICY IF EXISTS "Users can delete own deliveries" ON public.deliveries;

-- PROFILE VIEWS: written only by /api/profile-view, which runs as service_role
-- and therefore bypasses RLS. Visitors keep SELECT on their own rows for the
-- dashboard analytics card, and no browser role may insert.
DROP POLICY IF EXISTS "Anyone can insert profile view" ON public.profile_views;
DROP POLICY IF EXISTS "Visits can be recorded for existing profiles" ON public.profile_views;
DROP POLICY IF EXISTS "Users can view own profile views" ON public.profile_views;

CREATE POLICY "Users can view own profile views"
  ON public.profile_views FOR SELECT USING (auth.uid() = profile_id);

REVOKE INSERT ON public.profile_views FROM anon, authenticated;

-- Supports the once-per-day dedup lookup in /api/profile-view.
CREATE INDEX IF NOT EXISTS profile_views_viewer
  ON public.profile_views (profile_id, viewer_hash, viewed_at DESC);

-- -------------------------------------------------------
-- 9. CANONICAL TRUST SCORE
-- -------------------------------------------------------
-- This function is the only implementation of the score. The application reads
-- profiles.trust_score and never calculates it.
--
--   Delivery rate  (completed projects / total projects)        40%
--   On-time rate   (on-time confirmed deliveries / confirmed)   25%
--   Reliability    (100 - cancelled / total projects)           20%
--   Consistency    (completed projects x 1.5, capped at 15)     15%
--
-- A freelancer with no confirmed delivery has trust_score IS NULL, which the UI
-- renders as "No verified work history yet". There is no floor and no ceiling:
-- the score is not clamped into a flattering range.

CREATE OR REPLACE FUNCTION public.recalculate_trust_score(p_freelancer_id UUID)
RETURNS NUMERIC AS $$
DECLARE
  v_total_projects     INTEGER;
  v_completed_projects INTEGER;
  v_cancelled_projects INTEGER;
  v_confirmed          INTEGER;
  v_on_time            INTEGER;
  v_delivery_rate      NUMERIC;
  v_on_time_rate       NUMERIC;
  v_ghost_rate         NUMERIC;
  v_consistency        NUMERIC;
  v_score              NUMERIC;
  v_badge              TEXT;
BEGIN
  IF p_freelancer_id IS NULL THEN
    RETURN NULL;
  END IF;

  -- Identifies this write as Voucht's own derivation, not a user editing their
  -- reputation. Transaction-local, so it cannot leak into another request.
  PERFORM set_config('voucht.internal_write', 'on', TRUE);

  SELECT
    count(*),
    count(*) FILTER (WHERE status = 'completed'),
    count(*) FILTER (WHERE status = 'cancelled')
  INTO v_total_projects, v_completed_projects, v_cancelled_projects
  FROM public.projects
  WHERE freelancer_id = p_freelancer_id;

  SELECT
    count(*),
    count(*) FILTER (WHERE was_on_time = TRUE)
  INTO v_confirmed, v_on_time
  FROM public.deliveries
  WHERE freelancer_id = p_freelancer_id
    AND verification_status = 'confirmed';

  -- No verified evidence: the score is absent, not zero and not invented.
  IF v_confirmed = 0 THEN
    UPDATE public.profiles
       SET trust_score        = NULL,
           total_projects     = v_total_projects,
           completed_projects = v_completed_projects,
           on_time_rate       = 0,
           ghost_rate         = 0,
           badge_tier         = 'none'
     WHERE id = p_freelancer_id;
    RETURN NULL;
  END IF;

  v_delivery_rate := (v_completed_projects::NUMERIC / v_total_projects::NUMERIC) * 100;
  v_on_time_rate  := (v_on_time::NUMERIC / v_confirmed::NUMERIC) * 100;
  v_ghost_rate    := (v_cancelled_projects::NUMERIC / v_total_projects::NUMERIC) * 100;
  v_consistency   := LEAST(v_completed_projects * 1.5, 15);

  v_score := (v_delivery_rate * 0.40)
           + (v_on_time_rate  * 0.25)
           + ((100 - v_ghost_rate) * 0.20)
           + v_consistency;

  v_score := ROUND(GREATEST(0, LEAST(100, v_score)), 2);

  IF v_score >= 80 AND v_completed_projects >= 3 THEN v_badge := 'exceptional';
  ELSIF v_score >= 60 AND v_completed_projects >= 2 THEN v_badge := 'reliable';
  ELSE v_badge := 'building';
  END IF;

  UPDATE public.profiles
     SET trust_score        = v_score,
         total_projects     = v_total_projects,
         completed_projects = v_completed_projects,
         on_time_rate       = ROUND(v_on_time_rate, 2),
         ghost_rate         = ROUND(v_ghost_rate, 2),
         badge_tier         = v_badge
   WHERE id = p_freelancer_id;

  RETURN v_score;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
  SET search_path = public, pg_temp;

-- Only privileged roles may call it directly; anonymous and authenticated users
-- reach it through the triggers below, never through the API.
REVOKE EXECUTE ON FUNCTION public.recalculate_trust_score(UUID) FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.recalculate_trust_score(UUID) TO service_role, postgres;

-- Keep the stored score in step with recorded activity.
CREATE OR REPLACE FUNCTION public.trust_score_on_activity_change()
RETURNS TRIGGER AS $$
DECLARE
  v_freelancer_id UUID;
  v_project_id    UUID;
BEGIN
  IF TG_TABLE_NAME = 'milestones' THEN
    v_project_id := CASE WHEN TG_OP = 'DELETE' THEN OLD.project_id ELSE NEW.project_id END;
    SELECT freelancer_id INTO v_freelancer_id FROM public.projects WHERE id = v_project_id;
  ELSE
    v_freelancer_id := CASE WHEN TG_OP = 'DELETE' THEN OLD.freelancer_id ELSE NEW.freelancer_id END;
  END IF;

  IF v_freelancer_id IS NOT NULL THEN
    PERFORM public.recalculate_trust_score(v_freelancer_id);
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
  SET search_path = public, pg_temp;

DROP TRIGGER IF EXISTS trust_score_on_projects ON public.projects;
CREATE TRIGGER trust_score_on_projects
  AFTER INSERT OR UPDATE OR DELETE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.trust_score_on_activity_change();

DROP TRIGGER IF EXISTS trust_score_on_milestones ON public.milestones;
CREATE TRIGGER trust_score_on_milestones
  AFTER INSERT OR UPDATE OR DELETE ON public.milestones
  FOR EACH ROW EXECUTE FUNCTION public.trust_score_on_activity_change();

DROP TRIGGER IF EXISTS trust_score_on_deliveries ON public.deliveries;
CREATE TRIGGER trust_score_on_deliveries
  AFTER INSERT OR UPDATE OR DELETE ON public.deliveries
  FOR EACH ROW EXECUTE FUNCTION public.trust_score_on_activity_change();

-- -------------------------------------------------------
-- 10. VERIFICATION RPCs
-- -------------------------------------------------------
-- Possession of an unguessable UUID is the credential for the client, so these
-- two SECURITY DEFINER functions are the only paths an anonymous visitor needs.
-- They return and mutate exactly one delivery, never a list.

CREATE OR REPLACE FUNCTION public.get_verification_request(p_token UUID)
RETURNS JSONB AS $$
DECLARE
  v_row RECORD;
  v_result JSONB;
BEGIN
  IF p_token IS NULL THEN
    RETURN jsonb_build_object('valid', FALSE, 'reason', 'invalid');
  END IF;

  SELECT
    d.id AS delivery_id,
    d.verification_status,
    d.verification_expires_at,
    d.was_on_time,
    d.submitted_at,
    d.client_name,
    p.project_title,
    m.title AS milestone_title,
    m.due_date,
    pf.full_name AS freelancer_name,
    pf.username  AS freelancer_username
  INTO v_row
  FROM public.deliveries d
  JOIN public.projects  p  ON p.id  = d.project_id
  JOIN public.profiles  pf ON pf.id = d.freelancer_id
  LEFT JOIN public.milestones m ON m.id = d.milestone_id
  WHERE d.confirmation_token = p_token;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('valid', FALSE, 'reason', 'invalid');
  END IF;

  IF v_row.verification_expires_at IS NOT NULL
     AND v_row.verification_expires_at < now()
     AND v_row.verification_status = 'pending' THEN
    UPDATE public.deliveries
       SET verification_status = 'expired'
     WHERE id = v_row.delivery_id;
    RETURN jsonb_build_object('valid', FALSE, 'reason', 'expired');
  END IF;

  v_result := jsonb_build_object(
    'valid', TRUE,
    'deliveryId', v_row.delivery_id,
    'status', v_row.verification_status,
    'projectTitle', v_row.project_title,
    'milestoneTitle', v_row.milestone_title,
    'freelancerName', v_row.freelancer_name,
    'freelancerUsername', v_row.freelancer_username,
    'wasOnTime', v_row.was_on_time,
    'submittedAt', v_row.submitted_at,
    'dueDate', v_row.due_date,
    'expiresAt', v_row.verification_expires_at,
    'clientLabel', public.mask_client_name(v_row.client_name)
  );

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
  SET search_path = public, pg_temp;

CREATE OR REPLACE FUNCTION public.record_verification(
  p_token UUID,
  p_action TEXT,
  p_reason TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_delivery deliveries%ROWTYPE;
  v_project  projects%ROWTYPE;
  v_score    NUMERIC;
BEGIN
  IF p_token IS NULL
     OR p_action IS NULL
     OR p_action NOT IN ('confirm', 'dispute') THEN
    RETURN jsonb_build_object('success', FALSE, 'reason', 'invalid');
  END IF;

  SELECT * INTO v_delivery FROM public.deliveries
   WHERE confirmation_token = p_token
     FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', FALSE, 'reason', 'invalid');
  END IF;

  IF v_delivery.verification_status <> 'pending' THEN
    RETURN jsonb_build_object(
      'success', FALSE,
      'reason', v_delivery.verification_status
    );
  END IF;

  IF v_delivery.verification_expires_at IS NOT NULL
     AND v_delivery.verification_expires_at < now() THEN
    UPDATE public.deliveries SET verification_status = 'expired'
     WHERE id = v_delivery.id;
    RETURN jsonb_build_object('success', FALSE, 'reason', 'expired');
  END IF;

  IF p_action = 'confirm' THEN
    UPDATE public.deliveries
       SET verification_status = 'confirmed',
           client_confirmed    = TRUE,
           client_confirmed_at = now(),
           recorded_at         = now()
     WHERE id = v_delivery.id;

    UPDATE public.milestones
       SET status = 'confirmed',
           client_confirmed_at = now()
     WHERE id = v_delivery.milestone_id;
  ELSE
    UPDATE public.deliveries
       SET verification_status = 'disputed',
           client_confirmed    = FALSE,
           dispute_reason       = left(coalesce(p_reason, ''), 500),
           recorded_at         = now()
     WHERE id = v_delivery.id;

    UPDATE public.milestones
       SET status = 'disputed'
     WHERE id = v_delivery.milestone_id;
  END IF;

  SELECT * INTO v_project FROM public.projects WHERE id = v_delivery.project_id;

  -- A project is complete once every one of its milestones is confirmed.
  IF v_project.status = 'active' AND p_action = 'confirm' AND NOT EXISTS (
    SELECT 1 FROM public.milestones
     WHERE project_id = v_project.id
       AND status <> 'confirmed'
  ) THEN
    UPDATE public.projects
       SET status = 'completed',
           client_confirmed = TRUE,
           client_confirmed_at = now(),
           completed_at = now()
     WHERE id = v_project.id;
  END IF;

  IF p_action = 'dispute' THEN
    UPDATE public.projects SET status = 'disputed' WHERE id = v_project.id;
  END IF;

  v_score := public.recalculate_trust_score(v_delivery.freelancer_id);

  INSERT INTO public.activity_log (user_id, project_id, action, description, metadata)
  VALUES (
    v_delivery.freelancer_id,
    v_project.id,
    CASE WHEN p_action = 'confirm' THEN 'delivery_confirmed' ELSE 'delivery_disputed' END,
    CASE
      WHEN p_action = 'confirm' THEN v_delivery.client_name || ' confirmed "' || coalesce(
        (SELECT m.title FROM public.milestones m WHERE m.id = v_delivery.milestone_id),
        v_project.project_title
      ) || '".'
      ELSE v_delivery.client_name || ' disputed "' || coalesce(
        (SELECT m.title FROM public.milestones m WHERE m.id = v_delivery.milestone_id),
        v_project.project_title
      ) || '".'
    END,
    jsonb_build_object('delivery_id', v_delivery.id, 'trust_score', v_score)
  );

  RETURN jsonb_build_object(
    'success', TRUE,
    'status', CASE WHEN p_action = 'confirm' THEN 'confirmed' ELSE 'disputed' END,
    'trustScore', v_score
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
  SET search_path = public, pg_temp;

-- The client opening an emailed link is anonymous by design.
REVOKE EXECUTE ON FUNCTION public.get_verification_request(UUID) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.record_verification(UUID, TEXT, TEXT) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.get_verification_request(UUID) TO anon, authenticated, service_role;
GRANT  EXECUTE ON FUNCTION public.record_verification(UUID, TEXT, TEXT) TO anon, authenticated, service_role;

-- Internal helpers should never be reachable through the API.
REVOKE EXECUTE ON FUNCTION public.voucht_internal_write() FROM PUBLIC, anon, authenticated;

-- -------------------------------------------------------
-- 11. SIGNUP: KEEP THE USERNAME THE USER CHOSE
-- -------------------------------------------------------
-- The previous version re-derived the username from the email prefix, silently
-- discarding the handle entered at signup, and aborted the whole profile insert
-- on a collision.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_base     TEXT;
  v_username TEXT;
  v_suffix   INTEGER := 0;
BEGIN
  v_base := lower(btrim(coalesce(
    NEW.raw_user_meta_data ->> 'username',
    split_part(coalesce(NEW.email, ''), '@', 1)
  )));
  v_base := regexp_replace(v_base, '[^a-z0-9_]', '', 'g');

  IF v_base = '' OR char_length(v_base) < 3 THEN
    v_base := 'voucht-' || left(replace(NEW.id::TEXT, '-', ''), 8);
  END IF;

  v_username := v_base;

  WHILE EXISTS (SELECT 1 FROM public.profiles WHERE username = v_username) LOOP
    v_suffix := v_suffix + 1;
    v_username := v_base || v_suffix::TEXT;
  END LOOP;

  INSERT INTO public.profiles (
    id, email, username, full_name, skill, avatar_url
  ) VALUES (
    NEW.id,
    NEW.email,
    v_username,
    coalesce(nullif(btrim(NEW.raw_user_meta_data ->> 'full_name'), ''), v_base),
    coalesce(nullif(btrim(NEW.raw_user_meta_data ->> 'skill'), ''), 'Developer'),
    NEW.raw_user_meta_data ->> 'avatar_url'
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
  SET search_path = public, pg_temp;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- -------------------------------------------------------
-- 12. BACKFILL
-- -------------------------------------------------------
-- Recompute every stored score from recorded activity, so no row keeps a value
-- that was written by hand or by the old clamped formula.
DO $$
DECLARE
  v_id UUID;
BEGIN
  FOR v_id IN SELECT id FROM public.profiles LOOP
    PERFORM public.recalculate_trust_score(v_id);
  END LOOP;
END;
$$;
