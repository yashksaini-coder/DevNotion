import { z } from 'zod';

export const RepoContributionSchema = z.object({
  name: z.string(),
  url: z.string().url(),
  commits: z.number().int().nonnegative(),
  additions: z.number().int().nonnegative(),
  deletions: z.number().int().nonnegative(),
  language: z.string().optional(),
});

export const PullRequestSchema = z.object({
  title: z.string(),
  url: z.string().url(),
  repo: z.string(),
  state: z.enum(['OPEN', 'MERGED', 'CLOSED']),
  additions: z.number().int().nonnegative(),
  deletions: z.number().int().nonnegative(),
  mergedAt: z.string().nullable(),
});

export const WeeklyDataSchema = z.object({
  weekStart: z.string(),
  weekEnd: z.string(),
  totalCommits: z.number().int().nonnegative(),
  totalPRs: z.number().int().nonnegative(),
  totalAdditions: z.number().int().nonnegative(),
  totalDeletions: z.number().int().nonnegative(),
  repos: z.array(RepoContributionSchema),
  pullRequests: z.array(PullRequestSchema),
  languages: z.record(z.string(), z.number()),
  reviewsGiven: z.number().int().nonnegative(),
  streakDays: z.number().int().nonnegative(),
});

export type WeeklyData = z.infer<typeof WeeklyDataSchema>;
export type RepoContribution = z.infer<typeof RepoContributionSchema>;
export type PullRequest = z.infer<typeof PullRequestSchema>;
