// Lovable AI-powered country tab data. Returns rich, real, country-specific
// info for whichever section the user is viewing.
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

type Section = "overview" | "cities" | "visa" | "transport" | "climate" | "insights";

const PROMPTS: Record<Section, (name: string, code: string, passport?: string) => string> = {
  overview: (name) => `Rich factual overview of ${name}, synthesized from Wikipedia, Grokipedia, CIA World Factbook, and official tourism boards. Include: 3-sentence summary, 10 surprising fun facts, official languages, currency (with ISO code), capital, population in millions, and 10 major public holidays with exact dates for 2026.`,
  cities: (name) => `Top 50 most important cities in ${name} for travelers (sorted by relevance), from Wikipedia and tourism data. For each: name, region/state, and a 1-sentence reason a tourist would visit. Include capital, biggest tourist hubs, cultural cities, hidden gems.`,
  visa: (name, _code, passport) => `CURRENT 2026 visa info for visiting ${name}${passport ? ` with a ${passport} passport` : ""}, from official government and IATA sources. Include: policy summary (visa-free/on-arrival/e-visa/required + max stay), official e-visa URL, countries with visa-on-arrival in ${name}, countries with visa-free entry, requirements (passport validity, funds, return ticket, vaccinations), processing time, fees in USD.`,
  transport: (name) => `Real transport info for travelers in ${name}: main international airports (IATA, name, city), driving side, ride-hailing apps actually used there, public transport (metro/bus/train system names), domestic flight tips, intercity rail, unique transport (tuk-tuks, boats), and safety notes for transport.`,
  climate: (name) => `Detailed climate for ${name}: 3-sentence overview, best time to visit (months + why), 4 seasons with months and temp ranges in °C, 8 packing tips specific to climate, weather warnings (monsoon, hurricane season, extreme heat).`,
  insights: (name) => `Deep cultural & socio-economic insights for ${name}, synthesized from Wikipedia, Grokipedia, CIA Factbook, World Bank, and recent news. Include: economy (3 sentences with 2026 indicators), safety (3 sentences + region breakdown), culture (3 sentences), 10 etiquette do's and don'ts, religion breakdown with %, famous-for list (food, exports, landmarks, people), GDP per capita USD (2026), HDI, history highlights (5 bullets), notable people (5), current events (3), cuisine highlights (5 dishes), scams to avoid (5), LGBTQ+ travel notes, solo traveler notes, sustainability rating 1-10.`,
};

const SCHEMAS: Record<Section, unknown> = {
  overview: {
    type: "object", additionalProperties: false,
    properties: {
      summary: { type: "string" },
      funFacts: { type: "array", items: { type: "string" } },
      languages: { type: "array", items: { type: "string" } },
      currency: { type: "string" },
      capital: { type: "string" },
      populationMillions: { type: "number" },
      publicHolidays: { type: "array", items: { type: "object", additionalProperties: false, properties: { name: { type: "string" }, date: { type: "string" } }, required: ["name", "date"] } },
    },
    required: ["summary", "funFacts", "languages", "currency", "capital", "publicHolidays"],
  },
  cities: {
    type: "object", additionalProperties: false,
    properties: {
      topCities: { type: "array", items: { type: "object", additionalProperties: false, properties: { name: { type: "string" }, region: { type: "string" }, description: { type: "string" } }, required: ["name", "description"] } },
    },
    required: ["topCities"],
  },
  visa: {
    type: "object", additionalProperties: false,
    properties: {
      policySummary: { type: "string" },
      maxStayDays: { type: "number" },
      eVisaUrl: { type: "string" },
      requirements: { type: "array", items: { type: "string" } },
      visaFreeCountries: { type: "array", items: { type: "string" } },
      visaOnArrivalCountries: { type: "array", items: { type: "string" } },
      processingTime: { type: "string" },
      approxFeeUsd: { type: "string" },
    },
    required: ["policySummary", "requirements"],
  },
  transport: {
    type: "object", additionalProperties: false,
    properties: {
      mainAirports: { type: "array", items: { type: "object", additionalProperties: false, properties: { code: { type: "string" }, name: { type: "string" }, city: { type: "string" } }, required: ["code", "name", "city"] } },
      drivingSide: { type: "string" },
      rideHailingApps: { type: "array", items: { type: "string" } },
      publicTransport: { type: "string" },
      domesticTravelTips: { type: "string" },
      uniqueTransport: { type: "array", items: { type: "string" } },
    },
    required: ["mainAirports", "drivingSide"],
  },
  climate: {
    type: "object", additionalProperties: false,
    properties: {
      summary: { type: "string" },
      bestTimeToVisit: { type: "string" },
      seasons: { type: "array", items: { type: "object", additionalProperties: false, properties: { name: { type: "string" }, months: { type: "string" }, tempRangeC: { type: "string" }, description: { type: "string" } }, required: ["name", "months"] } },
      packingTips: { type: "array", items: { type: "string" } },
      warnings: { type: "array", items: { type: "string" } },
    },
    required: ["summary", "bestTimeToVisit", "seasons"],
  },
  insights: {
    type: "object", additionalProperties: false,
    properties: {
      economy: { type: "string" },
      safety: { type: "string" },
      culture: { type: "string" },
      etiquette: { type: "array", items: { type: "string" } },
      religion: { type: "array", items: { type: "object", additionalProperties: false, properties: { name: { type: "string" }, percentage: { type: "number" } }, required: ["name", "percentage"] } },
      famousFor: { type: "array", items: { type: "string" } },
      gdpPerCapitaUsd: { type: "string" },
      hdi: { type: "string" },
      history: { type: "array", items: { type: "string" } },
      notablePeople: { type: "array", items: { type: "string" } },
      currentEvents: { type: "array", items: { type: "string" } },
      cuisine: { type: "array", items: { type: "string" } },
      scamsToAvoid: { type: "array", items: { type: "string" } },
      lgbtqNotes: { type: "string" },
      soloTravelerNotes: { type: "string" },
      sustainabilityRating: { type: "number" },
    },
    required: ["economy", "safety", "culture"],
  },
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY missing");
    const { countryCode, countryName, section, passportName } = await req.json();
    if (!countryName || !section || !PROMPTS[section as Section]) {
      return new Response(JSON.stringify({ error: "bad request" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const prompt = PROMPTS[section as Section](countryName, countryCode, passportName);
    const schema = SCHEMAS[section as Section];

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "You are a travel data expert. Respond ONLY by calling the provided function with accurate, real-world, current information. Never invent facts. If unsure, omit the field." },
          { role: "user", content: prompt },
        ],
        tools: [{
          type: "function",
          function: {
            name: "return_country_info",
            description: "Return structured country information",
            parameters: schema,
          },
        }],
        tool_choice: { type: "function", function: { name: "return_country_info" } },
      }),
    });

    if (aiRes.status === 429) return new Response(JSON.stringify({ error: "rate_limited" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    if (aiRes.status === 402) return new Response(JSON.stringify({ error: "credits_exhausted" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    if (!aiRes.ok) {
      const t = await aiRes.text();
      throw new Error(`AI ${aiRes.status}: ${t.slice(0, 200)}`);
    }

    const data = await aiRes.json();
    const call = data?.choices?.[0]?.message?.tool_calls?.[0];
    if (!call?.function?.arguments) throw new Error("no tool call");
    const parsed = JSON.parse(call.function.arguments);

    return new Response(JSON.stringify({ ok: true, section, data: parsed }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
