import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { Compass, Loader2, RefreshCw } from "lucide-react";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const ENDPOINT = `${SUPABASE_URL}/functions/v1/travel-ai`;

interface Props {
    passportCode?: string | null;
    visitedCountries: string[];
    bucketList?: string[];
}

export const AIRecommendations = ({ passportCode, visitedCountries, bucketList = [] }: Props) => {
    const [content, setContent] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const generate = async () => {
        setLoading(true);
        setError("");
        setContent("");
        try {
            const res = await fetch(ENDPOINT, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    mode: "recommend",
                    passportCode: passportCode ?? undefined,
                    visitedCountries,
                    bucketList,
                }),
            });
            if (!res.ok || !res.body) throw new Error(`${res.status}`);
            const reader = res.body.getReader();
            const decoder = new TextDecoder();
            let buffer = "";
            let text = "";
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split("\n");
                buffer = lines.pop() ?? "";
                for (const line of lines) {
                    const t = line.trim();
                    if (!t.startsWith("data:")) continue;
                    const d = t.slice(5).trim();
                    if (!d || d === "[DONE]") continue;
                    try {
                        const j = JSON.parse(d);
                        if (j.type === "text-delta" && typeof j.delta === "string") {
                            text += j.delta;
                            setContent(text);
                        } else if (j.type === "text" && typeof j.text === "string") {
                            text = j.text;
                            setContent(text);
                        }
                    } catch { }
                }
            }
        } catch (e: any) {
            const msg = String(e?.message || "");
            setError(
                msg.includes("429")
                    ? "Rate limited — try again in a moment."
                    : msg.includes("402")
                        ? "AI credits exhausted. Add credits in Settings → Workspace → Usage."
                        : "Couldn't generate recommendations."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="rounded-3xl border border-[hsl(var(--gold)/0.3)]
                        bg-gradient-to-br from-[hsl(var(--gold)/0.08)] via-transparent to-transparent
                        p-5">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[hsl(var(--gold))] to-amber-600 flex items-center justify-center">
                        <Compass className="w-4 h-4 text-black" />
                    </div>
                    <div>
                        <h3 className="font-display text-base font-semibold text-white">AI Picks for You</h3>
                        <p className="text-[11px] text-white/50">Personalized to your passport & history</p>
                    </div>
                </div>
                {content && !loading && (
                    <button
                        onClick={generate}
                        className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-white/70"
                        aria-label="Regenerate"
                    >
                        <RefreshCw className="w-3.5 h-3.5" />
                    </button>
                )}
            </div>

            {!content && !loading && !error && (
                <button
                    onClick={generate}
                    className="w-full py-3 rounded-2xl bg-[hsl(var(--gold))] text-black font-semibold text-sm
                               hover:scale-[1.01] active:scale-95 transition-transform"
                >
                    Get my next-trip suggestions
                </button>
            )}

            {loading && !content && (
                <div className="flex items-center gap-2 text-white/60 text-sm py-2">
                    <Loader2 className="w-4 h-4 animate-spin" /> Analyzing your travel profile…
                </div>
            )}

            {content && (
                <div className="prose prose-invert prose-sm max-w-none text-white/85
                                prose-headings:text-white prose-strong:text-[hsl(var(--gold))]
                                prose-li:my-0.5 prose-p:my-1">
                    <ReactMarkdown>{content}</ReactMarkdown>
                </div>
            )}

            {error && <p className="text-red-400 text-xs mt-2">{error}</p>}
        </div>
    );
};
