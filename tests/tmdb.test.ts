import { describe, expect, test } from "bun:test";
import { catalogPath, imgUrl, runtimeLabel, youtubeEmbed } from "../src/tv/tmdb-util";

describe("TMDB catalog helpers", () => {
  test("builds catalog paths without leaking a key", () => {
    expect(catalogPath("home", { media: "movie" })).toBe("home?media=movie");
    expect(catalogPath("title", { media: "tv", id: 42 })).toBe("title?media=tv&id=42");
    expect(catalogPath("status")).toBe("status");
    expect(catalogPath("search", { q: "dune", media: "all" })).not.toContain("api_key");
  });

  test("builds image and trailer urls", () => {
    expect(imgUrl(null)).toBeNull();
    expect(imgUrl("https://img.example/p.jpg")).toBe("https://img.example/p.jpg");
    expect(imgUrl("/abc.jpg", "w185")).toBe("https://image.tmdb.org/t/p/w185/abc.jpg");
    expect(youtubeEmbed("dQw")).toBe("https://www.youtube-nocookie.com/embed/dQw?rel=0");
  });

  test("formats runtime", () => {
    expect(runtimeLabel(null)).toBeNull();
    expect(runtimeLabel(45)).toBe("45m");
    expect(runtimeLabel(125)).toBe("2h 5m");
    expect(runtimeLabel(120)).toBe("2h");
  });
});
