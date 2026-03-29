import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface StatsCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: LucideIcon;
  variant?: 'primary' | 'accent' | 'success' | 'warning' | 'orange' | 'purple' | 'cyan' | 'blue';
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
    orange: 'card-vibrant-orange',
    purple: 'card-vibrant-purple',
    cyan: 'card-vibrant-cyan',
    blue: 'card-vibrant-blue',
  };

  const iconBgClasses = {
    primary: 'bg-primary-light text-primary',
    accent: 'bg-accent-light text-accent',
    success: 'bg-success-light text-success',
    warning: 'bg-warning-light text-warning',
    orange: 'bg-white/20 text-white',
    purple: 'bg-white/20 text-white',
    cyan: 'bg-white/20 text-white',
    blue: 'bg-white/20 text-white',
  };

  return (
    <Card className={cn('transition-all duration-300', variantClasses[variant])}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium stats-title">{title}</p>
            <div className="flex items-baseline gap-2">
              <h3 className="text-2xl font-bold tracking-tight stats-value">{value}</h3>
              {trend && (
                <span className={cn(
                  'text-xs font-medium',
                  trend.value >= 0 ? 'text-success' : 'text-destructive'
                )}>
                  {trend.value >= 0 ? '+' : ''}{trend.value}%
                </span>
              )}
            </div>
            {description && (
              <p className="text-xs text-muted-foreground mt-1">{description}</p>
            )}
          </div>
          <div className={cn('p-3 rounded-xl icon-container', iconBgClasses[variant])}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
