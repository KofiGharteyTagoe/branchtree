import { GitMerge } from 'lucide-react';
import type { Commit } from '../../types/app.types';

interface CommitItemProps {
  commit: Commit;
}

export default function CommitItem({ commit }: CommitItemProps) {
  const version = (commit.providerMetadata?.mendixVersion || commit.providerMetadata?.version) as string | undefined;

  return (
    <div className="flex gap-3 py-2.5 border-b border-surface-100 last:border-0 group">
      <div className="flex-shrink-0 mt-1.5 relative">
        <div
          className={`w-3 h-3 rounded-full border-2 transition-transform duration-150 group-hover:scale-125 ${
            commit.isMergeCommit
              ? 'bg-amber-400 border-amber-200'
              : 'bg-brand-400 border-brand-200'
          }`}
        />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          {commit.isMergeCommit && <GitMerge className="w-3 h-3 text-amber-500 flex-shrink-0" />}
          <p className="text-sm text-gray-900 truncate">{commit.message}</p>
        </div>
        <div className="flex items-center gap-2 mt-1 text-xs text-gray-400">
          <span className="font-mono bg-surface-50 px-1.5 py-0.5 rounded text-gray-500">{commit.hash.substring(0, 7)}</span>
          <span>{commit.authorName}</span>
          <span>{commit.date ? new Date(commit.date).toLocaleDateString() : ''}</span>
        </div>
        {version && (
          <span className="text-xs text-gray-400 mt-1 block">
            v{version}
          </span>
        )}
      </div>
    </div>
  );
}
