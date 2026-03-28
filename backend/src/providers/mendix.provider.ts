import type {
  GitProvider,
  ProviderBranchMetadata,
  ProviderCommitMetadata,
} from '../types/provider.types.js';
import * as mendixApiService from '../services/mendixApi.service.js';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const mendixProvider: GitProvider = {
  id: 'mendix',
  displayName: 'Mendix',

  validateIdentifier(identifier: string): boolean {
    return UUID_REGEX.test(identifier);
  },

  buildAuthUrl(repoUrl: string, credentials: string): string {
    // Mendix Team Server uses pat:<token>@ format
    return repoUrl.replace('https://', `https://pat:${credentials}@`);
  },

  async getRepoUrl(identifier: string, credentials: string) {
    const repoInfo = await mendixApiService.getRepoInfo(identifier, credentials);
    return { url: repoInfo.url, type: repoInfo.type };
  },

  async enrichBranches(appId: string, credentials: string): Promise<ProviderBranchMetadata[]> {
    const mendixBranches = await mendixApiService.getAllBranches(appId, credentials);
    return mendixBranches.map((branch) => ({
      branchName: branch.name,
      latestCommitHash: branch.latestCommit.id,
      latestCommitDate: branch.latestCommit.date,
      providerMetadata: {
        mendixVersion: branch.latestCommit.mendixVersion,
      },
    }));
  },

  async enrichCommits(
    appId: string,
    branchName: string,
    credentials: string,
  ): Promise<ProviderCommitMetadata[]> {
    const mendixCommits = await mendixApiService.getBranchCommits(appId, branchName, credentials);
    return mendixCommits.map((commit) => ({
      commitHash: commit.id,
      providerMetadata: {
        mendixVersion: commit.mendixVersion,
        relatedStories: commit.relatedStories?.map((s) => s.id) || [],
      },
    }));
  },
};
