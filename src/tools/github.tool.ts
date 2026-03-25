import { GraphQLClient, gql } from 'graphql-request';
import { env } from '../config/env.js';
import { WeeklyDataSchema, type WeeklyData } from '../types/github.types.js';

const client = new GraphQLClient('https://api.github.com/graphql', {
  headers: { Authorization: `bearer ${env.GITHUB_TOKEN}` },
});

const WEEKLY_CONTRIBUTIONS_QUERY = gql`
  query WeeklyContributions($username: String!, $from: DateTime!, $to: DateTime!) {
    user(login: $username) {
      contributionsCollection(from: $from, to: $to) {
        totalCommitContributions
        totalPullRequestContributions
        totalPullRequestReviewContributions
        totalIssueContributions
        contributionCalendar {
          totalContributions
          weeks {
            contributionDays {
              date
              contributionCount
            }
          }
        }
        commitContributionsByRepository {
          repository {
            name
            url
            primaryLanguage {
              name
            }
          }
          contributions {
            totalCount
          }
        }
        pullRequestContributions(last: 20) {
          nodes {
            pullRequest {
              title
              url
              state
              mergedAt
              additions
              deletions
              changedFiles
              repository {
                name
                url
              }
            }
          }
        }
        issueContributions(last: 30) {
          nodes {
            issue {
              title
              url
              state
              createdAt
              repository { name }
            }
          }
        }
        pullRequestReviewContributions(last: 30) {
          nodes {
            pullRequestReview {
              state
              submittedAt
            }
            pullRequest {
              title
              url
              repository { name }
            }
          }
        }
      }
      repositoryDiscussions(first: 20, orderBy: { field: CREATED_AT, direction: DESC }) {
        nodes {
          title
          url
          createdAt
          isAnswered
          category { name }
          repository { name }
        }
      }
      repositories(first: 100, orderBy: { field: PUSHED_AT, direction: DESC }) {
        nodes {
          name
          url
          languages(first: 5, orderBy: { field: SIZE, direction: DESC }) {
            edges {
              size
              node {
                name
                color
              }
            }
          }
        }
      }
    }
  }
`;

/* eslint-disable @typescript-eslint/no-explicit-any */

export async function fetchWeeklyContributions(weekStart: string): Promise<WeeklyData> {
  const from = new Date(weekStart);
  const to = new Date(from);
  to.setDate(from.getDate() + 7);

  const data: any = await client.request(WEEKLY_CONTRIBUTIONS_QUERY, {
    username: env.GITHUB_USERNAME,
    from: from.toISOString(),
    to: to.toISOString(),
  });

  const raw = transformGitHubResponse(data, weekStart, to.toISOString().split('T')[0]!);
  return WeeklyDataSchema.parse(raw);
}

export function transformGitHubResponse(
  data: any,
  weekStart: string,
  weekEnd: string,
): WeeklyData {
  const cc = data.user.contributionsCollection;
  const from = new Date(weekStart);
  const to = new Date(weekEnd);

  // Build repos array from commitContributionsByRepository
  const repos = cc.commitContributionsByRepository.map((entry: any) => {
    const repoPRs = (cc.pullRequestContributions.nodes ?? []).filter(
      (n: any) => n.pullRequest.repository.name === entry.repository.name,
    );
    const additions = repoPRs.reduce(
      (sum: number, n: any) => sum + (n.pullRequest.additions ?? 0),
      0,
    );
    const deletions = repoPRs.reduce(
      (sum: number, n: any) => sum + (n.pullRequest.deletions ?? 0),
      0,
    );

    return {
      name: entry.repository.name,
      url: entry.repository.url,
      commits: entry.contributions.totalCount,
      additions,
      deletions,
      language: entry.repository.primaryLanguage?.name,
    };
  });

  // Build pullRequests array
  const pullRequests = (cc.pullRequestContributions.nodes ?? []).map((n: any) => ({
    title: n.pullRequest.title,
    url: n.pullRequest.url,
    repo: n.pullRequest.repository.name,
    state: n.pullRequest.state as 'OPEN' | 'MERGED' | 'CLOSED',
    additions: n.pullRequest.additions ?? 0,
    deletions: n.pullRequest.deletions ?? 0,
    mergedAt: n.pullRequest.mergedAt ?? null,
  }));

  // Build languages map from repositories
  const languages: Record<string, number> = {};
  for (const repo of data.user.repositories.nodes ?? []) {
    for (const edge of repo.languages?.edges ?? []) {
      languages[edge.node.name] = (languages[edge.node.name] ?? 0) + edge.size;
    }
  }

  // Calculate streak from contribution calendar
  const allDays = (cc.contributionCalendar.weeks ?? [])
    .flatMap((w: any) => w.contributionDays)
    .filter((d: any) => {
      const date = new Date(d.date);
      return date >= from && date < to;
    });
  let streak = 0;
  for (const day of [...allDays].reverse()) {
    if (day.contributionCount > 0) streak++;
    else break;
  }

  // Build issues array
  const issues = (cc.issueContributions?.nodes ?? []).map((n: any) => ({
    title: n.issue.title,
    url: n.issue.url,
    repo: n.issue.repository.name,
    state: n.issue.state as 'OPEN' | 'CLOSED',
    createdAt: n.issue.createdAt,
  }));

  // Build reviews array
  const reviews = (cc.pullRequestReviewContributions?.nodes ?? []).map((n: any) => ({
    prTitle: n.pullRequest.title,
    prUrl: n.pullRequest.url,
    repo: n.pullRequest.repository.name,
    state: n.pullRequestReview.state,
    submittedAt: n.pullRequestReview.submittedAt,
  }));

  // Build discussions array (filter by date range since they come from user-level, not contributionsCollection)
  const discussions = (data.user.repositoryDiscussions?.nodes ?? [])
    .filter((n: any) => {
      const created = new Date(n.createdAt);
      return created >= from && created < to;
    })
    .map((n: any) => ({
      title: n.title,
      url: n.url,
      repo: n.repository.name,
      category: n.category?.name ?? 'General',
      isAnswered: n.isAnswered ?? false,
      createdAt: n.createdAt,
    }));

  const totalAdditions = pullRequests.reduce(
    (s: number, pr: any) => s + pr.additions,
    0,
  );
  const totalDeletions = pullRequests.reduce(
    (s: number, pr: any) => s + pr.deletions,
    0,
  );

  return {
    weekStart,
    weekEnd,
    totalCommits: cc.totalCommitContributions,
    totalPRs: cc.totalPullRequestContributions,
    totalAdditions,
    totalDeletions,
    totalIssues: cc.totalIssueContributions ?? issues.length,
    totalReviews: reviews.length,
    totalDiscussions: discussions.length,
    repos,
    pullRequests,
    issues,
    reviews,
    discussions,
    languages,
    reviewsGiven: reviews.length,
    streakDays: streak,
  };
}
