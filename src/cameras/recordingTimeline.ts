export const TIMELINE_CAMERAS = ["office_top", "office_bottom"];
export const RECORDING_WINDOW = 48 * 3600;
export type Recording = { start_time: number; end_time: number };
export type Span = { start: number; end: number };
export function coveredDownload(start: number, end: number, spans: Span[]) {
  return Number.isFinite(start) && Number.isFinite(end) && end > start && end - start <= 3600
    && spans.some((span) => start >= span.start && end <= span.end);
}
export function downloadTime(ts: number) {
  const parts = new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Belgrade", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23" }).format(new Date(ts * 1000));
  return parts.replace(" ", "T");
}
export function parseDownloadTime(value: string, reference: number) {
  // Resolve local wall time against the selected recording's UTC offset, including DST.
  const wall = Date.parse(`${value}Z`) / 1000;
  if (!Number.isFinite(wall)) return NaN;
  const ref = Number.isFinite(reference) ? reference : Math.floor(Date.now() / 1000);
  let result = wall - (Date.parse(`${downloadTime(ref)}Z`) / 1000 - ref);
  for (let i = 0; i < 2; i++) result += wall - Date.parse(`${downloadTime(result)}Z`) / 1000;
  return downloadTime(result).slice(0, value.length) === value ? result : NaN;
}
export function mergeRecordings(recordings: Recording[], start: number, end: number): Span[] {
  const spans = recordings.filter((r) => Number.isFinite(r.start_time) && Number.isFinite(r.end_time))
    .map((r) => ({ start: Math.max(start, r.start_time), end: Math.min(end, r.end_time) }))
    .filter((r) => r.end > r.start).sort((a, b) => a.start - b.start);
  const merged: Span[] = [];
  for (const span of spans) {
    const last = merged[merged.length - 1];
    if (last && span.start <= last.end) last.end = Math.max(last.end, span.end);
    else merged.push({ ...span });
  }
  return merged;
}
export function playbackWindow(ts: number, now: number) {
  return { start: Math.floor(Math.max(now - RECORDING_WINDOW, Math.min(ts, now - 1))), end: Math.floor(Math.min(now, ts + 3600)) };
}