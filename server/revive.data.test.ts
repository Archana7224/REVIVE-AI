import { describe, expect, it } from "vitest";
import { calculateRecoveryRate, getDb, getOrCreateDemoMerchant, listPayments, listRecoveryCases } from "./db";
import { appRouter } from "./routers";
import { agentLogs, customers, merchants, payments, recoveryActions, recoveryCases, revenueRisk } from "../drizzle/schema";
import type { TrpcContext } from "./_core/context";

function context(user: TrpcContext["user"]): TrpcContext { return { user, req: { protocol: "https", headers: {} } as TrpcContext["req"], res: { clearCookie() {} } as TrpcContext["res"] }; }
const authenticatedUser: NonNullable<TrpcContext["user"]> = { id: 1, openId: "revive-test-user", email: "ops@acme.example", name: "REVIVE Test Merchant", loginMethod: "test", role: "admin", createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() };

async function seedSecondMerchant() {
  const db = await getDb(); if (!db) throw new Error("Database is required for isolation tests");
  const merchantId = crypto.randomUUID(), customerId = crypto.randomUUID(), paymentId = crypto.randomUUID(), riskId = crypto.randomUUID(), caseId = crypto.randomUUID();
  await db.insert(merchants).values({ id: merchantId, name: "Other Merchant", email: `other-${merchantId}@example.com`, razorpayAccountId: null });
  await db.insert(customers).values({ id: customerId, merchantId, externalCustomerId: `other-${merchantId}`, name: "Other Customer", email: `other-${merchantId}@example.com`, phone: null, totalTransactions: 1, successfulTransactions: 0, failedTransactions: 1, totalSpend: "0" });
  await db.insert(payments).values({ id: paymentId, merchantId, customerId, amount: "9999", paymentMethod: "CARD", status: "failed", failureReason: "other_merchant_fixture", attemptNumber: 1 });
  await db.insert(revenueRisk).values({ id: riskId, paymentId, riskScore: "80", recoveryProbability: "50", expectedRecovery: "4999.50", priority: "high", reason: "Isolation fixture" });
  await db.insert(recoveryCases).values({ id: caseId, paymentId, customerId, status: "needs_review", strategy: "payment_link", amountAtRisk: "9999", expectedRecovery: "4999.50", actualRecovery: "0" });
  await db.insert(agentLogs).values({ id: crypto.randomUUID(), recoveryCaseId: caseId, eventType: "fixture_event", message: "Other merchant event", metadata: { fixture: true } });
  await db.insert(recoveryActions).values({ id: crypto.randomUUID(), recoveryCaseId: caseId, actionType: "fixture_action", toolName: "fixture_tool", status: "success", input: { fixture: true }, output: { fixture: true } });
  return { merchantId, paymentId, caseId };
}

describe("REVIVE recovery metrics", () => {
  it("calculates recovery rate from actual and expected recovery", () => expect(calculateRecoveryRate(142500, 248000)).toBeCloseTo(57.4597, 3));
  it("returns zero when there is no expected recovery", () => expect(calculateRecoveryRate(1000, 0)).toBe(0));

  it("rejects anonymous access across all protected procedures", async () => {
    const caller = appRouter.createCaller(context(undefined));
    await expect(caller.dashboard.summary()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    await expect(caller.recovery.cases()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    await expect(caller.recovery.payments()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    await expect(caller.agent.activity()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    await expect(caller.audit.events()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    await expect(caller.simulator.compare({ amountAtRisk: 240000 })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("returns concrete seeded records and excludes a second merchant", async () => {
    const caller = appRouter.createCaller(context(authenticatedUser));
    const [summary, cases, paymentsResult, activity, audit, simulator] = await Promise.all([caller.dashboard.summary(), caller.recovery.cases(), caller.recovery.payments(), caller.agent.activity(), caller.audit.events(), caller.simulator.compare({ amountAtRisk: 240000 })]);
    expect(summary.expectedRecovery).toBeGreaterThan(0); expect(summary.failedPayments).toBeGreaterThanOrEqual(3);
    expect(paymentsResult.length).toBeGreaterThanOrEqual(3); expect(paymentsResult.map(item => item.paymentMethod)).toEqual(expect.arrayContaining(["UPI", "CARD", "NETBANKING"]));
    expect(cases.map(item => item.customerName)).toEqual(expect.arrayContaining(["Aarav Sharma", "Ananya Patel", "Rohan Mehta"]));
    expect(activity.length).toBeGreaterThanOrEqual(2); expect(activity.map(item => item.eventType)).toEqual(expect.arrayContaining(["payment_failure_detected", "payment_captured"]));
    expect(audit.length).toBeGreaterThanOrEqual(2); expect(audit.map(item => item.toolName)).toEqual(expect.arrayContaining(["create_payment_link", "razorpay_webhook"]));
    expect(simulator.strategies).toHaveLength(3);

    const other = await seedSecondMerchant();
    expect(await listPayments(other.merchantId)).toHaveLength(1); expect((await listRecoveryCases(other.merchantId))[0]?.paymentId).toBe(other.paymentId);
    const primaryCases = await caller.recovery.cases(); expect(primaryCases.some(item => item.paymentId === other.paymentId)).toBe(false);
    expect(activity.some(item => item.message === "Other merchant event")).toBe(false); expect(audit.some(item => item.toolName === "fixture_tool")).toBe(false);
    const primarySummaryAfter = await caller.dashboard.summary(); expect(primarySummaryAfter.expectedRecovery).toBe(summary.expectedRecovery); expect(primarySummaryAfter.failedPayments).toBe(summary.failedPayments);
    const otherCaller = appRouter.createCaller(context({ ...authenticatedUser, openId: `other-${other.merchantId}`, email: `other-${other.merchantId}@example.com`, name: "Other Merchant" }));
    const [otherCases, otherActivity, otherAudit] = await Promise.all([otherCaller.recovery.cases(), otherCaller.agent.activity(), otherCaller.audit.events()]);
    expect(otherCases).toHaveLength(1); expect(otherCases[0]?.paymentId).toBe(other.paymentId); expect(otherCases[0]?.customerName).toBe("Other Customer");
    expect(otherActivity).toHaveLength(1); expect(otherActivity[0]?.message).toBe("Other merchant event"); expect(otherAudit).toHaveLength(1); expect(otherAudit[0]?.toolName).toBe("fixture_tool");
  });
});
