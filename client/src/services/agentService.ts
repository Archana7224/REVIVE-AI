import { supabase } from "./razorpayService";

async function accessToken() {
  if (!supabase) throw new Error("Supabase is not configured");
  const { data } = await supabase.auth.getSession();
  if (data.session?.access_token) return data.session.access_token;
  const { error } = await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: window.location.href, queryParams: { prompt: "select_account" } } });
  if (error) throw error;
  throw new Error("Supabase sign-in started. Return to REVIVE to continue.");
}

export async function runRecoveryAgent(paymentId: string) {
  if (!supabase) throw new Error("Supabase is not configured");
  const token = await accessToken();
  const { data, error } = await supabase.functions.invoke("recovery-agent", { body: { payment_id: paymentId }, headers: { Authorization: `Bearer ${token}` } });
  if (error) throw error;
  return data as { decision: { diagnosis: string; recovery_probability: number; expected_recovery: number; recommended_action: string; confidence: number; risk_level: string; customer_friction: string; reason: string }; action_result: unknown };
}

export async function listAgentLogs(limit = 50) {
  if (!supabase) return [];
  try {
    const { data, error } = await supabase.from("agent_logs").select("id,recovery_case_id,event_type,message,metadata,created_at").order("created_at", { ascending: false }).limit(limit);
    if (error) return [];
    return data ?? [];
  } catch { return []; }
}

export async function listAuditLogs(limit = 100) { return listAgentLogs(limit); }

export function subscribeToAgentLogs(onUpdate: () => void) {
  const client = supabase;
  if (!client) return () => undefined;
  const channel = client.channel("revive-agent-audit-updates").on("postgres_changes", { event: "INSERT", schema: "public", table: "agent_logs" }, onUpdate).subscribe();
  return () => { void client.removeChannel(channel); };
}
