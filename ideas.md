# REVIVE AI — Design Direction

## Three stylistic approaches

### Theme Name: Night Ledger
Very Brief Intro: A dark, high-contrast operations console where electric blue signals cut through a near-black ledger of revenue events. It feels precise, alert, and built for teams that act on live money movement.
Probability: 0.07

### Theme Name: Signal Paper
Very Brief Intro: A warm, editorial fintech workspace with ink-black type, paper-white surfaces, and cobalt signal marks. It makes complex recovery decisions feel legible, calm, and boardroom-ready.
Probability: 0.04

### Theme Name: Blue Hour Control
Very Brief Intro: A restrained navy control room with cool white surfaces, thin instrument lines, and a cyan-blue recovery signal. It balances enterprise credibility with the feeling of an AI system quietly working in the background.
Probability: 0.08

## Chosen approach: Signal Paper

### Design Movement
Swiss International Typographic Style translated into a modern fintech operations product: disciplined typography, asymmetric rhythm, purposeful whitespace, and a small number of high-signal color cues.

### Core Principles
1. Make money movement readable at a glance through clear hierarchy and aligned numeric columns.
2. Use whitespace as an operational pause; dense data is grouped into calm, intentional zones.
3. Treat cobalt blue as a signal for action and intelligence, not a decorative gradient.
4. Give every state a semantic visual language: mint for recovered, amber for review, coral for risk, graphite for inactive.

### Color Philosophy
REVIVE uses an off-white paper canvas and deep graphite ink to feel trustworthy and editorial rather than like a generic dark-mode AI console. Cobalt blue is the ownable signal color: it marks recommendations, active navigation, and places where the system wants a human decision. Pale mint is reserved for money actually recovered; amber and coral are used sparingly for attention and risk.

### Layout Paradigm
A persistent left rail anchors the product while the main workspace uses offset editorial columns rather than a centered dashboard grid. Executive metrics sit in a single horizontal band; analysis charts and intelligence panels intentionally break the rhythm with a wide canvas beside a narrow annotation rail. Tables are framed like ledger pages, with generous row height and strong column alignment.

### Signature Elements
1. A cobalt vertical signal rule appears beside AI recommendations and active decisions.
2. Small uppercase section labels with generous tracking act as editorial wayfinding.
3. Numeric values use tabular figures and oversized ink-on-paper emphasis, with tiny inline trend strokes.

### Interaction Philosophy
Interactions should feel like operating a careful revenue system: fast, explicit, and reversible. Hover states reveal context; drawers expose reasoning before action; destructive or financial actions always open a confirmation step that states amount, rationale, expected recovery, friction, and policy status.

### Animation
Use short 160–220ms ease-out transitions for navigation, hover, and badges. Let charts draw in with a restrained opacity/translate reveal and stagger metric cards by 40ms. Drawers enter from the right with opacity plus translate only. Respect reduced motion and never animate financial values in a way that implies real-time accuracy beyond the synthetic data.

### Typography System
Display and headings use **Space Grotesk** with tight tracking and strong weight contrast. Body and interface copy use **DM Sans** for legibility. Numbers use Space Grotesk with tabular numerals. Page titles are 30–36px/1.05, section titles 15–18px, eyebrow labels 10–11px uppercase with 0.14em tracking, and body copy 13–14px.

### Brand Essence
REVIVE is the autonomous revenue-recovery operator for online merchants who want every recoverable payment surfaced, explained, and acted on without customer friction. Personality: **decisive, forensic, calm**.

### Brand Voice
Headlines are crisp and operational. CTAs name the decision, not the technology. Microcopy explains the why in plain language and never overclaims certainty.
Example lines: “Recover the revenue worth your attention.” and “The system found the leak. You choose the next move.”

### Wordmark & Logo
Use a compact symbol built from two offset cobalt brackets forming a forward-moving “R” aperture, paired with a custom wordmark where the V is cut like a recovery chevron. The symbol should also work alone as the favicon and sidebar mark.

### Signature Brand Color
**REVIVE Cobalt — #2855D9**. It is bright enough to signal action on paper-white surfaces, but grounded enough to feel financial rather than playful.

## Implementation reminders

- Keep the interface light by default with graphite text on a warm paper canvas.
- Use Lucide icons and a cobalt signal rule for AI-driven recommendations.
- Avoid generic rounded cards; use a mix of 10px panels, ledger tables, thin borders, and one or two stronger editorial blocks.
- Every page must include a useful empty/loading/error treatment where a data surface exists.
- Keep mock services asynchronous so the UI can later swap to Supabase-backed calls without component changes.
