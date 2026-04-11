/**
 * Pyodide Manager for Russian Text Morphological Analysis
 * Handles initialization and caching of Pyodide instance with pymorphy3
 */

let pyodideInstance: any = null;
let initPromise: Promise<any> | null = null;
let isPymorphy3Loaded = false;

/**
 * Load Pyodide with pymorphy3 support
 */
export async function initializePyodide(): Promise<any> {
  // Return cached instance if already initialized
  if (pyodideInstance) {
    return pyodideInstance;
  }

  // Return existing promise to avoid multiple initialization attempts
  if (initPromise) {
    return initPromise;
  }

  initPromise = (async () => {
    try {
      // Load Pyodide from CDN
      const pyodideUrl = 'https://cdn.jsdelivr.net/pyodide/v0.24.1/full/';
      
      // Use the global loadPyodide function from CDN
      let loadPyodideFn;
      
      // Check if loadPyodide is available globally (loaded from CDN script tag)
      if (typeof (globalThis as any).loadPyodide !== 'undefined') {
        loadPyodideFn = (globalThis as any).loadPyodide;
      } else {
        // Fallback: dynamically load from CDN
        await new Promise((resolve, reject) => {
          const script = document.createElement('script');
          script.src = `${pyodideUrl}pyodide.js`;
          script.onload = resolve;
          script.onerror = reject;
          document.head.appendChild(script);
        });
        loadPyodideFn = (globalThis as any).loadPyodide;
      }

      console.log('Loading Pyodide...');
      pyodideInstance = await loadPyodideFn({
        indexURL: pyodideUrl,
      });

      console.log('Pyodide loaded successfully');

      // Load micropip if pymorphy3 isn't already available
      if (!isPymorphy3Loaded) {
        console.log('Installing pymorphy3...');
        await pyodideInstance.loadPackage('micropip');
        const micropip = pyodideInstance.pyimport('micropip');
        
        try {
          await micropip.install('pymorphy3');
        } catch (e) {
          console.warn('Failed to install pymorphy3:', e);
          throw new Error('Failed to install pymorphy3: ' + (e instanceof Error ? e.message : String(e)));
        }

        isPymorphy3Loaded = true;
        console.log('pymorphy3 installed successfully');
      }

      return pyodideInstance;
    } catch (error) {
      console.error('Failed to initialize Pyodide:', error);
      pyodideInstance = null;
      initPromise = null;
      throw error;
    }
  })();

  return initPromise;
}

/**
 * Get or initialize Pyodide instance
 */
export async function getPyodide(): Promise<any> {
  if (pyodideInstance) {
    return pyodideInstance;
  }
  return initializePyodide();
}

/**
 * Analyze Russian word with pymorphy3
 * Returns all grammatical forms of the word
 */
export async function analyzeRussianWord(word: string): Promise<string[]> {
  try {
    const pyodide = await getPyodide();

    const forms = pyodide.runPython(`
import pymorphy3

morph = pymorphy3.MorphAnalyzer()
p = morph.parse('${word.replace(/'/g, "\\'")}')[0]

# Return array of all forms (lexeme)
[form.word for form in p.lexeme]
`);

    return forms.toJs();
  } catch (error) {
    console.error('Error analyzing Russian word:', error);
    return [word]; // Return original word as fallback
  }
}

/**
 * Normalize Russian text for search
 * Returns the root form of the word
 */
export async function normalizeRussianText(word: string): Promise<string> {
  try {
    const pyodide = await getPyodide();

    const normalized = pyodide.runPython(`
import pymorphy3

morph = pymorphy3.MorphAnalyzer()
parsed = morph.parse('${word.replace(/'/g, "\\'")}')[0]

# Get normal form (корневая форма)
parsed.normal_form
`);

    return normalized.toString();
  } catch (error) {
    console.error('Error normalizing Russian word:', error);
    return word.toLowerCase(); // Fallback to lowercase
  }
}

/**
 * Batch analyze multiple words
 */
export async function analyzeRussianWords(words: string[]): Promise<Map<string, string[]>> {
  try {
    const pyodide = await getPyodide();

    const wordsJson = JSON.stringify(words);
    const result = pyodide.runPython(`
import pymorphy3
import json

morph = pymorphy3.MorphAnalyzer()
words = json.loads('${wordsJson.replace(/'/g, "\\'")}')

result = {}
for word in words:
    try:
        p = morph.parse(word)[0]
        result[word] = [form.word for form in p.lexeme]
    except:
        result[word] = [word]

result
`);

    const jsResult = result.toJs();
    const map = new Map<string, string[]>();
    
    for (const [key, value] of Object.entries(jsResult)) {
      map.set(key, value as string[]);
    }

    return map;
  } catch (error) {
    console.error('Error batch analyzing words:', error);
    // Fallback: return original words
    const map = new Map<string, string[]>();
    for (const word of words) {
      map.set(word, [word]);
    }
    return map;
  }
}

/**
 * Extract all word forms from a sentence
 * Useful for searching by any form of a word
 */
export async function extractWordForms(sentence: string): Promise<Map<string, Set<string>>> {
  try {
    const pyodide = await getPyodide();

    const result = pyodide.runPython(`
import pymorphy3
import re

morph = pymorphy3.MorphAnalyzer()

# Extract words (skip punctuation)
words = re.findall(r'\\b[а-яёА-ЯЁ]+\\b', '${sentence.replace(/'/g, "\\'")}')

# Build mapping of words to their forms
forms_map = {}
for word in words:
    word_lower = word.lower()
    if word_lower not in forms_map:
        try:
            p = morph.parse(word_lower)[0]
            forms = [form.word for form in p.lexeme]
            forms_map[word_lower] = forms
        except:
            forms_map[word_lower] = [word_lower]

forms_map
`);

    const jsResult = result.toJs();
    const formMap = new Map<string, Set<string>>();

    for (const [key, value] of Object.entries(jsResult)) {
      formMap.set(key, new Set(value as string[]));
    }

    return formMap;
  } catch (error) {
    console.error('Error extracting word forms:', error);
    return new Map();
  }
}

/**
 * Destroy Pyodide instance (useful for cleanup)
 */
export async function destroyPyodide(): Promise<void> {
  if (pyodideInstance) {
    try {
      await pyodideInstance.destroy();
    } catch (error) {
      console.error('Error destroying Pyodide instance:', error);
    }
    pyodideInstance = null;
    initPromise = null;
    isPymorphy3Loaded = false;
  }
}
