# AutoPlant - Node.js + TypeScript + React

Full-stack TypeScript project for the AutoPlant ESP32 plant monitor.

## Structure

```text
src/
|-- app/
|   |-- page.tsx           # Landing page
|   |-- dashboard/page.tsx # React dashboard route
|   `-- api/plant-chat    # Gemini chat API route
|-- components/
|   |-- Dashboard.tsx
|   `-- PlantChatbot.tsx
|-- types.ts
|-- api.ts
|-- server.ts
`-- cli.ts
```

## Setup

```bash
npm install
```

## Local Development

Run the API proxy in one terminal:

```bash
npm run dev:server
```

Open `http://localhost:3001` for the API status page.

Run the Next app in another terminal:

```bash
npm run dev
```

Routes:

```text
http://localhost:3000           # landing page
http://localhost:3000/dashboard # dashboard
```

The dashboard calls `http://localhost:3001` by default. To point it somewhere else, set:

```bash
NEXT_PUBLIC_API_URL=http://localhost:3001
```

For the Gemini chatbot, set the key in `.env.local`:

```bash
GEMINI_API_KEY=...
```

## API Endpoints

- `GET /api/measurements?limit=N` - all readings, optional limit
- `GET /api/latest` - latest reading with moisture status and alert flag
- `GET /api/stats` - min/max/average sensor stats
- `POST /api/plant-chat` - plant AI chat endpoint

The backend proxies measurement data from:

```text
https://autoplant.onrender.com/measurement
```

## CLI

```bash
npm run dev:cli
npm run cli:latest
npm run cli:watch
npm run cli:json
```

## Checks

```bash
npm run typecheck
npm run build
npm run build:dashboard
```

## Production

Compile and run the API server:

```bash
npm run build
npm start
```

Build and run the Next app:

```bash
npm run build:dashboard
npm run start:dashboard
```
