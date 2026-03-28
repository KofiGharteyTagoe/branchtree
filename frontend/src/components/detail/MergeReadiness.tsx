import { Shield, CheckCircle2, AlertTriangle } from 'lucide-react';
import type { Branch } from '../../types/app.types';

interface MergeReadinessProps {
  branch: Branch;
}

export default function MergeReadiness({ branch }: MergeReadinessProps) {
  if (branch.isMerged) {
    return (
      <div className="bg-surface-50 rounded-xl p-4 border border-surface-200/60 flex items-center gap-3">
        <CheckCircle2 className="w-5 h-5 text-gray-400" />
        <span className="text-sm text-gray-500">This branch has been merged.</span>
      </div>
    );
  }

  const issues: string[] = [];
  let score = 100;

  if (branch.commitsBehind > 0) {
    const divergencePenalty = Math.min(branch.commitsBehind * 0.8, 40);
    score -= divergencePenalty;
    issues.push(`${branch.commitsBehind} commits behind main`);
  }

  if (branch.isStale) {
    score -= 25;
    issues.push('Branch is stale (no recent activity)');
  }

  if (branch.createdDate) {
    const daysSinceCreation = Math.floor(
      (Date.now() - new Date(branch.createdDate).getTime()) / (24 * 60 * 60 * 1000)
    );
    const agePenalty = Math.min((daysSinceCreation / 60) * 10, 10);
    score -= agePenalty;
    if (daysSinceCreation > 30) {
      issues.push(`Branch is ${daysSinceCreation} days old`);
    }
  }

  score = Math.max(Math.round(score), 0);

  const colors =
    score >= 80
      ? { bg: 'bg-emerald-50', border: 'border-emerald-200/60', text: 'text-emerald-700', bar: 'bg-emerald-500', icon: 'text-emerald-500' }
      : score >= 50
        ? { bg: 'bg-amber-50', border: 'border-amber-200/60', text: 'text-amber-700', bar: 'bg-amber-500', icon: 'text-amber-500' }
        : { bg: 'bg-red-50', border: 'border-red-200/60', text: 'text-red-700', bar: 'bg-red-500', icon: 'text-red-500' };

  return (
    <div className={`${colors.bg} ${colors.border} border rounded-xl p-4`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Shield className={`w-4 h-4 ${colors.icon}`} />
          <span className={`text-sm font-semibold ${colors.text}`}>Merge Readiness</span>
        </div>
        <span className={`text-2xl font-bold ${colors.text}`}>{score}%</span>
      </div>

      <div className="w-full bg-white/60 rounded-full h-2 mb-3">
        <div
          className={`h-2 rounded-full ${colors.bar} transition-all duration-700 ease-out`}
          style={{ width: `${score}%` }}
        />
      </div>

      {issues.length > 0 ? (
        <div className="space-y-1.5">
          {issues.map((issue, i) => (
            <div key={i} className="flex items-center gap-2 text-xs">
              <AlertTriangle className={`w-3 h-3 ${colors.icon} flex-shrink-0`} />
              <span className={colors.text}>{issue}</span>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex items-center gap-2 text-xs">
          <CheckCircle2 className={`w-3 h-3 ${colors.icon}`} />
          <span className={colors.text}>Ready to merge</span>
        </div>
      )}
    </div>
  );
}
