// AI-powered flight & hotel search.
// Returns structured options grouped by Cheapest / Fastest / Best value / AI pick.
// Results are AI-curated estimates (no live booking API) — make this clear in UI.

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";

interface FlightSearch {
    type: "flight";
    from: string;          // city or IATA
    to: string;            // city or IATA
    departDate: string;    // ISO date
    returnDate?: string;
    passengers?: number;
    cabin?: "economy" | "premium" | "business" | "first";
}

interface HotelSearch {
    type: "hotel";
    city: string;
    checkIn: string;
    checkOut: string;
    guests?: number;
    budget?: "any" | "budget" | "mid" | "luxury";
    vibe?: string;         // free text e.g. "near beach, walkable"
}

interface CarSearch {
    type: "car";
    city: string;
    pickupDate: string;
    dropoffDate: string;
    carType?: "any" | "economy" | "compact" | "suv" | "luxury" | "van";
    drivers?: number;
}

type Body = FlightSearch | HotelSearch | CarSearch;

const flightTool = {
    type: "function",
    function: {
        name: "return_flight_options",
        description: "Return curated flight options",
        parameters: {
            type: "object",
            additionalProperties: false,
            properties: {
                summary: { type: "string", description: "1-line route summary" },
                disclaimer: { type: "string" },
                options: {
                    type: "array",
                    minItems: 4,
                    items: {
                        type: "object",
                        additionalProperties: false,
                        properties: {
                            category: { type: "string", enum: ["cheapest", "fastest", "best_value", "ai_pick"] },
                            airline: { type: "string" },
                            flightNumber: { type: "string" },
                            from: { type: "string", description: "IATA" },
                            to: { type: "string", description: "IATA" },
                            stops: { type: "integer" },
                            stopCities: { type: "array", items: { type: "string" } },
                            departTime: { type: "string", description: "HH:MM local" },
                            arriveTime: { type: "string" },
                            durationMinutes: { type: "integer" },
                            priceUSD: { type: "integer" },
                            cabin: { type: "string" },
                            aircraft: { type: "string" },
                            rating: { type: "number", description: "0-5 star, one decimal" },
                            whyPick: { type: "string", description: "1 sentence" },
                            bookingPlatforms: { type: "array", items: { type: "string" } }
                        },
                        required: ["category", "airline", "from", "to", "stops", "departTime", "arriveTime", "durationMinutes", "priceUSD", "rating", "whyPick", "bookingPlatforms"]
                    }
                }
            },
            required: ["summary", "options", "disclaimer"]
        }
    }
};

const hotelTool = {
    type: "function",
    function: {
        name: "return_hotel_options",
        description: "Return curated hotel options",
        parameters: {
            type: "object",
            additionalProperties: false,
            properties: {
                summary: { type: "string" },
                disclaimer: { type: "string" },
                options: {
                    type: "array",
                    minItems: 4,
                    items: {
                        type: "object",
                        additionalProperties: false,
                        properties: {
                            category: { type: "string", enum: ["cheapest", "best_value", "luxury", "ai_pick"] },
                            name: { type: "string" },
                            neighborhood: { type: "string" },
                            starClass: { type: "integer", description: "Hotel star class 1-5" },
                            rating: { type: "number", description: "Guest score 0-5, one decimal" },
                            priceUSDPerNight: { type: "integer" },
                            totalUSD: { type: "integer" },
                            amenities: { type: "array", items: { type: "string" } },
                            distanceToCenter: { type: "string", description: "e.g. '5 min walk to old town'" },
                            whyPick: { type: "string" },
                            bookingPlatforms: { type: "array", items: { type: "string" } }
                        },
                        required: ["category", "name", "neighborhood", "starClass", "rating", "priceUSDPerNight", "totalUSD", "amenities", "whyPick", "bookingPlatforms"]
                    }
                }
            },
            required: ["summary", "options", "disclaimer"]
        }
    }
};

const carTool = {
    type: "function",
    function: {
        name: "return_car_options",
        description: "Return curated rental car options across major companies",
        parameters: {
            type: "object",
            additionalProperties: false,
            properties: {
                summary: { type: "string" },
                disclaimer: { type: "string" },
                options: {
                    type: "array",
                    minItems: 4,
                    items: {
                        type: "object",
                        additionalProperties: false,
                        properties: {
                            category: { type: "string", enum: ["cheapest", "best_value", "luxury", "ai_pick"] },
                            company: { type: "string", description: "Real rental company e.g. Hertz, Avis, Sixt, Enterprise, Europcar, Budget, Alamo, National, Localiza" },
                            carModel: { type: "string", description: "e.g. Toyota Corolla or similar" },
                            carType: { type: "string", description: "economy/compact/suv/luxury/van" },
                            seats: { type: "integer" },
                            transmission: { type: "string", enum: ["automatic", "manual"] },
                            pricePerDayUSD: { type: "integer" },
                            totalUSD: { type: "integer" },
                            pickupLocation: { type: "string", description: "e.g. 'Lisbon Airport (LIS)' or 'Downtown'" },
                            mileagePolicy: { type: "string", description: "e.g. 'Unlimited mileage'" },
                            rating: { type: "number", description: "0-5, one decimal" },
                            features: { type: "array", items: { type: "string" } },
                            whyPick: { type: "string" },
                            bookingPlatforms: { type: "array", items: { type: "string" } }
                        },
                        required: ["category", "company", "carModel", "carType", "transmission", "pricePerDayUSD", "totalUSD", "pickupLocation", "rating", "whyPick", "bookingPlatforms"]
                    }
                }
            },
            required: ["summary", "options", "disclaimer"]
        }
    }
};

