/**
 * gen-excalidraw.mjs
 * Generates 4 Excalidraw diagram files for the DevNotion project.
 * Run with: node scripts/gen-excalidraw.mjs
 */

import { writeFileSync, mkdirSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, "../docs/diagrams");
mkdirSync(OUT_DIR, { recursive: true });

// ─────────────────────────────────────────────
// ID / seed helpers (deterministic, no Math.random)
// ─────────────────────────────────────────────
let _n = 1;
const nid = () => `el-${_n++}`;
const sd = () => ((_n * 100003) % 2147483647);

// ─────────────────────────────────────────────
// Element factories
// ─────────────────────────────────────────────
function base(type, x, y, w, h, o = {}) {
  return {
    id: nid(),
    type,
    x,
    y,
    width: w,
    height: h,
    angle: 0,
    strokeColor: o.stroke ?? "#1e1e1e",
    backgroundColor: o.bg ?? "transparent",
    fillStyle: "solid",
    strokeWidth: o.strokeWidth ?? 2,
    strokeStyle: "solid",
    roughness: 1,
    opacity: o.opacity ?? 100,
    groupIds: [],
    frameId: null,
    roundness: o.round === false ? null : { type: 3 },
    seed: sd(),
    version: 1,
    versionNonce: sd(),
    isDeleted: false,
    boundElements: [],
    updated: 1717000000000,
    link: null,
    locked: false,
  };
}

function rect(x, y, w, h, o = {}) {
  return base("rectangle", x, y, w, h, o);
}

function textEl(x, y, w, h, str, o = {}) {
  const fs = o.fontSize ?? 16;
  return {
    ...base("text", x, y, w, h, { ...o, round: false }),
    text: str,
    fontSize: fs,
    fontFamily: o.fontFamily ?? 2,
    textAlign: o.align ?? "center",
    verticalAlign: "middle",
    containerId: null,
    originalText: str,
    lineHeight: 1.25,
    autoResize: true,
    baseline: fs,
  };
}

function arrow(x1, y1, x2, y2, o = {}) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  return {
    ...base("arrow", x1, y1, 0, 0, { ...o, round: false }),
    points: [
      [0, 0],
      [dx, dy],
    ],
    lastCommittedPoint: null,
    startBinding: null,
    endBinding: null,
    startArrowhead: null,
    endArrowhead: o.end ?? "arrow",
  };
}

// Convenience: box + centered label
function boxLabel(x, y, w, h, label, bo = {}, to = {}) {
  const els = [];
  els.push(rect(x, y, w, h, bo));
  const lines = label.split("\n").length;
  const textH = Math.min(h - 8, lines * 20 + 10);
  els.push(
    textEl(x + 4, y + (h - textH) / 2, w - 8, textH, label, {
      fontSize: to.fontSize ?? 14,
      ...to,
    })
  );
  return els;
}

// ─────────────────────────────────────────────
// Palette
// ─────────────────────────────────────────────
const P = {
  nodeBlue: "#e7f5ff",
  accentFill: "#fff4e6",
  accentStroke: "#ff4d2e",
  success: "#ebfbee",
  neutral: "#f1f3f5",
  stroke: "#1e1e1e",
};

// ─────────────────────────────────────────────
// File writer
// ─────────────────────────────────────────────
function writeExcalidraw(filename, elements) {
  const doc = {
    type: "excalidraw",
    version: 2,
    source: "https://devnotion",
    elements,
    appState: {
      viewBackgroundColor: "#ffffff",
      gridSize: null,
    },
    files: {},
  };
  const outPath = join(OUT_DIR, filename);
  writeFileSync(outPath, JSON.stringify(doc, null, 2), "utf8");
  console.log(`Written: ${outPath} (${elements.length} elements)`);
}

