**TECHNICAL ARCHITECTURE & SENIOR DEVELOPER GUIDE**

**GitPulse**

*3-Agent GitHub → Blog \+ Diagram → Notion Pipeline*

| Framework Mastra | LLM Provider Groq llama-3.3-70b | Diagrams Excalidraw MCP | Publishing Notion MCP |
| :---: | :---: | :---: | :---: |

TypeScript 5.4  ·  Node.js 22 LTS  ·  pnpm workspaces  ·  MIT License

# **Table of Contents**

| CH.1 Technology Stack *Every dependency, why it exists, and how it connects* |
| :---- |

# **1.1  Stack at a Glance**

| Layer | Technology \+ Rationale |
| :---- | :---- |
| **Agent Framework** | Mastra @latest — TypeScript-native, built-in MCPClient, model-agnostic (uses AI SDK), durable workflows, Studio UI for dev |
| **LLM Provider** | @ai-sdk/groq \+ groq/llama-3.3-70b-versatile — fastest open model for text generation. Blog post in \<2s. Free tier generous. String syntax: 'groq/llama-3.3-70b-versatile'. |
| **GitHub Data** | Custom GraphQL tool against api.github.com/graphql — contributionsCollection, pullRequestContributions, commitContributionsByRepository |
| **Diagram Generation** | Excalidraw MCP (yctimlin/mcp\_excalidraw) via Docker — 26 tools: batch\_create\_elements, export\_to\_image, set\_viewport, describe\_scene |
| **Notion Integration** | @notionhq/client \+ Notion Remote MCP (mcp.notion.com/mcp) — MCP for page CRUD, direct REST for Markdown Content API |
| **Scheduling** | node-cron — weekly Sunday 08:00 trigger, manual \--now flag for demo |
| **Validation** | Zod 3.x — all GitHub API responses, Groq outputs, and Notion page IDs validated before use |
| **Rate limiting** | p-queue (Notion 3 req/s) \+ p-retry (3 attempts, exponential backoff) |
| **Logging** | Winston — JSON structured, writes run summaries to Notion Mission Control page |
| **Testing** | Vitest \+ msw@2 — unit tests for pure logic, MSW mocks for GitHub \+ Notion API calls |

# **1.2  Why Groq Instead of Claude for the LLM**

| 🧑‍💻 | Groq inference runs llama-3.3-70b-versatile at \~750 tokens/second — generating an 800-word blog post in under 2 seconds. This makes the demo video dramatically more impressive (you watch the text appear) and keeps costs near zero for a hackathon. In Mastra, switching between providers is a one-line change: model: 'groq/llama-3.3-70b-versatile'. This is also originality points — most submissions use Claude or GPT. |
| :---: | :---- |

## **Groq Model Selection Guide**

| Model | Speed / Cost | Use for GitPulse |
| :---- | :---- | :---- |
| **llama-3.3-70b-versatile** | Fast, free tier, 128k ctx | ✅ PRIMARY — blog writing, commit narrative, PR summaries |
| **deepseek-r1-distill-llama-70b** | Moderate, reasoning-heavy | Optional: complex code analysis reasoning tasks |
| **llama-3.1-8b-instant** | Fastest, smallest | Optional: quick classification (is this PR a feature or bugfix?) |
| **qwen/qwen3-32b** | New (2026), multilingual | Optional: non-English blog generation |

# **1.3  Full Dependency Manifest**

## **Production**

| Package (pinned) | Role |
| :---- | :---- |
| **mastra@^0.10.0** | Core agent/workflow/memory runtime |
| **@mastra/mcp@^0.10.0** | MCPClient for connecting to MCP servers (Notion, Excalidraw) |
| **@ai-sdk/groq@^1.2.0** | Vercel AI SDK Groq adapter — native support added March 2026 |
| **@notionhq/client@^2.3.0** | Notion REST client — direct REST for markdown API alongside MCP |
| **@modelcontextprotocol/sdk@^1.9.0** | MCP TypeScript SDK — pin at v1.x, do NOT use v2 beta |
| **graphql-request@^6.1.0** | Lightweight GraphQL client for GitHub API calls |
| **zod@^3.25.0** | Schema validation — v3 not v4 (breaking changes in v4) |
| **node-cron@^3.0.3** | Cron scheduler for weekly runs |
| **p-queue@^8.0.1** | Rate limiter — Notion 3 req/sec enforcement |
| **p-retry@^6.2.1** | Retry with exponential backoff for all external API calls |
| **winston@^3.11.0** | Structured JSON logging |
| **dotenv@^16.4.1** | Env var loading |
| **tsx@^4.7.0** | TypeScript executor (dev) — run .ts without compiling |

