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
