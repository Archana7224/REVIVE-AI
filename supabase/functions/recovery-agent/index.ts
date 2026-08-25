import { corsHeaders, json, requireUser } from "../_shared/razorpay.ts";

type Decision = { diagnosis: string; recovery_probability: number; expected_recovery: number; recommended_action: "CREATE_PAYMENT_LINK" | "RECOMMEND_PAYMENT_LINK" | "ESCALATE_CASE" | "STOP_RECOVERY"; confidence: number; risk_level: "LOW" | "MEDIUM" | "HIGH"; customer_friction: "LOW" | "MEDIUM" | "HIGH"; reason: string };
type PaymentSnapshot = { id: string; amount: number; status: string; payment_method: string; failure_reason: string | null; attempt_number: number; customer_id: string; merchant_id: string; recovery_case_id: string; retry_count: number; contact_count: number };
type Policy = { minimum_recovery_probability: number; maximum_retry_count: number; maximum_contact_count: number; high_value_threshold: number; autonomy_level: string };

const ACTIONS = new Set(["CREATE_PAYMENT_LINK", "RECOMMEND_PAYMENT_LINK", "ESCALATE_CASE", "STOP_RECOVERY"]);
const TOOL_DEFINITIONS = [
  { type: "function", function: { name: "get_payment", description: "Load the authoritative payment and recovery state. Never infer payment state from user input.", parameters: { type: "object", properties: { payment_id: { type: "string" } }, required: ["payment_id"], additionalProperties: false } } },
  { type: "function", function: { name: "get_customer_history", description: "Load historical customer payment and recovery features.", parameters: { type: "object", properties: { customer_id: { type: "string" } }, required: ["customer_id"], additionalProperties: false } } },
  { type: "function", function: { name: "predict_recovery", description: "Calculate deterministic recovery probability from historical features.", parameters: { type: "object", properties: { payment_id: { type: "string" } }, required: ["payment_id"], additionalProperties: false } } },
  { type: "function", function: { name: "get_recovery_policy", description: "Load the merchant recovery policy.", parameters: { type: "object", properties: { merchant_id: { type: "string" } }, required: ["merchant_id"], additionalProperties: false } } },
  { type: "function", function: { name: "create_payment_link", description: "Create a payment link only after the policy engine explicitly permits it.", parameters: { type: "object", properties: { payment_id: { type: "string" } }, required: ["payment_id"], additionalProperties: false } } },
  { type: "function", function: { name: "escalate_case", description: "Escalate a recovery case to a human revenue operator.", parameters: { type: "object", properties: { payment_id: { type: "string" }, reason: { type: "string" } }, required: ["payment_id", "reason"], additionalProperties: false } } },
  { type: "function", function: { name: "stop_recovery", description: "Stop recovery when policy or probability makes action unsafe.", parameters: { type: "object", properties: { payment_id: { type: "string" }, reason: { type: "string" } }, required: ["payment_id", "reason"], additionalProperties: false } } },
];

function clamp(value: number, min = 0, max = 1) { return Math.max(min, Math.min(max, value)); }
function asOne(value: unknown) { return Array.isArray(value) ? value[0] : value; }
function number(value: unknown, fallback = 0) { const parsed = Number(value); return Number.isFinite(parsed) ? parsed : fallback; }

async function logStep(supabase: any, recoveryCaseId: string, toolName: string, inputs: unknown, outputs: unknown, decision: string, policyResult: string) {
  await supabase.from("agent_logs").insert({ recovery_case_id: recoveryCaseId, event_type: "recovery_agent_step", message: decision, metadata: { tool_name: toolName, inputs, outputs, decision, policy_result: policyResult, timestamp: new Date().toISOString() } });
}

async function getPayment(supabase: any, paymentId: string, userEmail: string): Promise<PaymentSnapshot> {
  const { data, error } = await supabase.from("payments").select("id,amount,status,payment_method,failure_reason,attempt_number,customer_id,merchant_id,recovery_cases!inner(id,status,retry_count,contact_count),merchants!inner(email)").eq("id", paymentId).maybeSingle();
  if (error) throw error;
  if (!data) throw new Error("Payment not found");
  const merchant = asOne(data.merchants); const recovery = asOne(data.recovery_cases);
  if (!merchant || merchant.email !== userEmail) throw new Error("Payment is not accessible");
  return { id: data.id, amount: number(data.amount), status: String(data.status ?? "unknown"), payment_method: String(data.payment_method ?? "unknown"), failure_reason: data.failure_reason ?? null, attempt_number: number(data.attempt_number, 1), customer_id: data.customer_id, merchant_id: data.merchant_id, recovery_case_id: recovery.id, retry_count: number(recovery.retry_count), contact_count: number(recovery.contact_count) };
}

