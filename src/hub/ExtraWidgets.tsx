import { Link } from "react-router-dom";
import { ArrowUpRight, Cctv, Film, Ship, CheckCircle2, FileWarning, Plane, Heart, Newspaper, Radio } from "lucide-react";
import { useHistory } from "@/tv/api";
import { useKorauto, carName } from "@/korauto/feed";
import { useFrigate, camLabel, fmtWhen, type FEvent } from "@/cameras/frigate";
import { usePoll } from "@/wi/api";
import type { CardDef } from "./EditableGrid";
import type { ReactNode } from "react";

function Widget({ label, icon, to, children }: { label: string; icon: ReactNode; to: string; children: ReactNode }) {
  return <Link to={to} className="hq-card hq-rise flex h-full min-w-0 flex-col gap-3 p-4 sm:p-5">
    <div className="flex items-center gap-2"><span className="text-muted-foreground">{icon}</span><span className="hq-label min-w-0 flex-1 truncate">{label}</span><ArrowUpRight className="h-4 w-4 shrink-0 text-muted-foreground" /></div>
    <div className="min-h-0 flex-1 overflow-auto text-sm">{children}</div>
  </Link>;
}
function BusinessWidget({ kind }: { kind: "shipping" | "approvals" | "complaints" }) {
  const { feed, loading } = useKorauto();
  const list = kind === "shipping" ? feed?.arrivingThisWeek : kind === "approvals" ? feed?.pendingApprovals : feed?.openComplaints;
  const title = kind === "shipping" ? "Arriving this week" : kind === "approvals" ? "Pending approvals" : "Open complaints";
  return <Widget label={title} icon={kind === "shipping" ? <Ship /> : kind === "approvals" ? <CheckCircle2 /> : <FileWarning />} to="/korauto">
    <div className="hq-num text-3xl font-semibold">{!feed ? "—" : list?.length ?? 0}</div>
    <div className="mt-2 space-y-1 text-xs text-muted-foreground">{!feed ? loading ? "Loading…" : "Unavailable" : !feed.configured ? "Connection needed" : feed.error ? "Feed unavailable" : list?.length ? list.slice(0, 3).map((c) => <p key={c.id} className="truncate">{"car_label" in c ? String(c.car_label || c.status || "Complaint") : carName(c)}</p>) : "Nothing pending"}</div>
  </Widget>;
}
function ContinueWidget() {
  const { hist } = useHistory();
  const items = hist.filter((h) => h.kind !== "live" && h.pos > 30 && h.dur > h.pos + 90).slice(0, 3);
  return <Widget label="Continue watching" icon={<Film />} to="/tv">
    {items.length ? items.map((h) => <div key={`${h.kind}:${h.id}`} className="mb-2 flex gap-2">
      {h.logo && <img src={h.logo} alt="" loading="lazy" className="h-10 w-14 shrink-0 rounded-md object-cover" />}
      <div className="min-w-0"><p className="truncate font-medium">{h.name}</p><p className="text-xs text-muted-foreground">{Math.ceil((h.dur - h.pos) / 60)} min left</p></div>
    </div>) : <p className="text-muted-foreground">No unfinished movies or episodes</p>}
  </Widget>;
}
function RecordingsWidget() {
  const { data, loading, error } = useFrigate<{ items: FEvent[] }>("events?limit=4", 30000);
  const items = data?.items.filter((e) => e.hasClip && e.end);
  return <Widget label="Recent recordings" icon={<Cctv />} to="/cameras">
    {items?.length ? items.slice(0, 3).map((e) => <div key={e.id} className="mb-2"><p className="truncate font-medium">{camLabel(e.camera)} · {camLabel(e.label)}</p><p className="text-xs text-muted-foreground">{fmtWhen(e.start)}</p></div>) : <p className="text-muted-foreground">{loading ? "Loading…" : error ? "Recordings unavailable" : "No recent recordings"}</p>}
  </Widget>;
}
function NewsWidget({ scope, label }: { scope: string; label: string }) {
  const { data, loading, error } = usePoll(`/api/news?scope=${scope}`, 600000);
  const items = data?.items?.slice(0, 3) ?? [];
  return <Widget label={label} icon={<Newspaper />} to="/world#news">
    {items.length ? items.map((n: { url: string; title: string }) => <p key={n.url} className="mb-2 line-clamp-2 text-xs">{n.title}</p>) : <p className="text-muted-foreground">{loading ? "Loading…" : error ? "News unavailable" : "No recent headlines"}</p>}
  </Widget>;
}
function SourceWidget() {
  const { data, loading, error } = usePoll("/api/status", 300000);
  const sources = data?.sources ?? [];
  return <Widget label="News source health" icon={<Radio />} to="/world">
    <div className="hq-num text-3xl font-semibold">{data ? `${sources.filter((s: { state: string }) => s.state === "ok").length}/${sources.length}` : "—"}</div>
    <p className="mt-2 text-xs text-muted-foreground">{loading ? "Checking sources…" : error ? "Status unavailable" : "Sources reporting normally"}</p>
  </Widget>;
}
export function extraWidgets(travel: { s: { trips: any[]; bucket: string[] } | null }): CardDef[] {
  const next = [...(travel.s?.trips ?? [])].filter((t) => t.startDate && Date.parse(t.startDate) > Date.now()).sort((a, b) => Date.parse(a.startDate) - Date.parse(b.startDate))[0];
  const make = (id: string, label: string, icon: ReactNode, render: () => ReactNode): CardDef => ({ id, label, icon, size: "M", optional: true, render });
  return [
    make("arrivals", "Arriving this week", <Ship />, () => <BusinessWidget kind="shipping" />),
    make("approvals", "Pending car approvals", <CheckCircle2 />, () => <BusinessWidget kind="approvals" />),
    make("complaints", "Open complaints", <FileWarning />, () => <BusinessWidget kind="complaints" />),
    make("continue", "Continue watching", <Film />, () => <ContinueWidget />),
    make("recordings", "Recent camera recordings", <Cctv />, () => <RecordingsWidget />),
    make("next-trip", "Next trip", <Plane />, () => <Widget label="Next trip" icon={<Plane />} to="/travel#calendar"><p className="text-lg font-semibold">{next ? next.countryName || next.countryCode : "No upcoming trips"}</p>{next && <p className="mt-2 text-xs text-muted-foreground">{new Date(next.startDate).toLocaleDateString("en-GB")}</p>}</Widget>),
    make("bucket", "Travel wish list", <Heart />, () => <Widget label="Travel wish list" icon={<Heart />} to="/travel#map"><p className="hq-num text-3xl font-semibold">{travel.s?.bucket.length ?? "—"}</p><p className="mt-2 text-xs text-muted-foreground">{travel.s?.bucket.length ? travel.s.bucket.join(" · ") : "No saved destinations"}</p></Widget>),
    make("source-health", "News source health", <Radio />, () => <SourceWidget />),
  ];
}
