import { AlertTriangle } from 'lucide-react';
import type { Alert } from '../../types/app.types';

interface VersionMismatchProps {
  alerts: Alert[];
}

export default function VersionMismatch({ alerts }: VersionMismatchProps) {
  const versionAlerts = alerts.filter((a) => a.type === 'version_mismatch');
  if (versionAlerts.length === 0) return null;

  return (
    <div className="bg-violet-50 border border-violet-200/60 rounded-2xl p-4">
      <div className="flex items-center gap-2 mb-2">
        <AlertTriangle className="w-4 h-4 text-violet-500" />
        <h4 className="text-sm font-semibold text-violet-800">
          Version Mismatches ({versionAlerts.length})
        </h4>
      </div>
      <p className="text-xs text-violet-600 mb-2 ml-6">
        These branches use a different platform version than main.
      </p>
      <ul className="space-y-1 ml-6">
        {versionAlerts.map((alert, i) => (
          <li key={i} className="text-xs text-violet-600 list-disc">{alert.message}</li>
        ))}
      </ul>
    </div>
  );
}
