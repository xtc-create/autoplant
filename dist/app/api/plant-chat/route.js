"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.POST = POST;
const server_1 = require("next/server");
const types_1 = require("../../../types");
const MEASUREMENTS_URL = "https://autoplant.onrender.com/measurement";
const GEMINI_MODEL = "gemini-1.5-flash";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;
function latestContext(measurement) {
    if (!measurement) {
        return "Ende nuk ka lexime për bimën.";
    }
    const moistureStatus = (0, types_1.getMoistureStatus)(measurement.moisture);
    return [
        `Regjistruar më: ${measurement.recorded_at}`,
        `Temperatura: ${measurement.temperature} C`,
        `Lagështia e ajrit: ${measurement.humidity}%`,
        `Lagështia e tokës: ${measurement.moisture == null ? "nuk është matur" : `${measurement.moisture}%`}`,
        `Gjendja e tokës: ${types_1.MOISTURE_LABELS[moistureStatus]}`,
    ].join("\n");
}
function buildPrompt(question, history, latest) {
    const shortHistory = history
        .slice(-8)
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
async function POST(req) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        return server_1.NextResponse.json({ error: { message: "Missing GEMINI_API_KEY in .env.local" } }, { status: 500 });
    }
    try {
        const body = (await req.json());
        const message = body.message?.trim();
        if (!message) {
            return server_1.NextResponse.json({ error: { message: "Mesazhi është i detyrueshëm" } }, { status: 400 });
        }
        const measurementRes = await fetch(MEASUREMENTS_URL, { cache: "no-store" });
        if (!measurementRes.ok) {
            throw new Error(`API i matjeve ktheu HTTP ${measurementRes.status}`);
        }
        const measurements = (await measurementRes.json());
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
                    maxOutputTokens: 500,
                },
            }),
        });
        const geminiJson = await geminiRes.json();
        if (!geminiRes.ok) {
            const message = geminiJson?.error?.message ?? `API i Gemini ktheu HTTP ${geminiRes.status}`;
            throw new Error(message);
        }
        const reply = geminiJson?.candidates?.[0]?.content?.parts
            ?.map((part) => part.text ?? "")
            .join("")
            .trim() || "Nuk arrita të krijoj përgjigje tani.";
        return server_1.NextResponse.json({
            reply,
            latest,
        });
    }
    catch (error) {
        return server_1.NextResponse.json({ error: { message: error.message } }, { status: 500 });
    }
}
