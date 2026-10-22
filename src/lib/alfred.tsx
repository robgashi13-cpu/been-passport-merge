import { ArrowUpRight } from "lucide-react";
import { useState } from "react";

/** Single source of truth for the Alfred web viewer. */
export const ALFRED_WEB_URL = "https://alfred.camera/webapp/viewer/";

/**
 * iOS standalone PWA: window.open() would stay inside the app shell, so a plain
 * anchor is used there and iOS hands the link over to Safari.
 */
function isIOSStandalone() {
  try {
    const nav = navigator as Navigator & { standalone?: boolean };
    const ios = /iPhone|iPad|iPod/i.test(nav.userAgent) || (nav.platform === "MacIntel" && nav.maxTouchPoints > 1);
    return ios && (nav.standalone === true || window.matchMedia("(display-mode: standalone)").matches);
  } catch {
    return false;
  }
}

const BTN =
  "inline-flex items-center justify-center gap-1.5 rounded-full bg-white px-3.5 py-1.5 text-[12px] font-medium text-black transition hover:bg-white/85 active:scale-[0.98]";

/** Opens the Alfred web viewer in a new tab. Never stores credentials or calls the API. */
export function AlfredOpen({ className = "", label = "Open Alfred" }: { className?: string; label?: string }) {
  const [standalone, setStandalone] = useState(isIOSStandalone);
  const cls = `${BTN} ${className}`.trim();
  if (standalone)
    return (
      <a href={ALFRED_WEB_URL} target="_blank" rel="noopener noreferrer" className={cls}>
        {label} <ArrowUpRight className="h-3.5 w-3.5" />
      </a>
    );
  return (
    <button
      type="button"
      className={cls}
      onClick={() => window.open(ALFRED_WEB_URL, "_blank", "noopener,noreferrer")}
    >
      {label} <ArrowUpRight className="h-3.5 w-3.5" />
    </button>
  );
}
