import { GitBranch, Activity, AlertTriangle, GitMerge, Zap, TrendingUp, Shield } from 'lucide-react';
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
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
          <p className="text-sm text-gray-500 mt-0.5">Your branch health at a glance</p>
        </div>
        <AppRegistration onRegistered={(appId) => onAppChange(appId)} />
      </div>

      {apps.length === 0 ? (
        <EmptyState
          title="Welcome to BranchTree"
          description="Register your first app to start visualizing branches, tracking health, and spotting issues before they become problems."
        />
      ) : !selectedAppId ? (
        <EmptyState
          title="Select an App"
          description="Choose an app from the dropdown above to see its branch dashboard."
        />
      ) : (
        <>
          {/* Hero Stats Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatWidget
              label="Total Branches"
              value={branches.length}
              icon={GitBranch}
              gradient="from-brand-500 to-brand-600"
              bgAccent="bg-brand-50"
              textColor="text-brand-600"
            />
            <StatWidget
              label="Active"
              value={branches.filter((b) => !b.isMerged && !b.isStale).length}
              icon={Zap}
              gradient="from-emerald-500 to-emerald-600"
              bgAccent="bg-emerald-50"
              textColor="text-emerald-600"
            />
            <StatWidget
              label="Stale"
              value={branches.filter((b) => b.isStale).length}
              icon={AlertTriangle}
              gradient="from-amber-500 to-orange-500"
              bgAccent="bg-amber-50"
              textColor="text-amber-600"
            />
            <StatWidget
              label="Merged"
              value={branches.filter((b) => b.isMerged).length}
              icon={GitMerge}
              gradient="from-gray-400 to-gray-500"
              bgAccent="bg-gray-50"
              textColor="text-gray-500"
            />
          </div>

          {/* Second Row: Health Score + Branch Types + Alerts */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Repository Health Score */}
            <HealthScoreCard branches={branches} alerts={alerts} />

            {/* Branch Type Breakdown */}
            <BranchTypeCard branches={branches} />

            {/* Alerts Summary */}
            <AlertsSummaryCard alerts={alerts} />
          </div>

          {/* Alerts Detail */}
          <AlertBanner alerts={alerts} />
        </>
      )}
    </div>
  );
}

function StatWidget({
  label,
  value,
  icon: Icon,
  gradient,
  bgAccent,
  textColor,
}: {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  gradient: string;
  bgAccent: string;
  textColor: string;
}) {
  return (
    <div className="card-static group">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500 mb-1">{label}</p>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
        </div>
        <div className={`w-11 h-11 rounded-xl ${bgAccent} flex items-center justify-center transition-transform duration-200 group-hover:scale-110`}>
          <Icon className={`w-5 h-5 ${textColor}`} />
        </div>
      </div>
      <div className="mt-3 h-1.5 bg-surface-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full bg-gradient-to-r ${gradient} transition-all duration-700 ease-out`}
          style={{ width: `${Math.min((value / Math.max(1, value + 1)) * 100, 100)}%` }}
        />
      </div>
    </div>
  );
}

