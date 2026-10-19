// WanderPass IPTV home media proxy (zero dependencies, Node 18+).
// Why: the IPTV provider refuses stream requests from cloud/datacenter IPs (HTTP 511), so the
// Supabase edge function can list channels but cannot relay video. This proxy runs on a home
// machine (residential IP) and relays ONLY the sealed media tokens minted by the `iptv` edge
// function (signed-in + allowlisted users). Tokens are AES-256-GCM encrypted and expire; each one
// can fetch exactly one upstream URL. No provider credentials are stored here.
//
// Env: IPTV_TOKEN_KEY or IPTV_TOKEN_KEY_FILE (same value as hq_secrets.iptv_token_key), PORT (default 8789).
// Expose with e.g.:  tailscale funnel --bg --set-path /iptv http://127.0.0.1:8789
import http from 'node:http';
import crypto from 'node:crypto';
import { Readable } from 'node:stream';
import fs from 'node:fs';
import net from 'node:net';

const PORT = Number(process.env.PORT || 8789);
const SECRET = (process.env.IPTV_TOKEN_KEY || (process.env.IPTV_TOKEN_KEY_FILE ? fs.readFileSync(process.env.IPTV_TOKEN_KEY_FILE, 'utf8') : '')).trim();
if (SECRET.length < 32) { console.error('IPTV_TOKEN_KEY missing/short'); process.exit(1); }
const KEY = crypto.createHash('sha256').update('wanderpass-iptv-v1:' + SECRET).digest();
const UA = 'VLC/3.0.20 LibVLC/3.0.20';
const CORS = {
  'access-control-allow-origin': '*',
  'access-control-allow-headers': 'range, content-type',
  'access-control-allow-methods': 'GET, HEAD, OPTIONS',
  'access-control-expose-headers': 'content-length, content-range, accept-ranges',
};

const b64u = (b) => Buffer.from(b).toString('base64url');
function seal(obj) {
  const iv = crypto.randomBytes(12);
  const c = crypto.createCipheriv('aes-256-gcm', KEY, iv);
  const ct = Buffer.concat([c.update(JSON.stringify(obj)), c.final(), c.getAuthTag()]);
  return b64u(Buffer.concat([iv, ct]));
}
function unseal(tok, kind) {
  try {
    const b = Buffer.from(tok, 'base64url');
    const d = crypto.createDecipheriv('aes-256-gcm', KEY, b.subarray(0, 12));
    d.setAuthTag(b.subarray(b.length - 16));
    const o = JSON.parse(Buffer.concat([d.update(b.subarray(12, b.length - 16)), d.final()]).toString());
    return o.k === kind && o.e > Date.now() ? o : null;
  } catch { return null; }
}

// Never relay to the home LAN / loopback (a hostile playlist must not reach Frigate, the router, etc.).
function publicHost(u) {
  let h;
  try { const x = new URL(u); if (!/^https?:$/.test(x.protocol)) return false; h = x.hostname.replace(/^\[|\]$/g, ''); } catch { return false; }
  if (/^(localhost|.*\.local|.*\.internal|.*\.ts\.net)$/i.test(h)) return false;
  if (net.isIPv4(h)) {
    const [a, b] = h.split('.').map(Number);
    return !(a === 10 || a === 127 || a === 0 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 100 && b >= 64 && b <= 127) || a >= 224);
  }
  if (net.isIPv6(h)) return !/^(::1?$|f[cd]|fe80|::ffff:)/i.test(h);
  return true;
}
// fetch with manual redirects so every hop is checked
async function get(u, init, ms, abort) {
  for (let i = 0; i < 5; i++) {
    if (!publicHost(u)) throw new Error('blocked host');
    const r = await fetch(u, { ...init, redirect: 'manual', signal: abort ? AbortSignal.any([abort, AbortSignal.timeout(ms)]) : AbortSignal.timeout(ms) });
    if (r.status >= 300 && r.status < 400 && r.headers.get('location')) { u = new URL(r.headers.get('location'), u).href; continue; }
    return { r, url: u };
  }
  throw new Error('too many redirects');
}

