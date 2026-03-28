import { useState, useMemo } from 'react';
import type { GraphData } from '../../types/graph.types';
import type { Commit, Branch } from '../../types/app.types';
import GraphControls from './GraphControls';
import GraphLegend from './GraphLegend';

interface BranchGraphProps {
  data: GraphData;
  onCommitClick?: (commit: Commit) => void;
  onBranchClick?: (branch: Branch) => void;
}

const BRANCH_COLORS: Record<string, string> = {
  main: '#6366F1',
  feature: '#10B981',
  release: '#F59E0B',
  hotfix: '#EF4444',
  development: '#8B5CF6',
  unknown: '#6B7280',
};

const LANE_WIDTH = 30;
const COMMIT_SPACING = 40;
const PADDING = 60;
const DOT_RADIUS = 5;

export default function BranchGraph({ data, onCommitClick, onBranchClick }: BranchGraphProps) {
  const [zoom, setZoom] = useState(1);

  const branchLanes = useMemo(() => {
    const lanes = new Map<string, number>();
    const sorted = [...data.branches].sort((a, b) => {
      if (a.type === 'main') return -1;
      if (b.type === 'main') return 1;
      return a.name.localeCompare(b.name);
    });
    sorted.forEach((branch, i) => lanes.set(branch.name, i));
    return lanes;
  }, [data.branches]);

  const sortedCommits = useMemo(() => {
    return [...data.nodes]
      .filter((c) => c.date)
      .sort((a, b) => new Date(a.date!).getTime() - new Date(b.date!).getTime());
  }, [data.nodes]);

  const commitPositions = useMemo(() => {
    const positions = new Map<string, { x: number; y: number; branch: Branch | null }>();

    sortedCommits.forEach((commit, i) => {
      let assignedBranch: Branch | null = null;
      let lane = 0;

      for (const branch of data.branches) {
        if (branch.latestCommitHash === commit.hash) {
          assignedBranch = branch;
          lane = branchLanes.get(branch.name) ?? 0;
          break;
        }
      }

      if (!assignedBranch && commit.refs) {
        for (const branch of data.branches) {
          if (commit.refs.includes(branch.name)) {
            assignedBranch = branch;
            lane = branchLanes.get(branch.name) ?? 0;
            break;
          }
        }
      }

      if (!assignedBranch && commit.parentHashes.length > 0) {
        const parentPos = positions.get(commit.parentHashes[0]);
        if (parentPos) {
          lane = (parentPos.x - PADDING) / LANE_WIDTH;
          assignedBranch = parentPos.branch;
        }
      }

      const x = PADDING + lane * LANE_WIDTH;
      const y = PADDING + i * COMMIT_SPACING;
      positions.set(commit.hash, { x, y, branch: assignedBranch });
    });

    return positions;
  }, [sortedCommits, branchLanes, data.branches]);

  const svgWidth = PADDING * 2 + data.branches.length * LANE_WIDTH;
  const svgHeight = PADDING * 2 + sortedCommits.length * COMMIT_SPACING;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <GraphLegend />
        <GraphControls
          zoom={zoom}
          onZoomIn={() => setZoom((z) => Math.min(z + 0.2, 3))}
          onZoomOut={() => setZoom((z) => Math.max(z - 0.2, 0.2))}
          onReset={() => setZoom(1)}
        />
      </div>

      <div className="card-static p-0 overflow-auto" style={{ maxHeight: '70vh' }}>
        <svg
          width={svgWidth * zoom}
          height={svgHeight * zoom}
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="min-w-full"
        >
          {/* Draw edges */}
          {sortedCommits.map((commit) =>
            commit.parentHashes.map((parentHash) => {
              const from = commitPositions.get(parentHash);
              const to = commitPositions.get(commit.hash);
              if (!from || !to) return null;

              const isMergeLine = commit.parentHashes.length > 1 &&
                parentHash !== commit.parentHashes[0];

              return (
                <line
                  key={`${parentHash}-${commit.hash}`}
                  x1={from.x}
                  y1={from.y}
                  x2={to.x}
                  y2={to.y}
                  stroke={isMergeLine ? '#F59E0B' : '#E2E8F0'}
                  strokeWidth={isMergeLine ? 2 : 1.5}
                  strokeDasharray={isMergeLine ? '4,4' : undefined}
                />
              );
            })
          )}

          {/* Draw commit dots */}
          {sortedCommits.map((commit) => {
            const pos = commitPositions.get(commit.hash);
            if (!pos) return null;

            const branchType = pos.branch?.type || 'unknown';
            const color = BRANCH_COLORS[branchType] || BRANCH_COLORS.unknown;

            return (
              <g
                key={commit.hash}
                className="cursor-pointer"
                onClick={() => onCommitClick?.(commit)}
              >
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r={commit.isMergeCommit ? DOT_RADIUS + 2 : DOT_RADIUS}
                  fill={commit.isMergeCommit ? '#F59E0B' : color}
                  stroke="white"
                  strokeWidth={2}
                />
                <text
                  x={pos.x + 15}
                  y={pos.y + 4}
                  fontSize={10}
                  fill="#94A3B8"
                  className="select-none"
                  fontFamily="Inter, system-ui, sans-serif"
                >
                  {commit.message?.substring(0, 40)}
                  {(commit.message?.length || 0) > 40 ? '...' : ''}
                </text>
              </g>
            );
          })}

          {/* Draw branch labels */}
          {data.branches.map((branch) => {
            const lane = branchLanes.get(branch.name) ?? 0;
            const x = PADDING + lane * LANE_WIDTH;
            const color = BRANCH_COLORS[branch.type || 'unknown'] || BRANCH_COLORS.unknown;

            return (
              <g
                key={branch.name}
                className="cursor-pointer"
                onClick={() => onBranchClick?.(branch)}
              >
                <rect
                  x={x - 4}
                  y={10}
                  width={8}
                  height={svgHeight - 20}
                  fill={color}
                  opacity={0.06}
                  rx={4}
                />
                <text
                  x={x}
                  y={25}
                  fontSize={9}
                  fill={color}
                  textAnchor="middle"
                  fontWeight="bold"
                  className="select-none"
                  fontFamily="Inter, system-ui, sans-serif"
                  transform={`rotate(-45, ${x}, 25)`}
                >
                  {branch.name}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <p className="text-xs text-gray-400 font-medium">
        {sortedCommits.length} commits across {data.branches.length} branches
      </p>
    </div>
  );
}
