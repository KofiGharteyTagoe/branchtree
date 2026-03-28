import { useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import { useRegisterApp } from '../../hooks/useApps';
import type { ProviderType } from '../../types/app.types';

interface AppRegistrationProps {
  onRegistered: (appId: string) => void;
  onClose: () => void;
}

const PROVIDERS: { value: ProviderType; label: string; idLabel: string; idPlaceholder: string; idHelp: string; patLabel: string; patHelp: string; needsRepoUrl: boolean }[] = [
  {
    value: 'mendix',
    label: 'Mendix',
    idLabel: 'App ID',
    idPlaceholder: 'e.g. c0af1725-edae-4345-aea7-2f94f7760e33',
    idHelp: 'Find this in the Mendix Portal URL: https://sprintr.home.mendix.com/link/project/YOUR_APP_ID',
    patLabel: 'Personal Access Token (PAT)',
    patHelp: 'Get your PAT from Mendix Developer Settings. Select scope: mx:modelrepository:repo:read',
    needsRepoUrl: false,
  },
  {
    value: 'github',
    label: 'GitHub',
    idLabel: 'Repository',
    idPlaceholder: 'e.g. owner/repository',
    idHelp: 'The owner/repo identifier from the GitHub URL',
    patLabel: 'Personal Access Token',
    patHelp: 'Generate a token at GitHub Settings > Developer settings > Personal access tokens',
    needsRepoUrl: false,
  },
  {
    value: 'gitlab',
    label: 'GitLab',
    idLabel: 'Project',
    idPlaceholder: 'e.g. group/project or 12345',
    idHelp: 'The group/project path or project ID from GitLab',
    patLabel: 'Access Token',
    patHelp: 'Generate a token at GitLab Settings > Access Tokens with read_repository scope',
    needsRepoUrl: false,
  },
  {
    value: 'plain-git',
    label: 'Git Repository',
    idLabel: 'App ID',
    idPlaceholder: 'e.g. my-project',
    idHelp: 'A unique identifier for this repository (your choice)',
    patLabel: 'Credentials (optional)',
    patHelp: 'HTTPS credentials if required. Leave empty for public repos',
    needsRepoUrl: true,
  },
];

export default function AppRegistration({ onRegistered, onClose }: AppRegistrationProps) {
  const [providerType, setProviderType] = useState<ProviderType>('mendix');
  const [appId, setAppId] = useState('');
  const [appName, setAppName] = useState('');
  const [pat, setPat] = useState('');
  const [repoUrl, setRepoUrl] = useState('');

  const registerApp = useRegisterApp();
  const providerConfig = PROVIDERS.find((p) => p.value === providerType)!;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const needsPat = providerType !== 'plain-git';
    if (!appId.trim() || (needsPat && !pat.trim())) return;

    try {
      await registerApp.mutateAsync({
        appId: appId.trim(),
        pat: pat.trim() || 'none',
        providerType,
        appName: appName.trim() || undefined,
        repoUrl: repoUrl.trim() || undefined,
      });
      onRegistered(appId.trim());
    } catch {
      // Error is handled by the mutation
    }
  };

  const needsPat = providerType !== 'plain-git';

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-gray-900/30 backdrop-blur-sm z-50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div
          className="bg-white rounded-2xl shadow-panel border border-surface-200/60 w-full max-w-lg max-h-[90vh] overflow-y-auto pointer-events-auto animate-scale-in"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between px-6 pt-6 pb-2">
            <h3 className="text-lg font-semibold text-gray-900">Register an App</h3>
            <button
              onClick={onClose}
              className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-surface-100 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="px-6 pb-6 pt-2 space-y-5">
            {/* Provider Selector */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Provider
              </label>
              <div className="flex gap-2 flex-wrap">
                {PROVIDERS.map((p) => (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => {
                      setProviderType(p.value);
                      setAppId('');
                      setPat('');
                      setRepoUrl('');
                    }}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 border ${
                      providerType === p.value
                        ? 'bg-brand-50 text-brand-700 border-brand-200 shadow-soft'
                        : 'bg-white text-gray-600 border-surface-200 hover:bg-surface-50'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* App ID */}
            <div>
              <label htmlFor="reg-appId" className="block text-sm font-medium text-gray-700 mb-1.5">
                {providerConfig.idLabel} <span className="text-red-400">*</span>
              </label>
              <input
                id="reg-appId"
                type="text"
                value={appId}
                onChange={(e) => setAppId(e.target.value)}
                placeholder={providerConfig.idPlaceholder}
                className="input"
                required
              />
              <p className="mt-1.5 text-xs text-gray-400">{providerConfig.idHelp}</p>
            </div>

            {/* Repo URL (only for providers that need it) */}
            {providerConfig.needsRepoUrl && (
              <div>
                <label htmlFor="reg-repoUrl" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Repository URL <span className="text-red-400">*</span>
                </label>
                <input
                  id="reg-repoUrl"
                  type="text"
                  value={repoUrl}
                  onChange={(e) => setRepoUrl(e.target.value)}
                  placeholder="e.g. https://github.com/user/repo.git"
                  className="input"
                  required
                />
                <p className="mt-1.5 text-xs text-gray-400">The HTTPS clone URL of the Git repository</p>
              </div>
            )}

            {/* PAT / Credentials */}
            <div>
              <label htmlFor="reg-pat" className="block text-sm font-medium text-gray-700 mb-1.5">
                {providerConfig.patLabel} {needsPat && <span className="text-red-400">*</span>}
              </label>
              <input
                id="reg-pat"
                type="password"
                value={pat}
                onChange={(e) => setPat(e.target.value)}
                placeholder={needsPat ? 'Paste your token here' : 'Leave empty for public repos'}
                className="input"
                autoComplete="off"
                required={needsPat}
              />
              <p className="mt-1.5 text-xs text-gray-400">{providerConfig.patHelp}</p>
            </div>

            {/* App Name */}
            <div>
              <label htmlFor="reg-appName" className="block text-sm font-medium text-gray-700 mb-1.5">
                Display Name <span className="text-xs text-gray-400">(optional)</span>
              </label>
              <input
                id="reg-appName"
                type="text"
                value={appName}
                onChange={(e) => setAppName(e.target.value)}
                placeholder="e.g. My App"
                className="input"
              />
            </div>

            {registerApp.error && (
              <div className="bg-red-50 border border-red-200/60 rounded-xl px-4 py-3">
                <p className="text-sm text-red-600">{registerApp.error.message}</p>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                className="btn-primary flex items-center gap-2"
                disabled={registerApp.isPending || !appId.trim() || (needsPat && !pat.trim())}
              >
                {registerApp.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                {registerApp.isPending ? 'Registering...' : 'Register App'}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="btn-secondary"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
