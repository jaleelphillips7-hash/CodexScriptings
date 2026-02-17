# Agent Office Visualizer

Retro 2D pixel-art office simulator for AI agent teams using **HTML5 Canvas + plain JavaScript**.

## Features
- 1100x720 dark-theme retro office map with checkered navy floor.
- Top rooms: Conference, Boss Office, and Kitchen.
- Cubicle grid (4x2) with unique desk items by agent role.
- Lounge area with couch, water cooler, bean bags, ping pong table, and whiteboard.
- Animated pixel agents (walk + sit typing pose).
- Behavior model:
  - `working`: walks to desk and sits.
  - `idle`: wanders corridors, kitchen, and lounge zones.
- Polling from `/api/employee-status` every 5 seconds.
- Bottom status badges with agent color + Working/Idle state.
- Editable agent names via built-in inputs (persisted in localStorage).

## Run
Open `index.html` directly, or serve this directory via any static server:

```bash
python3 -m http.server 4173
```

Then visit:

```text
http://localhost:4173/skills/agent-office-visualizer/
```

## Agent names
You can edit names in the UI under **Editable Agent Names**. Changes are reflected on desk labels and status badges and are saved in `localStorage`.

## Expected API shape
`/api/employee-status` can return either:

```json
[
  { "name": "Astra", "status": "working" },
  { "name": "Byte", "status": "idle" }
]
```

or

```json
{
  "employees": [
    { "name": "Astra", "status": "working" }
  ]
}
```
