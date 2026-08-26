import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const css = readFileSync(resolve(process.cwd(), "client/src/index.css"), "utf8");
const home = readFileSync(resolve(process.cwd(), "client/src/pages/Home.tsx"), "utf8");

describe("recovery drawer scroll contract", () => {
  it("constrains the drawer and makes only the case body independently scrollable", () => {
    expect(css).toContain(".drawer{position:relative;display:flex;flex-direction:column");
    expect(css).toContain("height:100%;max-height:100dvh");
    expect(css).toContain("overflow:hidden");
    expect(css).toContain(".drawer > div:last-child{flex:1 1 auto;min-height:0;overflow-y:auto");
    expect(css).toContain("overscroll-behavior:contain");
    expect(css).toContain("-webkit-overflow-scrolling:touch");
    expect(css).toContain("touch-action:pan-y");
  });

  it("keeps the drawer body scroll lock and restoration lifecycle in place", () => {
    expect(home).toContain('body.style.overflow="hidden"');
    expect(home).toContain('body.style.position="fixed"');
    expect(home).toContain("window.scrollTo(0,scrollY)");
    expect(home).toContain('if(event.key === "Escape") onClose()');
  });
});
