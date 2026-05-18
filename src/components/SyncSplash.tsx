import { useEffect, useState } from "react";
import { Globe2, Wifi, WifiOff } from "lucide-react";

interface SyncSplashProps {
    visible: boolean;
    progress: number; // 0..1
    label: string;
    online?: boolean;
    onSkip?: () => void;
}

/** Full-screen liquid-glass overlay shown during the cold-open sync. */
export const SyncSplash = ({ visible, progress, label, online = true, onSkip }: SyncSplashProps) => {
    const [show, setShow] = useState(visible);

    useEffect(() => {
        if (visible) setShow(true);
        else {
            // small delay for fade-out
            const t = setTimeout(() => setShow(false), 360);
            return () => clearTimeout(t);
        }
    }, [visible]);

    if (!show) return null;

    const pct = Math.max(0, Math.min(1, progress));

    return (
        <div
            className={`fixed inset-0 z-[2000] flex items-center justify-center transition-opacity duration-300 ${visible ? "opacity-100" : "opacity-0 pointer-events-none"}`}
            aria-hidden={!visible}
        >
            {/* Liquid background */}
            <div className="absolute inset-0 -z-10 overflow-hidden bg-[#06080f]">
                <div className="absolute -top-32 -left-32 h-[520px] w-[520px] rounded-full bg-cyan-400/20 blur-[140px] animate-[splashA_14s_ease-in-out_infinite_alternate]" />
                <div className="absolute -bottom-40 -right-32 h-[560px] w-[560px] rounded-full bg-fuchsia-400/15 blur-[160px] animate-[splashB_18s_ease-in-out_infinite_alternate]" />
                <div className="absolute top-1/2 left-1/2 h-[300px] w-[300px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-amber-300/10 blur-[120px] animate-[splashC_12s_ease-in-out_infinite_alternate]" />
                <div className="absolute inset-0 opacity-[0.05] [background-image:linear-gradient(rgba(255,255,255,0.6)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.6)_1px,transparent_1px)] [background-size:48px_48px]" />
            </div>

            <style>{`
                @keyframes splashA { 0% { transform: translate(0,0) scale(1); } 100% { transform: translate(60px,40px) scale(1.18); } }
                @keyframes splashB { 0% { transform: translate(0,0) scale(1); } 100% { transform: translate(-40px,-30px) scale(1.12); } }
                @keyframes splashC { 0% { transform: translate(-50%,-50%) scale(1); } 100% { transform: translate(-55%,-52%) scale(1.25); } }
                @keyframes splashSpin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                @keyframes splashShimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
            `}</style>

            <div className="relative flex w-[min(420px,86vw)] flex-col items-center px-6 text-white">
                {/* Logo / globe orbit */}
                <div className="relative mb-7 grid h-24 w-24 place-items-center">
                    <div className="absolute inset-0 rounded-full border border-white/10" />
                    <div
                        className="absolute inset-0 rounded-full border border-cyan-300/50"
                        style={{ animation: "splashSpin 4s linear infinite", borderRightColor: "transparent", borderBottomColor: "transparent" }}
                    />
                    <div
                        className="absolute inset-2 rounded-full border border-violet-300/40"
                        style={{ animation: "splashSpin 6s linear infinite reverse", borderLeftColor: "transparent", borderTopColor: "transparent" }}
                    />
                    <div className="relative grid h-14 w-14 place-items-center rounded-full bg-white/5 backdrop-blur-xl border border-white/10 text-cyan-200 shadow-[0_0_40px_-8px_rgba(120,220,255,0.6)]">
                        <Globe2 className="h-7 w-7" />
                    </div>
                </div>

                <div className="text-[10px] font-bold uppercase tracking-[0.28em] text-cyan-200/80">WanderPass</div>
                <h1 className="mt-2 font-display text-2xl font-semibold tracking-tight">Syncing your world</h1>
                <p className="mt-1 text-center text-xs text-white/55">
                    Refreshing visa, country and currency data so everything works offline.
                </p>

                {/* Progress bar */}
                <div className="mt-7 w-full">
                    <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                        <div
                            className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-cyan-300 via-violet-300 to-amber-200 transition-[width] duration-300 ease-out"
                            style={{ width: `${pct * 100}%` }}
                        />
                        <div
                            className="absolute inset-0 opacity-50"
                            style={{
                                backgroundImage: "linear-gradient(90deg,transparent,rgba(255,255,255,0.6),transparent)",
                                backgroundSize: "200% 100%",
                                animation: "splashShimmer 2.4s linear infinite",
                            }}
                        />
                    </div>
                    <div className="mt-3 flex items-center justify-between text-[11px] text-white/60">
                        <span className="truncate pr-2">{label}</span>
                        <span className="font-mono text-white/75">{Math.round(pct * 100)}%</span>
                    </div>
                </div>

                <div className="mt-6 flex items-center gap-2 text-[10px] uppercase tracking-widest text-white/50">
                    {online ? <Wifi className="h-3 w-3 text-emerald-300" /> : <WifiOff className="h-3 w-3 text-amber-300" />}
                    {online ? "Online" : "Offline · using cached data"}
                </div>

                {onSkip && (
                    <button
                        onClick={onSkip}
                        className="mt-6 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-widest text-white/70 hover:bg-white/10 hover:text-white"
                    >
                        Skip
                    </button>
                )}
            </div>
        </div>
    );
};

export default SyncSplash;