## **Development**

| Package | Role |
| :---- | :---- |
| **typescript@^5.4.0** | Compiler — strict mode, no compromises |
| **vitest@^1.6.0** | Test runner — native ESM, faster than Jest |
| **msw@^2.3.0** | API mocking — intercept GitHub \+ Notion in tests without live calls |
| **eslint@^9 \+ @typescript-eslint** | Linting — explicit return types, no unused vars |
| **prettier@^3.2.5** | Formatting |
| **husky \+ lint-staged** | Pre-commit hooks |
| **tsup@^8.0.2** | Build bundler for production output |

| CH.2 Repository Structure *Where every file lives and why* |
| :---- |

# **2.1  Project Tree**

| 🧑‍💻 | Keep this project flat — NOT a monorepo. GitPulse is a single-purpose tool. A monorepo adds workspace complexity with zero benefit here. One package.json, one tsconfig.json, one src/ folder. Ship clean. |
| :---: | :---- |

| gitpulse/ ├── src/ │   ├── agents/ │   │   ├── github-harvest.agent.ts    \# Agent 1: fetches GitHub data │   │   ├── narrator.agent.ts           \# Agent 2: writes blog \+ diagram spec │   │   └── publisher.agent.ts          \# Agent 3: Excalidraw \+ Notion │   ├── tools/ │   │   ├── github.tool.ts              \# GraphQL queries to GitHub API │   │   ├── excalidraw-mcp.tool.ts      \# Connects to Excalidraw MCP server │   │   ├── notion-mcp.tool.ts          \# Connects to Notion Remote MCP │   │   └── notion-rest.tool.ts         \# Direct REST: Markdown Content API │   ├── workflows/ │   │   └── weekly-dispatch.workflow.ts \# Orchestrates all 3 agents in sequence │   ├── types/ │   │   ├── github.types.ts             \# Zod schemas \+ inferred TS types │   │   ├── blog.types.ts               \# Blog post \+ diagram spec types │   │   └── notion.types.ts             \# Notion DB row shapes │   ├── config/ │   │   └── env.ts                      \# Zod env validation — fail fast │   ├── mastra.ts                       \# Single Mastra instance │   └── index.ts                        \# Entry: \--week flag \+ cron init ├── tests/ │   ├── unit/                           \# Pure logic tests (no I/O) │   ├── integration/                    \# MSW-mocked API tests │   └── fixtures/                       \# Sample GitHub GraphQL responses ├── docker-compose.yml                  \# Starts Excalidraw MCP canvas server ├── .env.example                        \# Template — all required vars documented ├── .env.local                          \# gitignored — never commit ├── tsconfig.json                       \# strict: true \+ nodeNext └── package.json |
| :---- |

# **2.2  Environment Variables (.env.example)**

| \# .env.example — copy to .env.local, fill in values \# GitHub — Personal Access Token (read:user, repo scope) GITHUB\_TOKEN=ghp\_your\_token\_here GITHUB\_USERNAME=your\_github\_username \# Groq — free at console.groq.com GROQ\_API\_KEY=gsk\_your\_key\_here \# Notion — Internal Integration Token (read \+ write content) NOTION\_TOKEN=ntn\_your\_token\_here NOTION\_PARENT\_PAGE\_ID=your\_notion\_page\_uuid \# Excalidraw MCP canvas — started via docker-compose EXCALIDRAW\_CANVAS\_URL=http://localhost:3000    \# default docker port \# Optional: override default behavior BLOG\_TONE=professional          \# or: casual, technical, storytelling AUTO\_PUBLISH=true               \# false \= create page but don't make public DIAGRAM\_STYLE=sketch            \# or: clean, minimal LOG\_LEVEL=info                  \# debug|info|warn|error |
| :---- |

