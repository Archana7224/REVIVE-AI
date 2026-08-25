import { describe, expect, it } from "vitest";

function agentLogPayload(input: { caseId: string; toolName: string; inputs: unknown; outputs: unknown; decision: string; policyResult: string }) {
  return { recovery_case_id: input.caseId, event_type: "recovery_agent_step", message: input.decision, metadata: { tool_name: input.toolName, inputs: input.inputs, outputs: input.outputs, decision: input.decision, policy_result: input.policyResult, timestamp: expect.any(String) } };
}
function actionGate(action: string, policyAllows: boolean) { return ["CREATE_PAYMENT_LINK", "ESCALATE_CASE", "STOP_RECOVERY"].includes(action) && policyAllows ? "execute" : "defer"; }

describe("recovery-agent audit and action contracts", () => {
  it("writes auditable tool inputs, outputs, decisions, and policy results", () => {
    const payload = agentLogPayload({ caseId: "case_1", toolName: "predict_recovery", inputs: { payment_id: "pay_1" }, outputs: { recovery_probability: 0.82 }, decision: "prediction_calculated", policyResult: "deterministic_model" });
    expect(payload).toMatchObject({ recovery_case_id: "case_1", event_type: "recovery_agent_step", message: "prediction_calculated", metadata: { tool_name: "predict_recovery", inputs: { payment_id: "pay_1" }, outputs: { recovery_probability: 0.82 }, policy_result: "deterministic_model" } });
  });
  it("executes only allowed mutations and defers recommendations or blocked actions", () => {
    expect(actionGate("CREATE_PAYMENT_LINK", true)).toBe("execute");
    expect(actionGate("ESCALATE_CASE", true)).toBe("execute");
    expect(actionGate("STOP_RECOVERY", false)).toBe("defer");
    expect(actionGate("RECOMMEND_PAYMENT_LINK", true)).toBe("defer");
    expect(actionGate("UNSUPPORTED_ACTION", true)).toBe("defer");
  });
});
