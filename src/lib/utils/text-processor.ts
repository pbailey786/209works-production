/**
 * Text Processing Utilities
 * Handles text analysis, cleaning, and processing operations
 */

export interface TextAnalysis {
  wordCount: number;
  characterCount: number;
  sentenceCount: number;
  paragraphCount: number;
  readingTime: number; // in minutes
  keywords: string[];
  sentiment?: 'positive' | 'negative' | 'neutral';
  language?: string;
}

export interface AutocompleteResult {
  text: string;
  score: number;
  type: 'job_title' | 'company' | 'location' | 'skill';
  metadata?: Record<string, any>;
}

export class TextProcessor {
  // Common stop words to filter out
  private static readonly STOP_WORDS = new Set([
    'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from',
    'has', 'he', 'in', 'is', 'it', 'its', 'of', 'on', 'that', 'the',
    'to', 'was', 'will', 'with', 'would', 'you', 'your', 'have', 'had',
    'this', 'they', 'we', 'or', 'but', 'not', 'can', 'could', 'should',
    'may', 'might', 'must', 'shall', 'do', 'does', 'did', 'get', 'got'
  ]);

  /**
   * Clean and normalize text
   */
  static cleanText(text: string): string {
    return text
      // Remove extra whitespace
      .replace(/\s+/g, ' ')
      // Remove special characters but keep basic punctuation
      .replace(/[^\w\s.,!?;:()\-]/g, '')
      // Normalize quotes
      .replace(/[""'']/g, '"')
      // Remove multiple punctuation
      .replace(/[.]{2,}/g, '.')
      .replace(/[!]{2,}/g, '!')
      .replace(/[?]{2,}/g, '?')
      // Trim
      .trim();
  }

  /**
   * Extract keywords from text
   */
  static extractKeywords(text: string, maxKeywords: number = 20): string[] {
    const cleanedText = this.cleanText(text.toLowerCase());
    
    // Split into words and filter
    const words = cleanedText
      .split(/\s+/)
      .filter(word => 
        word.length > 2 && 
        !this.STOP_WORDS.has(word) &&
        /^[a-zA-Z]+$/.test(word)
      );

    // Count word frequency
    const wordCount: Record<string, number> = {};
    words.forEach(word => {
      wordCount[word] = (wordCount[word] || 0) + 1;
    });

    // Sort by frequency and return top keywords
    return Object.entries(wordCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, maxKeywords)
      .map(([word]) => word);
  }

  /**
   * Analyze text content
   */
  static analyzeText(text: string): TextAnalysis {
    const cleanedText = this.cleanText(text);
    
    const wordCount = cleanedText.split(/\s+/).filter(word => word.length > 0).length;
    const characterCount = cleanedText.length;
    const sentenceCount = cleanedText.split(/[.!?]+/).filter(s => s.trim().length > 0).length;
    const paragraphCount = text.split(/\n\s*\n/).filter(p => p.trim().length > 0).length;
    
    // Estimate reading time (average 200 words per minute)
    const readingTime = Math.ceil(wordCount / 200);
    
    const keywords = this.extractKeywords(cleanedText);
    
    return {
      wordCount,
      characterCount,
      sentenceCount,
      paragraphCount,
      readingTime,
      keywords,
      sentiment: this.analyzeSentiment(cleanedText),
      language: this.detectLanguage(cleanedText)
    };
  }

  /**
   * Simple sentiment analysis
   */
  static analyzeSentiment(text: string): 'positive' | 'negative' | 'neutral' {
    const positiveWords = [
      'good', 'great', 'excellent', 'amazing', 'wonderful', 'fantastic',
      'love', 'like', 'enjoy', 'happy', 'pleased', 'satisfied', 'perfect',
      'best', 'awesome', 'brilliant', 'outstanding', 'superb', 'marvelous'
    ];
    
    const negativeWords = [
      'bad', 'terrible', 'awful', 'horrible', 'hate', 'dislike', 'angry',
      'frustrated', 'disappointed', 'worst', 'poor', 'pathetic', 'useless',
      'annoying', 'irritating', 'disgusting', 'revolting', 'appalling'
    ];
    
    const words = text.toLowerCase().split(/\s+/);
    
    let positiveScore = 0;
    let negativeScore = 0;
    
    words.forEach(word => {
      if (positiveWords.includes(word)) positiveScore++;
      if (negativeWords.includes(word)) negativeScore++;
    });
    
    if (positiveScore > negativeScore) return 'positive';
    if (negativeScore > positiveScore) return 'negative';
    return 'neutral';
  }

