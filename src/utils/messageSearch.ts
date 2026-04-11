/**
 * Message Search Utility
 * Advanced search in messages using Russian morphological analysis via Pyodide
 */

import type { Message } from '../types';
import { extractWordForms, normalizeRussianText } from './pyodideManager';

export interface SearchResult {
  message: Message;
  matchPositions: number[]; // Character positions of matches in content
  matchedWords: string[]; // The actual words that matched
  relevance: number; // 0-1 score for relevance
}

export interface SearchOptions {
  caseSensitive?: boolean;
  wholeWord?: boolean;
  usesMorphology?: boolean; // Use Russian morphological analysis
  searchType?: 'simple' | 'advanced'; // simple = substring, advanced = morphology-aware
}

const DEFAULT_OPTIONS: SearchOptions = {
  caseSensitive: false,
  wholeWord: false,
  usesMorphology: true,
  searchType: 'advanced',
};

/**
 * Simple substring search (no morphology)
 */
export function simpleSearch(
  messages: Message[],
  query: string,
  options: SearchOptions = {}
): SearchResult[] {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const searchText = opts.caseSensitive ? query : query.toLowerCase();
  const results: SearchResult[] = [];

  for (const message of messages) {
    if (message.type !== 'text') continue;

    const content = opts.caseSensitive ? message.content : message.content.toLowerCase();
    let currentIndex = 0;
    const matchPositions: number[] = [];
    const matchedWords: string[] = [];

    // Find all occurrences
    while (currentIndex < content.length) {
      const index = content.indexOf(searchText, currentIndex);
      if (index === -1) break;

      // Check if whole word match is required
      if (opts.wholeWord) {
        const before = index === 0 || /\s/.test(content[index - 1]);
        const after = index + searchText.length === content.length || /\s/.test(content[index + searchText.length]);
        if (!before || !after) {
          currentIndex = index + 1;
          continue;
        }
      }

      matchPositions.push(index);
      matchedWords.push(message.content.substring(index, index + searchText.length));
      currentIndex = index + 1;
    }

    if (matchPositions.length > 0) {
      results.push({
        message,
        matchPositions,
        matchedWords,
        relevance: Math.min(1, matchPositions.length / 3), // Normalize relevance score
      });
    }
  }

  // Sort by relevance (more matches = higher relevance)
  return results.sort((a, b) => b.relevance - a.relevance);
}

/**
 * Advanced search with Russian morphological analysis
 * Searches for any form of the word in the query
 */
export async function morphologicalSearch(
  messages: Message[],
  query: string,
  options: SearchOptions = {}
): Promise<SearchResult[]> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const results: SearchResult[] = [];

  try {
    // Split query into words and extract all possible forms for each
    const queryWords = query
      .toLowerCase()
      .split(/\s+/)
      .filter(w => w.length > 0);

    if (queryWords.length === 0) return results;

    // Extract word forms for all query words
    const wordFormsMap = new Map<string, Set<string>>();

    for (const word of queryWords) {
      try {
        const normalized = await normalizeRussianText(word);
        let forms = new Set([word, normalized]);

        // Try to extract all forms
        try {
          const allForms = await extractWordForms(word);
          if (allForms.has(normalized)) {
            forms = allForms.get(normalized)!;
          }
        } catch (e) {
          // Use fallback - just normalized form
          console.debug('Could not extract all forms, using normalized:', normalized);
        }

        wordFormsMap.set(word, forms);
      } catch (error) {
        // Fallback: just use the word itself
        wordFormsMap.set(word, new Set([word]));
        console.debug('Error processing word forms for:', word, error);
      }
    }

    // Search through messages
    for (const message of messages) {
      if (message.type !== 'text') continue;

      const contentLower = message.content.toLowerCase();
      const words = contentLower.split(/\s+/);
      const matchPositions: number[] = [];
      const matchedWords: string[] = [];
      let currentPos = 0;

      // Check each word in the message
      for (let i = 0; i < words.length; i++) {
        const messageWord = words[i];
        currentPos = message.content.indexOf(messageWord, currentPos);

        if (currentPos === -1) break;

        // Check if this word matches any of our query word forms
        for (const [queryWord, forms] of wordFormsMap) {
          // Normalize the message word
          try {
            const normalizedMessageWord = await normalizeRussianText(messageWord);
            
            // Check if normalized form or any form matches
            if (forms.has(messageWord) || forms.has(normalizedMessageWord)) {
              matchPositions.push(currentPos);
              matchedWords.push(message.content.substring(currentPos, currentPos + messageWord.length));
              break;
            }
          } catch (error) {
            // Fallback to simple comparison
            if (forms.has(messageWord)) {
              matchPositions.push(currentPos);
              matchedWords.push(messageWord);
              break;
            }
          }
        }

        currentPos += messageWord.length;
      }

      if (matchPositions.length > 0) {
        results.push({
          message,
          matchPositions,
          matchedWords,
          relevance: Math.min(1, matchPositions.length / queryWords.length),
        });
      }
    }

    // Sort by relevance and timestamp (newest first)
    return results.sort((a, b) => {
      const relevanceDiff = b.relevance - a.relevance;
      if (relevanceDiff !== 0) return relevanceDiff;
      return b.message.timestamp - a.message.timestamp;
    });
  } catch (error) {
    console.error('Morphological search failed, falling back to simple search:', error);
    return simpleSearch(messages, query, options);
  }
}

