import { author as defaultAuthor, type AuthorConfig } from '../config/author.js';

/**
 * Render the author/social footer as markdown. Only links that are present are
 * rendered. Returns a block beginning with a horizontal rule.
 */
export function renderAuthorFooter(a: AuthorConfig = defaultAuthor): string {
  const links: string[] = [];
  if (a.links.github) links.push(`[GitHub](${a.links.github})`);
  if (a.links.x) links.push(`[X](${a.links.x})`);
  if (a.links.linkedin) links.push(`[LinkedIn](${a.links.linkedin})`);
  if (a.links.website) links.push(`[Portfolio](${a.links.website})`);

  const lines: string[] = ['---', '', `**${a.displayName}** — ${a.bio}`];
  if (links.length) lines.push('', links.join(' · '));
  if (a.previousWork.length) {
    lines.push('', `More from me: ${a.previousWork.map((w) => `[${w.label}](${w.url})`).join(' · ')}`);
  }
  return lines.join('\n');
}
