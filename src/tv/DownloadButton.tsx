import { useEffect, useState } from "react";
import { Check, Download, ImageDown, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hub/auth";
import { isNative, saveVideoToPhotos } from "@/lib/photosSave";
import { fileName } from "@/lib/download";
import { playUrl, type PlayItem } from "./api";

/**
 * Native app: downloads the video and saves it straight into the Photos library.
 * Web: streams the file as an attachment (never buffers the whole file in memory).
 */
export function DownloadButton({ item }: { item: PlayItem }) {
  const { token } = useAuth();
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const [saving, setSaving] = useState(false);
  const [pct, setPct] = useState(0);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let alive = true;
    const load = () => {
      setError(false);
      void playUrl(item, token, true).then((d) => { if (alive) setUrl(d.url); }).catch(() => { if (alive) { setUrl(null); setError(true); } });
    };
    setUrl(null); load();
    const timer = setInterval(load, 60000);
    return () => { alive = false; clearInterval(timer); };
  }, [item.id, item.kind, item.ext, item.name, token]);

  if (item.kind === "live") return null;

  const saveToPhotos = async () => {
    if (!url || saving) return;
    setSaving(true); setPct(0);
    try {
      await saveVideoToPhotos(url, fileName(item.name, item.ext || "mp4"), setPct);
      setSaved(true);
      setTimeout(() => setSaved(false), 4000);
    } catch {
      setError(true);
    } finally {
      setSaving(false);
    }
  };

  if (isNative()) {
    return (
      <Button variant="outline" size="sm" onClick={saveToPhotos} disabled={!url || saving} title={error ? "Download unavailable" : "Save video to Photos"}>
        {saved ? <Check className="text-emerald-400" /> : saving ? <Loader2 className="animate-spin" /> : <ImageDown />}
        {saved ? "Saved to Photos" : saving ? `Saving ${pct}%` : error && !url ? "Unavailable" : "Save to Photos"}
      </Button>
    );
  }

  return url ? <Button asChild variant="outline" size="sm"><a href={url} referrerPolicy="no-referrer"><Download /> Download</a></Button>
    : <Button variant="outline" size="sm" disabled title={error ? "Download unavailable" : "Preparing download"}>{error ? <Download /> : <Loader2 className="animate-spin" />}{error ? "Unavailable" : "Download"}</Button>;
}
