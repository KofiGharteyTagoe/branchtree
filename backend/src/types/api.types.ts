import type { ProviderType } from './provider.types.js';

export interface ApiApp {
  appId: string;
  appName: string | null;
  repoUrl: string | null;
  repoType: string | null;
  providerType: ProviderType;
  lastSynced: string | null;
}

export interface ApiBranch {
  name: string;
  type: string | null;
  createdBy: string | null;
  createdDate: string | null;
  forkPointCommit: string | null;
  forkedFromBranch: string | null;
  latestCommitHash: string | null;
  latestCommitDate: string | null;
  commitsAhead: number;
  commitsBehind: number;
  isMerged: boolean;
  isStale: boolean;
  /** Provider-specific metadata (e.g., { mendixVersion, relatedStories } for Mendix) */
  providerMetadata: Record<string, unknown>;
}

export interface ApiCommit {
  hash: string;
  authorName: string | null;
  authorEmail: string | null;
  date: string | null;
  message: string | null;
  parentHashes: string[];
  isMergeCommit: boolean;
  refs: string | null;
  /** Provider-specific metadata (e.g., { mendixVersion, relatedStories } for Mendix) */
  providerMetadata: Record<string, unknown>;
}

export interface ApiGraphData {
  nodes: ApiCommit[];
  edges: Array<{ from: string; to: string }>;
  branches: ApiBranch[];
}

export interface ApiMergeEvent {
  id: number;
  mergeCommitHash: string;
  sourceBranch: string | null;
  targetBranch: string | null;
  mergedBy: string | null;
  mergedDate: string | null;
}

export interface ApiAlert {
  type: 'stale' | 'divergence' | 'version_mismatch';
  branchName: string;
  message: string;
  severity: 'warning' | 'error';
}

export interface SyncResult {
  success: boolean;
  branchCount: number;
  commitCount: number;
  mergeEventCount: number;
  syncedAt: string;
}
