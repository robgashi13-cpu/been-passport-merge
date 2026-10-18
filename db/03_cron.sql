-- WanderPass HQ: scheduled refresh of the WORLD // INTEL caches (calls the wi-refresh edge function).
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

CREATE OR REPLACE FUNCTION public.hq_refresh(job text, part int DEFAULT 0)
RETURNS bigint LANGUAGE sql SECURITY DEFINER SET search_path = public, extensions AS $$
  SELECT net.http_post(
    url := 'https://jtwtpqofzttbsvzewddm.supabase.co/functions/v1/wi-refresh',
    headers := jsonb_build_object('Content-Type', 'application/json',
                                  'x-cron-key', (SELECT value FROM public.hq_secrets WHERE name = 'cron')),
    body := jsonb_build_object('job', job, 'part', part),
    timeout_milliseconds := 150000);
$$;
REVOKE EXECUTE ON FUNCTION public.hq_refresh(text, int) FROM PUBLIC, anon, authenticated;

SELECT cron.unschedule(jobname) FROM cron.job WHERE jobname LIKE 'hq-refresh-%';
SELECT cron.schedule('hq-refresh-fast',    '*/2 * * * *',   $$SELECT public.hq_refresh('fast')$$);
SELECT cron.schedule('hq-refresh-hazards', '*/5 * * * *',   $$SELECT public.hq_refresh('hazards')$$);
SELECT cron.schedule('hq-refresh-gdelt',   '*/15 * * * *',  $$SELECT public.hq_refresh('gdelt')$$);
SELECT cron.schedule('hq-refresh-markets', '*/15 * * * *',  $$SELECT public.hq_refresh('markets')$$);
SELECT cron.schedule('hq-refresh-news-0',  '0-59/5 * * * *', $$SELECT public.hq_refresh('news', 0)$$);
SELECT cron.schedule('hq-refresh-news-1',  '1-59/5 * * * *', $$SELECT public.hq_refresh('news', 1)$$);
SELECT cron.schedule('hq-refresh-news-2',  '2-59/5 * * * *', $$SELECT public.hq_refresh('news', 2)$$);
SELECT cron.schedule('hq-refresh-risk',    '3 * * * *',     $$SELECT public.hq_refresh('risk')$$);
SELECT cron.schedule('hq-refresh-kev',     '7 */6 * * *',   $$SELECT public.hq_refresh('kev')$$);
SELECT cron.schedule('hq-refresh-iptv',    '9 */6 * * *',   $$SELECT public.hq_refresh('iptv')$$);
