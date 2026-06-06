---
title: "I Revived My $500 Prize-Winning Project — And Finally Made It Trustworthy"
published: false
tags: devchallenge, githubchallenge, ai, typescript
cover_image:
---

*This is a submission for the [GitHub Finish-Up-A-Thon Challenge](https://dev.to/challenges/github-2026-05-21)*

> **[Editor's note — delete before publishing]** Add a `cover_image:` URL, drop your real screenshots into the `[Screenshot: …]` slots, and in *"My Experience with GitHub Copilot"* keep only what matches your actual usage (add your own Copilot screenshots). Everything else is finished prose.

## What I Built

Every Monday standup, someone asks the same question: *"What did you work on last week?"* And for years my honest answer was a shrug and a scroll through commit history I could barely parse.

So in March I built **[DevNotion](https://github.com/yashksaini-coder/DevNotion)** — a [Mastra](https://mastra.ai) pipeline of specialist agents that harvests a week of my GitHub activity, narrates it into a first-person blog post, and publishes it to Notion and DEV.to. It won **$500** in the Notion MCP Challenge. And then, like a lot of hackathon projects, it sat.

It *worked*. But every week I used it, I felt the gaps. It was locked to a single LLM. It published whatever it generated the instant it generated it — no preview, no edit, no undo. And when I reopened the repo for the Finish-Up-A-Thon, the **very first run failed in the most embarrassing way I can imagine** — which turned out to be the perfect place to begin.

**DevNotion v2** is the version I should have shipped the first time: a pipeline that **generates a draft, shows it to you, lets you edit it, and only publishes when you approve** — backed by multiple LLM providers, three publishing targets, a deterministic stats-card cover, far richer data, and a real test suite.

The one idea behind the whole rebuild: *a tool that writes in your voice and publishes under your name has to be trustworthy before it's convenient.*

## Demo

**Repo:** [github.com/yashksaini-coder/DevNotion](https://github.com/yashksaini-coder/DevNotion)

`[Screenshot: dashboard run history — cohesive dark UI, status badges (Preview Ready / Published), "Review & Publish" actions]`

`[Screenshot: the preview/edit screen — the generated post in an editable markdown box, an "Approve & Publish" button, and a stats grid]`

`[Screenshot: the auto-generated weekly stats card — 13 commits · +2,252 / −293 · 3 repos]`

Three specialist agents, with generation and publishing deliberately split by a human approval gate:

```mermaid
flowchart TD
    A["weekStart"] --> H["1 · Harvest Agent<br/>GitHub GraphQL + per-commit deltas, touched areas"]
    H --> N["2 · Narrator Agent<br/>gemini-3-flash-preview · fail-loud"]
    N --> S["Stats card (deterministic SVG→PNG, used as cover)"]
    S --> P["draft persisted"]
    P --> G{"Approval gate (dashboard)<br/>preview · edit · approve"}
    G -->|approve| PUB["3 · Publisher Agent<br/>Notion · DEV.to · Hashnode + author footer"]
```

The design rule that's held since v1: **only use an LLM where it earns its keep.** Harvesting, the stats card, and publishing are deterministic — no token cost, no hallucination surface. The LLM narrates; everything around it is plain, testable code.

## The Comeback Story

### Where v1 actually was

I like to think I left v1 in good shape. The first run of the revival corrected me immediately:

```text
Narrate step: LLM call failed: You exceeded your current quota …
  limit: 0, model: gemini-2.0-flash
Publish: Created Notion page: https://app.notion.com/…
Publish: Published DEV.to article: https://dev.to/…
```

Read it twice. Narration **failed** — and the pipeline **published anyway**. v1's well-intentioned "always produce a blog" fallback meant a quota error quietly shipped a bare stats stub to my real DEV.to account. For a tool whose entire job is to represent my work, that's the worst possible behavior.

That single log hid three distinct bugs:

1. **The wrong model was wired in.** The live workflow read a different config key than the one I'd been carefully setting, so it silently fell back to a *retired* `gemini-2.0-flash` whose free quota is now `0`. I was configuring a knob connected to nothing.
2. **Failure was silent.** A `try/catch` swapped in a deterministic stub and marched straight on to publishing.
3. **There was no gate.** Nothing in the entire system ever let me *look* before it went live.

And a quieter, more insidious one: a week of 13 direct commits reported **`+0/-0` lines changed**, because line stats were summed from pull requests only. The posts were technically accurate and completely lifeless.

I rebuilt DevNotion in seven focused phases. Each one got a short spec, a written plan, an implementation, a code review, and a green test run before the next began — small, verifiable steps instead of one heroic rewrite. The order it took:

### Phase 1 — Make narration trustworthy

First, one source of truth for model selection, defaulting to `gemini-3-flash-preview` (which actually *has* a free tier). Then the change that matters most — **fail-loud narration**:

```typescript
// src/llm/narrate.ts
// FAIL-LOUD: throws on provider error or unparseable output. NEVER returns a
// deterministic fallback — the caller decides what to do with a failure.
export async function narrateBlog(provider, data, opts = {}) {
  const system = buildNarratorSystemPrompt(opts.tone ?? 'casual', opts.focusAreas);
  const prompt = `Generate a blog post from this GitHub contribution data:\n\n${JSON.stringify(data, null, 2)}`;

  const text = await provider.generate(prompt, {
    system,
    maxTokens: opts.maxTokens ?? 8192, // Gemini 3 is a thinking model — small budgets starve the answer
  });

  const parsed = parseFrontmatter(text);
  if (!parsed.success) throw new Error(`Narration failed: ${parsed.error}`);
  return parsed.data.blog;
}
```

If narration throws, the workflow step throws, the run is marked **failed**, and the publish step never runs. A quota error can no longer reach a single reader. (The old deterministic builder still exists — but it's now an explicit, manual escape hatch, never an automatic one.)

### Phase 2 — Split generate from publish

This was the keystone, and it explains *why* v1 never had a preview. The old workflow welded harvest → narrate → publish into one chain whose output schema **dropped the blog body entirely**. There was nothing to preview because the content never survived the step boundary.

v2 splits the pipeline in two. A `generate` phase produces a full, previewable draft and **stops**. A separate `publish` action runs only on approval, applying any edits you made:

```typescript
// src/server/routes/run.ts
// POST /run  → generates a draft, stores it, sets status "preview". Publishes NOTHING.
// POST /publish/:jobId → applies your edited markdown, then calls publishBlog().
```

That one architectural cut delivered three wins simultaneously: a safe failure mode, an editable in-browser preview, and run history that finally shows what was actually written. The publisher itself became a reusable function shared by both the dashboard and the cron path:

```typescript
// src/publish/publish-content.ts — one publisher, used by cron AND the dashboard
export async function publishBlog(opts: {
  blog; weeklyData; publishMode: 'auto' | 'draft';
  images?: { coverPath?: string; statsCardPath?: string };
}): Promise<PublishResult> { /* notion → devto → hashnode → write planner + footer */ }
```

### Phase 3 — Harvest the real diff

The `+0/-0` bug is gone. A bounded second GraphQL pass pulls each active repo's commit history — real additions/deletions, changed-file counts, and the **top directories you touched** — so the narrator can ground the story in specifics instead of generic verbs. The exact week that used to report nothing now reports:

```text
week 2026-05-27 → totals +2,252/-293
- DevNotion:        +2,220/-282, files=25, areas=[src/server, src/tools, bin]
- yashksaini-coder: +24/-3,      files=5,  areas=[assets, .github/workflows]
```

It's quota-safe by construction — hard caps on how many repos and commits it inspects, with per-repo best-effort isolation so one failure never sinks the harvest. This was the single feedback theme from v1's readers: *commit titles are cryptic; the diff tells the story.* Now it does.

### Phase 4 — Sharper writing + an author footer

I tightened the narrator's instructions — character-led hooks instead of stat lines, an explicit *no stat-dumping* rule, and guidance to lean on the new touched-areas data. Then I added a consistent author/social footer to every post on every platform, rendered from one config file:

```text
---
**Yash K Saini** — Engineer, building in public — AI/ML, low-level (Rust/C/C++), and open source.

[GitHub] · [X] · [LinkedIn] · [Portfolio]
```

It's applied at publish-build time, not by the narrator — so it can't be accidentally edited away in the preview, and Hashnode gets it for free.

### Phase 5 — The cover image

My first instinct was the obvious one: an AI **cover** via Nano Banana (`gemini-2.5-flash-image`), prompted from the week's headline. I wired it up — and discovered the free tier gives image generation a quota of `limit: 0`. It never produced a single cover. That probabilistic, rate-limited dependency was buying me nothing.

So I deleted it, and let a piece of code I already had do the job. The **deterministic stats card** — rendered from a hand-built SVG → PNG (via `@resvg/resvg-js`) with the week's *exact* numbers — is already exactly cover/OG dimensions, 1200×630. I just made it the cover:

```typescript
// src/images/stats-card.ts — the numbers come from code, never from a model
const stats = [
  [fmt(data.totalCommits), 'commits'],
  [`+${fmt(data.totalAdditions)}`, 'added'],
  [`-${fmt(data.totalDeletions)}`, 'removed'],
  // …
];
```

The card now ships as the cover/social image on every target — DEV.to's `main_image`, the Hashnode cover, the Notion page cover. **Code** for the factual card means an LLM can never hallucinate `2,252` into `2,000`, and the cover went from *never working* to *always working* in the same change that deleted code: no API, no quota, no fallback path — it just renders. That's the rare refactor where the simplification and the quality win are the same move.

### Phase 6 — A dashboard worth screenshotting

The three dashboard routes had drifted into three slightly-different stylesheets. I unified them into a single design system — one set of tokens, one shell, shared components — made it responsive, and polished the preview/edit view that is, after all, the whole pitch.

### Phase 7 — Tests

**49 tests across 18 suites** now cover the frontmatter parser, the fail-loud path, the deterministic fallback, tag normalization, provider/model selection, publish-target selection, the diff aggregation, and the stats-card builder.

### Before vs after

| | Before (v1) | After (v2) |
|---|---|---|
| Failure mode | silently published a stub | **fail-loud** — publishes nothing |
| Review | none — instant publish | **preview, edit, approve** |
| LLMs | Gemini only | Gemini / OpenAI / Anthropic |
| Publish targets | Notion + DEV.to | + Hashnode |
| Line stats | PR-only (`+0/-0` on commit weeks) | real per-commit deltas + touched areas |
| Cover image | none | Deterministic stats card, used as the cover |
| Setup | hand-edit `.env` | `npx devnotion init` wizard |
| Tests | a handful | 49 across 18 suites |

> **Before:** "It works, but you have to trust it blindly."
> **After:** "It works, and it gets out of your way — safely."

## Publishing responsibly (the research that turned into a feature)

Around phase five I nearly bolted on automatic publishing to more platforms. Then I did the boring, important thing first: I read the rules. The question I actually searched was simple — *"is automated/AI publishing even allowed here, and can it get my account restricted?"* — and the answers reshaped the design.

- **Medium** is a dead end for automation, on two counts. Its [publishing API was archived in 2023](https://github.com/Medium/medium-api-docs) (no new integration tokens), and its [AI content policy](https://help.medium.com/hc/en-us/articles/22576852947223-Artificial-Intelligence-AI-content-policy) gives undisclosed AI writing "Network Only" distribution and can remove it outright. An auto-posted AI dev-log is precisely what that policy targets — so Medium is off the roadmap by design, not by omission.
- **Hashnode** has a genuine [publishing API](https://apidocs.hashnode.com/), but its [Code of Conduct](https://hashnode.com/code-of-conduct) prohibits "automated or bulk posting" and self-promotion without contributing, and its [terms](https://hashnode.com/terms) allow account suspension at their discretion. A real weekly post is fine; blind, scheduled, multi-account auto-posting is the pattern they police.
- **DEV.to** is the friendliest to drafts and review, which is exactly the workflow I landed on.

The fix wasn't to publish less — it was to publish *honestly*:

- **Draft by default, human approval required.** Every platform now receives a *draft*; I review and edit it in the dashboard, then publish on-platform myself. Nothing ships unattended.
- **A disclosure footer** on every post — a small, bold **Generated by DevNotion**. No hiding the tool.
- **A `Dev log #n` title prefix**, so the series is honest about what it is.

One search — *"what are the actual rules here?"* — turned a feature I'd have rushed into a design constraint that made the whole thing more defensible. "Finished" doesn't only mean it runs; it means it won't get your accounts restricted.

## My Experience with GitHub Copilot

Reviving a codebase you haven't opened in months is mostly *re-orientation*, and that's exactly where AI pairing earned its place. A few moments stood out more than any autocomplete:

- **Diagnosing the silent bug.** The highest-value assist wasn't generated code — it was tracing *why* setting the model config changed nothing. Walking the two divergent code paths with an AI partner surfaced the split-brain config in minutes instead of an afternoon of `console.log` archaeology.
- **The provider abstraction.** Describing "one interface, swap Gemini / OpenAI / Anthropic" in plain English produced a clean factory I refined rather than wrote from a blank file.
- **Knowing when to delete.** I started wiring an AI cover via the Nano Banana API and paired to figure out its quirks — Gemini image models return bytes via `result.files`, and you call `generateText`, not a dedicated image function. The genuinely useful assist came right after: confirming the free tier's image quota was `limit: 0`, which made the call to drop the whole thing and let the deterministic stats card be the cover obvious instead of stubborn.
- **Tests.** Generating the first pass of each unit test from the module's signature, then tightening the assertions by hand, is what made a 38-test suite cheap enough to actually write.

`[Screenshot: a real GitHub Copilot interaction from your workflow — e.g. Copilot Chat generating the provider interface, or inline completion filling a provider class]`

What changed most wasn't raw speed — it was *confidence flowing back into a cold codebase*. The AI didn't just complete lines; it helped me remember what the code did and decide where to take it next. That's the part of "finishing" nobody warns you about, and it's the part pairing helped most.

## Results & Validation

- **7 phases, shipped incrementally** — each verified against `tsc` and the test suite before the next.
- **49 tests / 18 suites, green.**
- The narration path was confirmed live on the free tier (`gemini-3-flash-preview`), the harvest fix verified on a real week (`+0/-0` → `+2,252/-293`), and the stats card rendered to a real 1200×630 PNG.

## What's Next

- **The deterministic stats card is the cover** — no image quota, no API, always succeeds; one fewer moving part than the AI cover I tried and dropped.
- **Per-platform publish resilience** — today one platform failing fails the run (surfaced and retryable); isolating each is a v3 item.
- **Bidirectional Notion sync** — draft in Notion, push outward.

If you try it, open an issue — I read them now. That part's new too.

---

*Built with [Mastra](https://mastra.ai), the [Vercel AI SDK](https://ai-sdk.dev), Gemini 3 Flash for narration, `@resvg/resvg-js` for the stats-card cover, and the [Notion](https://developers.notion.com) / [DEV.to](https://developers.forem.com/api) / [Hashnode](https://apidocs.hashnode.com/) APIs. By [Yash K Saini](https://yashksaini.vercel.app/) — [GitHub](https://github.com/yashksaini-coder) · [X](https://x.com/0xcrackedDev) · [LinkedIn](https://www.linkedin.com/in/yashksaini). Star it if it made you smile.*
