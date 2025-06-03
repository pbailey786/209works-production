import React from 'react';
import { ReactNode } from 'react';
import {
  PlaceholderPageProps,
  type WireframeSection,
  QuickAction,
  validatePlaceholderPageProps,
  defaultPlaceholderPageProps,
} from '@/lib/types/component-props';

// Wireframe components would be imported here when the module is available
// For now, we use the built-in WireframeSection component below

const WireframeSection = ({
  wireframeType,
  title,
  items = [],
}: {
  wireframeType: WireframeSection['wireframeType'];
  title: string;
  items?: string[];
}) => {
  switch (wireframeType) {
    case 'table':
      return (
        <div className="rounded-lg border-2 border-dashed border-gray-300 p-4">
          <div className="mb-3 text-sm font-medium text-gray-600">
            {title} (Table View)
          </div>
          <div className="space-y-2">
            <div className="flex space-x-4 rounded bg-gray-50 p-2 text-xs font-medium text-gray-500">
              {(items.length > 0
                ? items
                : ['Column 1', 'Column 2', 'Column 3', 'Actions']
              ).map((col, i) => (
                <div key={i} className="flex-1">
                  {col}
                </div>
              ))}
            </div>
            {[1, 2, 3].map(row => (
              <div
                key={row}
                className="flex space-x-4 border-b border-gray-200 p-2 text-xs text-gray-400"
              >
                <div className="flex-1">Data row {row}</div>
                <div className="flex-1">Sample data</div>
                <div className="flex-1">More info</div>
                <div className="flex-1">• • •</div>
              </div>
            ))}
          </div>
        </div>
      );

    case 'cards':
      return (
        <div className="rounded-lg border-2 border-dashed border-gray-300 p-4">
          <div className="mb-3 text-sm font-medium text-gray-600">
            {title} (Card Grid)
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map(card => (
              <div
                key={card}
                className="rounded border border-gray-200 bg-gray-50 p-3"
              >
                <div className="mb-2 h-20 w-full rounded bg-gray-200"></div>
                <div className="text-xs text-gray-500">Card {card} Title</div>
                <div className="text-xs text-gray-400">Card description</div>
              </div>
            ))}
          </div>
        </div>
      );

    case 'chart':
      return (
        <div className="rounded-lg border-2 border-dashed border-gray-300 p-4">
          <div className="mb-3 text-sm font-medium text-gray-600">
            {title} (Chart/Analytics)
          </div>
          <div className="flex h-64 items-center justify-center rounded bg-gray-50">
            <div className="text-center text-gray-400">
              <div className="mb-2 text-4xl">📊</div>
              <div className="text-sm">Chart/Graph Visualization</div>
              <div className="text-xs">
                Data visualization components will be rendered here
              </div>
            </div>
          </div>
        </div>
      );

    case 'form':
      return (
        <div className="rounded-lg border-2 border-dashed border-gray-300 p-4">
          <div className="mb-3 text-sm font-medium text-gray-600">
            {title} (Form)
          </div>
          <div className="space-y-4">
            {(items.length > 0 ? items : ['Field 1', 'Field 2', 'Field 3']).map(
              (field, i) => (
                <div key={i}>
                  <div className="mb-1 text-xs text-gray-500">{field}</div>
                  <div className="h-8 rounded border border-gray-200 bg-gray-100"></div>
                </div>
              )
            )}
            <div className="pt-2">
              <div className="flex h-8 w-24 items-center justify-center rounded border border-[#2d4a3e]/20 bg-[#2d4a3e]/10 text-xs text-[#2d4a3e]">
                Submit
              </div>
            </div>
          </div>
        </div>
      );

    case 'list':
      return (
        <div className="rounded-lg border-2 border-dashed border-gray-300 p-4">
          <div className="mb-3 text-sm font-medium text-gray-600">
            {title} (List View)
          </div>
          <div className="space-y-2">
            {(items.length > 0
              ? items
              : ['List item 1', 'List item 2', 'List item 3', 'List item 4']
            ).map((item, i) => (
              <div
                key={i}
                className="flex items-center justify-between rounded bg-gray-50 p-2"
              >
                <div className="text-xs text-gray-600">{item}</div>
                <div className="text-xs text-gray-400">→</div>
              </div>
            ))}
          </div>
        </div>
      );

    case 'buttons':
      return (
        <div className="rounded-lg border-2 border-dashed border-gray-300 p-4">
          <div className="mb-3 text-sm font-medium text-gray-600">
            {title} (Action Buttons)
          </div>
          <div className="flex flex-wrap gap-2">
            {(items.length > 0
              ? items
              : ['Primary Action', 'Secondary Action', 'More Options']
            ).map((button, i) => (
              <div
                key={i}
                className={`rounded px-3 py-1 text-xs ${
                  i === 0
                    ? 'border border-[#2d4a3e]/20 bg-[#2d4a3e]/10 text-[#2d4a3e]'
                    : 'border border-gray-200 bg-gray-100 text-gray-600'
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
        <div className="rounded-lg border-2 border-dashed border-gray-300 p-4">
          <div className="mb-3 text-sm font-medium text-gray-600">{title}</div>
          <div className="flex h-32 items-center justify-center rounded bg-gray-50 text-xs text-gray-400">
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
    comingSoon = defaultPlaceholderPageProps.comingSoon!,
  } = validatedProps;
  return (
    <main className="mx-auto max-w-7xl">
      {/* Page Header */}
      <header className="mb-8">
        <div className="mb-4 flex items-center space-x-3">
          <span className="text-2xl" role="img" aria-label="Page icon">
            {icon}
          </span>
          <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
          {comingSoon && (
            <span className="rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800">
              Coming Soon
            </span>
          )}
        </div>
        <p className="max-w-3xl text-lg text-gray-600">{description}</p>
      </header>

      {/* Quick Actions */}
      {quickActions.length > 0 && (
        <section className="mb-12">
          <h2 className="mb-6 text-lg font-semibold text-gray-900">
            Quick Actions
          </h2>
          <nav className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {quickActions.map((action, index) => (
              <a
                key={index}
                href={action.href}
                className="group rounded-lg border border-gray-200 bg-white p-6 transition-all duration-200 hover:border-[#2d4a3e] hover:shadow-md"
              >
                <div className="mb-3 flex items-center space-x-3">
                  <span
                    className="text-xl"
                    role="img"
                    aria-label={`${action.title} icon`}
                  >
                    {action.icon}
                  </span>
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
          <h2 className="text-lg font-semibold text-gray-900">
            Page Layout Preview
          </h2>
          {sections.map((section, index) => (
            <article key={index}>
              <header className="mb-4">
                <h3 className="text-md font-medium text-gray-900">
                  {section.title}
                </h3>
                <p className="mt-1 text-sm text-gray-600">
                  {section.description}
                </p>
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
      <aside className="mt-12 rounded-lg border border-[#2d4a3e]/20 bg-[#2d4a3e]/5 p-6">
        <h3 className="mb-2 text-sm font-semibold text-[#2d4a3e]">
          🚧 Development Notes
        </h3>
        <div className="space-y-1 text-sm text-[#1d3a2e]">
          <p>
            • This is a placeholder page showing the intended structure and
            functionality
          </p>
          <p>
            • Wireframe sections represent where dynamic content and components
            will be implemented
          </p>
          <p>• Navigation and routing are functional for testing user flows</p>
          <p>
            • Future development will replace these placeholders with working
            features
          </p>
        </div>
      </aside>
    </main>
  );
}
