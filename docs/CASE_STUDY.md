# Aperture: from image to reviewable evidence

**Independent project, September 2026.** Directed by Akhil; designed and implemented with AI assistance. This is newly created work, not a previous client engagement. No customer results or research validation are claimed.

[Working app](https://aston1690.github.io/aperture-inspection/) · [Product overview](https://aston1690.github.io/aperture-inspection/docs/Aperture_Product_Overview.pdf)

## Why this product

Raynetics describes a workflow that turns microscopy data into reconstructions and measurable information. A focused 2D inspection tool gives a concrete way to explore the design problems around image context, calibration and review without pretending to implement their reconstruction technology. This is an independent adjacent concept, not a redesign of their private product.

The first version supports one complete path: **import → calibrate → measure → annotate → review → export**. An engineer can inspect a sample, retain the measurement's original coordinates and take the findings into a report.

## Information and interaction design

The library separates exploratory synthetic samples from saved image rows. A calibration status is visible before opening an image. The workbench gives the image most of the screen, with an inspector for values, notes, coordinates and review status. A dedicated queue makes unresolved findings visible without inventing dashboard metrics. Comparison states explicitly retain independent scales.

A dark navigation column anchors the workspace. Warm white surfaces, restrained forest controls and lime measurement marks support the image rather than compete with it. Geist supplies interface text; Geist Mono distinguishes measurements and coordinates. Real shadcn/ui components provide dialogs, tabs, inputs, tooltips, buttons and the mobile navigation sheet.

## The difficult part

Measurement geometry must remain correct when an image is scaled, zoomed or panned. Screen coordinates are transformed through the SVG matrix into original image pixels. Distance values apply a separate physical scale; recalibration recomputes values without changing the endpoints. Angle measurements use three original points and remain independent of physical calibration.

Visual QA found that mobile labels became too small and that panning needed the actual fitted image scale. Label sizes now follow rendered scale, while panning accounts for letterboxing. This is a concrete correction discovered during implementation, not a hypothetical challenge.

## Accessibility and persistence

Keyboard users can move a crosshair and place points. Numeric endpoint entry provides an alternative to drawing. Dialogs use Radix focus management. Mobile layouts stack the inspector below the image and use a navigation drawer. Reduced-motion preferences are respected.

Images and findings are stored in IndexedDB. Storage failures are visible, and JSON backup/restore provides a portable record. Imported images and backups are validated; unsupported formats are rejected. CSV cells protect against spreadsheet formula interpretation.

## What was checked

- Distance and angle calculations, scale validation and invalid backup coordinates.
- Import rejection, successful image upload and keyboard measurement.
- Recalibration, review status, manually entered measurement, CSV download and saved state after reload.
- Library, viewer, queue, comparison, report and preferences at 1440, 1024, 768, 390 and 320 pixel widths.
- Browser-rendered states for 24 interface screens and six editable wireframes.

The tests are reproducible in the repository. Desktop Chromium is the automated test browser; screenshots at mobile widths do not constitute physical-device or Safari testing.

## Scope boundaries and next research

This is not a scientific instrument or a validated replacement for ImageJ. Samples and scales are illustrative. No 3D reconstruction, AI inference, TIFF stacks or cloud collaboration are included. The next useful study would ask microscopy practitioners to calibrate a real image and produce a report, observing unit interpretation, endpoint selection and report usefulness. That study has not yet happened.

## Design deliverables

24 browser-rendered interface states, six low-fidelity SVG wireframes, generated visual references, and a native Figma import package with editable text, vector elements, local colour variables and reusable button components. **Figma import and editor visual verification remain pending access.** The importer is a prepared deliverable, not evidence of completed Figma execution.

## Research sources

- [Raynetics product description](https://www.raynetics.com/)
- [ImageJ: spatial calibration and measurement](https://wsr.imagej.net/ij/docs/guide/146-30.html)
- [shadcn/ui component documentation](https://ui.shadcn.com/docs)
- [GitHub Pages custom workflows](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)
