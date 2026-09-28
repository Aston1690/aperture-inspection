# Aperture — Inspection Review

A working, local browser workspace for image inspection, calibrated measurements and review notes. A new independent project directed by Akhil and designed and implemented with AI assistance. It is not client work and is not affiliated with Raynetics.

**[Open the app](https://aston1690.github.io/aperture-inspection/)** · **[Product overview](https://aston1690.github.io/aperture-inspection/docs/Aperture_Product_Overview.pdf)** · **[Design case study](docs/CASE_STUDY.md)**

## Try the complete flow

1. Open **Porous membrane** or import a PNG, JPEG or WebP image.
2. Set the physical scale using **Calibrate**. Select two endpoints on a known feature, then enter its physical length.
3. Use **Distance** (two points) or **Angle** (first point, vertex, final point). Keyboard users can Tab to the canvas, move with arrow keys and place points with Enter.
4. Name the finding, add a note, and mark it reviewed.
5. Export the measurements to CSV or open the printable report. Back up the complete workspace from Preferences.

## Implemented

- Image import, decoding and size checks (12 MB / 16,384 px maximum).
- Original-pixel geometry, physical calibration, distance and angle tools.
- Zoom, pan, fit, brightness and contrast controls.
- Review notes/status, undo, library search/filter/sort and side-by-side comparison.
- IndexedDB persistence, JSON backup/restore, CSV export and print-to-PDF report.
- Keyboard input, mobile navigation and responsive layouts.
- Real shadcn/ui components with Radix primitives; Lucide icons; Geist typography.

## Run locally

Node 24 recommended.

```sh
npm ci
npm run dev
npm run build
npm run lint
npx playwright install chromium
npm test
```

`npm test` starts its own Vite server if one is not already running. Browser screenshots are saved in the sibling `QA` and `Design` folders. Design previews are available at `?screen=1` through `?screen=24`; they do not change saved work.

## Evidence and limits

- All included samples are synthetic. Their physical scales are illustrative.
- This is a 2D tool, with no automated segmentation, 3D reconstruction or scientific validation.
- Browser storage can be cleared or unavailable. Export a JSON backup of important work.
- Only desk research and software/browser verification have been performed. No user interviews, customer adoption or research outcomes are claimed.
- The native Figma import package is prepared, but has **not been run or visually verified in Figma**: the connector exhausted its Starter quota and browser editor sign-in is pending. The browser screen catalogue is complete; do not describe the empty Figma file as a finished deliverable.
- CV and application email are kept outside this public repository.

## Design package

[24-screen catalogue](https://aston1690.github.io/aperture-inspection/docs/design/) · [Native Figma importer](https://aston1690.github.io/aperture-inspection/docs/Aperture_Figma_Import.zip)

The catalogue contains rendered browser states; the importer creates editable native layers when run in an authenticated Figma editor. Its Figma execution is still pending.

## Project files

- `src/App.tsx`: workspace, navigation and complete user workflow.
- `src/Viewer.tsx`: original-coordinate measurement canvas and inspector.
- `src/Report.tsx`: printable report.
- `src/lib/model.ts`: geometry, validation and CSV conversion.
- `src/lib/storage.ts`: local persistence and import/export.
- `tests/workflow.spec.ts`: maths and real browser workflow tests.
- `docs/CASE_STUDY.md`: decisions, trade-offs and evidence.

## Credits

Interface and source were created with Codex under Akhil's direction. The porous sample is an AI-generated illustration; other samples are procedural SVGs. shadcn/ui and Radix supply interface primitives, Lucide supplies icons, and Geist supplies fonts. Their licences remain with their respective projects.
