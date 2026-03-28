import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, GitBranch, Clock, ChevronRight, Folder } from 'lucide-react';
import { useApps } from '../hooks/useApps';
import AppRegistration from '../components/app/AppRegistration';
import LoadingSpinner from '../components/common/LoadingSpinner';
import type { App, ProviderType } from '../types/app.types';

interface ProjectListPageProps {
  onAppChange: (appId: string) => void;
}

const providerMeta: Record<ProviderType, { label: string; color: string; bg: string }> = {
  mendix: { label: 'Mendix', color: 'text-brand-600', bg: 'bg-brand-50' },
  github: { label: 'GitHub', color: 'text-gray-700', bg: 'bg-gray-50' },
  gitlab: { label: 'GitLab', color: 'text-orange-600', bg: 'bg-orange-50' },
  'plain-git': { label: 'Git', color: 'text-emerald-600', bg: 'bg-emerald-50' },
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

export default function ProjectListPage({ onAppChange }: ProjectListPageProps) {
  const { data, isLoading } = useApps();
  const [search, setSearch] = useState('');
  const [showRegistration, setShowRegistration] = useState(false);
  const navigate = useNavigate();
  const apps = data?.apps || [];

  const filtered = apps.filter((app) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      app.appName?.toLowerCase().includes(q) ||
      app.appId.toLowerCase().includes(q) ||
      app.providerType.toLowerCase().includes(q)
    );
  });

  const handleSelect = (app: App) => {
    onAppChange(app.appId);
    navigate('/dashboard');
  };

  const handleRegistered = (appId: string) => {
    setShowRegistration(false);
    onAppChange(appId);
    navigate('/dashboard');
  };

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Projects</h2>
        <p className="text-sm text-gray-500 mt-0.5">
          Select a project to explore its branches, or add a new one.
        </p>
      </div>

      {/* Search + Add */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            id="project-search"
            name="project-search"
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search projects..."
            className="input pl-10"
          />
        </div>
        <button
          onClick={() => setShowRegistration(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add App
        </button>
      </div>

      {/* Project List */}
      {apps.length === 0 ? (
        <EmptyProjectState onAdd={() => setShowRegistration(true)} />
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-sm text-gray-400">No projects match "{search}"</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((app) => (
            <ProjectCard key={app.appId} app={app} onClick={() => handleSelect(app)} />
          ))}
        </div>
      )}

      {/* Registration Modal */}
      {showRegistration && (
        <AppRegistration
          onRegistered={handleRegistered}
          onClose={() => setShowRegistration(false)}
        />
      )}
    </div>
  );
}

function ProjectCard({ app, onClick }: { app: App; onClick: () => void }) {
  const provider = providerMeta[app.providerType] || providerMeta['plain-git'];

  return (
    <button
      onClick={onClick}
      className="card-static text-left group hover:shadow-elevated hover:border-brand-200/60 transition-all duration-200 cursor-pointer w-full"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-50 to-brand-100 flex items-center justify-center">
          <Folder className="w-5 h-5 text-brand-500" />
        </div>
        <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-brand-500 group-hover:translate-x-0.5 transition-all" />
      </div>

      <h3 className="text-base font-semibold text-gray-900 mb-1 truncate group-hover:text-brand-600 transition-colors">
        {app.appName || app.appId}
      </h3>

      {app.appName && <p className="text-xs text-gray-400 font-mono truncate mb-3">{app.appId}</p>}

      <div className="flex items-center gap-3 mt-auto pt-3 border-t border-surface-100">
        <span
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-semibold ${provider.bg} ${provider.color}`}
        >
          <GitBranch className="w-3 h-3" />
          {provider.label}
        </span>

        {app.lastSynced && (
          <span className="flex items-center gap-1 text-xs text-gray-400">
            <Clock className="w-3 h-3" />
            {timeAgo(app.lastSynced)}
          </span>
        )}

        {!app.lastSynced && <span className="text-xs text-amber-500 font-medium">Not synced</span>}
      </div>
    </button>
  );
}

function EmptyProjectState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-20 h-20 bg-gradient-to-br from-brand-50 to-brand-100 rounded-3xl flex items-center justify-center mb-6 shadow-soft">
        <GitBranch className="w-9 h-9 text-brand-400" />
      </div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">Welcome to BranchTree</h3>
      <p className="text-sm text-gray-500 max-w-sm leading-relaxed mb-6">
        Register your first project to start visualizing branches, tracking health, and spotting
        issues before they become problems.
      </p>
      <button onClick={onAdd} className="btn-primary flex items-center gap-2">
        <Plus className="w-4 h-4" />
        Add Your First App
      </button>
    </div>
  );
}
