**REVISED ARTICLE PLAN & PROJECT BLUEPRINT**

**GitPulse**

*Your GitHub life, automatically transformed into public Notion blogs \+ Excalidraw diagrams*

| 3 Focused Agents | Groq llama-3.3-70b | Notion \+ Excalidraw |
| :---: | :---: | :---: |

*Deadline: March 29, 2026  ·  $500 prize  ·  Judges: Originality · Technical Complexity · Practical Implementation*

# **Table of Contents**

| CH.1 Why We Rebuilt This From Scratch *The original NotionMind OS was too broad. This is a tighter, more original, more winnable project.* |
| :---- |

# **1.1  The Strategic Pivot**

The original blueprint covered 5 agents across strategy, finance, content, dev, and orchestration. That's impressive in scope but diffuse in impact. Judges remember one sharp, vivid use case — not five adequate ones.

GitPulse is that one sharp use case. It answers a question every developer actually has but has never seen automated cleanly:

| *"What did I actually build this week — and can someone who has never seen my code understand it?"* |
| :---: |

## **Before vs. After**

| Dimension | Original NotionMind OS → GitPulse |
| :---- | :---- |
| **Agents** | 5 generic (strategy/finance/content/dev/orchestrator) → 3 laser-focused (Harvester / Narrator / Publisher) |
| **LLM** | Claude only → Groq (llama-3.3-70b-versatile) for speed \+ cost, with model-string syntax |
| **Core WOW moment** | Self-improvement loop (hard to demo quickly) → Watching a diagram appear on Excalidraw canvas in real time |
| **Data source** | User input → Real GitHub API data (contributions, PRs, commit messages, diffs) |
| **Output** | Internal workflow pages → PUBLIC Notion pages visible to anyone via shared URL |
| **Metrics** | Workflow outcomes → Real developer productivity metrics (commit velocity, PR cycle time, language breakdown) |
| **Setup time** | Complex multi-DB seeding → 3 env vars \+ 1 command |

# **1.2  The Three-Sentence Pitch**

| 📌 | GitPulse is a 3-agent system that fetches your GitHub contributions every week, uses Groq-powered LLMs to write a developer blog post from your commits and PRs, generates an Excalidraw architecture diagram of what you built, and publishes both to a public Notion page — fully automated, zero manual writing. It turns your git history into your public engineering journal. You write code. GitPulse writes about it. |
| :---: | :---- |

# **1.3  Why This Wins on Every Judging Criterion**

| Criterion | What judges look for | How GitPulse delivers |
| :---- | :---- | :---- |
| **Originality & Creativity** | Surprising, novel use of Notion MCP. Not a CRUD wrapper. | No other submission chains GitHub GraphQL → Groq → Excalidraw MCP → Notion public pages in one automated pipeline. |
| **Technical Complexity** | Multiple MCP tool types, real data flow, non-trivial orchestration. | 3 MCP servers (Notion \+ Excalidraw \+ optional GitHub MCP). GitHub GraphQL query with contributionsCollection. Diagram generation via 26-tool Excalidraw MCP. Markdown Content API write. |
| **Practical Implementation** | Does it run? Would someone use it weekly? | Single command trigger. Real output: a public Notion page with a blog \+ embedded Excalidraw diagram. Judges can click a live URL. |

| CH.2 GitPulse — The Project *Architecture, agent design, data flow, and Notion structure* |
| :---- |

# **2.1  System Overview — The Three-Agent Pipeline**

| Agent | Nickname | What it does (one sentence) |
| :---- | :---- | :---- |
| **Agent 1: GithubHarvestAgent** | The Harvester 🌾 | Pulls weekly contributions from GitHub GraphQL: commits, PRs, reviews, repos touched, languages used, diff stats. |
| **Agent 2: NarratorAgent** | The Writer ✍️ | Takes raw GitHub data → writes a structured developer blog post AND generates Excalidraw diagram element specs from the contribution patterns. |
| **Agent 3: PublisherAgent** | The Publisher 📤 | Creates the Excalidraw diagram via MCP, uploads it, writes the blog \+ diagram to a new Notion page, adds the entry to the Weekly Dispatch database, and toggles the page to public. |

# **2.2  Notion Database Schema — What Gets Built**

| Database / Page | Type | What's stored |
| :---- | :---- | :---- |
| **📊 Weekly Dispatch DB** | Notion Database | One row per week: week\_start date, total\_commits, total\_prs, top\_language, blog\_page\_link, diagram\_url, published (bool), word\_count |
| **📝 Blog Post Pages** | Notion Page (child of Dispatch) | Full blog: headline, TL;DR, what I built (per repo), key PR summaries, tech highlights, Excalidraw diagram embedded, metrics sidebar |
| **🗂️ Repo Index DB** | Notion Database | Deduplicated list of all repos contributed to: name, URL, total commits all-time, total PRs all-time, primary language, last active date |
| **📈 Metrics DB** | Notion Database | Running totals per week: commits, additions, deletions, PR opens, PR merges, review comments, streak days |
| **⚙️ Config Page** | Notion Page | GitHub username, PAT token ref, blog tone setting, diagram style preference, auto-publish toggle — all editable by human in Notion UI |

