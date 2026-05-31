import { NextRequest, NextResponse } from "next/server";
import { getMoistureStatus, MOISTURE_LABELS, type Measurement } from "../../../types";

const MEASUREMENTS_URL = "https://autoplant.onrender.com/measurement";
const GEMINI_MODEL = "gemini-2.0-flash";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

function latestContext(measurement: Measurement | null) {
  if (!measurement) {
    return "Ende nuk ka lexime për bimën.";
  }

  const moistureStatus = getMoistureStatus(measurement.moisture);

  return [
    `Regjistruar më: ${measurement.recorded_at}`,
    `Temperatura: ${measurement.temperature} C`,
    `Lagështia e ajrit: ${measurement.humidity}%`,
    `Lagështia e tokës: ${measurement.moisture == null ? "nuk është matur" : `${measurement.moisture}%`}`,
    `Gjendja e tokës: ${MOISTURE_LABELS[moistureStatus]}`,
  ].join("\n");
}

function buildPrompt(question: string, history: ChatMessage[], latest: Measurement | null) {
  const shortHistory = history
    .slice(-4)
    .map((message) => `${message.role === "user" ? "Përdoruesi" : "Asistenti"}: ${message.content}`)
    .join("\n");

  return `Ti je asistenti i AutoPlant për kujdesin e bimëve. Përgjigju gjithmonë në shqip, me ton miqësor dhe praktik.
Përdor kontekstin e sensorëve më poshtë kur përgjigjesh. Nëse lagështia e tokës mungon, thuaj që ende nuk është matur.
Mos shpik lexime dhe mos pretendo llojin e bimës nëse përdoruesi nuk ta thotë.

Konteksti i fundit nga sensorët:
${latestContext(latest)}

Biseda e fundit:
${shortHistory || "Nuk ka bisedë të mëparshme."}

Pyetja e përdoruesit:
${question}`;
}

function isQuotaError(status: number, message: string) {
  const normalized = message.toLowerCase();
  return status === 429 || normalized.includes("quota") || normalized.includes("rate limit");
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: { message: "Missing GEMINI_API_KEY in .env.local" } },
      { status: 500 }
    );
  }

  try {
    const body = (await req.json()) as { message?: string; history?: ChatMessage[] };
    const message = body.message?.trim();

    if (!message) {
      return NextResponse.json({ error: { message: "Mesazhi është i detyrueshëm" } }, { status: 400 });
    }

    const measurementRes = await fetch(MEASUREMENTS_URL, { cache: "no-store" });

    if (!measurementRes.ok) {
      throw new Error(`API i matjeve ktheu HTTP ${measurementRes.status}`);
    }

    const measurements = (await measurementRes.json()) as Measurement[];
    const latest = measurements[0] ?? null;
    const prompt = buildPrompt(message, body.history ?? [], latest);

    const geminiRes = await fetch(`${GEMINI_URL}?key=${encodeURIComponent(apiKey)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          temperature: 0.5,
          maxOutputTokens: 300,
        },
      }),
    });

    const geminiJson = await geminiRes.json();

    if (!geminiRes.ok) {
      const message =
        geminiJson?.error?.message ?? `API i Gemini ktheu HTTP ${geminiRes.status}`;

      if (isQuotaError(geminiRes.status, message)) {
        return NextResponse.json(
          {
            error: {
              message:
                "Kuota e Gemini API është tejkaluar ose nuk është aktive për këtë API key. Kontrollo planin/billing në Google AI Studio ose provo përsëri më vonë.",
            },
          },
          { status: 429 }
        );
      }

      throw new Error(message);
    }

    const reply =
      geminiJson?.candidates?.[0]?.content?.parts
        ?.map((part: { text?: string }) => part.text ?? "")
        .join("")
        .trim() || "Nuk arrita të krijoj përgjigje tani.";

    return NextResponse.json({
      reply,
      latest,
    });
  } catch (error) {
    return NextResponse.json(
      { error: { message: (error as Error).message } },
      { status: 500 }
    );
  }
}
