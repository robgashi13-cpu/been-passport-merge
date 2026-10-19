// WanderPass IPTV home media proxy (zero dependencies, Node 18+).
// Why: the IPTV provider refuses stream requests from cloud/datacenter IPs (HTTP 511), so the
// Supabase edge function can list channels but cannot relay video. This proxy runs on a home
// machine (residential IP) and relays ONLY the sealed media tokens minted by the `iptv` edge
// function (signed-in + allowlisted users). Tokens are AES-256-GCM encrypted and expire; each one
// can fetch exactly one upstream URL. No provider credentials are stored here.
//
// Env: IPTV_TOKEN_KEY (same value as hq_secrets.iptv_token_key), PORT (default 8789).
// Expose with e.g.:  tailscale funnel --bg --set-path /iptv http://127.0.0.1:8789
import http from 'node:http';
import crypto from 'node:crypto';
import { Readable } from 'node:stream';

const PORT = Number(process.env.PORT || 8789);
const SECRET = process.env.IPTV_TOKEN_KEY || '';
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

function rewrite(text, base) {
  const e = Date.now() + 3 * 3600e3;
  const lines = text.split(/\r?\n/);
  const master = lines.some((l) => l.startsWith('#EXT-X-STREAM-INF'));
  return lines.map((line) => {
    if (!line) return line;
    if (line.startsWith('#')) {
      const m = line.match(/URI="([^"]+)"/);
      if (!m) return line;
      const abs = new URL(m[1], base).href;
      const pl = line.startsWith('#EXT-X-MEDIA') || /\.m3u8/i.test(abs);
      return line.replace(m[0], `URI="../../${pl ? 'p' : 's'}/${seal({ k: pl ? 'pl' : 's', u: abs, e })}/${pl ? 'index.m3u8' : 'k.bin'}"`);
    }
    const abs = new URL(line.trim(), base).href;
    if (master || /\.m3u8(\?|$)/i.test(abs)) return `../../p/${seal({ k: 'pl', u: abs, e })}/index.m3u8`;
    return `../../s/${seal({ k: 's', u: abs, e })}/seg.ts`;
  }).join('\n');
}

function send(res, status, body, headers = {}) {
  res.writeHead(status, { ...CORS, ...headers });
  res.end(body);
}
async function pipe(res, r, status, headers) {
  res.writeHead(status, { ...CORS, ...headers });
  if (!r.body) return res.end();
  Readable.fromWeb(r.body).on('error', () => res.destroy()).pipe(res);
}

http.createServer(async (req, res) => {
  try {
    if (req.method === 'OPTIONS') return send(res, 204, '');
    const path = new URL(req.url, 'http://x').pathname.replace(/^\/iptv(?=\/)/, '').replace(/^\/+/, '');
    if (path === 'health') return send(res, 200, 'ok', { 'content-type': 'text/plain' });
    const [kind, tok] = path.split('/');
    if (kind === 'p') {
      const t = unseal(tok, 'pl'); if (!t) return send(res, 403, 'expired');
      const r = await fetch(t.u, { headers: { 'user-agent': UA }, signal: AbortSignal.timeout(15000) });
      if (!r.ok) return send(res, r.status === 404 ? 404 : 502, `upstream ${r.status}`);
      return send(res, 200, rewrite(await r.text(), r.url || t.u), { 'content-type': 'application/vnd.apple.mpegurl', 'cache-control': 'no-store' });
    }
    if (kind === 's') {
      const t = unseal(tok, 's'); if (!t) return send(res, 403, 'expired');
      const r = await fetch(t.u, { headers: { 'user-agent': UA }, signal: AbortSignal.timeout(30000) });
      if (!r.ok) return send(res, 502, `upstream ${r.status}`);
      return pipe(res, r, 200, { 'content-type': r.headers.get('content-type') || 'video/mp2t', 'cache-control': 'private, max-age=60' });
    }
    if (kind === 'f') {
      const t = unseal(tok, 'f'); if (!t) return send(res, 403, 'expired');
      const h = { 'user-agent': UA };
      if (req.headers.range) h.range = req.headers.range;
      const r = await fetch(t.u, { headers: h, method: req.method === 'HEAD' ? 'HEAD' : 'GET' });
      if (!r.ok && r.status !== 206) return send(res, 502, `upstream ${r.status}`);
      const out = { 'accept-ranges': 'bytes', 'cache-control': t.download ? 'no-store' : 'private, max-age=300' };
      if (t.download) out['content-disposition'] = `attachment; filename="${String(t.download).replace(/[^a-zA-Z0-9 ._-]/g, '')}"`;
      for (const k of ['content-type', 'content-length', 'content-range']) { const v = r.headers.get(k); if (v) out[k] = v; }
      if (!out['content-type'] || /octet-stream/.test(out['content-type'])) out['content-type'] = /\.mkv$/i.test(path) ? 'video/x-matroska' : 'video/mp4';
      return pipe(res, r, r.status, out);
    }
    send(res, 404, 'not found');
  } catch {
    if (!res.headersSent) send(res, 502, 'proxy error'); else res.destroy();
  }
}).listen(PORT, '127.0.0.1', () => console.log(`iptv-proxy on 127.0.0.1:${PORT}`));
