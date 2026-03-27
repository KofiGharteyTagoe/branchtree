import { useApps } from '../../hooks/useApps';

interface AppSelectorProps {
  selectedAppId: string | null;
  onAppChange: (appId: string | null) => void;
}

export default function AppSelector({ selectedAppId, onAppChange }: AppSelectorProps) {
  const { data, isLoading } = useApps();
  const apps = data?.apps || [];

  return (
    <select
      value={selectedAppId || ''}
      onChange={(e) => onAppChange(e.target.value || null)}
      className="bg-gray-700 text-white text-sm rounded-lg px-3 py-1.5 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-mendix-blue min-w-[200px]"
      disabled={isLoading}
    >
      <option value="">
        {isLoading ? 'Loading apps...' : 'Select an app'}
      </option>
      {apps.map((app) => (
        <option key={app.appId} value={app.appId}>
          {app.appName || app.appId}
        </option>
      ))}
    </select>
  );
}
