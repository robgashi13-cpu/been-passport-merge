# Wanderlust Polish Pass

Seven related improvements across the app. Grouped by area to minimize churn.

## 1. Remove the "updating China…" sync splash
- Delete `SyncSplash` rendering from `App.tsx` / `Index.tsx` (whichever mounts it).
- Keep `runColdSync` running silently in the background (no UI). `useColdSync` becomes a fire-and-forget effect; the returned `visible` is forced to `false`.

## 2. Homepage polish + Rank/Achievements expansion
- Add a more "liquid glass / high-tech" treatment to Dashboard cards: layered radial gradients behind hero, subtle animated noise, frosted borders, gold accent glows on hover. Use existing `--gold` token; no new color tokens.
- The current rank chip becomes clickable → opens a new `AchievementsModal` with two tabs:
  - **Stamps** – grid of all earned achievement stamps (existing `Achievements` data) with locked/unlocked states.
  - **Countries** – list of visited countries; each row expands to show that country's stamps (passport-style stamp using country flag + ISO + visit date inside a circular "stamp" SVG with rotated text + dashed border).
- One generated SVG stamp template, tinted per-country via flag-derived hue.

## 3. Per-section AI icons
- Replace the generic `Sparkles`/`Bot` icon currently reused across AI surfaces with section-specific lucide icons:
  - AI Assistant chat → `MessageCircle`
  - Country insight → `Globe2`
  - Recommendations → `Compass`
  - Flight facts → `Plane`
  - Travel search (flight/hotel/car) → `Plane` / `Hotel` / `Car`
  - Section panel → `Wand2`
- Files: `AIAssistant.tsx`, `AICountryInsight.tsx`, `AIRecommendations.tsx`, `AISectionPanel.tsx`, `TravelSearchModal.tsx`, `FlightHistoryPanel.tsx`.

## 4. Travel search alignment + city/airport autocomplete
- Fix spacing/alignment inside `TravelSearchModal` (consistent label/input grid, equal column widths on sm+, tighter chip rows, single source of truth for field padding).
- Add typeahead suggestions for city / airport fields.
  - Reuse `src/data/cities.ts` and IATA codes from `src/data/iataToIso2.json` to build a single in-memory `AIRPORTS` index (IATA + city + country).
  - Combobox shows top 6 matches as the user types `VIE` → "VIE — Vienna, Austria"; selecting fills the field with canonical label.
  - Pure client, no network.

## 5. Explore Destinations → city detail with quick-book actions
- Clicking a destination card opens `ExploreCityModal` (already exists) extended with:
  - Hero, summary, best time, top sights (from existing data; AI for missing fields).
  - Three CTA buttons: **Flights**, **Hotels**, **Rent a car** → opens `TravelSearchModal` with `initialMode` and prefilled city + sensible default dates (today + 7 / +14).
- Add an `initialValues` prop to `TravelSearchModal` and prefill state on open.

## 6. Paginated AI results (more than 3 per category)
- `travel-search-ai` edge function: accept `page` (default 1) and `perCategory` (default 5). Increase `minItems` and prompt for 5 per category per request.
- Results modal groups by category with a "Load more" / numbered pager (1‑5) at the bottom of each section that re-invokes the function for the next page (cached per query+category+page in component state).

## 7. iOS / iPad / Desktop polish pass
- Audit `Dashboard`, `Header`, `BottomNav`, modals for: safe-area insets (`env(safe-area-inset-*)`), tap target sizes ≥44px, sticky header blur on iOS, iPad two-column grid for stat cards, desktop max-width container (1200px) with side padding.
- Add `viewport-fit=cover` if missing in `index.html`.

## Technical notes
- No DB / schema changes.
- Edge function update requires redeploy (handled automatically).
- All colors via semantic tokens; new glass effects use existing `--gold`, `--background`, `--card`.
- Autocomplete index built once at module load (~few KB).

## Out of scope
- Real booking API integration (results stay AI-curated; disclaimer kept).
- New language support, auth changes, schema migrations.
