import { useState, useEffect, useCallback } from 'react';
import { Calendar } from 'lucide-react';

interface TimeRangeSliderProps {
  oldestDate: string | null;
  newestDate: string | null;
  totalCommits: number;
  returnedCommits?: number;
  since: string | undefined;
  until: string | undefined;
  onChange: (since: string | undefined, until: string | undefined) => void;
}

const PRESETS = [
  { label: '30d', days: 30 },
  { label: '90d', days: 90 },
  { label: '6mo', days: 180 },
  { label: '1y', days: 365 },
  { label: 'All', days: 0 },
] as const;

function daysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString();
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    year: 'numeric',
  });
}

export default function TimeRangeSlider({
  oldestDate,
  newestDate,
  totalCommits,
  returnedCommits,
  since,
  onChange,
}: TimeRangeSliderProps) {
  const [activePreset, setActivePreset] = useState<number>(90);

  const handlePreset = useCallback(
    (days: number) => {
      setActivePreset(days);
      if (days === 0) {
        onChange(undefined, undefined);
      } else {
        onChange(daysAgo(days), undefined);
      }
    },
    [onChange],
  );

  // Default to 90 days on mount
  useEffect(() => {
    if (!since && totalCommits > 500) {
      handlePreset(90);
    }
  }, []);

  const showingCount = returnedCommits ?? totalCommits;

  return (
    <div className="flex items-center gap-4 text-sm">
      <div className="flex items-center gap-1.5 text-surface-500">
        <Calendar className="w-4 h-4" />
        <span className="font-medium">Time range:</span>
      </div>

      <div className="flex items-center gap-1 bg-surface-50 rounded-lg p-0.5 border border-surface-200/60">
        {PRESETS.map(({ label, days }) => (
          <button
            key={label}
            onClick={() => handlePreset(days)}
            className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
              activePreset === days
                ? 'bg-white text-brand-700 shadow-soft'
                : 'text-surface-500 hover:text-surface-700'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="text-xs text-surface-400">
        {showingCount === totalCommits
          ? `${totalCommits} commits`
          : `${showingCount} of ${totalCommits} commits`}
        {oldestDate && newestDate && (
          <span className="ml-1">
            ({formatDate(oldestDate)} — {formatDate(newestDate)})
          </span>
        )}
      </div>
    </div>
  );
}
