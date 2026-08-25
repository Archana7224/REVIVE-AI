# REVIVE AI Change Checklist

- [x] Read and extract the requested changes from `pasted_content_2.txt`.
- [x] Map each requested change to the relevant REVIVE AI frontend files and components.
- [x] Implement the requested visual and interaction updates, including intentional backend and database changes from the attached brief.
- [x] Run type-check and production build validation.
- [x] Capture representative responsive previews and inspect for regressions.
- [x] Save a new checkpoint and deliver the updated project.

## Attached Brief Requirements

- [x] Add merchants, customers, payments, revenue_risk, recovery_cases, recovery_actions, payment_links, agent_logs, and webhook_events to the Drizzle schema.
- [x] Add required indexes, foreign keys, UUID identifiers, timestamps, JSON fields, and safe merchant-scoped access patterns.
- [x] Generate and apply the database migration through the managed database workflow.
- [x] Add server-side dashboard, payment, recovery, agent, audit, and simulator query helpers.
- [x] Add protected tRPC procedures and connect the existing React service layer through typed API calls.
- [x] Replace dashboard mock metrics with calculated database-backed metrics while preserving the existing UI.
- [x] Seed realistic synthetic demo data without exposing secrets.
- [x] Add Vitest coverage for the new server query/procedure behavior.

## Gap Resolution

- [x] Replace shared first-merchant lookup with authenticated email-scoped merchant resolution.
- [x] Add missing payment and simulator server helpers and protected procedures.
- [x] Route dashboard data through the client service abstraction and add loading/error states.
- [x] Verify and execute demo seeding, then confirm row counts.
- [x] Expand Vitest coverage for protected data contracts and query behavior.
- [x] Capture updated desktop, tablet, and mobile previews after full-stack changes.
- [x] Update the prior checklist wording to reflect intentional backend changes.
- [x] Ensure the scaffold users table exists in the managed database for OAuth callbacks.
- [x] Add authenticated and unauthenticated procedure tests for dashboard, recovery, agent, audit, and simulator routes.
- [x] Add merchant-scoped seeded-output assertions to server tests.
- [x] Add anonymous-access assertions for every protected REVIVE procedure.
- [x] Assert seeded merchant record contents and exclusion of another merchant’s records.
- [x] Add a second-merchant fixture with distinct payment, recovery, agent, and audit records and assert cross-merchant exclusion.
- [x] Strengthen seeded assertions with concrete counts and representative identifiers/events.
- [x] Assert primary dashboard, agent activity, and audit results exclude the second merchant fixture.
- [x] Assert the second authenticated merchant receives only its own agent and audit records.

## Razorpay Test Mode Integration

- [x] Request and configure server-only Razorpay credentials for Test Mode.
- [x] Create the Supabase Edge Function contract for authenticated payment-link creation.
- [x] Implement recovery-case eligibility, captured-state, policy-limit, and amount validation before Razorpay calls.
- [x] Persist payment links, recovery actions, and agent logs through secure server-side data access.
- [x] Create the Razorpay webhook Edge Function with raw-body signature verification and event idempotency.
- [x] Handle payment.failed, payment.authorized, payment.captured, and order.paid events safely.
- [x] Update payments, recovery cases, actual recovery, and dashboard metrics after captured events.
- [x] Connect Create Payment Link and Start Recovery actions to the server function with required status copy.
- [x] Add realtime recovery updates to the frontend without changing the existing visual design.
- [x] Add tests for secret handling, signature validation, idempotency, eligibility, and protected action flows.
- [x] Verify the integration and save a checkpoint for delivery.

## Final Razorpay Hardening

- [x] Connect Start Recovery to the live server-side payment-link flow with explicit progress and success handling.
- [x] Add a documented Supabase auth bridge requirement and realtime/RLS SQL policies for merchant-scoped updates.
- [x] Add deterministic tests for webhook signatures, idempotency behavior, policy eligibility, and protected payment-link invocation.
- [x] Run final verification and save a fresh post-Razorpay checkpoint for delivery.

## REVIVE AI Recovery Agent

- [x] Define structured agent decision schema and modular tool contracts.
- [x] Implement get_payment, get_customer_history, predict_recovery, and get_recovery_policy tools with deterministic prediction.
- [x] Implement policy-gated create_payment_link, escalate_case, and stop_recovery actions.
- [x] Add structured LLM JSON output and tool-calling orchestration on the server side only.
- [x] Log every agent step, tool call, output, policy result, and final decision to agent_logs.
- [x] Add recovery-agent authentication and hard rules for captured payments, retry/contact limits, unsupported actions, and policy overrides.
- [x] Display live agent and audit logs in the existing Agent and Audit pages.
- [x] Add tests for prediction boundaries, policy enforcement, tool safety, structured decisions, and audit logging.
- [x] Run regression verification and save a fresh recovery-agent checkpoint.

## Recovery Agent Hardening

- [x] Implement a real LLM tool-calling loop that executes read tools and feeds tool results back into the model before final JSON output.
- [x] Keep action tools policy-gated and prevent the model from directly executing unsupported or unsafe actions.
- [x] Fix Agent page invocation to pass a real payment ID rather than a recovery-case ID.
- [x] Add tests for audit-log writes and protected action/tool execution paths.
- [x] Run final regression validation and save a fresh recovery-agent checkpoint.

## Live Log Loading Fix

- [x] Keep Agent and Audit pages usable when Supabase is not configured or the user has no Supabase session.
- [x] Add a safe fallback to the existing server-backed REVIVE activity and audit data.
- [x] Re-verify the pages without error toasts after the fallback is wired.

## Final Recovery-Agent Verification

- [x] Add direct unit coverage for agent_logs insertion payloads and policy-gated action execution/deferment.
- [x] Save a fresh checkpoint after the latest recovery-agent changes and deliver it.
- [ ] Create and deliver a new checkpoint containing the completed recovery-agent implementation.
