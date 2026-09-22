-- =======================================================
-- VOUCHT - COMPLETE SUPABASE DATABASE SCHEMA
-- =======================================================

-- 1. PROFILES TABLE (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  avatar_url TEXT,
  skill TEXT NOT NULL DEFAULT 'Developer',
  bio TEXT,
  location TEXT,
  website TEXT,
  linkedin_url TEXT,
  trust_score DECIMAL(5,2) DEFAULT 0,
  total_projects INTEGER DEFAULT 0,
  completed_projects INTEGER DEFAULT 0,
  on_time_rate DECIMAL(5,2) DEFAULT 0,
  avg_response_hours DECIMAL(5,2) DEFAULT 0,
  ghost_rate DECIMAL(5,2) DEFAULT 0,
  badge_tier TEXT DEFAULT 'none' CHECK (badge_tier IN ('none', 'building', 'reliable', 'exceptional')),
  plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'elite')),
  plan_expires_at TIMESTAMPTZ,
  stripe_customer_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. PROJECTS TABLE
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  freelancer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  client_name TEXT NOT NULL,
  client_email TEXT NOT NULL,
  client_confirmed BOOLEAN DEFAULT FALSE,
  client_confirmed_at TIMESTAMPTZ,
  client_token UUID DEFAULT gen_random_uuid(),
  project_title TEXT NOT NULL,
  description TEXT,
  deadline TIMESTAMPTZ NOT NULL,
  payment_amount DECIMAL(10,2),
  currency TEXT DEFAULT 'USD',
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled', 'overdue', 'disputed')),
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. MILESTONES TABLE
CREATE TABLE IF NOT EXISTS public.milestones (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  due_date TIMESTAMPTZ NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'submitted', 'confirmed', 'overdue')),
  freelancer_submitted_at TIMESTAMPTZ,
  client_confirmed_at TIMESTAMPTZ,
  client_confirmation_token UUID DEFAULT gen_random_uuid(),
  is_on_time BOOLEAN,
  notes TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. DELIVERIES TABLE (verified delivery receipts — permanent record)
CREATE TABLE IF NOT EXISTS public.deliveries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  milestone_id UUID REFERENCES public.milestones(id) ON DELETE CASCADE,
  freelancer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  client_email TEXT NOT NULL,
  client_name TEXT NOT NULL,
  delivery_type TEXT DEFAULT 'milestone' CHECK (delivery_type IN ('milestone', 'final')),
  was_on_time BOOLEAN NOT NULL,
  days_early_or_late INTEGER DEFAULT 0,
  client_confirmed BOOLEAN DEFAULT FALSE,
  client_confirmed_at TIMESTAMPTZ,
  confirmation_token UUID DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. CONTRACTS TABLE (AI-generated smart contracts)
CREATE TABLE IF NOT EXISTS public.contracts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  freelancer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  client_name TEXT NOT NULL,
  client_email TEXT NOT NULL,
  contract_text TEXT NOT NULL,
  scope TEXT,
  payment_terms TEXT,
  deadline TIMESTAMPTZ,
  freelancer_signed BOOLEAN DEFAULT FALSE,
  client_signed BOOLEAN DEFAULT FALSE,
  freelancer_signed_at TIMESTAMPTZ,
  client_signed_at TIMESTAMPTZ,
  sign_token UUID DEFAULT gen_random_uuid(),
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'signed', 'expired')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. ACTIVITY LOG (for dashboard feed)
CREATE TABLE IF NOT EXISTS public.activity_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  description TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. SUBSCRIPTIONS TABLE
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  plan TEXT NOT NULL CHECK (plan IN ('pro', 'elite')),
  payment_provider TEXT NOT NULL CHECK (payment_provider IN ('creem', 'nowpayments')),
  provider_subscription_id TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired', 'past_due')),
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. PROFILE VIEWS (analytics — who viewed the proof page)
CREATE TABLE IF NOT EXISTS public.profile_views (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  viewer_ip TEXT,
  viewer_country TEXT,
  referrer TEXT,
  viewed_at TIMESTAMPTZ DEFAULT NOW()
);

