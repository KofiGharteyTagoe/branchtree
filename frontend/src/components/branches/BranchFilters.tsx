import { Search, Filter } from 'lucide-react';

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
      <div className="relative flex-1 min-w-[200px] max-w-sm">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search branches..."
          className="input pl-10"
        />
      </div>

      <div className="flex items-center gap-2">
        <Filter className="w-4 h-4 text-gray-400" />
        <select
          value={typeFilter}
          onChange={(e) => onTypeChange(e.target.value)}
          className="appearance-none bg-surface-50 text-sm text-gray-600 font-medium rounded-xl px-4 py-2.5 border border-surface-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400 transition-all duration-200 cursor-pointer"
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
          className="appearance-none bg-surface-50 text-sm text-gray-600 font-medium rounded-xl px-4 py-2.5 border border-surface-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400 transition-all duration-200 cursor-pointer"
        >
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="stale">Stale</option>
          <option value="merged">Merged</option>
          <option value="diverged">Diverged</option>
        </select>
      </div>
    </div>
  );
}
