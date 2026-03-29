import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate, useSearchParams } from 'react-router-dom';
import { GitBranch, Shield, Users } from 'lucide-react';
import BranchCanopyBackground from '../components/layout/BranchCanopyBackground';

interface ProvidersResponse {
  providers: Array<'google' | 'microsoft'>;
}

const API_BASE = '/api';

type LoginMode = 'oauth' | 'admin';

export default function LoginPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const [searchParams] = useSearchParams();
  const [providers, setProviders] = useState<Array<'google' | 'microsoft'>>([]);
  const [loadingProviders, setLoadingProviders] = useState(true);
  const [mode, setMode] = useState<LoginMode>('oauth');

  // Admin login state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const error = searchParams.get('error');

  useEffect(() => {
    fetch(`${API_BASE}/auth/providers`)
      .then((res) => res.json())
      .then((data: ProvidersResponse) => {
        setProviders(data.providers);
        // If no OAuth providers configured, default to admin login
        if (data.providers.length === 0) {
          setMode('admin');
        }
      })
      .catch(() => {
        setProviders([]);
        setMode('admin');
      })
      .finally(() => setLoadingProviders(false));
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-50">
        <BranchCanopyBackground />
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600" />
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setIsLoggingIn(true);

    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setLoginError(data.error || 'Login failed');
        return;
      }

      // Cookie is set by the server — just redirect
      window.location.href = '/';
    } catch {
      setLoginError('Failed to connect to server');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const hasOAuth = providers.length > 0;

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-50">
      <BranchCanopyBackground />
      <div className="w-full max-w-md mx-4 relative z-10">
        <div className="bg-white rounded-2xl shadow-card p-8">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-brand-50 mb-4">
              <GitBranch className="w-8 h-8 text-brand-600" />
            </div>
            <h1 className="text-2xl font-bold text-surface-900">BranchTree</h1>
            <p className="mt-2 text-surface-500">Sign in to manage your repositories</p>
          </div>

          <div aria-live="polite">
            {(error || loginError) && (
              <div
                className="mb-6 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700"
                role="alert"
              >
                {loginError || 'Authentication failed. Please try again.'}
              </div>
            )}
          </div>

          {/* Mode tabs — always visible so both login options are clear */}
          <div className="flex rounded-xl bg-surface-100 p-1 mb-6">
            <button
              onClick={() => {
                setMode('oauth');
                setLoginError('');
              }}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${
                mode === 'oauth'
                  ? 'bg-white text-surface-900 shadow-sm'
                  : 'text-surface-500 hover:text-surface-700'
              }`}
            >
              <Users className="w-4 h-4" />
              User Login
            </button>
            <button
              onClick={() => {
                setMode('admin');
                setLoginError('');
              }}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${
                mode === 'admin'
                  ? 'bg-white text-surface-900 shadow-sm'
                  : 'text-surface-500 hover:text-surface-700'
              }`}
            >
              <Shield className="w-4 h-4" />
              Admin Login
            </button>
          </div>

          {/* OAuth login */}
          {mode === 'oauth' && (
            <>
              {loadingProviders ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-brand-600" />
                </div>
              ) : hasOAuth ? (
                <div className="space-y-3">
                  {providers.includes('google') && (
                    <a
                      href={`${API_BASE}/auth/google`}
                      className="flex items-center justify-center gap-3 w-full px-4 py-3 border border-surface-200 rounded-xl text-surface-700 hover:bg-surface-50 transition-colors font-medium"
                    >
                      <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path
                          fill="#4285F4"
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                        />
                        <path
                          fill="#34A853"
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        />
                        <path
                          fill="#EA4335"
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        />
                      </svg>
                      Sign in with Google
                    </a>
                  )}

                  {providers.includes('microsoft') && (
                    <a
                      href={`${API_BASE}/auth/microsoft`}
                      className="flex items-center justify-center gap-3 w-full px-4 py-3 border border-surface-200 rounded-xl text-surface-700 hover:bg-surface-50 transition-colors font-medium"
                    >
                      <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path fill="#F25022" d="M1 1h10v10H1z" />
                        <path fill="#00A4EF" d="M1 13h10v10H1z" />
                        <path fill="#7FBA00" d="M13 1h10v10H13z" />
                        <path fill="#FFB900" d="M13 13h10v10H13z" />
                      </svg>
                      Sign in with Microsoft
                    </a>
                  )}

                  <p className="text-xs text-center text-surface-400 mt-4">
                    Sign in with your organization account
                  </p>
                </div>
              ) : (
                <div className="text-center py-6 text-surface-500 text-sm">
                  <p>No OAuth providers configured yet.</p>
                  <p className="mt-1">An admin needs to configure OAuth in settings first.</p>
                </div>
              )}
            </>
          )}

          {/* Admin login */}
          {mode === 'admin' && (
            <form onSubmit={handleAdminLogin} className="space-y-4">
              <div>
                <label
                  htmlFor="admin-email"
                  className="block text-sm font-medium text-surface-700 mb-1"
                >
                  Email
                </label>
                <input
                  id="admin-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2.5 border border-surface-200 rounded-xl text-surface-900 placeholder-surface-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                  placeholder="admin@example.com"
                  required
                  autoComplete="email"
                />
              </div>
              <div>
                <label
                  htmlFor="admin-password"
                  className="block text-sm font-medium text-surface-700 mb-1"
                >
                  Password
                </label>
                <input
                  id="admin-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2.5 border border-surface-200 rounded-xl text-surface-900 placeholder-surface-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                  placeholder="Enter your password"
                  required
                  autoComplete="current-password"
                />
              </div>
              <button
                type="submit"
                disabled={isLoggingIn}
                className="w-full px-4 py-3 bg-brand-600 text-white rounded-xl font-medium hover:bg-brand-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoggingIn ? 'Signing in...' : 'Sign In as Admin'}
              </button>

              <p className="text-xs text-center text-surface-400">
                Admin accounts are created during initial setup
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
