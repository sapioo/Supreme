import { cn } from '../../lib/utils';

const tabs = ['ai', 'source', 'preview'];

export default function MobileTabs({ activeTab, onTabChange }) {
  return (
    <div
      className="hidden max-[920px]:grid grid-cols-3 gap-2"
      role="tablist"
      aria-label="Drafting workspace panels"
    >
      {tabs.map((tab) => (
        <button
          key={tab}
          type="button"
          role="tab"
          aria-selected={activeTab === tab}
          className={cn(
            'min-h-[38px] rounded-md border text-sm capitalize',
            'bg-[rgba(22,28,35,0.8)]',
            activeTab === tab
              ? 'border-[rgba(233,193,118,0.5)] text-[var(--color-secondary)]'
              : 'border-[rgba(255,255,255,0.1)] text-[var(--color-on-surface)]',
          )}
          onClick={() => onTabChange(tab)}
        >
          {tab}
        </button>
      ))}
    </div>
  );
}
