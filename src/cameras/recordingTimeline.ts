export const TIMELINE_CAMERAS = ["office_top", "office_bottom"];
export const RECORDING_WINDOW = 48 * 3600;
export type Recording = { start_time: number; end_time: number };
export type Span = { start: number; end: number };
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