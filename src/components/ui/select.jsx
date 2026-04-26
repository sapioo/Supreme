import * as React from 'react';
import { cn } from '../../lib/utils';

/* ---------------------------------------------------------------------------
 * Simple native-select based components.
 *
 * The API mirrors shadcn/ui naming so that consuming code can be upgraded to a
 * custom dropdown later without changing call-sites.
 *
 * Usage:
 *   <Select value={v} onValueChange={setV}>
 *     <SelectTrigger className="w-[200px]">
 *       <SelectValue placeholder="Pick one" />
 *     </SelectTrigger>
 *     <SelectContent>
 *       <SelectItem value="a">Alpha</SelectItem>
 *       <SelectItem value="b">Beta</SelectItem>
 *     </SelectContent>
 *   </Select>
 *
 * Under the hood this renders a single styled <select>.
 * --------------------------------------------------------------------------- */

const SelectContext = React.createContext({
  value: '',
  onValueChange: () => {},
});

function Select({ value, onValueChange, children }) {
  const ctx = React.useMemo(() => ({ value, onValueChange }), [value, onValueChange]);
  return <SelectContext.Provider value={ctx}>{children}</SelectContext.Provider>;
}

/* Collect <SelectItem> children from <SelectContent> and render a native <select>. */
const SelectTrigger = React.forwardRef(({ className, children, ...props }, ref) => {
  const { value, onValueChange } = React.useContext(SelectContext);

  /* Walk children to find SelectContent → SelectItem elements and the placeholder from SelectValue */
  let placeholder = '';
  const options = [];

  const walk = (nodes) => {
    React.Children.forEach(nodes, (child) => {
      if (!React.isValidElement(child)) return;
      if (child.type === SelectValue) {
        placeholder = child.props.placeholder || '';
      } else if (child.type === SelectContent) {
        walk(child.props.children);
      } else if (child.type === SelectItem) {
        options.push({ value: child.props.value, label: child.props.children });
      } else if (child.props?.children) {
        walk(child.props.children);
      }
    });
  };

  /* We need to walk the *parent's* children, which are passed as our own children
     plus siblings. The simplest approach: the trigger receives all Select children
     via React context or directly. Here we walk the children prop. */
  walk(children);

  return (
    <select
      ref={ref}
      value={value}
      onChange={(e) => onValueChange(e.target.value)}
      className={cn(
        'flex h-9 w-full items-center rounded-md border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.04)] px-3 py-1 text-sm text-[var(--color-on-surface)] shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-secondary)] focus-visible:ring-offset-1 focus-visible:ring-offset-[var(--color-background)] disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    >
      {placeholder && (
        <option value="" disabled>
          {placeholder}
        </option>
      )}
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
});
SelectTrigger.displayName = 'SelectTrigger';

/* Wrapper that simply passes children through — the trigger walks them. */
function SelectContent({ children }) {
  return <>{children}</>;
}

/* Marker component — not rendered directly; the trigger reads its props. */
function SelectItem({ children }) {
  return <>{children}</>;
}

/* Marker component for placeholder text. */
function SelectValue() {
  return null;
}

export { Select, SelectTrigger, SelectContent, SelectItem, SelectValue };
