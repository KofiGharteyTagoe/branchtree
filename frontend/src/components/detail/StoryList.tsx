import { ExternalLink } from 'lucide-react';
import type { Commit } from '../../types/app.types';

interface StoryListProps {
  commits: Commit[];
}

export default function StoryList({ commits }: StoryListProps) {
  const storyIds = [
    ...new Set(
      commits.flatMap((c) => {
        const stories = c.providerMetadata?.relatedStories as string[] | undefined;
        return stories || [];
      }),
    ),
  ];

  if (storyIds.length === 0) {
    return <p className="text-sm text-gray-400">No related stories or issues</p>;
  }

  return (
    <div className="space-y-1.5">
      {storyIds.map((id) => (
        <div
          key={id}
          className="flex items-center gap-2.5 text-sm py-1.5 px-3 rounded-lg hover:bg-surface-50 transition-colors group"
        >
          <div className="w-2 h-2 bg-brand-400 rounded-full flex-shrink-0" />
          <span className="text-gray-700 font-medium">Story #{id}</span>
          <ExternalLink className="w-3 h-3 text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      ))}
    </div>
  );
}
