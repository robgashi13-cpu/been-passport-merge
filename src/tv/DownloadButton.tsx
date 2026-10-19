import { useEffect, useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hub/auth";
import { playUrl, type PlayItem } from "./api";

/** Large movies stream as attachments; never buffer the whole file in browser memory. */
export function DownloadButton({ item }: { item: PlayItem }) {
  const { token } = useAuth();
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState(false);
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
  return url ? <Button asChild variant="outline" size="sm"><a href={url} referrerPolicy="no-referrer"><Download /> Download</a></Button>
    : <Button variant="outline" size="sm" disabled title={error ? "Download unavailable" : "Preparing download"}>{error ? <Download /> : <Loader2 className="animate-spin" />}{error ? "Unavailable" : "Download"}</Button>;
}
