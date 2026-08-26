import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const home = readFileSync(resolve(process.cwd(), "client/src/pages/Home.tsx"), "utf8");
const css = readFileSync(resolve(process.cwd(), "client/src/index.css"), "utf8");

describe("dashboard control contract", () => {
  it("exports a real CSV report instead of only queueing a toast", () => {
    expect(home).toContain("export function buildRevenueReportCsv");
    expect(home).toContain("export function downloadRevenueReport");
    expect(home).toContain('link.download=`revive-revenue-report-');
    expect(home).toContain('document.body.append(link)');
    expect(home).toContain('toast.success(\"Revenue report downloaded\")');
    expect(home).toContain('toast.error(error instanceof Error ? error.message : \"Unable to export revenue report\")');
    expect(home).not.toContain('toast.success(\"Report export queued\")');
  });

  it("routes the dashboard navigation controls to real product surfaces", () => {
    expect(home).toContain('DASHBOARD_ROUTES = { queue: \"/recovery?queue=needs-review\", analysis: \"/revenue-leaks\" }');
    expect(home).toContain("onNavigate(DASHBOARD_ROUTES.queue)");
    expect(home).toContain('onNavigate(DASHBOARD_ROUTES.analysis)');
    expect(home).toContain('Cobalt rail · analysis signal');
    expect(home).toContain('const [location,navigate]=useLocation()');
    expect(home).toContain('onNavigate={navigate}');
    expect(home).toContain('queueTab=query.get(\"queue\") === \"needs-review\" ? \"Needs review\" : undefined');
    expect(home).toContain('initialTab={queueTab}');
    expect(home).toContain('Opened from recommendation');
    expect(home).toContain('rows.map((x,i)=>');
  });

  it("keeps the Intelligence card rail as an explicit Signal Paper treatment", () => {
    expect(css).toContain(".signal-card{position:relative;overflow:hidden");
    expect(css).toContain(".signal-card:before{content:'';position:absolute;left:0");
    expect(css).toContain("background:var(--cobalt)");
  });
});
