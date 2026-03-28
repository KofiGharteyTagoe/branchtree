const legendItems = [
  { label: 'Main', color: 'bg-branch-main' },
  { label: 'Feature', color: 'bg-branch-feature' },
  { label: 'Release', color: 'bg-branch-release' },
  { label: 'Hotfix', color: 'bg-branch-hotfix' },
  { label: 'Dev', color: 'bg-branch-development' },
  { label: 'Other', color: 'bg-branch-unknown' },
];

export default function GraphLegend() {
  return (
    <div className="flex flex-wrap gap-3 text-xs">
      {legendItems.map((item) => (
        <div key={item.label} className="flex items-center gap-1.5 text-gray-500">
          <span className={`w-2.5 h-2.5 rounded-full ${item.color}`} />
          {item.label}
        </div>
      ))}
      <div className="flex items-center gap-1.5 text-gray-500">
        <span className="w-4 h-0.5 bg-amber-400 rounded" />
        <span className="text-xs text-gray-400">Merge</span>
      </div>
    </div>
  );
}
