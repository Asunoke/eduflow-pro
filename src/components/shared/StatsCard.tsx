import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: LucideIcon;
  variant?: 'primary' | 'accent' | 'success' | 'warning';
  trend?: {
    value: number;
    label: string;
  };
}

export function StatsCard({
  title,
  value,
  description,
  icon: Icon,
  variant = 'primary',
  trend,
}: StatsCardProps) {
  const variantClasses = {
    primary: 'card-stats-primary',
    accent: 'card-stats-accent',
    success: 'card-stats-success',
    warning: 'card-stats-warning',
  };

  const iconBgClasses = {
    primary: 'bg-primary-light text-primary',
    accent: 'bg-accent-light text-accent',
    success: 'bg-success-light text-success',
    warning: 'bg-warning-light text-warning',
  };

  return (
    <div className={cn('card-stats animate-fade-in', variantClasses[variant])}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-3xl font-bold text-foreground mt-1 font-display">{value}</p>
          {description && (
            <p className="text-xs text-muted-foreground mt-1">{description}</p>
          )}
          {trend && (
            <div className="flex items-center gap-1 mt-2">
              <span
                className={cn(
                  'text-xs font-medium',
                  trend.value >= 0 ? 'text-success' : 'text-destructive'
                )}
              >
                {trend.value >= 0 ? '+' : ''}
                {trend.value}%
              </span>
              <span className="text-xs text-muted-foreground">{trend.label}</span>
            </div>
          )}
        </div>
        <div className={cn('p-3 rounded-xl', iconBgClasses[variant])}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
}
