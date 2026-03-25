# DevNotion

A 3-agent [Mastra](https://mastra.ai) pipeline that transforms your weekly GitHub contributions into polished blog posts on Notion — fully automated.

Built for the [DEV.to x Notion MCP Challenge](https://dev.to/challenges/notion).

```
GitHub API  ──>  Harvest Agent  ──>  Narrator Agent  ──>  Publisher Agent  ──>  Notion Page
 (GraphQL)       (data fetch)        (AI blog writer)      (Notion API)
```

## What It Does

Every Sunday (or on-demand), DevNotion:

1. **Harvests** your GitHub activity via GraphQL — commits, PRs, issues, reviews, discussions, language stats, and contribution streak
2. **Narrates** the data into an engaging blog post using Gemini, with tone-aware writing (professional, casual, technical, or storytelling)
3. **Publishes** the post to Notion as a richly formatted markdown page

## Quick Start

### Prerequisites

- Node.js 20+
- pnpm
- GitHub personal access token (`ghp_` or `github_pat_`)
- Google AI Studio API key ([get one here](https://aistudio.google.com))
- Notion integration token + parent page ID ([setup guide](https://developers.notion.com/docs/create-a-notion-integration))

### Setup

```bash
git clone https://github.com/yashksaini-coder/DevNotion.git
cd DevNotion
pnpm install
```

Create `.env.local`:

```env
GITHUB_TOKEN=ghp_your_token
GITHUB_USERNAME=your_username
GOOGLE_GENERATIVE_AI_API_KEY=your_key
NOTION_TOKEN=ntn_your_token
NOTION_PARENT_PAGE_ID=your_page_id_or_url

# Optional
GEMINI_MODEL=gemini-2.5-flash    # utility agents (harvest, publisher)
NARRATOR_MODEL=gemini-2.5-pro   # narrator agent — best writing quality
BLOG_TONE=professional           # professional | casual | technical | storytelling
AUTO_PUBLISH=true
LOG_LEVEL=info
```

### Run

```bash
# Run once for the current week
pnpm dev

# Run for a specific week
pnpm dev -- --week=2026-03-18

# Start the cron scheduler (every Sunday 08:00)
pnpm start

# Open the Mastra playground (agent testing UI)
pnpm playground
```

## Architecture

```
src/
  agents/
    github-harvest.agent.ts   # Fetches GitHub data (no LLM needed)
    narrator.agent.ts          # AI blog writer with tone profiles
    publisher.agent.ts         # Notion page creator
  tools/
    github.tool.ts             # GitHub GraphQL queries
    notion-rest.tool.ts        # Notion REST + Markdown API
  types/
    github.types.ts            # Zod schemas for GitHub data
    blog.types.ts              # Zod schema for narrator output
  workflows/
    weekly-dispatch.workflow.ts # 3-step pipeline: harvest → narrate → publish
  config/
    env.ts                     # Environment validation
  utils/
    parse-llm-json.ts          # LLM JSON extraction with fallbacks
  mastra/
    index.ts                   # Mastra runtime registration
  index.ts                     # CLI entry point + cron
```

### Narrator Agent

The narrator is the core of DevNotion. It uses a tone-aware prompt system with four voice profiles and generates structured blog posts with:

- **Conditional sections** — empty sections are omitted entirely, not filled with "nothing this week"
- **Data-driven insights** — add/delete ratio analysis, streak celebration, review balance commentary
- **Anti-hallucination guardrails** — strict rules against inventing repos, approximating numbers, or fabricating activity
- **Engagement techniques** — hook openings, section transitions, developer empathy lines

### Narration Fallback Chain

The narrate step uses a 3-tier fallback:

1. **Structured output** — Gemini native JSON schema (45s timeout)
2. **Text parsing** — LLM text response → JSON extraction
3. **Deterministic fallback** — builds a basic post from raw data (zero LLM dependency)

This ensures a blog post is always generated, even if the LLM is unavailable.

## Model Selection

DevNotion uses two separate model configs — a powerful model for the narrator (writing quality matters) and a fast model for utility agents (harvest + publisher just call tools).

| Env Var | Default | Used By | Why |
|---------|---------|---------|-----|
| `NARRATOR_MODEL` | `gemini-2.5-pro` | Narrator agent | Best writing quality for long-form blog posts |
| `GEMINI_MODEL` | `gemini-2.5-flash` | Harvest + Publisher | Fast, cheap, only doing tool calls |

**For weekly runs, free tier is more than enough.** A single pipeline run uses 2-3 API calls. Even the lowest free tier (20 RPD) supports weekly use easily.

| Model | Free RPD | Best For |
|-------|----------|----------|
| `gemini-2.5-pro` | 50 | Highest writing quality (narrator default) |
| `gemini-2.5-flash` | 500 | Fast utility work (harvest/publisher default) |
| `gemini-2.0-flash` | 1,500 | Maximum quota if rate-limited |

## Blog Tone Profiles

Set `BLOG_TONE` in your `.env.local`:

| Tone | Style |
|------|-------|
| `professional` | Authoritative, metrics-forward, corporate-blog safe |
| `casual` | Conversational, emoji-friendly, dev-Twitter energy |
| `technical` | Dense, precise, code-centric |
| `storytelling` | Narrative arc, scene-setting, callbacks |

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Run pipeline once (current week) |
| `pnpm playground` | Open Mastra agent playground at localhost:4111 |
| `pnpm test` | Run test suite |
| `pnpm build` | Build for production |
| `pnpm start` | Start with cron scheduler |
| `pnpm lint` | Lint source files |
| `pnpm format` | Format with Prettier |

## Tech Stack

- **[Mastra](https://mastra.ai)** — Agent framework (workflows, tools, structured output)
- **[Gemini](https://ai.google.dev)** — LLM provider (`gemini-3-flash-preview`)
- **[Notion API](https://developers.notion.com)** — Publishing target (Markdown Content API)
- **[GitHub GraphQL](https://docs.github.com/graphql)** — Data source
- **TypeScript** + **Zod** — Type safety end-to-end

## License

MIT
