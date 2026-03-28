import type { App, Branch, Commit, MergeEvent, Alert, SyncResult } from './app.types';
import type { GraphData } from './graph.types';

export interface AppsResponse {
  apps: App[];
}

export interface BranchesResponse {
  branches: Branch[];
  alerts: Alert[];
}

export interface BranchDetailResponse {
  branch: Branch;
  commits: Commit[];
}

export type GraphResponse = GraphData;

export interface GraphSummaryResponse {
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

export interface MergeEventsResponse {
  mergeEvents: MergeEvent[];
}

export type SyncResponse = SyncResult;
