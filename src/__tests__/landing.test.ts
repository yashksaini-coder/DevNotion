import { describe, it, expect } from 'vitest';
import { buildLandingPage } from '../server/routes/landing.js';
import { repoUrl } from '../config/author.js';

describe('buildLandingPage', () => {
  it('renders real links: repo, dashboard CTA, and socials', () => {
    const html = buildLandingPage();
    expect(html).toContain(repoUrl);
    expect(html).toContain('href="/runs"');
    expect(html).toContain('rel="noopener noreferrer"');
    expect(html).not.toContain('href="#"');
    expect(html).toContain('Turn your GitHub week');
  });
});
