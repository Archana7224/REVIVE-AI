import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
export const supabase = url && anonKey ? createClient(url, anonKey) : null;

export type PaymentLinkInput = { recovery_case_id: string; amount: number; customer_name: string; customer_email: string; customer_phone?: string };

export async function createPaymentLink(input: PaymentLinkInput) {
  if (!supabase) throw new Error("Supabase is not configured");
  let { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) {
    const { error } = await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: window.location.href, queryParams: { prompt: "select_account" } } });
    if (error) throw error;
    throw new Error("Supabase sign-in started. Return to REVIVE to continue recovery.");
  }
  const { data, error } = await supabase.functions.invoke("razorpay-create-payment-link", { body: input, headers: { Authorization: `Bearer ${session.access_token}` } });
  if (error) throw error;
  return data as { id: string; short_url: string; status: string };
}

export function subscribeToRecoveryUpdates(onUpdate: (payload: unknown) => void) {
  if (!supabase) return () => undefined;
  const channel = supabase.channel("revive-recovery-updates").on("postgres_changes", { event: "UPDATE", schema: "public", table: "recovery_cases" }, onUpdate).subscribe();
  return () => { void supabase.removeChannel(channel); };
}
