import { cn } from '../../lib/utils';

const tabs = ['ai', 'source', 'preview'];

export default function MobileTabs({ activeTab, onTabChange }) {
  return (
    <div
      className="drafting-mobile-tabs"
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
            'drafting-mobile-tabs__tab',
            activeTab === tab
              ? 'drafting-mobile-tabs__tab--active'
              : 'drafting-mobile-tabs__tab--idle',
          )}
          onClick={() => onTabChange(tab)}
        >
          {tab}
        </button>
      ))}
    </div>
  );
}