  /**
   * Simple language detection
   */
  static detectLanguage(text: string): string {
    const englishWords = ['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of'];
    const spanishWords = ['el', 'la', 'y', 'o', 'pero', 'en', 'de', 'con', 'por', 'para'];
    
    const lowerText = text.toLowerCase();
    
    const englishCount = englishWords.reduce((count, word) => {
      return count + (lowerText.split(word).length - 1);
    }, 0);
    
    const spanishCount = spanishWords.reduce((count, word) => {
      return count + (lowerText.split(word).length - 1);
    }, 0);
    
    if (englishCount > spanishCount) return 'en';
    if (spanishCount > englishCount) return 'es';
    return 'unknown';
  }

  /**
   * Generate autocomplete suggestions
   */
  static generateAutocompleteSuggestions(
    query: string,
    candidates: Array<{ text: string; type: AutocompleteResult['type']; metadata?: any }>
  ): AutocompleteResult[] {
    if (!query || query.length < 2) return [];
    
    const normalizedQuery = query.toLowerCase().trim();
    
    const results: AutocompleteResult[] = candidates
      .map(candidate => {
        const normalizedText = candidate.text.toLowerCase();
        let score = 0;
        
        // Exact match gets highest score
        if (normalizedText === normalizedQuery) {
          score = 100;
        }
        // Starts with query gets high score
        else if (normalizedText.startsWith(normalizedQuery)) {
          score = 80;
        }
        // Contains query gets medium score
        else if (normalizedText.includes(normalizedQuery)) {
          score = 60;
        }
        // Fuzzy match gets lower score
        else if (this.fuzzyMatch(normalizedQuery, normalizedText)) {
          score = 40;
        }
        
        // Boost score based on text length (shorter is better for autocomplete)
        if (score > 0) {
          const lengthBoost = Math.max(0, 20 - candidate.text.length);
          score += lengthBoost;
        }
        
        return {
          text: candidate.text,
          score,
          type: candidate.type,
          metadata: candidate.metadata
        };
      })
      .filter(result => result.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 10); // Limit to top 10 results
    
    return results;
  }

  /**
   * Simple fuzzy matching
   */
  static fuzzyMatch(query: string, text: string, threshold: number = 0.7): boolean {
    if (query.length === 0) return true;
    if (text.length === 0) return false;
    
    const matrix: number[][] = [];
    
    // Initialize matrix
    for (let i = 0; i <= text.length; i++) {
      matrix[i] = [i];
    }
    for (let j = 0; j <= query.length; j++) {
      matrix[0][j] = j;
    }
    
    // Fill matrix
    for (let i = 1; i <= text.length; i++) {
      for (let j = 1; j <= query.length; j++) {
        if (text[i - 1] === query[j - 1]) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j] + 1,     // deletion
            matrix[i][j - 1] + 1,     // insertion
            matrix[i - 1][j - 1] + 1  // substitution
          );
        }
      }
    }
    
    const distance = matrix[text.length][query.length];
    const similarity = 1 - (distance / Math.max(query.length, text.length));
    
    return similarity >= threshold;
  }

  /**
   * Highlight search terms in text
   */
  static highlightSearchTerms(text: string, searchTerms: string[]): string {
    let highlightedText = text;
    
    searchTerms.forEach(term => {
      const regex = new RegExp(`(${term})`, 'gi');
      highlightedText = highlightedText.replace(regex, '<mark>$1</mark>');
    });
    
    return highlightedText;
  }

  /**
   * Truncate text with ellipsis
   */
  static truncateText(text: string, maxLength: number, suffix: string = '...'): string {
    if (text.length <= maxLength) return text;
    
    const truncated = text.substring(0, maxLength - suffix.length);
    const lastSpace = truncated.lastIndexOf(' ');
    
    // Try to break at word boundary
    if (lastSpace > maxLength * 0.8) {
      return truncated.substring(0, lastSpace) + suffix;
    }
    
    return truncated + suffix;
  }

  /**
   * Extract email addresses from text
   */
  static extractEmails(text: string): string[] {
    const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
    return text.match(emailRegex) || [];
  }

  /**
   * Extract phone numbers from text
   */
  static extractPhoneNumbers(text: string): string[] {
    const phoneRegex = /(\+?1[-.\s]?)?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}/g;
    return text.match(phoneRegex) || [];
  }

  /**
   * Extract URLs from text
   */
  static extractUrls(text: string): string[] {
    const urlRegex = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/g;
    return text.match(urlRegex) || [];
  }

  /**
   * Convert text to slug
   */
  static toSlug(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  }

  /**
   * Calculate text similarity using Jaccard index
   */
  static calculateSimilarity(text1: string, text2: string): number {
    const words1 = new Set(text1.toLowerCase().split(/\s+/));
    const words2 = new Set(text2.toLowerCase().split(/\s+/));
    
    const intersection = new Set([...words1].filter(word => words2.has(word)));
    const union = new Set([...words1, ...words2]);
    
    return intersection.size / union.size;
  }
}
