import { apiClient } from '../config/api';
import type {
  AppsResponse,
  BranchesResponse,
  BranchDetailResponse,
  GraphResponse,
  MergeEventsResponse,
  SyncResponse,
} from '../types/api.types';

export async function getApps(): Promise<AppsResponse> {
  const res = await apiClient.get<AppsResponse>('/apps');
  return res.data;
}

export async function registerApp(appId: string, pat: string, appName?: string): Promise<void> {
  await apiClient.post('/apps', { appId, pat, appName });
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

export async function getGraph(appId: string): Promise<GraphResponse> {
  const res = await apiClient.get<GraphResponse>(`/apps/${appId}/graph`);
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
