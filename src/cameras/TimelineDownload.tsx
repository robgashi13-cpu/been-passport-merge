import { useEffect, useRef, useState } from "react";
import { Download, Loader2, Share2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hub/auth";
import { deliverFile } from "@/lib/download";
import { fjson } from "./frigate";
import { coveredDownload, downloadTime, parseDownloadTime, type Span } from "./recordingTimeline";

export default function TimelineDownload({ camera, range, spans, onChange }: { camera: string; range: Span | null; spans: Span[]; onChange: (range: Span) => void }) {
  const { token } = useAuth();
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);
  const [prepared, setPrepared] = useState<{ blob: Blob; filename: string } | null>(null);
  const [error, setError] = useState("");
  const abort = useRef<AbortController | null>(null);
  useEffect(() => {
    abort.current?.abort(); setBusy(false); setPrepared(null); setError(""); setProgress(null);
    return () => abort.current?.abort();
  }, [camera, range?.start, range?.end]);
  const valid = range && coveredDownload(range.start, range.end, spans);
  const prepare = async () => {
    if (!range || !valid) return;
    const controller = new AbortController(); abort.current = controller;
    setBusy(true); setError(""); setProgress(null);
    try {
      const result = await fjson<{ url: string }>(`clip-url?${new URLSearchParams({ camera, start: String(range.start), end: String(range.end) })}`, token);
      if (controller.signal.aborted) return;
      const r = await fetch(result.url, { signal: controller.signal, referrerPolicy: "no-referrer" });
      if (!r.ok || !r.body) throw new Error("Clip unavailable");
      const total = Number(r.headers.get("content-length")) || 0;
      const reader = r.body.getReader(); const chunks: Uint8Array[] = []; let bytes = 0;
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value); bytes += value.length;
        if (total) setProgress(Math.min(99, Math.round(bytes / total * 100)));
      }
      if (!bytes) throw new Error("Empty clip");
      const filename = r.headers.get("content-disposition")?.match(/filename="([^"]+)"/)?.[1]
        || `${camera}_${downloadTime(range.start).replace(/[T:]/g, "_")}.mp4`;
      setPrepared({ blob: new Blob(chunks as BlobPart[], { type: "video/mp4" }), filename });
      setProgress(100);
    } catch {
      if (!controller.signal.aborted) setError("Couldn't download this clip. Try a shorter recorded range.");
    } finally { if (!controller.signal.aborted) setBusy(false); }
  };
  return <div className="mt-3 border-t border-border pt-3">
    <div className="flex flex-wrap items-end gap-3">
      {(["start", "end"] as const).map((field) => <label key={field} className="min-w-0 flex-1 basis-[220px] text-xs text-muted-foreground">
        <span className="mb-1 block capitalize">{field} · Belgrade</span>
        <input type="datetime-local" step="1" aria-label={`Download ${field} time`} disabled={!range || busy}
          value={range && Number.isFinite(range[field]) ? downloadTime(range[field]) : ""}
          onChange={(e) => { if (range) onChange({ ...range, [field]: parseDownloadTime(e.target.value, range[field]) }); }}
          className="hq-num h-9 w-full min-w-0 rounded-md border border-border bg-background px-2 text-xs text-foreground disabled:opacity-50" />
      </label>)}
      {prepared ? <Button size="sm" onClick={() => { void deliverFile(prepared.blob, prepared.filename).catch(() => setError("Couldn't save the clip. Try again.")); }}><Share2 className="h-4 w-4" />Save video</Button>
        : <Button size="sm" disabled={!valid || busy} onClick={() => void prepare()}><Download className="h-4 w-4" />Download clip</Button>}
      {busy && <Button size="icon" variant="ghost" aria-label="Cancel clip download" onClick={() => { abort.current?.abort(); setBusy(false); }}><X /></Button>}
    </div>
    <div className="mt-2 text-xs text-muted-foreground" role={error ? "alert" : "status"}>
      {error || (busy ? <span className="flex items-center gap-2"><Loader2 className="h-3 w-3 animate-spin motion-reduce:animate-none" />{progress == null ? "Preparing clip…" : `Downloading… ${progress}%`}</span>
        : prepared ? "Clip ready to save." : !range ? "Select start and end · Maximum 60 minutes" : valid ? `${Math.ceil((range.end - range.start) / 60)} min selected` : "Select a continuous recorded range, up to 60 minutes.")}
    </div>
  </div>;
}