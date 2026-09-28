import { useState } from "react";
import { Printer, Download, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { value, csv, type Dataset } from "./lib/model";
import { download } from "./lib/storage";
export function Report({
  data,
  decimals,
}: {
  data: Dataset;
  decimals: number;
}) {
  const [reportDate] = useState(() =>
    new Date().toLocaleDateString("en-AU", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }),
  );
  const [title, setTitle] = useState(data.name),
    [includeImage, setIncludeImage] = useState(true),
    [includeNotes, setIncludeNotes] = useState(true);
  return (
    <div
      className={
        new URLSearchParams(location.search).get("screen") === "18"
          ? "report-layout preview-only"
          : "report-layout"
      }
    >
      <article className="report-paper">
        <div className="report-masthead">
          <b>Aperture</b>
          <span>INSPECTION REVIEW</span>
        </div>
        <h1>{title || data.name}</h1>
        <p className="report-meta">
          {reportDate} · {data.measurements.length} measurements
        </p>
        {includeImage && (
          <div className="report-image">
            <svg viewBox={`0 0 ${data.width} ${data.height}`}>
              <image href={data.src} width={data.width} height={data.height} />
              {data.measurements.map((m, i) => (
                <g key={m.id}>
                  <polyline
                    points={m.points.map((p) => `${p.x},${p.y}`).join(" ")}
                    fill="none"
                    stroke="#d0ef85"
                    strokeWidth={4}
                  />
                  <circle
                    cx={m.points[0].x}
                    cy={m.points[0].y}
                    r={15}
                    fill="#173f34"
                  />
                  <text
                    x={m.points[0].x}
                    y={m.points[0].y + 5}
                    fontSize={15}
                    textAnchor="middle"
                    fill="white"
                  >
                    {i + 1}
                  </text>
                </g>
              ))}
            </svg>
          </div>
        )}
        <p className="report-calibration">
          {data.scale
            ? `Scale: ${data.scale} ${data.unit}/px · ${data.synthetic ? "Illustrative sample calibration" : "Manual calibration"}`
            : "Uncalibrated · distances are reported in pixels"}
        </p>
        <div className="table-scroll">
          <table className="report-table">
            <thead>
              <tr>
                <th>Finding</th>
                <th>Measurement</th>
                <th>Review</th>
              </tr>
            </thead>
            <tbody>
              {data.measurements.map((m, i) => (
                <tr key={m.id}>
                  <td>
                    {i + 1}. {m.label}
                    {includeNotes && m.note && <small>{m.note}</small>}
                  </td>
                  <td className="mono">{value(m, data, decimals)}</td>
                  <td>{m.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!data.measurements.length && (
          <p className="muted-note">
            No measurements yet. Open the image to add one.
          </p>
        )}
        {includeNotes && data.notes && (
          <section className="report-notes">
            <h2>Image notes</h2>
            <p>{data.notes}</p>
          </section>
        )}
        <footer>
          {data.synthetic
            ? "Synthetic sample. Illustrative measurements; not scientific evidence."
            : "Measurements depend on your calibration and selected endpoints."}
          <br />
          Created locally with Aperture · Independent project by Akhil
        </footer>
      </article>
      <aside className="report-options">
        <h2>Report options</h2>
        <label className="field-label">
          Report title
          <Input
            value={title}
            maxLength={120}
            onChange={(e) => setTitle(e.target.value)}
          />
        </label>
        <label className="check-row">
          <Checkbox
            checked={includeImage}
            onCheckedChange={(v) => setIncludeImage(v === true)}
          />
          Include annotated image
        </label>
        <label className="check-row">
          <Checkbox
            checked={includeNotes}
            onCheckedChange={(v) => setIncludeNotes(v === true)}
          />
          Include review notes
        </label>
        <div className="options-actions">
          <Button onClick={() => window.print()}>
            <Printer size={16} /> Print / save PDF
          </Button>
          <Button
            variant="outline"
            onClick={() =>
              download(
                csv(data, decimals),
                "aperture-measurements.csv",
                "text/csv;charset=utf-8",
              )
            }
          >
            <Download size={16} /> Download CSV
          </Button>
        </div>
        <div className="report-tip">
          <FileText size={20} />
          <p>
            Use your browser’s print dialogue to save a PDF. The sidebar and
            controls are excluded automatically.
          </p>
        </div>
      </aside>
    </div>
  );
}