// ═════════════════════════════════════════════
// 1. architecture.excalidraw
// ═════════════════════════════════════════════
function buildArchitecture() {
  const els = [];

  // Title
  els.push(
    textEl(20, 10, 900, 50, "DevNotion v2 — Agent Architecture", {
      fontSize: 28,
      stroke: P.accentStroke,
      align: "left",
      fontFamily: 2,
    })
  );

  // Group background: GENERATE PHASE (behind harvest/narrator/image agents)
  const genBox = rect(60, 130, 870, 230, {
    bg: "#e7f5ff",
    stroke: "#74c0fc",
    strokeWidth: 1,
    opacity: 40,
    round: true,
  });
  els.push(genBox);
  els.push(
    textEl(70, 135, 200, 25, "GENERATE PHASE", {
      fontSize: 12,
      stroke: "#1971c2",
      align: "left",
    })
  );

  // Group background: PUBLISH PHASE
  const pubBox = rect(60, 420, 870, 160, {
    bg: "#fff4e6",
    stroke: P.accentStroke,
    strokeWidth: 1,
    opacity: 40,
    round: true,
  });
  els.push(pubBox);
  els.push(
    textEl(70, 425, 200, 25, "PUBLISH PHASE", {
      fontSize: 12,
      stroke: P.accentStroke,
      align: "left",
    })
  );

  // Row 1: weekStart → Harvest Agent → Narrator Agent → Image Agent → Draft persisted
  const BW = 160;
  const BH = 90;
  const GAP_H = 50;
  const ROW1_Y = 150;

  const nodes = [
    {
      label: "weekStart",
      x: 80,
      y: ROW1_Y,
      w: 130,
      h: BH,
      bg: P.neutral,
      stroke: P.stroke,
    },
    {
      label: "1 · Harvest Agent\n(deterministic · GitHub GraphQL)\n+ per-commit deltas,\ntouched areas",
      x: 260,
      y: ROW1_Y,
      w: BW + 20,
      h: BH,
      bg: P.nodeBlue,
      stroke: P.stroke,
    },
    {
      label: "2 · Narrator Agent\n(gemini-3-flash-preview)\nfail-loud: error → run fails",
      x: 480,
      y: ROW1_Y,
      w: BW + 20,
      h: BH,
      bg: P.nodeBlue,
      stroke: P.stroke,
    },
    {
      label: "3 · Image Agent\n(Nano Banana cover +\ndeterministic stats card)",
      x: 700,
      y: ROW1_Y,
      w: BW + 20,
      h: BH,
      bg: P.nodeBlue,
      stroke: P.stroke,
    },
    {
      label: "Draft persisted",
      x: 870,
      y: ROW1_Y,
      w: 130,
      h: BH,
      bg: P.success,
      stroke: "#37b24d",
    },
  ];

  // Row 2: Approval Gate → Publisher Agent → Targets
  const ROW2_Y = ROW1_Y + BH + 130;
  const row2Nodes = [
    {
      label: "Approval Gate\n(dashboard)\npreview · edit · approve",
      x: 80,
      y: ROW2_Y,
      w: BW + 40,
      h: BH,
      bg: P.accentFill,
      stroke: P.accentStroke,
      isAccent: true,
    },
    {
      label: "4 · Publisher Agent\n(deterministic)",
      x: 340,
      y: ROW2_Y,
      w: BW + 20,
      h: BH,
      bg: P.nodeBlue,
      stroke: P.stroke,
    },
    {
      label: "Notion · DEV.to\n· Hashnode",
      x: 600,
      y: ROW2_Y,
      w: BW,
      h: BH,
      bg: P.success,
      stroke: "#37b24d",
    },
  ];

  // Draw row 1 nodes
  for (const n of nodes) {
    els.push(
      ...boxLabel(n.x, n.y, n.w, n.h, n.label, {
        bg: n.bg,
        stroke: n.stroke,
        round: true,
      }, {
        fontSize: 12,
        stroke: n.isAccent ? P.accentStroke : n.stroke,
      })
    );
  }

  // Draw row 1 arrows
  for (let i = 0; i < nodes.length - 1; i++) {
    const a = nodes[i];
    const b = nodes[i + 1];
    els.push(arrow(a.x + a.w, a.y + a.h / 2, b.x, b.y + b.h / 2));
  }

  // Draw row 2 nodes
  for (const n of row2Nodes) {
    els.push(
      ...boxLabel(n.x, n.y, n.w, n.h, n.label, {
        bg: n.bg,
        stroke: n.stroke,
        round: true,
      }, {
        fontSize: 12,
        stroke: n.isAccent ? P.accentStroke : n.stroke,
      })
    );
  }

  // Row 2 arrows
  for (let i = 0; i < row2Nodes.length - 1; i++) {
    const a = row2Nodes[i];
    const b = row2Nodes[i + 1];
    els.push(arrow(a.x + a.w, a.y + a.h / 2, b.x, b.y + b.h / 2));
  }

  // Arrow from Draft persisted (row1 last) down to Approval Gate (row2 first)
  const last1 = nodes[nodes.length - 1];
  const first2 = row2Nodes[0];
  // Go down from Draft persisted bottom-center to Approval Gate top-center
  els.push(
    arrow(
      last1.x + last1.w / 2,
      last1.y + last1.h,
      first2.x + first2.w / 2,
      first2.y,
      { stroke: "#888" }
    )
  );

  return els;
}

