import type { Commit } from '../../types/app.types';

interface ContributorListProps {
  commits: Commit[];
}

export default function ContributorList({ commits }: ContributorListProps) {
  // Count commits per author
  const authorCounts = new Map<string, number>();
  for (const commit of commits) {
    if (commit.authorName) {
      authorCounts.set(
        commit.authorName,
        (authorCounts.get(commit.authorName) || 0) + 1
      );
    }
  }

  const sorted = [...authorCounts.entries()].sort((a, b) => b[1] - a[1]);

  if (sorted.length === 0) {
    return <p className="text-sm text-gray-500">No contributors found</p>;
  }

  return (
    <div className="space-y-2">
      {sorted.map(([name, count]) => (
        <div key={name} className="flex items-center justify-between text-sm">
          <span className="text-gray-700">{name}</span>
          <span className="text-gray-400">{count} commits</span>
        </div>
      ))}
    </div>
  );
}
