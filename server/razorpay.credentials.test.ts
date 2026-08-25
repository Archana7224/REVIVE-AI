import { describe, expect, it } from "vitest";

describe("Razorpay server credentials", () => {
  it("authenticates against the Razorpay Test Mode API without exposing secrets", async () => {
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    expect(keyId).toBeTruthy();
    expect(keySecret).toBeTruthy();
    const response = await fetch("https://api.razorpay.com/v1/payment_links?count=1", {
      headers: { Authorization: `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString("base64")}` },
    });
    expect(response.status).toBe(200);
    await response.body?.cancel();
  }, 15_000);
});
