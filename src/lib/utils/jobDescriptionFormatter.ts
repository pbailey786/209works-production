/**
 * Job Description Formatter
 * Converts markdown-style job descriptions to properly styled HTML
 */

export function formatJobDescription(description: string): string {
  if (!description) return '';

  let formatted = description;

  // Remove hidden metadata tags (contact info, degree requirements, benefits)
  // Using more robust regex to handle multi-line JSON and edge cases
  formatted = formatted.replace(/\[CONTACT_EMAIL:.*?\]/gs, '');
  formatted = formatted.replace(/\[REQUIRES_DEGREE:.*?\]/gs, '');
  formatted = formatted.replace(/\[BENEFITS:.*?\]/gs, '');
  
  // Clean up any stray closing brackets that might be left over
  formatted = formatted.replace(/^\s*\]\s*$/gm, '');
  
  // Remove any trailing JSON artifacts (brackets, etc.) at the end of the text
  formatted = formatted.replace(/\s*[\[\]{}]\s*$/g, '');
  
  // Also clean up any orphaned brackets at the end of lines
  formatted = formatted.replace(/\s*\]\s*$/gm, '');
  
  // Clean up any double bullet points that might occur
  formatted = formatted.replace(/•\s*•/g, '•');
  
  formatted = formatted.trim();

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

  // Convert bullet points (both - and • styles)
  formatted = formatted.replace(
    /^[-•]\s*(.*)$/gim,
    '<div class="flex items-start mb-2"><span class="mr-3 w-2 h-2 bg-gray-400 rounded-full mt-2 flex-shrink-0"></span><span class="text-gray-700">$1</span></div>'
  );
  
  // Clean up any trailing brackets or JSON artifacts from list items
  formatted = formatted.replace(
    /<span class="text-gray-700">(.*?)\s*[\[\]{}]\s*<\/span>/g,
    '<span class="text-gray-700">$1</span>'
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

export function extractBenefits(description: string, benefitsField?: string): Array<{icon: string; title: string; description: string; key: string}> {
  // First try the dedicated benefits field if provided
  if (benefitsField && benefitsField.trim()) {
    try {
      // Handle case where benefitsField might already be an array/object
      let benefitsData;
      if (typeof benefitsField === 'string') {
        benefitsData = JSON.parse(benefitsField);
      } else {
        benefitsData = benefitsField;
      }
      
      if (Array.isArray(benefitsData)) {
        // Filter out any invalid entries and ensure all required fields exist
        return benefitsData.filter(benefit => 
          benefit && 
          typeof benefit === 'object' && 
          benefit.title && 
          benefit.title.trim() !== ''
        ).map((benefit, index) => ({
          icon: benefit.icon || '🎁',
          title: benefit.title,
          description: benefit.description || '',
          key: benefit.key || `benefit_${index}`
        }));
      }
    } catch (error) {
      console.error('Error parsing benefits field JSON:', error);
      console.error('Benefits field content:', benefitsField);
    }
  }
  
  if (!description) return [];
  
  // Fallback to extracting from description field
  // Use 's' flag for dotall mode to match across newlines
  const benefitsMatch = description.match(/\[BENEFITS:(.*?)\]/s);
  if (!benefitsMatch) return [];
  
  try {
    // Clean up the JSON string - remove extra whitespace and newlines
    let cleanJsonString = benefitsMatch[1].trim();
    
    // Remove any trailing commas before closing brackets/braces
    cleanJsonString = cleanJsonString.replace(/,(\s*[}\]])/g, '$1');
    
    const benefitsData = JSON.parse(cleanJsonString);
    
    if (Array.isArray(benefitsData)) {
      // Filter and validate benefits
      return benefitsData.filter(benefit => 
        benefit && 
        typeof benefit === 'object' && 
        benefit.title && 
        benefit.title.trim() !== ''
      ).map((benefit, index) => ({
        icon: benefit.icon || '🎁',
        title: benefit.title,
        description: benefit.description || '',
        key: benefit.key || `benefit_${index}`
      }));
    }
    
    return [];
  } catch (error) {
    console.error('Error parsing benefits JSON from description:', error);
    console.error('Raw JSON string was:', benefitsMatch[1]);
    
    // Return empty array instead of crashing
    return [];
  }
}