// ═════════════════════════════════════════════
// 2. system-design.excalidraw
// ═════════════════════════════════════════════
function buildSystemDesign() {
  const els = [];

  // Title
  els.push(
    textEl(20, 10, 1000, 50, "DevNotion — System Design & Data Flow", {
      fontSize: 28,
      stroke: P.accentStroke,
      align: "left",
    })
  );

  const BW = 200;
  const BH = 70;

  // Layer 0: Browser
  const browser = { x: 400, y: 70, w: BW, h: BH };
  els.push(...boxLabel(browser.x, browser.y, browser.w, browser.h, "Browser", {
    bg: P.neutral, stroke: P.stroke, round: true,
  }, { fontSize: 14 }));

  // Layer 1: Express server
  const express = { x: 350, y: 200, w: 300, h: BH };
  els.push(...boxLabel(express.x, express.y, express.w, express.h, "Express server", {
    bg: P.nodeBlue, stroke: P.stroke, round: true,
  }, { fontSize: 14 }));

  // Arrow browser → express
  els.push(arrow(browser.x + browser.w / 2, browser.y + browser.h, express.x + express.w / 2, express.y));

  // Layer 2: Routes
  const ROUTE_Y = 340;
  const landing = { x: 60, y: ROUTE_Y, w: 200, h: BH };
  const auth = { x: 320, y: ROUTE_Y, w: 220, h: BH };
  const preview = { x: 600, y: ROUTE_Y, w: 220, h: BH };

  els.push(...boxLabel(landing.x, landing.y, landing.w, landing.h, "Landing  GET /\n(public)", {
    bg: P.accentFill, stroke: P.accentStroke, round: true,
  }, { fontSize: 12, stroke: P.accentStroke }));

  els.push(...boxLabel(auth.x, auth.y, auth.w, auth.h, "Auth middleware\n(DASHBOARD_TOKEN)", {
    bg: P.neutral, stroke: P.stroke, round: true,
  }, { fontSize: 12 }));

  els.push(...boxLabel(preview.x, preview.y, preview.w, preview.h, "/preview/:id\n(review / approve)", {
    bg: P.nodeBlue, stroke: P.stroke, round: true,
  }, { fontSize: 12 }));

  // Express → Landing, Auth, Preview
  els.push(arrow(express.x + express.w / 2, express.y + express.h, landing.x + landing.w / 2, landing.y));
  els.push(arrow(express.x + express.w / 2, express.y + express.h, auth.x + auth.w / 2, auth.y));
  els.push(arrow(express.x + express.w / 2, express.y + express.h, preview.x + preview.w / 2, preview.y));

  // Layer 3 (behind auth): /runs, /run
  const BEHIND_Y = 480;
  const runs = { x: 240, y: BEHIND_Y, w: 170, h: BH };
  const runRoute = { x: 440, y: BEHIND_Y, w: 170, h: BH };

  els.push(...boxLabel(runs.x, runs.y, runs.w, runs.h, "/runs\n(history + delete)", {
    bg: P.nodeBlue, stroke: P.stroke, round: true,
  }, { fontSize: 12 }));

  els.push(...boxLabel(runRoute.x, runRoute.y, runRoute.w, runRoute.h, "/run\n(generate)", {
    bg: P.nodeBlue, stroke: P.stroke, round: true,
  }, { fontSize: 12 }));

  // Auth → /runs, /run
  els.push(arrow(auth.x + auth.w / 2, auth.y + auth.h, runs.x + runs.w / 2, runs.y));
  els.push(arrow(auth.x + auth.w / 2, auth.y + auth.h, runRoute.x + runRoute.w / 2, runRoute.y));

  // Layer 4: generateContent
  const gen = { x: 380, y: 620, w: 230, h: BH };
  els.push(...boxLabel(gen.x, gen.y, gen.w, gen.h, "generateContent()", {
    bg: P.nodeBlue, stroke: "#1971c2", round: true,
  }, { fontSize: 14 }));
  els.push(arrow(runRoute.x + runRoute.w / 2, runRoute.y + runRoute.h, gen.x + gen.w / 2, gen.y));

  // Layer 5: Sub-agents
  const SUB_Y = 760;
  const harvest = { x: 100, y: SUB_Y, w: 220, h: BH };
  const narrator = { x: 370, y: SUB_Y, w: 250, h: BH };
  const imageAg = { x: 680, y: SUB_Y, w: 260, h: BH };

  els.push(...boxLabel(harvest.x, harvest.y, harvest.w, harvest.h, "Harvest tool\n(GitHub GraphQL)", {
    bg: P.nodeBlue, stroke: P.stroke, round: true,
  }, { fontSize: 12 }));

  els.push(...boxLabel(narrator.x, narrator.y, narrator.w, narrator.h, "Narrator\n(LLM provider:\nGemini / OpenAI / Anthropic)", {
    bg: P.nodeBlue, stroke: P.stroke, round: true,
  }, { fontSize: 11 }));

  els.push(...boxLabel(imageAg.x, imageAg.y, imageAg.w, imageAg.h, "Image agent\n(Nano Banana +\nresvg stats card)", {
    bg: P.nodeBlue, stroke: P.stroke, round: true,
  }, { fontSize: 12 }));

  els.push(arrow(gen.x + gen.w / 2, gen.y + gen.h, harvest.x + harvest.w / 2, harvest.y));
  els.push(arrow(gen.x + gen.w / 2, gen.y + gen.h, narrator.x + narrator.w / 2, narrator.y));
  els.push(arrow(gen.x + gen.w / 2, gen.y + gen.h, imageAg.x + imageAg.w / 2, imageAg.y));

  // Run store
  const store = { x: 340, y: 900, w: 310, h: BH };
  els.push(...boxLabel(store.x, store.y, store.w, store.h, "Run store\n(.devnotion-runs.json)\nstatus: preview", {
    bg: P.neutral, stroke: "#555", round: true,
  }, { fontSize: 12 }));

  // gen result → store
  els.push(arrow(gen.x + gen.w / 2, gen.y + gen.h, store.x + store.w / 2, store.y));

  // /preview approve → POST /publish
  const publish = { x: 580, y: ROUTE_Y + BH + 40, w: 200, h: BH };
  els.push(...boxLabel(publish.x, publish.y, publish.w, publish.h, "POST /publish", {
    bg: P.neutral, stroke: P.stroke, round: true,
  }, { fontSize: 14 }));
  els.push(arrow(preview.x + preview.w / 2, preview.y + preview.h, publish.x + publish.w / 2, publish.y));

  // POST /publish → publishBlog()
  const publishBlog = { x: 850, y: 340, w: 180, h: BH };
  els.push(...boxLabel(publishBlog.x, publishBlog.y, publishBlog.w, publishBlog.h, "publishBlog()", {
    bg: P.nodeBlue, stroke: "#1971c2", round: true,
  }, { fontSize: 14 }));
  els.push(arrow(publish.x + publish.w, publish.y + publish.h / 2, publishBlog.x, publishBlog.y + publishBlog.h / 2));

  // publishBlog → targets
  const TARGET_Y_START = 200;
  const notion = { x: 1090, y: TARGET_Y_START, w: 160, h: 60 };
  const devto = { x: 1090, y: TARGET_Y_START + 80, w: 160, h: 60 };
  const hashnode = { x: 1090, y: TARGET_Y_START + 160, w: 160, h: 60 };

  els.push(...boxLabel(notion.x, notion.y, notion.w, notion.h, "Notion API", {
    bg: P.success, stroke: "#37b24d", round: true,
  }, { fontSize: 13 }));
  els.push(...boxLabel(devto.x, devto.y, devto.w, devto.h, "DEV.to API", {
    bg: P.success, stroke: "#37b24d", round: true,
  }, { fontSize: 13 }));
  els.push(...boxLabel(hashnode.x, hashnode.y, hashnode.w, hashnode.h, "Hashnode GraphQL", {
    bg: P.success, stroke: "#37b24d", round: true,
  }, { fontSize: 12 }));

  els.push(arrow(publishBlog.x + publishBlog.w, publishBlog.y + publishBlog.h / 2, notion.x, notion.y + notion.h / 2));
  els.push(arrow(publishBlog.x + publishBlog.w, publishBlog.y + publishBlog.h / 2, devto.x, devto.y + devto.h / 2));
  els.push(arrow(publishBlog.x + publishBlog.w, publishBlog.y + publishBlog.h / 2, hashnode.x, hashnode.y + hashnode.h / 2));

  return els;
}

