import { useState, useMemo } from 'react';
import { Filter, Search, ChevronDown, ChevronUp } from 'lucide-react';
import type { Branch } from '../../types/app.types';

interface BranchFilterProps {
  branches: Branch[];
  visibleBranches: Set<string>;
  onVisibleChange: (visible: Set<string>) => void;
}

const BRANCH_TYPE_COLORS: Record<string, string> = {
  main: 'bg-branch-main',
  feature: 'bg-branch-feature',
  release: 'bg-branch-release',
  hotfix: 'bg-branch-hotfix',
  development: 'bg-branch-development',
  unknown: 'bg-branch-unknown',
};

export default function BranchFilter({
  branches,
  visibleBranches,
  onVisibleChange,
}: BranchFilterProps) {
  const [search, setSearch] = useState('');
  const [activeOnly, setActiveOnly] = useState(true);
  const [expanded, setExpanded] = useState(false);

  const branchesByType = useMemo(() => {
    const grouped = new Map<string, Branch[]>();
    for (const b of branches) {
      const type = b.type || 'unknown';
      if (!grouped.has(type)) grouped.set(type, []);
      grouped.get(type)!.push(b);
    }
    return grouped;
  }, [branches]);

  const filteredBranches = useMemo(() => {
    let result = branches;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter((b) => b.name.toLowerCase().includes(q));
    }
    return result;
  }, [branches, search]);

  const handleActiveToggle = () => {
    const newActive = !activeOnly;
    setActiveOnly(newActive);

    if (newActive) {
      const protectedTypes = new Set(['main', 'development', 'release']);
      const visible = new Set(
        branches.filter((b) => protectedTypes.has(b.type || '') || !b.isStale).map((b) => b.name),
      );
      onVisibleChange(visible);
    } else {
      onVisibleChange(new Set(branches.map((b) => b.name)));
    }
  };

  const toggleBranch = (name: string) => {
    const next = new Set(visibleBranches);
    if (next.has(name)) {
      next.delete(name);
    } else {
      next.add(name);
    }
    onVisibleChange(next);
  };

  const toggleType = (type: string) => {
    const typeBranches = branchesByType.get(type) || [];
    const allVisible = typeBranches.every((b) => visibleBranches.has(b.name));
    const next = new Set(visibleBranches);
    for (const b of typeBranches) {
      if (allVisible) {
        next.delete(b.name);
      } else {
        next.add(b.name);
      }
    }
    onVisibleChange(next);
  };

  return (
    <div className="text-sm">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 text-surface-500">
          <Filter className="w-4 h-4" />
          <span className="font-medium">Branches:</span>
        </div>

        <button
          onClick={handleActiveToggle}
          className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors border ${
            activeOnly
              ? 'bg-brand-50 text-brand-700 border-brand-200'
              : 'bg-surface-50 text-surface-500 border-surface-200'
          }`}
        >
          Active only
        </button>

        <span className="text-xs text-surface-400">
          {visibleBranches.size} of {branches.length} shown
        </span>

        <button
          onClick={() => setExpanded(!expanded)}
          className="ml-auto flex items-center gap-1 text-xs text-surface-500 hover:text-surface-700"
        >
          {expanded ? (
            <ChevronUp className="w-3.5 h-3.5" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5" />
          )}
          {expanded ? 'Less' : 'More'}
        </button>
      </div>

      {expanded && (
        <div className="mt-3 p-3 bg-surface-50 rounded-xl border border-surface-200/60 space-y-3 animate-fade-in">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-surface-400" />
            <input
              id="graph-branch-search"
              name="graph-branch-search"
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search branches..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-surface-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-300"
            />
          </div>

          {/* Type toggles */}
          <div className="flex flex-wrap gap-2">
            {Array.from(branchesByType.entries()).map(([type, typeBranches]) => {
              const allVisible = typeBranches.every((b) => visibleBranches.has(b.name));
              const colorClass = BRANCH_TYPE_COLORS[type] || BRANCH_TYPE_COLORS.unknown;
              return (
                <button
                  key={type}
                  onClick={() => toggleType(type)}
                  className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium border transition-colors ${
                    allVisible
                      ? 'bg-white border-surface-300 text-surface-700'
                      : 'bg-surface-100 border-surface-200 text-surface-400'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${colorClass}`} />
                  {type} ({typeBranches.length})
                </button>
              );
            })}
          </div>

          {/* Individual branches */}
          <div className="max-h-48 overflow-y-auto space-y-0.5">
            {filteredBranches.map((branch) => (
              <label
                key={branch.name}
                className="flex items-center gap-2 px-2 py-1 rounded hover:bg-white cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={visibleBranches.has(branch.name)}
                  onChange={() => toggleBranch(branch.name)}
                  className="rounded border-surface-300 text-brand-600 focus:ring-brand-300"
                />
                <span
                  className={`w-2 h-2 rounded-full ${
                    BRANCH_TYPE_COLORS[branch.type || 'unknown'] || BRANCH_TYPE_COLORS.unknown
                  }`}
                />
                <span className="text-xs text-surface-700 truncate">{branch.name}</span>
                {branch.isStale && (
                  <span className="text-[10px] px-1.5 py-0.5 bg-amber-50 text-amber-600 rounded font-medium ml-auto">
                    stale
                  </span>
                )}
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
