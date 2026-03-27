import Badge from '../common/Badge';
import type { Branch } from '../../types/app.types';

interface BranchStatusBadgeProps {
  branch: Branch;
}

export default function BranchStatusBadge({ branch }: BranchStatusBadgeProps) {
  if (branch.isMerged) {
    return <Badge label="Merged" color="gray" />;
  }
  if (branch.isStale) {
    return <Badge label="Stale" color="red" />;
  }
  if (branch.commitsBehind > 20) {
    return <Badge label="Diverged" color="yellow" />;
  }
  return <Badge label="Active" color="green" />;
}
