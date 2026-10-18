import { Logo } from "./Logo";

export function Splash({ label = "Loading" }: { label?: string }) {
  return (
    <div className="hq-ambient fixed inset-0 flex flex-col items-center justify-center gap-5">
      <Logo size={44} />
      <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-muted-foreground">
        <span className="hq-live-dot h-1.5 w-1.5 rounded-full bg-sky" />
        {label}
      </div>
    </div>
  );
}
