import * as React from 'react';
import { cn } from '../../lib/utils';

const buttonVariants = {
  variant: {
    default:
      'bg-[var(--color-secondary)] text-[var(--color-on-secondary)] hover:bg-[var(--color-on-secondary-container)] shadow-sm',
    outline:
      'border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.04)] text-[var(--color-on-surface)] hover:bg-[rgba(255,255,255,0.08)]',
    ghost:
      'text-[var(--color-on-surface)] hover:bg-[rgba(255,255,255,0.06)]',
    destructive:
      'bg-[var(--color-error-container)] text-[var(--color-on-error-container)] hover:bg-[var(--color-error-container)]/90',
  },
  size: {
    default: 'h-9 px-4 py-2 text-sm',
    sm: 'h-8 px-3 text-xs',
    lg: 'h-10 px-6 text-base',
    icon: 'h-9 w-9 p-0',
  },
};

const Button = React.forwardRef(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => {
    return (
      <button
        className={cn(
          'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-secondary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)] disabled:pointer-events-none disabled:opacity-50',
          buttonVariants.variant[variant],
          buttonVariants.size[size],
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);

Button.displayName = 'Button';

export { Button, buttonVariants };
