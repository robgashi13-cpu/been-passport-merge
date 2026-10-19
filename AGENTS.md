# Project conventions
- Dashboard layout normalization lives in `src/hub/layout.ts`; optional widgets start hidden so user-customized layouts remain opt-in.
- Media credentials stay server-side; device downloads use prepared camera blobs or opaque, expiring attachment URLs for large TV files to avoid buffering movies in browser memory.
- Animate transforms and opacity only, respect reduced motion, and pause media refreshes while hidden or offscreen to reduce rendering and network load.