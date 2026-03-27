import { useBranchDetail } from '../../hooks/useBranchDetail';
import type { Branch } from '../../types/app.types';
import BranchStatusBadge from '../branches/BranchStatusBadge';
import BranchTypeIcon from '../branches/BranchTypeIcon';
import CommitList from './CommitList';
import StoryList from './StoryList';
import ContributorList from './ContributorList';
import MergeReadiness from './MergeReadiness';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorMessage from '../common/ErrorMessage';

interface BranchDetailPanelProps {
  appId: string;
  branch: Branch;
  onClose: () => void;
}

export default function BranchDetailPanel({
  appId,
  branch,
  onClose,
}: BranchDetailPanelProps) {
  const { data, isLoading, error } = useBranchDetail(appId, branch.name);

  return (
    <div className="fixed inset-y-0 right-0 w-[480px] bg-white shadow-2xl border-l border-gray-200 z-40 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-semibold text-gray-900 truncate">
            {branch.name}
          </h2>
          <div className="flex items-center gap-2 mt-1">
            <BranchTypeIcon type={branch.type} />
            <BranchStatusBadge branch={branch} />
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 text-xl p-1"
        >
          ×
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {isLoading && <LoadingSpinner message="Loading branch details..." />}
        {error && <ErrorMessage message={error.message} />}

        {!isLoading && !error && (
          <>
            {/* Branch Info */}
            <section>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Branch Info</h3>
              <dl className="grid grid-cols-2 gap-2 text-sm">
                <dt className="text-gray-500">Created by</dt>
                <dd className="text-gray-900">{branch.createdBy || 'Unknown'}</dd>
                <dt className="text-gray-500">Created</dt>
                <dd className="text-gray-900">
                  {branch.createdDate
                    ? new Date(branch.createdDate).toLocaleDateString()
                    : 'Unknown'}
                </dd>
                <dt className="text-gray-500">Forked from</dt>
                <dd className="text-gray-900">{branch.forkedFromBranch || 'main'}</dd>
                <dt className="text-gray-500">Behind main</dt>
                <dd className="text-gray-900">{branch.commitsBehind}</dd>
                <dt className="text-gray-500">Ahead of main</dt>
                <dd className="text-gray-900">{branch.commitsAhead}</dd>
                <dt className="text-gray-500">Mendix version</dt>
                <dd className="text-gray-900">{branch.mendixVersion || 'N/A'}</dd>
              </dl>
            </section>

            {/* Merge Readiness */}
            <section>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">
                Merge Readiness
              </h3>
              <MergeReadiness branch={branch} />
            </section>

            {/* Contributors */}
            {data?.commits && (
              <section>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">
                  Contributors
                </h3>
                <ContributorList commits={data.commits} />
              </section>
            )}

            {/* Related Stories */}
            {data?.commits && (
              <section>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">
                  Related Stories
                </h3>
                <StoryList commits={data.commits} />
              </section>
            )}

            {/* Commit History */}
            {data?.commits && (
              <section>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">
                  Commits ({data.commits.length})
                </h3>
                <CommitList commits={data.commits} />
              </section>
            )}
          </>
        )}
      </div>
    </div>
  );
}
