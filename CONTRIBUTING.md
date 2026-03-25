# Contributing to DevNotion

Thanks for your interest in contributing! Here's how to get started.

## Development Setup

```bash
git clone https://github.com/yashksaini-coder/DevNotion.git
cd DevNotion
pnpm install
cp .env.example .env.local  # or create manually (see README)
```

### Required Environment Variables

```env
GITHUB_TOKEN=ghp_...
GITHUB_USERNAME=your_username
GOOGLE_GENERATIVE_AI_API_KEY=...
NOTION_TOKEN=ntn_...
NOTION_PARENT_PAGE_ID=...
```

## Project Structure

```
src/
  agents/         # Mastra agent definitions (harvest, narrator, publisher)
  tools/          # Mastra tools (GitHub GraphQL, Notion REST)
  types/          # Zod schemas (github.types.ts, blog.types.ts)
  workflows/      # Pipeline definition (weekly-dispatch.workflow.ts)
  config/         # Environment validation (env.ts)
  utils/          # Helpers (parse-llm-json.ts, dates.ts)
  mastra/         # Mastra runtime entry (index.ts)
  __tests__/      # Vitest test files
```

## Development Workflow

```bash
# Run the full pipeline once
pnpm dev

# Open the Mastra playground for testing agents individually
pnpm playground

# Run tests
pnpm test

# Type check
npx tsc --noEmit

# Lint and format
pnpm lint
pnpm format
```

## Key Conventions

### Agents

- **Harvest and publish agents** use direct function calls (no LLM needed for deterministic work)
- **Narrator agent** uses Gemini with structured output + text parsing + deterministic fallback
- Agent instructions are template literals that interpolate runtime config (e.g., `BLOG_TONE`)

### Tools

- Mastra tools use `createTool` with Zod input/output schemas
- Tool execute functions receive `inputData` directly (not `{ context }`)
- Notion tools use rate limiting via `p-queue` + retry via `p-retry`

### Workflows

- Workflows use `createWorkflow` → `.then(step).commit()` pattern
- Each step has explicit `inputSchema` / `outputSchema` for type safety
- Steps access agents via `mastra.getAgent('agent-id')`

### Types

- All data flows through Zod schemas — no untyped data crossing step boundaries
- GitHub data: `WeeklyDataSchema` in `src/types/github.types.ts`
- Blog output: `NarratorOutputSchema` in `src/types/blog.types.ts`

### LLM Provider

- Single provider: Gemini via `@ai-sdk/google`
- Model format: `google/model-id` (Mastra's `parseModelString` splits on first `/`)
- Structured output: `agent.generate(prompt, { structuredOutput: { schema } })` → `result.object`

## Adding a New Agent

1. Create `src/agents/your-agent.ts` with `new Agent({ id, name, model, instructions })`
2. Register in `src/mastra/index.ts` agents map
3. Add a workflow step in `src/workflows/` if needed
4. Add tests in `src/__tests__/`

## Adding a New Tool

1. Create `src/tools/your-tool.ts` with `createTool({ id, inputSchema, outputSchema, execute })`
2. Assign to an agent's `tools` map or use directly in a workflow step
3. Add tests

## Testing

Tests use [Vitest](https://vitest.dev). Mock external APIs with `vi.fn()` and `vi.mock()`.

```bash
pnpm test              # Run once
pnpm test:watch        # Watch mode
```

## Pull Requests

1. Create a feature branch from `main`
2. Make your changes with clear, focused commits
3. Ensure `npx tsc --noEmit` and `pnpm test` pass
4. Open a PR with a description of what changed and why

## Reporting Issues

Open an issue on [GitHub](https://github.com/yashksaini-coder/DevNotion/issues) with:

- What you expected vs. what happened
- Steps to reproduce
- Relevant logs or error output