# **2.3  What a Published Blog Post Looks Like**

Every weekly page is a proper public Notion doc with this structure:

* Header: 'Week of March 17–21, 2026 · 12 commits · 3 PRs · 847 lines added'

* TL;DR: 3-sentence summary written by the Narrator agent using Groq

* What I Built: per-repo narrative (one paragraph per repo with activity)

* Key Pull Requests: bullet list of merged PRs with their titles and purpose

* Tech Highlights: language breakdown, most-changed files, interesting patterns

* This Week's Architecture Diagram: embedded Excalidraw diagram showing repos, PRs, and data flows touched

* Metrics Sidebar: commit count, additions/deletions, PR cycle time, review count

* Links: direct links to every commit and PR mentioned

| 💡 | The public Notion URL is the judge's 'aha' moment. When they can click a real link and read a real blog post generated from real GitHub data with a real diagram — that's the difference between 'cool demo' and 'I want to use this.' |
| :---: | :---- |

| CH.3 DEV.to Article Blueprint *Full structure, hook script, and section-by-section guide* |
| :---- |

# **3.1  Title (A/B Options)**

| Option | Title |
| :---- | :---- |
| **Option A (recommended)** | I Built a Bot That Reads My GitHub Every Week and Writes My Engineering Blog For Me |
| **Option B** | GitPulse: How I Automated My Developer Blog with Groq \+ Excalidraw \+ Notion MCP |
| **Option C (punchy)** | You Code. GitPulse Explains It. (Groq \+ GitHub \+ Excalidraw → Notion in 3 Agents) |

Tags (required exactly): \#devchallenge \#notionchallenge \#mcp \#ai

# **3.2  Opening Hook (First 150 Words — Do Not Skip)**

| ✍️ | Draft: 'I realized I hadn't updated my engineering blog in 8 months. Not because I stopped building — I built a lot. But explaining what I built always felt like a second job. So I stopped. Last week I built GitPulse: a 3-agent system that runs every Sunday, pulls everything I did on GitHub that week, and writes a public Notion blog post about it — complete with an architecture diagram of what I touched. I've published 2 weeks so far. I haven't written a single word manually. Here's exactly how I built it, and how you can run it too.' |
| :---: | :---- |

Why this works: It's personal, it has a concrete time frame (8 months), it names the exact pain, it reveals the solution in sentence 4, and it promises reproducibility in the last sentence. All within 150 words.

# **3.3  Required Section: What I Built**

Write this section as a story, not a spec sheet. Structure:

1. The Problem (1 paragraph): The 8-month-blog-gap story

2. The System (1 diagram reference): 'Here's the full pipeline' — link to the Excalidraw diagram embedded in the post itself. Meta-moment: the diagram was generated by the system being described.

3. The Three Agents (one paragraph each): Give each agent a personality, not just a function. 'The Harvester doesn't care about context — it just collects. It knows exactly which GraphQL fields matter and ignores the rest.'

4. The Notion output (2 screenshots): The database view showing all weekly dispatches. One expanded blog post page showing the full output.

5. The public URL: Link to a live Notion page generated by your system. This is the money shot.

# **3.4  Required Section: Video Demo**

3-minute script — practice this exactly:

| Timestamp | What to show \+ say |
| :---- | :---- |
| **0:00–0:25** | Screen: empty Notion workspace. Voice: 'This is my workspace before GitPulse. My last blog post was in July.' Run: node src/index.ts \--week 2026-W11 |
| **0:25–1:00** | Screen: terminal showing GitHub GraphQL response. Voice: 'The Harvester just pulled 12 commits, 3 PRs across 4 repos. Watch what happens next.' |
| **1:00–1:40** | Screen: Excalidraw canvas. Voice: 'The Narrator is generating the diagram in real time.' Watch Excalidraw elements appear one by one (this is the visual wow moment). |
| **1:40–2:20** | Screen: Notion page being created. Voice: 'Now the Publisher writes the blog.' Show the markdown content API call live, then show the Notion page fully formed. |
| **2:20–2:45** | Screen: click 'Share → Publish to web'. Voice: 'One click and it's public.' Show the public Notion URL in browser. |
| **2:45–3:00** | Screen: the Weekly Dispatch database with 2-3 entries. Voice: 'That's 3 weeks of blogs. All from git history. Zero manual writing.' |

# **3.5  Required Section: Show Us The Code**

Four code snippets — each one teaching something, not just showing something:

* Snippet 1 — The GitHub GraphQL query: Show the full contributionsCollection query with PRs, commits, languages. Caption: 'This single query replaces 6 REST API calls.'

