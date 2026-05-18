import { useMemo, useState } from "react";
import { Plane, X, Trash2, History } from "lucide-react";
import { useUser, type FlightLog } from "@/contexts/UserContext";
import { countries } from "@/data/countries";

interface FlightHistoryPanelProps {
    selectedIndex: number | null;
    onSelect: (index: number | null) => void;
}

const formatDate = (ms: number) =>
    new Date(ms).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });

const nameOf = (code: string) => countries.find(c => c.code === code)?.name || code;
const flagOf = (code: string): string => {
    if (!code) return "";
    try {
        return code.toUpperCase().replace(/./g, (c) => String.fromCodePoint(127397 + c.charCodeAt(0)));
    } catch {
        return "";
    }
};

const FlightHistoryPanel = ({ selectedIndex, onSelect }: FlightHistoryPanelProps) => {
    const { flightHistory, clearFlightHistory } = useUser();
    const [open, setOpen] = useState(false);

    const reversed = useMemo(
        () => flightHistory.map((f, i) => ({ flight: f, index: i })).reverse(),
        [flightHistory]
    );

    return (
        <>
            <button
                onClick={() => setOpen(true)}
                aria-label="Flight history"
                className="globe-chrome globe-fab relative"
            >
                <History className="w-5 h-5" />
                {flightHistory.length > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full bg-white text-black text-[10px] font-bold flex items-center justify-center px-1">
                        {flightHistory.length}
                    </span>
                )}
            </button>

            {open && (
                <div
                    className="fixed inset-0 z-[120] flex justify-end bg-black/40 backdrop-blur-sm animate-fade-in"
                    onClick={() => setOpen(false)}
                >
                    <aside
                        className="h-full w-full max-w-sm bg-background border-l border-white/10 flex flex-col"
                        style={{ paddingTop: "env(safe-area-inset-top)" }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <header className="flex items-center justify-between px-5 py-4 border-b border-white/10">
                            <div>
                                <h2 className="text-xl font-serif text-white">Flight History</h2>
                                <p className="text-xs text-white/50 mt-0.5">
                                    {flightHistory.length} {flightHistory.length === 1 ? "trip" : "trips"} logged
                                </p>
                            </div>
                            <button
                                onClick={() => setOpen(false)}
                                className="p-2 rounded-full hover:bg-white/10 text-white/70"
                                aria-label="Close"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </header>

                        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2">
                            {reversed.length === 0 && (
                                <div className="text-center text-white/50 text-sm py-12 px-4">
                                    No flights yet. Mark a country as visited to log your first trip.
                                </div>
                            )}
                            {reversed.map(({ flight, index }) => {
                                const selected = selectedIndex === index;
                                return (
                                    <button
                                        key={`${flight.at}-${index}`}
                                        onClick={() => {
                                            onSelect(selected ? null : index);
                                            setOpen(false);
                                        }}
                                        className={`w-full text-left rounded-xl border px-3 py-3 transition-all ${
                                            selected
                                                ? "border-white/60 bg-white/10"
                                                : "border-white/10 bg-white/[0.03] hover:bg-white/[0.06]"
                                        }`}
                                    >
                                        <div className="flex items-center gap-2 text-sm font-medium text-white">
                                            <span className="text-base">{flagOf(flight.from)}</span>
                                            <span className="truncate">{nameOf(flight.from)}</span>
                                            <Plane className="w-3.5 h-3.5 text-white/60 mx-1 shrink-0" />
                                            <span className="text-base">{flagOf(flight.to)}</span>
                                            <span className="truncate">{nameOf(flight.to)}</span>
                                        </div>
                                        <div className="text-[11px] text-white/50 mt-1">
                                            {formatDate(flight.at)} · Trip #{index + 1}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>

                        {flightHistory.length > 0 && (
                            <footer className="border-t border-white/10 p-3">
                                <button
                                    onClick={() => {
                                        if (confirm("Clear all flight history?")) {
                                            clearFlightHistory();
                                            onSelect(null);
                                        }
                                    }}
                                    className="w-full flex items-center justify-center gap-2 text-xs text-red-400/80 hover:text-red-400 py-2 rounded-lg hover:bg-red-500/10 transition"
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    Clear history
                                </button>
                            </footer>
                        )}
                    </aside>
                </div>
            )}
        </>
    );
};

export default FlightHistoryPanel;
