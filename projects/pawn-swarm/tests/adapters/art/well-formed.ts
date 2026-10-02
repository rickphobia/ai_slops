import { expect } from "vitest";

const TAG = /<(\/?)([a-zA-Z][\w:-]*)((?:\s+[\w:-]+="[^"<]*")*)\s*(\/?)>/g;

/**
 * Checks SVG markup is well formed enough for the browser to load: tags
 * balance and every attribute is quoted. A broken drawing would otherwise
 * only show up as an image that fails to load at startup.
 */
export function expectWellFormed(svg: string): void {
  const open: string[] = [];
  let checked = 0;
  for (const match of svg.matchAll(TAG)) {
    const [whole, closing, name = "", , selfClosing] = match;
    expect(
      svg.slice(checked, match.index),
      `stray "<" before ${whole}`,
    ).not.toContain("<");
    checked = match.index + whole.length;
    if (closing === "/") {
      expect(open.pop(), `unexpected </${name}>`).toBe(name);
    } else if (selfClosing !== "/") {
      open.push(name);
    }
  }
  expect(svg.slice(checked), "text after the last tag").not.toContain("<");
  expect(open, "unclosed tags").toEqual([]);
}