* Snippet 2 — The Groq blog generation: Show the prompt template with injected GitHub data. Caption: 'llama-3.3-70b-versatile generates 800 words in under 2 seconds on Groq.'

* Snippet 3 — The Excalidraw element generation: Show how NarratorAgent returns a JSON spec for boxes and arrows, then the batchCreate call. Caption: 'Every repo becomes a rectangle. Every PR becomes an arrow.'

* Snippet 4 — The Notion publish: Show the PATCH /v1/pages/:id/markdown call (the Markdown Content API). Caption: 'One PATCH call. The entire blog post in Notion. No block-by-block construction.'

# **3.6  Required Section: How I Used Notion MCP**

List every MCP tool by exact name. Judges check this section carefully:

| MCP Tool / API Call | Why it's used in GitPulse |
| :---- | :---- |
| **notion-create-page** | Creates a new weekly blog post page as a child of the Weekly Dispatch parent |
| **PATCH /v1/pages/:id/markdown** | Writes the entire blog post content in one call (Markdown Content API — March 2026\) |
| **notion-create-data-source-item** | Adds a row to the Weekly Dispatch database with all metrics |
| **notion-update-page** | Sets the page to 'Published' status, updates word\_count and diagram\_url properties |
| **notion-query-database-view** | Reads the Config page to get GitHub username, blog tone, diagram style preferences |
| **notion-search** | Checks if this week's entry already exists before creating (idempotency check) |
| **notion-create-comment** | Posts a 'Ready for review' comment if auto-publish is disabled in Config |
| **GET /v1/pages/:id/markdown** | Reads the Config page content as markdown to parse user preferences |

| CH.4 Build Timeline *10 days to a winning submission — day-by-day* |
| :---- |

# **4.1  Day-by-Day Plan**

| Days | Phase | Deliverable |
| :---- | :---- | :---- |
| **Days 1-2  (Mar 20-21)** | Foundation | Mastra project init, Groq provider connected, GitHub GraphQL tool built and tested against real account |
| **Days 3-4  (Mar 22-23)** | GithubHarvestAgent | Full contributionsCollection query: commits, PRs, reviews, languages. Zod-validated output schema. Unit tests. |
| **Days 5-6  (Mar 24-25)** | NarratorAgent | Groq blog generation working. Excalidraw element spec generation from contribution data. End-to-end: GitHub data → blog text \+ diagram spec. |
| **Days 7-8  (Mar 26-27)** | PublisherAgent \+ Notion | Excalidraw MCP connected. Batch element creation working. Notion Markdown Content API write working. Weekly Dispatch DB seeded. Full pipeline runs end-to-end. |
| **Day 9  (Mar 28\)** | Polish | Config page system. Auto-publish toggle. Error handling. README with GIF demo. Public GitHub repo. |
| **Day 10  (Mar 29\)** | Submit | 3-minute video recorded. Article written (all 5 sections). Cover image. Submit by 11:59 PM PST. |

| ⚠️ | Day 10 is submission day. Do NOT be fixing bugs on day 10\. If the pipeline works on day 9 — stop. Record the demo, write the article, submit. A working system with a great article beats a slightly-better system that's submitted at 11:58 PM with a rushed write-up. |
| :---: | :---- |

| CH.5 Differentiation Scorecard *How GitPulse stacks up against every live entry* |
| :---- |

# **5.1  Unique Selling Points — What Nobody Else Has**

* Real GitHub data: Most entries use synthetic/demo data. GitPulse runs on YOUR actual git history.

* Excalidraw MCP live diagram generation: Zero other submissions use the yctimlin/mcp\_excalidraw server for real-time diagram creation from structured data.

* Public Notion pages: Most entries create internal workspace pages. GitPulse creates shareable public URLs — judges can click a real link.

* Groq for speed: Using Groq (llama-3.3-70b-versatile) over Claude means blog generation takes \~2 seconds vs 10-20 seconds. Visible in the demo video — impressive.

* End-to-end automated weekly cadence: node-cron triggers every Sunday. No human action required after initial setup.

* The meta-moment: The architecture diagram in the article is itself generated by GitPulse. The system documents itself.

# **5.2  The Judge's Journey (What They Experience)**

6. They read the title: 'A bot that reads my GitHub and writes my blog.' Curiosity triggered.

7. They watch the demo video: They see real GitHub data → real Excalidraw diagram appearing → real Notion blog. Credibility established.

8. They click the public Notion URL in the article. They're reading a real blog post written by the system about real code. Trust locked in.

9. They check the code: Clean TypeScript, proper error handling, Groq model string syntax, full GraphQL query. Technical depth confirmed.

10. They read 'How I Used Notion MCP': 8 specific tool names. Markdown Content API called out. Developer maturity signals.

11. They give it the highest score in all three categories.

*GitPulse — Article Plan v2.0  ·  March 2026  ·  DEV.to × Notion MCP Challenge*

**You write code. GitPulse explains it. Now go build it. 🚀**