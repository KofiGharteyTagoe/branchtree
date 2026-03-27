import type { Branch } from '../../types/app.types';

interface MergeReadinessProps {
  branch: Branch;
}

export default function MergeReadiness({ branch }: MergeReadinessProps) {
  if (branch.isMerged) {
    return (
      <div className="bg-gray-50 rounded-lg p-3">
        <span className="text-sm text-gray-600">This branch has been merged.</span>
      </div>
    );
  }

  // Calculate a simple readiness score
  const issues: string[] = [];
  let score = 100;

  if (branch.commitsBehind > 0) {
    score -= Math.min(branch.commitsBehind * 2, 40);
    issues.push(`${branch.commitsBehind} commits behind main`);
  }

  if (branch.isStale) {
    score -= 30;
    issues.push('Branch is stale (no recent activity)');
  }

  if (branch.mendixVersion) {
    // Can't check version mismatch without main branch version here
    // This is a simplified check
  }

  score = Math.max(score, 0);

  const colorClass =
    score >= 80
      ? 'text-green-600 bg-green-50'
      : score >= 50
        ? 'text-yellow-600 bg-yellow-50'
        : 'text-red-600 bg-red-50';

  return (
    <div className={`rounded-lg p-3 ${colorClass}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium">Merge Readiness</span>
        <span className="text-lg font-bold">{score}%</span>
      </div>
      {issues.length > 0 && (
        <ul className="text-xs space-y-1">
          {issues.map((issue, i) => (
            <li key={i}>- {issue}</li>
          ))}
        </ul>
      )}
      {issues.length === 0 && (
        <p className="text-xs">Ready to merge</p>
      )}
    </div>
  );
}
