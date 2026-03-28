import type { ProviderType } from './provider.types.js';

export interface UserRow {
  id: number;
  email: string;
  display_name: string | null;
  avatar_url: string | null;
  oauth_provider: string;
  oauth_id: string;
  created_at: string;
  last_login: string | null;
}

export interface AppRow {
  app_id: string;
  app_name: string | null;
  pat: string | null;
  repo_url: string | null;
  repo_type: string | null;
  provider_type: ProviderType;
  owner_id: number | null;
  last_synced: string | null;
}

export interface BranchRow {
  id: number;
  app_id: string;
  name: string;
  fork_point_commit: string | null;
  forked_from_branch: string | null;
  first_unique_commit: string | null;
  first_unique_commit_author: string | null;
  first_unique_commit_date: string | null;
  latest_commit_hash: string | null;
  latest_commit_date: string | null;
  commits_ahead_of_main: number;
  commits_behind_main: number;
  is_merged: number;
  is_stale: number;
  branch_type: string | null;
  provider_metadata: string; // JSON object
}

export interface CommitRow {
  hash: string;
  app_id: string;
  author_name: string | null;
  author_email: string | null;
  commit_date: string | null;
  message: string | null;
  parent_hashes: string; // JSON array
  is_merge_commit: number;
  branch_names: string; // JSON array
  ref_names: string | null;
  provider_metadata: string; // JSON object
}

export interface MergeEventRow {
  id: number;
  app_id: string;
  merge_commit_hash: string;
  source_branch: string | null;
  target_branch: string | null;
  merged_by: string | null;
  merged_date: string | null;
}