function rewrite(text, base) {
  const e = Date.now() + 4 * 3600e3; // playlist tokens: one viewing session
  const es = Date.now() + 15 * 60e3; // segment tokens: 15 minutes
  const lines = text.split(/\r?\n/);
  const master = lines.some((l) => l.startsWith('#EXT-X-STREAM-INF'));
  return lines.map((line) => {
    if (!line) return line;
    if (line.startsWith('#')) {
      const m = line.match(/URI="([^"]+)"/);
      if (!m) return line;
      const abs = new URL(m[1], base).href;
      const pl = line.startsWith('#EXT-X-MEDIA') || /\.m3u8/i.test(abs);
      return line.replace(m[0], `URI="../../${pl ? 'p' : 's'}/${seal({ k: pl ? 'pl' : 's', u: abs, e: pl ? e : es })}/${pl ? 'index.m3u8' : 'k.bin'}"`);
    }
    const abs = new URL(line.trim(), base).href;
    if (master || /\.m3u8(\?|$)/i.test(abs)) return `../../p/${seal({ k: 'pl', u: abs, e })}/index.m3u8`;
    return `../../s/${seal({ k: 's', u: abs, e: es })}/seg.ts`;
  }).join('\n');
}

function send(res, status, body, headers = {}) {
  res.writeHead(status, { ...CORS, ...headers });
  res.end(body);
}
async function pipe(res, r, status, headers, ac) {
  res.writeHead(status, { ...CORS, ...headers });
  if (!r.body) return res.end();
  const src = Readable.fromWeb(r.body);
  // Phones open/close many range requests; when the viewer goes away, drop the upstream connection
  // immediately: the provider allows very few concurrent streams (HTTP 458/460 otherwise).
  const stop = () => { ac?.abort(); src.destroy(); };
  res.on('close', stop);
  src.on('error', () => res.destroy()).pipe(res);
}

http.createServer(async (req, res) => {
  const ac = new AbortController();
  // Client went away (iOS aborts range requests constantly): abort any in-flight upstream fetch.
  res.on('close', () => { if (!res.writableFinished) ac.abort(); });
  try {
    if (req.method === 'OPTIONS') return send(res, 204, '');
    const path = new URL(req.url, 'http://x').pathname.replace(/^\/iptv(?=\/)/, '').replace(/^\/+/, '');
    // health only for local checks (Funnel traffic carries X-Forwarded-For)
    if (path === 'health' && !req.headers['x-forwarded-for']) return send(res, 200, 'ok', { 'content-type': 'text/plain' });
    if (req.method !== 'GET' && req.method !== 'HEAD') return send(res, 405, 'method not allowed');
    const [kind, tok] = path.split('/');
    if (!tok) return send(res, 401, 'token required');
    if (kind === 'p') {
      const t = unseal(tok, 'pl'); if (!t) return send(res, 403, 'expired');
      const { r, url } = await get(t.u, { headers: { 'user-agent': UA } }, 15000, ac.signal);
      if (!r.ok) return send(res, r.status === 404 ? 404 : 502, `upstream ${r.status}`);
      return send(res, 200, rewrite(await r.text(), url), { 'content-type': 'application/vnd.apple.mpegurl', 'cache-control': 'no-store' });
    }
    if (kind === 's') {
      const t = unseal(tok, 's'); if (!t) return send(res, 403, 'expired');
      const { r } = await get(t.u, { headers: { 'user-agent': UA } }, 30000, ac.signal);
      if (!r.ok) return send(res, 502, `upstream ${r.status}`);
      return pipe(res, r, 200, { 'content-type': r.headers.get('content-type') || 'video/mp2t', 'cache-control': 'private, max-age=60' }, ac);
    }
    if (kind === 'f') {
      const t = unseal(tok, 'f'); if (!t) return send(res, 403, 'expired');
      const h = { 'user-agent': UA };
      if (req.headers.range) h.range = req.headers.range;
      const { r } = await get(t.u, { headers: h, method: req.method === 'HEAD' ? 'HEAD' : 'GET' }, 6 * 3600e3, ac.signal);
      if (!r.ok && r.status !== 206) return send(res, 502, `upstream ${r.status}`);
      const out = { 'accept-ranges': 'bytes', 'cache-control': t.download ? 'no-store' : 'private, max-age=300' };
      if (t.download) out['content-disposition'] = `attachment; filename="${String(t.download).replace(/[^a-zA-Z0-9 ._-]/g, '')}"`;
      for (const k of ['content-type', 'content-length', 'content-range']) { const v = r.headers.get(k); if (v) out[k] = v; }
      if (!out['content-type'] || /octet-stream/.test(out['content-type'])) out['content-type'] = /\.mkv$/i.test(path) ? 'video/x-matroska' : 'video/mp4';
      return pipe(res, r, r.status, out, ac);
    }
    send(res, 403, 'forbidden');
  } catch {
    if (!res.headersSent) send(res, 502, 'proxy error'); else res.destroy();
  }
}).listen(PORT, '127.0.0.1', () => console.log(`iptv-proxy on 127.0.0.1:${PORT}`));
