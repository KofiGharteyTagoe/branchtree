import { useState } from 'react';
import { GitMerge } from 'lucide-react';
import type { Commit } from '../../types/app.types';

interface CommitNodeProps {
  commit: Commit;
}

export default function CommitNode({ commit }: CommitNodeProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  const version = (commit.providerMetadata?.mendixVersion || commit.providerMetadata?.version) as string | undefined;
  const stories = (commit.providerMetadata?.relatedStories || []) as string[];

  return (
    <div
      className="relative inline-block"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <div
        className={`w-3 h-3 rounded-full border-2 cursor-pointer transition-transform hover:scale-150 ${
          commit.isMergeCommit
            ? 'bg-amber-400 border-amber-200'
            : 'bg-brand-400 border-brand-200'
        }`}
      />

      {showTooltip && (
        <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-72 bg-white rounded-2xl shadow-elevated border border-surface-200/60 p-4 text-xs animate-scale-in">
          <div className="font-mono text-gray-400 mb-1.5">
            {commit.hash.substring(0, 8)}
          </div>
          <div className="font-medium text-gray-900 mb-1.5">{commit.message}</div>
          <div className="text-gray-500">
            {commit.authorName} &middot;{' '}
            {commit.date ? new Date(commit.date).toLocaleString() : 'Unknown'}
          </div>
          {version && (
            <div className="text-gray-400 mt-1.5">v{version}</div>
          )}
          {stories.length > 0 && (
            <div className="text-gray-400 mt-1.5">
              Stories: {stories.join(', ')}
            </div>
          )}
          {commit.isMergeCommit && (
            <div className="flex items-center gap-1 text-amber-600 mt-1.5 font-medium">
              <GitMerge className="w-3 h-3" />
              Merge commit
            </div>
          )}
        </div>
      )}
    </div>
  );
}
