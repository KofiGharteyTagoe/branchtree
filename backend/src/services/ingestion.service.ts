import * as appModel from '../models/app.model.js';
import * as branchModel from '../models/branch.model.js';
import * as commitModel from '../models/commit.model.js';
import * as mergeEventModel from '../models/mergeEvent.model.js';
import * as gitCloneService from './gitClone.service.js';
import * as gitParserService from './gitParser.service.js';
import * as gitAnalysisService from './gitAnalysis.service.js';
import { getProvider } from '../providers/index.js';
import { flushDatabase } from '../config/database.js';
import { logger } from '../utils/logger.js';
import type { SyncResult } from '../types/api.types.js';

/**
 * Full sync pipeline for an app.
 *
 * Steps:
 * 1. Get credentials and provider from database
 * 2. Resolve the repo URL (provider-specific: API call or direct)
 * 3. Clone or fetch bare repo
 * 4. Extract commit graph from Git
 * 5. Analyze branch relationships
 * 6. Enrich with provider-specific data (if supported)
 * 7. Detect merge events
 */
export async function syncApp(appId: string): Promise<SyncResult> {
  logger.info(`Starting sync for app ${appId}...`);

  // Step 1: Get credentials and provider type
  const pat = appModel.getAppPat(appId);
  if (!pat) {
    throw new Error(
      'No PAT/credentials configured for this app. Update the app with valid credentials.',
    );
  }

  const providerType = appModel.getAppProviderType(appId);
  if (!providerType) {
    throw new Error('App not found');
  }
  const provider = getProvider(providerType);

  // Step 2: Resolve the repo URL
  const app = appModel.getApp(appId);
  let repoUrl = app?.repo_url;

  if (!repoUrl && provider.getRepoUrl) {
    // Provider needs to fetch the URL (e.g., Mendix API)
    const repoInfo = await provider.getRepoUrl(appId, pat);
    repoUrl = repoInfo.url;
    appModel.updateAppRepoInfo(appId, repoInfo.url, repoInfo.type);
    logger.info(`Repo URL resolved: ${repoUrl}`);
  }

  if (!repoUrl) {
    throw new Error(
      'No repository URL configured. Please provide a repo URL or ensure the provider can resolve it.',
    );
  }

  // Step 3: Clone or fetch bare repo
  const repoPath = await gitCloneService.cloneOrFetch(appId, repoUrl, pat, provider);

  // Step 4: Extract full commit graph from Git
  const commits = await gitParserService.parseGitLog(repoPath);
  commitModel.upsertCommits(appId, commits);
  logger.info(`Parsed ${commits.length} commits from Git`);

  // Step 5: Analyze branch relationships
  const branchNames = await gitAnalysisService.listBranches(repoPath);
  const uniqueBranches = [...new Set(branchNames)];

  for (const branchName of uniqueBranches) {
    const analysis = await gitAnalysisService.analyzeBranch(repoPath, branchName);
    branchModel.upsertBranch(appId, analysis);
  }
  logger.info(`Analyzed ${uniqueBranches.length} branches`);

  // Step 6: Enrich with provider-specific data (if supported)
  await enrichWithProviderData(appId, pat, provider);

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
  logger.info(`Detected ${mergeCommits.length} merge events`);

  // Update last synced timestamp
  appModel.updateLastSynced(appId);

  const result: SyncResult = {
    success: true,
    branchCount: uniqueBranches.length,
    commitCount: commits.length,
    mergeEventCount: mergeCommits.length,
    syncedAt: new Date().toISOString(),
  };

  // Flush all pending database writes to disk after batch operations
  flushDatabase();

  logger.info({ result }, `Sync complete for app ${appId}`);
  return result;
}

/**
 * Enrich branches and commits with provider-specific metadata.
 * Only runs if the provider supports enrichment. Failures are logged but don't fail the sync.
 */
async function enrichWithProviderData(
  appId: string,
  credentials: string,
  provider: import('../types/provider.types.js').GitProvider,
): Promise<void> {
  // Enrich branches
  if (provider.enrichBranches) {
    try {
      const branchMetadata = await provider.enrichBranches(appId, credentials);
      for (const meta of branchMetadata) {
        branchModel.updateBranchProviderData(appId, meta.branchName, {
          latestCommitHash: meta.latestCommitHash,
          latestCommitDate: meta.latestCommitDate,
          providerMetadata: meta.providerMetadata,
        });
      }
      logger.info(`Enriched ${branchMetadata.length} branches with ${provider.displayName} data`);
    } catch (err) {
      logger.warn({ err }, `Failed to enrich branches with ${provider.displayName} data`);
    }
  }

  // Enrich commits per branch
  if (provider.enrichCommits) {
    const branches = branchModel.getBranches(appId);
    for (const branch of branches) {
      try {
        const commitMetadata = await provider.enrichCommits(appId, branch.name, credentials);
        for (const meta of commitMetadata) {
          commitModel.enrichCommit(appId, meta.commitHash, meta.providerMetadata);
        }
      } catch (err) {
        logger.warn({ err }, `Failed to enrich commits for branch ${branch.name}`);
      }
    }
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
