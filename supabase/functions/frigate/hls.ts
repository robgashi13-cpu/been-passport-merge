/** Camera-scoped, expiring media capabilities. Never contains upstream credentials. */
export const MEDIA_TTL = 2 * 60 * 60;
export const CAMERA_RE = /^[A-Za-z0-9_-]{1,64}$/;
const enc = new TextEncoder();
const b64 = (bytes: Uint8Array) => btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
function un64(value: string) {
  return Uint8Array.from(atob(value.replace(/-/g, '+').replace(/_/g, '/')), (c) => c.charCodeAt(0));
}
async function key(secret: string) {
  if (!secret) throw new Error('Playback signing unavailable');
  return crypto.subtle.importKey('raw', enc.encode(`frigate-vod-v1:${secret}`), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']);
}
export type Grant = { camera: string; exp: number };
export async function signMedia(camera: string, secret: string, now = Math.floor(Date.now() / 1000)) {
  if (!CAMERA_RE.test(camera)) throw new Error('Invalid camera');
  const payload = b64(enc.encode(JSON.stringify({ camera, exp: now + MEDIA_TTL })));
  const signature = await crypto.subtle.sign('HMAC', await key(secret), enc.encode(payload));
  return `${payload}.${b64(new Uint8Array(signature))}`;
}
export async function verifyMedia(token: string, secret: string, now = Math.floor(Date.now() / 1000)): Promise<Grant | null> {
  try {
    if (token.length > 512) return null;
    const parts = token.split('.');
    if (parts.length !== 2) return null;
    if (!await crypto.subtle.verify('HMAC', await key(secret), un64(parts[1]), enc.encode(parts[0]))) return null;
    const grant = JSON.parse(new TextDecoder().decode(un64(parts[0])));
    if (!CAMERA_RE.test(grant.camera) || !Number.isInteger(grant.exp) || grant.exp <= now || grant.exp > now + MEDIA_TTL) return null;
    return grant;
  } catch { return null; }
}
export function safeMediaPath(path: string, camera: string) {
  // No encoded separators, traversal, arbitrary origins, or credential-bearing queries.
  if (path.length > 2048 || /[%\\?#\s]/.test(path) || path.split('/').some((p) => p === '.' || p === '..')) return false;
  return CAMERA_RE.test(camera) && (path.startsWith(`/vod/${camera}/`) || path.startsWith(`/api/vod/${camera}/`)) && /^\/[A-Za-z0-9_./,-]+$/.test(path);
}
export function rewritePlaylist(text: string, playlistPath: string, camera: string, upstream: string, edge: string, token: string) {
  const origin = new URL(upstream).origin;
  const replace = (uri: string) => {
    if (/%|\\/.test(uri) || uri.split('/').some((p) => p === '..' || p === '.')) throw new Error('Invalid playlist path');
    const resolved = new URL(uri, `${origin}${playlistPath}`);
    if (resolved.origin !== origin || resolved.search || resolved.hash || !safeMediaPath(resolved.pathname, camera)) throw new Error('Invalid playlist path');
    return `${edge}/hls?p=${encodeURIComponent(resolved.pathname)}&t=${encodeURIComponent(token)}`;
  };
  return text.split(/\r?\n/).map((line) => {
    if (!line.trim()) return line;
    if (!line.startsWith('#')) return replace(line.trim());
    return line.replace(/URI="([^"]+)"/g, (_, uri) => `URI="${replace(uri)}"`);
  }).join('\n');
}
export function validWindow(start: number, end: number, now = Date.now() / 1000) {
  return Number.isFinite(start) && Number.isFinite(end) && start >= now - 48 * 3600 - 60 && end <= now + 5 && end > start && end - start <= 3600;
}