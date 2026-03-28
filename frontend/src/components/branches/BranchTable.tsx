import { useState, useMemo } from 'react';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import type { Branch, ProviderType } from '../../types/app.types';
import BranchRow from './BranchRow';
import BranchFilters from './BranchFilters';

interface BranchTableProps {
  branches: Branch[];
  onBranchClick: (branch: Branch) => void;
  providerType?: ProviderType;
}

export default function BranchTable({ branches, onBranchClick, providerType }: BranchTableProps) {
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<keyof Branch>('name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const hasVersionData = useMemo(() => {
    return branches.some((b) => {
      const meta = b.providerMetadata;
      return meta?.mendixVersion || meta?.version;
    });
  }, [branches]);

  const filtered = useMemo(() => {
    let result = branches;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (b) => b.name.toLowerCase().includes(q) || b.createdBy?.toLowerCase().includes(q),
      );
    }

    if (typeFilter) {
      result = result.filter((b) => b.type === typeFilter);
    }

    if (statusFilter) {
      result = result.filter((b) => {
        switch (statusFilter) {
          case 'active':
            return !b.isMerged && !b.isStale;
          case 'stale':
            return b.isStale;
          case 'merged':
            return b.isMerged;
          case 'diverged':
            return b.commitsBehind > 20;
          default:
            return true;
        }
      });
    }

    result.sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];
      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return 1;
      if (bVal == null) return -1;
      const cmp = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      return sortDir === 'asc' ? cmp : -cmp;
    });

    return result;
  }, [branches, searchQuery, typeFilter, statusFilter, sortField, sortDir]);

  const handleSort = (field: keyof Branch) => {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  const SortIcon = ({ field }: { field: keyof Branch }) => {
    if (sortField !== field) return <ArrowUpDown className="w-3 h-3 text-gray-300" />;
    return sortDir === 'asc' ? (
      <ArrowUp className="w-3 h-3 text-brand-500" />
    ) : (
      <ArrowDown className="w-3 h-3 text-brand-500" />
    );
  };

  const versionLabel = providerType === 'mendix' ? 'Mx Version' : 'Version';

  return (
    <div className="space-y-4">
      <BranchFilters
        typeFilter={typeFilter}
        statusFilter={statusFilter}
        searchQuery={searchQuery}
        onTypeChange={setTypeFilter}
        onStatusChange={setStatusFilter}
        onSearchChange={setSearchQuery}
      />

      <div className="card-static p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-surface-200/80">
                <th
                  onClick={() => handleSort('name')}
                  className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700 transition-colors"
                >
                  <span className="flex items-center gap-1.5">
                    Branch <SortIcon field="name" />
                  </span>
                </th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Created By
                </th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th
                  onClick={() => handleSort('latestCommitDate')}
                  className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700 transition-colors"
                >
                  <span className="flex items-center gap-1.5">
                    Last Activity <SortIcon field="latestCommitDate" />
                  </span>
                </th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th
                  onClick={() => handleSort('commitsBehind')}
                  className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700 transition-colors"
                >
                  <span className="flex items-center gap-1.5">
                    Behind <SortIcon field="commitsBehind" />
                  </span>
                </th>
                <th
                  onClick={() => handleSort('commitsAhead')}
                  className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700 transition-colors"
                >
                  <span className="flex items-center gap-1.5">
                    Ahead <SortIcon field="commitsAhead" />
                  </span>
                </th>
                {hasVersionData && (
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    {versionLabel}
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {filtered.map((branch) => (
                <BranchRow
                  key={branch.name}
                  branch={branch}
                  onClick={onBranchClick}
                  showVersion={hasVersionData}
                />
              ))}
            </tbody>
          </table>
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-12 text-sm text-gray-400">
            No branches match your filters
          </div>
        )}
      </div>

      <p className="text-xs text-gray-400 font-medium">
        Showing {filtered.length} of {branches.length} branches
      </p>
    </div>
  );
}
