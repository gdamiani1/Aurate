-- Enforce 16+ via CHECK constraint on profiles.dob.
-- NULL is allowed for legacy rows (existing pre-migration profiles).
-- New profiles MUST have dob >= 16 years ago.
--
-- This is the database-level age gate. App-side validation in signup
-- form is the first defense; this constraint is defense-in-depth.

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_age_16_check
  CHECK (
    dob IS NULL
    OR dob <= (CURRENT_DATE - INTERVAL '16 years')
  );
