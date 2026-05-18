import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { countries } from "@/data/countries";

const LAST_RUN_KEY = "wp.ai-verify.lastRun";
const OVERRIDES_KEY = "wp.ai-verify.overrides";
const VERIFY_HOUR = 3;
const REFRESH_INTERVAL_MS = 48 * 60 * 60 * 1000; // 48 hours

function lastVerifyWindow(now = new Date()): number {
  const d = new Date(now);
  d.setHours(VERIFY_HOUR, 0, 0, 0);
  if (now.getTime() < d.getTime()) d.setDate(d.getDate() - 1);
  return d.getTime();
}

export type VerifyOverrides = {
  passports: Record<string, { passportRank?: number }>;
  countries: Record<string, { safetyScore?: number }>;
  checkedAt?: string;
};

export function getVerifyOverrides(): VerifyOverrides {
  try {
    const raw = localStorage.getItem(OVERRIDES_KEY);
    if (!raw) return { passports: {}, countries: {} };
    return JSON.parse(raw);
  } catch {
    return { passports: {}, countries: {} };
  }
}

async function runVerification() {
  // Sample a manageable slice to keep AI cost low: top 25 passports + 60 visited/popular countries.
  const passportSample = countries
    .filter((c) => typeof c.passportRank === "number")
    .sort((a, b) => (a.passportRank! - b.passportRank!))
    .slice(0, 25)
    .map((c) => ({ code: c.code, name: c.name, passportRank: c.passportRank }));

  // 2026 safety refresh — broaden the sample so corrections reach more countries.
  const countrySample = countries
    .filter((c) => typeof c.safetyScore === "number")
    .slice(0, 140)
    .map((c) => ({ code: c.code, name: c.name, safetyScore: c.safetyScore }));

  const { data, error } = await supabase.functions.invoke("verify-travel-data", {
    body: { passports: passportSample, countries: countrySample },
  });

  if (error) throw error;
  if (!data?.ok) throw new Error("Verification failed");

  const overrides: VerifyOverrides = { passports: {}, countries: {}, checkedAt: data.checkedAt };
  for (const p of data.corrections?.passports ?? []) {
    if (p?.code) overrides.passports[p.code] = { passportRank: p.passportRank };
  }
  for (const c of data.corrections?.countries ?? []) {
    if (c?.code) overrides.countries[c.code] = { safetyScore: c.safetyScore };
  }
  localStorage.setItem(OVERRIDES_KEY, JSON.stringify(overrides));
  localStorage.setItem(LAST_RUN_KEY, String(Date.now()));
}

/**
 * Schedules a once-per-day AI re-verification of travel data at 3 AM local time.
 * - On mount: if the most recent 3 AM has passed and we haven't run since, run now.
 * - Then sets a timer for the next 3 AM and re-runs daily.
 */
export function useDailyAIVerify() {
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;

    const lastRun = Number(localStorage.getItem(LAST_RUN_KEY) || 0);
    const overdue = Date.now() - lastRun > REFRESH_INTERVAL_MS || lastRun < lastVerifyWindow();

    const maybeRun = async () => {
      if (overdue) {
        try { await runVerification(); } catch (e) { console.warn("[ai-verify] failed", e); }
      }
    };
    void maybeRun();

    timer = setTimeout(async function tick() {
      try { await runVerification(); } catch (e) { console.warn("[ai-verify] failed", e); }
      timer = setTimeout(tick, REFRESH_INTERVAL_MS);
    }, REFRESH_INTERVAL_MS);

    return () => { if (timer) clearTimeout(timer); };
  }, []);
}
