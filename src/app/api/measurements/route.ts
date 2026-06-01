import { NextResponse } from "next/server";
import { fetchMeasurements } from "../../../api";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const limitParam = searchParams.get("limit");
    const limit = limitParam ? Number.parseInt(limitParam, 10) : undefined;
    const data = await fetchMeasurements();
    const result = limit && limit > 0 ? data.slice(0, limit) : data;

    return NextResponse.json({ count: result.length, data: result });
  } catch (error) {
    return NextResponse.json(
      { error: { message: (error as Error).message } },
      { status: 500 }
    );
  }
}