function buildPrompt(b: Body): { system: string; user: string; tool: any } {
    if (b.type === "flight") {
        return {
            system: `You are Wanderlust AI's flight scout. Generate 4 realistic flight options for a route based on your knowledge of airline networks, schedules, and typical pricing. Use REAL airlines that actually fly this route. Use realistic IATA codes, flight numbers, durations, and prices. Cover four categories: cheapest, fastest, best_value, ai_pick. The ai_pick should be the one YOU recommend overall balancing comfort, timing, and value — explain why in whyPick. bookingPlatforms should list 2-3 real platforms (Google Flights, Skyscanner, Kayak, airline.com). Be FAST and concise.`,
            user: `Find flights:\n- From: ${b.from}\n- To: ${b.to}\n- Depart: ${b.departDate}${b.returnDate ? `\n- Return: ${b.returnDate}` : ""}\n- Passengers: ${b.passengers ?? 1}\n- Cabin: ${b.cabin ?? "economy"}`,
            tool: flightTool
        };
    }
    if (b.type === "hotel") {
        const nights = Math.max(1, Math.round((new Date(b.checkOut).getTime() - new Date(b.checkIn).getTime()) / 86400000));
        return {
            system: `You are Wanderlust AI's hotel scout. Generate 4 real hotel options in the requested city using your knowledge of actual hotels. Use REAL hotel names that exist. Realistic neighborhoods, star classes, guest ratings, and per-night pricing for the dates. Cover four categories: cheapest, best_value, luxury, ai_pick. The ai_pick should be the one YOU recommend overall — explain why in whyPick. bookingPlatforms should list 2-3 real platforms (Booking.com, Hotels.com, Agoda, the hotel's own site). Be FAST and concise.`,
            user: `Find hotels:\n- City: ${b.city}\n- Check-in: ${b.checkIn}\n- Check-out: ${b.checkOut} (${nights} night${nights > 1 ? "s" : ""})\n- Guests: ${b.guests ?? 2}\n- Budget: ${b.budget ?? "any"}${b.vibe ? `\n- Vibe / preferences: ${b.vibe}` : ""}`,
            tool: hotelTool
        };
    }
    // car
    const days = Math.max(1, Math.round((new Date(b.dropoffDate).getTime() - new Date(b.pickupDate).getTime()) / 86400000));
    return {
        system: `You are Wanderlust AI's car rental scout. Compare across ALL major rental companies operating in the requested city (Hertz, Avis, Sixt, Enterprise, Europcar, Budget, Alamo, National, plus relevant local market leaders like Localiza in Brazil, OK Mobility in Spain, etc). Generate 4 real options covering: cheapest, best_value, luxury, ai_pick. Use REAL company names and realistic pricing for the city and dates. The ai_pick should be the one YOU recommend overall — explain why in whyPick. bookingPlatforms must list 2-3 real platforms (Kayak, Rentalcars.com, DiscoverCars, the company's own site). Be FAST and concise.`,
        user: `Find rental cars:\n- City: ${b.city}\n- Pickup: ${b.pickupDate}\n- Drop-off: ${b.dropoffDate} (${days} day${days > 1 ? "s" : ""})\n- Car type: ${b.carType ?? "any"}\n- Drivers: ${b.drivers ?? 1}`,
        tool: carTool
    };
}

Deno.serve(async (req) => {
    if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

    try {
        const body = (await req.json()) as Body;
        if (!body?.type || !["flight", "hotel", "car"].includes(body.type)) {
            return new Response(JSON.stringify({ ok: false, error: "type must be 'flight', 'hotel' or 'car'" }), {
                status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" }
            });
        }


        const apiKey = Deno.env.get("LOVABLE_API_KEY");
        if (!apiKey) {
            return new Response(JSON.stringify({ ok: false, error: "LOVABLE_API_KEY missing" }), {
                status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" }
            });
        }

        const { system, user, tool } = buildPrompt(body);

        const resp = await fetch(GATEWAY, {
            method: "POST",
            headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
            body: JSON.stringify({
                model: "google/gemini-3-flash-preview",
                messages: [
                    { role: "system", content: system },
                    { role: "user", content: user }
                ],
                tools: [tool],
                tool_choice: { type: "function", function: { name: tool.function.name } }
            })
        });

        if (!resp.ok) {
            const text = await resp.text();
            const status = resp.status === 429 ? 429 : resp.status === 402 ? 402 : 500;
            return new Response(JSON.stringify({ ok: false, error: `AI gateway ${resp.status}: ${text.slice(0, 200)}` }), {
                status, headers: { ...corsHeaders, "Content-Type": "application/json" }
            });
        }

        const data = await resp.json();
        const call = data?.choices?.[0]?.message?.tool_calls?.[0];
        if (!call?.function?.arguments) {
            return new Response(JSON.stringify({ ok: false, error: "No tool call returned" }), {
                status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" }
            });
        }
        let parsed: any;
        try { parsed = JSON.parse(call.function.arguments); }
        catch { return new Response(JSON.stringify({ ok: false, error: "Bad JSON" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }); }

        return new Response(JSON.stringify({ ok: true, kind: body.type, data: parsed }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        return new Response(JSON.stringify({ ok: false, error: msg }), {
            status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
    }
});
