import { Link } from 'react-router-dom';
import { Home } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div className="flex flex-col items-center justify-center py-24 animate-fade-in">
      <div className="text-8xl font-bold bg-gradient-to-br from-brand-300 to-brand-500 bg-clip-text text-transparent mb-3">
        404
      </div>
      <p className="text-gray-500 mb-6 text-lg">Page not found</p>
      <Link to="/" className="btn-primary flex items-center gap-2">
        <Home className="w-4 h-4" />
        Back to Dashboard
      </Link>
    </div>
  );
}
