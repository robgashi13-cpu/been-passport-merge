# 48-hour camera recording timeline

- Add a compact Timeline section to Cameras for office_top and office_bottom; hide office from this tab.
- Show the last 48 hours of real recordings, empty gaps, Belgrade hour labels, and existing detection markers.
- Tapping the timeline opens up to one hour of recording, using native iPhone/Safari playback and HLS fallback elsewhere.

## Technical details
- Extend only the Frigate proxy with authenticated recording metadata and signed playback URLs expiring after two hours.
- Re-sign neither credentials nor client login tokens into media URLs: use a camera-scoped HMAC derived server-side from existing configuration.
- Rewrite all playlist links through a camera-restricted proxy, preserving Range responses and CORS.
- Add focused coverage, token-expiry, camera-scope, and playlist-rewrite tests; deploy frigate and check build diagnostics.
- No Frigate configuration, database, secrets, KORAUTO, or login changes.
