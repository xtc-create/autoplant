#!/usr/bin/env tsx
/**
 * AutoPlant CLI — run with:  npx tsx src/cli.ts
 *
 * Flags:
 *   --watch     poll every 30s
 *   --latest    show only the most recent reading
 *   --json      output raw JSON
 */

import { fetchMeasurements, fetchLatest } from "./api";
import { getMoistureStatus, MOISTURE_LABELS, Measurement } from "./types";

const args = process.argv.slice(2);
const WATCH  = args.includes("--watch");
const LATEST = args.includes("--latest");
const JSON_OUT = args.includes("--json");

const RESET  = "\x1b[0m";
const BOLD   = "\x1b[1m";
const RED    = "\x1b[31m";
const GREEN  = "\x1b[32m";
const BLUE   = "\x1b[34m";
const YELLOW = "\x1b[33m";
const CYAN   = "\x1b[36m";
const DIM    = "\x1b[2m";

function colorMoisture(v: number | null): string {
  if (v == null) return `${DIM}—${RESET}`;
  const status = getMoistureStatus(v);
  const color  = status === "dry" ? RED : status === "wet" ? BLUE : GREEN;
  return `${color}${v.toFixed(0)}%${RESET} ${DIM}(${MOISTURE_LABELS[status]})${RESET}`;
}

function printRow(m: Measurement): void {
  const time = new Date(m.recorded_at).toLocaleString();
  console.log(
    `${DIM}[${m.id}]${RESET} ${CYAN}${time}${RESET}` +
    `  🌡  ${YELLOW}${m.temperature.toFixed(1)}°C${RESET}` +
    `  💧 ${BLUE}${m.humidity.toFixed(1)}%${RESET}` +
    `  🪴 ${colorMoisture(m.moisture)}`
  );
}

function printTable(data: Measurement[]): void {
  const now = new Date().toLocaleTimeString();
  console.clear();
  console.log(`${BOLD}🌿 AutoPlant — ${data.length} readings  ${DIM}(synced ${now})${RESET}\n`);

  // Dry soil warning
  const latest = data[0];
  if (latest?.moisture != null && latest.moisture < 30) {
    console.log(`${RED}${BOLD}⚠  SOIL IS DRY — moisture at ${latest.moisture.toFixed(0)}%! Water your plant.${RESET}\n`);
  }

  for (const m of data) printRow(m);

  if (WATCH) {
    console.log(`\n${DIM}Watching… next refresh in 30s  (Ctrl+C to quit)${RESET}`);
  }
}

async function run(): Promise<void> {
  try {
    if (LATEST) {
      const m = await fetchLatest();
      if (!m) { console.log("No readings yet."); return; }
      if (JSON_OUT) { console.log(JSON.stringify(m, null, 2)); return; }
      printRow(m);
      return;
    }

    const data = await fetchMeasurements();
    if (JSON_OUT) { console.log(JSON.stringify(data, null, 2)); return; }
    printTable(data);
  } catch (err) {
    console.error(`${RED}Error: ${(err as Error).message}${RESET}`);
    process.exit(1);
  }
}

run();

if (WATCH) {
  setInterval(run, 30_000);
}
