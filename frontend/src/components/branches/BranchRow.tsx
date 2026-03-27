import type { Branch } from '../../types/app.types';
import BranchStatusBadge from './BranchStatusBadge';
import BranchTypeIcon from './BranchTypeIcon';

interface BranchRowProps {
  branch: Branch;
  onClick: (branch: Branch) => void;
}

export default function BranchRow({ branch, onClick }: BranchRowProps) {
  const lastActivity = branch.latestCommitDate
    ? new Date(branch.latestCommitDate).toLocaleDateString()
    : 'N/A';

  const created = branch.createdDate
    ? new Date(branch.createdDate).toLocaleDateString()
    : 'N/A';

  return (
    <tr
      onClick={() => onClick(branch)}
      className="hover:bg-gray-50 cursor-pointer transition-colors border-b border-gray-100"
    >
      <td className="px-4 py-3">
        <div className="font-medium text-sm text-gray-900">{branch.name}</div>
      </td>
      <td className="px-4 py-3">
        <BranchTypeIcon type={branch.type} />
      </td>
      <td className="px-4 py-3 text-sm text-gray-600">
        {branch.createdBy || 'Unknown'}
      </td>
      <td className="px-4 py-3 text-sm text-gray-600">{created}</td>
      <td className="px-4 py-3 text-sm text-gray-600">{lastActivity}</td>
      <td className="px-4 py-3">
        <BranchStatusBadge branch={branch} />
      </td>
      <td className="px-4 py-3 text-sm text-gray-600">{branch.commitsBehind}</td>
      <td className="px-4 py-3 text-sm text-gray-600">{branch.commitsAhead}</td>
      <td className="px-4 py-3 text-sm text-gray-600">
        {branch.mendixVersion || 'N/A'}
      </td>
    </tr>
  );
}
