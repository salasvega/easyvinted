import { LucideIcon } from 'lucide-react';

interface AdminStatsCardProps {
  label: string;
  value: number;
  icon: LucideIcon;
  color: 'slate' | 'blue' | 'emerald' | 'amber' | 'rose' | 'violet';
  trend?: { value: number; isPositive: boolean };
  onClick?: () => void;
  isActive?: boolean;
}

const colorClasses = {
  slate: {
    bg: 'bg-slate-50',
    border: 'border-slate-200',
    activeBorder: 'border-slate-400',
    icon: 'text-slate-600 bg-slate-100',
    value: 'text-slate-900',
    label: 'text-slate-500',
  },
  blue: {
    bg: 'bg-blue-50/50',
    border: 'border-blue-200',
    activeBorder: 'border-blue-500',
    icon: 'text-blue-600 bg-blue-100',
    value: 'text-blue-700',
    label: 'text-blue-600/70',
  },
  emerald: {
    bg: 'bg-emerald-50/50',
    border: 'border-emerald-200',
    activeBorder: 'border-emerald-500',
    icon: 'text-emerald-600 bg-emerald-100',
    value: 'text-emerald-700',
    label: 'text-emerald-600/70',
  },
  amber: {
    bg: 'bg-amber-50/50',
    border: 'border-amber-200',
    activeBorder: 'border-amber-500',
    icon: 'text-amber-600 bg-amber-100',
    value: 'text-amber-700',
    label: 'text-amber-600/70',
  },
  rose: {
    bg: 'bg-rose-50/50',
    border: 'border-rose-200',
    activeBorder: 'border-rose-500',
    icon: 'text-rose-600 bg-rose-100',
    value: 'text-rose-700',
    label: 'text-rose-600/70',
  },
  violet: {
    bg: 'bg-violet-50/50',
    border: 'border-violet-200',
    activeBorder: 'border-violet-500',
    icon: 'text-violet-600 bg-violet-100',
    value: 'text-violet-700',
    label: 'text-violet-600/70',
  },
};

export function AdminStatsCard({
  label,
  value,
  icon: Icon,
  color,
  trend,
  onClick,
  isActive,
}: AdminStatsCardProps) {
  const colors = colorClasses[color];

  return (
    <button
      onClick={onClick}
      disabled={!onClick}
      className={`relative w-full text-left p-4 sm:p-5 rounded-2xl border-2 transition-all duration-300 ${colors.bg} ${
        isActive ? colors.activeBorder : colors.border
      } ${onClick ? 'cursor-pointer hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]' : 'cursor-default'}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className={`text-xs font-semibold uppercase tracking-wider mb-1 ${colors.label}`}>
            {label}
          </p>
          <p className={`text-3xl sm:text-4xl font-bold tracking-tight ${colors.value}`}>
            {value}
          </p>
          {trend && (
            <p className={`text-xs font-medium mt-1.5 ${trend.isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
              {trend.isPositive ? '+' : ''}{trend.value}% vs semaine derniere
            </p>
          )}
        </div>
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${colors.icon}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      {isActive && (
        <div className={`absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-1 rounded-full ${colors.icon.replace('text-', 'bg-').split(' ')[0]}`} />
      )}
    </button>
  );
}