// ═════════════════════════════════════════════
// 3. updates-roadmap.excalidraw
// ═════════════════════════════════════════════
function buildRoadmap() {
  const els = [];

  // Title
  els.push(
    textEl(20, 10, 1000, 50, "DevNotion — v1 → v2 → v2.1", {
      fontSize: 28,
      stroke: P.accentStroke,
      align: "left",
    })
  );

  const COL_W = 280;
  const COL_H = 420;
  const GAP = 80;
  const Y = 80;

  const cols = [
    {
      x: 60,
      y: Y,
      label:
        "v1\n(Notion MCP Challenge — won $500)\n\n• Gemini only\n• Notion + DEV.to\n• headless cron\n• silent fallback could\n  publish a stub",
      bg: P.neutral,
      stroke: P.stroke,
      isAccent: false,
    },
    {
      x: 60 + COL_W + GAP,
      y: Y,
      label:
        "v2\n(Finish-Up-A-Thon — 7 phases)\n\n• multi-LLM (Gemini 3 /\n  OpenAI / Anthropic)\n• fail-loud narration\n• generate → approve → publish gate\n• diff-enriched harvest\n• author/social footer\n• AI cover + deterministic\n  stats card\n• Swiss dashboard\n• 43 tests",
      bg: P.accentFill,
      stroke: P.accentStroke,
      isAccent: true,
    },
    {
      x: 60 + (COL_W + GAP) * 2,
      y: Y,
      label:
        "v2.1\n\n• real Mastra image-agent\n  (4 agents)\n• per-run + multi-select\n  delete\n• public landing page\n• Swiss redesign polish",
      bg: P.nodeBlue,
      stroke: "#1971c2",
      isAccent: false,
    },
  ];

  for (const c of cols) {
    els.push(
      rect(c.x, c.y, COL_W, COL_H, {
        bg: c.bg,
        stroke: c.stroke,
        round: true,
        strokeWidth: c.isAccent ? 3 : 2,
      })
    );
    els.push(
      textEl(c.x + 16, c.y + 16, COL_W - 32, COL_H - 32, c.label, {
        fontSize: 14,
        stroke: c.isAccent ? P.accentStroke : P.stroke,
        align: "left",
        fontFamily: 2,
      })
    );
  }

  // Arrows between columns
  for (let i = 0; i < cols.length - 1; i++) {
    const a = cols[i];
    const b = cols[i + 1];
    const midY = Y + COL_H / 2;
    els.push(
      arrow(a.x + COL_W, midY, b.x, midY, {
        stroke: P.accentStroke,
      })
    );
  }

  return els;
}

