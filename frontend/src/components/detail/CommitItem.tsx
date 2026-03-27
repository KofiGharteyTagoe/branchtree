import type { Commit } from '../../types/app.types';

interface CommitItemProps {
  commit: Commit;
}

export default function CommitItem({ commit }: CommitItemProps) {
  return (
    <div className="flex gap-3 py-2 border-b border-gray-100 last:border-0">
      <div className="flex-shrink-0 mt-1">
        <div
          className={`w-2.5 h-2.5 rounded-full ${
            commit.isMergeCommit ? 'bg-yellow-400' : 'bg-mendix-blue'
          }`}
        />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-900 truncate">{commit.message}</p>
        <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-500">
          <span className="font-mono">{commit.hash.substring(0, 7)}</span>
          <span>&middot;</span>
          <span>{commit.authorName}</span>
          <span>&middot;</span>
          <span>{commit.date ? new Date(commit.date).toLocaleDateString() : ''}</span>
        </div>
        {commit.mendixVersion && (
          <span className="text-xs text-gray-400 mt-0.5 block">
            Mx {commit.mendixVersion}
          </span>
        )}
      </div>
    </div>
  );
}