/**
 * Main search function - chooses between simple and morphological search
 */
export async function searchMessages(
  messages: Message[],
  query: string,
  options: SearchOptions = {}
): Promise<SearchResult[]> {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  if (!query.trim()) return [];

  // Use simple search if requested or if query doesn't contain Russian characters
  if (opts.searchType === 'simple' || !hasRussianCharacters(query)) {
    return simpleSearch(messages, query, opts);
  }

  // Use morphological search for Russian text
  try {
    return await morphologicalSearch(messages, query, opts);
  } catch (error) {
    console.error('Morphological search error:', error);
    // Fallback to simple search
    return simpleSearch(messages, query, opts);
  }
}

/**
 * Check if text contains Russian characters
 */
export function hasRussianCharacters(text: string): boolean {
  return /[а-яёА-ЯЁ]/.test(text);
}

/**
 * Highlight search results in message content
 * Returns HTML with highlighted matches
 */
export function highlightMatches(
  content: string,
  matchPositions: number[],
  matchedWords: string[],
  className: string = 'bg-yellow-300 font-semibold'
): string {
  if (matchPositions.length === 0) return content;

  // Sort positions in reverse to maintain indices when replacing
  const sorted = matchPositions
    .map((pos, idx) => ({ pos, word: matchedWords[idx] }))
    .sort((a, b) => b.pos - a.pos);

  let result = content;
  for (const { pos, word } of sorted) {
    const before = result.substring(0, pos);
    const after = result.substring(pos + word.length);
    result = `${before}<span class="${className}">${word}</span>${after}`;
  }

  return result;
}

/**
 * Filter messages by sender
 */
export function filterBySender(
  messages: Message[],
  senderId: string | string[]
): Message[] {
  const senderIds = Array.isArray(senderId) ? senderId : [senderId];
  return messages.filter(m => senderIds.includes(m.senderId));
}

/**
 * Filter messages by date range
 */
export function filterByDateRange(
  messages: Message[],
  startDate: Date,
  endDate: Date
): Message[] {
  const startTime = startDate.getTime();
  const endTime = endDate.getTime();
  return messages.filter(m => m.timestamp >= startTime && m.timestamp <= endTime);
}

/**
 * Combine multiple filters
 */
export async function advancedSearch(
  messages: Message[],
  options: {
    query?: string;
    senders?: string[];
    startDate?: Date;
    endDate?: Date;
    searchOptions?: SearchOptions;
  }
): Promise<SearchResult[]> {
  let filtered = messages;

  // Apply filters
  if (options.senders && options.senders.length > 0) {
    filtered = filterBySender(filtered, options.senders);
  }

  if (options.startDate && options.endDate) {
    filtered = filterByDateRange(filtered, options.startDate, options.endDate);
  }

  // Apply text search if query is provided
  if (options.query) {
    return searchMessages(filtered, options.query, options.searchOptions);
  }

  return [];
}
