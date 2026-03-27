import type { Commit } from '../../types/app.types';

interface StoryListProps {
  commits: Commit[];
}

export default function StoryList({ commits }: StoryListProps) {
  // Collect unique story IDs from all commits
  const storyIds = [...new Set(commits.flatMap((c) => c.relatedStories))];

  if (storyIds.length === 0) {
    return <p className="text-sm text-gray-500">No related user stories</p>;
  }

  return (
    <div className="space-y-1">
      {storyIds.map((id) => (
        <div
          key={id}
          className="flex items-center gap-2 text-sm text-gray-700 py-1"
        >
          <span className="w-2 h-2 bg-mendix-blue rounded-full flex-shrink-0" />
          <span>Story #{id}</span>
        </div>
      ))}
    </div>
  );
}
