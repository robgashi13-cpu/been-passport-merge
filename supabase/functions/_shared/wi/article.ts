// @ts-nocheck
// Server-side article preview: <title>, og:title, og:description / meta description, site name.
// No AI. Size- and time-limited, http(s) only, refuses private/loopback hosts.
const PRIVATE = /^(localhost|127\.|10\.|192\.168\.|169\.254\.|172\.(1[6-9]|2\d|3[01])\.|0\.|\[?::1\]?|\[?f[cd][0-9a-f]{2}:)/i;
const ent = (s) => s.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(+n)).replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16))).replace(/&nbsp;/g, ' ');
const clean = (s, n) => (s ? ent(s).replace(/\s+/g, ' ').trim().slice(0, n) : null);

export function articleUrlOk(u) {
  try {
    const x = new URL(u);
    return (x.protocol === 'http:' || x.protocol === 'https:') && !PRIVATE.test(x.hostname) && !x.username && !x.password;
  } catch { return false; }
}

function meta(html, keys) {
  for (const k of keys) {
    const re1 = new RegExp(`<meta[^>]+(?:property|name)=["']${k}["'][^>]*content=["']([^"']*)["']`, 'i');
    const re2 = new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]*(?:property|name)=["']${k}["']`, 'i');
    const m = html.match(re1) || html.match(re2);
    if (m && m[1].trim()) return m[1];
  }
  return null;
}

export async function fetchArticleMeta(url) {
  if (!articleUrlOk(url)) return { ok: false, error: 'url not allowed' };
  const r = await fetch(url, {
    redirect: 'follow',
    headers: { 'user-agent': 'Mozilla/5.0 (compatible; WorldIntelPreview/1.0; +article-preview)', accept: 'text/html,application/xhtml+xml' },
    signal: AbortSignal.timeout(8000),
  });
  if (!articleUrlOk(r.url || url)) return { ok: false, error: 'redirect not allowed' };
  if (!r.ok) return { ok: false, error: `HTTP ${r.status}` };
  if (!/html/i.test(r.headers.get('content-type') || 'text/html')) return { ok: false, error: 'not html' };
  // read at most ~400 KB (head is enough)
  const reader = r.body.getReader();
  const chunks = []; let size = 0;
  while (size < 400000) { const { value, done } = await reader.read(); if (done) break; chunks.push(value); size += value.length; if (new TextDecoder().decode(value).includes('</head>')) break; }
  try { reader.cancel(); } catch { /* ignore */ }
  const buf = new Uint8Array(size); let o = 0; for (const c of chunks) { buf.set(c.subarray(0, Math.min(c.length, size - o)), o); o += c.length; if (o >= size) break; }
  const html = new TextDecoder('utf-8').decode(buf);
  const title = clean(meta(html, ['og:title', 'twitter:title']) || (html.match(/<title[^>]*>([\s\S]*?)<\/title>/i) || [])[1], 220);
  const description = clean(meta(html, ['og:description', 'description', 'twitter:description']), 500);
  const site = clean(meta(html, ['og:site_name']), 80) || new URL(r.url || url).hostname.replace(/^www\./, '');
  const published = clean(meta(html, ['article:published_time', 'og:updated_time', 'pubdate', 'date']), 40);
  if (!title && !description) return { ok: false, error: 'no metadata', site };
  return { ok: true, title, description, site, published };
}
