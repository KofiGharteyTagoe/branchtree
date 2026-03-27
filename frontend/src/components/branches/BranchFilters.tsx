interface BranchFiltersProps {
  typeFilter: string;
  statusFilter: string;
  searchQuery: string;
  onTypeChange: (type: string) => void;
  onStatusChange: (status: string) => void;
  onSearchChange: (query: string) => void;
}

export default function BranchFilters({
  typeFilter,
  statusFilter,
  searchQuery,
  onTypeChange,
  onStatusChange,
  onSearchChange,
}: BranchFiltersProps) {
  return (
    <div className="flex flex-wrap gap-3 items-center">
      <input
        type="text"
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder="Search branches..."
        className="input max-w-xs"
      />

      <select
        value={typeFilter}
        onChange={(e) => onTypeChange(e.target.value)}
        className="input max-w-[150px]"
      >
        <option value="">All Types</option>
        <option value="main">Main</option>
        <option value="feature">Feature</option>
        <option value="release">Release</option>
        <option value="hotfix">Hotfix</option>
        <option value="development">Development</option>
        <option value="unknown">Other</option>
      </select>

      <select
        value={statusFilter}
        onChange={(e) => onStatusChange(e.target.value)}
        className="input max-w-[150px]"
      >
        <option value="">All Status</option>
        <option value="active">Active</option>
        <option value="stale">Stale</option>
        <option value="merged">Merged</option>
        <option value="diverged">Diverged</option>
      </select>
    </div>
  );
}
