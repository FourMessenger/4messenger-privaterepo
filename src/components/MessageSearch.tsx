/**
 * Message Search Component
 * Provides UI for searching messages with Pyodide morphological analysis
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { Search, X, ChevronUp, ChevronDown, AlertCircle } from 'lucide-react';
import type { Message } from '../types';
import { searchMessages, highlightMatches, type SearchResult, type SearchOptions } from '../utils/messageSearch';
import { hasRussianCharacters } from '../utils/messageSearch';

interface MessageSearchProps {
  messages: Message[];
  onResultClick?: (message: Message, index: number) => void;
  onClose?: () => void;
  isOpen?: boolean;
  className?: string;
}

export function MessageSearch({
  messages,
  onResultClick,
  onClose,
  isOpen = true,
  className = '',
}: MessageSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [currentResultIndex, setCurrentResultIndex] = useState(0);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchOptions, setSearchOptions] = useState<SearchOptions>({
    caseSensitive: false,
    wholeWord: false,
    usesMorphology: true,
    searchType: 'advanced',
  });
  const searchInputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Perform search
  const performSearch = useCallback(
    async (searchQuery: string) => {
      if (!searchQuery.trim()) {
        setResults([]);
        setError(null);
        return;
      }

      setIsSearching(true);
      setError(null);
      setCurrentResultIndex(0);

      // Cancel previous search if still running
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      try {
        const searchResults = await searchMessages(messages, searchQuery, searchOptions);
        setResults(searchResults);

        if (searchResults.length === 0) {
          setError(`No messages found for "${searchQuery}"`);
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Search failed';
        setError(errorMessage);
        console.error('Search error:', err);
      } finally {
        setIsSearching(false);
      }
    },
    [messages, searchOptions]
  );

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      performSearch(query);
    }, 300);

    return () => clearTimeout(timer);
  }, [query, performSearch]);

  // Handle navigation between results
  const goToNextResult = useCallback(() => {
    if (results.length === 0) return;
    const nextIndex = (currentResultIndex + 1) % results.length;
    setCurrentResultIndex(nextIndex);
    if (onResultClick) {
      onResultClick(results[nextIndex].message, nextIndex);
    }
  }, [results, currentResultIndex, onResultClick]);

  const goToPreviousResult = useCallback(() => {
    if (results.length === 0) return;
    const prevIndex = currentResultIndex === 0 ? results.length - 1 : currentResultIndex - 1;
    setCurrentResultIndex(prevIndex);
    if (onResultClick) {
      onResultClick(results[prevIndex].message, prevIndex);
    }
  }, [results, currentResultIndex, onResultClick]);

  const handleClear = useCallback(() => {
    setQuery('');
    setResults([]);
    setError(null);
    setCurrentResultIndex(0);
    searchInputRef.current?.focus();
  }, []);

  // Focus search input on mount/when open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const currentResult = results[currentResultIndex];
  const hasRussian = hasRussianCharacters(query);

  return (
    <div
      className={`flex flex-col gap-3 p-4 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-200/30 rounded-lg shadow-lg ${className}`}
    >
      {/* Search Input */}
      <div className="flex gap-2 items-center">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-indigo-400 w-4 h-4" />
          <input
            ref={searchInputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search messages... (Supports Russian morphology)"
            className="w-full pl-9 pr-3 py-2 bg-white/80 border border-indigo-200/50 rounded text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 placeholder-gray-400"
          />
          {query && (
            <button
              onClick={handleClear}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              aria-label="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/50 rounded transition-colors"
            aria-label="Close search"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        )}
      </div>

      {/* Search Options */}
      {hasRussian && (
        <div className="flex gap-2 flex-wrap text-xs">
          <label className="flex items-center gap-1 cursor-pointer">
            <input
              type="checkbox"
              checked={searchOptions.usesMorphology}
              onChange={(e) =>
                setSearchOptions({
                  ...searchOptions,
                  usesMorphology: e.target.checked,
                })
              }
              className="w-3 h-3 rounded"
            />
            <span className="text-gray-600">Morphological (Russian)</span>
          </label>
          <label className="flex items-center gap-1 cursor-pointer">
            <input
              type="checkbox"
              checked={searchOptions.caseSensitive}
              onChange={(e) =>
                setSearchOptions({
                  ...searchOptions,
                  caseSensitive: e.target.checked,
                })
              }
              className="w-3 h-3 rounded"
            />
            <span className="text-gray-600">Case Sensitive</span>
          </label>
          <label className="flex items-center gap-1 cursor-pointer">
            <input
              type="checkbox"
              checked={searchOptions.wholeWord}
              onChange={(e) =>
                setSearchOptions({
                  ...searchOptions,
                  wholeWord: e.target.checked,
                })
              }
              className="w-3 h-3 rounded"
            />
            <span className="text-gray-600">Whole Word</span>
          </label>
        </div>
      )}

      {/* Results Info */}
      {isSearching && (
        <div className="text-sm text-indigo-600 flex items-center gap-2">
          <div className="w-3 h-3 bg-indigo-500 rounded-full animate-pulse" />
          Searching...
        </div>
      )}

      {error && (
        <div className="flex gap-2 text-yellow-700 text-sm bg-yellow-50/80 p-2 rounded items-start">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {results.length > 0 && !isSearching && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-700">
            Found <span className="font-semibold text-indigo-600">{results.length}</span> message
            {results.length !== 1 ? 's' : ''}
          </span>
          {results.length > 1 && (
            <div className="flex gap-2 items-center">
              <span className="text-gray-600">
                {currentResultIndex + 1} / {results.length}
              </span>
              <div className="flex gap-1">
                <button
                  onClick={goToPreviousResult}
                  className="p-1 hover:bg-white/50 rounded transition-colors"
                  aria-label="Previous result"
                >
                  <ChevronUp className="w-4 h-4" />
                </button>
                <button
                  onClick={goToNextResult}
                  className="p-1 hover:bg-white/50 rounded transition-colors"
                  aria-label="Next result"
                >
                  <ChevronDown className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Current Result Preview */}
      {currentResult && results.length > 0 && (
        <div className="bg-white/60 rounded border border-indigo-200/50 p-3 text-sm max-h-32 overflow-auto">
          <div className="font-semibold text-gray-700 mb-1">Preview:</div>
          <div className="text-gray-600 line-clamp-3">
            {currentResult.message.content.substring(0, 150)}
            {currentResult.message.content.length > 150 ? '...' : ''}
          </div>
          {currentResult.matchedWords.length > 0 && (
            <div className="mt-2 text-xs text-indigo-600">
              Matched: <span className="font-mono">{currentResult.matchedWords.join(', ')}</span>
            </div>
          )}
        </div>
      )}

      {/* Info about Russian morphological search */}
      {hasRussian && query && results.length > 0 && (
        <div className="text-xs text-gray-500 italic">
          💡 Morphological search enabled: finds all grammatical forms of Russian words
        </div>
      )}
    </div>
  );
}

export default MessageSearch;
