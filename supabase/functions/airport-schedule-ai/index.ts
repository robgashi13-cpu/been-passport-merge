// Generates a plausible daily departures / arrivals schedule for any IATA airport
// using real-world airline + route knowledge from the AI model. Cached client-side.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

const SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    airportName: { type: "string" },
    departures: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          airline: { type: "string" },
          flight: { type: "string" },
          destination: { type: "string" },
          destinationCode: { type: "string" },
          scheduledTime: { type: "string", description: "HH:MM 24h" },
        },
        required: ["airline", "flight", "destination", "destinationCode", "scheduledTime"],
      },
    },
    arrivals: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          airline: { type: "string" },
          flight: { type: "string" },
          origin: { type: "string" },
          originCode: { type: "string" },
          scheduledTime: { type: "string" },
        },
        required: ["airline", "flight", "origin", "originCode", "scheduledTime"],
      },
    },
  },
  required: ["airportName", "departures", "arrivals"],
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY missing");
    const { iata } = await req.json();
    const code = String(iata || "").toUpperCase().slice(0, 3);
    if (code.length !== 3) {
      return new Response(JSON.stringify({ ok: false, error: "invalid iata" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const prompt = `Generate a realistic typical daily schedule for airport ${code}.
Use REAL airlines and route pairs that actually serve this airport in 2025-2026.
Return 14-18 departures and 14-18 arrivals spread across the day (06:00 – 23:30).
Flight numbers should match the airline's actual IATA prefix.
Destination/origin codes must be real IATA codes.`;

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Authorization": `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "You are an aviation schedule expert. Use only real airline and route information. Return data via the tool call." },
          { role: "user", content: prompt },
        ],
        tools: [{ type: "function", function: { name: "return_schedule", description: "Return airport schedule", parameters: SCHEMA } }],
        tool_choice: { type: "function", function: { name: "return_schedule" } },
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
