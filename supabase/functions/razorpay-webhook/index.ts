import { adminClient, corsHeaders, hmacSha256Hex, json, safeEqualHex } from "../_shared/razorpay.ts";

const capturedEvents = new Set(["payment.captured", "order.paid"]);
const knownEvents = new Set(["payment.failed", "payment.authorized", "payment.captured", "order.paid"]);

function entityFromPayload(payload: any) { return payload?.payload?.payment?.entity ?? payload?.payload?.order?.entity ?? payload?.payment?.entity ?? payload?.order?.entity ?? {}; }

Deno.serve(async (request) => {
  if (request.method !== "POST") return json({ error: "Method not allowed" }, 405);
  const rawBody = await request.text();
  const signature = request.headers.get("x-razorpay-signature") ?? "";
  const secret = Deno.env.get("RAZORPAY_WEBHOOK_SECRET");
  if (!secret || !signature) return json({ error: "Invalid webhook configuration" }, 401);
  const expected = await hmacSha256Hex(secret, rawBody);
  if (!await safeEqualHex(expected, signature)) return json({ error: "Invalid webhook signature" }, 401);

  try {
    const payload = JSON.parse(rawBody);
    const eventType = String(payload.event ?? "");
    if (!knownEvents.has(eventType)) return json({ received: true, ignored: true });
    const eventId = request.headers.get("x-razorpay-event-id") ?? payload.id ?? `${eventType}:${payload.created_at ?? "unknown"}:${entityFromPayload(payload).id ?? crypto.randomUUID()}`;
    const supabase = adminClient();
    const { data: existing } = await supabase.from("webhook_events").select("id").eq("event_id", eventId).maybeSingle();
    if (existing) return json({ received: true, duplicate: true });
    const { error: eventError } = await supabase.from("webhook_events").insert({ event_id: eventId, event_type: eventType, payload, processed: false });
    if (eventError) {
      if (eventError.code === "23505") return json({ received: true, duplicate: true });
      throw eventError;
    }

    const entity = entityFromPayload(payload);
    const paymentId = entity.id;
    const orderId = entity.order_id;
    let paymentQuery = supabase.from("payments").select("id,status,amount,merchant_id").limit(1);
    if (paymentId) paymentQuery = paymentQuery.eq("razorpay_payment_id", paymentId);
    else if (orderId) paymentQuery = paymentQuery.eq("razorpay_order_id", orderId);
    else { await supabase.from("webhook_events").update({ processed: true }).eq("event_id", eventId); return json({ received: true, processed: true }); }
    let { data: payment } = await paymentQuery.maybeSingle();
    if (!payment && paymentId && orderId) payment = (await supabase.from("payments").select("id,status,amount,merchant_id").eq("razorpay_order_id", orderId).limit(1).maybeSingle()).data;

    if (payment) {
      const nextStatus = eventType === "payment.failed" ? "failed" : eventType === "payment.authorized" ? "authorized" : capturedEvents.has(eventType) ? "captured" : payment.status;
      await supabase.from("payments").update({ status: nextStatus, razorpay_payment_id: paymentId ?? undefined, razorpay_order_id: orderId ?? undefined, failure_reason: entity.error_code ?? entity.error_description ?? null, updated_at: new Date().toISOString() }).eq("id", payment.id);
      if (capturedEvents.has(eventType)) {
        const capturedAmountRupees = Number(entity.amount ?? payment.amount ?? 0) / 100;
        const { data: cases } = await supabase.from("recovery_cases").select("id,status").eq("payment_id", payment.id);
        for (const recoveryCase of cases ?? []) {
          const alreadyRecovered = recoveryCase.status === "recovered";
          await supabase.from("recovery_cases").update({ status: "recovered", actual_recovery: capturedAmountRupees, completed_at: new Date().toISOString() }).eq("id", recoveryCase.id);
          if (!alreadyRecovered) await supabase.from("agent_logs").insert({ recovery_case_id: recoveryCase.id, event_type: "payment_captured", message: "Payment captured — revenue recovered.", metadata: { event_id: eventId, amount: capturedAmountRupees, source: eventType } });
        }
      }
    }
    await supabase.from("webhook_events").update({ processed: true }).eq("event_id", eventId);
    return json({ received: true, processed: true });
  } catch (error) {
    console.error("[razorpay-webhook] processing failed", error);
    return json({ error: "Webhook accepted but processing failed" }, 500);
  }
});
