import { NextResponse } from "next/server";
import { fetchLatest } from "../../../api";
import { getMoistureStatus, MOISTURE_LABELS } from "../../../types";

export async function GET() {
  try {
    const latest = await fetchLatest();

    if (!latest) {
      return NextResponse.json({ error: { message: "Ende nuk ka lexime" } }, { status: 404 });
    }

    const status = getMoistureStatus(latest.moisture);

    return NextResponse.json({
      ...latest,
      moisture_status: status,
      moisture_label: MOISTURE_LABELS[status],
      alert: status === "dry",
    });
  } catch (error) {
    return NextResponse.json(
      { error: { message: (error as Error).message } },
      { status: 500 }
    );
  }
}
