import { describe, it, expect, vi } from 'vitest';

const notionMock = { createNotionPage: vi.fn(async () => ({ pageId: 'p', pageUrl: 'http://notion/p' })), writeNotionMarkdown: vi.fn(async () => {}), updateNotionPage: vi.fn(async () => {}) };
const devtoMock = { createDevtoArticle: vi.fn(async () => ({ articleId: 1, articleUrl: 'http://devto/1' })) };
const hashnodeMock = { publishToHashnode: vi.fn(async () => ({ postId: 'h', postUrl: 'http://hashnode/h', isDraft: false })) };

vi.mock('../tools/notion-rest.tool.js', () => notionMock);
vi.mock('../tools/devto.tool.js', () => devtoMock);
vi.mock('../tools/hashnode.tool.js', () => hashnodeMock);
vi.mock('../config/env.js', () => ({ env: { PUBLISH_TARGETS: ['notion', 'devto'], PUBLISH_MODE: 'auto', DEVTO_API_KEY: 'k', HASHNODE_TOKEN: undefined, HASHNODE_PUBLICATION_ID: undefined, IMAGE_PUBLIC_BASE_URL: undefined } }));

const blog = { headline: 'H', tldr: 'T', content: 'body', tags: ['rust'], readingTimeMinutes: 2 };
const weeklyData = {
  weekStart: '2026-05-27', weekEnd: '2026-06-03', totalCommits: 1, totalPRs: 0,
  totalAdditions: 0, totalDeletions: 0, totalIssues: 0, totalReviews: 0, totalDiscussions: 0,
  repos: [], pullRequests: [], issues: [], reviews: [], discussions: [],
  languages: { Rust: 1 }, reviewsGiven: 0, streakDays: 0,
} as never;

describe('publishBlog target selection', () => {
  it('publishes to the configured targets (notion + devto) and not hashnode', async () => {
    const { publishBlog } = await import('../publish/publish-content.js');
    const result = await publishBlog({ blog, weeklyData, publishMode: 'auto' });

    expect(notionMock.createNotionPage).toHaveBeenCalledTimes(1);
    expect(devtoMock.createDevtoArticle).toHaveBeenCalledTimes(1);
    expect(hashnodeMock.publishToHashnode).not.toHaveBeenCalled();
    expect(result.notionPageUrl).toBe('http://notion/p');
    expect(result.devtoUrl).toBe('http://devto/1');
    expect(result.hashnodeUrl).toBeUndefined();
  });
});
