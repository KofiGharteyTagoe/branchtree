import { useApps } from '../hooks/useApps';
import { useBranches } from '../hooks/useBranches';
import AppRegistration from '../components/app/AppRegistration';
import AlertBanner from '../components/alerts/AlertBanner';
import EmptyState from '../components/common/EmptyState';
import LoadingSpinner from '../components/common/LoadingSpinner';

interface DashboardPageProps {
  selectedAppId: string | null;
  onAppChange: (appId: string | null) => void;
}

export default function DashboardPage({
  selectedAppId,
  onAppChange,
}: DashboardPageProps) {
  const { data: appsData, isLoading: appsLoading } = useApps();
  const { data: branchData } = useBranches(selectedAppId || '');
  const apps = appsData?.apps || [];
  const branches = branchData?.branches || [];
  const alerts = branchData?.alerts || [];

  if (appsLoading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
        <AppRegistration
          onRegistered={(appId) => onAppChange(appId)}
        />
      </div>

      {apps.length === 0 ? (
        <EmptyState
          title="No Apps Registered"
          description="Register a Mendix app to start visualizing its branch structure. You'll need the App ID from the Mendix Portal."
        />
      ) : !selectedAppId ? (
        <EmptyState
          title="Select an App"
          description="Choose an app from the dropdown in the header to view its branch data."
        />
      ) : (
        <>
          {/* Alerts */}
          <AlertBanner alerts={alerts} />

          {/* Summary Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label="Total Branches"
              value={branches.length}
              color="blue"
            />
            <StatCard
              label="Active"
              value={branches.filter((b) => !b.isMerged && !b.isStale).length}
              color="green"
            />
            <StatCard
              label="Stale"
              value={branches.filter((b) => b.isStale).length}
              color="red"
            />
            <StatCard
              label="Merged"
              value={branches.filter((b) => b.isMerged).length}
              color="gray"
            />
          </div>

          {/* Branch Type Breakdown */}
          <div className="card">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">
              Branch Types
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {['main', 'feature', 'release', 'hotfix', 'development', 'unknown'].map(
                (type) => {
                  const count = branches.filter((b) => b.type === type).length;
                  if (count === 0) return null;
                  return (
                    <div key={type} className="text-center">
                      <div className="text-xl font-bold text-gray-900">{count}</div>
                      <div className="text-xs text-gray-500 capitalize">{type}</div>
                    </div>
                  );
                }
              )}
            </div>
          </div>

          {/* Alerts Detail */}
          {alerts.length > 0 && (
            <div className="card">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">
                Issues Found ({alerts.length})
              </h3>
              <div className="space-y-2">
                {alerts.map((alert, i) => (
                  <div
                    key={i}
                    className={`text-sm px-3 py-2 rounded-lg ${
                      alert.severity === 'error'
                        ? 'bg-red-50 text-red-700'
                        : 'bg-yellow-50 text-yellow-700'
                    }`}
                  >
                    <span className="font-medium">{alert.branchName}</span>:{' '}
                    {alert.message}
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: 'blue' | 'green' | 'red' | 'gray';
}) {
  const colorClasses = {
    blue: 'border-l-mendix-blue',
    green: 'border-l-green-500',
    red: 'border-l-red-500',
    gray: 'border-l-gray-400',
  };

  return (
    <div className={`card border-l-4 ${colorClasses[color]}`}>
      <div className="text-2xl font-bold text-gray-900">{value}</div>
      <div className="text-sm text-gray-500">{label}</div>
    </div>
  );
}
