"use strict";
"use client";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Dashboard;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const recharts_1 = require("recharts");
const types_1 = require("../types");
const PlantChatbot_1 = __importDefault(require("./PlantChatbot"));
const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
const CHART_LIMIT = 30;
const METRICS = {
    temperature: { label: "Temperatura", short: "Temp", unit: "C", color: "#f97316" },
    humidity: { label: "Lagështia", short: "Ajri", unit: "%", color: "#0ea5e9", fixedScale: [0, 100] },
    moisture: { label: "Lagështia e tokës", short: "Toka", unit: "%", color: "#8b5cf6", fixedScale: [0, 100] },
};
const STATUS_STYLE = {
    dry: { color: "#dc2626", bg: "rgba(220,38,38,0.1)", dot: "#dc2626" },
    moist: { color: "#16a34a", bg: "rgba(22,163,74,0.1)", dot: "#16a34a" },
    wet: { color: "#2563eb", bg: "rgba(37,99,235,0.1)", dot: "#2563eb" },
    unknown: { color: "#64748b", bg: "rgba(100,116,139,0.1)", dot: "#64748b" },
};
function fmt(v, decimals = 1) {
    return v == null ? "-" : Number(v).toFixed(decimals);
}
function fmtTime(iso) {
    return new Date(iso).toLocaleString([], {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}
function exportCSV(data) {
    const header = ["id", "recorded_at", "temperature_c", "humidity_pct", "moisture_pct"];
    const rows = data.map((r) => [r.id, r.recorded_at, r.temperature, r.humidity, r.moisture ?? ""].join(","));
    const blob = new Blob([[header.join(","), ...rows].join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = Object.assign(document.createElement("a"), { href: url, download: "autoplant.csv" });
    a.click();
    URL.revokeObjectURL(url);
}
function SensorChart({ data, metric, onMetricChange, dark, }) {
    const chartData = (0, react_1.useMemo)(() => data
        .slice(0, CHART_LIMIT)
        .reverse()
        .map((reading) => ({
        label: fmtTime(reading.recorded_at),
        time: reading.recorded_at,
        value: reading[metric] == null ? null : Number(reading[metric]),
    }))
        .filter((reading) => reading.value != null), [data, metric]);
    const meta = METRICS[metric];
    const gridColor = dark ? "rgba(226,232,240,0.14)" : "rgba(15,23,42,0.12)";
    const muted = dark ? "#94a3b8" : "#64748b";
    const axisColor = dark ? "#cbd5e1" : "#334155";
    return ((0, jsx_runtime_1.jsxs)("section", { className: "panel chart-panel", children: [(0, jsx_runtime_1.jsxs)("div", { className: "panel-header chart-header", children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("span", { className: "eyebrow", children: "Tendenca nga API" }), (0, jsx_runtime_1.jsx)("h2", { children: meta.label })] }), (0, jsx_runtime_1.jsx)("div", { className: "segmented", "aria-label": "Metrika e grafikut", children: Object.keys(METRICS).map((key) => ((0, jsx_runtime_1.jsx)("button", { type: "button", className: metric === key ? "active" : "", onClick: () => onMetricChange(key), children: METRICS[key].short }, key))) })] }), chartData.length >= 2 ? ((0, jsx_runtime_1.jsx)("div", { className: "chart-frame", "aria-label": `Grafiku i ${meta.label.toLowerCase()} nga matjet e API-së`, children: (0, jsx_runtime_1.jsx)(recharts_1.ResponsiveContainer, { width: "100%", height: "100%", children: (0, jsx_runtime_1.jsxs)(recharts_1.LineChart, { data: chartData, margin: { top: 12, right: 12, bottom: 6, left: 0 }, children: [(0, jsx_runtime_1.jsx)(recharts_1.CartesianGrid, { stroke: gridColor, vertical: false }), (0, jsx_runtime_1.jsx)(recharts_1.XAxis, { dataKey: "label", minTickGap: 28, tick: { fill: muted, fontSize: 11 }, tickLine: false, axisLine: { stroke: gridColor } }), (0, jsx_runtime_1.jsx)(recharts_1.YAxis, { domain: meta.fixedScale ?? ["auto", "auto"], tickFormatter: (value) => `${Number(value).toFixed(metric === "temperature" ? 1 : 0)}${meta.unit}`, tick: { fill: muted, fontSize: 11 }, tickLine: false, axisLine: { stroke: gridColor }, width: 54 }), (0, jsx_runtime_1.jsx)(recharts_1.Tooltip, { formatter: (value) => [
                                    `${Number(value).toFixed(metric === "temperature" ? 1 : 0)}${meta.unit}`,
                                    meta.label,
                                ], labelStyle: { color: axisColor }, contentStyle: {
                                    background: dark ? "#111827" : "#ffffff",
                                    border: `1px solid ${gridColor}`,
                                    borderRadius: 8,
                                    color: axisColor,
                                    fontSize: 12,
                                } }), (0, jsx_runtime_1.jsx)(recharts_1.Line, { type: "monotone", dataKey: "value", stroke: meta.color, strokeWidth: 3, dot: { r: 3, fill: meta.color, strokeWidth: 0 }, activeDot: { r: 5 }, connectNulls: false, isAnimationActive: false })] }) }) })) : ((0, jsx_runtime_1.jsx)("div", { className: "empty-chart", children: metric === "moisture"
                    ? "Duhen të paktën dy matje të lagështisë së tokës nga API."
                    : "Duhen të paktën dy matje nga API." }))] }));
}
function Dashboard() {
    const [data, setData] = (0, react_1.useState)([]);
    const [loading, setLoading] = (0, react_1.useState)(true);
    const [error, setError] = (0, react_1.useState)(null);
    const [lastFetch, setLastFetch] = (0, react_1.useState)(null);
    const [dark, setDark] = (0, react_1.useState)(false);
    const [autoRefresh, setAuto] = (0, react_1.useState)(false);
    const [showAll, setShowAll] = (0, react_1.useState)(false);
    const [alertDismissed, setDismissed] = (0, react_1.useState)(false);
    const [csvFlash, setCsvFlash] = (0, react_1.useState)(false);
    const [chartMetric, setChartMetric] = (0, react_1.useState)("moisture");
    const fetchData = (0, react_1.useCallback)(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`${API_BASE}/api/measurements`);
            const json = await res.json();
            if (!res.ok) {
                throw new Error(json?.error?.message ?? `HTTP ${res.status}`);
            }
            setData(Array.isArray(json.data) ? json.data : []);
            setLastFetch(new Date());
            setDismissed(false);
        }
        catch (e) {
            setError(e.message);
        }
        finally {
            setLoading(false);
        }
    }, []);
    (0, react_1.useEffect)(() => {
        fetchData();
    }, [fetchData]);
    (0, react_1.useEffect)(() => {
        if (!autoRefresh)
            return;
        const id = setInterval(fetchData, 30000);
        return () => clearInterval(id);
    }, [autoRefresh, fetchData]);
    const latest = data[0] ?? null;
    const status = (0, types_1.getMoistureStatus)(latest?.moisture ?? null);
    const sstyle = STATUS_STYLE[status];
    const isDry = status === "dry";
    const rows = showAll ? data : data.slice(0, 15);
    const theme = {
        bg: dark ? "#0d0f10" : "#f8fafc",
        surface: dark ? "#161a1d" : "#ffffff",
        border: dark ? "rgba(255,255,255,0.08)" : "rgba(15,23,42,0.1)",
        text: dark ? "#e2e8f0" : "#0f172a",
        muted: dark ? "#94a3b8" : "#64748b",
        soft: dark ? "rgba(255,255,255,0.04)" : "rgba(15,23,42,0.035)",
    };
    const cssVars = {
        "--bg": theme.bg,
        "--surface": theme.surface,
        "--border": theme.border,
        "--text": theme.text,
        "--muted": theme.muted,
        "--soft": theme.soft,
    };
    function handleCSV() {
        exportCSV(data);
        setCsvFlash(true);
        setTimeout(() => setCsvFlash(false), 1600);
    }
    return ((0, jsx_runtime_1.jsxs)("main", { className: "dashboard", style: cssVars, children: [(0, jsx_runtime_1.jsx)("style", { children: `
        .dashboard {
          min-height: 100vh;
          background: var(--bg);
          color: var(--text);
          font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
          padding: 24px;
          transition: background 0.3s ease;
        }

        .dashboard-shell {
          width: min(1180px, 100%);
          margin: 0 auto;
        }

        .topbar,
        .panel-header,
        .alert {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
        }

        .topbar {
          margin-bottom: 20px;
        }

        h1,
        h2,
        p {
          margin: 0;
        }

        h1 {
          font-size: 24px;
          font-weight: 650;
          letter-spacing: 0;
        }

        h2 {
          margin-top: 4px;
          font-size: 16px;
          font-weight: 650;
          letter-spacing: 0;
        }

        .sync {
          margin-top: 5px;
          color: var(--muted);
          font-size: 12px;
        }

        .actions {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 8px;
          flex-wrap: wrap;
        }

        .auto-toggle {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          color: var(--muted);
          cursor: pointer;
          font-size: 12px;
        }

        button {
          min-height: 36px;
          border: 1px solid var(--border);
          border-radius: 8px;
          background: transparent;
          color: var(--text);
          cursor: pointer;
          font: inherit;
          font-size: 12px;
        }

        button:disabled {
          cursor: not-allowed;
          opacity: 0.62;
        }

        .icon-button {
          width: 38px;
          padding: 0;
        }

        .text-button {
          padding: 0 14px;
        }

        .primary-button {
          border-color: transparent;
          background: #22c55e;
          color: #052e16;
          font-weight: 650;
        }

        .exported {
          border-color: rgba(34,197,94,0.55);
          background: rgba(34,197,94,0.12);
          color: #16a34a;
        }

        .alert,
        .panel,
        .metric {
          border: 1px solid var(--border);
          border-radius: 8px;
          background: var(--surface);
        }

        .alert {
          margin-bottom: 18px;
          border-color: rgba(220,38,38,0.35);
          background: rgba(220,38,38,0.09);
          padding: 12px 14px;
          color: #dc2626;
          font-size: 13px;
        }

        .dismiss {
          width: 34px;
          min-width: 34px;
          border: 0;
          color: var(--muted);
          font-size: 18px;
        }

        .metrics {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 12px;
          margin-bottom: 12px;
        }

        .metric {
          min-width: 0;
          padding: 17px 18px;
        }

        .metric-label,
        .eyebrow,
        th {
          color: var(--muted);
          font-size: 10px;
          font-weight: 500;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .metric-value {
          display: flex;
          align-items: baseline;
          gap: 4px;
          margin-top: 8px;
        }

        .metric-number {
          overflow-wrap: anywhere;
          font-size: 28px;
          font-weight: 650;
          line-height: 1;
        }

        .metric-unit {
          color: var(--muted);
          font-size: 12px;
        }

        .badge {
          display: inline-flex;
          align-items: center;
          max-width: 100%;
          gap: 6px;
          margin-top: 9px;
          border-radius: 6px;
          padding: 4px 8px;
          font-size: 11px;
        }

        .dot {
          width: 6px;
          height: 6px;
          flex: 0 0 auto;
          border-radius: 50%;
        }

        .chart-panel {
          margin-bottom: 12px;
          padding: 18px;
        }

        .chart-header {
          margin-bottom: 14px;
          align-items: flex-start;
        }

        .segmented {
          display: inline-flex;
          overflow: hidden;
          border: 1px solid var(--border);
          border-radius: 8px;
        }

        .segmented button {
          min-height: 34px;
          border: 0;
          border-radius: 0;
          padding: 0 12px;
          color: var(--muted);
        }

        .segmented button.active {
          background: var(--soft);
          color: var(--text);
        }

        .chart-frame {
          width: 100%;
          height: 300px;
          min-width: 0;
        }

        .empty-chart {
          display: grid;
          min-height: 180px;
          place-items: center;
          border-radius: 8px;
          background: var(--soft);
          color: var(--muted);
          font-size: 13px;
          text-align: center;
          padding: 20px;
        }

        .table-panel {
          overflow: hidden;
        }

        .table-panel .panel-header {
          padding: 13px 18px;
          border-bottom: 1px solid var(--border);
        }

        .table-wrap {
          overflow-x: auto;
        }

        table {
          width: 100%;
          min-width: 620px;
          border-collapse: collapse;
          font-size: 12px;
        }

        th,
        td {
          padding: 11px 18px;
          border-bottom: 1px solid var(--border);
          text-align: right;
          white-space: nowrap;
        }

        th:first-child,
        td:first-child {
          text-align: left;
        }

        tbody tr:nth-child(even) {
          background: var(--soft);
        }

        .show-row {
          padding: 12px 18px;
          text-align: center;
        }

        .empty-state,
        .error {
          border-radius: 8px;
          padding: 18px;
          text-align: center;
          font-size: 13px;
        }

        .error {
          margin-bottom: 14px;
          border: 1px solid rgba(220,38,38,0.28);
          background: rgba(220,38,38,0.08);
          color: #dc2626;
        }

        .empty-state {
          color: var(--muted);
          padding: 56px 0;
        }

        @media (max-width: 760px) {
          .dashboard {
            padding: 16px;
          }

          .topbar,
          .alert,
          .chart-header {
            align-items: stretch;
            flex-direction: column;
          }

          .actions {
            display: grid;
            grid-template-columns: 1fr 38px 1fr 1fr;
            justify-content: stretch;
            width: 100%;
          }

          .auto-toggle {
            min-height: 36px;
          }

          .text-button,
          .primary-button {
            padding: 0 10px;
          }

          .metrics {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .metric {
            padding: 14px;
          }

          .metric-number {
            font-size: 24px;
          }

          .segmented {
            width: 100%;
          }

          .segmented button {
            flex: 1;
          }

          .chart-panel {
            padding: 14px;
          }

          .chart-frame {
            height: 260px;
          }
        }

        @media (max-width: 430px) {
          .dashboard {
            padding: 12px;
          }

          h1 {
            font-size: 21px;
          }

          .actions {
            grid-template-columns: 1fr 38px;
          }

          .actions .text-button,
          .actions .primary-button {
            width: 100%;
          }

          .metrics {
            grid-template-columns: 1fr;
          }

          .table-panel .panel-header {
            align-items: flex-start;
            flex-direction: column;
            gap: 4px;
          }
        }
      ` }), (0, jsx_runtime_1.jsxs)("div", { className: "dashboard-shell", children: [isDry && !alertDismissed && ((0, jsx_runtime_1.jsxs)("div", { className: "alert", children: [(0, jsx_runtime_1.jsxs)("span", { children: [(0, jsx_runtime_1.jsx)("strong", { children: "Toka \u00EBsht\u00EB e that\u00EB" }), " - lag\u00EBshtia \u00EBsht\u00EB ", fmt(latest?.moisture, 0), "%. Ujite bim\u00EBn."] }), (0, jsx_runtime_1.jsx)("button", { className: "dismiss", type: "button", onClick: () => setDismissed(true), "aria-label": "Mbyll njoftimin", children: "x" })] })), (0, jsx_runtime_1.jsxs)("header", { className: "topbar", children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("h1", { children: "AutoPlant" }), (0, jsx_runtime_1.jsx)("p", { className: "sync", children: loading && !lastFetch ? "duke u lidhur..." : lastFetch ? `sinkronizuar ${lastFetch.toLocaleTimeString()}` : "-" })] }), (0, jsx_runtime_1.jsxs)("div", { className: "actions", children: [(0, jsx_runtime_1.jsxs)("label", { className: "auto-toggle", children: [(0, jsx_runtime_1.jsx)("input", { type: "checkbox", checked: autoRefresh, onChange: (e) => setAuto(e.target.checked) }), "auto 30s"] }), (0, jsx_runtime_1.jsx)("button", { className: "icon-button", type: "button", onClick: () => setDark((value) => !value), "aria-label": "Ndrysho tem\u00EBn", children: dark ? "L" : "D" }), (0, jsx_runtime_1.jsx)("button", { className: `text-button ${csvFlash ? "exported" : ""}`, type: "button", onClick: handleCSV, disabled: !data.length, children: csvFlash ? "u eksportua" : "CSV" }), (0, jsx_runtime_1.jsx)("button", { className: "primary-button", type: "button", onClick: fetchData, disabled: loading, children: loading ? "duke sinkr." : "rifresko" })] })] }), error && (0, jsx_runtime_1.jsxs)("div", { className: "error", children: [error, " - serveri mund t\u00EB jet\u00EB duke u zgjuar, provo ta rifreskosh."] }), (0, jsx_runtime_1.jsx)("section", { className: "metrics", "aria-label": "Leximet e fundit", children: [
                            { label: "temperatura", value: fmt(latest?.temperature), unit: "C", color: "#f97316" },
                            { label: "lagështia", value: fmt(latest?.humidity), unit: "%", color: "#0ea5e9" },
                            {
                                label: "lagështia e tokës",
                                value: latest?.moisture != null ? fmt(latest.moisture, 0) : "-",
                                unit: latest?.moisture != null ? "%" : "",
                                color: "#8b5cf6",
                                badge: latest?.moisture != null,
                            },
                            { label: "lexime", value: String(data.length || "-"), unit: "", color: "#16a34a" },
                        ].map(({ label, value, unit, color, badge }) => ((0, jsx_runtime_1.jsxs)("article", { className: "metric", children: [(0, jsx_runtime_1.jsx)("p", { className: "metric-label", children: label }), (0, jsx_runtime_1.jsxs)("div", { className: "metric-value", children: [(0, jsx_runtime_1.jsx)("span", { className: "metric-number", style: { color }, children: value }), unit && (0, jsx_runtime_1.jsx)("span", { className: "metric-unit", children: unit })] }), badge && ((0, jsx_runtime_1.jsxs)("div", { className: "badge", style: { background: sstyle.bg, color: sstyle.color }, children: [(0, jsx_runtime_1.jsx)("span", { className: "dot", style: { background: sstyle.dot } }), (0, jsx_runtime_1.jsx)("span", { children: types_1.MOISTURE_LABELS[status] })] }))] }, label))) }), (0, jsx_runtime_1.jsx)(SensorChart, { data: data, metric: chartMetric, onMetricChange: setChartMetric, dark: dark }), data.length > 0 && ((0, jsx_runtime_1.jsxs)("section", { className: "panel table-panel", children: [(0, jsx_runtime_1.jsxs)("div", { className: "panel-header", children: [(0, jsx_runtime_1.jsx)("span", { className: "eyebrow", children: "Lista e leximeve" }), (0, jsx_runtime_1.jsxs)("span", { className: "sync", children: [data.length, " gjithsej"] })] }), (0, jsx_runtime_1.jsx)("div", { className: "table-wrap", children: (0, jsx_runtime_1.jsxs)("table", { children: [(0, jsx_runtime_1.jsx)("thead", { children: (0, jsx_runtime_1.jsx)("tr", { children: ["koha", "temp C", "lagështia %", "toka"].map((header) => ((0, jsx_runtime_1.jsx)("th", { children: header }, header))) }) }), (0, jsx_runtime_1.jsx)("tbody", { children: rows.map((row) => {
                                                const rowStatus = (0, types_1.getMoistureStatus)(row.moisture);
                                                const rowStyle = STATUS_STYLE[rowStatus];
                                                return ((0, jsx_runtime_1.jsxs)("tr", { children: [(0, jsx_runtime_1.jsx)("td", { children: fmtTime(row.recorded_at) }), (0, jsx_runtime_1.jsx)("td", { style: { color: "#f97316" }, children: fmt(row.temperature) }), (0, jsx_runtime_1.jsx)("td", { style: { color: "#0ea5e9" }, children: fmt(row.humidity) }), (0, jsx_runtime_1.jsx)("td", { children: row.moisture != null ? ((0, jsx_runtime_1.jsxs)("span", { className: "badge", style: { background: rowStyle.bg, color: rowStyle.color }, children: [(0, jsx_runtime_1.jsx)("span", { className: "dot", style: { background: rowStyle.dot } }), (0, jsx_runtime_1.jsxs)("span", { children: [fmt(row.moisture, 0), "% - ", types_1.MOISTURE_LABELS[rowStatus]] })] })) : ((0, jsx_runtime_1.jsx)("span", { className: "sync", children: "-" })) })] }, row.id));
                                            }) })] }) }), data.length > 15 && ((0, jsx_runtime_1.jsx)("div", { className: "show-row", children: (0, jsx_runtime_1.jsx)("button", { className: "text-button", type: "button", onClick: () => setShowAll((value) => !value), children: showAll ? "shfaq më pak" : `shfaq të ${data.length} leximet` }) }))] })), !loading && !data.length && !error && ((0, jsx_runtime_1.jsx)("div", { className: "empty-state", children: "Ende nuk ka lexime. Shtyp matjen n\u00EB ESP32." })), (0, jsx_runtime_1.jsx)(PlantChatbot_1.default, {})] })] }));
}
