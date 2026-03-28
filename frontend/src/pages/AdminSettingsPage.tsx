import { useState, useEffect, useCallback } from 'react';
import {
  Settings,
  Save,
  Eye,
  EyeOff,
  RefreshCw,
  Lock,
  ExternalLink,
  Info,
  Users,
  MessageSquare,
  Shield,
  ShieldOff,
  Trash2,
  Search,
  Bug,
  Lightbulb,
  Sparkles,
  CircleDot,
  X,
  ChevronDown,
  AppWindow,
  GitBranch,
  Database,
} from 'lucide-react';
import { apiClient } from '../config/api';

// ─── Types ──────────────────────────────────────────────────────────────────

type TabId = 'settings' | 'users' | 'feedback';

interface SettingItem {
  key: string;
  value: string;
  isSecret: boolean;
  updatedAt: string;
}

interface AdminUser {
  id: number;
  email: string;
  displayName: string | null;
  avatarUrl: string | null;
  oauthProvider: string;
  isAdmin: boolean;
  isRestricted: boolean;
  restrictionReason: string | null;
  createdAt: string;
  lastLogin: string | null;
  appCount: number;
  branchCount: number;
  commitCount: number;
}

interface FeedbackItem {
  id: number;
  user_id: number;
  category: string;
  title: string;
  description: string;
  status: string;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
  user_email: string;
  user_display_name: string | null;
}

// ─── Settings constants ─────────────────────────────────────────────────────

const SETTING_CATEGORIES: Record<string, { label: string; keys: string[]; help?: string }> = {
  oauth_google: {
    label: 'Google OAuth',
    keys: ['google_client_id', 'google_client_secret'],
    help: 'google',
  },
  oauth_microsoft: {
    label: 'Microsoft OAuth',
    keys: ['microsoft_client_id', 'microsoft_client_secret'],
    help: 'microsoft',
  },
  urls: {
    label: 'URLs',
    keys: ['cors_origin', 'oauth_callback_url', 'frontend_url'],
  },
  thresholds: {
    label: 'Thresholds & Intervals',
    keys: ['sync_interval_minutes', 'stale_branch_days', 'divergence_threshold'],
  },
  security: {
    label: 'Security (auto-generated)',
    keys: ['jwt_secret', 'encryption_key'],
  },
};

const ALL_EXPECTED_KEYS = Object.values(SETTING_CATEGORIES).flatMap((c) => c.keys);

const SECRET_KEYS = new Set([
  'jwt_secret',
  'encryption_key',
  'google_client_secret',
  'microsoft_client_secret',
]);

const SETTING_DESCRIPTIONS: Record<string, string> = {
  jwt_secret:
    'Secret key for signing JWT tokens. Auto-generated on first run — only change if you need to rotate.',
  encryption_key:
    'Key for encrypting PATs at rest. Auto-generated on first run — only change if you need to rotate.',
  google_client_id: 'The Client ID from your Google Cloud OAuth 2.0 credential',
  google_client_secret: 'The Client Secret from your Google Cloud OAuth 2.0 credential',
  microsoft_client_id: 'The Application (client) ID from your Microsoft Entra ID app registration',
  microsoft_client_secret: 'A Client Secret value from your Microsoft Entra ID app registration',
  cors_origin: 'The URL where your frontend runs (e.g. http://localhost:5173)',
  oauth_callback_url:
    'The URL where your backend runs (e.g. http://localhost:3001) — used for OAuth redirect URIs',
  frontend_url: 'The URL to redirect users to after OAuth login (usually same as CORS origin)',
  sync_interval_minutes: 'How often (in minutes) to automatically sync all registered apps',
  stale_branch_days: 'Days of inactivity before a branch is marked as stale',
  divergence_threshold: 'Number of commits behind main before a divergence alert is raised',
};

const SETTING_PLACEHOLDERS: Record<string, string> = {
  google_client_id: '123456789-abcdefg.apps.googleusercontent.com',
  google_client_secret: 'GOCSPX-...',
  microsoft_client_id: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
  microsoft_client_secret: 'abc8Q~...',
  cors_origin: 'http://localhost:5173',
  oauth_callback_url: 'http://localhost:3001',
  frontend_url: 'http://localhost:5173',
  sync_interval_minutes: '15',
  stale_branch_days: '30',
  divergence_threshold: '20',
};

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  bug: <Bug className="w-3.5 h-3.5" />,
  improvement: <Lightbulb className="w-3.5 h-3.5" />,
  feature: <Sparkles className="w-3.5 h-3.5" />,
  general: <CircleDot className="w-3.5 h-3.5" />,
};

