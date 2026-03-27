import type { Commit } from '../../types/app.types';
import CommitItem from './CommitItem';

interface CommitListProps {
  commits: Commit[];
}

export default function CommitList({ commits }: CommitListProps) {
  if (commits.length === 0) {
    return <p className="text-sm text-gray-500 py-4">No commits found</p>;
  }

  return (
    <div className="max-h-96 overflow-y-auto">
      {commits.map((commit) => (
        <CommitItem key={commit.hash} commit={commit} />
      ))}
    </div>
  );
}
