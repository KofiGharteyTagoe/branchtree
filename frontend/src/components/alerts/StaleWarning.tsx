import type { Alert } from '../../types/app.types';

interface StaleWarningProps {
  alerts: Alert[];
}

export default function StaleWarning({ alerts }: StaleWarningProps) {
  const staleAlerts = alerts.filter((a) => a.type === 'stale');
  if (staleAlerts.length === 0) return null;

  return (
    <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
      <h4 className="text-sm font-semibold text-orange-800 mb-1">
        Stale Branches ({staleAlerts.length})
      </h4>
      <p className="text-xs text-orange-700 mb-2">
        These branches have had no activity recently. Consider cleaning them up.
      </p>
      <ul className="text-xs text-orange-600 space-y-0.5">
        {staleAlerts.map((alert, i) => (
          <li key={i}>- {alert.branchName}</li>
        ))}
      </ul>
    </div>
  );
}