| ⚠️ | GITHUB\_TOKEN must have 'read:user' and 'repo' scopes to access contribution data including private repos. Without 'repo' scope, private contributions are invisible. Document this in the README — it's the \#1 setup issue. |
| :---: | :---- |

| CH.3 Agent Implementations *Full annotated code for all three agents* |
| :---- |

# **3.1  Mastra Instance (src/mastra.ts)**

| // src/mastra.ts — one instance, imported everywhere import { Mastra } from '@mastra/core'; import { githubHarvestAgent } from './agents/github-harvest.agent.js'; import { narratorAgent } from './agents/narrator.agent.js'; import { publisherAgent } from './agents/publisher.agent.js'; import { weeklyDispatchWorkflow } from './workflows/weekly-dispatch.workflow.js'; export const mastra \= new Mastra({   agents: { githubHarvestAgent, narratorAgent, publisherAgent },   workflows: { weeklyDispatchWorkflow },   logger: { type: 'WINSTON', level: process.env.LOG\_LEVEL ?? 'info' }, }); |
| :---- |

# **3.2  Agent 1: GithubHarvestAgent**

The Harvester uses a custom Mastra tool that wraps the GitHub GraphQL API. It does NOT use an LLM for the harvest itself — it's a pure data fetch. The LLM only appears in Agent 2\.

| 🧑‍💻 | This is a deliberate design choice: mixing data collection with LLM generation in the same agent step creates messy prompts and unreliable structured outputs. Keep the Harvester as a pure data pipeline: fetch, validate with Zod, return typed object. The LLM never sees the raw JSON — it sees a clean, formatted data payload. |
| :---: | :---- |

| // src/agents/github-harvest.agent.ts import { Agent } from '@mastra/core/agent'; import { createTool } from '@mastra/core/tools'; import { z } from 'zod'; import { fetchWeeklyContributions } from '../tools/github.tool.js'; // Output schema — everything downstream depends on this contract export const WeeklyDataSchema \= z.object({   weekStart:    z.string(),          // ISO date   weekEnd:      z.string(),   totalCommits: z.number(),   totalPRs:     z.number(),   totalAdditions: z.number(),   totalDeletions: z.number(),   repos: z.array(z.object({     name: z.string(), url: z.string(),     commits: z.number(), additions: z.number(), deletions: z.number(),     language: z.string().optional(),   })),   pullRequests: z.array(z.object({     title: z.string(), url: z.string(),     repo: z.string(), state: z.enum(\['OPEN','MERGED','CLOSED'\]),     additions: z.number(), deletions: z.number(),     mergedAt: z.string().nullable(),   })),   languages: z.record(z.string(), z.number()), // name → byte count   reviewsGiven: z.number(),   streakDays: z.number(), }); export type WeeklyData \= z.infer\<typeof WeeklyDataSchema\>; const fetchGithubTool \= createTool({   id: 'fetch-github-week',   description: 'Fetch all GitHub contributions for a specific week',   inputSchema: z.object({     weekStart: z.string().describe('ISO date: YYYY-MM-DD, must be a Monday'),   }),   outputSchema: WeeklyDataSchema,   execute: async ({ context }) \=\> {     const raw \= await fetchWeeklyContributions(context.weekStart);     // Zod parse throws with clear message if GitHub changes their schema     return WeeklyDataSchema.parse(raw);   }, }); // NOTE: This agent uses NO LLM model. maxSteps: 1\. // It's purely a data fetch \+ validation step. export const githubHarvestAgent \= new Agent({   name: 'github-harvest-agent',   model: 'groq/llama-3.1-8b-instant',   // cheapest model, just for tool dispatch   instructions: 'Call the fetch-github-week tool with the provided weekStart date. Return the raw result.',   tools: { fetchGithubTool },   maxSteps: 1,  // no reasoning loop needed — single tool call }); |
| :---- |

# **3.3  The GitHub GraphQL Query (tools/github.tool.ts)**

