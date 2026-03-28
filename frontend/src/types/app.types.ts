export type ProviderType = 'mendix' | 'github' | 'gitlab' | 'plain-git';

export interface App {
  appId: string;
  appName: string | null;
  repoUrl: string | null;
  repoType: string | null;
  providerType: ProviderType;
  lastSynced: string | null;
}

export interface Branch {
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
  /** Provider-specific metadata (e.g., { mendixVersion } for Mendix apps) */
  providerMetadata: Record<string, unknown>;
}

export interface Commit {
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

export interface MergeEvent {
  id: number;
  mergeCommitHash: string;
  sourceBranch: string | null;
  targetBranch: string | null;
  mergedBy: string | null;
  mergedDate: string | null;
}

export interface Alert {
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

export type BranchType = 'main' | 'feature' | 'release' | 'hotfix' | 'development' | 'unknown';
