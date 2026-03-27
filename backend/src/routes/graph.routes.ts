import { Router } from 'express';
import { validateAppId } from '../middleware/validateParams.js';
import * as commitModel from '../models/commit.model.js';
import * as branchModel from '../models/branch.model.js';
import type { ApiGraphData } from '../types/api.types.js';

export const graphRouter = Router();

// GET /api/apps/:appId/graph — Full DAG data for visualization
graphRouter.get('/apps/:appId/graph', validateAppId, (req, res) => {
  const commits = commitModel.getCommits(req.params.appId);
  const branches = branchModel.getBranches(req.params.appId);

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
    mendixVersion: c.mendix_version,
    relatedStories: JSON.parse(c.related_stories) as string[],
  }));

  // Build edges from parent relationships
  const edges: Array<{ from: string; to: string }> = [];
  for (const node of nodes) {
    for (const parentHash of node.parentHashes) {
      edges.push({ from: parentHash, to: node.hash });
    }
  }

  // Map branches
  const branchData = branches.map((b) => ({
    name: b.name,
    type: b.branch_type,
    createdBy: b.first_unique_commit_author,
    createdDate: b.first_unique_commit_date,
    forkPointCommit: b.fork_point_commit,
    forkedFromBranch: b.forked_from_branch,
    latestCommitHash: b.latest_commit_hash,
    latestCommitDate: b.latest_commit_date,
    mendixVersion: b.mendix_version,
    commitsAhead: b.commits_ahead_of_main,
    commitsBehind: b.commits_behind_main,
    isMerged: b.is_merged === 1,
    isStale: b.is_stale === 1,
  }));

  const response: ApiGraphData = {
    nodes,
    edges,
    branches: branchData,
  };

  res.json(response);
});
