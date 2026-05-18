// Wanderlust Travel AI — single edge function, four modes:
//  - chat       : streaming travel assistant chat
//  - itinerary  : structured day-by-day plan for a destination
//  - recommend  : ranked next-trip picks based on user context
//  - summary    : short "why visit" blurb for a country

import { convertToModelMessages, streamText, type UIMessage } from "npm:ai@^5.0.0";
import { createOpenAICompatible } from "npm:@ai-sdk/openai-compatible@^1.0.0";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const gateway = createOpenAICompatible({
    name: "lovable",
    baseURL: "https://ai.gateway.lovable.dev/v1",
    headers: {
        "Lovable-API-Key": Deno.env.get("LOVABLE_API_KEY") ?? "",
        "X-Lovable-AIG-SDK": "vercel-ai-sdk",
    },
});

const model = gateway("google/gemini-3-flash-preview");

type Mode = "chat" | "itinerary" | "recommend" | "summary";

interface Body {
    mode: Mode;
    messages?: UIMessage[];
    // shared travel context the client may pass
    passportCode?: string;
    visitedCountries?: string[];
    bucketList?: string[];
    // mode-specific
    destination?: { code: string; name: string };
    days?: number;
    style?: string; // "budget" | "luxury" | "family" | "adventure" | "foodie"
}

function ctxBlock(b: Body) {
    const parts: string[] = [];
    if (b.passportCode) parts.push(`Passport: ${b.passportCode}`);
    if (b.visitedCountries?.length) {
        parts.push(`Visited (${b.visitedCountries.length}): ${b.visitedCountries.slice(0, 40).join(", ")}`);
    }
    if (b.bucketList?.length) parts.push(`Bucket list: ${b.bucketList.slice(0, 20).join(", ")}`);
    return parts.length ? `\n\nUser context:\n${parts.join("\n")}` : "";
}

function systemFor(b: Body): string {
    const base = `You are Wanderlust AI, a warm, concise travel concierge for the WanderPass app.
- Always assume the user is a global traveler tracking countries visited and visa power.
- Use the user's passport for visa-aware advice.
- Prefer real, current, specific recommendations (named neighborhoods, dishes, viewpoints).
- Format with short markdown: bold, bullets, headings. Never wrap entire reply in code blocks.
- Keep replies under ~250 words unless asked for an itinerary or deep-dive.${ctxBlock(b)}`;

    switch (b.mode) {
        case "itinerary":
            return `${base}

Task: Produce a ${b.days ?? 5}-day itinerary for ${b.destination?.name ?? "the destination"}${b.style ? ` in a ${b.style} style` : ""}.
Structure:
### Day N — Theme
- **Morning:** ...
- **Afternoon:** ...
- **Evening:** ...
End with **Practical tips** (transport, SIM, money, one safety note) and **Visa note** for a ${b.passportCode ?? "—"} passport.`;
        case "recommend":
            return `${base}

Task: Recommend the user's next 5 trips. For each: city + country, 1-line hook, best month, rough budget ($-$$$$), and the visa status for their passport. Return as a markdown list. Avoid countries already visited.`;
        case "summary":
            return `${base}

Task: Write a ~90-word "why visit ${b.destination?.name ?? ""}" blurb for a passport holder of ${b.passportCode ?? "—"}.
Include: vibe, 3 must-do experiences (inline bold), best season, and one insider tip. No headings.`;
        default:
            return base;
    }
}

Deno.serve(async (req) => {
    if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

    try {
        const body = (await req.json()) as Body;
        if (!body?.mode) {
            return new Response(JSON.stringify({ error: "mode required" }), {
                status: 400,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        // Build messages depending on mode
        let messages: UIMessage[];
        if (body.mode === "chat") {
            if (!body.messages?.length) {
                return new Response(JSON.stringify({ error: "messages required for chat" }), {
                    status: 400,
                    headers: { ...corsHeaders, "Content-Type": "application/json" },
                });
            }
            messages = body.messages;
        } else {
            // single-shot prompts — synthesize one user turn
            const prompt =
                body.mode === "itinerary"
                    ? `Plan my trip to ${body.destination?.name}.`
                    : body.mode === "summary"
                        ? `Tell me about ${body.destination?.name}.`
                        : `Recommend my next trips.`;
            messages = [
                {
                    id: "u1",
                    role: "user",
                    parts: [{ type: "text", text: prompt }],
                } as unknown as UIMessage,
            ];
        }

        const result = streamText({
            model,
            system: systemFor(body),
            messages: await convertToModelMessages(messages),
        });

        return result.toUIMessageStreamResponse({ headers: corsHeaders });
    } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        const status = /429/.test(message) ? 429 : /402/.test(message) ? 402 : 500;
        return new Response(JSON.stringify({ error: message }), {
            status,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
});
