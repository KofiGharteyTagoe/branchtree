interface TimelineAxisProps {
  startDate: Date;
  endDate: Date;
  width: number;
}

export default function TimelineAxis({ startDate, endDate, width }: TimelineAxisProps) {
  const totalMs = endDate.getTime() - startDate.getTime();
  const monthMs = 30 * 24 * 60 * 60 * 1000;
  const monthCount = Math.max(1, Math.ceil(totalMs / monthMs));

  const ticks: Array<{ x: number; label: string }> = [];

  for (let i = 0; i <= monthCount; i++) {
    const date = new Date(startDate.getTime() + i * monthMs);
    const x = (i / monthCount) * width;
    ticks.push({
      x,
      label: date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
    });
  }

  return (
    <div className="relative h-7 border-t border-surface-200" style={{ width }}>
      {ticks.map((tick, i) => (
        <div
          key={i}
          className="absolute top-0"
          style={{ left: tick.x }}
        >
          <div className="w-px h-2 bg-surface-300" />
          <span className="text-[10px] text-gray-400 font-medium absolute top-2.5 -translate-x-1/2">
            {tick.label}
          </span>
        </div>
      ))}
    </div>
  );
}
