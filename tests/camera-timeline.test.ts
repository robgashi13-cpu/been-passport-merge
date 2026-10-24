import { describe, expect, test } from "bun:test";
import { coveredDownload, downloadTime, parseDownloadTime, mergeRecordings, playbackWindow, RECORDING_WINDOW, TIMELINE_CAMERAS } from "../src/cameras/recordingTimeline";
import { coveredClip, clipFilename } from "../supabase/functions/frigate/clip";
import { MEDIA_TTL, rewritePlaylist, safeMediaPath, signMedia, validWindow, verifyMedia, mediaEdgeBase } from "../supabase/functions/frigate/hls";

describe("camera recording rules", () => {
  test("downloads allow exactly 60 minutes, not longer or backwards", () => {
    const spans = [{ start: 100000, end: 110000 }];
    expect(coveredDownload(100000, 103600, spans)).toBe(true);
    expect(coveredDownload(100000, 103601, spans)).toBe(false);
    expect(coveredDownload(103600, 100000, spans)).toBe(false);
    expect(coveredClip(100000, 103600, [{ start_time: 100000, end_time: 110000 }], 110000)).toBe(true);
    expect(coveredClip(100000, 103601, [{ start_time: 100000, end_time: 110000 }], 110000)).toBe(false);
    expect(coveredClip(103600, 100000, [{ start_time: 100000, end_time: 110000 }], 110000)).toBe(false);
  });
  test("download ranges cannot cross gaps or escape covered recordings", () => {
    const recordings = [{ start_time: 100000, end_time: 100060 }, { start_time: 100070, end_time: 100120 }];
    const spans = mergeRecordings(recordings, 100000, 100120);
    expect(coveredDownload(100000, 100060, spans)).toBe(true);
    expect(coveredDownload(100030, 100100, spans)).toBe(false);
    expect(coveredDownload(99999, 100030, spans)).toBe(false);
    expect(coveredClip(100030, 100100, recordings, 100120)).toBe(false);
    expect(coveredClip(99999, 100030, recordings, 100120)).toBe(false);
    expect(coveredClip(100000, 100120, [{ start_time: 100000, end_time: 100060 }, { start_time: 100060, end_time: 100120 }], 100120)).toBe(true);
  });
  test("download times and filenames use Belgrade rather than device timezone", () => {
    const start = Date.parse("2026-10-24T12:00:00Z") / 1000;
    expect(downloadTime(start)).toBe("2026-10-24T14:00:00");
    expect(parseDownloadTime("2026-10-24T14:01:00", start)).toBe(start + 60);
    expect(clipFilename("office_top", start, start + 60)).toBe("office_top_2026-10-24_1400-1401.mp4");
    const winter = Date.parse("2026-12-01T12:00:00Z") / 1000;
    expect(downloadTime(winter)).toBe("2026-12-01T13:00:00");
    expect(parseDownloadTime("2026-12-01T13:00:00", winter)).toBe(winter);
  });
  test("timeline covers 48 hours and only the two office cameras", () => {
    expect(RECORDING_WINDOW).toBe(172800);
    expect(TIMELINE_CAMERAS).toEqual(["office_top", "office_bottom"]);
  });
  test("merges overlapping and adjacent recordings while preserving gaps", () => {
    expect(mergeRecordings([{ start_time: 10, end_time: 20 }, { start_time: 19, end_time: 30 }, { start_time: 30, end_time: 40 }, { start_time: 50, end_time: 70 }], 15, 60))
      .toEqual([{ start: 15, end: 40 }, { start: 50, end: 60 }]);
  });
  test("playback ends at one hour or now, whichever comes first", () => {
    expect(playbackWindow(100000, 110000)).toEqual({ start: 100000, end: 103600 });
    expect(playbackWindow(109000, 110000)).toEqual({ start: 109000, end: 110000 });
    expect(validWindow(100000, 103601, 110000)).toBe(false);
  });
});

describe("signed Frigate HLS", () => {
  test("media URLs retain the public functions gateway prefix", () => {
    expect(mediaEdgeBase("https://app.test/")).toBe("https://app.test/functions/v1/frigate");
  });
  const secret = "test-only-server-signing-key";
  test("tokens are camera scoped, tamper resistant, and expire in two hours", async () => {
    const token = await signMedia("office_top", secret, 100000);
    expect(MEDIA_TTL).toBe(7200);
    expect(await verifyMedia(token, secret, 100001)).toEqual({ camera: "office_top", exp: 107200 });
    expect(await verifyMedia(token, secret, 107200)).toBeNull();
    expect(await verifyMedia(token + "tampered", secret, 100001)).toBeNull();
    expect(await verifyMedia(token, "wrong-key", 100001)).toBeNull();
  });
  test("segment paths cannot escape their camera or the two VOD prefixes", () => {
    expect(safeMediaPath("/vod/office_top/start/1/end/2/seg-1.ts", "office_top")).toBe(true);
    expect(safeMediaPath("/api/vod/office_top/start/1/end/2/init.mp4", "office_top")).toBe(true);
    for (const path of ["/vod/office_bottom/seg.ts", "/api/config", "/vod/office_top/../office_bottom/seg.ts", "/vod/office_top/%2e%2e/seg.ts", "https://evil.test/vod/office_top/seg.ts", "/vod/office_top/seg.ts?password=x"])
      expect(safeMediaPath(path, "office_top")).toBe(false);
  });
  test("rewrites all segments, maps, keys and nested playlist URIs with the same token", () => {
    const text = '#EXTM3U\n#EXT-X-MAP:URI="init.mp4"\n#EXT-X-MEDIA:TYPE=AUDIO,URI="audio.m3u8"\n#EXT-X-KEY:METHOD=AES-128,URI="key.bin"\n#EXT-X-STREAM-INF:BANDWIDTH=1000\nchild.m3u8\n/vod/office_top/start/1/end/2/seg.ts\nhttps://nvr.test/api/vod/office_top/start/1/end/2/seg.m4s';
    const result = rewritePlaylist(text, "/api/vod/office_top/start/1/end/2/index.m3u8", "office_top", "https://nvr.test", "https://app.test/frigate", "signed-token");
    expect(result.match(/&t=signed-token/g)?.length).toBe(6);
    expect(result).toContain('URI="https://app.test/frigate/hls?p=%2Fapi%2Fvod%2Foffice_top%2Fstart%2F1%2Fend%2F2%2Finit.mp4&t=signed-token"');
    expect(result).not.toContain("https://nvr.test");
  });
  test("playlists cannot redirect to other origins, cameras, or traversed paths", () => {
    for (const uri of ["https://evil.test/seg.ts", "/vod/office_bottom/seg.ts", "../../../../office_bottom/seg.ts", "/api/config"])
      expect(() => rewritePlaylist(`#EXTM3U\n${uri}`, "/vod/office_top/start/1/end/2/index.m3u8", "office_top", "https://nvr.test", "https://app.test/frigate", "token")).toThrow();
  });
});