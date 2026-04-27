-- Update handle_new_user() trigger to extract DOB from auth.users metadata.
-- Pairs with app/src/store/authStore.ts signUp() which passes
-- options.data.dob as an ISO date string.
--
-- Existing 16+ CHECK constraint validates the value; if it fails,
-- the entire auth.users INSERT rolls back and signUp throws.
-- Legacy nulls remain allowed (column allows NULL, CHECK allows NULL).

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
  INSERT INTO public.profiles (id, username, display_name, dob)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    NULLIF(NEW.raw_user_meta_data->>'dob', '')::date
  );
  RETURN NEW;
END;
$function$;
