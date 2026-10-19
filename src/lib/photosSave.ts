import { Capacitor } from "@capacitor/core";

export const isNative = () => Capacitor.isNativePlatform();

/**
 * Save a video to the device's photo library.
 * Native iOS/Android: downloads to app cache, then saves into Photos (Media plugin).
 * Web fallback: returns false so the caller can use a normal download/share flow.
 */
export async function saveVideoToPhotos(url: string, filename: string, onProgress?: (pct: number) => void): Promise<boolean> {
  if (!isNative()) return false;
  const { Filesystem, Directory } = await import("@capacitor/filesystem");
  const { Media } = await import("@capacitor-community/media");

  // Download with progress into a blob (movie files can be large; show progress).
  const res = await fetch(url);
  if (!res.ok || !res.body) throw new Error(`Download failed (${res.status})`);
  const total = Number(res.headers.get("content-length")) || 0;
  const reader = res.body.getReader();
  const chunks: Uint8Array[] = [];
  let got = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    got += value.length;
    if (total) onProgress?.(Math.min(99, Math.round((got / total) * 100)));
  }
  const blob = new Blob(chunks as BlobPart[]);
  const base64 = await blobToBase64(blob);

  const path = `downloads/${Date.now()}-${filename}`;
  await Filesystem.writeFile({ path, data: base64, directory: Directory.Cache, recursive: true });
  const { uri } = await Filesystem.getUri({ path, directory: Directory.Cache });
  await Media.saveVideo({ path: uri });
  Filesystem.deleteFile({ path, directory: Directory.Cache }).catch(() => {});
  onProgress?.(100);
  return true;
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result).split(",")[1] || "");
    r.onerror = reject;
    r.readAsDataURL(blob);
  });
}
