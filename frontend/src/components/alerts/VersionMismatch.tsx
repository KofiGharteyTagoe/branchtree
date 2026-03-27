import type { Alert } from '../../types/app.types';

interface VersionMismatchProps {
  alerts: Alert[];
}

export default function VersionMismatch({ alerts }: VersionMismatchProps) {
  const versionAlerts = alerts.filter((a) => a.type === 'version_mismatch');
  if (versionAlerts.length === 0) return null;

  return (
    <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
      <h4 className="text-sm font-semibold text-purple-800 mb-1">
        Version Mismatches ({versionAlerts.length})
      </h4>
      <p className="text-xs text-purple-700 mb-2">
        These branches use a different Mendix Studio Pro version than main.
      </p>
      <ul className="text-xs text-purple-600 space-y-0.5">
        {versionAlerts.map((alert, i) => (
          <li key={i}>- {alert.message}</li>
        ))}
      </ul>
    </div>
  );
}
