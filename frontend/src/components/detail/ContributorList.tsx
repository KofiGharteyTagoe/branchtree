import type { Commit } from '../../types/app.types';

interface ContributorListProps {
  commits: Commit[];
}

const AVATAR_COLORS = [
  'bg-brand-100 text-brand-700',
  'bg-emerald-100 text-emerald-700',
  'bg-amber-100 text-amber-700',
  'bg-rose-100 text-rose-700',
  'bg-violet-100 text-violet-700',
  'bg-cyan-100 text-cyan-700',
];

export default function ContributorList({ commits }: ContributorListProps) {
  const authorCounts = new Map<string, number>();
  for (const commit of commits) {
    if (commit.authorName) {
      authorCounts.set(commit.authorName, (authorCounts.get(commit.authorName) || 0) + 1);
    }
  }

  const sorted = [...authorCounts.entries()].sort((a, b) => b[1] - a[1]);

  if (sorted.length === 0) {
    return <p className="text-sm text-gray-400">No contributors found</p>;
  }

  return (
    <div className="space-y-2">
      {sorted.map(([name, count], i) => (
        <div key={name} className="flex items-center gap-3 py-1">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${AVATAR_COLORS[i % AVATAR_COLORS.length]}`}
          >
            {name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-sm font-medium text-gray-700 truncate block">{name}</span>
          </div>
          <span className="text-xs font-medium text-gray-400 bg-surface-50 px-2 py-0.5 rounded-lg">
            {count} commits
          </span>
        </div>
      ))}
    </div>
  );
}
