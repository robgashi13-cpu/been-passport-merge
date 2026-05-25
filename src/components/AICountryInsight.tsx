import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import { Globe2, Loader2, Plane } from "lucide-react";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const ENDPOINT = `${SUPABASE_URL}/functions/v1/travel-ai`;

interface AICountryInsightProps {
    countryCode: string;
    countryName: string;
    passportCode?: string;
}

export const AICountryInsight = ({ countryCode, countryName, passportCode }: AICountryInsightProps) => {
    const [summary, setSummary] = useState<string>("");
    const [loading, setLoading] = useState(false);
    const [itinerary, setItinerary] = useState<string>("");
    const [genItinerary, setGenItinerary] = useState(false);

    useEffect(() => {
        let cancelled = false;
        const run = async () => {
            setSummary("");
            setItinerary("");
            setLoading(true);
            try {
                const text = await streamFromAI({
                    mode: "summary",
                    destination: { code: countryCode, name: countryName },
                    passportCode,
                });
                if (!cancelled) setSummary(text);
            } catch (e: any) {
                if (!cancelled) setSummary(formatError(e));
            } finally {
                if (!cancelled) setLoading(false);
            }
        };
        run();
        return () => { cancelled = true; };
    }, [countryCode, countryName, passportCode]);

    const handleItinerary = async () => {
        setGenItinerary(true);
        setItinerary("");
        try {
            const text = await streamFromAI({
                mode: "itinerary",
                destination: { code: countryCode, name: countryName },
                passportCode,
                days: 5,
            });
            setItinerary(text);
        } catch (e: any) {
            setItinerary(formatError(e));
        } finally {
            setGenItinerary(false);
        }
    };

    return (
        <div className="my-4 space-y-3">
            <div className="rounded-2xl border border-[hsl(var(--gold)/0.3)]
                            bg-gradient-to-br from-[hsl(var(--gold)/0.06)] to-transparent p-4">
                <div className="flex items-center gap-2 mb-2">
                    <Globe2 className="w-4 h-4 text-[hsl(var(--gold))]" />
                    <h4 className="font-display text-sm font-semibold text-white">AI Insight</h4>
                </div>
                {loading && !summary ? (
                    <div className="flex items-center gap-2 text-white/50 text-xs">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" /> Generating…
                    </div>
                ) : (
                    <div className="prose prose-invert prose-sm prose-p:my-1 max-w-none text-white/85 text-[13px] leading-relaxed">
                        <ReactMarkdown>{summary}</ReactMarkdown>
                    </div>
                )}
            </div>

            <button
                onClick={handleItinerary}
                disabled={genItinerary}
                className="w-full flex items-center justify-center gap-2
                           rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10
                           text-white text-sm font-medium py-3 transition-colors disabled:opacity-60"
            >
                {genItinerary ? (
                    <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Building your 5-day plan…
                    </>
                ) : (
                    <>
                        <Plane className="w-4 h-4 text-[hsl(var(--gold))]" />
                        Generate 5-day itinerary
                    </>
                )}
            </button>

            {itinerary && (
                <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
                    <div className="prose prose-invert prose-sm max-w-none text-white/85 text-[13px]
                                    prose-headings:text-white prose-strong:text-[hsl(var(--gold))]">
                        <ReactMarkdown>{itinerary}</ReactMarkdown>
                    </div>
                </div>
            )}
        </div>
    );
};

async function streamFromAI(payload: any): Promise<string> {
    const res = await fetch(ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`${res.status}`);
    if (!res.body) throw new Error("No body");
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let text = "";
    // AI SDK ui-message stream is SSE-like ("data: ...\n\n"). Pull text deltas.
    while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed.startsWith("data:")) continue;
            const data = trimmed.slice(5).trim();
            if (!data || data === "[DONE]") continue;
            try {
                const json = JSON.parse(data);
                // ui-message stream parts: { type: "text-delta", delta: "..." }
                if (json.type === "text-delta" && typeof json.delta === "string") {
                    text += json.delta;
                } else if (json.type === "text" && typeof json.text === "string") {
                    text = json.text;
                }
            } catch { /* skip non-JSON heartbeats */ }
        }
    }
    return text;
}

function formatError(e: any): string {
    const msg = String(e?.message || e || "");
    if (msg.includes("429")) return "_AI rate-limited — try again in a moment._";
    if (msg.includes("402")) return "_AI credits exhausted. Add credits in Settings → Workspace → Usage._";
    return "_Couldn't generate AI insight right now._";
}
