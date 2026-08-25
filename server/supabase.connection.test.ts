import { describe, expect, it } from "vitest";

describe("Supabase public connection", () => {
  it("reaches the configured Supabase REST endpoint with the anon key", async () => {
    const url = process.env.VITE_SUPABASE_URL;
    const anonKey = process.env.VITE_SUPABASE_ANON_KEY;
    expect(url).toMatch(/^https:\/\//);
    expect(anonKey).toBeTruthy();
    const response = await fetch(`${url}/rest/v1/`, { headers: { apikey: anonKey!, Authorization: `Bearer ${anonKey}` } });
    expect(response.status).toBeLessThan(500);
    await response.body?.cancel();
  }, 15_000);
});
