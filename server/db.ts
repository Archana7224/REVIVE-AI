import { and, desc, eq, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { ENV } from "./_core/env";
import { InsertUser, agentLogs, customers, merchants, payments, recoveryCases, recoveryActions, revenueRisk, users } from "../drizzle/schema";

let _db: ReturnType<typeof drizzle> | null = null;
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try { _db = drizzle(process.env.DATABASE_URL); } catch (error) { console.warn("[Database] Failed to connect:", error); }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb(); if (!db) return;
  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  for (const field of ["name", "email", "loginMethod"] as const) { if (user[field] !== undefined) { values[field] = user[field] ?? null; updateSet[field] = user[field] ?? null; } }
  values.lastSignedIn = user.lastSignedIn ?? new Date(); updateSet.lastSignedIn = values.lastSignedIn;
  if (user.role) { values.role = user.role; updateSet.role = user.role; } else if (user.openId === ENV.ownerOpenId) { values.role = "admin"; updateSet.role = "admin"; }
  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}
export async function getUserByOpenId(openId: string) { const db = await getDb(); if (!db) return undefined; const rows = await db.select().from(users).where(eq(users.openId, openId)).limit(1); return rows[0]; }

export async function getOrCreateDemoMerchant(email = "ops@acme.example", name = "Acme Commerce") {
  const db = await getDb(); if (!db) return null;
  const existing = await db.select().from(merchants).where(eq(merchants.email, email)).limit(1); const merchant = existing[0] ?? { id: crypto.randomUUID(), name, email, razorpayAccountId: null };
  if (!existing[0]) await db.insert(merchants).values(merchant);
  const existingPayment = await db.select({ id: payments.id }).from(payments).where(eq(payments.merchantId, merchant.id)).limit(1);
  if (!existingPayment[0]) {
    const customerRows = [
      { id: crypto.randomUUID(), merchantId: merchant.id, externalCustomerId: "cus_aarav", name: "Aarav Sharma", email: "aarav@acme.example", phone: "+91 98765 43210", totalTransactions: 19, successfulTransactions: 18, failedTransactions: 1, totalSpend: "148500" },
      { id: crypto.randomUUID(), merchantId: merchant.id, externalCustomerId: "cus_ananya", name: "Ananya Patel", email: "ananya@acme.example", phone: "+91 98111 22334", totalTransactions: 12, successfulTransactions: 11, failedTransactions: 1, totalSpend: "93200" },
      { id: crypto.randomUUID(), merchantId: merchant.id, externalCustomerId: "cus_rohan", name: "Rohan Mehta", email: "rohan@acme.example", phone: "+91 98989 11002", totalTransactions: 9, successfulTransactions: 8, failedTransactions: 1, totalSpend: "62400" },
    ];
    await db.insert(customers).values(customerRows);
    const paymentRows = [{ id: crypto.randomUUID(), merchantId: merchant.id, customerId: customerRows[0].id, amount: "8500", paymentMethod: "UPI", status: "failed", failureReason: "bank_error", attemptNumber: 1 }, { id: crypto.randomUUID(), merchantId: merchant.id, customerId: customerRows[1].id, amount: "14200", paymentMethod: "CARD", status: "failed", failureReason: "authentication_failed", attemptNumber: 1 }, { id: crypto.randomUUID(), merchantId: merchant.id, customerId: customerRows[2].id, amount: "4800", paymentMethod: "NETBANKING", status: "failed", failureReason: "timeout", attemptNumber: 1 }];
    await db.insert(payments).values(paymentRows);
    const risks = paymentRows.map((payment, index) => ({ id: crypto.randomUUID(), paymentId: payment.id, riskScore: String(100 - [82, 76, 69][index]), recoveryProbability: String([82, 76, 69][index]), expectedRecovery: String([6970, 10792, 3312][index]), priority: index < 2 ? "high" : "medium", reason: ["Returning UPI customer; evening bank degradation pattern.", "Authentication retry likely to succeed on a payment link.", "Timeout suggests a recoverable network interruption."][index] }));
    await db.insert(revenueRisk).values(risks);
    const cases = paymentRows.map((payment, index) => ({ id: crypto.randomUUID(), paymentId: payment.id, customerId: payment.customerId, status: index === 1 ? "recovered" : "needs_review", strategy: index === 2 ? "delayed_payment_link" : "payment_link", amountAtRisk: payment.amount, expectedRecovery: risks[index].expectedRecovery, actualRecovery: index === 1 ? "10792" : "0" }));
    await db.insert(recoveryCases).values(cases);
    await db.insert(agentLogs).values(cases.slice(0, 2).map((item, index) => ({ id: crypto.randomUUID(), recoveryCaseId: item.id, eventType: index === 0 ? "payment_failure_detected" : "payment_captured", message: index === 0 ? "Payment failure detected" : "Payment captured", metadata: { amount: item.amountAtRisk, source: "demo_seed" } })));
    await db.insert(recoveryActions).values(cases.slice(0, 2).map((item, index) => ({ id: crypto.randomUUID(), recoveryCaseId: item.id, actionType: index === 0 ? "payment_link" : "capture_observed", toolName: index === 0 ? "create_payment_link" : "razorpay_webhook", status: "success", input: { demo: true }, output: { demo: true } })));
  }
  return merchant;
}

