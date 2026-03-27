import * as appModel from '../models/app.model.js';
import * as branchModel from '../models/branch.model.js';
import * as commitModel from '../models/commit.model.js';
import * as mergeEventModel from '../models/mergeEvent.model.js';
import * as gitCloneService from './gitClone.service.js';
import * as gitParserService from './gitParser.service.js';
import * as gitAnalysisService from './gitAnalysis.service.js';
import * as mendixApiService from './mendixApi.service.js';
import type { SyncResult } from '../types/api.types.js';

/**
 * Full sync pipeline for a Mendix app.
 *
 * Steps:
 * 1. Get PAT from database
 * 2. Get repo info from Mendix API
 * 3. Clone or fetch bare repo
 * 4. Extract commit graph from Git
 * 5. Analyze branch relationships
 * 6. Enrich with Mendix API data
 * 7. Detect merge events
 */
export async function syncApp(appId: string): Promise<SyncResult> {
  console.log(`Starting sync for app ${appId}...`);

  // Step 1: Get PAT for this app from database
  const pat = appModel.getAppPat(appId);
  if (!pat) {
    throw new Error(
      'No PAT configured for this app. Update the app with a valid Personal Access Token.'
    );
  }

  // Step 2: Get repo info from Mendix API
  const repoInfo = await mendixApiService.getRepoInfo(appId, pat);
  appModel.updateAppRepoInfo(appId, repoInfo.url, repoInfo.type);
  console.log(`Repo URL: ${repoInfo.url}`);

  // Step 3: Clone or fetch bare repo
  const repoPath = await gitCloneService.cloneOrFetch(appId, repoInfo.url, pat);

  // Step 4: Extract full commit graph from Git
  const commits = await gitParserService.parseGitLog(repoPath);
  commitModel.upsertCommits(appId, commits);
  console.log(`Parsed ${commits.length} commits from Git`);

  // Step 5: Analyze branch relationships
  const branchNames = await gitAnalysisService.listBranches(repoPath);
  const uniqueBranches = [...new Set(branchNames)];

  for (const branchName of uniqueBranches) {
    const analysis = await gitAnalysisService.analyzeBranch(repoPath, branchName);
    branchModel.upsertBranch(appId, analysis);
  }
  console.log(`Analyzed ${uniqueBranches.length} branches`);

  // Step 6: Enrich with Mendix API data
  await enrichWithMendixData(appId, pat);

  // Step 7: Detect merge events
  const mergeCommits = commits.filter((c) => c.isMergeCommit);
  for (const mc of mergeCommits) {
    mergeEventModel.upsertMergeEvent(appId, {
      mergeCommitHash: mc.hash,
      mergedBy: mc.authorName,
      mergedDate: mc.date,
      ...parseMergeBranches(mc.message),
    });
  }
  console.log(`Detected ${mergeCommits.length} merge events`);

  // Update last synced timestamp
  appModel.updateLastSynced(appId);

  const result: SyncResult = {
    success: true,
    branchCount: uniqueBranches.length,
    commitCount: commits.length,
    mergeEventCount: mergeCommits.length,
    syncedAt: new Date().toISOString(),
  };

  console.log(`Sync complete for app ${appId}`, result);
  return result;
}

/**
 * Enrich branches and commits with Mendix API metadata.
 */
async function enrichWithMendixData(appId: string, pat: string): Promise<void> {
  try {
    const mendixBranches = await mendixApiService.getAllBranches(appId, pat);

    for (const branch of mendixBranches) {
      branchModel.updateBranchMendixData(appId, branch.name, {
        mendixVersion: branch.latestCommit.mendixVersion,
        latestCommitHash: branch.latestCommit.id,
        latestCommitDate: branch.latestCommit.date,
      });

      try {
        const mendixCommits = await mendixApiService.getBranchCommits(appId, branch.name, pat);
        for (const commit of mendixCommits) {
          commitModel.enrichCommit(appId, commit.id, {
            mendixVersion: commit.mendixVersion,
            relatedStories: commit.relatedStories?.map((s) => s.id) || [],
          });
        }
      } catch (err) {
        console.warn(`Failed to enrich commits for branch ${branch.name}:`, err);
      }
    }

    console.log(`Enriched ${mendixBranches.length} branches with Mendix data`);
  } catch (err) {
    console.warn('Failed to enrich with Mendix API data:', err);
  }
}

/**
 * Try to extract source/target branch names from a merge commit message.
 */
function parseMergeBranches(message: string): {
  sourceBranch?: string;
  targetBranch?: string;
} {
  const mergedInto = message.match(/[Mm]erged?\s+(\S+)\s+into\s+(\S+)/);
  if (mergedInto) {
    return { sourceBranch: mergedInto[1], targetBranch: mergedInto[2] };
  }

  const mergeBranch = message.match(/[Mm]erge\s+branch\s+'([^']+)'/);
  if (mergeBranch) {
    return { sourceBranch: mergeBranch[1] };
  }

  return {};
}
