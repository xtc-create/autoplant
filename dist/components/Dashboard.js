"use strict";
"use client";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Dashboard;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const types_1 = require("../types");
// Point this at your local server (src/server.ts) or directly at the ESP32 API
const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
function fmt(v, decimals = 1) {
    return v == null ? "—" : Number(v).toFixed(decimals);
}
function fmtTime(iso) {
    return new Date(iso).toLocaleString([], {
        month: "short", day: "numeric",
        hour: "2-digit", minute: "2-digit",
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
const STATUS_STYLE = {
    dry: { color: "#ef4444", bg: "rgba(239,68,68,0.1)", dot: "#ef4444" },
    moist: { color: "#22c55e", bg: "rgba(34,197,94,0.1)", dot: "#22c55e" },
    wet: { color: "#3b82f6", bg: "rgba(59,130,246,0.1)", dot: "#3b82f6" },
    unknown: { color: "#94a3b8", bg: "rgba(148,163,184,0.1)", dot: "#94a3b8" },
};
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
    const fetchData = (0, react_1.useCallback)(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`${API_BASE}/api/measurements`);
            const json = await res.json();
            setData(json.data);
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
    (0, react_1.useEffect)(() => { fetchData(); }, [fetchData]);
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
    const t = {
        bg: dark ? "#0d0f10" : "#f8fafc",
        surface: dark ? "#161a1d" : "#ffffff",
        border: dark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.08)",
        text: dark ? "#e2e8f0" : "#0f172a",
        muted: "#64748b",
    };
    const card = {
        background: t.surface,
        border: `1px solid ${t.border}`,
        borderRadius: 16,
        padding: "18px 22px",
    };
    function handleCSV() {
        exportCSV(data);
        setCsvFlash(true);
        setTimeout(() => setCsvFlash(false), 1600);
    }
    return ((0, jsx_runtime_1.jsxs)("div", { style: { minHeight: "100vh", background: t.bg, color: t.text, fontFamily: "'DM Mono', monospace", padding: "28px 24px", transition: "background 0.3s" }, children: [isDry && !alertDismissed && ((0, jsx_runtime_1.jsxs)("div", { style: { marginBottom: 20, background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 12, padding: "12px 18px", display: "flex", alignItems: "center", justifyContent: "space-between" }, children: [(0, jsx_runtime_1.jsxs)("span", { style: { fontSize: 13, color: "#ef4444" }, children: ["\uD83C\uDF35 ", (0, jsx_runtime_1.jsx)("strong", { children: "Soil is dry" }), " \u2014 moisture at ", fmt(latest?.moisture, 0), "%. Water your plant!"] }), (0, jsx_runtime_1.jsx)("button", { onClick: () => setDismissed(true), style: { background: "none", border: "none", cursor: "pointer", color: t.muted, fontSize: 18 }, children: "\u00D7" })] })), (0, jsx_runtime_1.jsxs)("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28, flexWrap: "wrap", gap: 16 }, children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("h1", { style: { fontSize: 22, fontWeight: 600, margin: 0, letterSpacing: "-0.5px" }, children: "\uD83C\uDF3F AutoPlant" }), (0, jsx_runtime_1.jsx)("p", { style: { fontSize: 11, color: t.muted, margin: "4px 0 0" }, children: loading && !lastFetch ? "connecting…" : lastFetch ? `synced ${lastFetch.toLocaleTimeString()}` : "—" })] }), (0, jsx_runtime_1.jsxs)("div", { style: { display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }, children: [(0, jsx_runtime_1.jsxs)("label", { style: { display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: t.muted, cursor: "pointer" }, children: [(0, jsx_runtime_1.jsx)("input", { type: "checkbox", checked: autoRefresh, onChange: (e) => setAuto(e.target.checked) }), "auto\u00B730s"] }), (0, jsx_runtime_1.jsx)("button", { onClick: () => setDark((d) => !d), style: { background: "none", border: `1px solid ${t.border}`, borderRadius: 10, padding: "7px 12px", cursor: "pointer", color: t.text, fontSize: 14 }, children: dark ? "☀️" : "🌙" }), (0, jsx_runtime_1.jsx)("button", { onClick: handleCSV, disabled: !data.length, style: { background: csvFlash ? "rgba(74,222,128,0.15)" : "none", border: `1px solid ${csvFlash ? "rgba(74,222,128,0.5)" : t.border}`, borderRadius: 10, padding: "7px 14px", cursor: "pointer", color: csvFlash ? "#4ade80" : t.text, fontSize: 12, transition: "all 0.2s" }, children: csvFlash ? "✓ exported" : "↓ CSV" }), (0, jsx_runtime_1.jsx)("button", { onClick: fetchData, disabled: loading, style: { background: loading ? "none" : "#4ade80", border: "none", borderRadius: 10, padding: "7px 16px", cursor: loading ? "not-allowed" : "pointer", color: loading ? t.muted : "#0d0f10", fontSize: 12, fontWeight: 500 }, children: loading ? "syncing…" : "↻ refresh" })] })] }), error && ((0, jsx_runtime_1.jsxs)("div", { style: { marginBottom: 20, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: 12, padding: "12px 18px", fontSize: 12, color: "#ef4444" }, children: ["\u26A0 ", error, " \u2014 server may be waking up, try refreshing."] })), (0, jsx_runtime_1.jsx)("div", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12, marginBottom: 20 }, children: [
                    { label: "temperature", value: fmt(latest?.temperature), unit: "°C", color: "#fb923c" },
                    { label: "humidity", value: fmt(latest?.humidity), unit: "%", color: "#38bdf8" },
                    { label: "soil moisture", value: latest?.moisture != null ? fmt(latest.moisture, 0) : "—", unit: latest?.moisture != null ? "%" : "", color: "#a78bfa", badge: latest?.moisture != null },
                    { label: "readings", value: String(data.length || "—"), unit: "", color: "#4ade80" },
                ].map(({ label, value, unit, color, badge }) => ((0, jsx_runtime_1.jsxs)("div", { style: card, children: [(0, jsx_runtime_1.jsx)("p", { style: { fontSize: 10, color: t.muted, textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 8px" }, children: label }), (0, jsx_runtime_1.jsxs)("div", { style: { display: "flex", alignItems: "baseline", gap: 3 }, children: [(0, jsx_runtime_1.jsx)("span", { style: { fontSize: 28, fontWeight: 500, color, lineHeight: 1 }, children: value }), unit && (0, jsx_runtime_1.jsx)("span", { style: { fontSize: 12, color: t.muted }, children: unit })] }), badge && ((0, jsx_runtime_1.jsxs)("div", { style: { marginTop: 8, display: "inline-flex", alignItems: "center", gap: 5, background: sstyle.bg, borderRadius: 6, padding: "3px 8px" }, children: [(0, jsx_runtime_1.jsx)("span", { style: { width: 6, height: 6, borderRadius: "50%", background: sstyle.dot, display: "inline-block" } }), (0, jsx_runtime_1.jsx)("span", { style: { fontSize: 11, color: sstyle.color }, children: types_1.MOISTURE_LABELS[status] })] }))] }, label))) }), data.length > 0 && ((0, jsx_runtime_1.jsxs)("div", { style: { ...card, padding: 0, overflow: "hidden" }, children: [(0, jsx_runtime_1.jsxs)("div", { style: { padding: "12px 22px", borderBottom: `1px solid ${t.border}`, display: "flex", justifyContent: "space-between" }, children: [(0, jsx_runtime_1.jsx)("span", { style: { fontSize: 11, color: t.muted, textTransform: "uppercase", letterSpacing: "0.08em" }, children: "readings log" }), (0, jsx_runtime_1.jsxs)("span", { style: { fontSize: 11, color: t.muted }, children: [data.length, " total"] })] }), (0, jsx_runtime_1.jsx)("div", { style: { overflowX: "auto" }, children: (0, jsx_runtime_1.jsxs)("table", { style: { width: "100%", borderCollapse: "collapse", fontSize: 12 }, children: [(0, jsx_runtime_1.jsx)("thead", { children: (0, jsx_runtime_1.jsx)("tr", { style: { borderBottom: `1px solid ${t.border}` }, children: ["timestamp", "temp °C", "humidity %", "soil"].map((h, i) => ((0, jsx_runtime_1.jsx)("th", { style: { padding: "10px 22px", textAlign: i === 0 ? "left" : "right", color: t.muted, fontWeight: 400, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.06em" }, children: h }, h))) }) }), (0, jsx_runtime_1.jsx)("tbody", { children: rows.map((row, i) => {
                                        const s = (0, types_1.getMoistureStatus)(row.moisture);
                                        const ss = STATUS_STYLE[s];
                                        return ((0, jsx_runtime_1.jsxs)("tr", { style: { borderBottom: `1px solid ${t.border}`, background: i % 2 ? (dark ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.015)") : "transparent" }, children: [(0, jsx_runtime_1.jsx)("td", { style: { padding: "9px 22px", color: t.muted }, children: fmtTime(row.recorded_at) }), (0, jsx_runtime_1.jsx)("td", { style: { padding: "9px 22px", textAlign: "right", color: "#fb923c" }, children: fmt(row.temperature) }), (0, jsx_runtime_1.jsx)("td", { style: { padding: "9px 22px", textAlign: "right", color: "#38bdf8" }, children: fmt(row.humidity) }), (0, jsx_runtime_1.jsx)("td", { style: { padding: "9px 22px", textAlign: "right" }, children: row.moisture != null
                                                        ? (0, jsx_runtime_1.jsxs)("span", { style: { display: "inline-flex", alignItems: "center", gap: 5, background: ss.bg, borderRadius: 6, padding: "3px 9px" }, children: [(0, jsx_runtime_1.jsx)("span", { style: { width: 5, height: 5, borderRadius: "50%", background: ss.dot } }), (0, jsx_runtime_1.jsxs)("span", { style: { color: ss.color, fontSize: 11 }, children: [fmt(row.moisture, 0), "% \u00B7 ", types_1.MOISTURE_LABELS[s]] })] })
                                                        : (0, jsx_runtime_1.jsx)("span", { style: { color: t.muted }, children: "\u2014" }) })] }, row.id));
                                    }) })] }) }), data.length > 15 && ((0, jsx_runtime_1.jsx)("div", { style: { padding: "10px 22px", borderTop: `1px solid ${t.border}`, textAlign: "center" }, children: (0, jsx_runtime_1.jsx)("button", { onClick: () => setShowAll((s) => !s), style: { background: "none", border: `1px solid ${t.border}`, borderRadius: 8, padding: "6px 16px", cursor: "pointer", color: t.muted, fontSize: 11 }, children: showAll ? "show less ↑" : `show all ${data.length} readings ↓` }) }))] })), !loading && !data.length && !error && ((0, jsx_runtime_1.jsx)("div", { style: { textAlign: "center", padding: "60px 0", color: t.muted, fontSize: 13 }, children: "\uD83C\uDF31 no readings yet \u2014 press measure on the ESP32" }))] }));
}
