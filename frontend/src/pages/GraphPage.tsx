import { useState, useMemo, useCallback } from 'react';
import { useGraph, useGraphSummary } from '../hooks/useGraph';
import BranchGraph from '../components/graph/BranchGraph';
import TimeRangeSlider from '../components/graph/TimeRangeSlider';
import BranchFilter from '../components/graph/BranchFilter';
import BranchDetailPanel from '../components/detail/BranchDetailPanel';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorMessage from '../components/common/ErrorMessage';
import EmptyState from '../components/common/EmptyState';
import type { Branch } from '../types/app.types';
import type { GraphQueryOptions } from '../types/graph.types';

interface GraphPageProps {
  appId: string;
}

export default function GraphPage({ appId }: GraphPageProps) {
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
  const [queryOptions, setQueryOptions] = useState<GraphQueryOptions>({});
  const [visibleBranches, setVisibleBranches] = useState<Set<string> | null>(null);

  const summary = useGraphSummary(appId);
  const { data, isLoading, error, refetch } = useGraph(appId, queryOptions);

  // Initialize visible branches when data loads
  const allBranches = data?.branches ?? [];
  const effectiveVisible = useMemo(() => {
    if (visibleBranches) return visibleBranches;
    return new Set(allBranches.map((b) => b.name));
  }, [visibleBranches, allBranches]);

  // Filter graph data by visible branches
  const filteredData = useMemo(() => {
    if (!data) return null;
    if (effectiveVisible.size === allBranches.length) return data;

    const filteredBranches = data.branches.filter((b) => effectiveVisible.has(b.name));
    const branchNames = new Set(filteredBranches.map((b) => b.name));

    // Keep commits that belong to any visible branch
    const filteredNodes = data.nodes.filter((node) => {
      if (node.refs) {
        for (const name of branchNames) {
          if (node.refs.includes(name)) return true;
        }
      }
      // Keep if it's connected to a visible branch's latest commit
      for (const b of filteredBranches) {
        if (b.latestCommitHash === node.hash) return true;
      }
      return true; // Keep all commits for now — branch assignment happens in BranchGraph
    });

    const nodeHashes = new Set(filteredNodes.map((n) => n.hash));
    const filteredEdges = data.edges.filter((e) => nodeHashes.has(e.from) && nodeHashes.has(e.to));

    return {
      ...data,
      branches: filteredBranches,
      nodes: filteredNodes,
      edges: filteredEdges,
    };
  }, [data, effectiveVisible, allBranches]);

  const handleTimeRangeChange = useCallback(
    (since: string | undefined, until: string | undefined) => {
      setQueryOptions((prev) => ({ ...prev, since, until }));
    },
    [],
  );

  if (isLoading && !data) return <LoadingSpinner message="Loading branch graph..." />;
  if (error) return <ErrorMessage message={error.message} onRetry={() => refetch()} />;
  if (!filteredData || filteredData.nodes.length === 0) {
    return (
      <EmptyState
        title="No Graph Data"
        description="Sync the app first to load branch and commit data."
      />
    );
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Branch Graph</h2>
        <p className="text-sm text-gray-500 mt-0.5">
          Visualize your commit history and branch structure
        </p>
      </div>

      {/* Scale controls */}
      <div className="space-y-2">
        <TimeRangeSlider
          oldestDate={data?.pagination?.oldestDate ?? summary.data?.oldestDate ?? null}
          newestDate={data?.pagination?.newestDate ?? summary.data?.newestDate ?? null}
          totalCommits={
            data?.pagination?.totalCommits ??
            summary.data?.totalCommits ??
            filteredData.nodes.length
          }
          returnedCommits={data?.pagination?.returnedCommits}
          since={queryOptions.since}
          until={queryOptions.until}
          onChange={handleTimeRangeChange}
        />

        <BranchFilter
          branches={allBranches}
          visibleBranches={effectiveVisible}
          onVisibleChange={setVisibleBranches}
        />
      </div>

      <BranchGraph data={filteredData} onBranchClick={(branch) => setSelectedBranch(branch)} />

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
