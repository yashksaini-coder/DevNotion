import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { env } from '../config/env.js';
import { hashnodeLimiter } from '../utils/rate-limiter.js';

const HASHNODE_GQL_ENDPOINT = 'https://gql.hashnode.com';

const PUBLISH_POST_MUTATION = `
  mutation PublishPost($input: PublishPostInput!) {
    publishPost(input: $input) {
      post {
        id
        url
        title
        publishedAt
      }
    }
  }
`;

const CREATE_DRAFT_MUTATION = `
  mutation CreateDraft($input: CreateDraftInput!) {
    createDraft(input: $input) {
      draft {
        id
        title
      }
    }
  }
`;

interface HashnodeTag {
  slug: string;
  name: string;
}

async function hashnodeRequest<T>(
  query: string,
  variables: Record<string, unknown>,
): Promise<T> {
  return hashnodeLimiter(async () => {
    const response = await fetch(HASHNODE_GQL_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: env.HASHNODE_TOKEN!,
      },
      body: JSON.stringify({ query, variables }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Hashnode API HTTP error ${response.status}: ${text}`);
    }

    const json = (await response.json()) as { data?: T; errors?: Array<{ message: string }> };

    if (json.errors?.length) {
      const messages = json.errors.map((e) => e.message).join('; ');
      throw new Error(`Hashnode GraphQL error: ${messages}`);
    }

    return json.data as T;
  });
}

function buildTags(tags: string[]): HashnodeTag[] {
  return tags.slice(0, 5).map((t) => ({
    slug: t.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, ''),
    name: t,
  }));
}

export async function publishToHashnode(opts: {
  title: string;
  contentMarkdown: string;
  tags: string[];
  subtitle?: string;
  draft?: boolean;
}): Promise<{ postId: string; postUrl: string; isDraft: boolean }> {
  const tags = buildTags(opts.tags);
  const publicationId = env.HASHNODE_PUBLICATION_ID!;

  if (opts.draft) {
    const data = await hashnodeRequest<{ createDraft: { draft: { id: string; title: string } } }>(
      CREATE_DRAFT_MUTATION,
      {
        input: {
          title: opts.title,
          subtitle: opts.subtitle,
          contentMarkdown: opts.contentMarkdown,
          tags,
          publicationId,
        },
      },
    );
    const draft = data.createDraft.draft;
    // Hashnode drafts don't have a direct URL — construct from publication
    return {
      postId: draft.id,
      postUrl: `https://hashnode.com/draft/${draft.id}`,
      isDraft: true,
    };
  }

  const data = await hashnodeRequest<{
    publishPost: { post: { id: string; url: string; title: string; publishedAt: string } };
  }>(PUBLISH_POST_MUTATION, {
    input: {
      title: opts.title,
      subtitle: opts.subtitle,
      contentMarkdown: opts.contentMarkdown,
      tags,
      publicationId,
    },
  });

  const post = data.publishPost.post;
  return { postId: post.id, postUrl: post.url, isDraft: false };
}

export const publishHashnodeTool = createTool({
  id: 'hashnode-publish-post',
  description: 'Publish or draft a blog post on Hashnode via GraphQL API',
  inputSchema: z.object({
    title: z.string().describe('Post title'),
    contentMarkdown: z.string().describe('Full markdown content'),
    tags: z.array(z.string()).max(5).describe('Tags (max 5)'),
    subtitle: z.string().optional().describe('Optional subtitle / TLDR'),
    draft: z.boolean().default(false).describe('Save as draft instead of publishing'),
  }),
  outputSchema: z.object({
    postId: z.string(),
    postUrl: z.string(),
    isDraft: z.boolean(),
  }),
  execute: async (inputData) => publishToHashnode(inputData),
});
