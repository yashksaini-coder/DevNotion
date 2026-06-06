import { GraphQLClient, gql } from 'graphql-request';
import { env } from '../config/env.js';

export interface CommitNode {
  oid: string;
  message: string;
  additions: number;
  deletions: number;
  changedFilesIfAvailable: number | null;
  committedDate: string;
}

export interface RepoCommitAggregate {
  additions: number;
  deletions: number;
  changedFiles: number;
  commitMessages: string[];
}

/** Pure: aggregate commit history nodes for one repo. messageCap limits stored messages. */
export function aggregateRepoCommits(nodes: CommitNode[], messageCap: number): RepoCommitAggregate {
  let additions = 0;
  let deletions = 0;
  let changedFiles = 0;
  const commitMessages: string[] = [];
  for (const n of nodes) {
    additions += n.additions ?? 0;
    deletions += n.deletions ?? 0;
    changedFiles += n.changedFilesIfAvailable ?? 0;
    if (commitMessages.length < messageCap) {
      commitMessages.push((n.message ?? '').split('\n')[0]!.trim());
    }
  }
  return { additions, deletions, changedFiles, commitMessages };
}

/** Pure: top-level (or two-level) directory of a file path; '(root)' for root files. */
function topLevelDir(path: string): string {
  const idx = path.indexOf('/');
  if (idx === -1) return '(root)';
  const parts = path.split('/');
  return parts.length >= 3 ? `${parts[0]}/${parts[1]}` : parts[0]!;
}

/** Pure: rank touched directories by frequency, return the top N. */
export function topTouchedAreas(paths: string[], topN: number): string[] {
  const counts = new Map<string, number>();
  for (const p of paths) {
    const dir = topLevelDir(p);
    counts.set(dir, (counts.get(dir) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, topN)
    .map(([dir]) => dir);
}

const client = new GraphQLClient('https://api.github.com/graphql', {
  headers: { Authorization: `bearer ${env.GITHUB_TOKEN}` },
});

const REPO_COMMITS_QUERY = gql`
  query RepoCommits($owner: String!, $name: String!, $authorId: ID!, $from: GitTimestamp!, $to: GitTimestamp!) {
    repository(owner: $owner, name: $name) {
      defaultBranchRef {
        target {
          ... on Commit {
            history(first: 30, since: $from, until: $to, author: { id: $authorId }) {
              nodes {
                oid
                message
                additions
                deletions
                changedFilesIfAvailable
                committedDate
              }
            }
          }
        }
      }
    }
  }
`;

/* eslint-disable @typescript-eslint/no-explicit-any */

/** Fetch up to 30 of the author's commits in the window for one repo (GraphQL). */
export async function fetchRepoCommitDetails(
  owner: string,
  name: string,
  authorId: string,
  fromIso: string,
  toIso: string,
): Promise<CommitNode[]> {
  const data: any = await client.request(REPO_COMMITS_QUERY, {
    owner,
    name,
    authorId,
    from: fromIso,
    to: toIso,
  });
  const nodes = data?.repository?.defaultBranchRef?.target?.history?.nodes ?? [];
  return nodes as CommitNode[];
}

/** Bounded, best-effort REST fetch of changed file paths for a set of commit SHAs. */
export async function fetchChangedPaths(
  owner: string,
  name: string,
  shas: string[],
): Promise<string[]> {
  const paths: string[] = [];
  for (const sha of shas) {
    try {
      const res = await fetch(`https://api.github.com/repos/${owner}/${name}/commits/${sha}`, {
        headers: { Authorization: `Bearer ${env.GITHUB_TOKEN}`, 'User-Agent': 'DevNotion' },
      });
      if (!res.ok) continue;
      const json: any = await res.json();
      for (const f of json.files ?? []) {
        if (f.filename) paths.push(f.filename as string);
      }
    } catch {
      // best-effort: skip this commit on any error
    }
  }
  return paths;
}
