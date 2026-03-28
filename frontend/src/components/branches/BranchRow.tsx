import type { Branch } from '../../types/app.types';
import BranchStatusBadge from './BranchStatusBadge';
import BranchTypeIcon from './BranchTypeIcon';

interface BranchRowProps {
  branch: Branch;
  onClick: (branch: Branch) => void;
  showVersion?: boolean;
}

function getVersion(branch: Branch): string {
  const meta = branch.providerMetadata;
  return (meta?.mendixVersion as string) || (meta?.version as string) || 'N/A';
}

export default function BranchRow({ branch, onClick, showVersion }: BranchRowProps) {
  const lastActivity = branch.latestCommitDate
    ? new Date(branch.latestCommitDate).toLocaleDateString()
    : 'N/A';

  const created = branch.createdDate ? new Date(branch.createdDate).toLocaleDateString() : 'N/A';

  return (
    <tr
      onClick={() => onClick(branch)}
      className="hover:bg-brand-50/30 cursor-pointer transition-colors duration-150 border-b border-surface-100 last:border-0"
    >
      <td className="px-5 py-3.5">
        <div className="font-medium text-sm text-gray-900">{branch.name}</div>
      </td>
      <td className="px-5 py-3.5">
        <BranchTypeIcon type={branch.type} />
      </td>
      <td className="px-5 py-3.5 text-sm text-gray-500">{branch.createdBy || 'Unknown'}</td>
      <td className="px-5 py-3.5 text-sm text-gray-500">{created}</td>
      <td className="px-5 py-3.5 text-sm text-gray-500">{lastActivity}</td>
      <td className="px-5 py-3.5">
        <BranchStatusBadge branch={branch} />
      </td>
      <td className="px-5 py-3.5">
        <span
          className={`text-sm font-medium ${branch.commitsBehind > 20 ? 'text-amber-600' : 'text-gray-500'}`}
        >
          {branch.commitsBehind}
        </span>
      </td>
      <td className="px-5 py-3.5">
        <span className="text-sm font-medium text-gray-500">{branch.commitsAhead}</span>
      </td>
      {showVersion && (
        <td className="px-5 py-3.5 text-sm text-gray-500 font-mono">{getVersion(branch)}</td>
      )}
    </tr>
  );
}
