import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { compareRecoveryStrategies, getDashboardSummary, getOrCreateDemoMerchant, listAgentActivity, listAuditEvents, listPayments, listRecoveryCases } from "./db";

async function merchantForUser(user: { email?: string | null; name?: string | null }) {
  const merchant = await getOrCreateDemoMerchant(user.email ?? "ops@acme.example", user.name ?? "Acme Commerce");
  if (!merchant) throw new Error("Database is not configured");
  return merchant;
}

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => { const cookieOptions = getSessionCookieOptions(ctx.req); ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 }); return { success: true } as const; }),
  }),
  dashboard: router({
    summary: protectedProcedure.query(async ({ ctx }) => getDashboardSummary((await merchantForUser(ctx.user)).id)),
  }),
  recovery: router({
    cases: protectedProcedure.query(async ({ ctx }) => listRecoveryCases((await merchantForUser(ctx.user)).id)),
    payments: protectedProcedure.query(async ({ ctx }) => listPayments((await merchantForUser(ctx.user)).id)),
  }),
  agent: router({
    activity: protectedProcedure.query(async ({ ctx }) => listAgentActivity((await merchantForUser(ctx.user)).id)),
  }),
  audit: router({
    events: protectedProcedure.query(async ({ ctx }) => listAuditEvents((await merchantForUser(ctx.user)).id)),
  }),
  simulator: router({
    compare: protectedProcedure.input(z.object({ amountAtRisk: z.number().positive() })).query(async ({ ctx, input }) => compareRecoveryStrategies((await merchantForUser(ctx.user)).id, input.amountAtRisk)),
  }),
});

export type AppRouter = typeof appRouter;
