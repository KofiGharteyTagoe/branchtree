import { Router } from 'express';
import { validateAppId } from '../middleware/validateParams.js';
import * as mergeEventModel from '../models/mergeEvent.model.js';

export const mergesRouter = Router();

// GET /api/apps/:appId/merge-events — All detected merge events
mergesRouter.get('/apps/:appId/merge-events', validateAppId, (req, res) => {
  const events = mergeEventModel.getMergeEvents(req.params.appId);

  res.json({
    mergeEvents: events.map((e) => ({
      id: e.id,
      mergeCommitHash: e.merge_commit_hash,
      sourceBranch: e.source_branch,
      targetBranch: e.target_branch,
      mergedBy: e.merged_by,
      mergedDate: e.merged_date,
    })),
  });
});
