-- WanderPass HQ: WORLD // INTEL cache tables (new tables only; service-role access; RLS on, no policies).
CREATE TABLE IF NOT EXISTS public.api_cache (
  key text PRIMARY KEY,
  payload jsonb,
  updated_at timestamptz NOT NULL DEFAULT now(),
  ttl_seconds int NOT NULL DEFAULT 300,
  status text NOT NULL DEFAULT 'pending',
  error text,
  meta jsonb
);
GRANT ALL ON public.api_cache TO service_role;
ALTER TABLE public.api_cache ENABLE ROW LEVEL SECURITY;


CREATE TABLE IF NOT EXISTS public.gdelt_files (
  stamp text PRIMARY KEY,
  loaded_at timestamptz NOT NULL DEFAULT now(),
  n int NOT NULL DEFAULT 0
);
GRANT ALL ON public.gdelt_files TO service_role;
ALTER TABLE public.gdelt_files ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.gdelt_events (
  id text PRIMARY KEY,
  stamp text NOT NULL,
  url text NOT NULL,
  type text NOT NULL,
  cameo_root text NOT NULL,
  severity int NOT NULL,
  num_articles int NOT NULL DEFAULT 0,
  time timestamptz NOT NULL,
  country text,
  region text,
  data jsonb NOT NULL
);
CREATE INDEX IF NOT EXISTS gdelt_events_stamp_idx ON public.gdelt_events (stamp);
CREATE INDEX IF NOT EXISTS gdelt_events_time_idx ON public.gdelt_events (time);
GRANT ALL ON public.gdelt_events TO service_role;
ALTER TABLE public.gdelt_events ENABLE ROW LEVEL SECURITY;

-- Deduped event window (by source URL, strongest coding wins), same ordering as the original server.
CREATE OR REPLACE FUNCTION public.gdelt_window(_hours int, _limit int)
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  WITH d AS (
    SELECT DISTINCT ON (url) data, severity, num_articles, time
    FROM gdelt_events WHERE time >= now() - make_interval(hours => _hours)
    ORDER BY url, severity DESC, num_articles DESC
  ), t AS (
    SELECT data FROM d ORDER BY severity DESC, num_articles DESC, time DESC LIMIT _limit
  )
  SELECT coalesce(jsonb_agg(data), '[]'::jsonb) FROM t;
$$;

-- Per-country CAMEO stats over the stored 24h window, with hourly conflict+attack buckets.
CREATE OR REPLACE FUNCTION public.gdelt_country_stats()
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  WITH d AS (
    SELECT DISTINCT ON (url, cameo_root) country, region, type, time
    FROM gdelt_events WHERE country IS NOT NULL ORDER BY url, cameo_root
  ), h AS (
    SELECT country, floor(extract(epoch FROM now() - time) / 3600)::int AS hr, count(*) AS n
    FROM d WHERE type IN ('conflict','attack') GROUP BY 1, 2
  ), c AS (
    SELECT country, max(region) AS region,
      count(*) FILTER (WHERE type='conflict') AS conflict,
      count(*) FILTER (WHERE type='attack') AS attack,
      count(*) FILTER (WHERE type='protest') AS protest,
      count(*) FILTER (WHERE type='unrest') AS unrest,
      count(*) FILTER (WHERE type='military') AS military,
      count(*) AS total
    FROM d GROUP BY country
  )
  SELECT coalesce(jsonb_object_agg(c.country, jsonb_build_object(
    'country', c.country, 'region', c.region, 'conflict', c.conflict, 'attack', c.attack, 'protest', c.protest,
    'unrest', c.unrest, 'military', c.military, 'total', c.total,
    'hourly', (SELECT jsonb_agg(coalesce((SELECT n FROM h WHERE h.country = c.country AND h.hr = 23 - i), 0) ORDER BY i) FROM generate_series(0, 23) i)
  )), '{}'::jsonb) FROM c;
$$;

REVOKE EXECUTE ON FUNCTION public.gdelt_window(int, int) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.gdelt_country_stats() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.gdelt_window(int, int) TO service_role;
GRANT EXECUTE ON FUNCTION public.gdelt_country_stats() TO service_role;

CREATE TABLE IF NOT EXISTS public.gdelt_day_counts (
  day text NOT NULL,
  country text NOT NULL,
  conflict integer NOT NULL DEFAULT 0,
  attack integer NOT NULL DEFAULT 0,
  military integer NOT NULL DEFAULT 0,
  protest integer NOT NULL DEFAULT 0,
  unrest integer NOT NULL DEFAULT 0,
  PRIMARY KEY (day, country)
);
GRANT ALL ON public.gdelt_day_counts TO service_role;
ALTER TABLE public.gdelt_day_counts ENABLE ROW LEVEL SECURITY;
