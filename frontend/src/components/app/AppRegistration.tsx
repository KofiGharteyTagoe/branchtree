import { useState } from 'react';
import { useRegisterApp } from '../../hooks/useApps';

interface AppRegistrationProps {
  onRegistered?: (appId: string) => void;
}

export default function AppRegistration({ onRegistered }: AppRegistrationProps) {
  const [appId, setAppId] = useState('');
  const [appName, setAppName] = useState('');
  const [pat, setPat] = useState('');
  const [showForm, setShowForm] = useState(false);

  const registerApp = useRegisterApp();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!appId.trim() || !pat.trim()) return;

    try {
      await registerApp.mutateAsync({
        appId: appId.trim(),
        pat: pat.trim(),
        appName: appName.trim() || undefined,
      });
      onRegistered?.(appId.trim());
      setAppId('');
      setAppName('');
      setPat('');
      setShowForm(false);
    } catch {
      // Error is handled by the mutation
    }
  };

  if (!showForm) {
    return (
      <button onClick={() => setShowForm(true)} className="btn-primary">
        + Add App
      </button>
    );
  }

  return (
    <div className="card max-w-lg">
      <h3 className="text-lg font-semibold mb-4">Register a Mendix App</h3>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="appId" className="block text-sm font-medium text-gray-700 mb-1">
            App ID *
          </label>
          <input
            id="appId"
            type="text"
            value={appId}
            onChange={(e) => setAppId(e.target.value)}
            placeholder="e.g. c0af1725-edae-4345-aea7-2f94f7760e33"
            className="input"
            required
          />
          <p className="mt-1 text-xs text-gray-500">
            Find this in the Mendix Portal URL: https://sprintr.home.mendix.com/link/project/
            <strong>YOUR_APP_ID</strong>
          </p>
        </div>

        <div>
          <label htmlFor="pat" className="block text-sm font-medium text-gray-700 mb-1">
            Personal Access Token (PAT) *
          </label>
          <input
            id="pat"
            type="password"
            value={pat}
            onChange={(e) => setPat(e.target.value)}
            placeholder="Paste your Mendix PAT here"
            className="input"
            autoComplete="off"
            required
          />
          <p className="mt-1 text-xs text-gray-500">
            Get your PAT from{' '}
            <a
              href="https://user-settings.mendixcloud.com/link/developersettings"
              target="_blank"
              rel="noopener noreferrer"
              className="text-mendix-blue underline"
            >
              Mendix Developer Settings
            </a>
            . Select scope: <strong>mx:modelrepository:repo:read</strong>
          </p>
        </div>

        <div>
          <label htmlFor="appName" className="block text-sm font-medium text-gray-700 mb-1">
            App Name (optional)
          </label>
          <input
            id="appName"
            type="text"
            value={appName}
            onChange={(e) => setAppName(e.target.value)}
            placeholder="e.g. My Mendix App"
            className="input"
          />
        </div>

        {registerApp.error && (
          <p className="text-sm text-red-600">
            {registerApp.error.message}
          </p>
        )}

        <div className="flex gap-2">
          <button
            type="submit"
            className="btn-primary"
            disabled={registerApp.isPending || !appId.trim() || !pat.trim()}
          >
            {registerApp.isPending ? 'Registering...' : 'Register App'}
          </button>
          <button
            type="button"
            onClick={() => setShowForm(false)}
            className="btn-secondary"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
