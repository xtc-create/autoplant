# AutoPlant - Node.js + TypeScript + React

Full-stack TypeScript project for the AutoPlant ESP32 plant monitor.

## Structure

```text
src/
|-- app/                  # Next.js dashboard route
|-- components/
|   `-- Dashboard.tsx     # React dashboard component
|-- types.ts              # Shared types
|-- api.ts                # Fetch helpers
|-- server.ts             # Express API proxy server
`-- cli.ts                # Terminal data viewer
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

Run the dashboard in another terminal:

```bash
npm run dev
```

Open `http://localhost:3000` for the React dashboard.

The dashboard calls `http://localhost:3001` by default. To point it somewhere else, set:

```bash
NEXT_PUBLIC_API_URL=http://localhost:3001
```

## API Endpoints

- `GET /api/measurements?limit=N` - all readings, optional limit
- `GET /api/latest` - latest reading with moisture status and alert flag
- `GET /api/stats` - min/max/average sensor stats

The backend proxies data from:

```text
https://autoplant.onrender.com/measurement
```

## CLI

```bash
npm run dev:cli           # show all readings
npm run cli:latest        # show only the latest reading
npm run cli:watch         # auto-refresh every 30s
npm run cli:json          # output raw JSON
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

Build and run the dashboard:

```bash
npm run build:dashboard
npm run start:dashboard
```
