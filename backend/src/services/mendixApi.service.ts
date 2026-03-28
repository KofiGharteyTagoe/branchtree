import axios, { type AxiosInstance } from 'axios';

const MENDIX_API_BASE = 'https://repository.api.mendix.com/v1';

import type {
  MendixRepoInfo,
  MendixBranch,
  MendixCommit,
  MendixPaginatedResponse,
} from '../types/mendix.types.js';

function createClient(pat: string): AxiosInstance {
  return axios.create({
    baseURL: MENDIX_API_BASE,
    headers: {
      Authorization: `MxToken ${pat}`,
    },
    timeout: 30000,
  });
}

/**
 * Get repository info (type and URL) for a Mendix app.
 */
export async function getRepoInfo(appId: string, pat: string): Promise<MendixRepoInfo> {
  const client = createClient(pat);
  const res = await client.get(`/repositories/${appId}/info`);
  return res.data;
}

/**
 * Get all branches for a Mendix app, handling pagination.
 */
export async function getAllBranches(appId: string, pat: string): Promise<MendixBranch[]> {
  const client = createClient(pat);
  const allBranches: MendixBranch[] = [];
  let cursor: string | null = null;

  do {
    const params: Record<string, string | number> = { limit: 100 };
    if (cursor) params.cursor = cursor;

    const res = await client.get<MendixPaginatedResponse<MendixBranch>>(
      `/repositories/${appId}/branches`,
      { params },
    );

    allBranches.push(...res.data.items);
    cursor = res.data.cursors?.next || null;
  } while (cursor);

  return allBranches;
}

/**
 * Get all commits for a specific branch, handling pagination.
 */
export async function getBranchCommits(
  appId: string,
  branchName: string,
  pat: string,
): Promise<MendixCommit[]> {
  const client = createClient(pat);
  const allCommits: MendixCommit[] = [];
  let cursor: string | null = null;
  const encodedBranch = encodeURIComponent(branchName);

  do {
    const params: Record<string, string | number> = { limit: 100 };
    if (cursor) params.cursor = cursor;

    const res = await client.get<MendixPaginatedResponse<MendixCommit>>(
      `/repositories/${appId}/branches/${encodedBranch}/commits`,
      { params },
    );

    allCommits.push(...res.data.items);
    cursor = res.data.cursors?.next || null;
  } while (cursor);

  return allCommits;
}
