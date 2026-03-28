import { useMemo } from 'react';
import type { Branch } from '../../types/app.types';
import TimelineBar from './TimelineBar';
import TimelineAxis from './TimelineAxis';

interface TimelineChartProps {
  branches: Branch[];
  onBranchClick: (branch: Branch) => void;
}

export default function TimelineChart({ branches, onBranchClick }: TimelineChartProps) {
  const chartWidth = 600;

  const { startDate, endDate } = useMemo(() => {
    let earliest = Date.now();
    let latest = 0;

    for (const branch of branches) {
      const created = branch.createdDate ? new Date(branch.createdDate).getTime() : null;
      const lastActivity = branch.latestCommitDate
        ? new Date(branch.latestCommitDate).getTime()
        : null;

      if (created && created < earliest) earliest = created;
      if (lastActivity && lastActivity > latest) latest = lastActivity;
      if (created && created > latest) latest = created;
    }

    const range = latest - earliest || 1;
    return {
      startDate: new Date(earliest - range * 0.05),
      endDate: new Date(latest + range * 0.05),
    };
  }, [branches]);

  const totalMs = endDate.getTime() - startDate.getTime();

  const getX = (dateStr: string | null) => {
    if (!dateStr) return 0;
    const ms = new Date(dateStr).getTime() - startDate.getTime();
    return (ms / totalMs) * chartWidth;
  };

  const sorted = useMemo(() => {
    return [...branches].sort((a, b) => {
      if (a.type === 'main') return -1;
      if (b.type === 'main') return 1;
      const aDate = a.createdDate ? new Date(a.createdDate).getTime() : 0;
      const bDate = b.createdDate ? new Date(b.createdDate).getTime() : 0;
      return aDate - bDate;
    });
  }, [branches]);

  return (
    <div className="card-static">
      <div className="overflow-x-auto">
        <div style={{ minWidth: chartWidth + 200 }}>
          <div className="space-y-0.5">
            {sorted.map((branch) => {
              const startX = getX(branch.createdDate);
              const endX = getX(branch.latestCommitDate) || chartWidth;
              const width = Math.max(endX - startX, 4);

              return (
                <TimelineBar
                  key={branch.name}
                  branch={branch}
                  startX={startX}
                  width={width}
                  onClick={onBranchClick}
                />
              );
            })}
          </div>

          <div className="ml-[172px] mt-2">
            <TimelineAxis startDate={startDate} endDate={endDate} width={chartWidth} />
          </div>
        </div>
      </div>
    </div>
  );
}
