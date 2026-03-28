import type { GitProvider, ProviderType } from '../types/provider.types.js';
import { mendixProvider } from './mendix.provider.js';
import { plainGitProvider } from './plainGit.provider.js';
import { githubProvider } from './github.provider.js';
import { gitlabProvider } from './gitlab.provider.js';

const providers = new Map<ProviderType, GitProvider>([
  ['mendix', mendixProvider],
  ['plain-git', plainGitProvider],
  ['github', githubProvider],
  ['gitlab', gitlabProvider],
]);

export function getProvider(type: ProviderType): GitProvider {
  const provider = providers.get(type);
  if (!provider) {
    throw new Error(`Unknown provider type: ${type}`);
  }
  return provider;
}

export function getAllProviders(): GitProvider[] {
  return Array.from(providers.values());
}

export function isValidProviderType(type: string): type is ProviderType {
  return providers.has(type as ProviderType);
}
