import { trpc } from "@/lib/trpc";

export function useDashboardSummary(enabled = true) {
  return trpc.dashboard.summary.useQuery(undefined, { enabled, retry: false, staleTime: 30_000 });
}

export function useRecoveryCases(enabled = true) {
  return trpc.recovery.cases.useQuery(undefined, { enabled, retry: false, staleTime: 15_000 });
}
