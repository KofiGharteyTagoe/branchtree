import type { GitProvider } from '../types/provider.types.js';

const GITHUB_REPO_REGEX = /^[a-zA-Z0-9._-]+\/[a-zA-Z0-9._-]+$/;

export const githubProvider: GitProvider = {
  id: 'github',
  displayName: 'GitHub',

  validateIdentifier(identifier: string): boolean {
    return GITHUB_REPO_REGEX.test(identifier);
  },

  buildAuthUrl(repoUrl: string, credentials: string): string {
    if (!credentials) return repoUrl;
    // GitHub uses x-access-token:<PAT>@ format
    return repoUrl.replace('https://', `https://x-access-token:${credentials}@`);
  },

  async getRepoUrl(identifier: string, _credentials: string) {
    // GitHub repos have a predictable URL pattern
    return {
      url: `https://github.com/${identifier}.git`,
      type: 'git',
    };
  },

  // Enrichment (PRs, issues, CI) can be added in Phase 4
};
