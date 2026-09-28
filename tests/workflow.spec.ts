import { test, expect } from "@playwright/test";
import {
  angle,
  calibration,
  value,
  initialWorkspace,
  validateWorkspace,
  csv,
} from "../src/lib/model";
test("geometry, calibration and backup validation", () => {
  expect(
    angle([
      { x: 1, y: 0 },
      { x: 0, y: 0 },
      { x: 0, y: 1 },
    ]),
  ).toBe(90);
  expect(calibration(50, 100)).toBe(2);
  expect(() => calibration(0, 10)).toThrow();
  const w = initialWorkspace();
  expect(validateWorkspace(w)).toBe(true);
  w.datasets[0].measurements[0].points[0].x = -1;
  expect(validateWorkspace(w)).toBe(false);
  const d = initialWorkspace().datasets[0];
  d.measurements[0].label = "=1+1";
  expect(csv(d, 2)).toContain("'=1+1");
  expect(
    value(
      {
        id: "x",
        type: "distance",
        points: [
          { x: 0, y: 0 },
          { x: 3, y: 4 },
        ],
        label: "x",
        note: "",
        status: "Open",
      },
      d,
      2,
    ),
  ).toBe("10.00 nm");
});
test("review, calibration, manual measurement, export and persistence", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await expect(page.getByText("Saved on this device")).toBeVisible();
  await page
    .getByRole("button", { name: "Open Porous membrane", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Mark reviewed", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Reviewed", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "2.000 nm/px", exact: true }).click();
  await page.getByLabel("Distance in pixels", { exact: true }).fill("100");
  await page.getByLabel("Known physical distance").fill("500");
  await page.getByRole("button", { name: "Apply scale" }).click();
  await expect(
    page.getByRole("button", { name: "5.000 nm/px", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Add manually" }).click();
  await page
    .getByLabel("Finding name", { exact: true })
    .last()
    .fill("Test distance");
  await page.getByRole("button", { name: "Add finding", exact: true }).click();
  await page.getByRole("button", { name: /Test distance/ }).click();
  await expect(page.locator(".measure-value strong")).toHaveText("500.00 nm");
  await page.getByRole("button", { name: "Export", exact: true }).click();
  const dl = page.waitForEvent("download");
  await page.getByRole("button", { name: /Measurement table/ }).click();
  expect((await dl).suggestedFilename()).toBe("aperture-measurements.csv");
  await page.keyboard.press("Escape");
  await expect(page.getByText("Saved on this device")).toBeVisible();
  await page.reload();
  await page
    .getByRole("button", { name: "Open Porous membrane", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: /Test distance/ }),
  ).toBeVisible();
  expect(errors).toEqual([]);
});
test("image upload validation and keyboard measurement", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Import image", exact: true }).click();
  await page
    .getByLabel("Upload image file")
    .setInputFiles({
      name: "bad.tiff",
      mimeType: "image/tiff",
      buffer: Buffer.from("bad"),
    });
  await expect(page.getByRole("alert")).toContainText("Use a PNG");
  await page
    .getByLabel("Upload image file")
    .setInputFiles("public/samples/membrane.png");
  await expect(
    page.getByRole("button", { name: "Uncalibrated · set scale" }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Measure distance", exact: true })
    .first()
    .click();
  const canvas = page.getByRole("application");
  await canvas.focus();
  await page.keyboard.press("Enter");
  await page.keyboard.press("Shift+ArrowRight");
  await page.keyboard.press("Enter");
  await expect(page.locator(".measure-value strong")).toHaveText("20.00 px");
  await page.getByRole("button", { name: "Undo last change" }).click();
  await expect(
    page.getByText("Start a measurement", { exact: true }),
  ).toBeVisible();
});
test("all design screens render and fit requested widths", async ({ page }) => {
  for (const width of [1440, 1024, 768, 390, 320]) {
    await page.setViewportSize({ width, height: 900 });
    for (const s of [1, 10, 15, 16, 18, 20]) {
      await page.goto(`/?screen=${s}`);
      await page.locator(".page-heading").waitFor();
      await expect
        .poll(() =>
          page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
        )
        .toBe(true);
      await page.screenshot({
        path: `../QA/${width}-screen-${s}.png`,
        fullPage: true,
        animations: "disabled",
      });
    }
  }
  for (let s = 1; s <= 24; s++) {
    await page.setViewportSize({ width: s >= 22 ? 390 : 1440, height: 1000 });
    await page.goto(`/?screen=${s}`);
    await page.locator(".page-heading").waitFor();
    await page.screenshot({
      path: `../Design/screen-${String(s).padStart(2, "0")}.png`,
      fullPage: true,
        animations: "disabled",
    });
  }
});
