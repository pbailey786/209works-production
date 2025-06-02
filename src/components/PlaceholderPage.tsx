import React from 'react';
import { ReactNode } from "react";
import { 
  PlaceholderPageProps, 
  type WireframeSection,
  QuickAction,
  validatePlaceholderPageProps,
  defaultPlaceholderPageProps 
} from '@/lib/types/component-props';

// Wireframe components would be imported here when the module is available
// For now, we use the built-in WireframeSection component below

const WireframeSection = ({ 
  wireframeType, 
  title, 
  items = [] 
}: { 
  wireframeType: WireframeSection['wireframeType']; 
  title: string; 
  items?: string[] 
}) => {
  switch (wireframeType) {
    case "table":
      return (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
          <div className="text-sm font-medium text-gray-600 mb-3">{title} (Table View)</div>
          <div className="space-y-2">
            <div className="flex space-x-4 text-xs font-medium text-gray-500 bg-gray-50 p-2 rounded">
              {(items.length > 0 ? items : ["Column 1", "Column 2", "Column 3", "Actions"]).map((col, i) => (
                <div key={i} className="flex-1">{col}</div>
              ))}
            </div>
            {[1, 2, 3].map((row) => (
              <div key={row} className="flex space-x-4 text-xs text-gray-400 p-2 border-b border-gray-200">
                <div className="flex-1">Data row {row}</div>
                <div className="flex-1">Sample data</div>
                <div className="flex-1">More info</div>
                <div className="flex-1">• • •</div>
              </div>
            ))}
          </div>
        </div>
      );

    case "cards":
      return (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
          <div className="text-sm font-medium text-gray-600 mb-3">{title} (Card Grid)</div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((card) => (
              <div key={card} className="bg-gray-50 border border-gray-200 rounded p-3">
                <div className="w-full h-20 bg-gray-200 rounded mb-2"></div>
                <div className="text-xs text-gray-500">Card {card} Title</div>
                <div className="text-xs text-gray-400">Card description</div>
              </div>
            ))}
          </div>
        </div>
      );

    case "chart":
      return (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
          <div className="text-sm font-medium text-gray-600 mb-3">{title} (Chart/Analytics)</div>
          <div className="bg-gray-50 h-64 rounded flex items-center justify-center">
            <div className="text-center text-gray-400">
              <div className="text-4xl mb-2">📊</div>
              <div className="text-sm">Chart/Graph Visualization</div>
              <div className="text-xs">Data visualization components will be rendered here</div>
            </div>
          </div>
        </div>
      );

    case "form":
      return (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
          <div className="text-sm font-medium text-gray-600 mb-3">{title} (Form)</div>
          <div className="space-y-4">
            {(items.length > 0 ? items : ["Field 1", "Field 2", "Field 3"]).map((field, i) => (
              <div key={i}>
                <div className="text-xs text-gray-500 mb-1">{field}</div>
                <div className="h-8 bg-gray-100 border border-gray-200 rounded"></div>
              </div>
            ))}
            <div className="pt-2">
              <div className="h-8 w-24 bg-[#2d4a3e]/10 border border-[#2d4a3e]/20 rounded flex items-center justify-center text-xs text-[#2d4a3e]">
                Submit
              </div>
            </div>
          </div>
        </div>
      );

    case "list":
      return (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
          <div className="text-sm font-medium text-gray-600 mb-3">{title} (List View)</div>
          <div className="space-y-2">
            {(items.length > 0 ? items : ["List item 1", "List item 2", "List item 3", "List item 4"]).map((item, i) => (
              <div key={i} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <div className="text-xs text-gray-600">{item}</div>
                <div className="text-xs text-gray-400">→</div>
              </div>
            ))}
          </div>
        </div>
      );

    case "buttons":
      return (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
          <div className="text-sm font-medium text-gray-600 mb-3">{title} (Action Buttons)</div>
          <div className="flex flex-wrap gap-2">
            {(items.length > 0 ? items : ["Primary Action", "Secondary Action", "More Options"]).map((button, i) => (
              <div
                key={i}
                className={`px-3 py-1 rounded text-xs ${
                  i === 0
                    ? "bg-[#2d4a3e]/10 text-[#2d4a3e] border border-[#2d4a3e]/20"
                    : "bg-gray-100 text-gray-600 border border-gray-200"
                }`}
              >
                {button}
              </div>
            ))}
          </div>
        </div>
      );

    default:
      return (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
          <div className="text-sm font-medium text-gray-600 mb-3">{title}</div>
          <div className="h-32 bg-gray-50 rounded flex items-center justify-center text-gray-400 text-xs">
            Content placeholder
          </div>
        </div>
      );
  }
};

export default function PlaceholderPage(props: PlaceholderPageProps) {
  // Validate props and apply defaults
  const validatedProps = validatePlaceholderPageProps(props);
  const {
    title,
    description,
    icon = defaultPlaceholderPageProps.icon!,
    sections = defaultPlaceholderPageProps.sections!,
    quickActions = defaultPlaceholderPageProps.quickActions!,
    comingSoon = defaultPlaceholderPageProps.comingSoon!
  } = validatedProps;
  return (
    <main className="max-w-7xl mx-auto">
      {/* Page Header */}
      <header className="mb-8">
        <div className="flex items-center space-x-3 mb-4">
          <span className="text-2xl" role="img" aria-label="Page icon">{icon}</span>
          <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
          {comingSoon && (
            <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
              Coming Soon
            </span>
          )}
        </div>
        <p className="text-lg text-gray-600 max-w-3xl">{description}</p>
      </header>

      {/* Quick Actions */}
      {quickActions.length > 0 && (
        <section className="mb-12">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Quick Actions</h2>
          <nav className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {quickActions.map((action, index) => (
              <a
                key={index}
                href={action.href}
                className="group p-6 bg-white border border-gray-200 rounded-lg hover:border-[#2d4a3e] hover:shadow-md transition-all duration-200"
              >
                <div className="flex items-center space-x-3 mb-3">
                  <span className="text-xl" role="img" aria-label={`${action.title} icon`}>{action.icon}</span>
                  <h3 className="text-md font-medium text-gray-900 group-hover:text-[#2d4a3e]">
                    {action.title}
                  </h3>
                </div>
                <p className="text-sm text-gray-600">{action.description}</p>
              </a>
            ))}
          </nav>
        </section>
      )}

      {/* Page Layout Preview */}
      {sections.length > 0 && (
        <section className="space-y-8">
          <h2 className="text-lg font-semibold text-gray-900">Page Layout Preview</h2>
          {sections.map((section, index) => (
            <article key={index}>
              <header className="mb-4">
                <h3 className="text-md font-medium text-gray-900">{section.title}</h3>
                <p className="text-sm text-gray-600 mt-1">{section.description}</p>
              </header>
              <WireframeSection
                wireframeType={section.wireframeType}
                title={section.title}
                items={section.items}
              />
            </article>
          ))}
        </section>
      )}

      {/* Development Notes */}
      <aside className="mt-12 p-6 bg-[#2d4a3e]/5 border border-[#2d4a3e]/20 rounded-lg">
        <h3 className="text-sm font-semibold text-[#2d4a3e] mb-2">🚧 Development Notes</h3>
        <div className="text-sm text-[#1d3a2e] space-y-1">
          <p>• This is a placeholder page showing the intended structure and functionality</p>
          <p>• Wireframe sections represent where dynamic content and components will be implemented</p>
          <p>• Navigation and routing are functional for testing user flows</p>
          <p>• Future development will replace these placeholders with working features</p>
        </div>
      </aside>
    </main>
  );
} 