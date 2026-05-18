// Daily AI verification of travel data.
// Uses Lovable AI Gateway to spot-check passport rankings and country safety
// against the model's knowledge and returns any corrections.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PassportSample { code: string; name: string; passportRank?: number; passportScore?: number; }
interface CountrySample  { code: string; name: string; safetyScore?: number; }

interface Payload {
  passports?: PassportSample[];
  countries?: CountrySample[];
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) throw new Error("Missing LOVABLE_API_KEY");

    const body = (await req.json().catch(() => ({}))) as Payload;
    const passports = (body.passports ?? []).slice(0, 25);
    const countries = (body.countries ?? []).slice(0, 60);

    const system = `You are a 2026 travel-data fact checker. The current year is 2026. You are given a small sample of passport rankings (Henley Passport Index — latest 2026 publication) and country safety scores (Gallup Law & Order Index 0-100, latest 2026 publication, taking into account recent geopolitical and crime trend changes). Return ONLY corrections where the stored value is clearly wrong by a meaningful margin (>= 5 points for safety, >= 3 ranks for passports). Be conservative — if uncertain, do not correct.`;

    const user = `Verify the following. Reply ONLY with JSON of shape:
{"passports":[{"code":"XX","passportRank":N}],"countries":[{"code":"XX","safetyScore":N}],"checkedAt":"ISO"}
If nothing needs correcting, return empty arrays.

PASSPORTS: ${JSON.stringify(passports)}
COUNTRIES: ${JSON.stringify(countries)}`;

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Lovable-API-Key": apiKey,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      return new Response(
        JSON.stringify({ error: `AI gateway ${res.status}`, detail: text }),
        { status: res.status, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const json = await res.json();
    const content = json?.choices?.[0]?.message?.content ?? "{}";
    let parsed: any = {};
    try { parsed = JSON.parse(content); } catch { parsed = {}; }

    return new Response(
      JSON.stringify({
        ok: true,
        checkedAt: new Date().toISOString(),
        corrections: {
          passports: Array.isArray(parsed.passports) ? parsed.passports : [],
          countries: Array.isArray(parsed.countries) ? parsed.countries : [],
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
