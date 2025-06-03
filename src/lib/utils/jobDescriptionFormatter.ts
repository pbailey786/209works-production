/**
 * Job Description Formatter
 * Converts markdown-style job descriptions to properly styled HTML
 */

export function formatJobDescription(description: string): string {
  if (!description) return '';

  let formatted = description;

  // Convert markdown headers to styled HTML
  formatted = formatted.replace(
    /^## (.*$)/gim,
    '<h3 class="text-lg font-semibold text-gray-900 mt-6 mb-3 flex items-center"><span class="mr-2">📋</span>$1</h3>'
  );
  formatted = formatted.replace(
    /^### (.*$)/gim,
    '<h4 class="text-base font-medium text-gray-800 mt-4 mb-2">$1</h4>'
  );

  // Convert emoji headers with specific styling
  formatted = formatted.replace(
    /^## 👋 (.*$)/gim,
    '<h3 class="text-lg font-semibold text-blue-900 mt-6 mb-3 flex items-center"><span class="mr-2 text-xl">👋</span>$1</h3>'
  );
  formatted = formatted.replace(
    /^## 📋 (.*$)/gim,
    '<h3 class="text-lg font-semibold text-green-900 mt-6 mb-3 flex items-center"><span class="mr-2 text-xl">📋</span>$1</h3>'
  );
  formatted = formatted.replace(
    /^## 🌸 (.*$)/gim,
    '<h3 class="text-lg font-semibold text-pink-900 mt-6 mb-3 flex items-center"><span class="mr-2 text-xl">🌸</span>$1</h3>'
  );
  formatted = formatted.replace(
    /^## 📈 (.*$)/gim,
    '<h3 class="text-lg font-semibold text-purple-900 mt-6 mb-3 flex items-center"><span class="mr-2 text-xl">📈</span>$1</h3>'
  );
  formatted = formatted.replace(
    /^## 🎯 (.*$)/gim,
    '<h3 class="text-lg font-semibold text-red-900 mt-6 mb-3 flex items-center"><span class="mr-2 text-xl">🎯</span>$1</h3>'
  );

  // Convert bullet points with emojis to styled lists
  formatted = formatted.replace(
    /^- \*\* 📍 (.*?):\*\* (.*)$/gim,
    '<div class="flex items-start mb-2"><span class="mr-3 text-lg">📍</span><div><span class="font-medium text-gray-900">$1:</span> <span class="text-gray-700">$2</span></div></div>'
  );
  formatted = formatted.replace(
    /^- \*\* 💰 (.*?):\*\* (.*)$/gim,
    '<div class="flex items-start mb-2"><span class="mr-3 text-lg">💰</span><div><span class="font-medium text-gray-900">$1:</span> <span class="text-gray-700">$2</span></div></div>'
  );
  formatted = formatted.replace(
    /^- \*\* 🗓️ (.*?):\*\* (.*)$/gim,
    '<div class="flex items-start mb-2"><span class="mr-3 text-lg">🗓️</span><div><span class="font-medium text-gray-900">$1:</span> <span class="text-gray-700">$2</span></div></div>'
  );
  formatted = formatted.replace(
    /^- \*\* 🎁 (.*?):\*\* (.*)$/gim,
    '<div class="flex items-start mb-2"><span class="mr-3 text-lg">🎁</span><div><span class="font-medium text-gray-900">$1:</span> <span class="text-gray-700">$2</span></div></div>'
  );

  // Generic emoji bullet points
  formatted = formatted.replace(
    /^- \*\* (.*?):\*\* (.*)$/gim,
    '<div class="flex items-start mb-2"><span class="mr-3 w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></span><div><span class="font-medium text-gray-900">$1:</span> <span class="text-gray-700">$2</span></div></div>'
  );

  // Convert regular bullet points
  formatted = formatted.replace(
    /^- (.*)$/gim,
    '<div class="flex items-start mb-2"><span class="mr-3 w-2 h-2 bg-gray-400 rounded-full mt-2 flex-shrink-0"></span><span class="text-gray-700">$1</span></div>'
  );

  // Convert bold text
  formatted = formatted.replace(
    /\*\*(.*?)\*\*/g,
    '<strong class="font-semibold text-gray-900">$1</strong>'
  );

  // Convert line breaks
  formatted = formatted.replace(/\n\n/g, '</div><div class="mb-4">');
  formatted = formatted.replace(/\n/g, '<br>');

  // Wrap in container
  formatted = `<div class="space-y-4">${formatted}</div>`;

  // Clean up any empty divs
  formatted = formatted.replace(/<div class="mb-4"><\/div>/g, '');

  return formatted;
}

export function extractJobHighlights(description: string): {
  location?: string;
  salary?: string;
  schedule?: string;
  perks?: string[];
} {
  const highlights: any = {};

  // Extract location
  const locationMatch = description.match(/Location:\*\* (.+)/i);
  if (locationMatch) {
    highlights.location = locationMatch[1].trim();
  }

  // Extract salary/pay
  const salaryMatch = description.match(/Pay:\*\* (.+)/i);
  if (salaryMatch) {
    highlights.salary = salaryMatch[1].trim();
  }

  // Extract schedule
  const scheduleMatch = description.match(/Schedule:\*\* (.+)/i);
  if (scheduleMatch) {
    highlights.schedule = scheduleMatch[1].trim();
  }

  // Extract perks
  const perksMatch = description.match(/Perks:\*\* (.+)/i);
  if (perksMatch) {
    highlights.perks = perksMatch[1].split(',').map(perk => perk.trim());
  }

  return highlights;
}