-- =======================================================
-- INDEXES
-- =======================================================
CREATE INDEX IF NOT EXISTS idx_projects_freelancer ON public.projects(freelancer_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON public.projects(status);
CREATE INDEX IF NOT EXISTS idx_milestones_project ON public.milestones(project_id);
CREATE INDEX IF NOT EXISTS idx_milestones_due_date ON public.milestones(due_date);
CREATE INDEX IF NOT EXISTS idx_deliveries_freelancer ON public.deliveries(freelancer_id);
CREATE INDEX IF NOT EXISTS idx_activity_user ON public.activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_profile_views_profile ON public.profile_views(profile_id);
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);

-- =======================================================
-- ROW LEVEL SECURITY (RLS)
-- =======================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_views ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if needed to prevent duplicates on rerun
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;

CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- PROJECTS
DROP POLICY IF EXISTS "Users can view own projects" ON public.projects;
DROP POLICY IF EXISTS "Users can create own projects" ON public.projects;
DROP POLICY IF EXISTS "Users can update own projects" ON public.projects;
DROP POLICY IF EXISTS "Users can delete own projects" ON public.projects;

CREATE POLICY "Users can view own projects" ON public.projects FOR SELECT USING (auth.uid() = freelancer_id);
CREATE POLICY "Users can create own projects" ON public.projects FOR INSERT WITH CHECK (auth.uid() = freelancer_id);
CREATE POLICY "Users can update own projects" ON public.projects FOR UPDATE USING (auth.uid() = freelancer_id);
CREATE POLICY "Users can delete own projects" ON public.projects FOR DELETE USING (auth.uid() = freelancer_id);

-- MILESTONES
DROP POLICY IF EXISTS "Users can view own milestones" ON public.milestones;
DROP POLICY IF EXISTS "Users can create milestones for own projects" ON public.milestones;
DROP POLICY IF EXISTS "Users can update own milestones" ON public.milestones;

CREATE POLICY "Users can view own milestones" ON public.milestones FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.projects WHERE projects.id = milestones.project_id AND projects.freelancer_id = auth.uid())
);
CREATE POLICY "Users can create milestones for own projects" ON public.milestones FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.projects WHERE projects.id = milestones.project_id AND projects.freelancer_id = auth.uid())
);
CREATE POLICY "Users can update own milestones" ON public.milestones FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.projects WHERE projects.id = milestones.project_id AND projects.freelancer_id = auth.uid())
);

-- DELIVERIES
DROP POLICY IF EXISTS "Public can view deliveries" ON public.deliveries;
DROP POLICY IF EXISTS "Users can create own deliveries" ON public.deliveries;

CREATE POLICY "Public can view deliveries" ON public.deliveries FOR SELECT USING (true);
CREATE POLICY "Users can create own deliveries" ON public.deliveries FOR INSERT WITH CHECK (auth.uid() = freelancer_id);

-- CONTRACTS
DROP POLICY IF EXISTS "Users can view own contracts" ON public.contracts;
DROP POLICY IF EXISTS "Users can create own contracts" ON public.contracts;
DROP POLICY IF EXISTS "Users can update own contracts" ON public.contracts;

CREATE POLICY "Users can view own contracts" ON public.contracts FOR SELECT USING (auth.uid() = freelancer_id);
CREATE POLICY "Users can create own contracts" ON public.contracts FOR INSERT WITH CHECK (auth.uid() = freelancer_id);
CREATE POLICY "Users can update own contracts" ON public.contracts FOR UPDATE USING (auth.uid() = freelancer_id);

-- ACTIVITY LOG
DROP POLICY IF EXISTS "Users can view own activity" ON public.activity_log;
DROP POLICY IF EXISTS "Users can create own activity" ON public.activity_log;

CREATE POLICY "Users can view own activity" ON public.activity_log FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own activity" ON public.activity_log FOR INSERT WITH CHECK (auth.uid() = user_id);

-- SUBSCRIPTIONS
DROP POLICY IF EXISTS "Users can view own subscription" ON public.subscriptions;
CREATE POLICY "Users can view own subscription" ON public.subscriptions FOR SELECT USING (auth.uid() = user_id);