async function getCustomerHistory(supabase: any, customerId: string, merchantId: string) {
  const { data, error } = await supabase.from("payments").select("amount,status").eq("customer_id", customerId).eq("merchant_id", merchantId);
  if (error) throw error;
  const rows = data ?? []; const successful = rows.filter((row: any) => ["captured", "paid", "success"].includes(String(row.status).toLowerCase())); const failed = rows.filter((row: any) => ["failed", "authorized"].includes(String(row.status).toLowerCase())); const total = successful.length + failed.length;
  const history = { successful_transactions: successful.length, failed_transactions: failed.length, success_rate: total ? successful.length / total : 0, total_spend: successful.reduce((sum: number, row: any) => sum + number(row.amount), 0), previous_recoveries: 0 };
  return history;
}

async function getPolicy(supabase: any, merchantId: string): Promise<Policy> {
  const { data, error } = await supabase.from("recovery_policies").select("minimum_recovery_probability,maximum_retry_count,maximum_contact_count,high_value_threshold,autonomy_level").eq("merchant_id", merchantId).maybeSingle();
  if (error && error.code !== "PGRST116") throw error;
  return { minimum_recovery_probability: number(data?.minimum_recovery_probability, 0.3), maximum_retry_count: number(data?.maximum_retry_count, 3), maximum_contact_count: number(data?.maximum_contact_count, 2), high_value_threshold: number(data?.high_value_threshold, 10000), autonomy_level: String(data?.autonomy_level ?? "recommended") };
}

function predict(payment: PaymentSnapshot, history: { success_rate: number; successful_transactions: number; failed_transactions: number; previous_recoveries: number }) {
  const experience = clamp(history.successful_transactions / 10) * 0.16; const successRate = history.success_rate * 0.42; const retryPenalty = clamp(Math.max(0, payment.attempt_number - 1) / 5) * 0.14; const failurePenalty = clamp(history.failed_transactions / 12) * 0.08; const recoveryLift = clamp(history.previous_recoveries / 5) * 0.08;
  const probability = clamp(0.22 + successRate + experience + recoveryLift - retryPenalty - failurePenalty); return { recovery_probability: Number(probability.toFixed(4)), expected_recovery: Math.round(payment.amount * probability) };
}

