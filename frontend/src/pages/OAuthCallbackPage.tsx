import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { apiClient } from '../config/api';

export default function OAuthCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState(false);

  useEffect(() => {
    const code = searchParams.get('code');
    if (!code) {
      navigate('/login?error=no_code', { replace: true });
      return;
    }

    apiClient
      .post('/auth/exchange', { code })
      .then(() => {
        // Cookie is set by the server — just redirect
        window.location.href = '/';
      })
      .catch(() => {
        setError(true);
        setTimeout(() => navigate('/login?error=exchange_failed', { replace: true }), 2000);
      });
  }, [searchParams, navigate]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-50">
        <div className="text-center">
          <p className="text-red-600">Sign in failed. Redirecting...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600 mx-auto mb-4" />
        <p className="text-surface-500">Completing sign in...</p>
      </div>
    </div>
  );
}
