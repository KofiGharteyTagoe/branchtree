import { useState } from 'react';
import {
  GitBranch,
  Activity,
  AlertTriangle,
  GitMerge,
  Zap,
  TrendingUp,
  Shield,
  HelpCircle,
} from 'lucide-react';
import { useBranches } from '../hooks/useBranches';
import AlertBanner from '../components/alerts/AlertBanner';
import LoadingSpinner from '../components/common/LoadingSpinner';
import type { Branch, Alert } from '../types/app.types';

interface DashboardPageProps {
  appId: string;
}

export default function DashboardPage({ appId }: DashboardPageProps) {
  const { data: branchData, isLoading } = useBranches(appId);
  const branches = branchData?.branches || [];
  const alerts = branchData?.alerts || [];

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
        <p className="text-sm text-gray-500 mt-0.5">Your branch health at a glance</p>
      </div>

      {/* Hero Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatWidget
          label="Total Branches"
          value={branches.length}
          icon={GitBranch}
          gradient="from-brand-500 to-brand-600"
          bgAccent="bg-brand-50"
          textColor="text-brand-600"
          hint="The total number of branches tracked in this repository, including active, stale, and merged."
        />
        <StatWidget
          label="Active"
          value={branches.filter((b) => !b.isMerged && !b.isStale).length}
          icon={Zap}
          gradient="from-emerald-500 to-emerald-600"
          bgAccent="bg-emerald-50"
          textColor="text-emerald-600"
          hint="Branches with recent commits that haven't been merged yet. These are your team's work in progress."
        />
        <StatWidget
          label="Stale"
          value={branches.filter((b) => b.isStale).length}
          icon={AlertTriangle}
          gradient="from-amber-500 to-orange-500"
          bgAccent="bg-amber-50"
          textColor="text-amber-600"
          hint="Branches with no activity in over 30 days. Consider merging or deleting these to keep the repo clean."
        />
        <StatWidget
          label="Merged"
          value={branches.filter((b) => b.isMerged).length}
          icon={GitMerge}
          gradient="from-gray-400 to-gray-500"
          bgAccent="bg-gray-50"
          textColor="text-gray-500"
          hint="Branches that have been merged back into main. These can usually be safely deleted."
        />
      </div>

      {/* Second Row: Health Score + Branch Types + Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <HealthScoreCard branches={branches} alerts={alerts} />
        <BranchTypeCard branches={branches} />
        <AlertsSummaryCard alerts={alerts} />
      </div>

      {/* Alerts Detail */}
      <AlertBanner alerts={alerts} />
    </div>
  );
}

/* ──────────────────────────── Info Tooltip ──────────────────────────── */

function InfoTooltip({ text }: { text: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={(e) => {
          e.stopPropagation();
          setOpen(!open);
        }}
        className="p-0.5 text-gray-300 hover:text-gray-500 transition-colors"
        aria-label="More info"
      >
        <HelpCircle className="w-3.5 h-3.5" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 bg-gray-800 text-white rounded-xl px-3 py-2.5 text-xs leading-relaxed shadow-elevated animate-scale-in">
            {text}
            <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px w-0 h-0 border-l-[6px] border-r-[6px] border-t-[6px] border-l-transparent border-r-transparent border-t-gray-800" />
          </div>
        </>
      )}
    </div>
  );
}

/* ──────────────────────────── Stat Widget ──────────────────────────── */

