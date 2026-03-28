import { Clock } from 'lucide-react';
import type { Alert } from '../../types/app.types';

interface StaleWarningProps {
  alerts: Alert[];
}

export default function StaleWarning({ alerts }: StaleWarningProps) {
  const staleAlerts = alerts.filter((a) => a.type === 'stale');
  if (staleAlerts.length === 0) return null;

  return (
    <div className="bg-orange-50 border border-orange-200/60 rounded-2xl p-4">
      <div className="flex items-center gap-2 mb-2">
        <Clock className="w-4 h-4 text-orange-500" />
        <h4 className="text-sm font-semibold text-orange-800">
          Stale Branches ({staleAlerts.length})
        </h4>
      </div>
      <p className="text-xs text-orange-600 mb-2 ml-6">
        These branches have had no activity recently. Consider cleaning them up.
      </p>
      <ul className="space-y-1 ml-6">
        {staleAlerts.map((alert, i) => (
          <li key={i} className="text-xs text-orange-600 list-disc">
            {alert.branchName}
          </li>
        ))}
      </ul>
    </div>
  );
}
