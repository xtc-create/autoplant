import { NextRequest, NextResponse } from "next/server";
import { getMoistureStatus, MOISTURE_LABELS, type Measurement } from "../../../types";

const MEASUREMENTS_URL = "https://autoplant.onrender.com/measurement";
const GEMINI_MODELS = [
  "gemini-2.5-flash-lite-preview-06-17",
  "gemini-2.5-flash",
  "gemini-1.5-flash-latest",
];

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

function latestContext(measurement: Measurement | null) {
  if (!measurement) {
    return "No plant readings are available yet.";
  }

  const moistureStatus = getMoistureStatus(measurement.moisture);

  return [
    `Recorded at: ${measurement.recorded_at}`,
    `Temperature: ${measurement.temperature} C`,
    `Air humidity: ${measurement.humidity}%`,
    `Soil moisture: ${measurement.moisture == null ? "not measured" : `${measurement.moisture}%`}`,
    `Soil status: ${MOISTURE_LABELS[moistureStatus]}`,
  ].join("\n");
}

function buildPrompt(question: string, history: ChatMessage[], latest: Measurement | null) {
  const shortHistory = history
    .slice(-4)
    .map((message) => `${message.role === "user" ? "User" : "Assistant"}: ${message.content}`)
    .join("\n");

  return `You are AutoPlant's plant-care assistant.
Reply in the same language the user uses. If the user mixes Albanian and English, a natural mixed reply is okay.
Use the sensor context below. If soil moisture is missing, say it has not been measured yet.
Do not invent readings and do not claim a plant species unless the user tells you.
Give a complete answer and finish with a clear recommendation. Do not stop mid-sentence.

Latest sensor context:
${latestContext(latest)}

Recent chat:
${shortHistory || "No previous chat."}

User question:
${question}`;
}

function isQuotaError(status: number, message: string) {
  const normalized = message.toLowerCase();
  return status === 429 || normalized.includes("quota") || normalized.includes("rate limit");
}

function fallbackReply(latest: Measurement | null) {
  if (!latest) {
    return "Gemini is unavailable right now, but I can still read the sensors. There are no plant readings yet, so press measure on the ESP32 first.";
  }

  const status = getMoistureStatus(latest.moisture);
  const moisture =
    latest.moisture == null ? "not measured" : `${latest.moisture.toFixed(0)}%`;
  const temperature = latest.temperature.toFixed(1);
  const humidity = latest.humidity.toFixed(1);

  if (status === "dry") {
    return `Gemini is unavailable right now, but based on the latest sensors: soil moisture is ${moisture}, temperature is ${temperature} C, and air humidity is ${humidity}%. The soil is dry, so water the plant now, then check moisture again after a few minutes.`;
  }

  if (status === "moist") {
    return `Gemini is unavailable right now, but based on the latest sensors: soil moisture is ${moisture}, temperature is ${temperature} C, and air humidity is ${humidity}%. The soil looks okay, so do not water yet. Keep monitoring it.`;
  }

  if (status === "wet") {
    return `Gemini is unavailable right now, but based on the latest sensors: soil moisture is ${moisture}, temperature is ${temperature} C, and air humidity is ${humidity}%. The soil is very wet, so avoid watering and let it drain/dry a bit.`;
  }

  return `Gemini is unavailable right now, but based on the latest sensors: temperature is ${temperature} C and air humidity is ${humidity}%. Soil moisture has not been measured yet, so press the moisture button on the ESP32 before deciding whether to water.`;
}

function geminiUrl(model: string, apiKey: string) {
  return `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;
}

async function askGemini(model: string, apiKey: string, prompt: string) {
  const res = await fetch(geminiUrl(model, apiKey), {
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
        maxOutputTokens: 900,
      },
    }),
  });

  const json = await res.json();

  if (!res.ok) {
    return {
      ok: false as const,
      status: res.status,
      error: json?.error?.message ?? `Gemini API returned HTTP ${res.status}`,
    };
  }

  const reply =
    json?.candidates?.[0]?.content?.parts
      ?.map((part: { text?: string }) => part.text ?? "")
      .join("")
      .trim() || "";

  return {
    ok: true as const,
    reply,
  };
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
      return NextResponse.json({ error: { message: "Message is required" } }, { status: 400 });
    }

    const measurementRes = await fetch(MEASUREMENTS_URL, { cache: "no-store" });

    if (!measurementRes.ok) {
      throw new Error(`Measurement API returned HTTP ${measurementRes.status}`);
    }

    const measurements = (await measurementRes.json()) as Measurement[];
    const latest = measurements[0] ?? null;
    const prompt = buildPrompt(message, body.history ?? [], latest);
    const failures: string[] = [];

    for (const model of GEMINI_MODELS) {
      const result = await askGemini(model, apiKey, prompt);

      if (result.ok && result.reply) {
        return NextResponse.json({
          reply: result.reply,
          latest,
          model,
        });
      }

      failures.push(
        result.ok
          ? `${model}: Empty response.`
          : `${model}: ${result.error}`
      );
    }

    const hasQuotaError = failures.some((failure) => isQuotaError(429, failure));

    if (hasQuotaError) {
      return NextResponse.json({
        reply: fallbackReply(latest),
        latest,
        model: "local-fallback",
      });
    }

    return NextResponse.json(
      {
        error: {
          message: `No Gemini model worked with this API key. Tried: ${GEMINI_MODELS.join(", ")}.`,
          details: failures,
        },
      },
      { status: 502 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: { message: (error as Error).message } },
      { status: 500 }
    );
  }
}
