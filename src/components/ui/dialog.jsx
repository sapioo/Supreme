import * as React from 'react';
import { createPortal } from 'react-dom';
import { cn } from '../../lib/utils';

/* ---------------------------------------------------------------------------
 * Minimal Dialog built with a React portal, backdrop overlay with blur,
 * and click-outside-to-close behaviour.
 * --------------------------------------------------------------------------- */

const DialogContext = React.createContext({
  open: false,
  onOpenChange: () => {},
});

function Dialog({ open, onOpenChange, children }) {
  const ctx = React.useMemo(() => ({ open, onOpenChange }), [open, onOpenChange]);
  return <DialogContext.Provider value={ctx}>{children}</DialogContext.Provider>;
}

/* The content panel rendered inside a portal. */
const DialogContent = React.forwardRef(({ className, children, ...props }, ref) => {
  const { open, onOpenChange } = React.useContext(DialogContext);

  /* Close on Escape key */
  React.useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (e.key === 'Escape') onOpenChange(false);
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onOpenChange]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm"
        onClick={() => onOpenChange(false)}
        aria-hidden="true"
      />
      {/* Panel */}
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        className={cn(
          'relative z-50 w-full max-w-lg rounded-lg border border-[rgba(255,255,255,0.08)] bg-[var(--color-surface-container)] p-6 shadow-lg',
          className,
        )}
        {...props}
      >
        {children}
      </div>
    </div>,
    document.body,
  );
});
DialogContent.displayName = 'DialogContent';

function DialogHeader({ className, ...props }) {
  return (
    <div
      className={cn('flex flex-col space-y-1.5 text-center sm:text-left', className)}
      {...props}
    />
  );
}

function DialogTitle({ className, ...props }) {
  return (
    <h2
      className={cn(
        'text-lg font-semibold leading-none tracking-tight text-[var(--color-on-surface)]',
        className,
      )}
      {...props}
    />
  );
}

function DialogDescription({ className, ...props }) {
  return (
    <p
      className={cn('text-sm text-[var(--color-outline)]', className)}
      {...props}
    />
  );
}

function DialogFooter({ className, ...props }) {
  return (
    <div
      className={cn(
        'flex flex-col-reverse gap-2 sm:flex-row sm:justify-end',
        className,
      )}
      {...props}
    />
  );
}

export {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
};
