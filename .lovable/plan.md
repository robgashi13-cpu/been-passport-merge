## Scope

Six related fixes/features across the dashboard, trips tab, flight log, and country AI integration.

---

### 1. Dashboard X button accessibility

- Inspect `Dashboard.tsx` / `Header.tsx` to find the close (X) button that dismisses the user-profile dashboard.
- Increase hit-area (min 44×44px), bump z-index so it sits above adjacent cards, add `pointer-events-auto`, and ensure no overlapping element is intercepting clicks.
- Verify on the current 888×535 viewport in the preview.

---

### 2. Flight import: 4/135 skipped → import all

- Open `FlightyImport.tsx` and locate the skip conditions (likely missing IATA, unknown airport, duplicate, or date parse failure).
- Relax/repair the skip logic:
  - Fallback ISO mapping via `iataToIso2.json` and a secondary AI lookup for unknown IATA codes.
  - Treat missing optional fields (aircraft, flight number) as warnings, not skips.
  - Loosen duplicate detection to (date + route + flight#) only when all three are present.
- Log skipped rows to console with reason and surface a "Re-try skipped (n)" button that runs an AI repair pass.

---

### 3. Trips tab: smaller, more compact calendar

- In `TravelCalendar.tsx` (and `ui/calendar.tsx` usage), reduce cell size (`h-9 w-9` → `h-7 w-7`), tighten padding (`p-3` → `p-2`), shrink caption/nav, reduce font sizes.
- Wrap in a `max-w-sm` container so it doesn't stretch full width on mobile.

---

### 4. Flight log redesign + AI facts + calendar collapsed

In the Trips tab:

- **Reorder**: Flight Log first, Travel Calendar becomes a collapsible button ("📅 Open Travel Calendar") that expands on click.
- **Flight Log redesign** (`FlightHistoryList.tsx` / `FlightHistoryPanel.tsx`):
  - Group flights by Year → Month, each group an expandable accordion (collapsed by default; show count + total miles per group).
  - Cleaner row design: airline logo, route (IATA → IATA), date, aircraft, duration.
- **AI Flight Facts banner** on top:
  - New edge function `flight-facts-ai` that takes the user's flight history and returns: most-visited airport, most-flown route, oldest aircraft, most-used airline, longest flight, total distance, busiest year, fun pattern.
  - Cache result for 24h keyed by flight-history hash.
  - Render as horizontally scrollable stat cards.

---

### 5. Background refresh of safety scores + travel data every 48h

- Expand `verify-travel-data` edge function to also return: top destinations per country, visa-free counts per passport, refreshed 2026 safety scores (sourced from AI's latest knowledge with explicit "as of 2026" prompt).
- Change `useDailyAIVerify` → `useBackgroundAIRefresh`:
  - Run every 48h instead of 24h.
  - Store last-run timestamp; on mount if >48h, kick off refresh in background (non-blocking, no UI).
  - Apply overrides via existing `getVerifyOverrides()` pattern, extended for new fields.
- Re-run on app foreground (visibilitychange) if overdue.

---

### 6. Faster, richer country AI insights (multi-source)

- Update `country-tab-ai/index.ts`:
  - Switch default model to `google/gemini-3-flash-preview` for speed.
  - Add a `sources` instruction: "Synthesize from Wikipedia, Grokipedia, official tourism boards, CIA Factbook, and recent news. Cite source names inline where relevant."
  - Expand the `insights` schema with: history highlights, notable people, current events, economic indicators, cuisine highlights, languages spoken with %, safety breakdown by region, scams to avoid, LGBTQ+ travel notes, solo-traveler notes, sustainability rating.
  - For every section, increase array sizes (e.g. `cities` top 50, `funFacts` 10).
- Frontend (`AISectionPanel.tsx`):
  - Pre-warm: when the modal opens, fire requests for **all 6 sections** in parallel (not just the active tab) so subsequent tab switches feel instant.
  - Show streaming skeleton with progressive reveal as fields arrive.
  - Keep 7-day cache; add manual refresh.

---

## Technical Notes

- New edge function: `supabase/functions/flight-facts-ai/index.ts` (register in `config.toml` with `verify_jwt = false`).
- Updated edge function: `supabase/functions/country-tab-ai/index.ts` (schema + prompts).
- Updated edge function: `supabase/functions/verify-travel-data/index.ts` (richer payload, 48h cadence).
- Modified components: `Dashboard.tsx`, `FlightyImport.tsx`, `TravelCalendar.tsx`, `FlightHistoryList.tsx`, `FlightHistoryPanel.tsx`, `AISectionPanel.tsx`, `CountryDetails.tsx`.
- New hook: `useFlightFactsAI.ts`.
- Renamed hook: `useDailyAIVerify.ts` → `useBackgroundAIRefresh.ts` (48h cadence).
- No DB schema changes required (all caching in localStorage).
