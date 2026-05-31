import { Measurement, ApiError } from "./types";

const BASE_URL = "https://autoplant.onrender.com";

/**
 * Fetches all measurements from the AutoPlant API, newest first.
 */
export async function fetchMeasurements(): Promise<Measurement[]> {
  const res = await fetch(`${BASE_URL}/measurement`);

  if (!res.ok) {
    const body: ApiError = await res.json().catch(() => ({
      error: { message: `HTTP ${res.status}` },
    }));
    throw new Error(body.error.message);
  }

  return res.json() as Promise<Measurement[]>;
}

/**
 * Fetches only the most recent measurement.
 */
export async function fetchLatest(): Promise<Measurement | null> {
  const data = await fetchMeasurements();
  return data[0] ?? null;
}
