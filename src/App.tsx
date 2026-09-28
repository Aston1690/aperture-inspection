import { useEffect, useRef, useState } from "react";
import {
  Aperture,
  Images,
  ClipboardCheck,
  Columns2,
  FileText,
  Settings2,
  Plus,
  ArrowUpRight,
  Search,
  ChevronRight,
  Upload,
  Menu,
  Keyboard,
  ArrowLeft,
  Download,
  Trash2,
  Info,
  Check,
  FolderOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Viewer, type Tool } from "./Viewer";
import { Report } from "./Report";
import {
  initialWorkspace,
  samples,
  calibration,
  uid,
  value,
  csv,
  validateWorkspace,
  type Workspace,
  type Dataset,
  type Measurement,
} from "./lib/model";
import {
  readWorkspace,
  saveWorkspace,
  readImage,
  download,
} from "./lib/storage";
import "./App.css";
type Page =
  | "library"
  | "viewer"
  | "review"
  | "compare"
  | "reports"
  | "preferences"
  | "project";
type Modal =
  | ""
  | "import"
  | "calibrate"
  | "finding"
  | "details"
  | "export"
  | "shortcuts"
  | "delete";
const screen = Number(new URLSearchParams(location.search).get("screen") || 0);
const preview = screen > 0 && screen <= 24;
const startPage: Page =
  (screen >= 8 && screen <= 14) || screen === 23 || screen === 24
    ? "viewer"
    : screen === 15
      ? "review"
      : screen === 16
        ? "compare"
        : screen === 17 || screen === 18
          ? "reports"
          : screen === 20
            ? "preferences"
            : "library";
const startModal: Modal =
  screen === 5 || screen === 6
    ? "import"
    : screen === 7
      ? "details"
      : screen === 9
        ? "calibrate"
        : screen === 13 || screen === 24
          ? "finding"
          : screen === 19
            ? "export"
            : screen === 21
              ? "shortcuts"
              : "";
