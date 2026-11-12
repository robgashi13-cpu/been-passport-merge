export function imgUrl(path: string | null, size = "w342"): string | null {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  return `https://image.tmdb.org/t/p/${size}${path}`;
}

export function youtubeEmbed(key: string): string {
  return `https://www.youtube-nocookie.com/embed/${encodeURIComponent(key)}?rel=0`;
}

export function runtimeLabel(min: number | null): string | null {
  if (!min || min < 1) return null;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return h ? `${h}h ${m ? `${m}m` : ""}`.trim() : `${m}m`;
}

export function catalogPath(kind: "home" | "search" | "genres" | "discover" | "title" | "season" | "status", q: Record<string, string | number | undefined> = {}): string {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(q)) if (v != null && v !== "") p.set(k, String(v));
  const s = p.toString();
  return s ? `${kind}?${s}` : kind;
}