const STATUS_COLORS: Record<string, string> = {
  open: 'bg-blue-100 text-blue-700',
  in_progress: 'bg-amber-100 text-amber-700',
  resolved: 'bg-green-100 text-green-700',
  dismissed: 'bg-surface-100 text-surface-500',
};

// ─── Helpers ────────────────────────────────────────────────────────────────

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return 'Never';
  const date = new Date(dateStr);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return date.toLocaleDateString();
}

// ─── Settings Tab ───────────────────────────────────────────────────────────

function SettingsTab() {
  const [settings, setSettings] = useState<SettingItem[]>([]);
  const [editValues, setEditValues] = useState<Record<string, string>>({});
  const [revealedSecrets, setRevealedSecrets] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [expandedHelp, setExpandedHelp] = useState<string | null>(null);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [passwordMessage, setPasswordMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);
  const [changingPassword, setChangingPassword] = useState(false);

  const fetchSettings = useCallback(async () => {
    try {
      const res = await apiClient.get<{ settings: SettingItem[] }>('/admin/settings');
      const fetched = res.data.settings;
      setSettings(fetched);
      const vals: Record<string, string> = {};
      const fetchedKeys = new Set(fetched.map((s) => s.key));
      for (const s of fetched) vals[s.key] = s.value;
      for (const key of ALL_EXPECTED_KEYS) {
        if (!fetchedKeys.has(key)) vals[key] = '';
      }
      setEditValues(vals);
      setHasChanges(false);
    } catch {
      setMessage({ type: 'error', text: 'Failed to load settings' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleValueChange = (key: string, value: string) => {
    setEditValues((prev) => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    const updates: Record<string, string> = {};
    const fetchedMap = new Map(settings.map((s) => [s.key, s]));
    for (const key of Object.keys(editValues)) {
      const newVal = editValues[key];
      const existing = fetchedMap.get(key);
      if (existing?.isSecret) {
        if (newVal && newVal !== '••••••••') updates[key] = newVal;
      } else if (!existing) {
        if (newVal) updates[key] = newVal;
      } else if (newVal !== existing.value) {
        updates[key] = newVal;
      }
    }
    if (Object.keys(updates).length === 0) {
      setMessage({ type: 'success', text: 'No changes to save' });
      setSaving(false);
      return;
    }
    try {
      await apiClient.put('/admin/settings', { updates });
      setMessage({ type: 'success', text: 'Settings saved successfully' });
      await fetchSettings();
    } catch (err) {
      setMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Failed to save settings',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMessage(null);
    if (newPassword !== confirmNewPassword) {
      setPasswordMessage({ type: 'error', text: 'New passwords do not match' });
      return;
    }
    if (newPassword.length < 12) {
      setPasswordMessage({ type: 'error', text: 'New password must be at least 12 characters' });
      return;
    }
    setChangingPassword(true);
    try {
      await apiClient.post('/admin/change-password', { currentPassword, newPassword });
      setPasswordMessage({ type: 'success', text: 'Password changed successfully' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (err) {
      setPasswordMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Failed to change password',
      });
    } finally {
      setChangingPassword(false);
    }
  };

  const toggleSecretVisibility = (key: string) => {
    setRevealedSecrets((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const renderSettingInput = (key: string) => {
    const isSecret = SECRET_KEYS.has(key);
    const isRevealed = revealedSecrets.has(key);
    const existing = settings.find((s) => s.key === key);
    return (
      <div key={key} className="flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <label htmlFor={`setting-${key}`} className="text-sm font-medium text-surface-700">
            {key}
            {isSecret && <span className="ml-2 text-xs text-amber-600 font-normal">(secret)</span>}
          </label>
          {isSecret && (
            <button
              type="button"
              onClick={() => toggleSecretVisibility(key)}
              className="text-surface-400 hover:text-surface-600"
            >
              {isRevealed ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          )}
        </div>
        <p className="text-xs text-surface-400 mb-1">{SETTING_DESCRIPTIONS[key] || ''}</p>
        <input
          id={`setting-${key}`}
          name={`setting-${key}`}
          type={isSecret && !isRevealed ? 'password' : 'text'}
          value={editValues[key] || ''}
          onChange={(e) => handleValueChange(key, e.target.value)}
          className="w-full px-3 py-2 border border-surface-200 rounded-lg text-sm text-surface-900 placeholder-surface-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent font-mono"
          placeholder={
            isSecret && existing ? 'Enter new value to update' : SETTING_PLACEHOLDERS[key] || ''
          }
        />
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600" />
      </div>
    );
  }

  const categorizedKeys = new Set(ALL_EXPECTED_KEYS);
  const uncategorizedSettings = settings.filter(
    (s) => !categorizedKeys.has(s.key) && s.key !== 'setup_complete' && s.key !== 'setup_token',
  );

  return (
    <>
      {message && (
        <div
          className={`mb-6 p-3 rounded-xl text-sm ${message.type === 'success' ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-700'}`}
        >
          {message.text}
        </div>
      )}

      <div className="space-y-6">
        {Object.entries(SETTING_CATEGORIES).map(([catKey, category]) => (
          <div key={catKey} className="bg-white rounded-2xl shadow-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-surface-900">{category.label}</h2>
              {category.help && (
                <button
                  onClick={() =>
                    setExpandedHelp(expandedHelp === category.help ? null : category.help!)
                  }
                  className="flex items-center gap-1 text-xs text-brand-600 hover:text-brand-700 font-medium"
                >
                  <Info className="w-3.5 h-3.5" />
                  {expandedHelp === category.help ? 'Hide setup guide' : 'How to set up'}
                </button>
              )}
            </div>

            {expandedHelp === 'google' && catKey === 'oauth_google' && (
              <div className="mb-5 p-4 bg-blue-50 border border-blue-200 rounded-xl text-sm text-blue-800 space-y-3">
                <p className="font-semibold text-base">Google OAuth Setup Guide</p>
                <div className="space-y-4 text-blue-700">
                  <div>
                    <p className="font-semibold text-blue-800">Step 1: Open Google Cloud Console</p>
                    <p className="mt-1">
                      Go to{' '}
                      <a
                        href="https://console.cloud.google.com/apis/credentials"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline font-medium inline-flex items-center gap-1"
                      >
                        Google Cloud Console &mdash; Credentials{' '}
                        <ExternalLink className="w-3 h-3" />
                      </a>{' '}
                      and click <strong>"Create Credentials"</strong> &rarr;{' '}
                      <strong>"OAuth client ID"</strong>.
                    </p>
                  </div>
                  <div>
                    <p className="font-semibold text-blue-800">
                      Step 2: Configure OAuth Consent Screen (if prompted)
                    </p>
                    <p className="mt-1">
                      If this is your first OAuth client, set up the consent screen:
                    </p>
                    <table className="mt-2 w-full text-xs border border-blue-200 rounded-lg overflow-hidden">
                      <tbody>
                        <tr className="border-b border-blue-200">
                          <td className="px-3 py-2 font-medium bg-blue-100 w-1/3">User type</td>
                          <td className="px-3 py-2">
                            <strong>External</strong> (or Internal if Google Workspace org)
                          </td>
                        </tr>
                        <tr className="border-b border-blue-200">
                          <td className="px-3 py-2 font-medium bg-blue-100">App name</td>
                          <td className="px-3 py-2">
                            <strong>BranchTree</strong>
                          </td>
                        </tr>
                        <tr className="border-b border-blue-200">
                          <td className="px-3 py-2 font-medium bg-blue-100">User support email</td>
                          <td className="px-3 py-2">Your email address</td>
                        </tr>
                        <tr>
                          <td className="px-3 py-2 font-medium bg-blue-100">Scopes</td>
                          <td className="px-3 py-2">
                            Add: <strong>email</strong>, <strong>profile</strong>,{' '}
                            <strong>openid</strong>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <div>
                    <p className="font-semibold text-blue-800">
                      Step 3: Create the OAuth Client ID
                    </p>
                    <table className="mt-2 w-full text-xs border border-blue-200 rounded-lg overflow-hidden">
                      <tbody>
                        <tr className="border-b border-blue-200">
                          <td className="px-3 py-2 font-medium bg-blue-100 w-1/3">
                            Application type
                          </td>
                          <td className="px-3 py-2">
                            <strong>Web application</strong>
                          </td>
                        </tr>
                        <tr className="border-b border-blue-200">
                          <td className="px-3 py-2 font-medium bg-blue-100">
                            Authorised JavaScript origins
                          </td>
                          <td className="px-3 py-2">
                            <code className="bg-blue-100 px-1.5 py-0.5 rounded font-mono">
                              http://localhost:5173
                            </code>
                          </td>
                        </tr>
                        <tr>
                          <td className="px-3 py-2 font-medium bg-blue-100">
                            Authorised redirect URIs
                          </td>
                          <td className="px-3 py-2">
                            <code className="bg-blue-100 px-1.5 py-0.5 rounded font-mono">
                              http://localhost:3001/api/auth/google/callback
                            </code>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <div className="p-2 bg-blue-100 rounded-lg text-xs">
                    <strong>Step 4:</strong> Copy your Client ID and Client Secret from the Google
                    dialog, paste into the fields below, then click <strong>Save Changes</strong>.
                  </div>
                </div>
              </div>
            )}

            {expandedHelp === 'microsoft' && catKey === 'oauth_microsoft' && (
              <div className="mb-5 p-4 bg-blue-50 border border-blue-200 rounded-xl text-sm text-blue-800 space-y-3">
                <p className="font-semibold text-base">Microsoft OAuth Setup Guide</p>
                <div className="space-y-4 text-blue-700">
                  <div>
                    <p className="font-semibold text-blue-800">
                      Step 1: Register a New Application
                    </p>
                    <p className="mt-1">
                      Go to{' '}
                      <a
                        href="https://portal.azure.com/#view/Microsoft_AAD_RegisteredApps/ApplicationsListBlade"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline font-medium inline-flex items-center gap-1"
                      >
                        Microsoft Entra ID &mdash; App registrations{' '}
                        <ExternalLink className="w-3 h-3" />
                      </a>{' '}
                      and click <strong>"New registration"</strong>.
                    </p>
                    <table className="mt-2 w-full text-xs border border-blue-200 rounded-lg overflow-hidden">
                      <tbody>
                        <tr className="border-b border-blue-200">
                          <td className="px-3 py-2 font-medium bg-blue-100 w-1/3">
                            Supported account types
                          </td>
                          <td className="px-3 py-2">
                            <strong>
                              Accounts in any organizational directory and personal Microsoft
                              accounts
                            </strong>
                          </td>
                        </tr>
                        <tr>
                          <td className="px-3 py-2 font-medium bg-blue-100">Redirect URI</td>
                          <td className="px-3 py-2">
                            Platform: <strong>Web</strong>, URI:{' '}
                            <code className="bg-blue-100 px-1.5 py-0.5 rounded font-mono">
                              http://localhost:3001/api/auth/microsoft/callback
                            </code>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <div>
                    <p className="font-semibold text-blue-800">
                      Step 2: Copy Application (Client) ID, then create a Client Secret under
                      Certificates & secrets.
                    </p>
                    <div className="mt-2 p-2 bg-amber-100 border border-amber-300 rounded-lg text-xs text-amber-800">
                      <strong>Important:</strong> Copy the secret value immediately! Microsoft only
                      shows it once.
                    </div>
                  </div>
                  <div className="p-2 bg-blue-100 rounded-lg text-xs">
                    <strong>Step 3:</strong> Paste both values below, then click{' '}
                    <strong>Save Changes</strong>.
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-4">{category.keys.map((key) => renderSettingInput(key))}</div>
          </div>
        ))}

        {uncategorizedSettings.length > 0 && (
          <div className="bg-white rounded-2xl shadow-card p-6">
            <h2 className="text-lg font-semibold text-surface-900 mb-4">Other Settings</h2>
            <div className="space-y-4">
              {uncategorizedSettings.map((s) => renderSettingInput(s.key))}
            </div>
          </div>
        )}
      </div>

      <div className="mt-6 flex gap-3">
        <button
          onClick={handleSave}
          disabled={saving || !hasChanges}
          className="flex items-center gap-2 px-6 py-3 bg-brand-600 text-white rounded-xl font-medium hover:bg-brand-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      <div className="mt-10 bg-white rounded-2xl shadow-card p-6">
        <div className="flex items-center gap-2 mb-4">
          <Lock className="w-5 h-5 text-surface-600" />
          <h2 className="text-lg font-semibold text-surface-900">Change Admin Password</h2>
        </div>
        {passwordMessage && (
          <div
            className={`mb-4 p-3 rounded-xl text-sm ${passwordMessage.type === 'success' ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-700'}`}
          >
            {passwordMessage.text}
          </div>
        )}
        <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1">
              Current Password
            </label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full px-3 py-2 border border-surface-200 rounded-lg text-sm text-surface-900 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1">
              New Password (min. 12 characters)
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-3 py-2 border border-surface-200 rounded-lg text-sm text-surface-900 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
              minLength={12}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1">
              Confirm New Password
            </label>
            <input
              type="password"
              value={confirmNewPassword}
              onChange={(e) => setConfirmNewPassword(e.target.value)}
              className="w-full px-3 py-2 border border-surface-200 rounded-lg text-sm text-surface-900 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
              minLength={12}
              required
            />
          </div>
          <button
            type="submit"
            disabled={changingPassword}
            className="flex items-center gap-2 px-6 py-3 bg-surface-800 text-white rounded-xl font-medium hover:bg-surface-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {changingPassword ? 'Changing...' : 'Change Password'}
          </button>
        </form>
      </div>
    </>
  );
}

// ─── Users Tab ──────────────────────────────────────────────────────────────

function UsersTab() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [restrictModal, setRestrictModal] = useState<{ userId: number; email: string } | null>(
    null,
  );
  const [restrictReason, setRestrictReason] = useState('');
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchUsers = useCallback(async () => {
    try {
      const res = await apiClient.get<{ users: AdminUser[] }>('/admin/users');
      setUsers(res.data.users);
    } catch {
      setMessage({ type: 'error', text: 'Failed to load users' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleRestrict = async () => {
    if (!restrictModal || !restrictReason.trim()) return;
    setActionLoading(restrictModal.userId);
    try {
      await apiClient.post(`/admin/users/${restrictModal.userId}/restrict`, {
        reason: restrictReason.trim(),
      });
      setMessage({ type: 'success', text: `${restrictModal.email} has been restricted` });
      setRestrictModal(null);
      setRestrictReason('');
      await fetchUsers();
    } catch (err) {
      setMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Failed to restrict user',
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleUnrestrict = async (userId: number) => {
    setActionLoading(userId);
    try {
      await apiClient.post(`/admin/users/${userId}/unrestrict`);
      setMessage({ type: 'success', text: 'Restriction removed' });
      await fetchUsers();
    } catch (err) {
      setMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Failed to unrestrict user',
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (userId: number, email: string) => {
    if (
      !window.confirm(
        `Are you sure you want to delete ${email}? This will also delete all their apps, branches, and commits. This action cannot be undone.`,
      )
    )
      return;
    setActionLoading(userId);
    try {
      await apiClient.delete(`/admin/users/${userId}`);
      setMessage({ type: 'success', text: `${email} has been deleted` });
      await fetchUsers();
    } catch (err) {
      setMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Failed to delete user',
      });
    } finally {
      setActionLoading(null);
    }
  };

  const filteredUsers = users.filter((u) => {
    const q = searchQuery.toLowerCase();
    return (
      u.email.toLowerCase().includes(q) ||
      (u.displayName || '').toLowerCase().includes(q) ||
      u.oauthProvider.toLowerCase().includes(q)
    );
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600" />
      </div>
    );
  }

  return (
    <>
      {message && (
        <div
          className={`mb-6 p-3 rounded-xl text-sm ${message.type === 'success' ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-700'}`}
        >
          {message.text}
        </div>
      )}

      {/* Summary stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-2xl shadow-card p-4 text-center">
          <p className="text-2xl font-bold text-surface-900">{users.length}</p>
          <p className="text-xs text-surface-500 mt-1">Total Users</p>
        </div>
        <div className="bg-white rounded-2xl shadow-card p-4 text-center">
          <p className="text-2xl font-bold text-surface-900">
            {users.filter((u) => u.isAdmin).length}
          </p>
          <p className="text-xs text-surface-500 mt-1">Admins</p>
        </div>
        <div className="bg-white rounded-2xl shadow-card p-4 text-center">
          <p className="text-2xl font-bold text-red-600">
            {users.filter((u) => u.isRestricted).length}
          </p>
          <p className="text-xs text-surface-500 mt-1">Restricted</p>
        </div>
        <div className="bg-white rounded-2xl shadow-card p-4 text-center">
          <p className="text-2xl font-bold text-surface-900">
            {users.reduce((sum, u) => sum + u.appCount, 0)}
          </p>
          <p className="text-xs text-surface-500 mt-1">Total Apps</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search users by name, email, or provider..."
          className="w-full pl-10 pr-4 py-2.5 border border-surface-200 rounded-xl text-sm text-surface-900 placeholder-surface-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
        />
      </div>

      {/* Users list */}
      <div className="space-y-3">
        {filteredUsers.map((user) => (
          <div
            key={user.id}
            className={`bg-white rounded-2xl shadow-card p-5 transition-colors ${user.isRestricted ? 'border-l-4 border-red-400' : ''}`}
          >
            <div className="flex items-start justify-between gap-4">
              {/* User info */}
              <div className="flex items-start gap-3 min-w-0">
                {user.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt=""
                    className="w-10 h-10 rounded-full flex-shrink-0"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-sm font-bold flex-shrink-0">
                    {(user.displayName || user.email)[0].toUpperCase()}
                  </div>
                )}
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-surface-900 truncate">
                      {user.displayName || user.email}
                    </span>
                    {user.isAdmin && (
                      <span className="px-1.5 py-0.5 text-[10px] font-bold uppercase bg-brand-100 text-brand-700 rounded">
                        Admin
                      </span>
                    )}
                    {user.isRestricted && (
                      <span className="px-1.5 py-0.5 text-[10px] font-bold uppercase bg-red-100 text-red-700 rounded">
                        Restricted
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-surface-500 truncate">{user.email}</p>
                  {user.isRestricted && user.restrictionReason && (
                    <p className="text-xs text-red-500 mt-1">Reason: {user.restrictionReason}</p>
                  )}
                  <div className="flex items-center gap-4 mt-2 text-xs text-surface-400">
                    <span className="capitalize">{user.oauthProvider}</span>
                    <span>Joined {timeAgo(user.createdAt)}</span>
                    <span>Last login {timeAgo(user.lastLogin)}</span>
                  </div>
                </div>
              </div>

              {/* Usage metadata */}
              <div className="flex items-center gap-4 flex-shrink-0">
                <div className="hidden sm:flex items-center gap-4 text-xs text-surface-500">
                  <div className="flex items-center gap-1" title="Apps">
                    <AppWindow className="w-3.5 h-3.5" />
                    <span className="font-medium">{user.appCount}</span>
                  </div>
                  <div className="flex items-center gap-1" title="Branches tracked">
                    <GitBranch className="w-3.5 h-3.5" />
                    <span className="font-medium">{user.branchCount}</span>
                  </div>
                  <div className="flex items-center gap-1" title="Commits tracked">
                    <Database className="w-3.5 h-3.5" />
                    <span className="font-medium">{user.commitCount}</span>
                  </div>
                </div>

                {/* Actions */}
                {!user.isAdmin && (
                  <div className="flex items-center gap-1">
                    {user.isRestricted ? (
                      <button
                        onClick={() => handleUnrestrict(user.id)}
                        disabled={actionLoading === user.id}
                        className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50"
                        title="Remove restriction"
                      >
                        <ShieldOff className="w-4 h-4" />
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          setRestrictModal({ userId: user.id, email: user.email });
                          setRestrictReason('');
                        }}
                        disabled={actionLoading === user.id}
                        className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors disabled:opacity-50"
                        title="Restrict user"
                      >
                        <Shield className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(user.id, user.email)}
                      disabled={actionLoading === user.id}
                      className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                      title="Delete user"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}

        {filteredUsers.length === 0 && (
          <div className="text-center py-12 text-surface-400 text-sm">
            {searchQuery ? 'No users match your search' : 'No users found'}
          </div>
        )}
      </div>

      {/* Restrict modal */}
      {restrictModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-surface-900">Restrict User</h3>
              <button
                onClick={() => setRestrictModal(null)}
                className="text-surface-400 hover:text-surface-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-surface-600 mb-4">
              Restricting <strong>{restrictModal.email}</strong> will prevent them from accessing
              the application. They will see a message explaining their account has been restricted.
            </p>
            <label className="block text-sm font-medium text-surface-700 mb-1">
              Reason for restriction
            </label>
            <textarea
              value={restrictReason}
              onChange={(e) => setRestrictReason(e.target.value)}
              className="w-full px-3 py-2 border border-surface-200 rounded-lg text-sm text-surface-900 placeholder-surface-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent resize-none"
              rows={3}
              placeholder="e.g. Violation of terms of service..."
            />
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => setRestrictModal(null)}
                className="px-4 py-2 text-sm text-surface-600 hover:bg-surface-50 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleRestrict}
                disabled={!restrictReason.trim() || actionLoading === restrictModal.userId}
                className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                Restrict User
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ─── Feedback Tab ───────────────────────────────────────────────────────────

function FeedbackTab() {
  const [feedback, setFeedback] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [editNotes, setEditNotes] = useState<Record<number, string>>({});
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  const fetchFeedback = useCallback(async () => {
    try {
      const res = await apiClient.get<{ feedback: FeedbackItem[] }>('/admin/feedback');
      setFeedback(res.data.feedback);
    } catch {
      setMessage({ type: 'error', text: 'Failed to load feedback' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFeedback();
  }, [fetchFeedback]);

  const handleStatusChange = async (feedbackId: number, newStatus: string) => {
    setActionLoading(feedbackId);
    try {
      const notes =
        editNotes[feedbackId] ?? feedback.find((f) => f.id === feedbackId)?.admin_notes ?? null;
      await apiClient.put(`/admin/feedback/${feedbackId}`, {
        status: newStatus,
        adminNotes: notes,
      });
      setMessage({ type: 'success', text: 'Feedback updated' });
      await fetchFeedback();
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Failed to update' });
    } finally {
      setActionLoading(null);
    }
  };

  const handleSaveNotes = async (feedbackId: number) => {
    setActionLoading(feedbackId);
    const item = feedback.find((f) => f.id === feedbackId);
    try {
      await apiClient.put(`/admin/feedback/${feedbackId}`, {
        status: item?.status || 'open',
        adminNotes: editNotes[feedbackId] ?? '',
      });
      setMessage({ type: 'success', text: 'Notes saved' });
      await fetchFeedback();
    } catch (err) {
      setMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Failed to save notes',
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (feedbackId: number) => {
    if (!window.confirm('Delete this feedback entry?')) return;
    setActionLoading(feedbackId);
    try {
      await apiClient.delete(`/admin/feedback/${feedbackId}`);
      setMessage({ type: 'success', text: 'Feedback deleted' });
      await fetchFeedback();
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Failed to delete' });
    } finally {
      setActionLoading(null);
    }
  };

  const filtered =
    filterStatus === 'all' ? feedback : feedback.filter((f) => f.status === filterStatus);

  const statusCounts = feedback.reduce<Record<string, number>>((acc, f) => {
    acc[f.status] = (acc[f.status] || 0) + 1;
    return acc;
  }, {});

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600" />
      </div>
    );
  }

  return (
    <>
      {message && (
        <div
          className={`mb-6 p-3 rounded-xl text-sm ${message.type === 'success' ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-700'}`}
        >
          {message.text}
        </div>
      )}

      {/* Filter bar */}
      <div className="flex items-center gap-2 mb-6 flex-wrap">
        {['all', 'open', 'in_progress', 'resolved', 'dismissed'].map((status) => (
          <button
            key={status}
            onClick={() => setFilterStatus(status)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              filterStatus === status
                ? 'bg-brand-600 text-white'
                : 'bg-surface-100 text-surface-600 hover:bg-surface-200'
            }`}
          >
            {status === 'all' ? 'All' : status.replace('_', ' ')}
            {status === 'all'
              ? ` (${feedback.length})`
              : statusCounts[status]
                ? ` (${statusCounts[status]})`
                : ''}
          </button>
        ))}
      </div>

      {/* Feedback list */}
      <div className="space-y-3">
        {filtered.map((item) => (
          <div key={item.id} className="bg-white rounded-2xl shadow-card overflow-hidden">
            <button
              onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
              className="w-full p-5 text-left"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  <div
                    className={`p-1.5 rounded-lg mt-0.5 ${
                      item.category === 'bug'
                        ? 'bg-red-100 text-red-600'
                        : item.category === 'improvement'
                          ? 'bg-amber-100 text-amber-600'
                          : item.category === 'feature'
                            ? 'bg-purple-100 text-purple-600'
                            : 'bg-surface-100 text-surface-500'
                    }`}
                  >
                    {CATEGORY_ICONS[item.category] || CATEGORY_ICONS.general}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-surface-900">{item.title}</span>
                      <span
                        className={`px-1.5 py-0.5 text-[10px] font-bold uppercase rounded ${STATUS_COLORS[item.status] || STATUS_COLORS.open}`}
                      >
                        {item.status.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="text-xs text-surface-400 mt-1">
                      {item.user_display_name || item.user_email} &middot;{' '}
                      {timeAgo(item.created_at)} &middot;{' '}
                      <span className="capitalize">{item.category}</span>
                    </p>
                  </div>
                </div>
                <ChevronDown
                  className={`w-4 h-4 text-surface-400 flex-shrink-0 transition-transform ${expandedId === item.id ? 'rotate-180' : ''}`}
                />
              </div>
            </button>

            {expandedId === item.id && (
              <div className="px-5 pb-5 border-t border-surface-100 pt-4 space-y-4">
                <div>
                  <p className="text-xs font-medium text-surface-500 mb-1">Description</p>
                  <p className="text-sm text-surface-700 whitespace-pre-wrap">{item.description}</p>
                </div>

                <div>
                  <p className="text-xs font-medium text-surface-500 mb-1">Admin Notes</p>
                  <textarea
                    value={editNotes[item.id] ?? item.admin_notes ?? ''}
                    onChange={(e) =>
                      setEditNotes((prev) => ({ ...prev, [item.id]: e.target.value }))
                    }
                    className="w-full px-3 py-2 border border-surface-200 rounded-lg text-sm text-surface-900 placeholder-surface-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent resize-none"
                    rows={2}
                    placeholder="Add notes about actions taken..."
                  />
                  <button
                    onClick={() => handleSaveNotes(item.id)}
                    disabled={actionLoading === item.id}
                    className="mt-1 text-xs text-brand-600 hover:text-brand-700 font-medium disabled:opacity-50"
                  >
                    Save notes
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-surface-500">Set status:</span>
                    {['open', 'in_progress', 'resolved', 'dismissed'].map((status) => (
                      <button
                        key={status}
                        onClick={() => handleStatusChange(item.id, status)}
                        disabled={item.status === status || actionLoading === item.id}
                        className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors disabled:opacity-30 ${
                          item.status === status
                            ? STATUS_COLORS[status]
                            : 'bg-surface-50 text-surface-500 hover:bg-surface-100'
                        }`}
                      >
                        {status.replace('_', ' ')}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => handleDelete(item.id)}
                    disabled={actionLoading === item.id}
                    className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="text-center py-12 text-surface-400 text-sm">
            {filterStatus === 'all'
              ? 'No feedback submitted yet'
              : `No ${filterStatus.replace('_', ' ')} feedback`}
          </div>
        )}
      </div>
    </>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────────────

const TABS: { id: TabId; label: string; icon: typeof Settings }[] = [
  { id: 'settings', label: 'Settings', icon: Settings },
  { id: 'users', label: 'Users', icon: Users },
  { id: 'feedback', label: 'Feedback', icon: MessageSquare },
];

export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState<TabId>('settings');

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-brand-50 rounded-xl">
          <Settings className="w-6 h-6 text-brand-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-surface-900">Admin Panel</h1>
          <p className="text-sm text-surface-500">Manage settings, users, and feedback</p>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex items-center bg-surface-50 rounded-xl p-1 border border-surface-200/60 mb-8">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex-1 justify-center ${
              activeTab === tab.id
                ? 'bg-white text-brand-600 shadow-sm'
                : 'text-surface-500 hover:text-surface-700'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'settings' && <SettingsTab />}
      {activeTab === 'users' && <UsersTab />}
      {activeTab === 'feedback' && <FeedbackTab />}
    </div>
  );
}
