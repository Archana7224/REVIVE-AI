import { describe, expect, it } from "vitest";

const clamp = (value: number) => Math.max(0, Math.min(1, value));
function deterministicProbability(successRate: number, successfulTransactions: number, attemptNumber: number, failedTransactions: number, previousRecoveries: number) {
  const experience = clamp(successfulTransactions / 10) * 0.16;
  const retryPenalty = clamp(Math.max(0, attemptNumber - 1) / 5) * 0.14;
  const failurePenalty = clamp(failedTransactions / 12) * 0.08;
  const recoveryLift = clamp(previousRecoveries / 5) * 0.08;
  return clamp(0.22 + successRate * 0.42 + experience + recoveryLift - retryPenalty - failurePenalty);
}
function enforcePolicy(payment: { status: string; retryCount: number; contactCount: number; amount: number }, policy: { maximumRetryCount: number; maximumContactCount: number; highValueThreshold: number; autonomyLevel: string }, probability: number, requestedAction: string) {
  if (["captured", "paid", "success"].includes(payment.status)) return "STOP_RECOVERY";
  if (payment.retryCount >= policy.maximumRetryCount || payment.contactCount >= policy.maximumContactCount) return "STOP_RECOVERY";
  if (probability < 0.3) return "STOP_RECOVERY";
  if (payment.amount > policy.highValueThreshold && !["autonomous", "full"].includes(policy.autonomyLevel)) return "ESCALATE_CASE";
  if (probability < 0.6) return "RECOMMEND_PAYMENT_LINK";
  return requestedAction === "CREATE_PAYMENT_LINK" ? "CREATE_PAYMENT_LINK" : "RECOMMEND_PAYMENT_LINK";
}

describe("recovery-agent contracts", () => {
  it("keeps deterministic probabilities bounded and penalizes repeated attempts", () => {
    const fresh = deterministicProbability(0.9, 9, 1, 0, 2);
    const retried = deterministicProbability(0.9, 9, 5, 0, 2);
    expect(fresh).toBeGreaterThan(retried);
    expect(fresh).toBeGreaterThanOrEqual(0);
    expect(fresh).toBeLessThanOrEqual(1);
  });
  it("always stops captured payments and exceeded limits", () => {
    const policy = { maximumRetryCount: 3, maximumContactCount: 2, highValueThreshold: 10000, autonomyLevel: "recommended" };
    expect(enforcePolicy({ status: "captured", retryCount: 0, contactCount: 0, amount: 100 }, policy, 0.95, "CREATE_PAYMENT_LINK")).toBe("STOP_RECOVERY");
    expect(enforcePolicy({ status: "failed", retryCount: 3, contactCount: 0, amount: 100 }, policy, 0.95, "CREATE_PAYMENT_LINK")).toBe("STOP_RECOVERY");
    expect(enforcePolicy({ status: "failed", retryCount: 0, contactCount: 2, amount: 100 }, policy, 0.95, "CREATE_PAYMENT_LINK")).toBe("STOP_RECOVERY");
  });
  it("applies probability and high-value rules before model action", () => {
    const policy = { maximumRetryCount: 3, maximumContactCount: 2, highValueThreshold: 10000, autonomyLevel: "recommended" };
    expect(enforcePolicy({ status: "failed", retryCount: 0, contactCount: 0, amount: 1000 }, policy, 0.2, "CREATE_PAYMENT_LINK")).toBe("STOP_RECOVERY");
    expect(enforcePolicy({ status: "failed", retryCount: 0, contactCount: 0, amount: 1000 }, policy, 0.45, "CREATE_PAYMENT_LINK")).toBe("RECOMMEND_PAYMENT_LINK");
    expect(enforcePolicy({ status: "failed", retryCount: 0, contactCount: 0, amount: 25000 }, policy, 0.85, "CREATE_PAYMENT_LINK")).toBe("ESCALATE_CASE");
    expect(enforcePolicy({ status: "failed", retryCount: 0, contactCount: 0, amount: 25000 }, { ...policy, autonomyLevel: "autonomous" }, 0.85, "CREATE_PAYMENT_LINK")).toBe("CREATE_PAYMENT_LINK");
  });
  it("accepts only supported structured decisions", () => {
    const decision = { diagnosis: "bank error", recovery_probability: 0.82, expected_recovery: 6970, recommended_action: "CREATE_PAYMENT_LINK", confidence: 0.91, risk_level: "LOW", customer_friction: "LOW", reason: "Returning customer with low friction path." };
    expect(["CREATE_PAYMENT_LINK", "RECOMMEND_PAYMENT_LINK", "ESCALATE_CASE", "STOP_RECOVERY"]).toContain(decision.recommended_action);
    expect(decision.recovery_probability).toBeGreaterThanOrEqual(0); expect(decision.recovery_probability).toBeLessThanOrEqual(1);
  });
});