// ═════════════════════════════════════════════
// 4. feature-comparison.excalidraw
// ═════════════════════════════════════════════
function buildFeatureComparison() {
  const els = [];

  // Title
  els.push(
    textEl(20, 10, 900, 50, "v1 vs v2 — Feature Comparison", {
      fontSize: 28,
      stroke: P.accentStroke,
      align: "left",
    })
  );

  const rows = [
    ["Feature", "v1", "v2"],
    ["LLMs", "Gemini only", "Gemini · OpenAI · Anthropic"],
    ["Publish targets", "Notion + DEV.to", "+ Hashnode"],
    ["Flow", "instant publish", "generate → approve → publish"],
    ["UI", "none (CLI/cron)", "Swiss dashboard + landing"],
    ["Images", "none", "AI cover + deterministic stats card"],
    ["Harvest", "PR-only line stats", "per-commit deltas + touched areas"],
    ["Failure mode", "silent fallback stub", "fail-loud (publishes nothing)"],
    ["Setup", "manual .env", "npx devnotion init"],
    ["Tests", "a handful", "43 across 17 suites"],
  ];

  const COL_WIDTHS = [240, 240, 340];
  const ROW_H = 60;
  const START_X = 40;
  const START_Y = 80;

  for (let r = 0; r < rows.length; r++) {
    let cx = START_X;
    const y = START_Y + r * ROW_H;
    const isHeader = r === 0;

    for (let c = 0; c < 3; c++) {
      const cw = COL_WIDTHS[c];
      const cellText = rows[r][c];

      let bg;
      let stroke = P.stroke;
      let textStroke = P.stroke;
      let align = "center";

      if (isHeader) {
        bg = P.accentFill;
        stroke = P.accentStroke;
        textStroke = P.accentStroke;
      } else if (c === 0) {
        bg = P.neutral;
        align = "left";
      } else if (c === 1) {
        bg = P.neutral;
      } else {
        // v2 column — light blue
        bg = P.nodeBlue;
        stroke = "#74c0fc";
      }

      els.push(rect(cx, y, cw, ROW_H, { bg, stroke, round: false }));
      els.push(
        textEl(
          c === 0 ? cx + 8 : cx + 4,
          y + 4,
          c === 0 ? cw - 12 : cw - 8,
          ROW_H - 8,
          cellText,
          {
            fontSize: isHeader ? 16 : 13,
            stroke: textStroke,
            align,
            fontFamily: 2,
          }
        )
      );

      cx += cw;
    }
  }

  return els;
}

// ─────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────
writeExcalidraw("architecture.excalidraw", buildArchitecture());
writeExcalidraw("system-design.excalidraw", buildSystemDesign());
writeExcalidraw("updates-roadmap.excalidraw", buildRoadmap());
writeExcalidraw("feature-comparison.excalidraw", buildFeatureComparison());

console.log("\nAll 4 diagrams generated successfully.");
