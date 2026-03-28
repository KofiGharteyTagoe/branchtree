import type { Commit, Branch } from './app.types';

export interface GraphData {
  nodes: Commit[];
  edges: GraphEdge[];
  branches: Branch[];
  pagination?: GraphPagination;
}

export interface GraphEdge {
  from: string;
  to: string;
}

export interface GraphPagination {
  totalCommits: number;
  returnedCommits: number;
  hasMore: boolean;
  oldestDate: string | null;
  newestDate: string | null;
}

export interface GraphSummary {
  totalCommits: number;
  oldestDate: string | null;
  newestDate: string | null;
  branchCount: number;
  branches: Array<{
    name: string;
    type: string | null;
    latestCommitDate: string | null;
    isStale: boolean;
  }>;
}

export interface GraphQueryOptions {
  since?: string;
  until?: string;
  limit?: number;
  activeSince?: number;
}
