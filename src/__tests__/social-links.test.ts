import { describe, it, expect } from 'vitest';
import { socialLinks, repoUrl } from '../config/author.js';

describe('socialLinks', () => {
  it('lists the repo first, then the present author links', () => {
    const links = socialLinks();
    expect(links[0]).toEqual({ key: 'repo', label: 'GitHub Repo', url: repoUrl });
    const keys = links.map((l) => l.key);
    expect(keys).toContain('x');
    expect(keys).toContain('linkedin');
    expect(keys).toContain('website');
    expect(links.every((l) => l.url.length > 0)).toBe(true);
  });
});