-- PROFILE VIEWS
DROP POLICY IF EXISTS "Users can view own profile views" ON public.profile_views;
DROP POLICY IF EXISTS "Anyone can insert profile view" ON public.profile_views;

CREATE POLICY "Users can view own profile views" ON public.profile_views FOR SELECT USING (auth.uid() = profile_id);
CREATE POLICY "Anyone can insert profile view" ON public.profile_views FOR INSERT WITH CHECK (true);

-- =======================================================
-- FUNCTIONS & TRIGGERS
-- =======================================================

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, username, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    LOWER(REPLACE(SPLIT_PART(NEW.email, '@', 1), '.', '')),
    COALESCE(NEW.raw_user_meta_data->>'full_name', SPLIT_PART(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS update_projects_updated_at ON public.projects;
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON public.projects FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS update_subscriptions_updated_at ON public.subscriptions;
CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON public.subscriptions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Function to recalculate trust score
CREATE OR REPLACE FUNCTION public.recalculate_trust_score(p_freelancer_id UUID)
RETURNS DECIMAL AS $$
DECLARE
  v_delivery_rate DECIMAL;
  v_on_time_rate DECIMAL;
  v_total_projects INTEGER;
  v_completed_projects INTEGER;
  v_total_milestones INTEGER;
  v_on_time_milestones INTEGER;
  v_ghost_rate DECIMAL;
  v_score DECIMAL;
  v_badge TEXT;
BEGIN
  -- Count projects
  SELECT COUNT(*), COUNT(*) FILTER (WHERE status = 'completed')
  INTO v_total_projects, v_completed_projects
  FROM public.projects WHERE freelancer_id = p_freelancer_id;

  -- If no projects, score is 0
  IF v_total_projects = 0 THEN
    UPDATE public.profiles SET trust_score = 0, total_projects = 0, completed_projects = 0, badge_tier = 'none'
    WHERE id = p_freelancer_id;
    RETURN 0;
  END IF;

  -- Delivery rate (completed / total)
  v_delivery_rate := (v_completed_projects::DECIMAL / v_total_projects::DECIMAL) * 100;

  -- On-time rate from deliveries
  SELECT COUNT(*), COUNT(*) FILTER (WHERE was_on_time = true)
  INTO v_total_milestones, v_on_time_milestones
  FROM public.deliveries WHERE freelancer_id = p_freelancer_id AND client_confirmed = true;

  IF v_total_milestones > 0 THEN
    v_on_time_rate := (v_on_time_milestones::DECIMAL / v_total_milestones::DECIMAL) * 100;
  ELSE
    v_on_time_rate := 0;
  END IF;

  -- Ghost rate (cancelled / total)
  v_ghost_rate := (
    (SELECT COUNT(*) FROM public.projects 
     WHERE freelancer_id = p_freelancer_id AND status = 'cancelled')::DECIMAL 
    / v_total_projects::DECIMAL
  ) * 100;

  -- Calculate weighted score
  -- Delivery Rate: 40%, On-Time Rate: 25%, Ghost Penalty: 20%, Consistency Bonus: 15%
  v_score := (v_delivery_rate * 0.40) + (v_on_time_rate * 0.25) + ((100 - v_ghost_rate) * 0.20);
  
  -- Consistency bonus: more projects = higher bonus (up to 15 points)
  v_score := v_score + LEAST(v_completed_projects * 1.5, 15);

  -- Clamp 0-100
  v_score := GREATEST(0, LEAST(100, v_score));

  -- Determine badge tier
  IF v_score >= 80 AND v_completed_projects >= 3 THEN v_badge := 'exceptional';
  ELSIF v_score >= 60 AND v_completed_projects >= 2 THEN v_badge := 'reliable';
  ELSIF v_completed_projects >= 1 THEN v_badge := 'building';
  ELSE v_badge := 'none';
  END IF;

  -- Update profile
  UPDATE public.profiles SET 
    trust_score = v_score,
    total_projects = v_total_projects,
    completed_projects = v_completed_projects,
    on_time_rate = v_on_time_rate,
    ghost_rate = v_ghost_rate,
    badge_tier = v_badge
  WHERE id = p_freelancer_id;

  RETURN v_score;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
