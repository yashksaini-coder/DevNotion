# DevNotion — Excalidraw Diagrams

This directory contains three architectural/design diagrams for the DevNotion project, all in the `.excalidraw` format.

## How to open

**Option 1 — excalidraw.com:**
1. Go to [excalidraw.com](https://excalidraw.com)
2. Click **File → Open** (or drag-and-drop the file onto the canvas)
3. Select the `.excalidraw` file from this directory

**Option 2 — VS Code:**
Install the [Excalidraw extension](https://marketplace.visualstudio.com/items?itemName=pomdtr.excalidraw-editor) by `pomdtr`, then open any `.excalidraw` file directly in the editor.

---

## Diagrams

### 1. `architecture.excalidraw`
**Title:** DevNotion v2 — Agent Architecture

Shows the 3-agent pipeline:
`weekStart` → Harvest Agent → Narrator Agent → Draft persisted → Approval Gate (dashboard) → Publisher Agent → Notion / DEV.to / Hashnode

The cover image is a **deterministic stats card** (SVG → PNG via resvg) rendered as a non-LLM step — not an agent. Includes two labeled phase groups: **GENERATE PHASE** (Harvest/Narrator) and **PUBLISH PHASE** (Publisher + targets).

---

### 2. `updates-roadmap.excalidraw`
**Title:** DevNotion — v1 → v2 → v2.1

A three-column timeline showing the evolution of the project:
- **v1** — Notion MCP Challenge winner ($500): Gemini only, headless cron, silent fallback
- **v2** — Finish-Up-A-Thon (7 phases): multi-LLM, fail-loud, approval gate, Swiss dashboard, deterministic stats-card cover
- **v2.1** — stats card used as the cover (no AI image agent), per-run delete, public landing page, Swiss polish, draft-only, "Dev log #n" prefix

---

### 3. `feature-comparison.excalidraw`
**Title:** v1 vs v2 — Feature Comparison

A 3-column comparison table (Feature | v1 | v2) covering:
LLMs, publish targets, flow, UI, cover image, harvest strategy, failure mode, setup, and test coverage.
