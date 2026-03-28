import { config } from '../config/env.js';
import * as branchModel from '../models/branch.model.js';
import type { ApiAlert } from '../types/api.types.js';
import type { BranchRow } from '../types/db.types.js';

/**
 * Get all alerts for an app (stale branches, divergence, version mismatches).
 */
export function getAlerts(appId: string): ApiAlert[] {
  const branches = branchModel.getBranches(appId);
  const alerts: ApiAlert[] = [];

  alerts.push(...getStaleBranchAlerts(branches));
  alerts.push(...getDivergenceAlerts(branches));
  alerts.push(...getVersionMismatchAlerts(branches));

  return alerts;
}

/**
 * Detect branches with no recent activity.
 */
function getStaleBranchAlerts(branches: BranchRow[]): ApiAlert[] {
  const alerts: ApiAlert[] = [];
  const now = Date.now();
  const staleDays = config.staleBranchDays;
  const staleThreshold = staleDays * 24 * 60 * 60 * 1000;

  for (const branch of branches) {
    if (branch.branch_type === 'main') continue;
    if (branch.is_merged) continue;

    const lastActivity = branch.latest_commit_date
      ? new Date(branch.latest_commit_date).getTime()
      : null;

    if (lastActivity && now - lastActivity > staleThreshold) {
      const daysSince = Math.floor((now - lastActivity) / (24 * 60 * 60 * 1000));
      alerts.push({
        type: 'stale',
        branchName: branch.name,
        message: `Branch "${branch.name}" has had no activity for ${daysSince} days`,
        severity: daysSince > staleDays * 2 ? 'error' : 'warning',
      });

      // Also update the stale flag in the database
      branchModel.updateStaleStatus(branch.app_id, branch.name, true);
    }
  }

  return alerts;
}

/**
 * Detect branches that are far behind main.
 */
function getDivergenceAlerts(branches: BranchRow[]): ApiAlert[] {
  const alerts: ApiAlert[] = [];
  const threshold = config.divergenceThreshold;

  for (const branch of branches) {
    if (branch.branch_type === 'main') continue;
    if (branch.is_merged) continue;

    if (branch.commits_behind_main > threshold) {
      alerts.push({
        type: 'divergence',
        branchName: branch.name,
        message: `Branch "${branch.name}" is ${branch.commits_behind_main} commits behind main`,
        severity: branch.commits_behind_main > threshold * 2 ? 'error' : 'warning',
      });
    }
  }

  return alerts;
}

/**
 * Helper to safely extract a version string from provider_metadata JSON.
 */
function getVersionFromMetadata(branch: BranchRow): string | null {
  try {
    const metadata = JSON.parse(branch.provider_metadata);
    // Check for mendixVersion (Mendix provider) or generic version field
    return metadata.mendixVersion || metadata.version || null;
  } catch {
    return null;
  }
}

/**
 * Detect branches using different platform versions than main.
 * Works with any provider that stores version info in provider_metadata.
 */
function getVersionMismatchAlerts(branches: BranchRow[]): ApiAlert[] {
  const alerts: ApiAlert[] = [];

  const mainBranch = branches.find((b) => b.branch_type === 'main');
  if (!mainBranch) return alerts;

  const mainVersion = getVersionFromMetadata(mainBranch);
  if (!mainVersion) return alerts;

  for (const branch of branches) {
    if (branch.branch_type === 'main') continue;
    if (branch.is_merged) continue;

    const branchVersion = getVersionFromMetadata(branch);
    if (!branchVersion) continue;

    if (branchVersion !== mainVersion) {
      alerts.push({
        type: 'version_mismatch',
        branchName: branch.name,
        message: `Branch "${branch.name}" uses version ${branchVersion} (main uses ${mainVersion})`,
        severity: 'warning',
      });
    }
  }

  return alerts;
}
