import { AlertTriangle, XCircle } from 'lucide-react';
import type { Alert } from '../../types/app.types';

interface AlertBannerProps {
  alerts: Alert[];
}

export default function AlertBanner({ alerts }: AlertBannerProps) {
  if (alerts.length === 0) return null;

  const errors = alerts.filter((a) => a.severity === 'error');
  const warnings = alerts.filter((a) => a.severity === 'warning');

  return (
    <div className="space-y-3">
      {errors.length > 0 && (
        <div className="bg-red-50 border border-red-200/60 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <XCircle className="w-4 h-4 text-red-500" />
            <h4 className="text-sm font-semibold text-red-800">
              {errors.length} Critical Alert{errors.length > 1 ? 's' : ''}
            </h4>
          </div>
          <ul className="space-y-1 ml-6">
            {errors.map((alert, i) => (
              <li key={i} className="text-xs text-red-600 list-disc">
                {alert.message}
              </li>
            ))}
          </ul>
        </div>
      )}

      {warnings.length > 0 && (
        <div className="bg-amber-50 border border-amber-200/60 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <h4 className="text-sm font-semibold text-amber-800">
              {warnings.length} Warning{warnings.length > 1 ? 's' : ''}
            </h4>
          </div>
          <ul className="space-y-1 ml-6">
            {warnings.slice(0, 5).map((alert, i) => (
              <li key={i} className="text-xs text-amber-600 list-disc">
                {alert.message}
              </li>
            ))}
            {warnings.length > 5 && (
              <li className="text-xs text-amber-500">...and {warnings.length - 5} more</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
