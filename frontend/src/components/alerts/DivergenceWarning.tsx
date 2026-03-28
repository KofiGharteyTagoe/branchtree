import { GitBranch } from 'lucide-react';
import type { Alert } from '../../types/app.types';

interface DivergenceWarningProps {
  alerts: Alert[];
}

export default function DivergenceWarning({ alerts }: DivergenceWarningProps) {
  const divergenceAlerts = alerts.filter((a) => a.type === 'divergence');
  if (divergenceAlerts.length === 0) return null;

  return (
    <div className="bg-amber-50 border border-amber-200/60 rounded-2xl p-4">
      <div className="flex items-center gap-2 mb-2">
        <GitBranch className="w-4 h-4 text-amber-500" />
        <h4 className="text-sm font-semibold text-amber-800">
          Diverged Branches ({divergenceAlerts.length})
        </h4>
      </div>
      <p className="text-xs text-amber-600 mb-2 ml-6">
        These branches are significantly behind main. Merge main into them to stay current.
      </p>
      <ul className="space-y-1 ml-6">
        {divergenceAlerts.map((alert, i) => (
          <li key={i} className="text-xs text-amber-600 list-disc">
            {alert.message}
          </li>
        ))}
      </ul>
    </div>
  );
}