async function callModel(messages: any[], includeTools = true) {
  const base = (Deno.env.get("BUILT_IN_FORGE_API_URL") ?? "").replace(/\/+$/, ""); const key = Deno.env.get("BUILT_IN_FORGE_API_KEY"); if (!base || !key) throw new Error("LLM server configuration is missing");
  const response = await fetch(`${base}/v1/chat/completions`, { method: "POST", headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" }, body: JSON.stringify({ model: Deno.env.get("REVIVE_AGENT_MODEL") ?? "gpt-5-mini", messages, ...(includeTools ? { tools: TOOL_DEFINITIONS, tool_choice: "auto" } : { response_format: { type: "json_schema", json_schema: { name: "recovery_decision", strict: true, schema: { type: "object", properties: { diagnosis: { type: "string" }, recovery_probability: { type: "number" }, expected_recovery: { type: "number" }, recommended_action: { type: "string", enum: ["CREATE_PAYMENT_LINK", "RECOMMEND_PAYMENT_LINK", "ESCALATE_CASE", "STOP_RECOVERY"] }, confidence: { type: "number" }, risk_level: { type: "string", enum: ["LOW", "MEDIUM", "HIGH"] }, customer_friction: { type: "string", enum: ["LOW", "MEDIUM", "HIGH"] }, reason: { type: "string" } }, required: ["diagnosis", "recovery_probability", "expected_recovery", "recommended_action", "confidence", "risk_level", "customer_friction", "reason"], additionalProperties: false } } } }), max_completion_tokens: 1200 }) });
  if (!response.ok) throw new Error(`LLM decision failed: ${await response.text()}`); return await response.json();
}

async function invokeDecision(supabase: any, recoveryCaseId: string, paymentId: string, userEmail: string) {
  const messages: any[] = [{ role: "system", content: "You are REVIVE AI, a revenue-recovery agent. Inspect authoritative records with tools before deciding. Optimize expected recovered revenue while minimizing customer friction. Never override policy, act on captured payments, invent results, or execute mutation tools; the server policy gate will execute only an allowed action. Return the required JSON decision after inspection." }, { role: "user", content: JSON.stringify({ payment_id: paymentId, instruction: "Inspect payment, customer history, recovery probability, and merchant recovery policy, then produce one structured decision." }) }];
  for (let round = 0; round < 6; round++) {
    const body = await callModel(messages, true); const message = body.choices?.[0]?.message; if (!message) throw new Error("LLM returned no message");
    const toolCalls = message.tool_calls ?? [];
    if (!toolCalls.length) { const finalBody = await callModel([...messages, message, { role: "user", content: "Return the final recovery decision now as JSON matching the required schema." }], false); return finalBody.choices?.[0]?.message ?? message; }
    messages.push(message);
    for (const call of toolCalls) {
      const name = call.function?.name; let args: any = {}; try { args = JSON.parse(call.function?.arguments ?? "{}"); } catch { args = {}; }
      let output: unknown;
      try {
        if (name === "get_payment") output = await getPayment(supabase, args.payment_id ?? paymentId, userEmail);
        else if (name === "get_customer_history") { const payment = await getPayment(supabase, paymentId, userEmail); output = await getCustomerHistory(supabase, args.customer_id ?? payment.customer_id, payment.merchant_id); }
        else if (name === "predict_recovery") { const payment = await getPayment(supabase, args.payment_id ?? paymentId, userEmail); const history = await getCustomerHistory(supabase, payment.customer_id, payment.merchant_id); output = predict(payment, history); }
        else if (name === "get_recovery_policy") { const payment = await getPayment(supabase, paymentId, userEmail); output = await getPolicy(supabase, args.merchant_id ?? payment.merchant_id); }
        else if (["create_payment_link", "escalate_case", "stop_recovery"].includes(name)) output = { status: "deferred_to_server_policy_gate", action: name };
        else output = { error: "unsupported_tool" };
      } catch (error) { output = { error: error instanceof Error ? error.message : "tool_failed" }; }
      await logStep(supabase, recoveryCaseId, name ?? "unknown_tool", args, output, "tool_call_completed", name && ["create_payment_link", "escalate_case", "stop_recovery"].includes(name) ? "mutation_deferred" : "read_only");
      messages.push({ role: "tool", tool_call_id: call.id, content: JSON.stringify(output) });
    }
  }
  throw new Error("Recovery agent exceeded its tool-call limit");
}

async function executeAction(supabase: any, request: Request, payment: PaymentSnapshot, action: string, reason: string) {
  if (action === "CREATE_PAYMENT_LINK") {
    const linkUrl = new URL("../razorpay-create-payment-link", request.url); const result = await fetch(linkUrl, { method: "POST", headers: { Authorization: request.headers.get("Authorization") ?? "", "Content-Type": "application/json" }, body: JSON.stringify({ recovery_case_id: payment.recovery_case_id }) }); const body = await result.json(); if (!result.ok) throw new Error(body.error ?? "Payment link creation failed"); return body;
  }
  if (action === "ESCALATE_CASE" || action === "STOP_RECOVERY") {
    const status = action === "ESCALATE_CASE" ? "escalated" : "stopped"; const { error } = await supabase.from("recovery_cases").update({ status }).eq("id", payment.recovery_case_id); if (error) throw error; const { error: actionError } = await supabase.from("recovery_actions").insert({ recovery_case_id: payment.recovery_case_id, action_type: action.toLowerCase(), tool_name: action.toLowerCase(), status: "success", input: { payment_id: payment.id, reason }, output: { status } }); if (actionError) throw actionError; return { status, reason };
  }
  return { status: "recommendation_only" };
}

function enforcePolicy(payment: PaymentSnapshot, policy: Policy, probability: number, requestedAction: string) {
  if (["captured", "paid", "success"].includes(payment.status.toLowerCase())) return { action: "STOP_RECOVERY", result: "captured_payment" };
  if (payment.retry_count >= policy.maximum_retry_count) return { action: "STOP_RECOVERY", result: "retry_limit" };
  if (payment.contact_count >= policy.maximum_contact_count) return { action: "STOP_RECOVERY", result: "contact_limit" };
  if (probability < 0.3) return { action: "STOP_RECOVERY", result: "low_probability" };
  if (payment.amount > policy.high_value_threshold && !["autonomous", "full"].includes(policy.autonomy_level.toLowerCase())) return { action: "ESCALATE_CASE", result: "high_value_requires_human" };
  if (probability < 0.6) return { action: "RECOMMEND_PAYMENT_LINK", result: "recommendation_only" };
  if (requestedAction === "CREATE_PAYMENT_LINK" && ACTIONS.has(requestedAction)) return { action: "CREATE_PAYMENT_LINK", result: "allowed" };
  return { action: "RECOMMEND_PAYMENT_LINK", result: "recommendation_only" };
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return json({ error: "Method not allowed" }, 405);
  try {
    const { supabase, user } = await requireUser(request); const input = await request.json(); const paymentId = typeof input?.payment_id === "string" ? input.payment_id : ""; if (!paymentId) return json({ error: "payment_id is required" }, 400);
    const payment = await getPayment(supabase, paymentId, user.email ?? ""); await logStep(supabase, payment.recovery_case_id, "get_payment", { payment_id: paymentId }, payment, "payment_loaded", "authorized");
    const history = await getCustomerHistory(supabase, payment.customer_id, payment.merchant_id); await logStep(supabase, payment.recovery_case_id, "get_customer_history", { customer_id: payment.customer_id }, history, "history_loaded", "authorized");
    const prediction = predict(payment, history); await logStep(supabase, payment.recovery_case_id, "predict_recovery", { payment_id: paymentId }, prediction, "prediction_calculated", "deterministic_model");
    const policy = await getPolicy(supabase, payment.merchant_id); await logStep(supabase, payment.recovery_case_id, "get_recovery_policy", { merchant_id: payment.merchant_id }, policy, "policy_loaded", "authorized");
    const message = await invokeDecision(supabase, payment.recovery_case_id, paymentId, user.email ?? ""); let decision: Decision;
    try { decision = JSON.parse(typeof message?.content === "string" ? message.content : "{}"); } catch { throw new Error("LLM returned invalid structured decision"); }
    const probability = clamp(number(decision.recovery_probability, prediction.recovery_probability)); const policyGate = enforcePolicy(payment, policy, probability, decision.recommended_action); const finalDecision: Decision = { diagnosis: decision.diagnosis || "Payment recovery evaluated from authoritative records.", recovery_probability: probability, expected_recovery: prediction.expected_recovery, recommended_action: policyGate.action as Decision["recommended_action"], confidence: clamp(number(decision.confidence, 0.7)), risk_level: policyGate.action === "STOP_RECOVERY" ? "HIGH" : policyGate.action === "ESCALATE_CASE" ? "MEDIUM" : "LOW", customer_friction: policyGate.action === "CREATE_PAYMENT_LINK" ? "LOW" : policyGate.action === "ESCALATE_CASE" ? "MEDIUM" : "LOW", reason: `${decision.reason || "Policy-aware recovery recommendation."} Policy result: ${policyGate.result}.` };
    await logStep(supabase, payment.recovery_case_id, "recovery_decision", { payment_id: paymentId }, finalDecision, "decision_created", policyGate.result);
    let actionResult: unknown = null; if (finalDecision.recommended_action === "CREATE_PAYMENT_LINK" || finalDecision.recommended_action === "ESCALATE_CASE" || finalDecision.recommended_action === "STOP_RECOVERY") { actionResult = await executeAction(supabase, request, payment, finalDecision.recommended_action, finalDecision.reason); await logStep(supabase, payment.recovery_case_id, finalDecision.recommended_action.toLowerCase(), { payment_id: paymentId }, actionResult, "action_executed", policyGate.result); }
    return json({ decision: finalDecision, action_result: actionResult, tools: { payment, history, prediction, policy } });
  } catch (error) { const message = error instanceof Error ? error.message : "Unexpected server error"; const status = message === "Unauthorized" || message === "Missing bearer token" ? 401 : message.includes("not accessible") ? 403 : 500; return json({ error: status === 401 ? "Unauthorized" : message }, status); }
});
