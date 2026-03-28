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
    <div className="flex items-center gap-3 py-1.5 group hover:bg-surface-50 rounded-lg px-1 transition-colors">
      <div className="w-40 flex-shrink-0 flex items-center gap-2">
        <BranchTypeIcon type={branch.type} />
        <span className="text-xs text-gray-600 truncate font-medium">{branch.name}</span>
      </div>
      <div className="relative flex-1 h-6">
        <div
          className={`absolute top-0.5 h-5 rounded-lg cursor-pointer transition-all duration-200 hover:shadow-soft hover:scale-y-110 ${colorClass} ${
            isActive ? '' : 'opacity-50'
          }`}
          style={{
            left: startX,
            width: Math.max(width, 6),
          }}
          onClick={() => onClick(branch)}
          title={`${branch.name}: ${branch.createdDate || '?'} — ${branch.latestCommitDate || 'active'}`}
        >
          {!isActive && (
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-white border-2 border-gray-300" />
          )}
        </div>
      </div>
    </div>
  );
}
