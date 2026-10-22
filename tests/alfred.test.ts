import { describe, expect, test } from "bun:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { ALFRED_WEB_URL, AlfredOpen } from "../src/lib/alfred";

const URL = "https://alfred.camera/webapp/viewer/";

/** Swap in a fake iOS browser, either inside the standalone PWA shell or not. */
function withIOS(standalone: boolean) {
  const hadNav = Object.getOwnPropertyDescriptor(globalThis, "navigator");
  const hadWin = Object.getOwnPropertyDescriptor(globalThis, "window");
  Object.defineProperty(globalThis, "navigator", {
    value: {
      userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15",
      platform: "iPhone",
      maxTouchPoints: 1,
      standalone,
    },
    configurable: true,
    writable: true,
  });
  (globalThis as any).window = { matchMedia: () => ({ matches: standalone }) };
  return () => {
    if (hadNav) Object.defineProperty(globalThis, "navigator", hadNav);
    else delete (globalThis as any).navigator;
    if (hadWin) Object.defineProperty(globalThis, "window", hadWin);
    else delete (globalThis as any).window;
  };
}

describe("AlfredCamera link", () => {
  test("points at the Alfred web viewer", () => {
    expect(ALFRED_WEB_URL).toBe(URL);
  });

  test("in a normal browser it opens the viewer in a new tab", () => {
    const restore = withIOS(false);
    const html = renderToStaticMarkup(createElement(AlfredOpen));
    restore();
    expect(html).toContain("<button");
    expect(html).toContain("Open Alfred");
    expect(html).not.toContain("href=");
  });

  test("in an iOS standalone PWA it hands the link to Safari", () => {
    const restore = withIOS(true);
    const html = renderToStaticMarkup(createElement(AlfredOpen));
    restore();
    expect(html).toContain(`href="${URL}"`);
    expect(html).toContain('target="_blank"');
    expect(html).toContain('rel="noopener noreferrer"');
    expect(html).not.toContain("<button");
  });
});
