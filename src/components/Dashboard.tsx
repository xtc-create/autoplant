"use client";

import type { CSSProperties } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Measurement, getMoistureStatus, MOISTURE_LABELS } from "../types";
import PlantChatbot from "./PlantChatbot";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
const CHART_LIMIT = 30;

type MetricKey = "temperature" | "humidity" | "moisture";

const METRICS: Record<
  MetricKey,
  { label: string; short: string; unit: string; color: string; fixedScale?: [number, number] }
> = {
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

function fmt(v: number | null | undefined, decimals = 1): string {
  return v == null ? "-" : Number(v).toFixed(decimals);
}

function fmtTime(iso: string): string {
  return new Date(iso).toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function exportCSV(data: Measurement[]): void {
  const header = ["id", "recorded_at", "temperature_c", "humidity_pct", "moisture_pct"];
  const rows = data.map((r) =>
    [r.id, r.recorded_at, r.temperature, r.humidity, r.moisture ?? ""].join(",")
  );
  const blob = new Blob([[header.join(","), ...rows].join("\n")], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = Object.assign(document.createElement("a"), { href: url, download: "autoplant.csv" });
  a.click();
  URL.revokeObjectURL(url);
}

function SensorChart({
  data,
  metric,
  onMetricChange,
  dark,
}: {
  data: Measurement[];
  metric: MetricKey;
  onMetricChange: (metric: MetricKey) => void;
  dark: boolean;
}) {
  const chartData = useMemo(
    () =>
      data
      .slice(0, CHART_LIMIT)
      .reverse()
      .map((reading) => ({
        label: fmtTime(reading.recorded_at),
        time: reading.recorded_at,
        value: reading[metric] == null ? null : Number(reading[metric]),
      }))
      .filter((reading) => reading.value != null),
    [data, metric]
  );

  const meta = METRICS[metric];
  const gridColor = dark ? "rgba(226,232,240,0.14)" : "rgba(15,23,42,0.12)";
  const muted = dark ? "#94a3b8" : "#64748b";
  const axisColor = dark ? "#cbd5e1" : "#334155";

  return (
    <section className="panel chart-panel">
      <div className="panel-header chart-header">
        <div>
          <span className="eyebrow">Tendenca nga API</span>
          <h2>{meta.label}</h2>
        </div>
        <div className="segmented" aria-label="Metrika e grafikut">
          {(Object.keys(METRICS) as MetricKey[]).map((key) => (
            <button
              key={key}
              type="button"
              className={metric === key ? "active" : ""}
              onClick={() => onMetricChange(key)}
            >
              {METRICS[key].short}
            </button>
          ))}
        </div>
      </div>

      {chartData.length >= 2 ? (
        <div className="chart-frame" aria-label={`Grafiku i ${meta.label.toLowerCase()} nga matjet e API-së`}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 12, right: 12, bottom: 6, left: 0 }}>
              <CartesianGrid stroke={gridColor} vertical={false} />
              <XAxis
                dataKey="label"
                minTickGap={28}
                tick={{ fill: muted, fontSize: 11 }}
                tickLine={false}
                axisLine={{ stroke: gridColor }}
              />
              <YAxis
                domain={meta.fixedScale ?? ["auto", "auto"]}
                tickFormatter={(value) => `${Number(value).toFixed(metric === "temperature" ? 1 : 0)}${meta.unit}`}
                tick={{ fill: muted, fontSize: 11 }}
                tickLine={false}
                axisLine={{ stroke: gridColor }}
                width={54}
              />
              <Tooltip
                formatter={(value) => [
                  `${Number(value).toFixed(metric === "temperature" ? 1 : 0)}${meta.unit}`,
                  meta.label,
                ]}
                labelStyle={{ color: axisColor }}
                contentStyle={{
                  background: dark ? "#111827" : "#ffffff",
                  border: `1px solid ${gridColor}`,
                  borderRadius: 8,
                  color: axisColor,
                  fontSize: 12,
                }}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke={meta.color}
                strokeWidth={3}
                dot={{ r: 3, fill: meta.color, strokeWidth: 0 }}
                activeDot={{ r: 5 }}
                connectNulls={false}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="empty-chart">
          {metric === "moisture"
            ? "Duhen të paktën dy matje të lagështisë së tokës nga API."
            : "Duhen të paktën dy matje nga API."}
        </div>
      )}
    </section>
  );
}

export default function Dashboard() {
  const [data, setData] = useState<Measurement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastFetch, setLastFetch] = useState<Date | null>(null);
  const [dark, setDark] = useState(false);
  const [autoRefresh, setAuto] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [alertDismissed, setDismissed] = useState(false);
  const [csvFlash, setCsvFlash] = useState(false);
  const [chartMetric, setChartMetric] = useState<MetricKey>("moisture");

  const fetchData = useCallback(async () => {
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
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (!autoRefresh) return;
    const id = setInterval(fetchData, 30_000);
    return () => clearInterval(id);
  }, [autoRefresh, fetchData]);

  const latest = data[0] ?? null;
  const status = getMoistureStatus(latest?.moisture ?? null);
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
  } as CSSProperties;

  function handleCSV() {
    exportCSV(data);
    setCsvFlash(true);
    setTimeout(() => setCsvFlash(false), 1600);
  }

  return (
    <main className="dashboard" style={cssVars}>
      <style>{`
        .dashboard {
          min-height: 100vh;
          background: var(--bg);
          color: var(--text);
          font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
          overflow-x: hidden;
          padding: max(14px, env(safe-area-inset-top)) max(14px, env(safe-area-inset-right)) max(18px, env(safe-area-inset-bottom)) max(14px, env(safe-area-inset-left));
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
          display: grid;
          grid-template-columns: auto auto auto auto;
          align-items: center;
          justify-content: flex-end;
          gap: 8px;
        }

        .auto-toggle {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          min-height: 36px;
          border: 1px solid var(--border);
          border-radius: 8px;
          padding: 0 10px;
          color: var(--muted);
          cursor: pointer;
          font-size: 12px;
          white-space: nowrap;
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
          padding: 0 12px;
          white-space: nowrap;
        }

        .text-button {
          padding: 0 14px;
          white-space: nowrap;
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
          overflow-wrap: anywhere;
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
          white-space: normal;
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

        .mobile-readings {
          display: none;
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

        .reading-card {
          border-bottom: 1px solid var(--border);
          padding: 13px 14px;
        }

        .reading-card:last-child {
          border-bottom: 0;
        }

        .reading-time {
          color: var(--muted);
          font-size: 12px;
          margin-bottom: 10px;
        }

        .reading-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 8px;
        }

        .reading-field {
          min-width: 0;
          border-radius: 8px;
          background: var(--soft);
          padding: 9px;
        }

        .reading-field span {
          display: block;
          color: var(--muted);
          font-size: 9px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .reading-field strong {
          display: block;
          margin-top: 5px;
          overflow-wrap: anywhere;
          font-size: 13px;
          font-weight: 650;
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

        @media (max-width: 920px) {
          .metrics {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
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
            grid-template-columns: repeat(2, minmax(0, 1fr));
            justify-content: stretch;
            width: 100%;
          }

          .auto-toggle {
            justify-content: center;
            width: 100%;
          }

          .icon-button {
            width: 100%;
          }

          .text-button,
          .primary-button {
            width: 100%;
            padding: 0 10px;
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

          .table-wrap {
            display: none;
          }

          .mobile-readings {
            display: block;
          }
        }

        @media (max-width: 430px) {
          .dashboard {
            padding: 12px;
          }

          h1 {
            font-size: 21px;
          }

          .metric {
            padding: 13px;
          }

          .chart-frame {
            height: 230px;
          }

          .table-panel .panel-header {
            align-items: flex-start;
            flex-direction: column;
            gap: 4px;
          }

          .reading-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 360px) {
          .actions {
            grid-template-columns: 1fr;
          }

          .metrics {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <div className="dashboard-shell">
        {isDry && !alertDismissed && (
          <div className="alert">
            <span>
              <strong>Toka është e thatë</strong> - lagështia është {fmt(latest?.moisture, 0)}%. Ujite bimën.
            </span>
            <button className="dismiss" type="button" onClick={() => setDismissed(true)} aria-label="Mbyll njoftimin">
              x
            </button>
          </div>
        )}

        <header className="topbar">
          <div>
            <h1>AutoPlant</h1>
            <p className="sync">
              {loading && !lastFetch ? "duke u lidhur..." : lastFetch ? `sinkronizuar ${lastFetch.toLocaleTimeString()}` : "-"}
            </p>
          </div>

          <div className="actions">
            <label className="auto-toggle">
              <input type="checkbox" checked={autoRefresh} onChange={(e) => setAuto(e.target.checked)} />
              auto 30s
            </label>
            <button className="icon-button" type="button" onClick={() => setDark((value) => !value)} aria-label="Ndrysho temën">
              {dark ? "Dritë" : "Errët"}
            </button>
            <button
              className={`text-button ${csvFlash ? "exported" : ""}`}
              type="button"
              onClick={handleCSV}
              disabled={!data.length}
            >
              {csvFlash ? "u eksportua" : "CSV"}
            </button>
            <button className="primary-button" type="button" onClick={fetchData} disabled={loading}>
              {loading ? "duke sinkr." : "rifresko"}
            </button>
          </div>
        </header>

        {error && <div className="error">{error} - serveri mund të jetë duke u zgjuar, provo ta rifreskosh.</div>}

        <section className="metrics" aria-label="Leximet e fundit">
          {[
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
          ].map(({ label, value, unit, color, badge }) => (
            <article className="metric" key={label}>
              <p className="metric-label">{label}</p>
              <div className="metric-value">
                <span className="metric-number" style={{ color }}>
                  {value}
                </span>
                {unit && <span className="metric-unit">{unit}</span>}
              </div>
              {badge && (
                <div className="badge" style={{ background: sstyle.bg, color: sstyle.color }}>
                  <span className="dot" style={{ background: sstyle.dot }} />
                  <span>{MOISTURE_LABELS[status]}</span>
                </div>
              )}
            </article>
          ))}
        </section>

        <SensorChart data={data} metric={chartMetric} onMetricChange={setChartMetric} dark={dark} />

        {data.length > 0 && (
          <section className="panel table-panel">
            <div className="panel-header">
              <span className="eyebrow">Lista e leximeve</span>
              <span className="sync">{data.length} gjithsej</span>
            </div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    {["koha", "temp C", "lagështia %", "toka"].map((header) => (
                      <th key={header}>{header}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => {
                    const rowStatus = getMoistureStatus(row.moisture);
                    const rowStyle = STATUS_STYLE[rowStatus];

                    return (
                      <tr key={row.id}>
                        <td data-label="koha">{fmtTime(row.recorded_at)}</td>
                        <td data-label="temp C" style={{ color: "#f97316" }}>{fmt(row.temperature)}</td>
                        <td data-label="lagështia" style={{ color: "#0ea5e9" }}>{fmt(row.humidity)}</td>
                        <td data-label="toka">
                          {row.moisture != null ? (
                            <span className="badge" style={{ background: rowStyle.bg, color: rowStyle.color }}>
                              <span className="dot" style={{ background: rowStyle.dot }} />
                              <span>
                                {fmt(row.moisture, 0)}% - {MOISTURE_LABELS[rowStatus]}
                              </span>
                            </span>
                          ) : (
                            <span className="sync">-</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="mobile-readings">
              {rows.map((row) => {
                const rowStatus = getMoistureStatus(row.moisture);
                const rowStyle = STATUS_STYLE[rowStatus];

                return (
                  <article className="reading-card" key={`mobile-${row.id}`}>
                    <p className="reading-time">{fmtTime(row.recorded_at)}</p>
                    <div className="reading-grid">
                      <div className="reading-field">
                        <span>temp</span>
                        <strong style={{ color: "#f97316" }}>{fmt(row.temperature)} C</strong>
                      </div>
                      <div className="reading-field">
                        <span>ajri</span>
                        <strong style={{ color: "#0ea5e9" }}>{fmt(row.humidity)}%</strong>
                      </div>
                      <div className="reading-field">
                        <span>toka</span>
                        {row.moisture != null ? (
                          <strong style={{ color: rowStyle.color }}>{fmt(row.moisture, 0)}%</strong>
                        ) : (
                          <strong>-</strong>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
            {data.length > 15 && (
              <div className="show-row">
                <button className="text-button" type="button" onClick={() => setShowAll((value) => !value)}>
                  {showAll ? "shfaq më pak" : `shfaq të ${data.length} leximet`}
                </button>
              </div>
            )}
          </section>
        )}

        {!loading && !data.length && !error && (
          <div className="empty-state">Ende nuk ka lexime. Shtyp matjen në ESP32.</div>
        )}

        <PlantChatbot />
      </div>
    </main>
  );
}
