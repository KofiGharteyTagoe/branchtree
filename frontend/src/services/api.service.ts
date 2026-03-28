import { apiClient } from '../config/api';
import type { ProviderType } from '../types/app.types';
import type { GraphQueryOptions } from '../types/graph.types';
import type {
  AppsResponse,
  BranchesResponse,
  BranchDetailResponse,
  GraphResponse,
  GraphSummaryResponse,
  MergeEventsResponse,
  SyncResponse,
} from '../types/api.types';

export async function getApps(): Promise<AppsResponse> {
  const res = await apiClient.get<AppsResponse>('/apps');
  return res.data;
}

export async function registerApp(
  appId: string,
  pat: string,
  providerType: ProviderType = 'mendix',
  appName?: string,
  repoUrl?: string
): Promise<void> {
  await apiClient.post('/apps', { appId, pat, providerType, appName, repoUrl });
}

export async function updateAppPat(appId: string, pat: string): Promise<void> {
  await apiClient.put(`/apps/${appId}/pat`, { pat });
}

export async function deleteApp(appId: string): Promise<void> {
  await apiClient.delete(`/apps/${appId}`);
}

export async function getBranches(appId: string): Promise<BranchesResponse> {
  const res = await apiClient.get<BranchesResponse>(`/apps/${appId}/branches`);
  return res.data;
}

export async function getBranchDetail(
  appId: string,
  branchName: string
): Promise<BranchDetailResponse> {
  const encoded = encodeURIComponent(branchName);
  const res = await apiClient.get<BranchDetailResponse>(
    `/apps/${appId}/branches/${encoded}`
  );
  return res.data;
}

export async function getGraph(appId: string, options?: GraphQueryOptions): Promise<GraphResponse> {
  const params = new URLSearchParams();
  if (options?.since) params.set('since', options.since);
  if (options?.until) params.set('until', options.until);
  if (options?.limit) params.set('limit', String(options.limit));
  if (options?.activeSince) params.set('activeSince', String(options.activeSince));
  const query = params.toString();
  const url = `/apps/${appId}/graph${query ? `?${query}` : ''}`;
  const res = await apiClient.get<GraphResponse>(url);
  return res.data;
}

export async function getGraphSummary(appId: string): Promise<GraphSummaryResponse> {
  const res = await apiClient.get<GraphSummaryResponse>(`/apps/${appId}/graph/summary`);
  return res.data;
}

export async function getMergeEvents(appId: string): Promise<MergeEventsResponse> {
  const res = await apiClient.get<MergeEventsResponse>(`/apps/${appId}/merge-events`);
  return res.data;
}

export async function triggerSync(appId: string): Promise<SyncResponse> {
  const res = await apiClient.post<SyncResponse>(`/apps/${appId}/sync`);
  return res.data;
}
