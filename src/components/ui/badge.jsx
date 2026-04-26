import * as React from 'react';
import { cn } from '../../lib/utils';

const badgeVariants = {
  default:
    'bg-[var(--color-secondary)] text-[var(--color-on-secondary)] border-transparent',
  secondary:
    'bg-[var(--color-surface-container-high)] text-[var(--color-on-surface)] border-transparent',
  outline:
    'border border-[rgba(255,255,255,0.15)] text-[var(--color-on-surface-variant)] bg-transparent',
  destructive:
    'bg-[var(--color-error-container)] text-[var(--color-on-error-container)] border-transparent',
};

function Badge({ className, variant = 'default', ...props }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors',
        badgeVariants[variant],
        className,
      )}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
