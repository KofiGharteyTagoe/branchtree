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
    <div className="flex items-center gap-3">
      {lastSynced && (
        <span className="text-xs text-gray-400">
          Last synced: {new Date(lastSynced).toLocaleString()}
        </span>
      )}
      <button
        onClick={() => sync.mutate(appId)}
        disabled={sync.isPending}
        className="bg-mendix-blue text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors disabled:opacity-50"
      >
        {sync.isPending ? 'Syncing...' : 'Sync Now'}
      </button>
      {sync.error && (
        <span className="text-xs text-red-400">
          Sync failed
        </span>
      )}
    </div>
  );
}