This is the most important technical piece to get right. The contributionsCollection query fetches everything in a single round trip.

| // src/tools/github.tool.ts import { GraphQLClient, gql } from 'graphql-request'; import { env } from '../config/env.js'; const client \= new GraphQLClient('https://api.github.com/graphql', {   headers: { Authorization: \`bearer ${env.GITHUB\_TOKEN}\` }, }); const WEEKLY\_CONTRIBUTIONS\_QUERY \= gql\`   query WeeklyContributions($username: String\!, $from: DateTime\!, $to: DateTime\!) {     user(login: $username) {       contributionsCollection(from: $from, to: $to) {         totalCommitContributions         totalPullRequestContributions         totalPullRequestReviewContributions         contributionCalendar {           totalContributions           weeks { contributionDays { date contributionCount } }         }         commitContributionsByRepository {           repository { name url primaryLanguage { name } }           contributions { totalCount }         }         pullRequestContributions(last: 20\) {           nodes {             pullRequest {               title url state mergedAt               additions deletions changedFiles               repository { name url }             }           }         }       }       repositories(first: 100, orderBy: { field: PUSHED\_AT, direction: DESC }) {         nodes {           name url           languages(first: 5, orderBy: { field: SIZE, direction: DESC }) {             edges { size node { name color } }           }         }       }     }   } \`; export async function fetchWeeklyContributions(weekStart: string) {   const from \= new Date(weekStart);   const to   \= new Date(from); to.setDate(from.getDate() \+ 7);   const data \= await client.request(WEEKLY\_CONTRIBUTIONS\_QUERY, {     username: env.GITHUB\_USERNAME,     from: from.toISOString(),     to: to.toISOString(),   });   return transformGitHubResponse(data);  // normalize → WeeklyData shape } |
| :---- |

# **3.4  Agent 2: NarratorAgent**

This is where Groq earns its place. The Narrator receives the typed WeeklyData and produces two outputs: a blog post markdown string AND an Excalidraw element spec array. Structuring both into one agent call is the efficiency win.

| 🧑‍💻 | Use structured output (outputSchema with Zod) for the Narrator. A freeform text response requires parsing. A Zod-validated structured output guarantees the blog markdown is in blog.content and the diagram spec is in diagram.elements — no parsing logic, no brittle regex, no surprises at 2am before the deadline. |
| :---: | :---- |

| // src/agents/narrator.agent.ts import { Agent } from '@mastra/core/agent'; import { z } from 'zod'; // Excalidraw element spec — what PublisherAgent will create on the canvas const ExcalidrawElementSchema \= z.object({   type: z.enum(\['rectangle', 'arrow', 'text', 'ellipse'\]),   x: z.number(), y: z.number(),   width: z.number(), height: z.number(),   label: z.string().optional(),   strokeColor: z.string().optional(),   backgroundColor: z.string().optional(),   points: z.array(z.tuple(\[z.number(), z.number()\])).optional(), // for arrows }); export const NarratorOutputSchema \= z.object({   blog: z.object({     headline: z.string().max(80),        // The blog title     tldr: z.string().max(200),            // 3-sentence summary     content: z.string(),                  // Full markdown body     tags: z.array(z.string()).max(5),     // Topic tags for Notion     readingTimeMinutes: z.number(),   }),   diagram: z.object({     title: z.string(),     elements: z.array(ExcalidrawElementSchema),   }), }); export const narratorAgent \= new Agent({   name: 'narrator-agent',   model: 'groq/llama-3.3-70b-versatile',  // main blog writer   instructions: \`You receive structured GitHub contribution data for one week.     Your job: return a JSON object with two keys: blog and diagram.     Blog: write a genuine developer blog post in markdown. Be specific.     Mention real repo names, real PR titles, real line counts.     Diagram: generate Excalidraw elements. Each repo \= rectangle.     Each PR \= arrow between repos (or from repo to 'Production' box).     Space repos horizontally, arrows flow left-to-right.     Use colors: \#a5d8ff for repos, \#b2f2bb for merged PRs, \#ffd43b for open PRs.\`,   maxSteps: 3,   // Structured output — guaranteed valid JSON matching NarratorOutputSchema   // Mastra passes this to AI SDK's generateObject() under the hood   outputSchema: NarratorOutputSchema, }); |
| :---- |

