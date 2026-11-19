import { createClient, type Session, type SupabaseClient } from "@supabase/supabase-js";
import { useCallback, useEffect, useState } from "react";
import { canOpenCars, resolveRole, type Role } from "./kam-form";

/**
 * Direct, user-authenticated connection to KorAuto Manager (korautomanager.biz, self-hosted Supabase).
 * The user signs in with their own KorAuto Manager account; every read and write runs under that
 * account's session and the manager's row-level security, so permissions are exactly the manager's.
 * The key below is KorAuto Manager's PUBLIC anon key (role "anon", already shipped on its login page) —
 * it grants nothing without a signed-in user. Never put a service-role key here.
 */
export const KAM_URL = "https://korautomanager.biz";
const KAM_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNzk0NDc0MTc5LCJleHAiOjE5NTIxNTQxNzl9.7zEHxiU11az8X2VxLjY7HOUlgdXy2XzwJFnzSiP93A4";

let client: SupabaseClient | null = null;
export function kam(): SupabaseClient {
  if (!client) {
    client = createClient(KAM_URL, KAM_ANON_KEY, {
      auth: { storageKey: "wp-korauto-manager-auth", persistSession: true, autoRefreshToken: true, detectSessionInUrl: false },
    });
  }
  return client;
}

export type KamAccess = {
  userId: string;
  email: string;
  name: string | null;
  role: Role;
  isAdmin: boolean;
  active: boolean;
  allowedTabs: string[];
  canOpenCars: boolean;
};

export function useKamSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const c = kam();
    let alive = true;
    c.auth.getSession().then(({ data }) => {
      if (!alive) return;
      setSession(data.session);
      setReady(true);
    }).catch(() => alive && setReady(true));
    const { data: sub } = c.auth.onAuthStateChange((_e, s) => alive && setSession(s));
    return () => {
      alive = false;
      sub.subscription.unsubscribe();
    };
  }, []);
  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await kam().auth.signInWithPassword({ email: email.trim(), password });
    if (error) throw new Error(error.message);
  }, []);
  const signOut = useCallback(async () => {
    await kam().auth.signOut();
  }, []);
  return { session, ready, signIn, signOut };
}

/** Same lookup as korautomanager's `useMyAccess` (profiles + user_roles). */
export function useKamAccess(session: Session | null) {
  const [access, setAccess] = useState<KamAccess | null>(null);
  const [error, setError] = useState<string | null>(null);
  const uid = session?.user.id;
  useEffect(() => {
    if (!uid) {
      setAccess(null);
      return;
    }
    let alive = true;
    const c = kam();
    Promise.all([
      c.from("profiles").select("id,email,full_name,allowed_tabs,active").eq("id", uid).maybeSingle(),
      c.from("user_roles").select("role").eq("user_id", uid),
    ]).then(([p, r]) => {
      if (!alive) return;
      if (p.error || r.error) setError((p.error || r.error)!.message);
      const role = resolveRole((r.data ?? []).map((x: { role: string }) => String(x.role)));
      const tabs = ((p.data as { allowed_tabs?: string[] } | null)?.allowed_tabs ?? []) as string[];
      setAccess({
        userId: uid,
        email: (p.data as { email?: string } | null)?.email || session?.user.email || "",
        name: (p.data as { full_name?: string | null } | null)?.full_name ?? null,
        role,
        isAdmin: role === "admin",
        active: (p.data as { active?: boolean } | null)?.active !== false,
        allowedTabs: tabs,
        canOpenCars: canOpenCars(role, tabs),
      });
    });
    return () => {
      alive = false;
    };
  }, [uid, session?.user.email]);
  return { access, error };
}

export type KamCar = Record<string, unknown> & { id: string };

/** Same as korautomanager's `useCar`: admins read the full row, everyone else the safe projection (RPC). */
export async function fetchKamCar(id: string, isAdmin: boolean): Promise<KamCar> {
  const c = kam();
  if (isAdmin) {
    const { data, error } = await c.from("cars").select("*").eq("id", id).single();
    if (error) throw new Error(error.message);
    return data as KamCar;
  }
  const { data, error } = await c.rpc("list_cars_safe");
  if (error) throw new Error(error.message);
  const found = ((data ?? []) as KamCar[]).find((r) => r.id === id);
  if (!found) throw new Error("Car not found (or not visible to your KorAuto Manager account)");
  return found;
}

/** Same as korautomanager's `fetchCars`. */
export async function fetchKamCars(isAdmin: boolean): Promise<KamCar[]> {
  const c = kam();
  if (isAdmin) {
    const { data, error } = await c.from("cars").select("*").order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []) as KamCar[];
  }
  const { data, error } = await c.rpc("list_cars_safe");
  if (error) throw new Error(error.message);
  return ((data ?? []) as KamCar[]).slice().sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)));
}

export async function fetchKamExpenses(carId: string) {
  const { data, error } = await kam().from("car_expenses").select("*").eq("car_id", carId).order("date", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as { id: string; description: string; amount: number; category: string | null; date: string }[];
}

/**
 * Save a car edit under the signed-in user's session. Row-level security decides; a policy that
 * filters the row out makes PostgREST update 0 rows without an error, so that is reported as a denial.
 */
export async function saveKamCar(id: string, patch: Record<string, unknown>): Promise<void> {
  if (!Object.keys(patch).length) return;
  const { error, count, status } = await kam().from("cars").update(patch, { count: "exact" }).eq("id", id);
  if (error) throw new Error(error.message + (error.code ? ` (${error.code})` : ""));
  if (count === 0) throw new Error(`KorAuto Manager did not save this change: your account is not allowed to edit this car (HTTP ${status}).`);
}
