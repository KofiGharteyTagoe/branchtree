import simpleGit from 'simple-git';
import fs from 'fs';
import path from 'path';
import { config } from '../config/env.js';
import { logger } from '../utils/logger.js';
import type { GitProvider } from '../types/provider.types.js';

/**
 * Returns the local bare repo path for a given app.
 */
function getRepoPath(appId: string): string {
  return path.join(config.dataDir, 'repos', appId);
}

/**
 * Clone a Git repo as a bare clone, or fetch updates if it already exists.
 * Uses the provider to build the correct authenticated URL.
 *
 * @param appId - The app identifier
 * @param repoUrl - The Git repository URL
 * @param credentials - The authentication token/PAT
 * @param provider - The Git provider (determines auth URL format)
 *
 * IMPORTANT: This is a READ-ONLY bare clone. Never modify it.
 */
export async function cloneOrFetch(
  appId: string,
  repoUrl: string,
  credentials: string,
  provider: GitProvider,
): Promise<string> {
  const repoPath = getRepoPath(appId);

  const gitEnv = {
    GIT_TERMINAL_PROMPT: '0',
  };

  // Build the authenticated URL using the provider's auth format
  const authedUrl = credentials ? provider.buildAuthUrl(repoUrl, credentials) : repoUrl;

  if (!fs.existsSync(repoPath)) {
    const parentDir = path.dirname(repoPath);
    if (!fs.existsSync(parentDir)) {
      fs.mkdirSync(parentDir, { recursive: true });
    }

    logger.info(`Cloning bare repo for app ${appId}...`);
    try {
      const git = simpleGit({ baseDir: undefined }).env(gitEnv);
      await git.clone(authedUrl, repoPath, ['--bare']);
      logger.info(`Bare clone complete: ${repoPath}`);
    } catch (err) {
      throw sanitizeGitError(err, credentials);
    }
  } else {
    logger.info(`Fetching updates for app ${appId}...`);
    try {
      const git = simpleGit(repoPath).env(gitEnv);
      await git.remote(['set-url', 'origin', authedUrl]);
      await git.fetch(['--all', '--prune']);
      logger.info(`Fetch complete for app ${appId}`);
    } catch (err) {
      throw sanitizeGitError(err, credentials);
    }
  }

  return repoPath;
}

/**
 * Remove credentials from any error messages/stacks to prevent credential leakage.
 */
function sanitizeGitError(err: unknown, credentials: string): Error {
  if (err instanceof Error) {
    const sanitized = new Error(
      credentials ? err.message.replaceAll(credentials, '***REDACTED***') : err.message,
    );
    sanitized.stack = credentials
      ? err.stack?.replaceAll(credentials, '***REDACTED***')
      : err.stack;
    return sanitized;
  }
  return new Error('Git operation failed');
}
