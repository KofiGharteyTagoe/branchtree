import simpleGit from 'simple-git';
import type { BranchAnalysis, BranchType } from '../types/git.types.js';

/**
 * Get the fork point where a branch diverged from main.
 */
export async function getForkPoint(
  repoPath: string,
  branchName: string
): Promise<string | null> {
  const git = simpleGit(repoPath);
  try {
    const result = await git.raw(['merge-base', 'main', branchName]);
    return result.trim() || null;
  } catch {
    return null;
  }
}

/**
 * Get how many commits a branch is ahead/behind main.
 */
export async function getDivergence(
  repoPath: string,
  branchName: string
): Promise<{ ahead: number; behind: number }> {
  const git = simpleGit(repoPath);
  try {
    const ahead = parseInt(
      (await git.raw(['rev-list', '--count', `main..${branchName}`])).trim(),
      10
    );
    const behind = parseInt(
      (await git.raw(['rev-list', '--count', `${branchName}..main`])).trim(),
      10
    );
    return { ahead: ahead || 0, behind: behind || 0 };
  } catch {
    return { ahead: 0, behind: 0 };
  }
}

/**
 * Check if a branch has been merged into main.
 */
export async function isBranchMerged(
  repoPath: string,
  branchName: string
): Promise<boolean> {
  const git = simpleGit(repoPath);
  try {
    const containing = await git.raw(['branch', '-a', '--contains', branchName]);
    return containing.includes('main');
  } catch {
    return false;
  }
}

/**
 * Get the first unique commit on a branch (to determine who created it).
 */
export async function getFirstUniqueCommit(
  repoPath: string,
  forkPoint: string,
  branchName: string
): Promise<{ hash: string; author: string; date: string } | null> {
  const git = simpleGit(repoPath);
  try {
    const output = await git.raw([
      'log',
      `${forkPoint}..${branchName}`,
      '--reverse',
      '--format=%H\x00%an\x00%aI',
      '--first-parent',
    ]);

    if (!output || !output.trim()) return null;

    const firstLine = output.trim().split('\n')[0];
    const [hash, author, date] = firstLine.split('\x00');
    return { hash, author, date };
  } catch {
    return null;
  }
}

/**
 * List all branch names from a bare repo.
 */
export async function listBranches(repoPath: string): Promise<string[]> {
  const git = simpleGit(repoPath);
  try {
    const output = await git.raw(['branch', '-a', '--format=%(refname:short)']);
    return output
      .trim()
      .split('\n')
      .filter(Boolean)
      .map((name) => name.replace(/^origin\//, ''));
  } catch {
    return [];
  }
}

/**
 * Classify a branch by its naming convention.
 */
export function classifyBranch(name: string): BranchType {
  const lower = name.toLowerCase();
  if (lower === 'main' || lower === 'trunk' || lower === 'master') return 'main';
  if (lower.startsWith('feature') || lower.startsWith('feat')) return 'feature';
  if (lower.startsWith('release')) return 'release';
  if (lower.startsWith('hotfix') || lower.startsWith('fix')) return 'hotfix';
  if (lower.startsWith('develop') || lower === 'dev') return 'development';
  return 'unknown';
}

/**
 * Perform full analysis of a single branch.
 */
export async function analyzeBranch(
  repoPath: string,
  branchName: string
): Promise<BranchAnalysis> {
  const forkPointCommit = await getForkPoint(repoPath, branchName);
  const divergence = await getDivergence(repoPath, branchName);
  const merged = await isBranchMerged(repoPath, branchName);

  let firstUniqueCommit = null;
  if (forkPointCommit) {
    firstUniqueCommit = await getFirstUniqueCommit(repoPath, forkPointCommit, branchName);
  }

  return {
    name: branchName,
    forkPointCommit,
    forkedFromBranch: 'main',
    firstUniqueCommit,
    commitsAhead: divergence.ahead,
    commitsBehind: divergence.behind,
    isMerged: merged,
    branchType: classifyBranch(branchName),
  };
}
