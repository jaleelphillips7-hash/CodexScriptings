---
name: agent-office-visualizer
description: Create and run a retro 2D office simulation for AI agents using HTML Canvas and JavaScript.
---

# Agent Office Visualizer Skill

This skill provides a standalone canvas-based office simulation located in this folder.

## Files
- `index.html`: shell UI + canvas + status badges
- `office-sim.js`: rendering, animation loop, behaviors, and API polling
- `README.md`: usage details

## Usage
1. Serve repository root (or this folder) with a static server.
2. Open `/skills/agent-office-visualizer/` in a browser.
3. Optionally implement `/api/employee-status` in your host app.

## Integration notes
- This feature is self-contained and can run in parallel with other repository systems.
- It requires no external assets; all pixel art is drawn with `fillRect`.
