# Hang Diagnosis

The suspected hang is not a client render loop or a stalled dashboard API request. The preview request to `/api/trpc/dashboard.summary,recovery.cases` returned HTTP 200 with the expected summary and recovery rows in roughly 0.5–1.1 seconds. The current browser session was not authenticated, so the app redirected to the Manus sign-in handoff at `/app-auth`; the first frame showed a spinner while the login UI loaded, then the sign-in form appeared normally.

The logs also contain older Recharts warnings about chart containers briefly having width/height zero while responsive charts mount. These are non-blocking warnings, not evidence of a hang. No code change was applied during this investigation.

## Opportunity Drawer Verification Note

The available browser session remains unauthenticated and redirects to the Manus sign-in page, so a direct mobile click/open/close exercise cannot be completed in this session. The repaired code path uses a fixed backdrop, body scroll lock, Escape-to-close, and restoration of the captured scroll position; automated tests, type-check, and production build pass. The mobile Recovery route itself renders correctly in the project preview.

## Authentication 403 Note

The app entry redirects to `https://manus.im/app-auth` before REVIVE renders. The sign-in page loads its provider buttons and email/passkey form, but also shows a Cloudflare-style “Verify you are human” challenge. The reported 403 is therefore most likely from the selected external sign-in provider or its verification/authorization policy, not from the REVIVE dashboard, API, or recovery drawer. The browser session is not authenticated, so application-route verification cannot proceed until sign-in succeeds.

## Post-Auth-Fix Deployment Note

The local source now suppresses automatic unauthenticated redirects, shows a session-aware Demo workspace/sign-in control, and treats the unauthorized dashboard summary as a read-only fallback. The public `reviveai-a7pqbw7p.manus.space` deployment still redirects to Manus sign-in because these changes have not yet been checkpointed and published. Direct browser interaction testing should be repeated after the new checkpoint is live.

## Published Auth-Fix Verification

After checkpoint e1fdcd41, the public `reviveai-a7pqbw7p.manus.space` URL still reaches the Manus sign-in page and Cloudflare human-verification challenge. The local preview renders the REVIVE dashboard, so the next diagnostic target is the deployed auth bootstrap or server-side route protection rather than the drawer scroll logic.

## Direct Local Drawer Interaction

On the local preview at desktop viewport, clicking the first top recovery opportunity opened `RZP_1024` in the review drawer without changing the URL or jumping the page. The drawer showed the financial evidence fields and replaced the mutation action with `Sign in to recover`, while the dashboard remained dimmed behind the fixed drawer. This confirms the click flow is interactive and the logged-out action is protected. Close/restore verification remains to be completed in the next browser interaction.

## Controlled Scroll-Lock Probe

A controlled local-preview probe set `window.scrollY` to 180 and dispatched the opportunity-row click without browser auto-scrolling. While open, the drawer applied `body.style.overflow = hidden`, `position = fixed`, and `top = -180px`, confirming the original position was captured. The first probe used an overly broad close-button selector and did not close the drawer; a corrected close-control probe is required for the final restoration assertion.

## Recovery Center Drawer Scrollbar Root Cause (2026-08-26)

The running Recovery Center drawer reproduced the scrollbar failure. Measurements showed the drawer had `display: block`, `height: 1100px`, `overflow: visible`, and `scrollHeight: 1100px`. Its inner content element had `overflow-y: auto`, but it expanded to `clientHeight: 732px` and `scrollHeight: 732px` because the parent was not a flex column with a constrained height. Therefore there was no overflow to scroll inside the case panel; on shorter viewports the content simply extended beyond the drawer/viewport. The fix must make the drawer a constrained flex column, hide outer overflow, and give the content region `flex: 1; min-height: 0; overflow-y: auto` with touch/overscroll support.

## Post-Fix Runtime Verification

After the CSS change, the open drawer measured `display: flex`, `overflow: hidden`, `position: relative`, and a case-body child with `flex: 1 1 auto`, `min-height: 0`, `overflow-y: auto`, and `touch-action: pan-y`. At the browser’s unusually tall 1100px viewport, the case body measured `clientHeight: 988` and `scrollHeight: 988`, so no scroll range was needed at that height. A shorter-viewport probe is required to confirm positive overflow distance, which is expected once the same content is constrained to mobile-height dimensions.

## Verification Gap Closure

Vitest now discovers `client/src/pages/drawer-scroll.test.ts`; the suite reports 8 files and 19 passing tests. The first mobile-dimension probe ran after a route reload with no drawer open and correctly returned `drawer-or-content-not-found`; it did not alter application state. The next probe opens a case first, then compares the old and new CSS contracts at 390px by 640px dimensions.

## Mobile-Dimension Regression Proof

With the Recovery case open, a 390px by 640px dimension probe reproduced the old failure: the old block drawer had `clientHeight: 640`, `scrollHeight: 862`, while its inner content expanded to `clientHeight: 750` and had `scrollRange: 0`. The corrected flex drawer remained `clientHeight: 640` and `scrollHeight: 640`; its inner content measured `clientHeight: 528`, `scrollHeight: 750`, and a usable `scrollRange: 222`, with `overflow-y: auto`. This confirms the fix creates a real mobile scroll area rather than allowing the case content to spill outside the panel.

## Dashboard Control Reproduction

On the local dashboard, `Export report` displayed `Report export queued` but produced no file or download. `Review queue` displayed `Opening recommended recovery queue` but did not change the route. Source inspection confirms both are toast-only placeholder handlers. `View analysis` and `Investigate` are also toast-only handlers in `Home.tsx`, so they cannot navigate to the existing Revenue Leaks route. The Intelligence card’s visible vertical mark is the global `.signal-rule`/Signal Paper accent line, not a browser rendering defect; its current placement should be clarified in the card styling.

## Post-Fix Dashboard Verification

After the dashboard-control repair, clicking `Export report` showed `Revenue report downloaded` and invoked a real browser download link for a dated CSV report. Clicking `Review queue` changed the route to `/recovery` and showed `Recovery queue opened`, confirming the control no longer stops at a placeholder toast.

`View analysis` was verified after the repair: the browser route changed to `/revenue-leaks`, and the Revenue leakage page rendered its category cards, failure-analysis chart, and AI diagnosis panel.

`Investigate` was verified after the repair: the browser route changed to `/revenue-leaks`, displayed `Leakage analysis opened`, and rendered the failure-analysis chart and AI diagnosis. The thin vertical line at the left edge of REVIVE Intelligence is intentionally produced by `.signal-card:before` in the Signal Paper design system: a 3px cobalt rail from 22px below the top to 22px above the bottom. It is CSS authored by the app, not a local-computer artifact.
