"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const api_1 = require("./api");
const types_1 = require("./types");
const app = (0, express_1.default)();
const PORT = process.env.PORT ?? 3001;
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.get("/", (_req, res) => {
    res.type("html").send(`<!doctype html>
<html lang="sq">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>AutoPlant API</title>
    <style>
      body {
        margin: 0;
        min-height: 100vh;
        display: grid;
        place-items: center;
        background: #f8fafc;
        color: #0f172a;
        font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
      }
      main {
        width: min(680px, calc(100vw - 32px));
        border: 1px solid rgba(15, 23, 42, 0.12);
        border-radius: 12px;
        background: #ffffff;
        padding: 24px;
      }
      h1 { margin: 0 0 8px; font-size: 24px; }
      p { color: #475569; line-height: 1.6; }
      ul { padding-left: 20px; line-height: 1.9; }
      code {
        border-radius: 6px;
        background: #f1f5f9;
        padding: 2px 6px;
      }
      a { color: #15803d; }
    </style>
  </head>
  <body>
    <main>
      <h1>API i AutoPlant është aktiv</h1>
      <p>Ky është serveri proxy Express në portën ${PORT}. Për panelin React, ekzekuto <code>npm run dev</code> dhe hap URL-në e Next.js, zakonisht <code>http://localhost:3000</code>.</p>
      <ul>
        <li><a href="/api/measurements"><code>GET /api/measurements</code></a></li>
        <li><a href="/api/latest"><code>GET /api/latest</code></a></li>
        <li><a href="/api/stats"><code>GET /api/stats</code></a></li>
      </ul>
    </main>
  </body>
</html>`);
});
// ─── GET /api/measurements ───────────────────────────────────────────────────
// Proxy + optional filtering
app.get("/api/measurements", async (req, res, next) => {
    try {
        const data = await (0, api_1.fetchMeasurements)();
        // ?limit=N
        const limit = req.query.limit ? parseInt(req.query.limit, 10) : undefined;
        const result = limit ? data.slice(0, limit) : data;
        res.json({ count: result.length, data: result });
    }
    catch (err) {
        next(err);
    }
});
// ─── GET /api/latest ─────────────────────────────────────────────────────────
app.get("/api/latest", async (_req, res, next) => {
    try {
        const m = await (0, api_1.fetchLatest)();
        if (!m)
            return res.status(404).json({ error: { message: "Ende nuk ka lexime" } });
        const status = (0, types_1.getMoistureStatus)(m.moisture);
        res.json({
            ...m,
            moisture_status: status,
            moisture_label: types_1.MOISTURE_LABELS[status],
            alert: status === "dry",
        });
    }
    catch (err) {
        next(err);
    }
});
// ─── GET /api/stats ───────────────────────────────────────────────────────────
app.get("/api/stats", async (_req, res, next) => {
    try {
        const data = await (0, api_1.fetchMeasurements)();
        if (!data.length)
            return res.status(404).json({ error: { message: "Nuk ka të dhëna" } });
        const temps = data.map((d) => d.temperature);
        const humids = data.map((d) => d.humidity);
        const moistures = data.map((d) => d.moisture).filter((v) => v != null);
        const avg = (arr) => arr.reduce((a, b) => a + b, 0) / arr.length;
        res.json({
            total_readings: data.length,
            temperature: {
                min: Math.min(...temps).toFixed(1),
                max: Math.max(...temps).toFixed(1),
                avg: avg(temps).toFixed(1),
            },
            humidity: {
                min: Math.min(...humids).toFixed(1),
                max: Math.max(...humids).toFixed(1),
                avg: avg(humids).toFixed(1),
            },
            moisture: moistures.length
                ? {
                    min: Math.min(...moistures).toFixed(0),
                    max: Math.max(...moistures).toFixed(0),
                    avg: avg(moistures).toFixed(0),
                    readings: moistures.length,
                }
                : null,
        });
    }
    catch (err) {
        next(err);
    }
});
// ─── Error handler ────────────────────────────────────────────────────────────
app.use((err, _req, res, _next) => {
    console.error(err.message);
    res.status(500).json({ error: { message: err.message } });
});
app.listen(PORT, () => {
    console.log(`AutoPlant serveri është aktiv në http://localhost:${PORT}`);
});
exports.default = app;
