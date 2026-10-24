# Project conventions
- Dashboard layout normalization lives in `src/hub/layout.ts`; optional widgets start hidden so user-customized layouts remain opt-in.
- Media credentials stay server-side; device downloads use prepared camera blobs or opaque, expiring attachment URLs for large TV files to avoid buffering movies in browser memory.
- Frigate recording playback uses camera-scoped HMAC query capabilities and rewrites all HLS references through a validated VOD-only proxy; native iOS video cannot attach Bearer headers.
- Timeline MP4 downloads validate continuous coverage on issuance and redemption, stream upstream files, and prepare blobs before an explicit save gesture to preserve iOS file-sharing activation.
- Animate transforms and opacity only, respect reduced motion, and pause media refreshes while hidden or offscreen to reduce rendering and network load.