# **3.5  Agent 3: PublisherAgent**

The Publisher connects to both Excalidraw MCP and Notion MCP. It receives the NarratorOutput and executes three steps: draw the diagram, write the blog to Notion, update the database.

| // src/agents/publisher.agent.ts import { Agent } from '@mastra/core/agent'; import { MCPClient } from '@mastra/mcp'; import { notionRestTool } from '../tools/notion-rest.tool.js'; // Excalidraw MCP — connects to local Docker canvas server const excalidrawMCP \= new MCPClient({   name: 'excalidraw-canvas',   // yctimlin/mcp\_excalidraw running via docker-compose   serverUrl: process.env.EXCALIDRAW\_CANVAS\_URL ?? 'http://localhost:3000', }); // Notion Remote MCP — OAuth-authenticated hosted server const notionMCP \= new MCPClient({   name: 'notion-workspace',   serverUrl: 'https://mcp.notion.com/mcp',   requestInit: { headers: { Authorization: \`Bearer ${process.env.NOTION\_TOKEN}\` } }, }); const \[excalidrawTools, notionTools\] \= await Promise.all(\[   excalidrawMCP.getTools(),   notionMCP.getTools(), \]); export const publisherAgent \= new Agent({   name: 'publisher-agent',   model: 'groq/llama-3.3-70b-versatile',   instructions: \`You receive a blog post and a diagram element spec.     Step 1: Clear the Excalidraw canvas (clear\_canvas tool).     Step 2: Call batch\_create\_elements with the diagram.elements array.     Step 3: Call set\_viewport with scrollToContent: true to fit the diagram.     Step 4: Call export\_to\_excalidraw\_url to get a shareable URL.     Step 5: Call notion-create-page to create the blog post page.     Step 6: Call PATCH markdown API with the blog markdown \+ diagram URL.     Step 7: Call notion-create-data-source-item to log to Weekly Dispatch DB.     Step 8: If AUTO\_PUBLISH=true, call notion-update-page to make it public.\`,   tools: { ...excalidrawTools, ...notionTools, notionMarkdownPatch: notionRestTool },   maxSteps: 12,  // 8 defined steps \+ some retry headroom }); |
| :---- |

| CH.4 The Weekly Dispatch Workflow *Orchestrating all three agents in sequence* |
| :---- |

# **4.1  Workflow Implementation**

The workflow is the glue. It runs the three agents in sequence, passes typed data between them, handles errors at each step, and writes the outcome to Notion.

| // src/workflows/weekly-dispatch.workflow.ts import { createWorkflow, createStep } from '@mastra/core/workflows'; import { z } from 'zod'; import { WeeklyDataSchema } from '../agents/github-harvest.agent.js'; import { NarratorOutputSchema } from '../agents/narrator.agent.js'; // Step 1: Harvest GitHub data const harvestStep \= createStep({   id: 'harvest-github',   inputSchema: z.object({ weekStart: z.string() }),   outputSchema: WeeklyDataSchema,   execute: async ({ context, mastra }) \=\> {     const agent \= mastra.getAgent('githubHarvestAgent');     const result \= await agent.generate(\`Fetch GitHub data for week ${context.weekStart}\`);     return WeeklyDataSchema.parse(result.toolResults\[0\]?.result);   }, }); // Step 2: Generate blog \+ diagram spec const narrateStep \= createStep({   id: 'narrate',   inputSchema: WeeklyDataSchema,   outputSchema: NarratorOutputSchema,   execute: async ({ context, mastra }) \=\> {     const agent \= mastra.getAgent('narratorAgent');     const result \= await agent.generate(JSON.stringify(context), {       output: NarratorOutputSchema,  // structured output mode     });     return result.object;  // Mastra gives us the typed object directly   }, }); // Step 3: Publish to Excalidraw \+ Notion const publishStep \= createStep({   id: 'publish',   inputSchema: NarratorOutputSchema,   outputSchema: z.object({ notionPageUrl: z.string(), diagramUrl: z.string() }),   execute: async ({ context, mastra }) \=\> {     const agent \= mastra.getAgent('publisherAgent');     const result \= await agent.generate(JSON.stringify(context));     return { notionPageUrl: result.notionPageUrl, diagramUrl: result.diagramUrl };   }, }); export const weeklyDispatchWorkflow \= createWorkflow({   id: 'weekly-dispatch',   inputSchema: z.object({ weekStart: z.string() }),   steps: \[harvestStep, narrateStep, publishStep\], }) .then(harvestStep)    // GitHub data .then(narrateStep)    // Blog \+ diagram spec .then(publishStep);   // Excalidraw \+ Notion |
| :---- |

