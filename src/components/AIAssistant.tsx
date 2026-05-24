import { useState, useRef, useEffect } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import ReactMarkdown from "react-markdown";
import { Sparkles, Send, X, Plane, MapPin, Compass, Loader2 } from "lucide-react";
import { useTravelData } from "@/hooks/useTravelData";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const ENDPOINT = `${SUPABASE_URL}/functions/v1/travel-ai`;

interface AIAssistantProps {
    initialDestination?: { code: string; name: string } | null;
}

export const AIAssistant = ({ initialDestination }: AIAssistantProps = {}) => {
    const [open, setOpen] = useState(false);
    const [input, setInput] = useState("");
    const { userPassport, visitedCountries, bucketList } = useTravelData();

    const transport = useRef(
        new DefaultChatTransport({
            api: ENDPOINT,
            body: () => ({
                mode: "chat",
                passportCode: userPassport,
                visitedCountries,
                bucketList,
            }),
        })
    );

    const { messages, sendMessage, status, error, setMessages } = useChat({
        transport: transport.current,
    });

    const scrollRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    }, [messages, status]);

    // Greeting when opened first time
    useEffect(() => {
        if (open && messages.length === 0) {
            const greet =
                initialDestination
                    ? `✨ **Welcome to Wanderlust AI**\n\nI'm your private travel concierge. Ask me anything about **${initialDestination.name}** — itineraries, where to stay, hidden food spots, visa requirements, the best season to go.\n\n💡 *Insider tip:* the more specific your question, the sharper my picks.`
                    : `✨ **Welcome to Wanderlust AI**\n\nI'm your private travel concierge — here to plan, recommend, and answer anything travel.\n\n- ✈️ Plan a trip day-by-day\n- 🗺️ Where should I go next (passport-aware)\n- 🏨 Best stays for your style & budget\n- 🛂 Visa rules in plain language\n\n💡 *Insider tip:* tell me your dates and budget for sharper results.`;
            setMessages([
                {
                    id: "greet",
                    role: "assistant",
                    parts: [{ type: "text", text: greet }],
                } as unknown as UIMessage,
            ]);
        }
    }, [open]);

    const isBusy = status === "submitted" || status === "streaming";

    const onSubmit = async (e?: React.FormEvent) => {
        e?.preventDefault();
        const text = input.trim();
        if (!text || isBusy) return;
        setInput("");
        await sendMessage({ text });
    };

    const quickAsk = async (text: string) => {
        if (isBusy) return;
        await sendMessage({ text });
    };

    return (
        <>
            {/* Floating launcher — sits above the bottom nav */}
            <button
                onClick={() => setOpen(true)}
                aria-label="Open AI travel assistant"
                className="fixed right-4 z-[90] flex items-center gap-2 rounded-full
                           bg-gradient-to-br from-[hsl(var(--gold))] to-[hsl(45_85%_50%)]
                           text-black font-semibold px-4 py-3 shadow-[0_8px_30px_-6px_hsl(var(--gold)/0.6)]
                           hover:scale-[1.04] active:scale-95 transition-transform"
                style={{ bottom: "calc(env(safe-area-inset-bottom) + 6.5rem)" }}
            >
                <Sparkles className="w-4 h-4" />
                <span className="text-sm">Ask AI</span>
            </button>

            {open && (
                <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in">
                    <div
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={() => setOpen(false)}
                    />
                    <div
                        className="relative w-full sm:max-w-lg h-[85dvh] sm:h-[78dvh] sm:rounded-3xl rounded-t-3xl
                                   border border-white/10 bg-[hsl(var(--card)/0.95)] backdrop-blur-2xl
                                   shadow-[0_30px_80px_-20px_rgba(0,0,0,0.8)] flex flex-col overflow-hidden"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[hsl(var(--gold))] to-amber-600 flex items-center justify-center">
                                    <Sparkles className="w-4 h-4 text-black" />
                                </div>
                                <div>
                                    <div className="font-display text-lg font-semibold text-white">Wanderlust AI</div>
                                    <div className="text-[11px] text-white/50">Your travel concierge</div>
                                </div>
                            </div>
                            <button
                                onClick={() => setOpen(false)}
                                className="p-2 rounded-full hover:bg-white/10 text-white/70"
                                aria-label="Close"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Messages */}
                        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
                            {messages.map((m) => {
                                const text = m.parts
                                    .map((p: any) => (p.type === "text" ? p.text : ""))
                                    .join("");
                                if (m.role === "user") {
                                    return (
                                        <div key={m.id} className="flex justify-end">
                                            <div className="max-w-[85%] rounded-2xl rounded-br-sm
                                                            bg-[hsl(var(--gold)/0.18)] border border-[hsl(var(--gold)/0.35)]
                                                            text-white px-4 py-2.5 text-[14px]">
                                                {text}
                                            </div>
                                        </div>
                                    );
                                }
                                return (
                                    <div key={m.id} className="flex">
                                        <div className="max-w-[92%] text-white/90 text-[14px] leading-relaxed
                                                        prose prose-invert prose-sm !max-w-none
                                                        prose-p:my-2 prose-p:leading-relaxed
                                                        prose-ul:my-2 prose-ul:pl-5 prose-li:my-1 prose-li:marker:text-[hsl(var(--gold)/0.7)]
                                                        prose-ol:my-2 prose-ol:pl-5
                                                        prose-headings:text-white prose-headings:font-semibold prose-headings:tracking-tight
                                                        prose-h2:text-[15px] prose-h2:mt-4 prose-h2:mb-2 prose-h2:pb-1 prose-h2:border-b prose-h2:border-[hsl(var(--gold)/0.2)]
                                                        prose-h3:text-[14px] prose-h3:mt-3 prose-h3:mb-1.5 prose-h3:text-[hsl(var(--gold))]
                                                        prose-strong:text-[hsl(var(--gold))] prose-strong:font-semibold
                                                        prose-hr:my-3 prose-hr:border-white/10
                                                        prose-blockquote:border-l-2 prose-blockquote:border-[hsl(var(--gold)/0.5)] prose-blockquote:pl-3 prose-blockquote:italic prose-blockquote:text-white/75
                                                        prose-code:text-[hsl(var(--gold))] prose-code:bg-white/5 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:before:content-none prose-code:after:content-none
                                                        prose-a:text-[hsl(var(--gold))] prose-a:no-underline hover:prose-a:underline">
                                            <ReactMarkdown>{text || "…"}</ReactMarkdown>
                                        </div>
                                    </div>
                                );
                            })}
                            {status === "submitted" && (
                                <div className="flex items-center gap-2 text-white/50 text-sm">
                                    <Loader2 className="w-4 h-4 animate-spin" /> Thinking…
                                </div>
                            )}
                            {error && (
                                <div className="text-red-400 text-xs px-2">
                                    {error.message?.includes("429")
                                        ? "Rate limit hit — try again in a moment."
                                        : error.message?.includes("402")
                                            ? "AI credits exhausted. Add credits in Settings → Workspace → Usage."
                                            : "Something went wrong. Please retry."}
                                </div>
                            )}
                        </div>

                        {/* Quick actions */}
                        {messages.length <= 1 && (
                            <div className="px-4 pb-2 flex flex-wrap gap-2">
                                <QuickChip onClick={() => quickAsk("Recommend 5 trips for me based on my passport and what I've already visited.")} icon={Compass}>
                                    Where next?
                                </QuickChip>
                                <QuickChip onClick={() => quickAsk("Plan a 5-day itinerary for Tokyo in a foodie style.")} icon={Plane}>
                                    Plan 5 days in Tokyo
                                </QuickChip>
                                <QuickChip onClick={() => quickAsk("Which countries near me are visa-free for my passport?")} icon={MapPin}>
                                    Visa-free near me
                                </QuickChip>
                            </div>
                        )}

                        {/* Composer */}
                        <form
                            onSubmit={onSubmit}
                            className="flex items-end gap-2 p-3 border-t border-white/10 bg-black/30"
                        >
                            <textarea
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter" && !e.shiftKey) {
                                        e.preventDefault();
                                        onSubmit();
                                    }
                                }}
                                rows={1}
                                placeholder="Ask anything about travel…"
                                className="flex-1 resize-none bg-white/5 border border-white/10 rounded-2xl
                                           px-4 py-2.5 text-white text-[14px] placeholder:text-white/40
                                           focus:outline-none focus:border-[hsl(var(--gold)/0.5)]
                                           max-h-32"
                            />
                            <button
                                type="submit"
                                disabled={isBusy || !input.trim()}
                                className="h-11 w-11 flex items-center justify-center rounded-full
                                           bg-[hsl(var(--gold))] text-black disabled:opacity-40
                                           hover:scale-105 active:scale-95 transition-transform"
                                aria-label="Send"
                            >
                                {isBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
};

const QuickChip = ({
    onClick,
    icon: Icon,
    children,
}: {
    onClick: () => void;
    icon: any;
    children: React.ReactNode;
}) => (
    <button
        onClick={onClick}
        className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full
                   bg-white/5 border border-white/10 text-white/80 hover:bg-white/10 transition-colors"
    >
        <Icon className="w-3.5 h-3.5 text-[hsl(var(--gold))]" />
        {children}
    </button>
);
