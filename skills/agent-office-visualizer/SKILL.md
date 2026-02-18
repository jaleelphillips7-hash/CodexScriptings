---
name: agent-office-visualizer
description: Next.js OpenClaw Agent Hub with real agent statuses from tools/invoke.
---

# OpenClaw Agent Hub

## Stack
- Next.js App Router + TypeScript.

## Data source
- Gateway `POST /tools/invoke` with tools `agents_list` and `sessions_list`.

## Key behavior
- no hardcoded roster
- dynamic desks/beds
- working => desk typing
- not_working => bed sleeping
