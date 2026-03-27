import Badge from '../common/Badge';
import type { BranchType } from '../../types/app.types';

interface BranchTypeIconProps {
  type: string | null;
}

const typeConfig: Record<BranchType, { label: string; color: 'blue' | 'green' | 'orange' | 'red' | 'purple' | 'gray' }> = {
  main: { label: 'Main', color: 'blue' },
  feature: { label: 'Feature', color: 'green' },
  release: { label: 'Release', color: 'orange' },
  hotfix: { label: 'Hotfix', color: 'red' },
  development: { label: 'Dev', color: 'purple' },
  unknown: { label: 'Other', color: 'gray' },
};

export default function BranchTypeIcon({ type }: BranchTypeIconProps) {
  const config = typeConfig[(type as BranchType) || 'unknown'] || typeConfig.unknown;
  return <Badge label={config.label} color={config.color} />;
}