function HealthScoreCard({ branches, alerts }: { branches: any[]; alerts: any[] }) {
  const total = branches.length || 1;
  const stale = branches.filter((b) => b.isStale).length;
  const errors = alerts.filter((a) => a.severity === 'error').length;

  // Health calculation
  let score = 100;
  score -= (stale / total) * 30;
  score -= errors * 5;
  score -= branches.filter((b) => b.commitsBehind > 20).length * 3;
  score = Math.max(Math.round(score), 0);

  const scoreColor = score >= 80 ? 'text-emerald-500' : score >= 50 ? 'text-amber-500' : 'text-red-500';
  const ringColor = score >= 80 ? 'stroke-emerald-500' : score >= 50 ? 'stroke-amber-500' : 'stroke-red-500';
  const bgGlow = score >= 80 ? 'from-emerald-500/5 to-transparent' : score >= 50 ? 'from-amber-500/5 to-transparent' : 'from-red-500/5 to-transparent';

  const circumference = 2 * Math.PI * 54;
  const dashOffset = circumference - (score / 100) * circumference;

  return (
    <div className="card-static relative overflow-hidden">
      <div className={`absolute inset-0 bg-gradient-to-br ${bgGlow}`} />
      <div className="relative">
        <div className="flex items-center gap-2 mb-4">
          <Shield className="w-4 h-4 text-gray-500" />
          <h3 className="text-sm font-semibold text-gray-700">Repository Health</h3>
        </div>
        <div className="flex items-center justify-center">
          <div className="relative w-32 h-32">
            <svg className="w-32 h-32 -rotate-90" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="54" fill="none" className="stroke-surface-100" strokeWidth="8" />
              <circle
                cx="60" cy="60" r="54" fill="none"
                className={ringColor}
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={dashOffset}
                style={{ transition: 'stroke-dashoffset 1s ease-out' }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={`text-3xl font-bold ${scoreColor}`}>{score}</span>
              <span className="text-xs text-gray-400">/ 100</span>
            </div>
          </div>
        </div>
        <p className="text-center text-xs text-gray-500 mt-3">
          {score >= 80 ? 'Great shape!' : score >= 50 ? 'Needs attention' : 'Critical issues'}
        </p>
      </div>
    </div>
  );
}

function BranchTypeCard({ branches }: { branches: any[] }) {
  const types = ['main', 'feature', 'release', 'hotfix', 'development', 'unknown'] as const;
  const total = branches.length || 1;

  const typeConfig: Record<string, { label: string; color: string; bg: string }> = {
    main: { label: 'Main', color: 'bg-branch-main', bg: 'bg-branch-bg-main' },
    feature: { label: 'Feature', color: 'bg-branch-feature', bg: 'bg-branch-bg-feature' },
    release: { label: 'Release', color: 'bg-branch-release', bg: 'bg-branch-bg-release' },
    hotfix: { label: 'Hotfix', color: 'bg-branch-hotfix', bg: 'bg-branch-bg-hotfix' },
    development: { label: 'Dev', color: 'bg-branch-development', bg: 'bg-branch-bg-development' },
    unknown: { label: 'Other', color: 'bg-branch-unknown', bg: 'bg-branch-bg-unknown' },
  };

  return (
    <div className="card-static">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="w-4 h-4 text-gray-500" />
        <h3 className="text-sm font-semibold text-gray-700">Branch Types</h3>
      </div>
      <div className="space-y-3">
        {types.map((type) => {
          const count = branches.filter((b) => b.type === type).length;
          if (count === 0) return null;
          const pct = Math.round((count / total) * 100);
          const cfg = typeConfig[type];
          return (
            <div key={type} className="group">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-gray-600">{cfg.label}</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-gray-900">{count}</span>
                  <span className="text-xs text-gray-400">{pct}%</span>
                </div>
              </div>
              <div className="h-2 bg-surface-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${cfg.color} transition-all duration-700 ease-out`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function AlertsSummaryCard({ alerts }: { alerts: any[] }) {
  const errors = alerts.filter((a) => a.severity === 'error');
  const warnings = alerts.filter((a) => a.severity === 'warning');

  return (
    <div className="card-static">
      <div className="flex items-center gap-2 mb-4">
        <Activity className="w-4 h-4 text-gray-500" />
        <h3 className="text-sm font-semibold text-gray-700">Issues Overview</h3>
      </div>

      {alerts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-6">
          <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center mb-3">
            <Shield className="w-6 h-6 text-emerald-500" />
          </div>
          <p className="text-sm font-medium text-gray-700">All clear</p>
          <p className="text-xs text-gray-400 mt-0.5">No issues detected</p>
        </div>
      ) : (
        <div className="space-y-3">
          {errors.length > 0 && (
            <div className="flex items-center gap-3 p-3 bg-red-50 rounded-xl border border-red-100">
              <div className="w-9 h-9 rounded-lg bg-red-100 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-4 h-4 text-red-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-red-700">{errors.length} Critical</p>
                <p className="text-xs text-red-500 truncate">{errors[0]?.message}</p>
              </div>
            </div>
          )}
          {warnings.length > 0 && (
            <div className="flex items-center gap-3 p-3 bg-amber-50 rounded-xl border border-amber-100">
              <div className="w-9 h-9 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-amber-700">{warnings.length} Warnings</p>
                <p className="text-xs text-amber-500 truncate">{warnings[0]?.message}</p>
              </div>
            </div>
          )}
          {/* Recent alerts list */}
          <div className="mt-2 space-y-1.5 max-h-32 overflow-y-auto">
            {alerts.slice(0, 4).map((alert, i) => (
              <div key={i} className="flex items-center gap-2 text-xs text-gray-600 py-1">
                <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${alert.severity === 'error' ? 'bg-red-400' : 'bg-amber-400'}`} />
                <span className="font-medium text-gray-700">{alert.branchName}</span>
                <span className="truncate">{alert.message}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
