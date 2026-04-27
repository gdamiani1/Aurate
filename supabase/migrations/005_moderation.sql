-- Moderation v1: audit log + profile lock columns + DOB + retention cron.
-- Architecture doc: docs/plans/2026-04-26-moderation-design.md

-- pg_cron is provided by Supabase. If CREATE EXTENSION fails with permission
-- error, enable via Supabase dashboard → Database → Extensions, then re-apply.
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Audit log of every moderation event (reject, regenerate, soft-flag).
CREATE TABLE public.moderation_events (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  user_id     UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ip_address  INET,
  event_type  TEXT NOT NULL CHECK (event_type IN (
    'gemini_safety', 'output_blocklist', 'provider_error', 'system_busy'
  )),
  severity    TEXT NOT NULL CHECK (severity IN (
    'reject', 'regenerated', 'soft_flag'
  )),
  provider    TEXT NOT NULL,
  provider_response JSONB,
  matched_term TEXT,
  image_sha256 TEXT,
  sigma_path  TEXT,
  attempt_number INTEGER DEFAULT 1,
  request_id  TEXT
);

CREATE INDEX idx_modev_user_created ON public.moderation_events (user_id, created_at DESC);
CREATE INDEX idx_modev_ip_created   ON public.moderation_events (ip_address, created_at DESC);
CREATE INDEX idx_modev_event_type   ON public.moderation_events (event_type);

-- Server uses service-role key (bypasses RLS). Enable RLS with NO policies →
-- nothing readable/writable from anon/authenticated client.
ALTER TABLE public.moderation_events ENABLE ROW LEVEL SECURITY;

-- Profile additions: DOB for age attestation, lock state, manual override.
ALTER TABLE public.profiles ADD COLUMN dob                 DATE;
ALTER TABLE public.profiles ADD COLUMN moderation_override BOOLEAN DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN soft_locked_until   TIMESTAMPTZ;
ALTER TABLE public.profiles ADD COLUMN hard_locked         BOOLEAN DEFAULT false;

-- Retention: daily at 03:00 UTC.
-- 0–30 days: full record. 30–90 days: PII stripped. >90 days: deleted.
SELECT cron.schedule(
  'moderation-events-retention',
  '0 3 * * *',
  $$
    UPDATE public.moderation_events
       SET ip_address = NULL, image_sha256 = NULL, provider_response = NULL
     WHERE created_at < NOW() - INTERVAL '30 days'
       AND ip_address IS NOT NULL;

    DELETE FROM public.moderation_events
     WHERE created_at < NOW() - INTERVAL '90 days';
  $$
);
