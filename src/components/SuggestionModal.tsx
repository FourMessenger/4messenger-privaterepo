import { useState, useEffect } from 'react';
import { X, Send, AlertCircle, CheckCircle } from 'lucide-react';

interface SuggestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  location: 'server-selection' | 'user-settings';
  username?: string;
}

export function SuggestionModal({ 
  isOpen, 
  onClose, 
  location,
  username = 'anonymous'
}: SuggestionModalProps) {
  const [suggestion, setSuggestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [charCount, setCharCount] = useState(0);
  const [suggestionServer, setSuggestionServer] = useState<string>('http://localhost:3001');
  const MAX_CHARS = 2000;

  // Load suggestion server URL from suggest.txt
  useEffect(() => {
    const loadServerUrl = async () => {
      try {
        const response = await fetch('/suggest.txt');
        if (response.ok) {
          const url = await response.text();
          setSuggestionServer(url.trim());
        }
      } catch (err) {
        console.warn('Could not load suggest.txt, using default URL');
        setSuggestionServer('http://localhost:3001');
      }
    };

    if (isOpen) {
      loadServerUrl();
    }
  }, [isOpen]);

  const handleSuggestionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    const count = text.length;
    
    if (count <= MAX_CHARS) {
      setSuggestion(text);
      setCharCount(count);
      setError(null);
    } else {
      setError(`Maximum ${MAX_CHARS} characters allowed`);
    }
  };

  const handleSubmit = async () => {
    if (!suggestion.trim()) {
      setError('Please enter a suggestion');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch(`${suggestionServer}/api/suggestions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: suggestion,
          location,
          username,
          timestamp: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit suggestion');
      }

      setSuccess(true);
      setSuggestion('');
      setCharCount(0);

      // Close modal after 2 seconds
      setTimeout(() => {
        onClose();
        setSuccess(false);
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit suggestion');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            📝 Send us a suggestion
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          >
            <X size={20} />
          </button>
        </div>

        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Help us improve by sharing your ideas, feature requests, or feedback.
        </p>

        <textarea
          value={suggestion}
          onChange={handleSuggestionChange}
          placeholder="Type your suggestion here..."
          disabled={loading || success}
          className="w-full h-32 p-3 border border-gray-300 dark:border-gray-600 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white mb-3"
        />

        <div className="flex justify-between items-center mb-4">
          <span className={`text-sm ${charCount > MAX_CHARS * 0.9 ? 'text-orange-500' : 'text-gray-500'}`}>
            {charCount} / {MAX_CHARS}
          </span>
          {charCount > MAX_CHARS * 0.9 && (
            <span className="text-xs text-orange-500">
              ({MAX_CHARS - charCount} remaining)
            </span>
          )}
        </div>

        {error && (
          <div className="flex items-center gap-2 mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <AlertCircle size={18} className="text-red-600 dark:text-red-400 flex-shrink-0" />
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        {success && (
          <div className="flex items-center gap-2 mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
            <CheckCircle size={18} className="text-green-600 dark:text-green-400 flex-shrink-0" />
            <p className="text-sm text-green-600 dark:text-green-400">Thank you for your feedback!</p>
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={loading || success}
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || success || !suggestion.trim()}
            className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send size={18} />
                Send
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
