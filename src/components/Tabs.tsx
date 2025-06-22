import React from 'react';

interface TabsProps {
  tabs: string[];
  activeIndex: number;
  onChange: (index: number) => void;
  children: React.ReactNode[];
  className?: string;
}

export const Tabs: React.FC<TabsProps> = ({
  tabs,
  activeIndex,
  onChange,
  children,
  className = '',
}) => {
  return (
    <div className={`mb-4 ${className}`}>
      <div role="tablist" className="flex border-b">
        {tabs.map((tab, idx) => (
          <button
            key={tab}
            role="tab"
            aria-selected={activeIndex === idx}
            aria-controls={`tabpanel-${idx}`}
            id={`tab-${idx}`}
            tabIndex={activeIndex === idx ? 0 : -1}
            className={`-mb-px border-b-2 px-4 py-2 font-medium transition-colors focus:outline-none ${activeIndex === idx ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-blue-600'}`}
            onClick={() => onChange(idx)}
            onKeyDown={e => {
              if (e.key === 'ArrowRight') onChange((idx + 1) % tabs.length);
              if (e.key === 'ArrowLeft')
                onChange((idx - 1 + tabs.length) % tabs.length);
            }}
          >
            {tab}
          </button>
        ))}
      </div>
      <div
        id={`tabpanel-${activeIndex}`}
        role="tabpanel"
        aria-labelledby={`tab-${activeIndex}`}
        className="pt-4"
      >
        {children[activeIndex]}
      </div>
    </div>
  );
};

export default Tabs;