# **4.2  Entry Point (src/index.ts)**

| // src/index.ts — run manually or via cron import { mastra } from './mastra.js'; import cron from 'node-cron'; import { getLastMonday } from './utils/dates.js'; async function runWeeklyDispatch(weekStart?: string) {   const week \= weekStart ?? getLastMonday();   console.log(\`🌾 Starting GitPulse for week of ${week}...\`);   const workflow \= mastra.getWorkflow('weeklyDispatchWorkflow');   const run \= await workflow.createRun({ inputData: { weekStart: week } });   const result \= await run.start();   console.log(\`✅ Published: ${result.notionPageUrl}\`);   console.log(\`🎨 Diagram: ${result.diagramUrl}\`); } // Manual run: node src/index.ts \--week 2026-03-16 const weekArg \= process.argv.find(a \=\> a.startsWith('--week='))?.split('=')\[1\]; if (weekArg || process.argv.includes('--now')) {   runWeeklyDispatch(weekArg).catch(console.error); } else {   // Weekly cron: every Sunday at 08:00 local time   cron.schedule('0 8 \* \* 0', () \=\> runWeeklyDispatch());   console.log('⏰ GitPulse cron started. Runs every Sunday at 08:00.'); } |
| :---- |

| CH.5 Excalidraw Diagram Deep Dive *How the diagram generation pipeline works end-to-end* |
| :---- |

# **5.1  Two Excalidraw MCP Options**

| MCP Server | Best for GitPulse |
| :---- | :---- |
| **yctimlin/mcp\_excalidraw (Docker)** | ✅ RECOMMENDED — 26 tools including batch\_create\_elements, export\_to\_image, export\_to\_excalidraw\_url. Requires Docker but works headlessly. The agent can also call describe\_scene and get\_canvas\_screenshot to verify what it drew. |
| **excalidraw/excalidraw-mcp (official)** | Alternative — simpler, cloud-hosted, great for inline renders in Claude.ai. Fewer tools for agent iteration. Good for demo simplicity but less control. |
| **@cmd8/excalidraw-mcp (npx)** | Alternative — file-based, no server needed. Persists to a local .excalidraw file. Simplest setup for judging reproducibility. |

| 💡 | For the demo video, use yctimlin for the live canvas visual — watching rectangles and arrows appear in a browser window is the most impressive visual in the whole pipeline. For the public Notion embed, export\_to\_excalidraw\_url gives you a shareable link anyone can open. |
| :---: | :---- |

# **5.2  Diagram Layout Rules (for NarratorAgent prompt)**

Encode these rules in the NarratorAgent instructions so the diagram is always readable:

| Rule | Implementation |
| :---- | :---- |
| **One box per repo** | rectangle, width 160, height 80, label \= repo short name, fill \#a5d8ff |
| **Repos spaced horizontally** | x increments by 220px per repo. All y \= 200 (single row for ≤5 repos) |
| **PR as arrow** | arrow from source repo box to target repo box (or to 'Production' box) |
| **PR color by state** | MERGED \= \#b2f2bb, OPEN \= \#ffd43b, CLOSED \= \#ff8787 |
| **Language label** | text element above each repo box, font-size 12, color \#495057 |
| **Title** | text element at top-center, font-size 20, bold |
| **Metrics footer** | text at bottom: 'X commits · Y PRs · Z additions / W deletions' |

