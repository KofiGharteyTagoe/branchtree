import { ChevronDown } from 'lucide-react';
import { useApps } from '../../hooks/useApps';

interface AppSelectorProps {
  selectedAppId: string | null;
  onAppChange: (appId: string | null) => void;
}

export default function AppSelector({ selectedAppId, onAppChange }: AppSelectorProps) {
  const { data, isLoading } = useApps();
  const apps = data?.apps || [];

  return (
    <div className="relative">
      <select
        id="app-selector"
        name="app-selector"
        value={selectedAppId || ''}
        onChange={(e) => onAppChange(e.target.value || null)}
        className="appearance-none bg-surface-50 text-sm text-gray-700 font-medium rounded-xl pl-4 pr-9 py-2 border border-surface-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400 transition-all duration-200 min-w-[180px] cursor-pointer"
        disabled={isLoading}
      >
        <option value="">{isLoading ? 'Loading...' : 'Select an app'}</option>
        {apps.map((app) => (
          <option key={app.appId} value={app.appId}>
            {app.appName || app.appId}
            {app.providerType && app.providerType !== 'mendix' ? ` (${app.providerType})` : ''}
          </option>
        ))}
      </select>
      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
    </div>
  );
}
