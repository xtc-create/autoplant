#!/usr/bin/env tsx
/**
 * AutoPlant CLI - ekzekuto me: npx tsx src/cli.ts
 *
 * Opsionet:
 *   --watch     rifresko çdo 30s
 *   --latest    shfaq vetëm leximin më të fundit
 *   --json      shfaq JSON të papërpunuar
 */

import { fetchMeasurements, fetchLatest } from "./api";
import { getMoistureStatus, MOISTURE_LABELS, Measurement } from "./types";

const args = process.argv.slice(2);
const WATCH = args.includes("--watch");
const LATEST = args.includes("--latest");
const JSON_OUT = args.includes("--json");

const RESET = "\x1b[0m";
const BOLD = "\x1b[1m";
const RED = "\x1b[31m";
const GREEN = "\x1b[32m";
const BLUE = "\x1b[34m";
const YELLOW = "\x1b[33m";
const CYAN = "\x1b[36m";
const DIM = "\x1b[2m";

function colorMoisture(v: number | null): string {
  if (v == null) return `${DIM}-${RESET}`;
  const status = getMoistureStatus(v);
  const color = status === "dry" ? RED : status === "wet" ? BLUE : GREEN;
  return `${color}${v.toFixed(0)}%${RESET} ${DIM}(${MOISTURE_LABELS[status]})${RESET}`;
}

function printRow(m: Measurement): void {
  const time = new Date(m.recorded_at).toLocaleString();
  console.log(
    `${DIM}[${m.id}]${RESET} ${CYAN}${time}${RESET}` +
      `  temp ${YELLOW}${m.temperature.toFixed(1)} C${RESET}` +
      `  ajri ${BLUE}${m.humidity.toFixed(1)}%${RESET}` +
      `  toka ${colorMoisture(m.moisture)}`
  );
}

function printTable(data: Measurement[]): void {
  const now = new Date().toLocaleTimeString();
  console.clear();
  console.log(`${BOLD}AutoPlant - ${data.length} lexime  ${DIM}(sinkronizuar ${now})${RESET}\n`);

  const latest = data[0];
  if (latest?.moisture != null && latest.moisture < 30) {
    console.log(
      `${RED}${BOLD}KUJDES: Toka është e thatë - lagështia ${latest.moisture.toFixed(0)}%. Ujite bimën.${RESET}\n`
    );
  }

  for (const m of data) printRow(m);

  if (WATCH) {
    console.log(`\n${DIM}Duke vëzhguar... rifreskimi tjetër pas 30s (Ctrl+C për dalje)${RESET}`);
  }
}

async function run(): Promise<void> {
  try {
    if (LATEST) {
      const m = await fetchLatest();
      if (!m) {
        console.log("Ende nuk ka lexime.");
        return;
      }
      if (JSON_OUT) {
        console.log(JSON.stringify(m, null, 2));
        return;
      }
      printRow(m);
      return;
    }

    const data = await fetchMeasurements();
    if (JSON_OUT) {
      console.log(JSON.stringify(data, null, 2));
      return;
    }
    printTable(data);
  } catch (err) {
    console.error(`${RED}Gabim: ${(err as Error).message}${RESET}`);
    process.exit(1);
  }
}

run();

if (WATCH) {
  setInterval(run, 30_000);
}
