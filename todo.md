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
- [x] Create and deliver a new checkpoint containing the completed recovery-agent implementation.

## Buildathon Product-Quality Pass

- [x] Audit the current dashboard and key demo routes for hierarchy, density, and first-10-second clarity.
- [x] Refine typography, spacing, metric cards, chart presentation, and AI recommendation prominence.
- [x] Improve loading, empty, error, toast, and confirmation states without changing core functionality.
- [x] Add subtle metric, recovery, status, and agent activity motion with reduced-motion support.
- [x] Improve financial action detail presentation with amount, expected recovery, probability, friction, policy, and reason.
- [x] Improve recovery status indicators and audit trail readability.
- [x] Verify desktop and mobile demo flows, then run tests and production build.
- [x] Save and deliver the polished buildathon checkpoint.

## Post-Review Product Polish

- [x] Make targeted dashboard edits that sharpen first-10-second clarity, metric emphasis, chart framing, and REVIVE recommendation visibility.
- [x] Make recovery actions consistently show amount, expected recovery, probability, friction, policy status, and reason.
- [x] Add explicit dashboard/recovery confirmation, loading, and error states.
- [x] Add concrete metric-update and recovered-revenue motion with reduced-motion support.
- [x] Capture fresh post-change desktop and mobile screenshots for dashboard, recovery, Agent, and Audit.
- [x] Run tests, type-check, and production build after the polish changes.
- [x] Save and deliver a new polished checkpoint.

## Final Post-Review Corrections

- [x] Make the dashboard recommendation and chart framing materially more prominent in Home.tsx.
- [x] Add the required financial-action fields to recovery table rows and their action review surface.
- [x] Add explicit Recovery loading, empty, error, and confirmation states in the current workflow.
- [x] Implement concrete metric-value and recovered-revenue animation behavior with reduced-motion fallback.
- [x] Capture fresh post-polish desktop screenshots for Recovery, Agent, and Audit as well as Dashboard.
- [x] Save and deliver a new checkpoint after the final corrections.

## Last Polish Gaps

- [x] Add explicit Recovery empty and error-state panels with a retry path.
- [x] Apply the recovered-revenue animation class to the actual recovered metric.
- [x] Save and deliver a fresh checkpoint after these final corrections.

## Reachable Recovery Error State

- [x] Wire Recovery refresh failure into the visible error panel with a retry action.
- [x] Re-run final tests and build, then save and deliver a fresh polished checkpoint.

## Hang Investigation

- [x] Capture current browser, network, and server-log symptoms for the suspected hang.
- [x] Identify whether authentication, data fetching, Realtime, chart rendering, or a client loop is blocking progress.
- [x] Confirm no root-cause code fix is required; the observed delay is the normal authentication handoff.
- [x] Verify the live route and successful dashboard API response; no code regression was introduced.
- [x] Deliver the diagnosis; no repaired checkpoint is required because no code changed.

## Opportunity Click Hang Fix

- [x] Trace why clicking a top recovery opportunity scrolls the page or appears to hang.
- [x] Prevent unintended background scroll and preserve the user’s position while the review drawer is open.
- [x] Ensure row clicks are keyboard-accessible and do not trigger duplicate or bubbling actions.
- [x] Verify the drawer open/close flow on desktop and mobile, then run tests and build.
- [x] Save and deliver the interaction fix.

## Final Opportunity-Drawer Verification

- [x] Capture a mobile Recovery view after the scroll-lock fix and verify the drawer surface remains usable.
- [x] Save and deliver a fresh checkpoint containing the opportunity-click repair.

## Direct Mobile Interaction Check

- [ ] Actually open and close the opportunity drawer on mobile and verify the background scroll locks and original position restores.
- [ ] Save and deliver a new checkpoint after the interaction fix.

## Authentication 403 Investigation

- [x] Identify whether the 403 comes from Manus OAuth, Google/Microsoft/Apple provider access, or the REVIVE route.
- [x] Correct the unsupported authentication handoff or document the required provider setup without weakening security.
- [x] Verify the public app entry and recovery demo path after the fix; authenticated callback remains provider-controlled.
- [x] Run tests/build and save a checkpoint for the code changes.

## Auth and Scroll Access Fix

- [x] Stop automatic unauthenticated redirect loops that lead users into the deleted-account screen.
- [x] Add a visible, honest session state with a usable sign-in action and demo fallback for read-only product exploration.
- [x] Keep financial mutations gated behind authentication without weakening server-side protection.
- [x] Ensure the document/page scrolls normally on all routes and the drawer only locks background scrolling while open.
- [x] Verify mobile and desktop scroll, sign-in/demo behavior, and recovery drawer behavior; run tests/build and checkpoint.

## Auth-Fix Release Gaps

- [ ] Directly open and close the recovery drawer after the auth/scroll change and verify background scroll lock plus scroll restoration on mobile and desktop.
- [ ] Save a fresh checkpoint after the auth/scroll fix and deliver it.
- [x] Render the read-only dashboard fallback when the protected summary query is unauthorized, while keeping payment and recovery mutations protected.

## Read-Only Demo Hardening

- [x] Disable or replace mutation-capable dashboard and recovery actions when no authenticated session exists.
- [x] Add an explicit read-only/demo indicator inside the dashboard content with a sign-in prompt.
- [x] Add focused verification that unauthenticated users cannot trigger payment-link or start-recovery mutations.
- [ ] Complete direct drawer verification if authentication becomes available, then checkpoint the published access fix.

## Final Auth Demo Hardening

- [ ] Gate every mutation-capable Recovery control behind authentication with a visible sign-in replacement.
- [ ] Add an in-content dashboard sign-in CTA for read-only demo mode.
- [ ] Add focused anonymous-action assertions for dashboard and Recovery entry points.
- [ ] Save the auth changes, then verify the public logged-out page and drawer scroll behavior.
