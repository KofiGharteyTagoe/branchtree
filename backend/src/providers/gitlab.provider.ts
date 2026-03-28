import type { GitProvider } from '../types/provider.types.js';

export const gitlabProvider: GitProvider = {
  id: 'gitlab',
  displayName: 'GitLab',

  validateIdentifier(identifier: string): boolean {
    // GitLab accepts project ID (integer) or group/project path
    return /^\d+$/.test(identifier) || /^[a-zA-Z0-9._-]+(\/[a-zA-Z0-9._-]+)+$/.test(identifier);
  },

  buildAuthUrl(repoUrl: string, credentials: string): string {
    if (!credentials) return repoUrl;
    // GitLab uses oauth2:<token>@ format
    return repoUrl.replace('https://', `https://oauth2:${credentials}@`);
  },

  async getRepoUrl(identifier: string, _credentials: string) {
    // GitLab repos have a predictable URL pattern for path-based identifiers
    return {
      url: `https://gitlab.com/${identifier}.git`,
      type: 'git',
    };
  },

  // Enrichment (MRs, pipelines) can be added in Phase 4
};
