import simpleGit from 'simple-git';
import type { ParsedCommit } from '../types/git.types.js';

// Use unit separator as delimiter to avoid conflicts with commit messages
// Note: \x00 (null byte) is rejected by Node.js in process arguments
const DELIMITER = '\x1f';
const FORMAT = ['%H', '%P', '%an', '%ae', '%aI', '%s', '%D'].join(DELIMITER);

/**
 * Parse the full commit log from a bare Git repository.
 * Returns all commits with parent references for graph construction.
 */
export async function parseGitLog(repoPath: string): Promise<ParsedCommit[]> {
  const git = simpleGit(repoPath);

  const logOutput = await git.raw(['log', '--all', `--format=${FORMAT}`]);

  if (!logOutput || !logOutput.trim()) {
    return [];
  }

  const lines = logOutput.trim().split('\n');
  const commits: ParsedCommit[] = [];

  for (const line of lines) {
    if (!line.trim()) continue;

    const parts = line.split(DELIMITER);
    if (parts.length < 6) {
      console.warn(`Skipping malformed git log line: ${line.substring(0, 80)}...`);
      continue;
    }

    const [hash, parents, authorName, authorEmail, date, message, refs] = parts;
    const parentList = parents ? parents.split(' ').filter(Boolean) : [];

    commits.push({
      hash,
      parentHashes: parentList,
      isMergeCommit: parentList.length > 1,
      authorName,
      authorEmail,
      date,
      message: message || '',
      refs: refs || null,
    });
  }

  return commits;
}
