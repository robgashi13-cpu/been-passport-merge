// AI-generated insights from a user's flight history.
// Receives a flight summary (counts only — no PII) and returns rich, real-world
// facts: most-visited airport, most-flown route, most-used airline, oldest
// aircraft model in fleet, longest leg, most-visited country, fun pattern.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

const SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    headline: { type: "string", description: "One-sentence punchy summary of the traveler's pattern" },
    facts: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          label: { type: "string" },
          value: { type: "string" },
          detail: { type: "string" },
          emoji: { type: "string" },
        },
        required: ["label", "value"],
      },
    },
    trivia: { type: "array", items: { type: "string" }, description: "3-5 real, surprising trivia bits about specific aircraft, airlines, or airports in this log" },
  },
  required: ["headline", "facts"],
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY missing");
    const { stats } = await req.json();
    if (!stats) {
      return new Response(JSON.stringify({ ok: false, error: "missing stats" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const prompt = `Here is a traveler's flight history (aggregated). Generate punchy, factual insights using REAL knowledge about the airlines, airports, aircraft and routes mentioned. No invented stats.

Flight summary:
- total flights: ${stats.totalFlights}
- countries touched: ${stats.countries}
- total distance km (approx): ${stats.totalKm}
- airport visit counts (top): ${JSON.stringify(stats.topAirports)}
- route counts (top): ${JSON.stringify(stats.topRoutes)}
- airline counts (top): ${JSON.stringify(stats.topAirlines)}
- aircraft models flown (with counts): ${JSON.stringify(stats.aircraft)}
- earliest year: ${stats.firstYear}, latest year: ${stats.lastYear}, busiest year: ${stats.busiestYear} (${stats.busiestYearCount} flights)
- longest single leg: ${stats.longestLegKm} km (${stats.longestLegRoute})

Produce 6-8 "facts" tiles, each with label (e.g. "Most-visited airport"), value (e.g. "VIE · Vienna"), short detail with a REAL fact about that airport/airline/aircraft, and an emoji. Then give 3-5 trivia lines (e.g. "Your most-flown plane, the A320, first flew in 1987"). Be specific, never generic.`;

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "You are an aviation analyst. Use ONLY real-world facts about airports, airlines, and aircraft. Return data via the tool call." },
          { role: "user", content: prompt },
        ],
        tools: [{
          type: "function",
          function: { name: "return_flight_facts", description: "Return flight insights", parameters: SCHEMA },
        }],
        tool_choice: { type: "function", function: { name: "return_flight_facts" } },
      }),
    });

    if (aiRes.status === 429) return new Response(JSON.stringify({ ok: false, error: "rate_limited" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    if (aiRes.status === 402) return new Response(JSON.stringify({ ok: false, error: "credits_exhausted" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    if (!aiRes.ok) throw new Error(`AI ${aiRes.status}`);

    const data = await aiRes.json();
    const call = data?.choices?.[0]?.message?.tool_calls?.[0];
    if (!call?.function?.arguments) throw new Error("no tool call");
    const parsed = JSON.parse(call.function.arguments);

    return new Response(JSON.stringify({ ok: true, data: parsed }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
