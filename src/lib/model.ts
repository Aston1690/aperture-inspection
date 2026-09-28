export type Point = { x: number; y: number };
export type Measurement = {
  id: string;
  type: "distance" | "angle";
  points: Point[];
  label: string;
  note: string;
  status: "Open" | "Reviewed";
};
export type Dataset = {
  id: string;
  name: string;
  src: string;
  width: number;
  height: number;
  synthetic: boolean;
  scale: number | null;
  unit: "nm" | "µm" | "mm";
  measurements: Measurement[];
  notes: string;
  updated: string;
};
export type Workspace = { version: 1; datasets: Dataset[]; decimals: number };
export const uid = () => crypto.randomUUID();
export function length(a: Point, b: Point) {
  return Math.hypot(b.x - a.x, b.y - a.y);
}
export function angle(p: Point[]) {
  const a = { x: p[0].x - p[1].x, y: p[0].y - p[1].y },
    b = { x: p[2].x - p[1].x, y: p[2].y - p[1].y };
  const d = Math.hypot(a.x, a.y) * Math.hypot(b.x, b.y);
  return d === 0
    ? NaN
    : (Math.acos(Math.max(-1, Math.min(1, (a.x * b.x + a.y * b.y) / d))) *
        180) /
        Math.PI;
}
export function value(m: Measurement, d: Dataset, decimals = 2) {
  const n =
    m.type === "angle"
      ? angle(m.points)
      : length(m.points[0], m.points[1]) * (d.scale ?? 1);
  return `${n.toFixed(decimals)} ${m.type === "angle" ? "°" : d.scale ? d.unit : "px"}`;
}
export function calibration(pixels: number, known: number) {
  if (
    !Number.isFinite(pixels) ||
    !Number.isFinite(known) ||
    pixels <= 0 ||
    known <= 0
  )
    throw new Error("Enter positive distances for both fields.");
  return known / pixels;
}
export function escapeCSV(s: string) {
  return '"' + s.replace(/^[=+\-@\t\r]/, "'$&").replaceAll('"', '""') + '"';
}
export function csv(d: Dataset, decimals: number) {
  return (
    "\uFEFF" +
    [
      [
        "Image",
        "Finding",
        "Type",
        "Value",
        "Unit",
        "Calibration (unit/px)",
        "Status",
        "Note",
        "Coordinates (px)",
      ],
      ...d.measurements.map((m) => [
        d.name,
        m.label,
        m.type,
        value(m, d, decimals).split(" ")[0],
        m.type === "angle" ? "deg" : d.scale ? d.unit : "px",
        String(d.scale ?? "Uncalibrated"),
        m.status,
        m.note,
        JSON.stringify(m.points),
      ]),
    ]
      .map((r) => r.map(escapeCSV).join(","))
      .join("\r\n")
  );
}
export function validateWorkspace(v: unknown): v is Workspace {
  if (!v || typeof v !== "object") return false;
  const w = v as Workspace;
  return (
    w.version === 1 &&
    Number.isInteger(w.decimals) &&
    w.decimals >= 0 &&
    w.decimals <= 4 &&
    Array.isArray(w.datasets) &&
    w.datasets.length <= 100 &&
    w.datasets.every((d) => d && typeof d === "object") &&
    new Set(w.datasets.map((d) => d.id)).size === w.datasets.length &&
    w.datasets.every(
      (d) =>
        typeof d.id === "string" &&
        typeof d.name === "string" &&
        typeof d.src === "string" &&
        (/^(data:image\/(png|jpeg|webp);base64,)/.test(d.src) ||
          /^\.\/samples\/[a-z-]+\.(png|svg)$/.test(d.src)) &&
        Number.isFinite(d.width) &&
        d.width > 0 &&
        d.width <= 16384 &&
        Number.isFinite(d.height) &&
        d.height > 0 &&
        d.height <= 16384 &&
        (d.scale === null || (Number.isFinite(d.scale) && d.scale > 0)) &&
        ["nm", "µm", "mm"].includes(d.unit) &&
        typeof d.synthetic === "boolean" &&
        typeof d.notes === "string" &&
        typeof d.updated === "string" &&
        Array.isArray(d.measurements) &&
        d.measurements.length <= 10000 &&
        d.measurements.every(
          (m) =>
            m &&
            typeof m === "object" &&
            typeof m.id === "string" &&
            ["distance", "angle"].includes(m.type) &&
            ["Open", "Reviewed"].includes(m.status) &&
            typeof m.label === "string" &&
            typeof m.note === "string" &&
            Array.isArray(m.points) &&
            m.points.length === (m.type === "angle" ? 3 : 2) &&
            m.points.every(
              (p) =>
                p &&
                typeof p === "object" &&
                Number.isFinite(p.x) &&
                p.x >= 0 &&
                p.x <= d.width &&
                Number.isFinite(p.y) &&
                p.y >= 0 &&
                p.y <= d.height,
            ) &&
            length(m.points[0], m.points[1]) > 0 &&
            (m.type !== "angle" || length(m.points[1], m.points[2]) > 0),
        ),
    )
  );
}
const now = "2026-09-28T10:00:00.000Z";
export const samples: Dataset[] = [
  {
    id: "membrane",
    name: "Porous membrane",
    src: "./samples/membrane.png",
    width: 1254,
    height: 1254,
    synthetic: true,
    scale: 2,
    unit: "nm",
    measurements: [
      {
        id: "m1",
        type: "distance",
        points: [
          { x: 377, y: 103 },
          { x: 447, y: 132 },
        ],
        label: "Pore diameter",
        note: "Demonstration measurement. The scale is illustrative.",
        status: "Open",
      },
      {
        id: "m2",
        type: "distance",
        points: [
          { x: 499, y: 394 },
          { x: 576, y: 438 },
        ],
        label: "Pore width",
        note: "Compare across the narrow axis.",
        status: "Open",
      },
      {
        id: "m3",
        type: "angle",
        points: [
          { x: 624, y: 501 },
          { x: 667, y: 613 },
          { x: 751, y: 554 },
        ],
        label: "Boundary angle",
        note: "Three-point angle example.",
        status: "Reviewed",
      },
    ],
    notes:
      "Synthetic image generated for this independent project. Calibration is illustrative, not a physical measurement.",
    updated: now,
  },
  {
    id: "channels",
    name: "Etched channels",
    src: "./samples/channels.svg",
    width: 1000,
    height: 800,
    synthetic: true,
    scale: null,
    unit: "nm",
    measurements: [],
    notes:
      "Procedural calibration practice image. No physical scale is supplied.",
    updated: now,
  },
  {
    id: "particles",
    name: "Particle field",
    src: "./samples/particles.svg",
    width: 1000,
    height: 800,
    synthetic: true,
    scale: 1,
    unit: "µm",
    measurements: [],
    notes:
      "Synthetic geometry for measurement practice. Illustrative scale: 1 µm/px.",
    updated: now,
  },
];
export const initialWorkspace = (): Workspace => ({
  version: 1,
  datasets: structuredClone(samples),
  decimals: 2,
});