# **5.3  Docker Setup for Excalidraw MCP**

| \# docker-compose.yml — run: docker compose up \-d version: '3.8' services:   excalidraw-canvas:     image: ghcr.io/yctimlin/mcp\_excalidraw-canvas:latest     ports:       \- '3000:3000'     environment:       \- NODE\_ENV=production     restart: unless-stopped     healthcheck:       test: \['CMD', 'curl', '-f', 'http://localhost:3000/health'\]       interval: 10s       retries: 3 |
| :---- |

| \# Start everything in 2 commands: docker compose up \-d                        \# starts Excalidraw canvas on :3000 node src/index.ts \--week 2026-03-16         \# runs full pipeline for that week \# Or run with tsx in dev: npx tsx src/index.ts \--now                  \# triggers for current week |
| :---- |

| CH.6 Senior Developer Notes *The patterns, tradeoffs, and rules that make this production-quality* |
| :---- |

# **6.1  The Cardinal Rules (Applied to GitPulse)**

| 1️⃣ | Fail at startup, not at runtime. The env.ts validates all 5 required env vars using Zod before any agent runs. If NOTION\_TOKEN is missing, you get a clear error in \<100ms — not a 401 after 20 seconds of workflow execution. |
| :---: | :---- |

| 2️⃣ | Zod everything that crosses a boundary. GitHub GraphQL response → Zod. Groq structured output → Zod. Notion page ID back from MCP → Zod. One changed field in GitHub's API can silently corrupt your entire pipeline without validation. |
| :---: | :---- |

| 3️⃣ | The Harvester has no LLM. Using llama-3.1-8b-instant just for tool dispatch is intentional and important. If the model hallucinated a repo name or a commit count, it would corrupt everything downstream. Data fetching is not an LLM task. |
| :---: | :---- |

| 4️⃣ | Use Groq's structured output mode (outputSchema) for the Narrator. Never parse LLM text with regex. If the LLM output doesn't match your schema, Groq returns a validation error — you catch it cleanly and retry, not corrupt Notion with partial data. |
| :---: | :---- |

| 5️⃣ | The Excalidraw canvas is stateful. Always call clear\_canvas before batch\_create\_elements. If a previous failed run left elements on the canvas, your new diagram will overlap them. Clear first, always. |
| :---: | :---- |

| 6️⃣ | Make the Notion page creation idempotent. Before creating a new page, call notion-search for 'Week of {weekStart}' in the parent page. If it exists, update it — don't create a duplicate. This prevents your cron from littering Notion with failed retries. |
| :---: | :---- |

| 7️⃣ | Rate limit awareness: GitHub GraphQL API has a 5000 points/hour limit. The contributionsCollection query costs \~7-10 points per call. You have headroom. Notion MCP is 3 req/sec — wrap all calls with p-queue. Excalidraw MCP is local Docker — no rate limit. |
| :---: | :---- |

| 8️⃣ | The public Notion URL is your single most important deliverable. Test this before the submission deadline. Notion's 'Publish to web' toggle creates a public page at notion.so/your-page-id. Confirm the URL works in incognito mode. |
| :---: | :---- |

# **6.2  Testing Strategy**

| Layer | What to test | How |
| :---- | :---- | :---- |
| **Unit: transformGitHubResponse()** | Takes raw GraphQL JSON → returns WeeklyData shape. Test edge cases: 0 PRs, missing language, private repo. | Vitest with fixture JSON files in tests/fixtures/ |
| **Unit: diagram layout algorithm** | Given N repos, are x/y positions correct? Do arrows point at correct boxes? | Pure function test — no API, fast |
| **Integration: full harvest mock** | Mock GitHub GraphQL endpoint with MSW. Assert WeeklyDataSchema.parse() succeeds on all fixture variants. | Vitest \+ msw handlers |
| **Integration: Notion MCP mock** | Mock notion-create-page, notion-update-page. Assert correct page structure and markdown content format. | Vitest \+ msw |
| **Manual smoke** | Real GitHub token, real Notion workspace (sandbox account), verify full pipeline end-to-end before demo day. | Run: npx tsx src/index.ts \--week 2026-03-10 |

