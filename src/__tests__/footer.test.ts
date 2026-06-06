import { describe, it, expect } from 'vitest';
import { renderAuthorFooter } from '../publish/footer.js';
import type { AuthorConfig } from '../config/author.js';

const full: AuthorConfig = {
  displayName: 'Yash K Saini',
  bio: 'Engineer, building in public.',
  links: {
    github: 'https://github.com/yashksaini-coder',
    x: 'https://x.com/0xcrackedDev',
    linkedin: 'https://www.linkedin.com/in/yashksaini',
    website: 'https://yashksaini.vercel.app/',
  },
  previousWork: [{ label: 'DevNotion v1', url: 'https://dev.to/yashksaini/x' }],
};

describe('renderAuthorFooter', () => {
  it('renders name, bio, all four links, and previous work', () => {
    const md = renderAuthorFooter(full);
    expect(md).toContain('Yash K Saini');
    expect(md).toContain('Engineer, building in public.');
    expect(md).toContain('[GitHub](https://github.com/yashksaini-coder)');
    expect(md).toContain('[X](https://x.com/0xcrackedDev)');
    expect(md).toContain('[LinkedIn](https://www.linkedin.com/in/yashksaini)');
    expect(md).toContain('[Portfolio](https://yashksaini.vercel.app/)');
    expect(md).toContain('[DevNotion v1](https://dev.to/yashksaini/x)');
  });

  it('omits links that are not provided', () => {
    const partial: AuthorConfig = {
      displayName: 'X',
      bio: 'b',
      links: { github: 'https://gh' },
      previousWork: [],
    };
    const md = renderAuthorFooter(partial);
    expect(md).toContain('[GitHub](https://gh)');
    expect(md).not.toContain('[X]');
    expect(md).not.toContain('[LinkedIn]');
    expect(md).not.toContain('[Portfolio]');
  });

  it('omits the previous-work line when empty', () => {
    const md = renderAuthorFooter({ displayName: 'X', bio: 'b', links: {}, previousWork: [] });
    expect(md).not.toContain('More from me');
  });
});
