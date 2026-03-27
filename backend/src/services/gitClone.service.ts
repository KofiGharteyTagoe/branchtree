import simpleGit from 'simple-git';
import fs from 'fs';
import path from 'path';
import { config } from '../config/env.js';

/**
 * Returns the local bare repo path for a given app.
 */
function getRepoPath(appId: string): string {
  return path.join(config.dataDir, 'repos', appId);
}

/**
 * Clone a Mendix Team Server repo as a bare clone, or fetch updates
 * if it already exists. Returns the path to the bare repo.
 *
 * @param appId - The Mendix app ID
 * @param repoUrl - The Git repository URL
 * @param pat - The Personal Access Token for this app
 *
 * IMPORTANT: This is a READ-ONLY bare clone. Never modify it.
 */
export async function cloneOrFetch(appId: string, repoUrl: string, pat: string): Promise<string> {
  const repoPath = getRepoPath(appId);

  const gitEnv = {
    GIT_TERMINAL_PROMPT: '0',
  };

  // Build the authenticated URL by direct string replacement (no URL encoding)
  const authedUrl = buildAuthUrl(repoUrl, pat);

  if (!fs.existsSync(repoPath)) {
    const parentDir = path.dirname(repoPath);
    if (!fs.existsSync(parentDir)) {
      fs.mkdirSync(parentDir, { recursive: true });
    }

    console.log(`Cloning bare repo for app ${appId}...`);
    try {
      const git = simpleGit({ baseDir: undefined }).env(gitEnv);
      await git.clone(authedUrl, repoPath, ['--bare']);
      console.log(`Bare clone complete: ${repoPath}`);
    } catch (err) {
      throw sanitizeGitError(err, pat);
    }
  } else {
    console.log(`Fetching updates for app ${appId}...`);
    try {
      const git = simpleGit(repoPath).env(gitEnv);
      await git.remote(['set-url', 'origin', authedUrl]);
      await git.fetch(['--all', '--prune']);
      console.log(`Fetch complete for app ${appId}`);
    } catch (err) {
      throw sanitizeGitError(err, pat);
    }
  }

  return repoPath;
}

/**
 * Build authenticated URL by direct string insertion.
 * Does NOT use `new URL()` which would URL-encode special characters
 * in the PAT and break authentication.
 */
function buildAuthUrl(repoUrl: string, pat: string): string {
  return repoUrl.replace('https://', `https://MxToken:${pat}@`);
}

/**
 * Remove PAT from any error messages/stacks to prevent credential leakage.
 */
function sanitizeGitError(err: unknown, pat: string): Error {
  if (err instanceof Error) {
    const sanitized = new Error(
      err.message.replaceAll(pat, '***PAT_REDACTED***')
    );
    sanitized.stack = err.stack?.replaceAll(pat, '***PAT_REDACTED***');
    return sanitized;
  }
  return new Error('Git operation failed');
}
