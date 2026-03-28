import { useState } from 'react';
import { useBranches } from '../hooks/useBranches';
import TimelineChart from '../components/timeline/TimelineChart';
import BranchDetailPanel from '../components/detail/BranchDetailPanel';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorMessage from '../components/common/ErrorMessage';
import EmptyState from '../components/common/EmptyState';
import type { Branch } from '../types/app.types';

interface TimelinePageProps {
  appId: string;
}

export default function TimelinePage({ appId }: TimelinePageProps) {
  const { data, isLoading, error, refetch } = useBranches(appId);
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);

  if (isLoading) return <LoadingSpinner message="Loading timeline..." />;
  if (error) return <ErrorMessage message={error.message} onRetry={() => refetch()} />;

  const branches = data?.branches || [];

  if (branches.length === 0) {
    return (
      <EmptyState
        title="No Timeline Data"
        description="Sync the app first to load branch data for the timeline."
      />
    );
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Branch Timeline</h2>
        <p className="text-sm text-gray-500 mt-0.5">
          Horizontal view of branch lifetimes. Click a branch to see details.
        </p>
      </div>

      <TimelineChart
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
