import { useState } from 'react';
import { useBranches } from '../hooks/useBranches';
import BranchTable from '../components/branches/BranchTable';
import BranchDetailPanel from '../components/detail/BranchDetailPanel';
import AlertBanner from '../components/alerts/AlertBanner';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorMessage from '../components/common/ErrorMessage';
import EmptyState from '../components/common/EmptyState';
import type { Branch } from '../types/app.types';

interface BranchListPageProps {
  appId: string;
}

export default function BranchListPage({ appId }: BranchListPageProps) {
  const { data, isLoading, error, refetch } = useBranches(appId);
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);

  if (isLoading) return <LoadingSpinner message="Loading branches..." />;
  if (error) return <ErrorMessage message={error.message} onRetry={() => refetch()} />;

  const branches = data?.branches || [];
  const alerts = data?.alerts || [];

  if (branches.length === 0) {
    return (
      <EmptyState
        title="No Branches"
        description="Sync the app first to load branch data from the repository."
      />
    );
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Branches</h2>
        <p className="text-sm text-gray-500 mt-0.5">Browse and inspect all branches in your repository</p>
      </div>

      <AlertBanner alerts={alerts} />

      <BranchTable
        branches={branches}
        onBranchClick={(branch) => setSelectedBranch(branch)}
      />

      {selectedBranch && (
        <BranchDetailPanel
          appId={appId}
          branch={selectedBranch}
          onClose={() => setSelectedBranch(null)}
        />
      )}
    </div>
  );
}
