-- WanderPass HQ: private allowlist + travel schema upgrade. NON-DESTRUCTIVE:
-- no table/column/row is dropped; existing profiles + user_travel_data rows are kept as-is.

-- 1) Allowlist ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.allowed_emails (
  email text PRIMARY KEY CHECK (email = lower(email)),
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.allowed_emails ENABLE ROW LEVEL SECURITY;
GRANT ALL ON public.allowed_emails TO service_role;
INSERT INTO public.allowed_emails (email, note) VALUES
  ('robgashi@gmail.com', 'Robert'),
  ('rgashi8@gmail.com', 'Robert'),
  ('robgashi13@gmail.com', 'Robert - existing WanderPass account that owns the travel data')
ON CONFLICT (email) DO NOTHING;

CREATE OR REPLACE FUNCTION public.is_allowed()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.allowed_emails WHERE email = lower(coalesce(auth.jwt() ->> 'email', '')));
$$;
REVOKE EXECUTE ON FUNCTION public.is_allowed() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_allowed() TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.email_is_allowed(p_email text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.allowed_emails WHERE email = lower(trim(p_email)));
$$;
GRANT EXECUTE ON FUNCTION public.email_is_allowed(text) TO anon, authenticated, service_role;

-- hard gate: no new account outside the allowlist (existing accounts are untouched)
CREATE OR REPLACE FUNCTION public.enforce_signup_allowlist()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.allowed_emails WHERE email = lower(coalesce(NEW.email, ''))) THEN
    RAISE EXCEPTION 'Sign-ups are restricted for this app';
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS enforce_signup_allowlist ON auth.users;
CREATE TRIGGER enforce_signup_allowlist BEFORE INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.enforce_signup_allowlist();

-- 2) Travel schema upgrade (add-only) ---------------------------------------
ALTER TABLE public.user_travel_data ADD COLUMN IF NOT EXISTS lived_countries text[] NOT NULL DEFAULT '{}';
ALTER TABLE public.user_travel_data ADD COLUMN IF NOT EXISTS trips jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE public.user_travel_data ADD COLUMN IF NOT EXISTS flight_history jsonb NOT NULL DEFAULT '[]'::jsonb;

-- RLS: same owner-only rules as before, plus the allowlist.
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "own profile read" ON public.profiles;
DROP POLICY IF EXISTS "own profile insert" ON public.profiles;
DROP POLICY IF EXISTS "own profile update" ON public.profiles;
CREATE POLICY "own profile read" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = user_id AND public.is_allowed());
CREATE POLICY "own profile insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id AND public.is_allowed());
CREATE POLICY "own profile update" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id AND public.is_allowed()) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view their own travel data" ON public.user_travel_data;
DROP POLICY IF EXISTS "Users can insert their own travel data" ON public.user_travel_data;
DROP POLICY IF EXISTS "Users can update their own travel data" ON public.user_travel_data;
DROP POLICY IF EXISTS "Users can delete their own travel data" ON public.user_travel_data;
DROP POLICY IF EXISTS "own travel read" ON public.user_travel_data;
DROP POLICY IF EXISTS "own travel insert" ON public.user_travel_data;
DROP POLICY IF EXISTS "own travel update" ON public.user_travel_data;
CREATE POLICY "own travel read" ON public.user_travel_data FOR SELECT TO authenticated USING (auth.uid() = user_id AND public.is_allowed());
CREATE POLICY "own travel insert" ON public.user_travel_data FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id AND public.is_allowed());
CREATE POLICY "own travel update" ON public.user_travel_data FOR UPDATE TO authenticated USING (auth.uid() = user_id AND public.is_allowed()) WITH CHECK (auth.uid() = user_id);
-- (no DELETE policy any more: the app never deletes travel rows)

-- create both rows for every new (allowlisted) user; idempotent
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, coalesce(NEW.raw_user_meta_data ->> 'display_name', NEW.raw_user_meta_data ->> 'name', split_part(NEW.email, '@', 1)))
  ON CONFLICT (user_id) DO NOTHING;
  INSERT INTO public.user_travel_data (user_id, passport_code) VALUES (NEW.id, 'XK') ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- 3) Cron key for the wi-refresh edge function (random, service-role only) --
CREATE TABLE IF NOT EXISTS public.hq_secrets (name text PRIMARY KEY, value text NOT NULL);
ALTER TABLE public.hq_secrets ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.hq_secrets FROM anon, authenticated;
GRANT ALL ON public.hq_secrets TO service_role;
INSERT INTO public.hq_secrets (name, value)
  VALUES ('cron', encode(extensions.gen_random_bytes(32), 'hex'))
ON CONFLICT (name) DO NOTHING;
