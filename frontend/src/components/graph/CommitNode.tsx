import { useState } from 'react';
import type { Commit } from '../../types/app.types';

interface CommitNodeProps {
  commit: Commit;
}

export default function CommitNode({ commit }: CommitNodeProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div
      className="relative inline-block"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <div
        className={`w-3 h-3 rounded-full border-2 cursor-pointer ${
          commit.isMergeCommit
            ? 'bg-yellow-400 border-yellow-600'
            : 'bg-mendix-blue border-blue-600'
        }`}
      />

      {showTooltip && (
        <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-72 bg-white rounded-lg shadow-xl border border-gray-200 p-3 text-xs">
          <div className="font-mono text-gray-500 mb-1">
            {commit.hash.substring(0, 8)}
          </div>
          <div className="font-medium text-gray-900 mb-1">{commit.message}</div>
          <div className="text-gray-600">
            {commit.authorName} &middot;{' '}
            {commit.date ? new Date(commit.date).toLocaleString() : 'Unknown'}
          </div>
          {commit.mendixVersion && (
            <div className="text-gray-500 mt-1">
              Mendix {commit.mendixVersion}
            </div>
          )}
          {commit.relatedStories.length > 0 && (
            <div className="text-gray-500 mt-1">
              Stories: {commit.relatedStories.join(', ')}
            </div>
          )}
          {commit.isMergeCommit && (
            <div className="text-yellow-600 mt-1 font-medium">Merge commit</div>
          )}
        </div>
      )}
    </div>
  );
}
