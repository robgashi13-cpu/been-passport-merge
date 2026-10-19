import { useEffect, useState } from "react";
import { FN_BASE } from "@/lib/fn";
import { useAuth } from "@/hub/auth";

/** Read-only KORAUTO Manager feed (edge function `hq-korauto`). No buyer data, no money fields. */
export type Car = {
  id: string;
  make?: string;
  model?: string;
  year?: number;
  image_url?: string | null;
  created_at?: string;
  updated_at?: string;
  plate_number?: string | null;
  sale_status?: string | null;
  approval_status?: string | null;
  delivery_status?: string | null;
  tracking_eta?: string | null;
  tracking_status?: string | null;
  tracking_status_label?: string | null;
  tracking_vessel?: string | null;
  tracking_destination?: string | null;
  tracking_arrival_port?: string | null;
  status?: string | null;
};
export type Feed = {
  configured: boolean;
  missing?: string[];
  generatedAt?: string;
  todayStart?: string;
  addedToday?: Car[];
  latest?: Car[];
  updatedToday?: Car[];
  pendingApprovals?: Car[];
  arrivingThisWeek?: Car[];
  inspections?: Car[];
  openComplaints?: { id: string; status?: string; car_label?: string | null; updated_at?: string }[];
  pendingWebsiteSales?: number;
  stages?: Record<string, number>;
  statuses?: Record<string, number>;
  tracking?: Record<string, number>;
  totalCars?: number;
  shipping?: Car[];
  recentUpdates?: Car[];
  errors?: string[];
  error?: string;
  stale?: boolean;
};

let shared: Feed | null = null;

export function useKorauto() {
  const { token } = useAuth();
  const [feed, setFeed] = useState<Feed | null>(shared);
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);
  useEffect(() => {
    if (!token) return;
    let alive = true;
    setLoading(true);
    fetch(`${FN_BASE}/hq-korauto${tick ? "?force=1" : ""}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((j) => {
        shared = j;
        if (alive) setFeed(j);
      })
      .catch((e) => alive && setFeed((f) => f ?? { configured: true, error: String(e.message || e) }))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [token, tick]);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 5 * 60e3);
    return () => clearInterval(id);
  }, []);
  return { feed, loading, refresh: () => setTick((t) => t + 1) };
}

export const STAGE_LABEL: Record<string, string> = {
  autosallon: "In autosallon",
  sales: "In sales",
  shipped: "Shipped",
  none: "No stage",
};
export const carName = (c: Car) => [c.make, c.model].filter(Boolean).join(" ") || "Car";
