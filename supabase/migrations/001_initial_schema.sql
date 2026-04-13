-- Users table (extends Supabase Auth)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  current_path TEXT DEFAULT 'auramaxxing',
  total_aura_points INTEGER DEFAULT 0,
  peak_aura INTEGER DEFAULT 0,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_check_date DATE,
  tier TEXT DEFAULT 'Down Bad',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.aura_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  sigma_path TEXT NOT NULL,
  aura_score INTEGER NOT NULL CHECK (aura_score >= 0 AND aura_score <= 1000),
  personality_read TEXT NOT NULL,
  roast TEXT NOT NULL,
  aura_color JSONB NOT NULL,
  tier TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.friendships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  addressee_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'blocked')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(requester_id, addressee_id)
);

CREATE TABLE public.daily_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_date DATE NOT NULL UNIQUE DEFAULT CURRENT_DATE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  bonus_multiplier FLOAT DEFAULT 1.5,
  sigma_path TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_profiles_total_aura ON public.profiles(total_aura_points DESC);
CREATE INDEX idx_profiles_peak_aura ON public.profiles(peak_aura DESC);
CREATE INDEX idx_aura_checks_user ON public.aura_checks(user_id, created_at DESC);
CREATE INDEX idx_aura_checks_path ON public.aura_checks(sigma_path, aura_score DESC);
CREATE INDEX idx_friendships_status ON public.friendships(addressee_id, status);

-- RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.aura_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Aura checks are viewable by everyone" ON public.aura_checks FOR SELECT USING (true);
CREATE POLICY "Users can insert own checks" ON public.aura_checks FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can see own friendships" ON public.friendships FOR SELECT USING (auth.uid() = requester_id OR auth.uid() = addressee_id);
CREATE POLICY "Users can send friend requests" ON public.friendships FOR INSERT WITH CHECK (auth.uid() = requester_id);
CREATE POLICY "Addressee can update friendship status" ON public.friendships FOR UPDATE USING (auth.uid() = addressee_id);

-- Tier function
CREATE OR REPLACE FUNCTION get_tier(score INTEGER) RETURNS TEXT AS $$
BEGIN
  RETURN CASE
    WHEN score >= 1000 THEN 'Skibidi Legendary'
    WHEN score >= 950 THEN 'Mog God'
    WHEN score >= 900 THEN 'Sigma'
    WHEN score >= 800 THEN 'HIM / HER'
    WHEN score >= 600 THEN 'Cooking'
    WHEN score >= 400 THEN '6-7'
    WHEN score >= 200 THEN 'NPC'
    ELSE 'Down Bad'
  END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Profile stats update function
CREATE OR REPLACE FUNCTION update_profile_stats(p_user_id UUID, p_score INTEGER, p_tier TEXT) RETURNS VOID AS $$
DECLARE
  v_last_check DATE;
  v_current_streak INTEGER;
BEGIN
  SELECT last_check_date, current_streak INTO v_last_check, v_current_streak FROM profiles WHERE id = p_user_id;
  UPDATE profiles SET
    total_aura_points = total_aura_points + p_score,
    peak_aura = GREATEST(peak_aura, p_score),
    tier = CASE WHEN p_score > peak_aura THEN p_tier ELSE tier END,
    current_streak = CASE
      WHEN v_last_check = CURRENT_DATE - INTERVAL '1 day' THEN v_current_streak + 1
      WHEN v_last_check = CURRENT_DATE THEN v_current_streak
      ELSE 1
    END,
    longest_streak = GREATEST(longest_streak, CASE
      WHEN v_last_check = CURRENT_DATE - INTERVAL '1 day' THEN v_current_streak + 1
      ELSE 1
    END),
    last_check_date = CURRENT_DATE,
    updated_at = NOW()
  WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql;
