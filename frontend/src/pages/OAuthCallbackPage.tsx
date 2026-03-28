import { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { storeToken } from '../context/AuthContext';

export default function OAuthCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const token = searchParams.get('token');
    if (token) {
      storeToken(token);
      // Force a full page reload so AuthProvider re-checks the token
      window.location.href = '/';
    } else {
      navigate('/login?error=no_token', { replace: true });
    }
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600 mx-auto mb-4" />
        <p className="text-surface-500">Completing sign in...</p>
      </div>
    </div>
  );
}
