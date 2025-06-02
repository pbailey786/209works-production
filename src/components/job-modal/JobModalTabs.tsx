import React from 'react';
import {
  BriefcaseIcon,
  ClockIcon,
  BuildingOfficeIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';

export type TabType = 'overview' | 'details' | 'company' | 'apply';

interface JobModalTabsProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

const tabs = [
  { id: 'overview', label: 'Overview', icon: BriefcaseIcon },
  { id: 'details', label: 'Job Details', icon: ClockIcon },
  { id: 'company', label: 'Company', icon: BuildingOfficeIcon },
  { id: 'apply', label: 'Apply', icon: ChevronRightIcon },
] as const;

export default function JobModalTabs({ activeTab, onTabChange }: JobModalTabsProps) {
  return (
    <div className="border-b border-gray-200 px-6">
      <nav className="flex space-x-8" aria-label="Tabs" role="tablist">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id as TabType)}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 ${
                isActive
                  ? 'border-purple-500 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              aria-selected={isActive}
              role="tab"
              tabIndex={isActive ? 0 : -1}
            >
              <div className="flex items-center">
                <Icon className="h-4 w-4 mr-2" />
                {tab.label}
              </div>
            </button>
          );
        })}
      </nav>
    </div>
  );
} 