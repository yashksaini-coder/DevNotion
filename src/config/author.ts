export interface AuthorLink {
  label: string;
  url: string;
}

export interface AuthorConfig {
  displayName: string;
  bio: string;
  links: {
    github?: string;
    x?: string;
    linkedin?: string;
    website?: string;
  };
  previousWork: AuthorLink[];
}

/**
 * Author identity rendered into every published post's footer.
 * Edit this one file to change the footer. Blank links are omitted.
 */
export const author: AuthorConfig = {
  displayName: 'Yash K Saini',
  bio: 'Engineer, building in public — AI/ML, low-level (Rust/C/C++), and open source.',
  links: {
    github: 'https://github.com/yashksaini-coder',
    x: 'https://x.com/0xcrackedDev',
    linkedin: 'https://www.linkedin.com/in/yashksaini',
    website: 'https://yashksaini.vercel.app/',
  },
  previousWork: [],
};

export const repoUrl = 'https://github.com/yashksaini-coder/DevNotion';

export interface SocialLink {
  key: 'repo' | 'github' | 'x' | 'linkedin' | 'website';
  label: string;
  url: string;
}

/** Single source of truth for the repo + author social links (only present ones). */
export function socialLinks(): SocialLink[] {
  const out: SocialLink[] = [{ key: 'repo', label: 'GitHub Repo', url: repoUrl }];
  if (author.links.github) out.push({ key: 'github', label: 'GitHub', url: author.links.github });
  if (author.links.x) out.push({ key: 'x', label: 'X', url: author.links.x });
  if (author.links.linkedin) out.push({ key: 'linkedin', label: 'LinkedIn', url: author.links.linkedin });
  if (author.links.website) out.push({ key: 'website', label: 'Portfolio', url: author.links.website });
  return out;
}
