export interface ParsedCommit {
  hash: string;
  parentHashes: string[];
  authorName: string;
  authorEmail: string;
  date: string;
  message: string;
  refs: string | null;
  isMergeCommit: boolean;
}

export interface BranchAnalysis {
  name: string;
  forkPointCommit: string | null;
  forkedFromBranch: string;
  firstUniqueCommit: {
    hash: string;
    author: string;
    date: string;
  } | null;
  commitsAhead: number;
  commitsBehind: number;
  isMerged: boolean;
  branchType: string;
}

export type BranchType = 'main' | 'feature' | 'release' | 'hotfix' | 'development' | 'unknown';
