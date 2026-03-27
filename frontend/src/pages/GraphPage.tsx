import { useState } from 'react';
import { useGraph } from '../hooks/useGraph';
import BranchGraph from '../components/graph/BranchGraph';
import BranchDetailPanel from '../components/detail/BranchDetailPanel';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorMessage from '../components/common/ErrorMessage';
import EmptyState from '../components/common/EmptyState';
import type { Branch } from '../types/app.types';

interface GraphPageProps {
  appId: string;
}

export default function GraphPage({ appId }: GraphPageProps) {
  const { data, isLoading, error, refetch } = useGraph(appId);
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);

  if (isLoading) return <LoadingSpinner message="Loading branch graph..." />;
  if (error) return <ErrorMessage message={error.message} onRetry={() => refetch()} />;
  if (!data || data.nodes.length === 0) {
    return (
      <EmptyState
        title="No Graph Data"
        description="Sync the app first to load branch and commit data."
      />
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-gray-900">Branch Graph</h2>

      <BranchGraph
        data={data}
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
