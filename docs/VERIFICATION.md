# Aperture verification record

28 September 2026. Local Chromium, Playwright 1.63.0.

- Production TypeScript/Vite build passed.
- Four automated tests passed in 12.7 seconds on the final UI code: geometry/validation; review/calibration/manual findings/CSV/persistence; image validation/upload/keyboard/undo; all design states and responsive layouts.
- Main app views checked for document overflow at 1440, 1024, 768, 390 and 320 px.
- 24 browser-rendered screen states captured. Desktop library/viewer/queue, tablet library/viewer and mobile library/viewer/report opened and visually inspected.
- Found and corrected mobile measurement label scaling, panning with fitted-image letterboxing, and muted text contrast. No broken assets or JS page errors observed in the tested workflow.
- Compared the generated library, viewer and report references with the implementation; dark sidebar, warm-white surfaces, specimen-led viewer and separate paper report retained. Reference-only invented storage numbers and inconsistent values were excluded.
- One intermediate screenshot run timed out while source edits were in progress. After completing edits and disabling animations during screenshots, all four tests passed.
- Lint exits successfully. Three existing fast-refresh warnings remain in generated shadcn badge/button/tabs modules; no app-code warnings remain.
- Product overview PDF rendered with Poppler and visually inspected: one page, readable text, correct screenshot, no clipping.
- Figma import script syntax checked with Node. Native Figma execution, font/layout inspection and component verification remain blocked by quota/editor access; no claim those checks passed.
- First GitHub Actions deployment failed at npm ci because optional native dependencies were missing from the macOS-generated lockfile. Regenerating the lockfile in a clean directory before retrying.

No physical-device testing, Safari testing, practitioner usability study, accessibility conformance audit or scientific validation was performed.

## Live release verification

- GitHub Actions run 36419195728 passed both build and deployment after clean lockfile regeneration and matching Node 24.
- Live URL opened in the collaborative browser and in Playwright.
- Live keyboard measurement returned the expected 40.00 nm for a 20 px segment at 2 nm/px.
- Live mobile navigation passed; print chrome was hidden.
- Product PDF, screen catalogue and Figma importer each returned HTTP 200.
- No page errors or failed network assets during the live workflow.
- Evidence: `live-verification.json`, `live-viewer.png`, `live-mobile-queue.png`, `print-report.png`.
