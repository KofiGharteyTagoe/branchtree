import { useState, useMemo, useCallback } from 'react';
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
  main: '#4F46E5',
  feature: '#059669',
  release: '#D97706',
  hotfix: '#DC2626',
  development: '#7C3AED',
  unknown: '#6B7280',
};

const BRANCH_COLORS_LIGHT: Record<string, string> = {
  main: '#EEF2FF',
  feature: '#ECFDF5',
  release: '#FFFBEB',
  hotfix: '#FEF2F2',
  development: '#F5F3FF',
  unknown: '#F8FAFC',
};

const LANE_WIDTH = 56;
const COMMIT_SPACING = 60;
const PADDING_TOP = 90;
const PADDING_LEFT = 90;
const PADDING_BOTTOM = 40;
const DOT_RADIUS = 8;
const LABEL_AREA_RIGHT = 340;

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

  // Precompute ancestry sets for lineage highlighting
  const ancestrySets = useMemo(() => {
    const sets = new Map<string, Set<string>>();
    const posMap = new Map<string, number>();
    sortedCommits.forEach((c, i) => posMap.set(c.hash, i));

    for (const commit of sortedCommits) {
      const ancestors = new Set<string>();
      const queue = [commit.hash];
      while (queue.length > 0) {
        const current = queue.pop()!;
        if (ancestors.has(current)) continue;
        ancestors.add(current);
        const idx = posMap.get(current);
        if (idx === undefined) continue;
        const c = sortedCommits[idx];
        if (c) {
          for (const ph of c.parentHashes) {
            if (!ancestors.has(ph)) queue.push(ph);
          }
        }
      }
      sets.set(commit.hash, ancestors);
    }
    return sets;
  }, [sortedCommits]);

  const isInAncestry = useCallback(
    (commitHash: string): boolean => {
      if (!hoveredCommit) return true;
      const ancestors = ancestrySets.get(hoveredCommit);
      return ancestors?.has(commitHash) ?? false;
    },
    [hoveredCommit, ancestrySets]
  );

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

  // Tooltip data for hovered commit
  const tooltipCommit = hoveredCommit ? sortedCommits.find((c) => c.hash === hoveredCommit) : null;
  const tooltipPos = hoveredCommit ? commitPositions.get(hoveredCommit) : null;

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
              <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#4F46E5" floodOpacity="0.3" />
            </filter>
          </defs>

          {/* Lane backgrounds */}
          {data.branches.map((branch) => {
            const lane = branchLanes.get(branch.name) ?? 0;
            const x = PADDING_LEFT + lane * LANE_WIDTH;
            const color = BRANCH_COLORS_LIGHT[branch.type || 'unknown'] || BRANCH_COLORS_LIGHT.unknown;
            const isMain = branch.type === 'main';

            return (
              <rect
                key={`lane-${branch.name}`}
                x={x - LANE_WIDTH / 2 + 2}
                y={PADDING_TOP - 20}
                width={LANE_WIDTH - 4}
                height={svgHeight - PADDING_TOP - PADDING_BOTTOM + 40}
                fill={color}
                rx={8}
                opacity={isMain ? 0.85 : 0.6}
              />
            );
          })}

          {/* Branch labels at top */}
          {data.branches.map((branch) => {
            const lane = branchLanes.get(branch.name) ?? 0;
            const x = PADDING_LEFT + lane * LANE_WIDTH;
            const color = BRANCH_COLORS[branch.type || 'unknown'] || BRANCH_COLORS.unknown;
            const displayName = branch.name.length > 16
              ? branch.name.substring(0, 15) + '..'
              : branch.name;
            const pillWidth = Math.max(60, Math.min(120, displayName.length * 7.5 + 16));

            return (
              <g
                key={`label-${branch.name}`}
                className="cursor-pointer"
                onClick={() => onBranchClick?.(branch)}
              >
                {/* Pill background */}
                <rect
                  x={x - pillWidth / 2}
                  y={10}
                  width={pillWidth}
                  height={24}
                  rx={12}
                  fill={color}
                  opacity={0.12}
                />
                <text
                  x={x}
                  y={27}
                  fontSize={12}
                  fill={color}
                  textAnchor="middle"
                  fontWeight="700"
                  fontFamily="Inter, system-ui, sans-serif"
                  className="select-none"
                >
                  {displayName}
                </text>
                <title>{branch.name}</title>
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
              const isMain = branchType === 'main';
              const edgeColor = isMergeLine ? '#D97706' : (BRANCH_COLORS[branchType] || '#6B7280');

              // Lineage dimming
              const inAncestry = isInAncestry(commit.hash) && isInAncestry(parentHash);
              const dimmed = hoveredCommit && !inAncestry;

              return (
                <path
                  key={`${parentHash}-${commit.hash}`}
                  d={edgePath(from.x, from.y, to.x, to.y)}
                  fill="none"
                  stroke={edgeColor}
                  strokeWidth={isMergeLine ? 2.5 : (isMain ? 3.5 : 2.5)}
                  strokeOpacity={dimmed ? 0.08 : (isMergeLine ? 0.6 : (isMain ? 0.7 : 0.5))}
                  strokeDasharray={isMergeLine ? '8,5' : undefined}
                  strokeLinecap="round"
                  style={{ transition: 'stroke-opacity 0.2s' }}
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
            const radius = isMerge ? DOT_RADIUS + 3 : DOT_RADIUS;

            // Lineage dimming
            const inAncestry = isInAncestry(commit.hash);
            const dimmed = hoveredCommit && !inAncestry;

            return (
              <g
                key={commit.hash}
                className="cursor-pointer"
                onClick={() => onCommitClick?.(commit)}
                onMouseEnter={() => setHoveredCommit(commit.hash)}
                onMouseLeave={() => setHoveredCommit(null)}
                opacity={dimmed ? 0.12 : 1}
                style={{ transition: 'opacity 0.2s' }}
              >
                {/* Outer glow ring on hover */}
                {isHovered && (
                  <circle
                    cx={pos.x}
                    cy={pos.y}
                    r={radius + 6}
                    fill={color}
                    opacity={0.15}
                  />
                )}

                {/* Node circle */}
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r={radius}
                  fill={isMerge ? '#D97706' : color}
                  stroke="white"
                  strokeWidth={3}
                  filter={isHovered ? 'url(#nodeGlow)' : 'url(#nodeShadow)'}
                  style={{ transition: 'r 0.15s ease-out' }}
                />

                {/* Inner dot for merge commits */}
                {isMerge && (
                  <circle
                    cx={pos.x}
                    cy={pos.y}
                    r={3}
                    fill="white"
                  />
                )}

                {/* Commit message label */}
                <text
                  x={pos.x + 20}
                  y={pos.y - 5}
                  fontSize={13}
                  fill={isHovered ? '#1E293B' : '#64748B'}
                  fontWeight={isHovered ? '600' : '400'}
                  fontFamily="Inter, system-ui, sans-serif"
                  className="select-none"
                  style={{ transition: 'fill 0.15s, font-weight 0.15s' }}
                >
                  {commit.message?.substring(0, 50)}
                  {(commit.message?.length || 0) > 50 ? '...' : ''}
                </text>

                {/* Metadata line */}
                <text
                  x={pos.x + 20}
                  y={pos.y + 11}
                  fontSize={11}
                  fill={isHovered ? '#475569' : '#94A3B8'}
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

          {/* Hover tooltip */}
          {tooltipCommit && tooltipPos && (
            <foreignObject
              x={tooltipPos.x + 24}
              y={tooltipPos.y - 60}
              width={320}
              height={140}
              style={{ pointerEvents: 'none' }}
            >
              <div
                className="bg-gray-900 text-white rounded-xl shadow-elevated p-3 text-xs"
                style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
              >
                <p className="font-semibold text-sm mb-1.5 leading-snug">
                  {tooltipCommit.message || 'No message'}
                </p>
                <div className="space-y-1 text-gray-300">
                  <p>
                    <span className="text-gray-500">Author:</span>{' '}
                    {tooltipCommit.authorName || 'Unknown'}
                    {tooltipCommit.authorEmail ? ` <${tooltipCommit.authorEmail}>` : ''}
                  </p>
                  <p>
                    <span className="text-gray-500">Date:</span>{' '}
                    {tooltipCommit.date
                      ? new Date(tooltipCommit.date).toLocaleString()
                      : 'Unknown'}
                  </p>
                  <p>
                    <span className="text-gray-500">Hash:</span>{' '}
                    <span className="font-mono">{tooltipCommit.hash.substring(0, 12)}</span>
                  </p>
                  {tooltipCommit.isMergeCommit && (
                    <p className="text-amber-400 font-medium">Merge commit</p>
                  )}
                  {tooltipPos.branch && (
                    <p>
                      <span className="text-gray-500">Branch:</span>{' '}
                      {tooltipPos.branch.name}
                    </p>
                  )}
                </div>
              </div>
            </foreignObject>
          )}
        </svg>
      </div>

      <p className="text-xs text-gray-400 font-medium">
        {sortedCommits.length} commits across {data.branches.length} branches
      </p>
    </div>
  );
}
