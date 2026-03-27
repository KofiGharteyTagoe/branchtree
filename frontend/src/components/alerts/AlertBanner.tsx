import type { Alert } from '../../types/app.types';

interface AlertBannerProps {
  alerts: Alert[];
}

export default function AlertBanner({ alerts }: AlertBannerProps) {
  if (alerts.length === 0) return null;

  const errors = alerts.filter((a) => a.severity === 'error');
  const warnings = alerts.filter((a) => a.severity === 'warning');

  return (
    <div className="space-y-2">
      {errors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <h4 className="text-sm font-semibold text-red-800 mb-1">
            {errors.length} Critical Alert{errors.length > 1 ? 's' : ''}
          </h4>
          <ul className="text-xs text-red-700 space-y-0.5">
            {errors.map((alert, i) => (
              <li key={i}>- {alert.message}</li>
            ))}
          </ul>
        </div>
      )}

      {warnings.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <h4 className="text-sm font-semibold text-yellow-800 mb-1">
            {warnings.length} Warning{warnings.length > 1 ? 's' : ''}
          </h4>
          <ul className="text-xs text-yellow-700 space-y-0.5">
            {warnings.slice(0, 5).map((alert, i) => (
              <li key={i}>- {alert.message}</li>
            ))}
            {warnings.length > 5 && (
              <li className="text-yellow-600">
                ...and {warnings.length - 5} more
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
