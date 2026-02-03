import { STUDENT_STATUS } from '@/types';
import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: keyof typeof STUDENT_STATUS;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const variants = {
    active: 'badge-success',
    inactive: 'badge-muted',
    transferred: 'badge-warning',
    graduated: 'badge-info',
  };

  return (
    <span className={cn(variants[status], className)}>
      {STUDENT_STATUS[status]}
    </span>
  );
}
