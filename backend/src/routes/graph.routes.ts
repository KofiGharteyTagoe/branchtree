import { Router } from 'express';
import { validateAppId } from '../middleware/validateParams.js';
import { authorizeAppOwner } from '../middleware/auth.js';
import * as commitModel from '../models/commit.model.js';
import * as branchModel from '../models/branch.model.js';

export const graphRouter = Router();

function safeJsonParse(json: string, fallback: unknown = {}): unknown {
  try {
    return JSON.parse(json);
  } catch {
    return fallback;
  }
}

function mapBranch(b: ReturnType<typeof branchModel.getBranches>[number]) {
  return {
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
  };
}

// GET /api/apps/:appId/graph/summary — Lightweight metadata for time slider
graphRouter.get('/apps/:appId/graph/summary', validateAppId, authorizeAppOwner, (req, res) => {
  const appId = req.params.appId;
  const totalCommits = commitModel.getCommitCount(appId);
  const dateRange = commitModel.getCommitDateRange(appId);
  const branches = branchModel.getBranches(appId);

  res.json({
    totalCommits,
    oldestDate: dateRange.oldest,
    newestDate: dateRange.newest,
    branchCount: branches.length,
    branches: branches.map((b) => ({
      name: b.name,
      type: b.branch_type,
      latestCommitDate: b.latest_commit_date,
      isStale: b.is_stale === 1,
    })),
  });
});

// GET /api/apps/:appId/graph — DAG data for visualization (with optional pagination)
graphRouter.get('/apps/:appId/graph', validateAppId, authorizeAppOwner, (req, res) => {
  const appId = req.params.appId;
  const since = req.query.since as string | undefined;
  const until = req.query.until as string | undefined;
  const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;
  const activeSince = req.query.activeSince
    ? parseInt(req.query.activeSince as string, 10)
    : undefined;

  // Get commits (paginated or full)
  const hasPagination = since || until || limit;
  const commits = hasPagination
    ? commitModel.getCommitsPaginated(appId, { since, until, limit })
    : commitModel.getCommits(appId);

  const totalCommits = commitModel.getCommitCount(appId);

  // Build nodes from commits
  const nodes = commits.map((c) => ({
    hash: c.hash,
    authorName: c.author_name,
    authorEmail: c.author_email,
    date: c.commit_date,
    message: c.message,
    parentHashes: JSON.parse(c.parent_hashes) as string[],
    isMergeCommit: c.is_merge_commit === 1,
    refs: c.ref_names,
    providerMetadata: safeJsonParse(c.provider_metadata) as Record<string, unknown>,
  }));

  // Build edges from parent relationships
  const nodeHashes = new Set(nodes.map((n) => n.hash));
  const edges: Array<{ from: string; to: string }> = [];
  for (const node of nodes) {
    for (const parentHash of node.parentHashes) {
      // Only include edges where both endpoints are in the current result set
      if (nodeHashes.has(parentHash)) {
        edges.push({ from: parentHash, to: node.hash });
      }
    }
  }

  // Filter branches by activity if requested
  let branches = branchModel.getBranches(appId);
  if (activeSince) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - activeSince);
    const cutoffStr = cutoff.toISOString();
    const protectedTypes = new Set(['main', 'development', 'release']);
    branches = branches.filter(
      (b) =>
        protectedTypes.has(b.branch_type || '') ||
        (b.latest_commit_date && b.latest_commit_date >= cutoffStr),
    );
  }

  const branchData = branches.map(mapBranch);

  // Compute pagination metadata
  const commitDates = commits
    .map((c) => c.commit_date)
    .filter((d): d is string => !!d)
    .sort();

  res.json({
    nodes,
    edges,
    branches: branchData,
    pagination: {
      totalCommits,
      returnedCommits: commits.length,
      hasMore: commits.length < totalCommits,
      oldestDate: commitDates[0] || null,
      newestDate: commitDates[commitDates.length - 1] || null,
    },
  });
});
