# OpenClaw Agent Hub (Next.js)

Production-oriented Next.js App Router hub that replaces the old hardcoded visualizer with **real-agent state** from OpenClaw gateway tools.

## What this app does
- Renders a retro office canvas using only real agents from `agents_list`.
- Polls every 5 seconds.
- Uses `sessions_list` (`activeMinutes=2`) to compute status:
  - `working`: at least one active `sessionKey` with prefix `agent:<agentId>:`
  - `not_working`: no active session in the window
- Dynamic desks and beds based on agent count.
- If `working` => agent moves to desk + typing pose.
- If `not_working` => agent moves to bed + sleeping animation.
- If gateway returns 0 agents => 0 rendered agents.

## Required environment variables
- `OPENCLAW_GATEWAY_URL` (example `http://127.0.0.1:18789`)
- `OPENCLAW_GATEWAY_TOKEN`
- `PUBLIC_BASE_URL`
- `BACKBLAZE_CONFIG` (document your own format)
- `BACKUP_SCRIPT_PATH` (script called by `/api/backup-now`)
- `ERROR_LOG_PATH` (optional, default `/data/.openclaw/ERRORS_DETECTED.md`)

## API routes
- `GET /api/agents`
- `GET /api/agent-status`
- `POST /api/backup-now` (2-step confirm via nonce)
- `GET /api/errors`

## Docker (same network namespace as gateway)
Use `network_mode: "service:openclaw-cfww-openclaw-1"` to safely reach loopback gateway without widening bind mode:

```yaml
services:
  agent-hub:
    build: ./skills/agent-office-visualizer
    container_name: openclaw-agent-hub
    network_mode: "service:openclaw-cfww-openclaw-1"
    environment:
      OPENCLAW_GATEWAY_URL: "http://127.0.0.1:18789"
      OPENCLAW_GATEWAY_TOKEN: "${OPENCLAW_GATEWAY_TOKEN}"
      PUBLIC_BASE_URL: "https://your-public-url"
      BACKBLAZE_CONFIG: "bucket=...,key=..."
      BACKUP_SCRIPT_PATH: "/data/scripts/backup-now.sh"
      ERROR_LOG_PATH: "/data/.openclaw/ERRORS_DETECTED.md"
    volumes:
      - /data/.openclaw:/data/.openclaw:ro
      - /data/scripts:/data/scripts:ro
    command: ["npm", "run", "start"]
```

## Troubleshooting
- **401 / Gateway auth failed**: token missing/invalid.
- **404 / tool blocked by policy**: `agents_list` or `sessions_list` not allowed by gateway tool policy.
- If no agents returned, canvas intentionally renders no agents.

## Local run
```bash
npm install
npm run dev
```
Open `http://localhost:4173`.
