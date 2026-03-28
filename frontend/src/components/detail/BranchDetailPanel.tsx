import { X, GitBranch, Users, BookOpen, GitCommit } from 'lucide-react';
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

export default function BranchDetailPanel({ appId, branch, onClose }: BranchDetailPanelProps) {
  const { data, isLoading, error } = useBranchDetail(appId, branch.name);

  const version =
    (branch.providerMetadata?.mendixVersion as string) ||
    (branch.providerMetadata?.version as string) ||
    null;

  const hasStories = data?.commits?.some((c) => {
    const stories = c.providerMetadata?.relatedStories as string[] | undefined;
    return stories && stories.length > 0;
  });

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-gray-900/20 backdrop-blur-sm z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed inset-y-0 right-0 w-[480px] bg-white shadow-panel z-50 flex flex-col animate-slide-in">
        {/* Header */}
        <div className="px-6 py-5 border-b border-surface-200/80">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-bold text-gray-900 truncate">{branch.name}</h2>
              <div className="flex items-center gap-2 mt-2">
                <BranchTypeIcon type={branch.type} />
                <BranchStatusBadge branch={branch} />
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-xl hover:bg-surface-100 transition-colors -mt-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {isLoading && <LoadingSpinner message="Loading branch details..." />}
          {error && <ErrorMessage message={error.message} />}

          {!isLoading && !error && (
            <>
              {/* Branch Info */}
              <section>
                <SectionHeader icon={GitBranch} title="Branch Info" />
                <dl className="grid grid-cols-2 gap-x-4 gap-y-3 mt-3">
                  <InfoItem label="Created by" value={branch.createdBy || 'Unknown'} />
                  <InfoItem
                    label="Created"
                    value={
                      branch.createdDate
                        ? new Date(branch.createdDate).toLocaleDateString()
                        : 'Unknown'
                    }
                  />
                  <InfoItem label="Forked from" value={branch.forkedFromBranch || 'main'} />
                  <InfoItem
                    label="Behind main"
                    value={String(branch.commitsBehind)}
                    highlight={branch.commitsBehind > 20}
                  />
                  <InfoItem label="Ahead of main" value={String(branch.commitsAhead)} />
                  {version && <InfoItem label="Version" value={version} />}
                </dl>
              </section>

              {/* Merge Readiness */}
              <section>
                <MergeReadiness branch={branch} />
              </section>

              {/* Contributors */}
              {data?.commits && (
                <section>
                  <SectionHeader icon={Users} title="Contributors" />
                  <div className="mt-3">
                    <ContributorList commits={data.commits} />
                  </div>
                </section>
              )}

              {/* Related Stories */}
              {hasStories && data?.commits && (
                <section>
                  <SectionHeader icon={BookOpen} title="Related Stories" />
                  <div className="mt-3">
                    <StoryList commits={data.commits} />
                  </div>
                </section>
              )}

              {/* Commit History */}
              {data?.commits && (
                <section>
                  <SectionHeader icon={GitCommit} title={`Commits (${data.commits.length})`} />
                  <div className="mt-3">
                    <CommitList commits={data.commits} />
                  </div>
                </section>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}

function SectionHeader({
  icon: Icon,
  title,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="w-4 h-4 text-gray-400" />
      <h3 className="text-sm font-semibold text-gray-700">{title}</h3>
    </div>
  );
}

function InfoItem({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <>
      <dt className="text-xs text-gray-400 font-medium">{label}</dt>
      <dd className={`text-sm font-medium ${highlight ? 'text-amber-600' : 'text-gray-900'}`}>
        {value}
      </dd>
    </>
  );
}
