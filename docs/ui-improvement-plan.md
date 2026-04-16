# UI Improvement and Modularization Plan

## Objectives
- Keep existing gameplay, scoring, voice, and retrieval behavior unchanged.
- Separate entry experience from case selection and gameplay pages.
- Improve visual consistency, readability, and interaction quality.
- Make UI structure modular for easier future iteration.

## Architecture
- Introduce a dedicated `start` screen as a separate state/page.
- Keep page orchestration in `src/App.jsx` and move page composition into `src/pages/`.
- Use `src/pages/StartPage.jsx` for the new entry screen and CTA.
- Use `src/pages/LandingPage.jsx` for hero + case discovery.
- Preserve existing component contracts for gameplay pages.

## Design System Direction
- Continue courtroom visual identity with cleaner modern surfaces.
- Standardize interactive states (hover, active, focus-visible) across buttons and card-like controls.
- Reduce overly noisy glow usage and improve contrast on key text.
- Extend token set with additional radii and surface shadow tokens for consistency.

## Interaction and Accessibility
- Ensure keyboard activation for card controls (`Enter` and `Space`) on case cards and side-selection cards.
- Maintain visible focus indicators for all key controls.
- Keep motion expressive but provide reduced-motion fallback where relevant.

## Non-Goals and Safety Constraints
- No changes to Qdrant service (`src/services/qdrantService.js`).
- No changes to Vapi integration (`src/hooks/useVapi.js`).
- No changes to scoring/AI response logic (`src/data/mockAI.js`).
- No changes to ingestion pipeline behavior (`src/services/ingestCases.js`).

## Validation Checklist
- Start -> Landing -> Choose Side -> Loading -> Courtroom -> Verdict flow works.
- Back navigation from Choose Side returns to Landing.
- Reset from Verdict returns to Start.
- Build passes (`npm run build`).
- Lint state is unchanged except pre-existing project issues.

## Future Enhancements
- Optionally migrate from state-based pages to route-based pages (`react-router-dom`).
- Introduce reusable `Button`, `Panel`, and `SectionHeader` primitives.
- Extract animation tokens/utilities into dedicated style modules.
