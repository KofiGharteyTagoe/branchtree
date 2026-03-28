import { Router } from 'express';
import { validateAppId, validateBranchName } from '../middleware/validateParams.js';
import { createApiError } from '../middleware/errorHandler.js';
import { authorizeAppOwner } from '../middleware/auth.js';
import * as branchModel from '../models/branch.model.js';
import * as commitModel from '../models/commit.model.js';
import * as alertsService from '../services/alerts.service.js';
import type { ApiBranch } from '../types/api.types.js';

export const branchesRouter = Router();

function safeJsonParse(json: string, fallback: unknown = {}): unknown {
  try {
    return JSON.parse(json);
  } catch {
    return fallback;
  }
}

// GET /api/apps/:appId/branches — List all branches with metadata
branchesRouter.get('/apps/:appId/branches', validateAppId, authorizeAppOwner, (req, res) => {
  const branches = branchModel.getBranches(req.params.appId);
  const alerts = alertsService.getAlerts(req.params.appId);

  const response: ApiBranch[] = branches.map((b) => ({
    name: b.name,
    type: b.branch_type,
    createdBy: b.first_unique_commit_author,
    createdDate: b.first_unique_commit_date,
    forkPointCommit: b.fork_point_commit,
    forkedFromBranch: b.forked_from_branch,
    latestCommitHash: b.latest_commit_hash,
    latestCommitDate: b.latest_commit_date,
    commitsAhead: b.commits_ahead_of_main,
    commitsBehind: b.commits_behind_main,
    isMerged: b.is_merged === 1,
    isStale: b.is_stale === 1,
    providerMetadata: safeJsonParse(b.provider_metadata) as Record<string, unknown>,
  }));

  res.json({ branches: response, alerts });
});

// GET /api/apps/:appId/branches/:branchName — Single branch detail
branchesRouter.get(
  '/apps/:appId/branches/:branchName',
  validateAppId,
  authorizeAppOwner,
  validateBranchName,
  (req, res, next) => {
    const branch = branchModel.getBranch(req.params.appId, req.params.branchName);
    if (!branch) {
      return next(createApiError('Branch not found', 404));
    }

    const commits = commitModel.getCommitsByBranch(req.params.appId, req.params.branchName);

    res.json({
      branch: {
        name: branch.name,
        type: branch.branch_type,
        createdBy: branch.first_unique_commit_author,
        createdDate: branch.first_unique_commit_date,
        forkPointCommit: branch.fork_point_commit,
        forkedFromBranch: branch.forked_from_branch,
        latestCommitHash: branch.latest_commit_hash,
        latestCommitDate: branch.latest_commit_date,
        commitsAhead: branch.commits_ahead_of_main,
        commitsBehind: branch.commits_behind_main,
        isMerged: branch.is_merged === 1,
        isStale: branch.is_stale === 1,
        providerMetadata: safeJsonParse(branch.provider_metadata) as Record<string, unknown>,
      },
      commits: commits.map((c) => ({
        hash: c.hash,
        authorName: c.author_name,
        authorEmail: c.author_email,
        date: c.commit_date,
        message: c.message,
        parentHashes: JSON.parse(c.parent_hashes),
        isMergeCommit: c.is_merge_commit === 1,
        refs: c.ref_names,
        providerMetadata: safeJsonParse(c.provider_metadata) as Record<string, unknown>,
      })),
    });
  },
);
