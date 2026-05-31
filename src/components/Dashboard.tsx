"use client";

import { useState, useEffect, useCallback } from "react";
import { Measurement, getMoistureStatus, MOISTURE_LABELS } from "../types";

// Point this at your local server (src/server.ts) or directly at the ESP32 API
const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

function fmt(v: number | null | undefined, decimals = 1): string {
  return v == null ? "—" : Number(v).toFixed(decimals);
}

function fmtTime(iso: string): string {
  return new Date(iso).toLocaleString([], {
    month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function exportCSV(data: Measurement[]): void {
  const header = ["id", "recorded_at", "temperature_c", "humidity_pct", "moisture_pct"];
  const rows   = data.map((r) =>
    [r.id, r.recorded_at, r.temperature, r.humidity, r.moisture ?? ""].join(",")
  );
  const blob = new Blob([[header.join(","), ...rows].join("\n")], { type: "text/csv" });
  const url  = URL.createObjectURL(blob);
  const a    = Object.assign(document.createElement("a"), { href: url, download: "autoplant.csv" });
  a.click();
  URL.revokeObjectURL(url);
}

const STATUS_STYLE = {
  dry:     { color: "#ef4444", bg: "rgba(239,68,68,0.1)",   dot: "#ef4444" },
  moist:   { color: "#22c55e", bg: "rgba(34,197,94,0.1)",   dot: "#22c55e" },
  wet:     { color: "#3b82f6", bg: "rgba(59,130,246,0.1)",  dot: "#3b82f6" },
  unknown: { color: "#94a3b8", bg: "rgba(148,163,184,0.1)", dot: "#94a3b8" },
};

export default function Dashboard() {
  const [data,       setData]       = useState<Measurement[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState<string | null>(null);
  const [lastFetch,  setLastFetch]  = useState<Date | null>(null);
  const [dark,       setDark]       = useState(false);
  const [autoRefresh,setAuto]       = useState(false);
  const [showAll,    setShowAll]    = useState(false);
  const [alertDismissed, setDismissed] = useState(false);
  const [csvFlash,   setCsvFlash]   = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res  = await fetch(`${API_BASE}/api/measurements`);
      const json = await res.json();
      setData(json.data);
      setLastFetch(new Date());
      setDismissed(false);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    if (!autoRefresh) return;
    const id = setInterval(fetchData, 30_000);
    return () => clearInterval(id);
  }, [autoRefresh, fetchData]);

  const latest  = data[0] ?? null;
  const status  = getMoistureStatus(latest?.moisture ?? null);
  const sstyle  = STATUS_STYLE[status];
  const isDry   = status === "dry";
  const rows    = showAll ? data : data.slice(0, 15);

  const t = {
    bg:      dark ? "#0d0f10" : "#f8fafc",
    surface: dark ? "#161a1d" : "#ffffff",
    border:  dark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.08)",
    text:    dark ? "#e2e8f0" : "#0f172a",
    muted:   "#64748b",
  };

  const card = {
    background: t.surface,
    border: `1px solid ${t.border}`,
    borderRadius: 16,
    padding: "18px 22px",
  } as const;

  function handleCSV() {
    exportCSV(data);
    setCsvFlash(true);
    setTimeout(() => setCsvFlash(false), 1600);
  }

  return (
    <div style={{ minHeight: "100vh", background: t.bg, color: t.text, fontFamily: "'DM Mono', monospace", padding: "28px 24px", transition: "background 0.3s" }}>

      {/* ── DRY ALERT ── */}
      {isDry && !alertDismissed && (
        <div style={{ marginBottom: 20, background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 12, padding: "12px 18px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: 13, color: "#ef4444" }}>
            🌵 <strong>Soil is dry</strong> — moisture at {fmt(latest?.moisture, 0)}%. Water your plant!
          </span>
          <button onClick={() => setDismissed(true)} style={{ background: "none", border: "none", cursor: "pointer", color: t.muted, fontSize: 18 }}>×</button>
        </div>
      )}

      {/* ── HEADER ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28, flexWrap: "wrap", gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 600, margin: 0, letterSpacing: "-0.5px" }}>🌿 AutoPlant</h1>
          <p style={{ fontSize: 11, color: t.muted, margin: "4px 0 0" }}>
            {loading && !lastFetch ? "connecting…" : lastFetch ? `synced ${lastFetch.toLocaleTimeString()}` : "—"}
          </p>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          {/* Auto-refresh */}
          <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: t.muted, cursor: "pointer" }}>
            <input type="checkbox" checked={autoRefresh} onChange={(e) => setAuto(e.target.checked)} />
            auto·30s
          </label>
          {/* Dark mode */}
          <button onClick={() => setDark((d) => !d)} style={{ background: "none", border: `1px solid ${t.border}`, borderRadius: 10, padding: "7px 12px", cursor: "pointer", color: t.text, fontSize: 14 }}>
            {dark ? "☀️" : "🌙"}
          </button>
          {/* CSV */}
          <button
            onClick={handleCSV}
            disabled={!data.length}
            style={{ background: csvFlash ? "rgba(74,222,128,0.15)" : "none", border: `1px solid ${csvFlash ? "rgba(74,222,128,0.5)" : t.border}`, borderRadius: 10, padding: "7px 14px", cursor: "pointer", color: csvFlash ? "#4ade80" : t.text, fontSize: 12, transition: "all 0.2s" }}
          >
            {csvFlash ? "✓ exported" : "↓ CSV"}
          </button>
          {/* Refresh */}
          <button
            onClick={fetchData}
            disabled={loading}
            style={{ background: loading ? "none" : "#4ade80", border: "none", borderRadius: 10, padding: "7px 16px", cursor: loading ? "not-allowed" : "pointer", color: loading ? t.muted : "#0d0f10", fontSize: 12, fontWeight: 500 }}
          >
            {loading ? "syncing…" : "↻ refresh"}
          </button>
        </div>
      </div>

      {/* ── ERROR ── */}
      {error && (
        <div style={{ marginBottom: 20, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: 12, padding: "12px 18px", fontSize: 12, color: "#ef4444" }}>
          ⚠ {error} — server may be waking up, try refreshing.
        </div>
      )}

      {/* ── METRIC CARDS ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12, marginBottom: 20 }}>
        {([
          { label: "temperature", value: fmt(latest?.temperature), unit: "°C",  color: "#fb923c" },
          { label: "humidity",    value: fmt(latest?.humidity),    unit: "%",   color: "#38bdf8" },
          { label: "soil moisture", value: latest?.moisture != null ? fmt(latest.moisture, 0) : "—", unit: latest?.moisture != null ? "%" : "", color: "#a78bfa", badge: latest?.moisture != null },
          { label: "readings",    value: String(data.length || "—"), unit: "",  color: "#4ade80" },
        ] as { label: string; value: string; unit: string; color: string; badge?: boolean }[]).map(({ label, value, unit, color, badge }) => (
          <div key={label} style={card}>
            <p style={{ fontSize: 10, color: t.muted, textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 8px" }}>{label}</p>
            <div style={{ display: "flex", alignItems: "baseline", gap: 3 }}>
              <span style={{ fontSize: 28, fontWeight: 500, color, lineHeight: 1 }}>{value}</span>
              {unit && <span style={{ fontSize: 12, color: t.muted }}>{unit}</span>}
            </div>
            {badge && (
              <div style={{ marginTop: 8, display: "inline-flex", alignItems: "center", gap: 5, background: sstyle.bg, borderRadius: 6, padding: "3px 8px" }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: sstyle.dot, display: "inline-block" }} />
                <span style={{ fontSize: 11, color: sstyle.color }}>{MOISTURE_LABELS[status]}</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* ── TABLE ── */}
      {data.length > 0 && (
        <div style={{ ...card, padding: 0, overflow: "hidden" }}>
          <div style={{ padding: "12px 22px", borderBottom: `1px solid ${t.border}`, display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontSize: 11, color: t.muted, textTransform: "uppercase", letterSpacing: "0.08em" }}>readings log</span>
            <span style={{ fontSize: 11, color: t.muted }}>{data.length} total</span>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${t.border}` }}>
                  {["timestamp", "temp °C", "humidity %", "soil"].map((h, i) => (
                    <th key={h} style={{ padding: "10px 22px", textAlign: i === 0 ? "left" : "right", color: t.muted, fontWeight: 400, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.06em" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => {
                  const s  = getMoistureStatus(row.moisture);
                  const ss = STATUS_STYLE[s];
                  return (
                    <tr key={row.id} style={{ borderBottom: `1px solid ${t.border}`, background: i % 2 ? (dark ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.015)") : "transparent" }}>
                      <td style={{ padding: "9px 22px", color: t.muted }}>{fmtTime(row.recorded_at)}</td>
                      <td style={{ padding: "9px 22px", textAlign: "right", color: "#fb923c" }}>{fmt(row.temperature)}</td>
                      <td style={{ padding: "9px 22px", textAlign: "right", color: "#38bdf8" }}>{fmt(row.humidity)}</td>
                      <td style={{ padding: "9px 22px", textAlign: "right" }}>
                        {row.moisture != null
                          ? <span style={{ display: "inline-flex", alignItems: "center", gap: 5, background: ss.bg, borderRadius: 6, padding: "3px 9px" }}>
                              <span style={{ width: 5, height: 5, borderRadius: "50%", background: ss.dot }} />
                              <span style={{ color: ss.color, fontSize: 11 }}>{fmt(row.moisture, 0)}% · {MOISTURE_LABELS[s]}</span>
                            </span>
                          : <span style={{ color: t.muted }}>—</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {data.length > 15 && (
            <div style={{ padding: "10px 22px", borderTop: `1px solid ${t.border}`, textAlign: "center" }}>
              <button onClick={() => setShowAll((s) => !s)} style={{ background: "none", border: `1px solid ${t.border}`, borderRadius: 8, padding: "6px 16px", cursor: "pointer", color: t.muted, fontSize: 11 }}>
                {showAll ? "show less ↑" : `show all ${data.length} readings ↓`}
              </button>
            </div>
          )}
        </div>
      )}

      {!loading && !data.length && !error && (
        <div style={{ textAlign: "center", padding: "60px 0", color: t.muted, fontSize: 13 }}>
          🌱 no readings yet — press measure on the ESP32
        </div>
      )}
    </div>
  );
}