function initial() {
  const w = initialWorkspace();
  if (screen === 2) w.datasets = [];
  if (screen === 8 || screen === 9) {
    w.datasets[0].scale = null;
    w.datasets[0].measurements = [];
  }
  return w;
}
export default function App() {
  const [workspace, setWorkspace] = useState<Workspace>(initial),
    [loaded, setLoaded] = useState(preview),
    [page, setPage] = useState<Page>(startPage),
    [current, setCurrent] = useState("membrane"),
    [modal, setModal] = useState<Modal>(startModal),
    [mobile, setMobile] = useState(false),
    [query, setQuery] = useState(
      screen === 3 ? "membrane" : screen === 4 ? "copper" : "",
    ),
    [filter, setFilter] = useState("all"),
    [sort, setSort] = useState("updated"),
    [saved, setSaved] = useState(
      preview ? "Design preview" : "Loading workspace…",
    ),
    [error, setError] = useState(
      screen === 6
        ? "Use a PNG, JPEG or WebP image. TIFF and raw microscope formats are not supported."
        : "",
    ),
    [notice, setNotice] = useState(""),
    [busy, setBusy] = useState(false),
    [pixels, setPixels] = useState("100"),
    [known, setKnown] = useState("200"),
    [unit, setUnit] = useState<Dataset["unit"]>("nm"),
    [findingName, setFindingName] = useState(""),
    [findingNote, setFindingNote] = useState(""),
    [coords, setCoords] = useState(["100", "100", "200", "100"]),
    [compareId, setCompareId] = useState("channels"),
    [history, setHistory] = useState<Workspace[]>([]);
  const upload = useRef<HTMLInputElement>(null),
    restore = useRef<HTMLInputElement>(null),
    saveQueue = useRef(Promise.resolve());
  const data =
    workspace.datasets.find((d) => d.id === current) ?? workspace.datasets[0];
  useEffect(() => {
    if (preview) return;
    let live = true;
    readWorkspace()
      .then((w) => {
        if (live) {
          if (w) setWorkspace(w);
          setLoaded(true);
        }
      })
      .catch(() => {
        if (live) {
          setSaved("Storage unavailable · export a backup");
          setLoaded(true);
        }
      });
    return () => {
      live = false;
    };
  }, []);
  useEffect(() => {
    if (!loaded || preview) return;
    const timer = setTimeout(() => {
      setSaved("Saving…");
      saveQueue.current = saveQueue.current
        .catch(() => {})
        .then(() => saveWorkspace(workspace))
        .then(() => setSaved("Saved on this device"))
        .catch(() => setSaved("Not saved · export a backup"));
    }, 250);
    return () => clearTimeout(timer);
  }, [workspace, loaded]);
  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(""), 5000);
    return () => clearTimeout(t);
  }, [notice]);
  function commit(w: Workspace) {
    if (!preview) setSaved("Saving…");
    setHistory((h) => [...h.slice(-29), workspace]);
    setWorkspace(w);
  }
  function update(d: Dataset) {
    commit({
      ...workspace,
      datasets: workspace.datasets.map((x) =>
        x.id === d.id ? { ...d, updated: new Date().toISOString() } : x,
      ),
    });
  }
  function undo() {
    const prev = history.at(-1);
    if (prev) {
      setWorkspace(prev);
      setHistory((h) => h.slice(0, -1));
      setNotice("Last change undone.");
    }
  }
  function navigate(p: Page) {
    setPage(p);
    setMobile(false);
    setError("");
  }
  function open(d: Dataset) {
    setCurrent(d.id);
    navigate("viewer");
  }
  function show(m: Modal) {
    setError("");
    setModal(m);
  }
  function calibrate(px?: number) {
    setPixels(String(px ?? 100));
    setKnown(String((px ?? 100) * (data?.scale ?? 1)));
    setUnit(data?.unit ?? "nm");
    show("calibrate");
  }
  async function importFile(file?: File) {
    if (!file) return;
    setError("");
    setBusy(true);
    try {
      const img = await readImage(file);
      if (workspace.datasets.length >= 100)
        throw new Error(
          "This workspace has reached 100 images. Export a backup and remove an image first.",
        );
      const d: Dataset = {
        ...img,
        id: uid(),
        name: file.name.replace(/\.[^.]+$/, ""),
        synthetic: false,
        scale: null,
        unit: "nm",
        measurements: [],
        notes: "",
        updated: new Date().toISOString(),
      };
      commit({ ...workspace, datasets: [d, ...workspace.datasets] });
      setCurrent(d.id);
      setPage("viewer");
      setModal("");
      setNotice(
        "Image imported. Set a scale before measuring physical distances.",
      );
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
      if (upload.current) upload.current.value = "";
    }
  }
  function submitCalibration(e: React.FormEvent) {
    e.preventDefault();
    if (!data) return;
    try {
      update({ ...data, scale: calibration(+pixels, +known), unit });
      setModal("");
      setNotice(
        "Scale updated. Existing distance measurements have been recalculated.",
      );
    } catch (e) {
      setError((e as Error).message);
    }
  }
  function addFinding(e: React.FormEvent) {
    e.preventDefault();
    if (!data) return;
    const p = coords.map(Number);
    if (
      coords.some((x) => !x.trim()) ||
      p.some((x) => !Number.isFinite(x) || x < 0) ||
      p[0] > data.width ||
      p[2] > data.width ||
      p[1] > data.height ||
      p[3] > data.height ||
      (p[0] === p[2] && p[1] === p[3])
    ) {
      setError("Enter two different points inside the image bounds.");
      return;
    }
    const m: Measurement = {
      id: uid(),
      type: "distance",
      points: [
        { x: p[0], y: p[1] },
        { x: p[2], y: p[3] },
      ],
      label: findingName.trim() || `Distance ${data.measurements.length + 1}`,
      note: findingNote,
      status: "Open",
    };
    update({ ...data, measurements: [...data.measurements, m] });
    setModal("");
    setFindingName("");
    setFindingNote("");
    setNotice("Finding added. Select it in the measurement list to review.");
  }
  const visible = workspace.datasets
    .filter(
      (d) =>
        d.name.toLowerCase().includes(query.toLowerCase()) &&
        (filter === "all" ||
          (filter === "calibrated" && d.scale) ||
          (filter === "uncalibrated" && !d.scale)),
    )
    .sort((a, b) =>
      sort === "name"
        ? a.name.localeCompare(b.name)
        : b.updated.localeCompare(a.updated),
    );
  const allFindings = workspace.datasets.flatMap((d) =>
    d.measurements.map((m) => ({ d, m })),
  );
  const titles: Record<Page, string> = {
    library: "Image library",
    viewer: data?.name ?? "Image review",
    review: "Review queue",
    compare: "Compare images",
    reports: "Inspection report",
    preferences: "Preferences",
    project: "About this project",
  };
  const navItems = [
    ["library", Images, "Library"],
    ["review", ClipboardCheck, "Review queue"],
    ["compare", Columns2, "Compare"],
    ["reports", FileText, "Reports"],
  ] as const;
  const nav = (
    <>
      <a className="brand" href="./" aria-label="Aperture home">
        <Aperture size={27} />
        <span>
          Aperture<span className="brand-sub">INSPECTION REVIEW</span>
        </span>
      </a>
      <div className="workspace-name">
        <span className="workspace-avatar">A</span>
        <div>
          Personal workspace<small>Local to this browser</small>
        </div>
      </div>
      <span className="nav-heading">WORKSPACE</span>
      <nav>
        {navItems.map(([p, Icon, label]) => (
          <button
            key={p}
            className={
              page === p || (p === "library" && page === "viewer")
                ? "nav-item active"
                : "nav-item"
            }
            onClick={() => navigate(p)}
          >
            <Icon size={18} />
            {label}
            {p === "review" && (
              <span className="nav-count">
                {allFindings.filter((x) => x.m.status === "Open").length}
              </span>
            )}
          </button>
        ))}
      </nav>
      <div className="sidebar-bottom">
        <button
          className={`nav-item ${page === "project" ? "active" : ""}`}
          onClick={() => navigate("project")}
        >
          <Info size={18} />
          About the project
        </button>
        <button
          className={`nav-item ${page === "preferences" ? "active" : ""}`}
          onClick={() => navigate("preferences")}
        >
          <Settings2 size={18} />
          Preferences
        </button>
        <button className="nav-item" onClick={() => show("shortcuts")}>
          <Keyboard size={18} />
          Keyboard help
        </button>
        <div className="local-note">
          <span className="status-dot" />
          Images stay on your device
          <small>Back up your work before clearing browser data.</small>
        </div>
        <div className="profile">
          <span>AK</span>
          <div>
            Independent project<small>By Akhil · v1.0</small>
          </div>
        </div>
      </div>
    </>
  );
  return (
    <TooltipProvider>
      <div className="app-shell">
        <aside className="sidebar">{nav}</aside>
        <Sheet open={mobile} onOpenChange={setMobile}>
          <SheetContent side="left" className="mobile-sidebar">
            <SheetTitle className="sr-only">Workspace navigation</SheetTitle>
            {nav}
          </SheetContent>
        </Sheet>
        <main className="main">
          <header className="topbar">
            <Button
              className="mobile-menu"
              variant="ghost"
              size="icon"
              aria-label="Open navigation"
              onClick={() => setMobile(true)}
            >
              <Menu size={21} />
            </Button>
            <div className="breadcrumb">
              <span>Workspace</span>
              <ChevronRight size={14} />
              <b>{page === "viewer" ? "Image review" : titles[page]}</b>
            </div>
            <div className="save-status">
              <span className="status-dot" />
              {saved}
            </div>
          </header>
          {!loaded ? (
            <div className="empty-state">
              <Aperture size={38} />
              <h1>Opening your workspace…</h1>
            </div>
          ) : (
            <>
              <div className="page-heading">
                <div>
                  {page === "viewer" && (
                    <button
                      className="back-link"
                      onClick={() => navigate("library")}
                    >
                      <ArrowLeft size={14} />
                      Library
                    </button>
                  )}
                  <div className="heading-line">
                    <h1>{titles[page]}</h1>
                    {page === "viewer" && data?.synthetic && (
                      <span className="tag">Synthetic sample</span>
                    )}
                  </div>
                  <p>
                    {
                      {
                        library:
                          "Your images, measurements and findings. All in one place.",
                        viewer: "Inspect the details. Keep the evidence.",
                        review: "Turn measurements into reviewed findings.",
                        compare:
                          "Inspect two images side by side. Each keeps its own scale.",
                        reports:
                          "A clear record of your measurements and review notes.",
                        preferences: "Make this workspace work for you.",
                        project: "A focused workflow, from image to evidence.",
                      }[page]
                    }
                  </p>
                </div>
                <div className="heading-actions">
                  {page === "library" ? (
                    <Button onClick={() => show("import")}>
                      <Plus size={17} />
                      Import image
                    </Button>
                  ) : page === "viewer" && data ? (
                    <>
                      <Button variant="outline" onClick={() => show("details")}>
                        Image details
                      </Button>
                      <Button onClick={() => show("export")}>
                        <Download size={16} />
                        Export
                      </Button>
                    </>
                  ) : page === "reports" && data ? (
                    <select
                      aria-label="Report image"
                      value={data.id}
                      onChange={(e) => setCurrent(e.target.value)}
                    >
                      {workspace.datasets.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name}
                        </option>
                      ))}
                    </select>
                  ) : null}
                </div>
              </div>
              {page === "library" && (
                <div className="page-body library">
                  <section className="sample-section">
                    <div className="sample-intro">
                      <span className="eyebrow">START EXPLORING</span>
                      <h2>A closer look starts here.</h2>
                      <p>
                        Try a synthetic sample to explore the review tools, or
                        bring your own image.
                      </p>
                    </div>
                    <div className="sample-cards">
                      {samples.map((s) => (
                        <button
                          className="sample-card"
                          key={s.id}
                          onClick={() => {
                            const existing = workspace.datasets.find(
                              (d) => d.id === s.id,
                            );
                            if (existing) open(existing);
                            else {
                              commit({
                                ...workspace,
                                datasets: [
                                  ...workspace.datasets,
                                  structuredClone(s),
                                ],
                              });
                              setCurrent(s.id);
                              navigate("viewer");
                            }
                          }}
                        >
                          <img
                            src={s.src}
                            alt={`${s.name} synthetic texture`}
                          />
                          <span>
                            {s.name}
                            <ArrowUpRight size={17} />
                          </span>
                          <small>
                            {s.id === "membrane"
                              ? "Explore measurements"
                              : s.id === "channels"
                                ? "Practise calibration"
                                : "Inspect a particle field"}
                          </small>
                        </button>
                      ))}
                    </div>
                  </section>
                  <div className="section-heading">
                    <h2>
                      All images <span>{workspace.datasets.length}</span>
                    </h2>
                    <span className="muted-note">Stored in this browser</span>
                  </div>
                  <div className="library-controls">
                    <div className="search-field">
                      <Search size={17} />
                      <Input
                        placeholder="Search images…"
                        aria-label="Search images"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                      />
                    </div>
                    <select
                      aria-label="Filter images"
                      value={filter}
                      onChange={(e) => setFilter(e.target.value)}
                    >
                      <option value="all">All scales</option>
                      <option value="calibrated">Calibrated</option>
                      <option value="uncalibrated">Uncalibrated</option>
                    </select>
                    <select
                      aria-label="Sort images"
                      value={sort}
                      onChange={(e) => setSort(e.target.value)}
                    >
                      <option value="updated">Recently updated</option>
                      <option value="name">Name A–Z</option>
                    </select>
                  </div>
                  {visible.length ? (
                    <div className="library-table-wrap">
                      <table className="library-table">
                        <thead>
                          <tr>
                            <th>Image</th>
                            <th>Scale</th>
                            <th>Findings</th>
                            <th>Updated</th>
                            <th>
                              <span className="sr-only">Open image</span>
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {visible.map((d) => (
                            <tr key={d.id}>
                              <td>
                                <button
                                  className="image-cell"
                                  onClick={() => open(d)}
                                >
                                  <img src={d.src} alt="" />
                                  <span>
                                    <b>{d.name}</b>
                                    <small>
                                      {d.width} × {d.height} px ·{" "}
                                      {d.synthetic
                                        ? "Synthetic sample"
                                        : "Local upload"}
                                    </small>
                                  </span>
                                </button>
                              </td>
                              <td>
                                <span
                                  className={`scale-tag ${d.scale ? "" : "pending"}`}
                                >
                                  <span />
                                  {d.scale
                                    ? `${d.scale} ${d.unit}/px`
                                    : "Not calibrated"}
                                </span>
                              </td>
                              <td>
                                {d.measurements.length}
                                <small className="table-sub">
                                  {
                                    d.measurements.filter(
                                      (m) => m.status === "Open",
                                    ).length
                                  }{" "}
                                  to review
                                </small>
                              </td>
                              <td>
                                {new Date(d.updated).toLocaleDateString(
                                  "en-AU",
                                  { day: "numeric", month: "short" },
                                )}
                              </td>
                              <td>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  aria-label={`Open ${d.name}`}
                                  onClick={() => open(d)}
                                >
                                  <ArrowUpRight size={18} />
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="empty-state">
                      <FolderOpen size={34} />
                      <h2>
                        {workspace.datasets.length
                          ? "No images match your search"
                          : "Your workspace is ready"}
                      </h2>
                      <p>
                        {workspace.datasets.length
                          ? "Try another name or reset the filters."
                          : "Import an image or open a sample above to begin."}
                      </p>
                      <Button
                        variant="outline"
                        onClick={() =>
                          workspace.datasets.length
                            ? (setQuery(""), setFilter("all"))
                            : show("import")
                        }
                      >
                        {workspace.datasets.length
                          ? "Reset filters"
                          : "Import an image"}
                      </Button>
                    </div>
                  )}
                  <div className="library-footnote">
                    <Info size={16} />
                    <p>
                      Sample images and their scales are illustrative. Your
                      uploads stay in your browser; nothing is sent to a server.
                    </p>
                  </div>
                </div>
              )}
              {page === "viewer" &&
                (data ? (
                  <Viewer
                    key={data.id}
                    data={data}
                    onChange={update}
                    decimals={workspace.decimals}
                    calibrate={calibrate}
                    onUndo={undo}
                    canUndo={history.length > 0}
                    onFinding={() => show("finding")}
                    initialTool={
                      (screen === 11
                        ? "distance"
                        : screen === 12
                          ? "angle"
                          : "select") as Tool
                    }
                  />
                ) : (
                  <Empty onImport={() => show("import")} />
                ))}
              {page === "review" && (
                <div className="page-body">
                  <div className="review-summary">
                    <strong>
                      {allFindings.filter((x) => x.m.status === "Open").length}
                    </strong>
                    <span>findings awaiting review</span>
                    <span className="summary-divider" />
                    <Check size={18} />
                    <span>
                      {
                        allFindings.filter((x) => x.m.status === "Reviewed")
                          .length
                      }{" "}
                      reviewed
                    </span>
                  </div>
                  {allFindings.length ? (
                    <div className="review-list">
                      {allFindings.map(({ d, m }) => (
                        <article className="review-item" key={m.id}>
                          <img src={d.src} alt="" />
                          <div>
                            <span className="eyebrow">{d.name}</span>
                            <h2>{m.label}</h2>
                            <p>{m.note || "No review note added."}</p>
                            <span className="mono">
                              {value(m, d, workspace.decimals)}
                            </span>
                          </div>
                          <div className="review-item-actions">
                            <span
                              className={`scale-tag ${m.status === "Open" ? "pending" : ""}`}
                            >
                              {m.status}
                            </span>
                            <Button
                              variant="outline"
                              onClick={() =>
                                update({
                                  ...d,
                                  measurements: d.measurements.map((x) =>
                                    x.id === m.id
                                      ? {
                                          ...x,
                                          status:
                                            x.status === "Open"
                                              ? "Reviewed"
                                              : "Open",
                                        }
                                      : x,
                                  ),
                                })
                              }
                            >
                              {m.status === "Open" ? "Mark reviewed" : "Reopen"}
                            </Button>
                            <Button variant="ghost" onClick={() => open(d)}>
                              Open image
                              <ArrowUpRight size={15} />
                            </Button>
                          </div>
                        </article>
                      ))}
                    </div>
                  ) : (
                    <Empty
                      onImport={() => navigate("library")}
                      text="No findings yet. Open an image and add a measurement."
                    />
                  )}
                </div>
              )}
              {page === "compare" && (
                <div className="page-body">
                  {data ? (
                    <>
                      <div className="compare-grid">
                        {[
                          data,
                          workspace.datasets.find((d) => d.id === compareId) ??
                            workspace.datasets.find((d) => d.id !== data.id) ??
                            data,
                        ].map((d, i) => (
                          <section className="compare-panel" key={i}>
                            <select
                              aria-label={
                                i
                                  ? "Second comparison image"
                                  : "First comparison image"
                              }
                              value={d.id}
                              onChange={(e) =>
                                i
                                  ? setCompareId(e.target.value)
                                  : setCurrent(e.target.value)
                              }
                            >
                              {workspace.datasets.map((x) => (
                                <option key={x.id} value={x.id}>
                                  {x.name}
                                </option>
                              ))}
                            </select>
                            <img src={d.src} alt={d.name} />
                            <div>
                              <b>{d.name}</b>
                              <span>
                                {d.width} × {d.height} px
                              </span>
                              <span>
                                {d.scale
                                  ? `${d.scale} ${d.unit}/px`
                                  : "Uncalibrated"}
                              </span>
                              <Button variant="ghost" onClick={() => open(d)}>
                                Inspect
                                <ArrowUpRight size={16} />
                              </Button>
                            </div>
                          </section>
                        ))}
                      </div>
                      <p className="library-footnote">
                        <Info size={17} />
                        Images are fitted independently. Their displayed sizes
                        do not imply equal physical scale.
                      </p>
                    </>
                  ) : (
                    <Empty onImport={() => show("import")} />
                  )}
                </div>
              )}
              {page === "reports" &&
                (data ? (
                  <Report
                    key={data.id}
                    data={data}
                    decimals={workspace.decimals}
                  />
                ) : (
                  <Empty onImport={() => show("import")} />
                ))}
              {page === "preferences" && (
                <div className="page-body settings-page">
                  <section>
                    <div>
                      <h2>Measurement precision</h2>
                      <p>
                        Change how values are displayed. Full precision is
                        retained in the workspace.
                      </p>
                    </div>
                    <select
                      aria-label="Decimal places"
                      value={workspace.decimals}
                      onChange={(e) =>
                        commit({ ...workspace, decimals: +e.target.value })
                      }
                    >
                      {[0, 1, 2, 3, 4].map((n) => (
                        <option key={n} value={n}>
                          {n} decimal places
                        </option>
                      ))}
                    </select>
                  </section>
                  <section>
                    <div>
                      <h2>Keep a backup</h2>
                      <p>
                        Download your images, calibration and findings as a JSON
                        file. Restore it in another browser.
                      </p>
                    </div>
                    <div className="flex-actions">
                      <Button
                        variant="outline"
                        onClick={() =>
                          download(
                            JSON.stringify(workspace),
                            "aperture-workspace.json",
                            "application/json",
                          )
                        }
                      >
                        <Download size={16} />
                        Download backup
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => restore.current?.click()}
                      >
                        <Upload size={16} />
                        Restore backup
                      </Button>
                    </div>
                  </section>
                  <section>
                    <div>
                      <h2>Local storage</h2>
                      <p>
                        {workspace.datasets.length} images and{" "}
                        {allFindings.length} findings. Browser data can be
                        cleared by your device; keep a backup of work you need.
                      </p>
                    </div>
                    <span className="scale-tag">{saved}</span>
                  </section>
                  <p className="muted-note">
                    No account, analytics or server upload. This version works
                    with 2D PNG, JPEG and WebP images.
                  </p>
                </div>
              )}
              {page === "project" && (
                <div className="page-body about-page">
                  <span className="eyebrow">
                    INDEPENDENT PRODUCT STUDY · 2026
                  </span>
                  <h2>
                    From a closer look
                    <br />
                    to a clearer record.
                  </h2>
                  <p className="about-lead">
                    Aperture connects image inspection, calibrated measurements
                    and review notes in a small, working browser application.
                  </p>
                  <div className="about-columns">
                    <section>
                      <h3>The problem</h3>
                      <p>
                        Image measurements lose context when coordinates, scale
                        and review notes live in separate files. Aperture keeps
                        them attached to the image and makes the next review
                        action visible.
                      </p>
                    </section>
                    <section>
                      <h3>The scope</h3>
                      <p>
                        Import an image, set a known scale, measure a distance
                        or angle, review findings and export a report.
                        Everything is stored locally in your browser.
                      </p>
                    </section>
                    <section>
                      <h3>The design decision</h3>
                      <p>
                        The image gets the largest part of the workspace. A
                        persistent inspector keeps measurement values,
                        coordinates and review status within reach.
                      </p>
                    </section>
                    <section>
                      <h3>What this demonstrates</h3>
                      <p>
                        A new independent project directed by Akhil and designed
                        and implemented with AI assistance. It has synthetic
                        demonstration data and has not been validated with
                        microscopy researchers.
                      </p>
                    </section>
                  </div>
                  <div className="about-limits">
                    <h3>Honest boundaries</h3>
                    <p>
                      This is a 2D inspection tool, with no 3D reconstruction,
                      segmentation or automated scientific analysis. Measurement
                      accuracy depends on calibration and point selection. It is
                      not affiliated with Raynetics.
                    </p>
                  </div>
                  <Button onClick={() => navigate("library")}>
                    Explore the workspace
                    <ArrowUpRight size={16} />
                  </Button>
                </div>
              )}
            </>
          )}
          {notice && (
            <div className="toast" role="status">
              <Check size={18} />
              {notice}
              <button
                aria-label="Dismiss notification"
                onClick={() => setNotice("")}
              >
                ×
              </button>
            </div>
          )}
        </main>
      </div>
      <input
        ref={upload}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="sr-only"
        tabIndex={-1}
        aria-label="Upload image file"
        onChange={(e) => importFile(e.target.files?.[0])}
      />
      <input
        ref={restore}
        type="file"
        accept="application/json,.json"
        className="sr-only"
        tabIndex={-1}
        aria-label="Restore workspace file"
        onChange={async (e) => {
          const f = e.target.files?.[0];
          if (!f) return;
          try {
            if (f.size > 100 * 1024 * 1024)
              throw new Error("Backup is larger than 100 MB.");
            const w: unknown = JSON.parse(await f.text());
            if (!validateWorkspace(w))
              throw new Error("This is not a valid Aperture workspace.");
            commit(w);
            setNotice("Backup restored. Undo is available below.");
          } catch (err) {
            setNotice((err as Error).message);
          } finally {
            if (restore.current) restore.current.value = "";
          }
        }}
      />
      {page === "preferences" && history.length > 0 && (
        <Button className="undo-floating" variant="outline" onClick={undo}>
          Undo last change
        </Button>
      )}
      <Dialog
        open={modal !== ""}
        onOpenChange={(v) => {
          if (!v) setModal("");
        }}
      >
        <DialogContent className="app-dialog">
          <DialogTitle>
            {{
              import: "Import an image",
              calibrate: "Set image scale",
              finding: "Add a measurement",
              details: "Image details",
              export: "Export your work",
              shortcuts: "Keyboard & canvas help",
              delete: "Remove this image?",
            }[modal as Exclude<Modal, "">] ?? ""}
          </DialogTitle>
          <DialogDescription>
            {{
              import: "Start with a 2D image from your device.",
              calibrate: "Connect a known distance to the image pixels.",
              finding: "Enter two endpoints in original image pixels.",
              details: "The source and context behind this image.",
              export: "Take your measurements and findings with you.",
              shortcuts: "A few ways to work more comfortably.",
              delete:
                "This removes the image and its findings from this workspace.",
            }[modal as Exclude<Modal, "">] ?? ""}
          </DialogDescription>
          {error && (
            <div className="error-message" role="alert">
              {error}
            </div>
          )}
          {modal === "import" && (
            <>
              <button
                className="upload-zone"
                disabled={busy}
                onClick={() => upload.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  importFile(e.dataTransfer.files[0]);
                }}
              >
                <Upload size={30} />
                <strong>
                  {busy
                    ? "Reading your image…"
                    : "Choose an image or drop it here"}
                </strong>
                <span>PNG, JPEG or WebP · up to 12 MB</span>
              </button>
              <div className="import-detail">
                <span className="step-number">1</span>
                <div>
                  <b>Import a 2D image</b>
                  <p>Images are stored only in this browser.</p>
                </div>
                <span className="step-number">2</span>
                <div>
                  <b>Calibrate, then measure</b>
                  <p>Set a known distance to use physical units.</p>
                </div>
              </div>
              <p className="muted-note">
                Raw microscope formats and TIFF stacks are not supported. Export
                a 2D image first.
              </p>
            </>
          )}
          {modal === "calibrate" && (
            <form onSubmit={submitCalibration}>
              <div className="calibration-diagram">
                <div />
                <span>Known distance</span>
              </div>
              <div className="form-grid">
                <label className="field-label">
                  Distance in pixels
                  <Input
                    type="number"
                    min="0.000001"
                    step="any"
                    required
                    value={pixels}
                    onChange={(e) => setPixels(e.target.value)}
                  />
                </label>
                <label className="field-label">
                  Known physical distance
                  <Input
                    type="number"
                    min="0.000001"
                    step="any"
                    required
                    value={known}
                    onChange={(e) => setKnown(e.target.value)}
                  />
                </label>
              </div>
              <label className="field-label">
                Unit
                <select
                  value={unit}
                  onChange={(e) => setUnit(e.target.value as Dataset["unit"])}
                >
                  <option>nm</option>
                  <option>µm</option>
                  <option>mm</option>
                </select>
              </label>
              <p className="scale-preview">
                {+pixels > 0 && +known > 0
                  ? `${(+known / +pixels).toFixed(4)} ${unit} per pixel`
                  : "Enter both distances"}
              </p>
              <p className="muted-note">
                Changing the scale recalculates all distance values. Angles stay
                the same.
              </p>
              <div className="dialog-actions">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setModal("")}
                >
                  Cancel
                </Button>
                <Button type="submit">Apply scale</Button>
              </div>
            </form>
          )}
          {modal === "finding" && (
            <form onSubmit={addFinding}>
              <label className="field-label">
                Finding name
                <Input
                  value={findingName}
                  onChange={(e) => setFindingName(e.target.value)}
                  placeholder="e.g. Pore diameter"
                />
              </label>
              <div className="form-grid">
                {["Start X", "Start Y", "End X", "End Y"].map((label, i) => (
                  <label className="field-label" key={label}>
                    {label} (px)
                    <Input
                      type="number"
                      step="any"
                      min="0"
                      required
                      value={coords[i]}
                      onChange={(e) =>
                        setCoords((c) =>
                          c.map((v, j) => (i === j ? e.target.value : v)),
                        )
                      }
                    />
                  </label>
                ))}
              </div>
              <label className="field-label">
                Review note
                <Textarea
                  value={findingNote}
                  onChange={(e) => setFindingNote(e.target.value)}
                  placeholder="What should the reviewer know?"
                />
              </label>
              <p className="muted-note">
                Image bounds: {data?.width} × {data?.height} px. You can also
                draw directly on the canvas.
              </p>
              <div className="dialog-actions">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setModal("")}
                >
                  Cancel
                </Button>
                <Button type="submit">Add finding</Button>
              </div>
            </form>
          )}
          {modal === "details" && data && (
            <>
              <img className="details-image" src={data.src} alt={data.name} />
              <label className="field-label">
                Image name
                <Input
                  value={data.name}
                  onChange={(e) => update({ ...data, name: e.target.value })}
                />
              </label>
              <dl className="coordinate-list">
                <div>
                  <dt>Dimensions</dt>
                  <dd>
                    {data.width} × {data.height} px
                  </dd>
                </div>
                <div>
                  <dt>Source</dt>
                  <dd>
                    {data.synthetic
                      ? "Synthetic demonstration image"
                      : "Local upload"}
                  </dd>
                </div>
                <div>
                  <dt>Measurements</dt>
                  <dd>{data.measurements.length}</dd>
                </div>
              </dl>
              <p className="muted-note">{data.notes}</p>
              <Button variant="outline" onClick={() => show("delete")}>
                <Trash2 size={16} />
                Remove image
              </Button>
            </>
          )}
          {modal === "delete" && data && (
            <>
              <p>
                Remove <strong>{data.name}</strong> and its{" "}
                {data.measurements.length} measurements? You can undo this
                change from the next image’s toolbar, or restore a backup.
              </p>
              <div className="dialog-actions">
                <Button variant="outline" onClick={() => setModal("")}>
                  Keep image
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => {
                    commit({
                      ...workspace,
                      datasets: workspace.datasets.filter(
                        (d) => d.id !== data.id,
                      ),
                    });
                    setModal("");
                    navigate("library");
                    setNotice(
                      "Image removed. Undo is available in Preferences.",
                    );
                  }}
                >
                  Remove image
                </Button>
              </div>
            </>
          )}
          {modal === "export" && (
            <div className="export-options">
              <button
                onClick={() => {
                  if (data)
                    download(
                      csv(data, workspace.decimals),
                      "aperture-measurements.csv",
                      "text/csv;charset=utf-8",
                    );
                  setNotice("CSV download started.");
                }}
              >
                <Download />
                <span>
                  <b>Measurement table</b>
                  <small>CSV · values, coordinates and review notes</small>
                </span>
                <ArrowUpRight size={18} />
              </button>
              <button
                onClick={() => {
                  setModal("");
                  navigate("reports");
                }}
              >
                <FileText />
                <span>
                  <b>Inspection report</b>
                  <small>Annotated image and findings · print / PDF</small>
                </span>
                <ChevronRight size={18} />
              </button>
              <button
                onClick={() =>
                  download(
                    JSON.stringify(workspace),
                    "aperture-workspace.json",
                    "application/json",
                  )
                }
              >
                <Images />
                <span>
                  <b>Complete workspace</b>
                  <small>JSON · images, calibration and findings</small>
                </span>
                <Download size={18} />
              </button>
            </div>
          )}
          {modal === "shortcuts" && (
            <>
              <dl className="shortcut-list">
                <div>
                  <dt>Move canvas crosshair</dt>
                  <dd>
                    <kbd>↑</kbd>
                    <kbd>↓</kbd>
                    <kbd>←</kbd>
                    <kbd>→</kbd>
                  </dd>
                </div>
                <div>
                  <dt>Move by 20 pixels</dt>
                  <dd>
                    <kbd>Shift</kbd> + arrow
                  </dd>
                </div>
                <div>
                  <dt>Place a measurement point</dt>
                  <dd>
                    <kbd>Enter</kbd>
                  </dd>
                </div>
                <div>
                  <dt>Cancel unfinished measurement</dt>
                  <dd>
                    <kbd>Esc</kbd>
                  </dd>
                </div>
              </dl>
              <p className="muted-note">
                First select Distance, Angle or Calibrate, then Tab to the image
                canvas. Angles use three points, with the vertex second. Touch
                users can tap points directly or use Add manually.
              </p>
            </>
          )}
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
}
function Empty({
  onImport,
  text = "Import an image or open a sample to get started.",
}: {
  onImport: () => void;
  text?: string;
}) {
  return (
    <div className="empty-state">
      <Images size={34} />
      <h2>Nothing here yet</h2>
      <p>{text}</p>
      <Button onClick={onImport}>Get started</Button>
    </div>
  );
}
