"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchMeasurements = fetchMeasurements;
exports.fetchLatest = fetchLatest;
const BASE_URL = "https://autoplant.onrender.com";
/**
 * Fetches all measurements from the AutoPlant API, newest first.
 */
async function fetchMeasurements() {
    const res = await fetch(`${BASE_URL}/measurement`);
    if (!res.ok) {
        const body = await res.json().catch(() => ({
            error: { message: `HTTP ${res.status}` },
        }));
        throw new Error(body.error.message);
    }
    return res.json();
}
/**
 * Fetches only the most recent measurement.
 */
async function fetchLatest() {
    const data = await fetchMeasurements();
    return data[0] ?? null;
}
