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
  unknown: '#94A3B8',
};

const BRANCH_COLORS_LIGHT: Record<string, string> = {
  main: '#EEF2FF',
  feature: '#ECFDF5',
  release: '#FFFBEB',
  hotfix: '#FEF2F2',
  development: '#F5F3FF',
  unknown: '#F8FAFC',
};

const LANE_WIDTH = 40;
const COMMIT_SPACING = 50;
const PADDING_TOP = 80;
const PADDING_LEFT = 70;
const PADDING_BOTTOM = 40;
const DOT_RADIUS = 6;
const LABEL_AREA_RIGHT = 280;

export default function BranchGraph({ data, onCommitClick, onBranchClick }: BranchGraphProps) {
  const [zoom, setZoom] = useState(1);
  const [hoveredCommit, setHoveredCommit] = useState<string | null>(null);

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
          lane = (parentPos.x - PADDING_LEFT) / LANE_WIDTH;
          assignedBranch = parentPos.branch;
        }
      }

      const x = PADDING_LEFT + lane * LANE_WIDTH;
      const y = PADDING_TOP + i * COMMIT_SPACING;
      positions.set(commit.hash, { x, y, branch: assignedBranch });
    });

    return positions;
  }, [sortedCommits, branchLanes, data.branches]);

  const svgWidth = PADDING_LEFT + data.branches.length * LANE_WIDTH + LABEL_AREA_RIGHT;
  const svgHeight = PADDING_TOP + sortedCommits.length * COMMIT_SPACING + PADDING_BOTTOM;

  // Generate smooth bezier path between two points
  const edgePath = (x1: number, y1: number, x2: number, y2: number) => {
    if (x1 === x2) {
      return `M ${x1} ${y1} L ${x2} ${y2}`;
    }
    const midY = (y1 + y2) / 2;
    return `M ${x1} ${y1} C ${x1} ${midY}, ${x2} ${midY}, ${x2} ${y2}`;
  };

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

      <div className="card-static p-0 overflow-auto bg-white" style={{ maxHeight: '72vh' }}>
        <svg
          width={svgWidth * zoom}
          height={svgHeight * zoom}
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="min-w-full"
        >
          <defs>
            {/* Drop shadow for nodes */}
            <filter id="nodeShadow" x="-50%" y="-50%" width="200%" height="200%">
              <feDropShadow dx="0" dy="1" stdDeviation="2" floodColor="#000" floodOpacity="0.1" />
            </filter>
            {/* Glow for hovered nodes */}
            <filter id="nodeGlow" x="-100%" y="-100%" width="300%" height="300%">
              <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#6366F1" floodOpacity="0.3" />
            </filter>
          </defs>

          {/* Lane backgrounds */}
          {data.branches.map((branch) => {
            const lane = branchLanes.get(branch.name) ?? 0;
            const x = PADDING_LEFT + lane * LANE_WIDTH;
            const color = BRANCH_COLORS_LIGHT[branch.type || 'unknown'] || BRANCH_COLORS_LIGHT.unknown;

            return (
              <rect
                key={`lane-${branch.name}`}
                x={x - LANE_WIDTH / 2 + 2}
                y={PADDING_TOP - 20}
                width={LANE_WIDTH - 4}
                height={svgHeight - PADDING_TOP - PADDING_BOTTOM + 40}
                fill={color}
                rx={8}
                opacity={0.6}
              />
            );
          })}

          {/* Branch labels at top */}
          {data.branches.map((branch) => {
            const lane = branchLanes.get(branch.name) ?? 0;
            const x = PADDING_LEFT + lane * LANE_WIDTH;
            const color = BRANCH_COLORS[branch.type || 'unknown'] || BRANCH_COLORS.unknown;

            return (
              <g
                key={`label-${branch.name}`}
                className="cursor-pointer"
                onClick={() => onBranchClick?.(branch)}
              >
                {/* Pill background */}
                <rect
                  x={x - 18}
                  y={12}
                  width={36}
                  height={20}
                  rx={10}
                  fill={color}
                  opacity={0.12}
                />
                <text
                  x={x}
                  y={26}
                  fontSize={8}
                  fill={color}
                  textAnchor="middle"
                  fontWeight="700"
                  fontFamily="Inter, system-ui, sans-serif"
                  className="select-none"
                >
                  {branch.name.length > 8 ? branch.name.substring(0, 7) + '..' : branch.name}
                </text>
              </g>
            );
          })}

          {/* Edges — smooth bezier curves */}
          {sortedCommits.map((commit) =>
            commit.parentHashes.map((parentHash) => {
              const from = commitPositions.get(parentHash);
              const to = commitPositions.get(commit.hash);
              if (!from || !to) return null;

              const isMergeLine = commit.parentHashes.length > 1 &&
                parentHash !== commit.parentHashes[0];

              const branchType = to.branch?.type || 'unknown';
              const edgeColor = isMergeLine ? '#F59E0B' : (BRANCH_COLORS[branchType] || '#94A3B8');

              return (
                <path
                  key={`${parentHash}-${commit.hash}`}
                  d={edgePath(from.x, from.y, to.x, to.y)}
                  fill="none"
                  stroke={edgeColor}
                  strokeWidth={isMergeLine ? 2 : 2}
                  strokeOpacity={isMergeLine ? 0.5 : 0.35}
                  strokeDasharray={isMergeLine ? '6,4' : undefined}
                  strokeLinecap="round"
                />
              );
            })
          )}

          {/* Commit nodes */}
          {sortedCommits.map((commit) => {
            const pos = commitPositions.get(commit.hash);
            if (!pos) return null;

            const branchType = pos.branch?.type || 'unknown';
            const color = BRANCH_COLORS[branchType] || BRANCH_COLORS.unknown;
            const isHovered = hoveredCommit === commit.hash;
            const isMerge = commit.isMergeCommit;
            const radius = isMerge ? DOT_RADIUS + 2 : DOT_RADIUS;

            return (
              <g
                key={commit.hash}
                className="cursor-pointer"
                onClick={() => onCommitClick?.(commit)}
                onMouseEnter={() => setHoveredCommit(commit.hash)}
                onMouseLeave={() => setHoveredCommit(null)}
              >
                {/* Outer glow ring on hover */}
                {isHovered && (
                  <circle
                    cx={pos.x}
                    cy={pos.y}
                    r={radius + 6}
                    fill={color}
                    opacity={0.12}
                  />
                )}

                {/* Node circle */}
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r={radius}
                  fill={isMerge ? '#F59E0B' : color}
                  stroke="white"
                  strokeWidth={2.5}
                  filter="url(#nodeShadow)"
                  style={{ transition: 'r 0.15s ease-out' }}
                />

                {/* Inner dot for merge commits */}
                {isMerge && (
                  <circle
                    cx={pos.x}
                    cy={pos.y}
                    r={2.5}
                    fill="white"
                  />
                )}

                {/* Commit message label */}
                <text
                  x={pos.x + 18}
                  y={pos.y - 4}
                  fontSize={11}
                  fill={isHovered ? '#1E293B' : '#94A3B8'}
                  fontWeight={isHovered ? '600' : '400'}
                  fontFamily="Inter, system-ui, sans-serif"
                  className="select-none"
                  style={{ transition: 'fill 0.15s, font-weight 0.15s' }}
                >
                  {commit.message?.substring(0, 45)}
                  {(commit.message?.length || 0) > 45 ? '...' : ''}
                </text>

                {/* Metadata line */}
                <text
                  x={pos.x + 18}
                  y={pos.y + 10}
                  fontSize={9}
                  fill={isHovered ? '#64748B' : '#CBD5E1'}
                  fontFamily="'SF Mono', 'Fira Code', monospace"
                  className="select-none"
                  style={{ transition: 'fill 0.15s' }}
                >
                  {commit.hash.substring(0, 7)}
                  {commit.authorName ? `  ·  ${commit.authorName}` : ''}
                  {commit.date ? `  ·  ${new Date(commit.date).toLocaleDateString()}` : ''}
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
