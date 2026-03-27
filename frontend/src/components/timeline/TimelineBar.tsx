import type { Branch } from '../../types/app.types';
import BranchTypeIcon from '../branches/BranchTypeIcon';

interface TimelineBarProps {
  branch: Branch;
  startX: number;
  width: number;
  onClick: (branch: Branch) => void;
}

const typeColors: Record<string, string> = {
  main: 'bg-branch-main',
  feature: 'bg-branch-feature',
  release: 'bg-branch-release',
  hotfix: 'bg-branch-hotfix',
  development: 'bg-branch-development',
  unknown: 'bg-branch-unknown',
};

export default function TimelineBar({ branch, startX, width, onClick }: TimelineBarProps) {
  const colorClass = typeColors[branch.type || 'unknown'] || typeColors.unknown;
  const isActive = !branch.isMerged;

  return (
    <div className="flex items-center gap-3 py-1.5 group">
      <div className="w-40 flex-shrink-0 flex items-center gap-2">
        <BranchTypeIcon type={branch.type} />
        <span className="text-xs text-gray-700 truncate">{branch.name}</span>
      </div>
      <div className="relative flex-1 h-5">
        <div
          className={`absolute top-0 h-full rounded-full cursor-pointer transition-opacity hover:opacity-80 ${colorClass} ${
            isActive ? '' : 'opacity-60'
          }`}
          style={{
            left: startX,
            width: Math.max(width, 4),
          }}
          onClick={() => onClick(branch)}
          title={`${branch.name}: ${branch.createdDate || '?'} — ${branch.latestCommitDate || 'active'}`}
        >
          {!isActive && (
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-white border-2 border-gray-400" />
          )}
        </div>
      </div>
    </div>
  );
}
