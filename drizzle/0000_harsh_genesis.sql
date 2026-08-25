CREATE TABLE `agentLogs` (
	`id` varchar(36) NOT NULL,
	`recoveryCaseId` varchar(36),
	`eventType` varchar(64) NOT NULL,
	`message` text NOT NULL,
	`metadata` json NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `agentLogs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `customers` (
	`id` varchar(36) NOT NULL,
	`merchantId` varchar(36) NOT NULL,
	`externalCustomerId` varchar(128) NOT NULL,
	`name` varchar(255) NOT NULL,
	`email` varchar(320) NOT NULL,
	`phone` varchar(32),
	`totalTransactions` int NOT NULL DEFAULT 0,
	`successfulTransactions` int NOT NULL DEFAULT 0,
	`failedTransactions` int NOT NULL DEFAULT 0,
	`totalSpend` decimal(14,2) NOT NULL DEFAULT '0',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `customers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `merchants` (
	`id` varchar(36) NOT NULL,
	`name` varchar(255) NOT NULL,
	`email` varchar(320) NOT NULL,
	`razorpayAccountId` varchar(128),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `merchants_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `paymentLinks` (
	`id` varchar(36) NOT NULL,
	`recoveryCaseId` varchar(36) NOT NULL,
	`razorpayPaymentLinkId` varchar(128),
	`shortUrl` varchar(512),
	`amount` decimal(14,2) NOT NULL,
	`status` varchar(32) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `paymentLinks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `payments` (
	`id` varchar(36) NOT NULL,
	`merchantId` varchar(36) NOT NULL,
	`customerId` varchar(36) NOT NULL,
	`razorpayPaymentId` varchar(128),
	`razorpayOrderId` varchar(128),
	`amount` decimal(14,2) NOT NULL,
	`currency` varchar(3) NOT NULL DEFAULT 'INR',
	`paymentMethod` varchar(32) NOT NULL,
	`status` varchar(32) NOT NULL,
	`failureReason` varchar(64),
	`attemptNumber` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `payments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `recoveryActions` (
	`id` varchar(36) NOT NULL,
	`recoveryCaseId` varchar(36) NOT NULL,
	`actionType` varchar(64) NOT NULL,
	`toolName` varchar(128) NOT NULL,
	`status` varchar(32) NOT NULL,
	`input` json NOT NULL,
	`output` json NOT NULL,
	`executedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `recoveryActions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `recoveryCases` (
	`id` varchar(36) NOT NULL,
	`paymentId` varchar(36) NOT NULL,
	`customerId` varchar(36) NOT NULL,
	`status` varchar(32) NOT NULL,
	`strategy` varchar(64),
	`amountAtRisk` decimal(14,2) NOT NULL,
	`expectedRecovery` decimal(14,2) NOT NULL,
	`actualRecovery` decimal(14,2) NOT NULL DEFAULT '0',
	`startedAt` timestamp,
	`completedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `recoveryCases_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `revenueRisk` (
	`id` varchar(36) NOT NULL,
	`paymentId` varchar(36) NOT NULL,
	`riskScore` decimal(5,2) NOT NULL,
	`recoveryProbability` decimal(5,2) NOT NULL,
	`expectedRecovery` decimal(14,2) NOT NULL,
	`priority` varchar(16) NOT NULL,
	`reason` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `revenueRisk_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`openId` varchar(64) NOT NULL,
	`name` text,
	`email` varchar(320),
	`loginMethod` varchar(64),
	`role` enum('user','admin') NOT NULL DEFAULT 'user',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`lastSignedIn` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_openId_unique` UNIQUE(`openId`)
);
--> statement-breakpoint
CREATE TABLE `webhookEvents` (
	`id` varchar(36) NOT NULL,
	`eventId` varchar(128) NOT NULL,
	`eventType` varchar(64) NOT NULL,
	`payload` json NOT NULL,
	`processed` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `webhookEvents_id` PRIMARY KEY(`id`),
	CONSTRAINT `webhookEvents_eventId_unique` UNIQUE(`eventId`)
);
--> statement-breakpoint
ALTER TABLE `agentLogs` ADD CONSTRAINT `agentLogs_recoveryCaseId_recoveryCases_id_fk` FOREIGN KEY (`recoveryCaseId`) REFERENCES `recoveryCases`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `customers` ADD CONSTRAINT `customers_merchantId_merchants_id_fk` FOREIGN KEY (`merchantId`) REFERENCES `merchants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `paymentLinks` ADD CONSTRAINT `paymentLinks_recoveryCaseId_recoveryCases_id_fk` FOREIGN KEY (`recoveryCaseId`) REFERENCES `recoveryCases`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `payments` ADD CONSTRAINT `payments_merchantId_merchants_id_fk` FOREIGN KEY (`merchantId`) REFERENCES `merchants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `payments` ADD CONSTRAINT `payments_customerId_customers_id_fk` FOREIGN KEY (`customerId`) REFERENCES `customers`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `recoveryActions` ADD CONSTRAINT `recoveryActions_recoveryCaseId_recoveryCases_id_fk` FOREIGN KEY (`recoveryCaseId`) REFERENCES `recoveryCases`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `recoveryCases` ADD CONSTRAINT `recoveryCases_paymentId_payments_id_fk` FOREIGN KEY (`paymentId`) REFERENCES `payments`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `recoveryCases` ADD CONSTRAINT `recoveryCases_customerId_customers_id_fk` FOREIGN KEY (`customerId`) REFERENCES `customers`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `revenueRisk` ADD CONSTRAINT `revenueRisk_paymentId_payments_id_fk` FOREIGN KEY (`paymentId`) REFERENCES `payments`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `agent_logs_created_idx` ON `agentLogs` (`createdAt`);--> statement-breakpoint
CREATE INDEX `customers_merchant_idx` ON `customers` (`merchantId`);--> statement-breakpoint
CREATE INDEX `payments_status_idx` ON `payments` (`status`);--> statement-breakpoint
CREATE INDEX `payments_created_idx` ON `payments` (`createdAt`);--> statement-breakpoint
CREATE INDEX `payments_failure_idx` ON `payments` (`failureReason`);--> statement-breakpoint
CREATE INDEX `payments_merchant_idx` ON `payments` (`merchantId`);--> statement-breakpoint
CREATE INDEX `recovery_cases_status_idx` ON `recoveryCases` (`status`);--> statement-breakpoint
CREATE INDEX `recovery_cases_customer_idx` ON `recoveryCases` (`customerId`);--> statement-breakpoint
CREATE INDEX `revenue_risk_priority_idx` ON `revenueRisk` (`priority`);--> statement-breakpoint
CREATE INDEX `revenue_risk_probability_idx` ON `revenueRisk` (`recoveryProbability`);