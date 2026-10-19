/** Already-prepared files retain user activation on iOS. */
export async function deliverFile(blob: Blob, filename: string) {
  const file = new File([blob], filename, { type: blob.type });
  if (matchMedia("(pointer: coarse)").matches && navigator.canShare?.({ files: [file] })) {
    try { await navigator.share({ files: [file], title: filename }); return; }
    catch (e) { if ((e as DOMException).name === "AbortError") return; }
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30_000);
}

export function fileName(name: string, ext: string) {
  return `${name.replace(/[^\p{L}\p{N} _-]/gu, "").trim().slice(0, 100) || "download"}.${ext.replace(/[^a-z0-9]/gi, "") || "mp4"}`;
}
