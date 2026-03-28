interface BadgeProps {
  label: string;
  color: 'green' | 'yellow' | 'red' | 'gray' | 'blue' | 'purple' | 'orange';
}

const colorClasses: Record<BadgeProps['color'], string> = {
  green: 'bg-emerald-50 text-emerald-700 border-emerald-200/60',
  yellow: 'bg-amber-50 text-amber-700 border-amber-200/60',
  red: 'bg-red-50 text-red-700 border-red-200/60',
  gray: 'bg-gray-50 text-gray-600 border-gray-200/60',
  blue: 'bg-brand-50 text-brand-700 border-brand-200/60',
  purple: 'bg-violet-50 text-violet-700 border-violet-200/60',
  orange: 'bg-orange-50 text-orange-700 border-orange-200/60',
};

export default function Badge({ label, color }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-semibold border ${colorClasses[color]}`}
    >
      {label}
    </span>
  );
}
