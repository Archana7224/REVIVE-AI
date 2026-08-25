import { trpc } from "@/lib/trpc";

export function useDashboardSummary(enabled = true) {
  return trpc.dashboard.summary.useQuery(undefined, {
    enabled,
    retry: false,
    staleTime: 30_000,
  });
}
