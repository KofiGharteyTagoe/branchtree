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

export interface GraphResponse extends GraphData {}

export interface MergeEventsResponse {
  mergeEvents: MergeEvent[];
}

export type SyncResponse = SyncResult;