function StatWidget({
  label,
  value,
  icon: Icon,
  gradient,
  bgAccent,
  textColor,
  hint,
}: {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  gradient: string;
  bgAccent: string;
  textColor: string;
  hint: string;
}) {
  return (
    <div className="card-static group">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-1.5 mb-1">
            <p className="text-sm font-medium text-gray-500">{label}</p>
            <InfoTooltip text={hint} />
          </div>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
        </div>
        <div
          className={`w-11 h-11 rounded-xl ${bgAccent} flex items-center justify-center transition-transform duration-200 group-hover:scale-110`}
        >
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

/* ──────────────────────────── Health Score ──────────────────────────── */

function HealthScoreCard({ branches, alerts }: { branches: Branch[]; alerts: Alert[] }) {
  const total = branches.length || 1;
  const stale = branches.filter((b) => b.isStale).length;
  const errors = alerts.filter((a) => a.severity === 'error').length;
  const diverged = branches.filter((b) => b.commitsBehind > 20).length;

  let score = 100;
  score -= (stale / total) * 30;
  score -= errors * 5;
  score -= diverged * 3;
  score = Math.max(Math.round(score), 0);

  const scoreColor =
    score >= 80 ? 'text-emerald-500' : score >= 50 ? 'text-amber-500' : 'text-red-500';
  const ringColor =
    score >= 80 ? 'stroke-emerald-500' : score >= 50 ? 'stroke-amber-500' : 'stroke-red-500';
  const bgGlow =
    score >= 80
      ? 'from-emerald-500/5 to-transparent'
      : score >= 50
        ? 'from-amber-500/5 to-transparent'
        : 'from-red-500/5 to-transparent';

  const circumference = 2 * Math.PI * 54;
  const dashOffset = circumference - (score / 100) * circumference;

  // Build breakdown
  const factors: { label: string; impact: string; bad: boolean }[] = [];
  if (stale > 0)
    factors.push({
      label: `${stale} stale branch${stale > 1 ? 'es' : ''}`,
      impact: `-${Math.round((stale / total) * 30)} pts`,
      bad: true,
    });
  if (errors > 0)
    factors.push({
      label: `${errors} critical alert${errors > 1 ? 's' : ''}`,
      impact: `-${errors * 5} pts`,
      bad: true,
    });
  if (diverged > 0)
    factors.push({
      label: `${diverged} diverged branch${diverged > 1 ? 'es' : ''}`,
      impact: `-${diverged * 3} pts`,
      bad: true,
    });
  if (factors.length === 0) factors.push({ label: 'No issues found', impact: '', bad: false });

  return (
    <div className="card-static relative overflow-hidden">
      <div className={`absolute inset-0 bg-gradient-to-br ${bgGlow}`} />
      <div className="relative">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-gray-500" />
            <h3 className="text-sm font-semibold text-gray-700">Repository Health</h3>
          </div>
          <InfoTooltip text="A composite score based on stale branches (-30 pts max), critical alerts (-5 pts each), and diverged branches (-3 pts each). A score above 80 means the repo is in good shape." />
        </div>

        <div className="flex items-center gap-5">
          {/* Ring */}
          <div className="relative w-24 h-24 flex-shrink-0">
            <svg className="w-24 h-24 -rotate-90" viewBox="0 0 120 120">
              <circle
                cx="60"
                cy="60"
                r="54"
                fill="none"
                className="stroke-surface-100"
                strokeWidth="8"
              />
              <circle
                cx="60"
                cy="60"
                r="54"
                fill="none"
                className={ringColor}
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={dashOffset}
                style={{ transition: 'stroke-dashoffset 1s ease-out' }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={`text-2xl font-bold ${scoreColor}`}>{score}</span>
              <span className="text-[10px] text-gray-400">/ 100</span>
            </div>
          </div>

          {/* Breakdown */}
          <div className="flex-1 space-y-1.5">
            <p className={`text-sm font-semibold ${scoreColor}`}>
              {score >= 80 ? 'Great shape' : score >= 50 ? 'Needs attention' : 'Critical issues'}
            </p>
            {factors.map((f, i) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <span className={f.bad ? 'text-gray-600' : 'text-emerald-600'}>{f.label}</span>
                {f.impact && <span className="text-red-400 font-mono">{f.impact}</span>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ──────────────────────────── Branch Types ──────────────────────────── */

function BranchTypeCard({ branches }: { branches: Branch[] }) {
  const types = ['main', 'feature', 'release', 'hotfix', 'development', 'unknown'] as const;
  const total = branches.length || 1;

  const typeConfig: Record<string, { label: string; color: string; desc: string }> = {
    main: { label: 'Main', color: 'bg-branch-main', desc: 'Primary integration branch' },
    feature: { label: 'Feature', color: 'bg-branch-feature', desc: 'New features in development' },
    release: { label: 'Release', color: 'bg-branch-release', desc: 'Stabilisation before release' },
    hotfix: { label: 'Hotfix', color: 'bg-branch-hotfix', desc: 'Urgent production fixes' },
    development: {
      label: 'Dev',
      color: 'bg-branch-development',
      desc: 'Shared development branch',
    },
    unknown: { label: 'Other', color: 'bg-branch-unknown', desc: 'Uncategorised branches' },
  };

  return (
    <div className="card-static">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-gray-500" />
          <h3 className="text-sm font-semibold text-gray-700">Branch Types</h3>
        </div>
        <InfoTooltip text="Branches are classified by naming convention (e.g. feature/, release/, hotfix/). This shows the distribution across your repository." />
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
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">{cfg.label}</span>
                  <span className="text-[10px] text-gray-400 hidden group-hover:inline">
                    {cfg.desc}
                  </span>
                </div>
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

/* ──────────────────────────── Alerts Summary ──────────────────────────── */

function AlertsSummaryCard({ alerts }: { alerts: Alert[] }) {
  const errors = alerts.filter((a) => a.severity === 'error');
  const warnings = alerts.filter((a) => a.severity === 'warning');

  return (
    <div className="card-static">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-gray-500" />
          <h3 className="text-sm font-semibold text-gray-700">Issues Overview</h3>
        </div>
        <InfoTooltip text="Automated checks that flag potential problems: stale branches (no commits in 30+ days), divergence (20+ commits behind main), and version mismatches across branches." />
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
          <div className="mt-2 space-y-1.5 max-h-32 overflow-y-auto">
            {alerts.slice(0, 4).map((alert, i) => (
              <div key={i} className="flex items-center gap-2 text-xs text-gray-600 py-1">
                <div
                  className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${alert.severity === 'error' ? 'bg-red-400' : 'bg-amber-400'}`}
                />
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
