// Matches the AutoPlant API response shape exactly
export interface Measurement {
  id: number;
  recorded_at: string; // ISO timestamp UTC
  temperature: number; // °C from DHT22
  humidity: number;    // % from DHT22
  moisture: number | null; // % soil moisture (null if not yet measured)
}

export type MoistureStatus = "dry" | "moist" | "wet" | "unknown";

export function getMoistureStatus(moisture: number | null): MoistureStatus {
  if (moisture == null) return "unknown";
  if (moisture < 30)   return "dry";
  if (moisture < 60)   return "moist";
  return "wet";
}

export const MOISTURE_LABELS: Record<MoistureStatus, string> = {
  dry:     "Dry — needs water",
  moist:   "Moist — good",
  wet:     "Very wet",
  unknown: "No data",
};

export interface ApiError {
  error: { message: string };
}
