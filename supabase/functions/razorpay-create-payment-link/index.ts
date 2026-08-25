import { corsHeaders, json, razorpayAuthHeader, requireUser } from "../_shared/razorpay.ts";

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return json({ error: "Method not allowed" }, 405);
  try {
    const { supabase, user } = await requireUser(request);
    const input = await request.json();
    const recoveryCaseId = typeof input?.recovery_case_id === "string" ? input.recovery_case_id : "";
    if (!recoveryCaseId) return json({ error: "recovery_case_id is required" }, 400);

    const { data: recoveryCase, error: caseError } = await supabase.from("recovery_cases").select("id,status,amount_at_risk,actual_recovery,payment:payments!inner(id,amount,status,razorpay_payment_id,merchant:merchants!inner(email)),customer:customers!inner(name,email,phone)").eq("id", recoveryCaseId).maybeSingle();
    if (caseError) throw caseError;
    if (!recoveryCase) return json({ error: "Recovery case not found" }, 404);
    const payment = Array.isArray(recoveryCase.payment) ? recoveryCase.payment[0] : recoveryCase.payment;
    const customer = Array.isArray(recoveryCase.customer) ? recoveryCase.customer[0] : recoveryCase.customer;
    const merchant = Array.isArray(payment?.merchant) ? payment.merchant[0] : payment?.merchant;
    if (!payment || !customer || merchant?.email !== user.email) return json({ error: "Recovery case is not accessible" }, 403);

    const eligibleStatuses = new Set(["needs_review", "eligible", "running"]);
    if (!eligibleStatuses.has(recoveryCase.status)) return json({ error: "Recovery policy does not allow a payment link for this case" }, 409);
    if (["captured", "paid", "success"].includes(String(payment.status).toLowerCase()) || Number(recoveryCase.actual_recovery ?? 0) > 0) return json({ error: "Payment has already been captured" }, 409);

    const { count: priorLinkCount, error: actionError } = await supabase.from("recovery_actions").select("id", { count: "exact", head: true }).eq("recovery_case_id", recoveryCaseId).eq("action_type", "payment_link");
    if (actionError) throw actionError;
    if ((priorLinkCount ?? 0) >= 1) return json({ error: "Recovery policy limit reached for payment links" }, 409);

    const amountRupees = Number(payment.amount);
    if (!Number.isFinite(amountRupees) || amountRupees <= 0) return json({ error: "Stored payment amount is invalid" }, 422);
    const amountPaise = Math.round(amountRupees * 100);
    const razorpayResponse = await fetch("https://api.razorpay.com/v1/payment_links", { method: "POST", headers: { Authorization: razorpayAuthHeader(), "Content-Type": "application/json" }, body: JSON.stringify({ amount: amountPaise, currency: "INR", accept_partial: false, description: `REVIVE recovery for ${recoveryCase.id}`, customer: { name: customer.name, email: customer.email, contact: customer.phone ?? undefined }, notify: { sms: Boolean(customer.phone), email: true }, callback_method: "get" }) });
    const razorpayBody = await razorpayResponse.json();
    if (!razorpayResponse.ok) return json({ error: "Razorpay rejected the payment link request", details: razorpayBody?.error?.description ?? "Unknown Razorpay error" }, 502);

    const { error: linkError } = await supabase.from("payment_links").insert({ recovery_case_id: recoveryCaseId, razorpay_payment_link_id: razorpayBody.id, short_url: razorpayBody.short_url, amount: amountRupees, status: "created" });
    if (linkError) throw linkError;
    const actor = user.id;
    const { error: actionInsertError } = await supabase.from("recovery_actions").insert({ recovery_case_id: recoveryCaseId, action_type: "payment_link", tool_name: "razorpay_create_payment_link", status: "success", input: { recovery_case_id: recoveryCaseId, actor }, output: { razorpay_payment_link_id: razorpayBody.id, short_url: razorpayBody.short_url } });
    if (actionInsertError) throw actionInsertError;
    const { error: logError } = await supabase.from("agent_logs").insert({ recovery_case_id: recoveryCaseId, event_type: "payment_link_created", message: "Payment Link created", metadata: { actor, razorpay_payment_link_id: razorpayBody.id } });
    if (logError) throw logError;
    return json({ id: razorpayBody.id, short_url: razorpayBody.short_url, status: "created" }, 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected server error";
    const status = message === "Unauthorized" || message === "Missing bearer token" ? 401 : 500;
    return json({ error: status === 401 ? "Unauthorized" : message }, status);
  }
});
