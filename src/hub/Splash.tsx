import { Logo } from "./Logo";

export function Splash({ label = "Loading" }: { label?: string }) {
  return (
    <div className="hq-ambient fixed inset-0 flex flex-col items-center justify-center gap-5">
      <Logo size={56} className="hq-breathe" />
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span className="h-4 w-4 animate-spin rounded-full border border-border border-t-primary" />
        {label}
      </div>
    </div>
  );
}