# **6.3  Error Handling Map**

| Error Type | Where it occurs | Handling |
| :---- | :---- | :---- |
| **GitHub 401** | github.tool.ts on all requests | Throw AuthError with message 'Check GITHUB\_TOKEN scope'. Process exits. |
| **GitHub rate limit (403)** | github.tool.ts | p-retry with 60s wait. GitHub rate limit resets hourly. |
| **Groq structured output invalid** | narrateStep in workflow | Catch Zod parse error, retry narratorAgent up to 2 times with clarified prompt. |
| **Excalidraw canvas unreachable** | publisher.agent.ts on MCPClient connect | Throw ConfigError: 'Is Docker running? Check EXCALIDRAW\_CANVAS\_URL'. Exit. |
| **Notion 429** | publisher.agent.ts | p-queue \+ p-retry handles automatically. Already rate-limited to 3 req/s. |
| **Week already published** | publishStep idempotency check | Log 'Week {date} already published. Use \--force to overwrite.' Exit cleanly. |

# **6.4  The README — What Judges See When They Click Your Repo**

Judges spend 30-90 seconds on your GitHub README. Structure it exactly like this:

1. Badge row: GitHub Actions CI badge, License badge, Made with Mastra badge

2. One-line description \+ public Notion demo link

3. Animated GIF of the pipeline running (12-second loop: terminal → Excalidraw → Notion)

4. Quick Start: 3 steps (git clone, cp .env.example .env.local, fill tokens, docker compose up \-d && npx tsx src/index.ts \--now)

5. Architecture diagram (generated by GitPulse itself — mention this explicitly)

6. How It Works: 3-paragraph narrative matching the 3 agents

7. Configuration: table of all env vars with descriptions

8. Development: pnpm install, pnpm test, pnpm lint

9. License: MIT

| 🧑‍💻 | The README GIF is your best marketing material and takes 20 minutes to create. Record with OBS or Loom, trim to 12 seconds, convert to GIF with ffmpeg: ffmpeg \-i recording.mp4 \-vf 'fps=10,scale=800:-1' demo.gif. Add it to the repo root and link in README as \!\[\] (./demo.gif). Worth every minute. |
| :---: | :---- |

| CH.7 Pre-Submission Checklist *Every box must be checked before you hit Submit* |
| :---- |

# **Technical Checklist**

* docker compose up \-d starts Excalidraw canvas on :3000 without errors

* npx tsx src/index.ts \--now completes without errors against real accounts

* Public Notion URL loads in incognito browser — page is readable, diagram embedded

* Weekly Dispatch database has at least 2 entries (run pipeline for 2 separate weeks)

* GitHub repo is public, MIT licensed, has CI badge (passing)

* pnpm test passes — all unit and integration tests green

* README has demo GIF embedded

* .env.example is complete — every var documented

* No API keys in git history (check: git log \--all \--full-history \-- .env\*)

# **Article Checklist**

* Title is specific and benefit-focused

* All 4 required tags: \#devchallenge \#notionchallenge \#mcp \#ai

* Cover image designed and attached

* All 5 sections present: What I Built / Video Demo / Show Us The Code / How I Used Notion MCP / closing

* All 8 Notion MCP tool names listed exactly in 'How I Used Notion MCP'

* 4 code snippets with syntax highlighting

* 3-minute demo video uploaded and embedded

* Public Notion URL linked in article body (this is the 'click me' moment)

* The architecture diagram in the article was generated by GitPulse itself — note this explicitly

# **Post-Submission**

* Share on X: '@NotionHQ @DEV\_to I automated my developer blog with Groq \+ Excalidraw \+ Notion MCP. Here's the live result: \[public Notion URL\]. Article: \[DEV post URL\] \#notionchallenge'

* Reply to every comment on DEV post within 24 hours

* Star farm: share in Indie Hackers, relevant Discord servers for GitHub stars (helps if there's a tiebreaker)

*GitPulse Technical Architecture v1.0  ·  March 2026  ·  DEV.to × Notion MCP Challenge*

**You write code. GitPulse explains it. 🚀**