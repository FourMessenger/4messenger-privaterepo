import { useEffect, useState } from 'react';
import { useStore } from '../store';
import { ArrowLeft, Loader2, AlertCircle } from 'lucide-react';

export function PolicyPage() {
  const setScreen = useStore(s => s.setScreen);
  const [policyContent, setPolicyContent] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isDarkTheme = useStore(s => {
    const t = s.appearance.theme;
    return t === 'dark' || (t === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });

  useEffect(() => {
    const fetchPolicy = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch('/policy.txt');
        if (!response.ok) {
          throw new Error(`Failed to load policy: ${response.status}`);
        }
        const content = await response.text();
        setPolicyContent(content);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load policy');
        console.error('Error loading policy:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPolicy();
  }, []);

  return (
    <div className={`flex min-h-screen items-center justify-center ${isDarkTheme ? 'bg-gradient-to-br from-gray-900 via-indigo-950 to-gray-900' : 'bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50'} p-4`}>
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className={`absolute rounded-full ${isDarkTheme ? 'bg-indigo-500/5' : 'bg-indigo-600/8'}`}
            style={{
              width: Math.random() * 300 + 50,
              height: Math.random() * 300 + 50,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDuration: `${Math.random() * 10 + 5}s`,
              animationDelay: `${Math.random() * 5}s`,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 w-full max-w-2xl">
        <div className={`rounded-2xl border shadow-2xl backdrop-blur-xl overflow-hidden flex flex-col max-h-[90vh] ${
          isDarkTheme
            ? 'border-white/10 bg-white/5'
            : 'border-white/60 bg-white/60'
        }`}>
          {/* Header */}
          <div className={`flex items-center gap-3 p-6 border-b shrink-0 ${
            isDarkTheme
              ? 'border-white/10 bg-gradient-to-r from-indigo-900/50 to-purple-900/50'
              : 'border-gray-200 bg-gradient-to-r from-indigo-50 to-purple-50'
          }`}>
            <button
              onClick={() => setScreen('connect')}
              className={`p-2 rounded-lg transition ${
                isDarkTheme
                  ? 'hover:bg-white/10 text-gray-400'
                  : 'hover:bg-gray-200 text-gray-600'
              }`}
              title="Go back"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <h1 className={`text-2xl font-bold ${isDarkTheme ? 'text-white' : 'text-gray-900'}`}>
              Privacy Policy
            </h1>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
              </div>
            ) : error ? (
              <div className={`flex items-start gap-3 p-4 rounded-lg ${
                isDarkTheme
                  ? 'bg-red-500/10 border border-red-500/20'
                  : 'bg-red-50 border border-red-200'
              }`}>
                <AlertCircle className={`h-5 w-5 shrink-0 mt-0.5 ${isDarkTheme ? 'text-red-400' : 'text-red-600'}`} />
                <div>
                  <p className={`font-medium ${isDarkTheme ? 'text-red-400' : 'text-red-700'}`}>
                    Error Loading Policy
                  </p>
                  <p className={`text-sm mt-1 ${isDarkTheme ? 'text-red-400/80' : 'text-red-600'}`}>
                    {error}
                  </p>
                </div>
              </div>
            ) : (
              <pre className={`font-mono text-sm whitespace-pre-wrap break-words leading-relaxed ${
                isDarkTheme ? 'text-gray-300' : 'text-gray-800'
              }`}>
                {policyContent}
              </pre>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
