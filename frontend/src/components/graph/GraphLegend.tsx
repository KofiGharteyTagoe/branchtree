const legendItems = [
  { label: 'Main', color: 'bg-branch-main' },
  { label: 'Feature', color: 'bg-branch-feature' },
  { label: 'Release', color: 'bg-branch-release' },
  { label: 'Hotfix', color: 'bg-branch-hotfix' },
  { label: 'Development', color: 'bg-branch-development' },
  { label: 'Other', color: 'bg-branch-unknown' },
];

export default function GraphLegend() {
  return (
    <div className="flex flex-wrap gap-4 text-xs text-gray-600">
      {legendItems.map((item) => (
        <div key={item.label} className="flex items-center gap-1.5">
          <span className={`w-3 h-3 rounded-full ${item.color}`} />
          {item.label}
        </div>
      ))}
      <div className="flex items-center gap-1.5">
        <span className="w-4 h-0.5 bg-gray-400" />
        Merge
      </div>
    </div>
  );
}
