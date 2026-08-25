/* REVIVE AI — Signal Paper: service boundaries stay async and domain-shaped for a future Supabase adapter. */
export type Merchant = { id: string; name: string; environment: "test" | "live"; currency: "INR" };
export type Customer = { id: string; name: string; email: string; lifetimeValue: number };
export type Payment = { id: string; customerId: string; amount: number; method: "UPI" | "CARD" | "NETBANKING" | "WALLET"; status: "failed" | "captured"; failureReason?: string; createdAt: string };
export type RecoveryCase = { id: string; paymentId: string; probability: number; expectedRecovery: number; strategy: string; status: string };
export type AgentLog = { id: string; timestamp: string; event: string; metadata: Record<string, unknown>; status: string };

const wait = <T,>(value: T, delay = 120): Promise<T> => new Promise(resolve => setTimeout(() => resolve(value), delay));
const merchant: Merchant = { id: "m_acme_001", name: "Acme Commerce", environment: "test", currency: "INR" };
const customers: Customer[] = [
  { id: "cus_aarav", name: "Aarav Sharma", email: "aarav@acme.example", lifetimeValue: 148500 },
  { id: "cus_ananya", name: "Ananya Patel", email: "ananya@acme.example", lifetimeValue: 93200 },
  { id: "cus_rohan", name: "Rohan Mehta", email: "rohan@acme.example", lifetimeValue: 62400 },
  { id: "cus_priya", name: "Priya Nair", email: "priya@acme.example", lifetimeValue: 41800 },
  { id: "cus_kabir", name: "Kabir Singh", email: "kabir@acme.example", lifetimeValue: 77300 },
];

export const dashboardService = {
  async getSummary() { return wait({ merchant, revenueAtRisk: 367000, expectedRecovery: 248000, recovered: 142500, recoveryRate: 57.3, customers }); },
};
export const paymentService = {
  async listFailed() { return wait<Payment[]>([
    { id: "RZP_1024", customerId: "cus_aarav", amount: 8500, method: "UPI", status: "failed", failureReason: "bank_error", createdAt: "2026-08-24T10:31:02+05:30" },
    { id: "RZP_1019", customerId: "cus_ananya", amount: 14200, method: "CARD", status: "failed", failureReason: "authentication_failed", createdAt: "2026-08-24T10:28:19+05:30" },
    { id: "RZP_1008", customerId: "cus_rohan", amount: 4800, method: "NETBANKING", status: "failed", failureReason: "timeout", createdAt: "2026-08-24T10:22:48+05:30" },
  ]); },
};
export const recoveryService = {
  async listCases() { return wait<RecoveryCase[]>([
    { id: "R1024", paymentId: "RZP_1024", probability: 82, expectedRecovery: 6970, strategy: "payment_link", status: "needs_review" },
    { id: "R1019", paymentId: "RZP_1019", probability: 76, expectedRecovery: 10792, strategy: "delayed_payment_link", status: "recovered" },
  ]); },
  async createPaymentLink(caseId: string) { return wait({ caseId, status: "created", createdAt: new Date().toISOString() }); },
};
export const agentService = { async getActivity() { return wait<AgentLog[]>([]); } };
export const auditService = { async listEvents() { return wait<AgentLog[]>([]); } };
export const simulatorService = { async compare(input: { amount: number; customers: number }) { return wait({ input, recommended: "delayed_payment_link" }); } };
