import { useState, useMemo } from 'react';
import type { Branch } from '../../types/app.types';
import BranchRow from './BranchRow';
import BranchFilters from './BranchFilters';

interface BranchTableProps {
  branches: Branch[];
  onBranchClick: (branch: Branch) => void;
}

export default function BranchTable({ branches, onBranchClick }: BranchTableProps) {
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<keyof Branch>('name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const filtered = useMemo(() => {
    let result = branches;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (b) =>
          b.name.toLowerCase().includes(q) ||
          b.createdBy?.toLowerCase().includes(q)
      );
    }

    if (typeFilter) {
      result = result.filter((b) => b.type === typeFilter);
    }

    if (statusFilter) {
      result = result.filter((b) => {
        switch (statusFilter) {
          case 'active': return !b.isMerged && !b.isStale;
          case 'stale': return b.isStale;
          case 'merged': return b.isMerged;
          case 'diverged': return b.commitsBehind > 20;
          default: return true;
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

  const sortIcon = (field: keyof Branch) => {
    if (sortField !== field) return '';
    return sortDir === 'asc' ? ' ↑' : ' ↓';
  };

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

      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th
                  onClick={() => handleSort('name')}
                  className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:text-gray-900"
                >
                  Branch{sortIcon('name')}
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Created By
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Created
                </th>
                <th
                  onClick={() => handleSort('latestCommitDate')}
                  className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:text-gray-900"
                >
                  Last Activity{sortIcon('latestCommitDate')}
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Status
                </th>
                <th
                  onClick={() => handleSort('commitsBehind')}
                  className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:text-gray-900"
                >
                  Behind{sortIcon('commitsBehind')}
                </th>
                <th
                  onClick={() => handleSort('commitsAhead')}
                  className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:text-gray-900"
                >
                  Ahead{sortIcon('commitsAhead')}
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Mx Version
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((branch) => (
                <BranchRow
                  key={branch.name}
                  branch={branch}
                  onClick={onBranchClick}
                />
              ))}
            </tbody>
          </table>
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-8 text-sm text-gray-500">
            No branches match your filters
          </div>
        )}
      </div>

      <p className="text-xs text-gray-400">
        Showing {filtered.length} of {branches.length} branches
      </p>
    </div>
  );
}
