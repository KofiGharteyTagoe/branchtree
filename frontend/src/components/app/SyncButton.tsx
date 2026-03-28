import { RefreshCw } from 'lucide-react';
import { useSync } from '../../hooks/useSync';
import { useApps } from '../../hooks/useApps';

interface SyncButtonProps {
  appId: string;
}

export default function SyncButton({ appId }: SyncButtonProps) {
  const sync = useSync();
  const { data } = useApps();
  const app = data?.apps.find((a) => a.appId === appId);
  const lastSynced = app?.lastSynced;

  return (
    <div className="flex items-center gap-2">
      {lastSynced && (
        <span className="text-xs text-gray-400 hidden lg:inline">
          {new Date(lastSynced).toLocaleString()}
        </span>
      )}
      <button
        onClick={() => sync.mutate(appId)}
        disabled={sync.isPending}
        className="flex items-center gap-1.5 bg-brand-50 text-brand-600 px-3 py-2 rounded-xl text-sm font-medium hover:bg-brand-100 transition-all duration-200 disabled:opacity-50 border border-brand-200/50"
        title="Sync now"
      >
        <RefreshCw className={`w-3.5 h-3.5 ${sync.isPending ? 'animate-spin' : ''}`} />
        <span className="hidden sm:inline">{sync.isPending ? 'Syncing' : 'Sync'}</span>
      </button>
      {sync.error && <span className="text-xs text-red-500">Failed</span>}
    </div>
  );
}
