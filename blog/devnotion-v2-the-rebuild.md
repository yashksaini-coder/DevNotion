---
title: "DevNotion v2: making a GitHub-to-blog pipeline I could actually trust"
published: false
tags: ai, typescript, opensource, webdev
cover_image:
---

<!-- [Editor's note — delete before publishing] Search for REPLACE_WITH_IMAGE_URL and swap each for a real image URL (drag a file into the editor to host it). Set a cover_image: too — the weekly stats card works well. -->

Two months ago, the first thing my own tool did when I reopened it was publish a broken post to my real DEV.to account.

DevNotion is a small pipeline I built back in March: it reads a week of my GitHub activity, writes a first-person blog post about it, and publishes that to Notion and DEV.to. It won $500 in the Notion MCP Challenge, and then I stopped touching it — which is the natural lifecycle of most hackathon projects. When I came back to it for the GitHub Finish-Up-A-Thon, the very first run failed in a way that taught me exactly what "finishing" this thing actually meant.

This is what I changed, and why most of the work was about trust rather than features.

Here's what changed:

- Narration now **fails loudly** instead of silently shipping a fallback stub
- The pipeline is split so I **review and edit every post before it publishes**
- Line stats come from real commits, so a commit-heavy week no longer reports `+0/-0`
- It runs on Gemini, OpenAI, or Anthropic instead of one hardcoded model
- There's a dashboard, a landing page, a deterministic stats-card cover, and 51 tests where there used to be a handful

## Background

The premise hasn't changed since v1. Every Monday someone asks what you worked on last week, and I could never remember. So DevNotion harvests the week's commits, PRs, issues, reviews and language stats, hands the structured data to an LLM to narrate, and publishes the result. The design rule I liked then and still like now: only use the model where it earns its place. Harvesting and publishing are plain, deterministic functions. The model only writes prose.

v1 worked. It just wasn't something I trusted. It was locked to a single Gemini model, it published whatever it generated the instant it generated it, and configuring it meant hand-editing eight environment variables and hoping. I was using it, but every Sunday I'd half-brace for what it would post.

## Problem

The failing run printed this:

```text
Narrate step: LLM call failed: You exceeded your current quota …
  limit: 0, model: gemini-2.0-flash
Publish: Created Notion page: https://app.notion.com/…
Publish: Published DEV.to article: https://dev.to/…
```

Narration failed, and the pipeline published anyway. v1 had a well-meaning "always produce a blog" fallback that, on any LLM error, swapped in a bare stats dump and carried right on to publishing. For a tool whose whole job is to represent my work in my voice, shipping a stub to my live feed is about the worst thing it can do.

One log, three separate bugs:

1. **The model I'd configured wasn't the one running.** The live pipeline read a different env key than the one I'd been carefully setting, so it silently fell back to a retired `gemini-2.0-flash` whose free quota is now zero. I'd been tuning a dial connected to nothing.
2. **Failure was silent.** A `try/catch` quietly substituted the fallback and moved on.
3. **There was no point at which I could look before it went live.**

And a quieter one I only caught later: a week of 13 direct commits reported `+0/-0` lines changed, because the line stats were summed from pull requests only. The posts were accurate and lifeless.

## What the readers had already flagged

Before writing a line of v2, I went back and read the comments on the original post. A lot of the rebuild was already sitting in there.

Two people independently pointed out the same thing: commit messages are too cryptic to blog from. "fix bug" and "refactor" carry almost no signal. One suggested pulling diff stats alongside the messages — a `+12/-340` on a specific file tells a far clearer story than a commit title. That's the whole reason the v2 harvest now digs into per-file line changes and the directories I touched, instead of leaning on commit text.

Another reader made a point that landed harder in hindsight: cache the output as a draft first and review it before publishing, because models occasionally invert "added" and "removed" or invent a file path that was never there. At the time I nodded and moved on. Two months later my own pipeline published a stub to my feed, and the comment looked less like a nice-to-have and more like the spec. The review gate is the direct result.

A few senior engineers also praised the one constraint I was most tempted to abandon under deadline: keeping the deterministic steps out of the LLM's path. Reading that the restraint was the thing that "separates production pipelines from demos" was the nudge I needed to keep harvesting, publishing, and the cover image as plain deterministic functions in v2, and keep the LLM confined to the one place it genuinely helps — narration.

## Approach

I rebuilt it in seven focused passes, shipping and verifying each before starting the next. The single most useful change wasn't a feature — it was cutting the pipeline in half.

v1 welded harvest, narrate, and publish into one step whose output dropped the blog body. That one detail explains why there was never a preview: the content didn't survive the step boundary, so there was nothing to show. v2 splits it into a **generate** phase that produces a draft and stops, and a **publish** action that only runs when I approve.

{% mermaid(caption="The v2 pipeline: generation and publishing are separated by a human approval gate.") %}
flowchart TD
    A[weekStart] --> H[Harvest Agent<br/>GitHub GraphQL]
    H --> N[Narrator Agent<br/>gemini-3-flash-preview]
    N --> I[Stats card<br/>deterministic SVG→PNG, used as cover]
    I --> D[Draft saved]
    D --> G{Review · edit · approve}
    G -->|approved| P[Publisher Agent<br/>Notion · DEV.to · Hashnode]
{% end %}

That single cut paid for three things at once: a safe failure mode, an editable preview, and run history that finally shows what was written.

## Under the hood

A few of the changes are worth showing in detail.

![DevNotion dashboard — generate, preview, edit, then approve before anything publishes](REPLACE_WITH_IMAGE_URL)

**Fail-loud narration.** The narrate step no longer catches its own errors. If the model is unavailable or returns something unparseable, it throws, the run is marked failed, and publishing never happens:

```typescript
export async function narrateBlog(provider, data, opts = {}) {
  const text = await provider.generate(prompt, { system, maxTokens: opts.maxTokens ?? 8192 });
  const parsed = parseFrontmatter(text);
  if (!parsed.success) throw new Error(`Narration failed: ${parsed.error}`);
  return parsed.data.blog;
}
```

The old fallback still exists, but it's a manual escape hatch now, never something that fires on its own. Switching the default model to `gemini-3-flash-preview` (which actually has a free tier) and giving the call a real token budget fixed the original failure; making it fail loud means the next quota hiccup costs me a failed run, not a published one.

**Real diff context.** The harvest now pulls per-commit additions and deletions, changed-file counts, and the top directories I touched that week. The point isn't the numbers — it's that the narrator can say "a week deep in `src/server`" instead of a generic verb. The exact week that used to read `+0/-0` now reads:

```text
week 2026-05-27 → totals +2,252/-293
- DevNotion: +2,220/-282, files=25, areas=[src/server, src/tools, bin]
```

It's bounded on purpose — a hard cap on how many repos and commits it inspects, with per-repo error isolation, so one bad call never sinks the whole harvest.

**The cover image, the boring way.** I started where everyone starts: an AI-generated cover via Nano Banana. Then I hit the wall — the free tier gives image generation a quota of `limit: 0`, so it never produced anything. Rather than carry a probabilistic, rate-limited dependency that didn't even work, I deleted it and let a deterministic stats card I already had become the cover. It's rendered from an SVG, it's already exactly 1200×630 (cover/OG size), and the numbers are exact:

```typescript
const stats = [
  [fmt(data.totalCommits), 'commits'],
  [`+${fmt(data.totalAdditions)}`, 'added'],
  [`-${fmt(data.totalDeletions)}`, 'removed'],
];
```

A model would happily round 2,252 to "about 2,000," and a cover with wrong stats is worse than none. The card leads with the post title and the week's metrics, and ships as the cover on every target — DEV.to, Hashnode, Notion. (The `Dev log #n` number lives on the article title, not the card, so the banner is all title and numbers and long titles wrap instead of clipping.) Deleting the AI cover made the feature *more* reliable, not less: it went from never working to always working, with no API call in the path.

> **Note:** The cover is deterministic. There's no quota to exhaust, no fallback to reason about, and nothing about the cover can block a publish — it just renders.

![Weekly stats card used as the cover — post title + the week's metrics](REPLACE_WITH_IMAGE_URL)

**Multi-provider, one knob.** v1 was Gemini-only. v2 reads `LLM_PROVIDER` and routes to Gemini, OpenAI, or Anthropic through one small abstraction, so a model outage or a quota wall isn't fatal to the whole idea.

## Impact

| | v1 | v2 |
|---|---|---|
| Failure mode | silently published a stub | fails loud, publishes nothing |
| Review | none — instant publish | preview, edit, approve |
| LLMs | Gemini only | Gemini · OpenAI · Anthropic |
| Publish targets | Notion + DEV.to | + Hashnode |
| Line stats | PR-only (`+0/-0` on commit weeks) | real per-commit deltas + touched areas |
| Cover image | none | Deterministic stats card, used as the cover |
| Setup | hand-edited `.env` | `npx devnotion init` |
| Tests | a handful | 51 across 18 suites |

The architecture barely changed — same specialist-functions-with-an-LLM-in-the-middle shape it always had. What changed is everything around it: the failure behavior, the review step, the data quality, the provider flexibility. v2 is v1 with the parts I ran out of time for in March.

## Takeaways

The thing I underestimated about reviving an old project is that the hard part isn't the new features — it's re-reading code you wrote months ago and rebuilding enough confidence in it to change it safely. Tests helped, but mostly I had to trace the actual failure to its root before I trusted any fix. The `+0/-0` bug and the silent-publish bug both looked like config problems and were really design problems.

If I had to compress it: a tool that writes under your name has to be trustworthy before it's convenient. v1 was convenient. v2 is trustworthy, and only then convenient.

## What's next

- The deterministic stats card is the cover now — no image-generation quota required, so the cover always renders. (The AI cover I tried first never worked on the free tier; dropping it removed a moving part rather than adding one.)
- Publishing fails the whole run if one platform errors. Isolating each platform so a Hashnode hiccup doesn't block a Notion publish is the next robustness pass.
- Drafting in Notion and pushing outward (instead of only GitHub → Notion) is the v3 idea I keep circling back to.

## Resources

- Repo: [github.com/yashksaini-coder/DevNotion](https://github.com/yashksaini-coder/DevNotion)
- Built with [Mastra](https://mastra.ai), the [Vercel AI SDK](https://ai-sdk.dev), and the Notion / DEV.to / Hashnode APIs.

If DevNotion is useful to you, or you hit a rough edge, open an issue — I read them now. That part is also new.
