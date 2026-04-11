# Message Search with Pyodide - Implementation Guide

## Overview

The messenger now has powerful message search capabilities powered by Pyodide and Russian morphological analysis via **pymorphy3**. This allows users to search messages by any grammatical form of Russian words.

## Features

### 1. **Russian Morphological Search**
- Search by any grammatical form of a Russian word
- Example: Searching for "построить" finds messages containing "построена", "построил", "построила", etc.
- Automatically extracts all word forms using `pymorphy3`

### 2. **Simple Text Search**
- Fallback to simple substring matching for non-Russian text
- Full English text search support

### 3. **Search Options**
- **Morphological Analysis** (Russian only) - Toggle to enable/disable
- **Case Sensitive** - Match exact casing
- **Whole Word** - Match complete words only

### 4. **Interactive Search UI**
- Search bar with live results
- Navigate between results with Previous/Next buttons
- Result counter showing matches
- Message preview in search bar
- Highlight matched words in messages

## Files Added/Modified

### New Files
1. **`src/utils/pyodideManager.ts`** - Pyodide initialization and management
   - Handles lazy loading of Pyodide
   - Manages pymorphy3 installation
   - Word analysis and normalization functions

2. **`src/utils/messageSearch.ts`** - Search utilities
   - `searchMessages()` - Main search function (auto-selects algorithm)
   - `morphologicalSearch()` - Russian morphology-aware search
   - `simpleSearch()` - Substring-based search
   - Helper functions for filtering and highlighting

3. **`src/components/MessageSearch.tsx`** - React search component
   - Interactive search UI
   - Result navigation
   - Search options toggle
   - Loading and error states

### Modified Files
1. **`package.json`** - Added `pyodide` dependency

2. **`src/components/ChatScreen.tsx`**
   - Imported `MessageSearch` component
   - Added message search state management
   - Added search button to chat header
   - Added message IDs for navigation
   - Integrated search UI into message area

## Usage

### For Users

1. **Open Message Search**
   - Click the Search icon (🔍) in the chat header next to the Info button

2. **Type Your Query**
   - Enter any text or Russian word
   - Results appear in real-time

3. **Navigate Results**
   - Use Up/Down arrows to navigate between matching messages
   - View message preview in the search bar
   - Click a result to scroll to it

4. **Configure Search**
   - For Russian text, toggle "Morphological" for word form matching
   - Use "Case Sensitive" for exact case matching
   - Use "Whole Word" to match complete words only

5. **Close Search**
   - Click the X button or search for nothing

### For Developers

#### Basic Usage

```typescript
import { searchMessages } from '../utils/messageSearch';

// Simple search
const results = await searchMessages(messages, 'hello');

// Russian morphological search (auto-detected)
const Russian = await searchMessages(messages, 'построить');

// Advanced options
const advancedResults = await searchMessages(messages, 'word', {
  caseSensitive: true,
  wholeWord: true,
  usesMorphology: true,
  searchType: 'advanced'
});
```

#### Using Pyodide Directly

```typescript
import {
  initializePyodide,
  analyzeRussianWord,
  normalizeRussianText,
  extractWordForms
} from '../utils/pyodideManager';

// Initialize once
const pyodide = await initializePyodide();

// Analyze a word
const forms = await analyzeRussianWord('построена');
// Returns: ['построить', 'построил', 'построила', ...]

// Normalize to base form
const normalized = await normalizeRussianText('построила');
// Returns: 'построить'

// Extract all word forms from sentence
const wordForms = await extractWordForms('Дом был построена в 2020');
// Returns: Map of word -> Set of all forms
```

#### Pyodide Initialization

Pyodide is lazily loaded on first use:

```typescript
import { getPyodide, initializePyodide } from '../utils/pyodideManager';

// Automatically initializes if not already done
const pyodide = await getPyodide();

// Or explicitly initialize
await initializePyodide();
```

The initialization:
1. Loads Pyodide from CDN
2. Installs micropip package manager
3. Installs pymorphy3 with CLI support
4. Caches the instance for reuse

## How It Works

### Pyodide Integration

1. **Loading**: Pyodide is loaded dynamically from the browser's worker context
2. **Package Installation**: `pymorphy3` is installed via `micropip`
3. **Caching**: The Pyodide instance is cached to avoid re-initialization

```typescript
// First call - initializes
const pyodide = await getPyodide();
// Subsequent calls - returns cached instance
const pyodide2 = await getPyodide(); // Reuses same instance
```

### Morphological Search Algorithm

For Russian text:
1. Split query into words
2. Extract all grammatical forms for each word using pymorphy3
3. Search through messages for normalized forms
4. Match if message word's normal form is in the forms set
5. Score by number of matches and timestamp

For other text:
1. Full-text substring matching
2. Option to match whole words only
3. Case-sensitive option available

### Performance Optimization

- **Lazy Loading**: Pyodide only loads when first search is performed
- **Caching**: Instance and results are cached
- **Debouncing**: Search debounces input by 300ms
- **Abort Control**: Long-running searches can be cancelled

## Example: Russian Word Search

```typescript
// User searches for "показать"
const results = await searchMessages(messages, 'показать', {
  usesMorphology: true
});

// Will find messages containing:
// - показать (infinitive)
// - показал (past tense)
// - показала (past tense feminine)
// - показывает (present)
// - показывают (present plural)
// And all other grammatical forms
```

## Error Handling

The search gracefully falls back:
1. If Pyodide fails to load → uses simple search
2. If morphological analysis fails → uses normalized form only
3. If search is cancelled → returns partial results
4. Empty query → returns empty results with error message

## Browser Compatibility

- Modern browsers with WebWorker support
- Requires JavaScript enabled
- No server-side dependencies for search (all client-side)

## Performance Considerations

- **First Search**: ~2-3 seconds (Pyodide initialization)
- **Subsequent Searches**: ~100-500ms (depends on query and message count)
- **Memory**: ~50MB for Pyodide + Python runtime
- **Network**: One-time ~20MB download for Pyodide

## Future Enhancements

- [ ] Search history
- [ ] Saved searches
- [ ] Filter by sender, date range
- [ ] Search in specific folders/labels
- [ ] Full-text indexing for performance
- [ ] Search result export
- [ ] Advanced syntax (AND, OR, NOT operators)

## Troubleshooting

### Search not working
1. Check browser console for errors
2. Ensure Pyodide CDN is accessible
3. Try disabling morphological analysis

### Slow first search
- Normal - Pyodide is initializing (~2-3s)
- Subsequent searches are much faster

### Out of memory
- Too many messages (100k+)
- Close other browser tabs
- Try filtering by date range first

## API Reference

See `src/utils/pyodideManager.ts` and `src/utils/messageSearch.ts` for full API documentation.

### Key Exports

**pyodideManager.ts:**
- `initializePyodide()` - Initialize Pyodide
- `getPyodide()` - Get or initialize instance
- `analyzeRussianWord(word)` - Get all forms
- `normalizeRussianText(word)` - Get normal form
- `extractWordForms(sentence)` - Extract all forms from text
- `destroyPyodide()` - Clean up

**messageSearch.ts:**
- `searchMessages(messages, query, options)` - Main search
- `morphologicalSearch(messages, query, options)` - Morphology search
- `simpleSearch(messages, query, options)` - Text search
- `advancedSearch(messages, options)` - With filters
- `highlightMatches(content, positions, words)` - HTML highlighting
- `hasRussianCharacters(text)` - Detect Russian text
