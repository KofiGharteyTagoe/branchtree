import type { Alert } from '../../types/app.types';

interface DivergenceWarningProps {
  alerts: Alert[];
}

export default function DivergenceWarning({ alerts }: DivergenceWarningProps) {
  const divergenceAlerts = alerts.filter((a) => a.type === 'divergence');
  if (divergenceAlerts.length === 0) return null;

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
      <h4 className="text-sm font-semibold text-yellow-800 mb-1">
        Diverged Branches ({divergenceAlerts.length})
      </h4>
      <p className="text-xs text-yellow-700 mb-2">
        These branches are significantly behind main. Merge main into them to stay current.
      </p>
      <ul className="text-xs text-yellow-600 space-y-0.5">
        {divergenceAlerts.map((alert, i) => (
          <li key={i}>- {alert.message}</li>
        ))}
      </ul>
    </div>
  );
}
