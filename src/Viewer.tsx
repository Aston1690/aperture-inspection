import { useEffect, useRef, useState } from "react";
import {
  MousePointer2,
  Ruler,
  Triangle,
  ScanLine,
  ZoomIn,
  ZoomOut,
  Maximize,
  Undo2,
  Trash2,
  Check,
  Move,
  SlidersHorizontal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import {
  value,
  length,
  uid,
  type Dataset,
  type Measurement,
  type Point,
} from "./lib/model";
export type Tool = "select" | "distance" | "angle" | "calibrate" | "pan";
export function IconButton({
  label,
  children,
  onClick,
  active = false,
  disabled = false,
}: {
  label: string;
  children: React.ReactNode;
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={active ? "tool active" : "tool"}
          onClick={onClick}
          aria-label={label}
          aria-pressed={active}
          disabled={disabled}
        >
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}
export function Viewer({
  data,
  onChange,
  decimals,
  calibrate,
  onUndo,
  canUndo,
  onFinding,
  initialTool = "select",
}: {
  data: Dataset;
  onChange: (d: Dataset) => void;
  decimals: number;
  calibrate: (px?: number) => void;
  onUndo: () => void;
  canUndo: boolean;
  onFinding: () => void;
  initialTool?: Tool;
}) {
  const [tool, setTool] = useState<Tool>(initialTool),
    [points, setPoints] = useState<Point[]>([]),
    [selected, setSelected] = useState(
      data.measurements[
        initialTool === "angle"
          ? 2
          : Number(new URLSearchParams(location.search).get("screen")) === 14
            ? 1
            : 0
      ]?.id ?? "",
    ),
    [zoom, setZoom] = useState(1),
    [centre, setCentre] = useState<Point>({
      x: data.width / 2,
      y: data.height / 2,
    }),
    [cursor, setCursor] = useState<Point>({
      x: data.width / 2,
      y: data.height / 2,
    }),
    [contrast, setContrast] = useState(100),
    [bright, setBright] = useState(100);
  const svg = useRef<SVGSVGElement>(null),
    drag = useRef<{ x: number; y: number; cx: number; cy: number } | null>(
      null,
    );
  const [renderScale, setRenderScale] = useState(0.5);
  useEffect(() => {
    const el = svg.current;
    if (!el) return;
    const observer = new ResizeObserver(() =>
      setRenderScale(
        Math.min(el.clientWidth / data.width, el.clientHeight / data.height),
      ),
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [data.width, data.height]);
  const measure = data.measurements.find((m) => m.id === selected);
  const changeTool = (t: Tool) => {
    setTool(t);
    setPoints([]);
  };
  const patch = (m: Partial<Measurement>) =>
    onChange({
      ...data,
      measurements: data.measurements.map((x) =>
        x.id === selected ? { ...x, ...m } : x,
      ),
    });
  function addPoint(p: Point) {
    if (!["distance", "angle", "calibrate"].includes(tool)) return;
    if (p.x < 0 || p.y < 0 || p.x > data.width || p.y > data.height) return;
    const next = [...points, p];
    if (next.length > 1 && length(next[next.length - 2], p) < 0.01) return;
    setPoints(next);
    if (next.length === (tool === "angle" ? 3 : 2)) {
      if (tool === "calibrate") calibrate(length(next[0], next[1]));
      else {
        const m: Measurement = {
          id: uid(),
          type: tool as "distance" | "angle",
          points: next,
          label: `${tool === "angle" ? "Angle" : "Distance"} ${data.measurements.length + 1}`,
          note: "",
          status: "Open",
        };
        onChange({ ...data, measurements: [...data.measurements, m] });
        setSelected(m.id);
      }
      setPoints([]);
    }
  }
  const map = (
    e: React.MouseEvent<SVGSVGElement> | React.PointerEvent<SVGSVGElement>,
  ) => {
    const pt = svg.current!.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    return pt.matrixTransform(svg.current!.getScreenCTM()!.inverse());
  };
  const font = 12 / (renderScale * zoom),
    stroke = 1.6 / (renderScale * zoom);
  const reset = () => {
    setZoom(1);
    setCentre({ x: data.width / 2, y: data.height / 2 });
  };
  const instructions =
    tool === "distance"
      ? "Click two endpoints to measure a distance."
      : tool === "angle"
        ? "Click the first point, vertex, then final point."
        : tool === "calibrate"
          ? "Click both ends of a known scale or feature."
          : tool === "pan"
            ? "Drag to move the image. Use Fit to reset."
            : "Choose a tool, or select a measurement to review it.";
  return (
    <div className="viewer-layout">
      <section className="viewer-workspace" aria-label="Image workbench">
        <div className="canvas-toolbar">
          <div className="tool-group">
            {(
              [
                ["select", MousePointer2, "Select"],
                ["pan", Move, "Pan"],
                ["distance", Ruler, "Measure distance"],
                ["angle", Triangle, "Measure angle"],
                ["calibrate", ScanLine, "Calibrate scale"],
              ] as const
            ).map(([t, Icon, label]) => (
              <IconButton
                key={t}
                label={label}
                active={tool === t}
                onClick={() => changeTool(t)}
              >
                <Icon size={19} />
              </IconButton>
            ))}
            <span className="tool-divider" />
            <IconButton
              label="Undo last change"
              disabled={!canUndo}
              onClick={onUndo}
            >
              <Undo2 size={18} />
            </IconButton>
          </div>
          <span className="canvas-source">
            {data.synthetic ? "Synthetic sample" : "Local image"}
          </span>
        </div>
        <div className="canvas-stage">
          <svg
            ref={svg}
            className={`image-canvas tool-${tool}`}
            viewBox={`${centre.x - data.width / (2 * zoom)} ${centre.y - data.height / (2 * zoom)} ${data.width / zoom} ${data.height / zoom}`}
            tabIndex={0}
            role="application"
            aria-label="Image measurement canvas. Arrow keys move the crosshair; Enter places a point; Escape cancels."
            onClick={(e) => addPoint(map(e))}
            onPointerDown={(e) => {
              if (tool === "pan") {
                drag.current = {
                  x: e.clientX,
                  y: e.clientY,
                  cx: centre.x,
                  cy: centre.y,
                };
                e.currentTarget.setPointerCapture(e.pointerId);
              }
            }}
            onPointerMove={(e) => {
              if (drag.current) {
                const ratio = 1 / (renderScale * zoom);
                setCentre({
                  x: drag.current.cx - (e.clientX - drag.current.x) * ratio,
                  y: drag.current.cy - (e.clientY - drag.current.y) * ratio,
                });
              }
            }}
            onPointerUp={() => (drag.current = null)}
            onPointerCancel={() => (drag.current = null)}
            onKeyDown={(e) => {
              const step = e.shiftKey ? 20 : 2;
              if (e.key.startsWith("Arrow")) {
                e.preventDefault();
                setCursor((p) => ({
                  x: Math.max(
                    0,
                    Math.min(
                      data.width,
                      p.x +
                        (e.key === "ArrowRight"
                          ? step
                          : e.key === "ArrowLeft"
                            ? -step
                            : 0),
                    ),
                  ),
                  y: Math.max(
                    0,
                    Math.min(
                      data.height,
                      p.y +
                        (e.key === "ArrowDown"
                          ? step
                          : e.key === "ArrowUp"
                            ? -step
                            : 0),
                    ),
                  ),
                }));
              }
              if (e.key === "Enter") {
                e.preventDefault();
                addPoint(cursor);
              }
              if (e.key === "Escape") setPoints([]);
            }}
          >
            <image
              href={data.src}
              width={data.width}
              height={data.height}
              style={{
                filter: `contrast(${contrast}%) brightness(${bright}%)`,
              }}
            />
            {data.measurements.map((m, i) => (
              <g
                key={m.id}
                className="measurement"
                onClick={(e) => {
                  if (tool === "select") {
                    e.stopPropagation();
                    setSelected(m.id);
                  }
                }}
                style={{ cursor: tool === "select" ? "pointer" : "inherit" }}
              >
                <polyline
                  points={m.points.map((p) => `${p.x},${p.y}`).join(" ")}
                  fill="none"
                  stroke={m.id === selected ? "#d0ef85" : "#fff"}
                  strokeWidth={stroke}
                />
                {m.points.map((p, j) => (
                  <circle
                    key={j}
                    cx={p.x}
                    cy={p.y}
                    r={stroke * 2}
                    fill={m.id === selected ? "#d0ef85" : "#fff"}
                    stroke="#15221a"
                    strokeWidth={stroke / 2}
                  />
                ))}
                <rect
                  x={m.points[0].x}
                  y={m.points[0].y - font * 2.1}
                  width={font * (value(m, data, decimals).length * 0.64 + 2)}
                  height={font * 1.6}
                  rx={stroke * 2}
                  fill="#17241f"
                />
                <text
                  x={m.points[0].x + font / 2}
                  y={m.points[0].y - font * 0.96}
                  fill="white"
                  fontSize={font}
                  fontFamily="Geist Mono"
                >
                  {value(m, data, decimals)}
                </text>
                <title>
                  {i + 1}. {m.label}: {value(m, data, decimals)}
                </title>
              </g>
            ))}
            {points.map((p, i) => (
              <circle key={i} cx={p.x} cy={p.y} r={stroke * 3} fill="#d0ef85" />
            ))}
            {points.length > 1 && (
              <polyline
                points={points.map((p) => `${p.x},${p.y}`).join(" ")}
                fill="none"
                stroke="#d0ef85"
                strokeWidth={stroke}
              />
            )}
            <g
              className="keyboard-crosshair"
              stroke="#d0ef85"
              strokeWidth={stroke}
            >
              <path
                d={`M${cursor.x - 12} ${cursor.y}h24 M${cursor.x} ${cursor.y - 12}v24`}
              />
            </g>
          </svg>
        </div>
        <div className="canvas-footer">
          <div className="tool-group">
            <IconButton
              label="Zoom out"
              disabled={zoom <= 0.5}
              onClick={() => setZoom((z) => Math.max(0.5, z - 0.25))}
            >
              <ZoomOut size={17} />
            </IconButton>
            <span className="mono">{Math.round(zoom * 100)}%</span>
            <IconButton
              label="Zoom in"
              disabled={zoom >= 4}
              onClick={() => setZoom((z) => Math.min(4, z + 0.25))}
            >
              <ZoomIn size={17} />
            </IconButton>
            <Button variant="ghost" size="sm" onClick={reset}>
              <Maximize size={15} /> Fit
            </Button>
          </div>
          <button className="calibration-link" onClick={() => calibrate()}>
            {data.scale
              ? `${data.scale.toFixed(3)} ${data.unit}/px`
              : "Uncalibrated · set scale"}
          </button>
          <span className="pixel-size mono">
            {data.width} × {data.height} px
          </span>
        </div>
        <p className="canvas-instruction" aria-live="polite">
          {instructions}{" "}
          {points.length > 0 &&
            `${points.length} point selected. Escape to cancel.`}
        </p>
      </section>
      <aside className="inspector">
        <Tabs defaultValue="measurements">
          <TabsList className="inspector-tabs">
            <TabsTrigger value="measurements">Measurements</TabsTrigger>
            <TabsTrigger value="image">Image</TabsTrigger>
          </TabsList>
          <TabsContent value="measurements">
            <div className="inspector-heading">
              <h2>Selected measurement</h2>
              <span>{data.measurements.length} total</span>
            </div>
            {measure ? (
              <>
                <div className="measure-value">
                  <span className="eyebrow">
                    {measure.type === "angle" ? "Angle" : "Length"}
                  </span>
                  <strong>{value(measure, data, decimals)}</strong>
                  <span>
                    {data.scale
                      ? "Calibrated units"
                      : "Pixels · calibrate for physical units"}
                  </span>
                </div>
                <label className="field-label">
                  Finding name
                  <Input
                    value={measure.label}
                    onChange={(e) => patch({ label: e.target.value })}
                  />
                </label>
                <label className="field-label">
                  Review note
                  <Textarea
                    value={measure.note}
                    rows={3}
                    placeholder="Describe what needs attention…"
                    onChange={(e) => patch({ note: e.target.value })}
                  />
                </label>
                <div className="flex-actions">
                  <Button
                    variant={
                      measure.status === "Reviewed" ? "secondary" : "default"
                    }
                    onClick={() =>
                      patch({
                        status:
                          measure.status === "Reviewed" ? "Open" : "Reviewed",
                      })
                    }
                  >
                    <Check size={16} />
                    {measure.status === "Reviewed"
                      ? "Reviewed"
                      : "Mark reviewed"}
                  </Button>
                  <IconButton
                    label="Delete selected measurement"
                    onClick={() => {
                      onChange({
                        ...data,
                        measurements: data.measurements.filter(
                          (m) => m.id !== selected,
                        ),
                      });
                      setSelected(
                        data.measurements.find((m) => m.id !== selected)?.id ??
                          "",
                      );
                    }}
                  >
                    <Trash2 size={16} />
                  </IconButton>
                </div>
                <dl className="coordinate-list">
                  {measure.points.map((p, i) => (
                    <div key={i}>
                      <dt>Point {i + 1}</dt>
                      <dd>
                        {p.x.toFixed(1)}, {p.y.toFixed(1)} px
                      </dd>
                    </div>
                  ))}
                </dl>
              </>
            ) : (
              <div className="inspector-empty">
                <Ruler size={28} />
                <h3>Start a measurement</h3>
                <p>Choose the ruler, then select two points on your image.</p>
                <Button
                  variant="outline"
                  onClick={() => changeTool("distance")}
                >
                  Measure distance
                </Button>
              </div>
            )}
            <div className="list-title">
              <h2>All measurements</h2>
              <Button variant="ghost" size="sm" onClick={onFinding}>
                Add manually
              </Button>
            </div>
            <div className="measurement-list">
              {data.measurements.map((m) => (
                <button
                  key={m.id}
                  className={`measurement-row ${selected === m.id ? "selected" : ""}`}
                  onClick={() => setSelected(m.id)}
                >
                  {m.type === "angle" ? (
                    <Triangle size={17} />
                  ) : (
                    <Ruler size={17} />
                  )}
                  <span>
                    <b>{m.label}</b>
                    <small>{m.status}</small>
                  </span>
                  <strong className="mono">{value(m, data, decimals)}</strong>
                </button>
              ))}
            </div>
          </TabsContent>
          <TabsContent value="image">
            <h2 className="section-label">Image information</h2>
            <dl className="coordinate-list">
              <div>
                <dt>Dimensions</dt>
                <dd>
                  {data.width} × {data.height}
                </dd>
              </div>
              <div>
                <dt>Origin</dt>
                <dd>{data.synthetic ? "Synthetic sample" : "Your device"}</dd>
              </div>
              <div>
                <dt>Scale</dt>
                <dd>
                  {data.scale ? `${data.scale} ${data.unit}/px` : "Not set"}
                </dd>
              </div>
            </dl>
            <Button variant="outline" onClick={() => calibrate()}>
              Edit calibration
            </Button>
            <label className="field-label">
              Image notes
              <Textarea
                rows={5}
                value={data.notes}
                onChange={(e) => onChange({ ...data, notes: e.target.value })}
              />
            </label>
            <h2 className="section-label">
              <SlidersHorizontal size={16} /> Display adjustments
            </h2>
            <label className="field-label">
              Contrast · {contrast}%
              <input
                type="range"
                min="50"
                max="200"
                value={contrast}
                onChange={(e) => setContrast(+e.target.value)}
              />
            </label>
            <label className="field-label">
              Brightness · {bright}%
              <input
                type="range"
                min="50"
                max="200"
                value={bright}
                onChange={(e) => setBright(+e.target.value)}
              />
            </label>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setContrast(100);
                setBright(100);
              }}
            >
              Reset display
            </Button>
            <p className="muted-note">
              Display adjustments do not change original pixels or measurements.
            </p>
          </TabsContent>
        </Tabs>
      </aside>
    </div>
  );
}
