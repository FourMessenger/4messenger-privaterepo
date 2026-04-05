import { useStore } from '../store';

const errorDescriptions: Record<number, { title: string; description: string }> = {
  400: {
    title: 'Bad Request',
    description: 'The request sent by the client is invalid or malformed.',
  },
  401: {
    title: 'Unauthorized',
    description: 'Authentication is required to access this resource. Please log in.',
  },
  402: {
    title: 'Payment Required',
    description: 'Payment is required to access this resource.',
  },
  403: {
    title: 'Forbidden',
    description: 'You do not have permission to access this resource.',
  },
  404: {
    title: 'Page Not Found',
    description: 'The page you are looking for does not exist.',
  },
  405: {
    title: 'Method Not Allowed',
    description: 'The HTTP method used for this request is not allowed.',
  },
  407: {
    title: 'Proxy Authentication Required',
    description: 'Proxy authentication is required to access this resource.',
  },
  408: {
    title: 'Request Timeout',
    description: 'The server did not receive the request within the allowed time.',
  },
  409: {
    title: 'Conflict',
    description: 'The request conflicts with the current state of the server.',
  },
  410: {
    title: 'Gone',
    description: 'The requested resource is no longer available and will not be available again.',
  },
  429: {
    title: 'Too Many Requests',
    description: 'You have sent too many requests. Please try again later.',
  },
  500: {
    title: 'Internal Server Error',
    description: 'An unexpected error occurred on the server. Please try again later.',
  },
  501: {
    title: 'Not Implemented',
    description: 'The server does not support the functionality required to fulfill the request.',
  },
  502: {
    title: 'Bad Gateway',
    description: 'The server received an invalid response from an upstream server.',
  },
  503: {
    title: 'Service Unavailable',
    description: 'The server is currently unavailable. Please try again later.',
  },
  504: {
    title: 'Gateway Timeout',
    description: 'The server did not receive a timely response from an upstream server.',
  },
};

export function ErrorPage() {
  const errorState = useStore(s => s.errorState);
  const clearError = useStore(s => s.clearError);
  const resetToConnect = useStore(s => s.setScreen);

  const code = errorState?.code || 500;
  const errorInfo = errorDescriptions[code] || {
    title: 'Error',
    description: 'An unexpected error occurred.',
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div className="w-full max-w-md px-6">
        <div className="text-center">
          {/* Error Code Circle */}
          <div className="mb-8">
            <div className="inline-flex items-center justify-center w-32 h-32 rounded-full bg-red-500 bg-opacity-10 border-2 border-red-500">
              <span className="text-6xl font-bold text-red-500">{code}</span>
            </div>
          </div>

          {/* Error Title */}
          <h1 className="text-4xl font-bold text-white mb-4">{errorInfo.title}</h1>

          {/* Error Description */}
          <p className="text-gray-400 text-lg mb-2">{errorInfo.description}</p>

          {/* Custom Message if provided */}
          {errorState?.description && (
            <p className="text-gray-500 text-sm mb-8 max-h-20 overflow-y-auto">
              {errorState.description}
            </p>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col gap-3 mt-8">
            <button
              onClick={() => {
                clearError();
                window.location.href = '/';
              }}
              className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors duration-200"
            >
              Go to Home
            </button>

            <button
              onClick={() => {
                clearError();
                resetToConnect('connect');
              }}
              className="w-full px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-lg transition-colors duration-200"
            >
              Connect to Server
            </button>

            <button
              onClick={() => {
                clearError();
                window.location.reload();
              }}
              className="w-full px-6 py-3 bg-slate-600 hover:bg-slate-500 text-white font-semibold rounded-lg transition-colors duration-200"
            >
              Refresh Page
            </button>
          </div>

          {/* Footer Info */}
          <p className="text-gray-600 text-xs mt-8">
            If the problem persists, please contact the administrator.
          </p>
        </div>
      </div>
    </div>
  );
}
