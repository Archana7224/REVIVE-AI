import { decimal, index, int, json, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const merchants = mysqlTable("merchants", {
  id: varchar("id", { length: 36 }).primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  razorpayAccountId: varchar("razorpayAccountId", { length: 128 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const customers = mysqlTable("customers", {
  id: varchar("id", { length: 36 }).primaryKey(),
  merchantId: varchar("merchantId", { length: 36 }).notNull().references(() => merchants.id),
  externalCustomerId: varchar("externalCustomerId", { length: 128 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  phone: varchar("phone", { length: 32 }),
  totalTransactions: int("totalTransactions").default(0).notNull(),
  successfulTransactions: int("successfulTransactions").default(0).notNull(),
  failedTransactions: int("failedTransactions").default(0).notNull(),
  totalSpend: decimal("totalSpend", { precision: 14, scale: 2 }).default("0").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, table => ({ merchantIdx: index("customers_merchant_idx").on(table.merchantId) }));

export const payments = mysqlTable("payments", {
  id: varchar("id", { length: 36 }).primaryKey(),
  merchantId: varchar("merchantId", { length: 36 }).notNull().references(() => merchants.id),
  customerId: varchar("customerId", { length: 36 }).notNull().references(() => customers.id),
  razorpayPaymentId: varchar("razorpayPaymentId", { length: 128 }),
  razorpayOrderId: varchar("razorpayOrderId", { length: 128 }),
  amount: decimal("amount", { precision: 14, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).default("INR").notNull(),
  paymentMethod: varchar("paymentMethod", { length: 32 }).notNull(),
  status: varchar("status", { length: 32 }).notNull(),
  failureReason: varchar("failureReason", { length: 64 }),
  attemptNumber: int("attemptNumber").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => ({ statusIdx: index("payments_status_idx").on(table.status), createdIdx: index("payments_created_idx").on(table.createdAt), failureIdx: index("payments_failure_idx").on(table.failureReason), merchantIdx: index("payments_merchant_idx").on(table.merchantId) }));

export const revenueRisk = mysqlTable("revenueRisk", {
  id: varchar("id", { length: 36 }).primaryKey(),
  paymentId: varchar("paymentId", { length: 36 }).notNull().references(() => payments.id),
  riskScore: decimal("riskScore", { precision: 5, scale: 2 }).notNull(),
  recoveryProbability: decimal("recoveryProbability", { precision: 5, scale: 2 }).notNull(),
  expectedRecovery: decimal("expectedRecovery", { precision: 14, scale: 2 }).notNull(),
  priority: varchar("priority", { length: 16 }).notNull(),
  reason: text("reason").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, table => ({ priorityIdx: index("revenue_risk_priority_idx").on(table.priority), probabilityIdx: index("revenue_risk_probability_idx").on(table.recoveryProbability) }));

export const recoveryCases = mysqlTable("recoveryCases", {
  id: varchar("id", { length: 36 }).primaryKey(),
  paymentId: varchar("paymentId", { length: 36 }).notNull().references(() => payments.id),
  customerId: varchar("customerId", { length: 36 }).notNull().references(() => customers.id),
  status: varchar("status", { length: 32 }).notNull(),
  strategy: varchar("strategy", { length: 64 }),
  amountAtRisk: decimal("amountAtRisk", { precision: 14, scale: 2 }).notNull(),
  expectedRecovery: decimal("expectedRecovery", { precision: 14, scale: 2 }).notNull(),
  actualRecovery: decimal("actualRecovery", { precision: 14, scale: 2 }).default("0").notNull(),
  startedAt: timestamp("startedAt"),
  completedAt: timestamp("completedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, table => ({ statusIdx: index("recovery_cases_status_idx").on(table.status), customerIdx: index("recovery_cases_customer_idx").on(table.customerId) }));

export const recoveryActions = mysqlTable("recoveryActions", {
  id: varchar("id", { length: 36 }).primaryKey(),
  recoveryCaseId: varchar("recoveryCaseId", { length: 36 }).notNull().references(() => recoveryCases.id),
  actionType: varchar("actionType", { length: 64 }).notNull(),
  toolName: varchar("toolName", { length: 128 }).notNull(),
  status: varchar("status", { length: 32 }).notNull(),
  input: json("input").notNull(),
  output: json("output").notNull(),
  executedAt: timestamp("executedAt").defaultNow().notNull(),
});

export const paymentLinks = mysqlTable("paymentLinks", {
  id: varchar("id", { length: 36 }).primaryKey(),
  recoveryCaseId: varchar("recoveryCaseId", { length: 36 }).notNull().references(() => recoveryCases.id),
  razorpayPaymentLinkId: varchar("razorpayPaymentLinkId", { length: 128 }),
  shortUrl: varchar("shortUrl", { length: 512 }),
  amount: decimal("amount", { precision: 14, scale: 2 }).notNull(),
  status: varchar("status", { length: 32 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const agentLogs = mysqlTable("agentLogs", {
  id: varchar("id", { length: 36 }).primaryKey(),
  recoveryCaseId: varchar("recoveryCaseId", { length: 36 }).references(() => recoveryCases.id),
  eventType: varchar("eventType", { length: 64 }).notNull(),
  message: text("message").notNull(),
  metadata: json("metadata").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, table => ({ createdIdx: index("agent_logs_created_idx").on(table.createdAt) }));

export const webhookEvents = mysqlTable("webhookEvents", {
  id: varchar("id", { length: 36 }).primaryKey(),
  eventId: varchar("eventId", { length: 128 }).notNull().unique(),
  eventType: varchar("eventType", { length: 64 }).notNull(),
  payload: json("payload").notNull(),
  processed: int("processed").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Merchant = typeof merchants.$inferSelect;
export type Customer = typeof customers.$inferSelect;
export type Payment = typeof payments.$inferSelect;
export type RevenueRisk = typeof revenueRisk.$inferSelect;
export type RecoveryCase = typeof recoveryCases.$inferSelect;
export type RecoveryAction = typeof recoveryActions.$inferSelect;
export type PaymentLink = typeof paymentLinks.$inferSelect;
export type AgentLog = typeof agentLogs.$inferSelect;
export type WebhookEvent = typeof webhookEvents.$inferSelect;