export function calculateRecoveryRate(actualRecovery: number, expectedRecovery: number) { return expectedRecovery > 0 ? (actualRecovery / expectedRecovery) * 100 : 0; }

export async function getDashboardSummary(merchantId: string) {
  const db = await getDb(); if (!db) return { revenueAtRisk: 0, expectedRecovery: 0, recovered: 0, recoveryRate: 0, failedPayments: 0 };
  const [risk, expected, recovered, failed] = await Promise.all([
    db.select({ value: sql<string>`coalesce(sum(${revenueRisk.expectedRecovery} / nullif(${revenueRisk.recoveryProbability}, 0) * 100), 0)` }).from(revenueRisk).innerJoin(payments, eq(revenueRisk.paymentId, payments.id)).where(eq(payments.merchantId, merchantId)),
    db.select({ value: sql<string>`coalesce(sum(${revenueRisk.expectedRecovery}), 0)` }).from(revenueRisk).innerJoin(payments, eq(revenueRisk.paymentId, payments.id)).where(eq(payments.merchantId, merchantId)),
    db.select({ value: sql<string>`coalesce(sum(${recoveryCases.actualRecovery}), 0)` }).from(recoveryCases).innerJoin(payments, eq(recoveryCases.paymentId, payments.id)).where(and(eq(payments.merchantId, merchantId), eq(recoveryCases.status, "recovered"))),
    db.select({ value: sql<number>`count(*)` }).from(payments).where(and(eq(payments.merchantId, merchantId), eq(payments.status, "failed"))),
  ]);
  const revenueAtRisk = Number(risk[0]?.value ?? 0); const expectedRecovery = Number(expected[0]?.value ?? 0); const actual = Number(recovered[0]?.value ?? 0);
  return { revenueAtRisk, expectedRecovery, recovered: actual, recoveryRate: calculateRecoveryRate(actual, expectedRecovery), failedPayments: Number(failed[0]?.value ?? 0) };
}

export async function listPayments(merchantId: string) { const db = await getDb(); if (!db) return []; return db.select().from(payments).where(eq(payments.merchantId, merchantId)).orderBy(desc(payments.createdAt)).limit(100); }
export async function compareRecoveryStrategies(merchantId: string, amountAtRisk: number) { const db = await getDb(); if (!db) return { merchantId, amountAtRisk, strategies: [] }; return { merchantId, amountAtRisk, strategies: [{ name: "immediate_retry", expectedRecovery: amountAtRisk * 0.34, friction: "high" }, { name: "payment_link", expectedRecovery: amountAtRisk * 0.48, friction: "medium" }, { name: "delayed_payment_link", expectedRecovery: amountAtRisk * 0.57, friction: "low" }] }; }

export async function listRecoveryCases(merchantId: string) {
  const db = await getDb(); if (!db) return [];
  return db.select({ id: recoveryCases.id, customerId: recoveryCases.customerId, paymentId: recoveryCases.paymentId, status: recoveryCases.status, strategy: recoveryCases.strategy, amountAtRisk: recoveryCases.amountAtRisk, expectedRecovery: recoveryCases.expectedRecovery, actualRecovery: recoveryCases.actualRecovery, probability: revenueRisk.recoveryProbability, customerName: customers.name, paymentMethod: payments.paymentMethod, failureReason: payments.failureReason }).from(recoveryCases).innerJoin(payments, eq(recoveryCases.paymentId, payments.id)).innerJoin(customers, eq(recoveryCases.customerId, customers.id)).leftJoin(revenueRisk, eq(revenueRisk.paymentId, payments.id)).where(eq(payments.merchantId, merchantId)).orderBy(desc(recoveryCases.createdAt));
}
export async function listAgentActivity(merchantId: string) { const db = await getDb(); if (!db) return []; return db.select({ id: agentLogs.id, eventType: agentLogs.eventType, message: agentLogs.message, metadata: agentLogs.metadata, createdAt: agentLogs.createdAt }).from(agentLogs).leftJoin(recoveryCases, eq(agentLogs.recoveryCaseId, recoveryCases.id)).leftJoin(payments, eq(recoveryCases.paymentId, payments.id)).where(eq(payments.merchantId, merchantId)).orderBy(desc(agentLogs.createdAt)).limit(50); }
export async function listAuditEvents(merchantId: string) { const db = await getDb(); if (!db) return []; return db.select({ id: recoveryActions.id, caseId: recoveryActions.recoveryCaseId, actionType: recoveryActions.actionType, toolName: recoveryActions.toolName, status: recoveryActions.status, input: recoveryActions.input, output: recoveryActions.output, executedAt: recoveryActions.executedAt }).from(recoveryActions).innerJoin(recoveryCases, eq(recoveryActions.recoveryCaseId, recoveryCases.id)).innerJoin(payments, eq(recoveryCases.paymentId, payments.id)).where(eq(payments.merchantId, merchantId)).orderBy(desc(recoveryActions.executedAt)).limit(100); }
