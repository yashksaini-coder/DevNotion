# DevNotion

A 3-agent [Mastra](https://mastra.ai) pipeline that transforms your weekly GitHub contributions into polished blog posts on Notion — fully automated. Built for the [DEV.to x Notion MCP Challenge](https://dev.to/challenges/notion-2026-03-04).

<img src="./assets/Architecture.png" alt="DevNotion Overview" />

## What It Does

Every Sunday (or on-demand), DevNotion:

1. **Harvests** your GitHub activity via GraphQL — commits, PRs, issues, reviews, discussions, language stats, and contribution streak
2. **Narrates** the data into an engaging blog post using Gemini, with tone-aware writing (professional, casual, technical, or storytelling)
3. **Publishes** the post to Notion as a richly formatted markdown page

## Quick Start

### Prerequisites

- Node.js 20+
- pnpm
- GitHub personal access token (`ghp_`)
- Google AI Studio API key ([get one here](https://aistudio.google.com))
- Notion integration token + parent page ID ([setup guide](https://developers.notion.com/docs/create-a-notion-integration))

### Setup

```bash
git clone https://github.com/yashksaini-coder/DevNotion.git
cd DevNotion
pnpm install
```

Copy `.env.example` to `.env.local` and fill in your keys (see `.env.example` for all options).

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
---

### Narrator Agent

The narrator is the core of DevNotion. It uses a tone-aware prompt system with four voice profiles and generates structured blog posts with:

- **Conditional sections** — empty sections are omitted entirely, not filled with "nothing this week"
- **Data-driven insights** — add/delete ratio analysis, streak celebration, review balance commentary
- **Anti-hallucination guardrails** — strict rules against inventing repos, approximating numbers, or fabricating activity
- **Engagement techniques** — hook openings, section transitions, developer empathy lines

### Narration Fallback Chain

The narrate step uses a 2-tier fallback:

1. **Markdown generation** — Narrator writes YAML frontmatter + markdown blog post
2. **Deterministic fallback** — builds a basic post from raw data (zero LLM dependency)

This ensures a blog post is always generated, even if the LLM is unavailable.

## Blog Tone Profiles

Set `BLOG_TONE` in your `.env.local`:

| Tone | Style |
|------|-------|
| `professional` | Authoritative, metrics-forward, corporate-blog safe |
| `casual` | Conversational, emoji-friendly, dev-Twitter energy |
| `technical` | Dense, precise, code-centric |
| `storytelling` | Narrative arc, scene-setting, callbacks |