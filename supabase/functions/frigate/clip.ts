import { validWindow } from './hls.ts';
export function coveredClip(start: number, end: number, recordings: { start_time: number; end_time: number }[], now = Date.now() / 1000) {
  if (!validWindow(start, end, now)) return false;
  let covered = start;
  for (const r of [...recordings].sort((a, b) => a.start_time - b.start_time)) {
    if (!Number.isFinite(r.start_time) || !Number.isFinite(r.end_time) || r.end_time <= covered) continue;
    if (r.start_time > covered) return false;
    covered = Math.max(covered, r.end_time);
    if (covered >= end) return true;
  }
  return false;
}
export function clipFilename(camera: string, start: number, end: number) {
  const format = (ts: number) => new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Belgrade', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(new Date(ts * 1000));
  const first = format(start).replace(' ', '_').replace(':', '');
  return `${camera}_${first}-${format(end).slice(-5).replace(':', '')}.mp4`;
}