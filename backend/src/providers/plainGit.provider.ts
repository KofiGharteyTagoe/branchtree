import type { GitProvider } from '../types/provider.types.js';

export const plainGitProvider: GitProvider = {
  id: 'plain-git',
  displayName: 'Git Repository',

  validateIdentifier(identifier: string): boolean {
    // Plain Git accepts any non-empty string as identifier (user-chosen ID)
    return identifier.trim().length > 0;
  },

  buildAuthUrl(repoUrl: string, credentials: string): string {
    if (!credentials) return repoUrl;
    // Generic HTTPS auth: https://user:token@host/path
    return repoUrl.replace('https://', `https://git:${credentials}@`);
  },

  // No getRepoUrl — repo URL is provided directly at registration
  // No enrichBranches — plain Git has no API enrichment
  // No enrichCommits — plain Git has no API enrichment
};
