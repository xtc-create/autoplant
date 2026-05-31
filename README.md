# AutoPlant - Node.js + TypeScript + React

Projekt full-stack në TypeScript për monitorimin e bimës AutoPlant me ESP32.

## Struktura

```text
src/
|-- app/                  # Rruga e panelit në Next.js
|-- components/
|   |-- Dashboard.tsx     # Paneli React
|   `-- PlantChatbot.tsx  # Chatbot-i për bimën
|-- types.ts              # Tipet e përbashkëta
|-- api.ts                # Ndihmësit për fetch
|-- server.ts             # Serveri proxy Express API
`-- cli.ts                # Shikuesi në terminal
```

## Instalimi

```bash
npm install
```

## Zhvillimi lokal

Nise API proxy në një terminal:

```bash
npm run dev:server
```

Hap `http://localhost:3001` për faqen e statusit të API-së.

Nise panelin në një terminal tjetër:

```bash
npm run dev
```

Hap `http://localhost:3000` për panelin React.

Paneli thërret `http://localhost:3001` si parazgjedhje. Për ta ndryshuar, vendos:

```bash
NEXT_PUBLIC_API_URL=http://localhost:3001
```

Për chatbot-in me Gemini, vendos çelësin në `.env.local`:

```bash
GEMINI_API_KEY=...
```

## Endpoint-et e API-së

- `GET /api/measurements?limit=N` - të gjitha leximet, me limit opsional
- `GET /api/latest` - leximi më i fundit me gjendjen e lagështisë dhe sinjalizim
- `GET /api/stats` - minimumi, maksimumi dhe mesatarja për sensorët
- `POST /api/plant-chat` - pyetje për chatbot-in e bimës

Backend-i merr të dhënat nga:

```text
https://autoplant.onrender.com/measurement
```

## CLI

```bash
npm run dev:cli           # shfaq të gjitha leximet
npm run cli:latest        # shfaq vetëm leximin më të fundit
npm run cli:watch         # rifresko automatikisht çdo 30s
npm run cli:json          # shfaq JSON të papërpunuar
```

## Kontrollet

```bash
npm run typecheck
npm run build
npm run build:dashboard
```

## Prodhimi

Kompilo dhe nise serverin API:

```bash
npm run build
npm start
```

Kompilo dhe nise panelin:

```bash
npm run build:dashboard
npm run start:dashboard
```
