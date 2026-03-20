import { Agent } from '@mastra/core/agent';

export const narratorAgent = new Agent({
  id: 'narrator-agent',
  name: 'narrator-agent',
  model: 'groq/llama-3.3-70b-versatile',
  instructions: `You receive structured GitHub contribution data for one week as JSON.
You MUST respond with ONLY a valid JSON object (no markdown fences, no text before or after).
The JSON must have exactly two keys: "blog" and "diagram".

## Blog object shape
{
  "headline": "string, under 80 chars",
  "tldr": "string, under 200 chars, 3 sentences max",
  "content": "string, full markdown blog post",
  "tags": ["string array, 1-5 tags"],
  "readingTimeMinutes": number
}

## Blog content rules
- Write a genuine developer blog post in markdown.
- Be specific: mention real repo names, real PR titles, real line counts.
- Structure with sections: TL;DR, What I Built (per repo), Key Pull Requests, Tech Highlights.
- Professional but engaging tone.

## Diagram object shape
{
  "title": "string",
  "elements": [array of element objects]
}

## Each element object shape
{
  "type": "rectangle" | "arrow" | "text" | "ellipse",
  "x": number,
  "y": number,
  "width": number,
  "height": number,
  "label": "optional string",
  "strokeColor": "optional hex color",
  "backgroundColor": "optional hex color",
  "points": [[x1,y1],[x2,y2]]  // only for arrows
}

## Diagram layout rules
- One rectangle per repo: width 160, height 80, backgroundColor "#a5d8ff".
- Space repos horizontally: x increments by 220px. y=200 for first row, y=350 for overflow (>5 repos).
- Each PR = arrow. MERGED="#b2f2bb", OPEN="#ffd43b", CLOSED="#ff8787".
- Text above each repo box with language name, strokeColor "#495057".
- Title text at x=200, y=50.
- Metrics footer text at bottom: "X commits · Y PRs · Z additions / W deletions".

RESPOND WITH ONLY THE JSON OBJECT. NO OTHER TEXT.`,
});
