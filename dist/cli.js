#!/usr/bin/env tsx
"use strict";
/**
 * AutoPlant CLI - ekzekuto me: npx tsx src/cli.ts
 *
 * Opsionet:
 *   --watch     rifresko çdo 30s
 *   --latest    shfaq vetëm leximin më të fundit
 *   --json      shfaq JSON të papërpunuar
 */
Object.defineProperty(exports, "__esModule", { value: true });
const api_1 = require("./api");
const types_1 = require("./types");
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
function colorMoisture(v) {
    if (v == null)
        return `${DIM}-${RESET}`;
    const status = (0, types_1.getMoistureStatus)(v);
    const color = status === "dry" ? RED : status === "wet" ? BLUE : GREEN;
    return `${color}${v.toFixed(0)}%${RESET} ${DIM}(${types_1.MOISTURE_LABELS[status]})${RESET}`;
}
function printRow(m) {
    const time = new Date(m.recorded_at).toLocaleString();
    console.log(`${DIM}[${m.id}]${RESET} ${CYAN}${time}${RESET}` +
        `  temp ${YELLOW}${m.temperature.toFixed(1)} C${RESET}` +
        `  ajri ${BLUE}${m.humidity.toFixed(1)}%${RESET}` +
        `  toka ${colorMoisture(m.moisture)}`);
}
function printTable(data) {
    const now = new Date().toLocaleTimeString();
    console.clear();
    console.log(`${BOLD}AutoPlant - ${data.length} lexime  ${DIM}(sinkronizuar ${now})${RESET}\n`);
    const latest = data[0];
    if (latest?.moisture != null && latest.moisture < 30) {
        console.log(`${RED}${BOLD}KUJDES: Toka është e thatë - lagështia ${latest.moisture.toFixed(0)}%. Ujite bimën.${RESET}\n`);
    }
    for (const m of data)
        printRow(m);
    if (WATCH) {
        console.log(`\n${DIM}Duke vëzhguar... rifreskimi tjetër pas 30s (Ctrl+C për dalje)${RESET}`);
    }
}
async function run() {
    try {
        if (LATEST) {
            const m = await (0, api_1.fetchLatest)();
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
        const data = await (0, api_1.fetchMeasurements)();
        if (JSON_OUT) {
            console.log(JSON.stringify(data, null, 2));
            return;
        }
        printTable(data);
    }
    catch (err) {
        console.error(`${RED}Gabim: ${err.message}${RESET}`);
        process.exit(1);
    }
}
run();
if (WATCH) {
    setInterval(run, 30000);
}
