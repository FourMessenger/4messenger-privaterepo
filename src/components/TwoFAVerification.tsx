import { useState, useEffect } from 'react';
import { useStore } from '../store';
import { Lock, Mail, Smartphone, Send, Loader2, ArrowLeft, AlertCircle } from 'lucide-react';

export function TwoFAVerification() {
  const { setScreen, verify2Fa, send2FaEmailCode, twoFaAvailableMethods, twoFaEmailHint, addNotification } = useStore();
  const [selectedMethod, setSelectedMethod] = useState<'totp' | 'email' | 'trusted_device' | null>(null);
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [error, setError] = useState('');
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes

  // Countdown timer for email code
  useEffect(() => {
    if (!emailSent) return;
    
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setEmailSent(false);
          return 300;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [emailSent]);

  const handleSelectMethod = async (method: 'totp' | 'email' | 'trusted_device') => {
    setSelectedMethod(method);
    setCode('');
    setError('');

    if (method === 'email' && !emailSent) {
      setLoading(true);
      const success = await send2FaEmailCode();
      setLoading(false);
      if (success) {
        setEmailSent(true);
        setTimeLeft(300);
      }
    }
  };

  const handleVerify = async () => {
    if (!selectedMethod || !code.trim()) {
      setError('Please enter verification code');
      return;
    }

    setLoading(true);
    setError('');

    const success = await verify2Fa(selectedMethod, code.trim());
    setLoading(false);

    if (!success) {
      setError('Invalid verification code. Please try again.');
      setCode('');
    }
  };

  const handleBack = () => {
    setScreen('login');
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!selectedMethod) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex flex-col items-center justify-center px-4">
        <div className="w-full max-w-md space-y-8">
          {/* Header */}
          <div className="text-center">
            <div className="inline-block p-3 bg-indigo-500/20 rounded-lg mb-4">
              <Lock className="text-indigo-400" size={32} />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Verify Your Identity</h1>
            <p className="text-gray-400">Choose a verification method</p>
          </div>

          {/* Methods */}
          <div className="space-y-3">
            {twoFaAvailableMethods.includes('totp') && (
              <button
                onClick={() => handleSelectMethod('totp')}
                className="w-full p-4 bg-gray-800 hover:bg-gray-700 border border-gray-700 hover:border-indigo-500 rounded-lg transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-500/20 rounded group-hover:bg-indigo-500/30 transition">
                    <Smartphone className="text-indigo-400" size={20} />
                  </div>
                  <div className="text-left flex-1">
                    <div className="font-semibold text-white">Authenticator App</div>
                    <div className="text-sm text-gray-400">Use your authentication app</div>
                  </div>
                </div>
              </button>
            )}

            {twoFaAvailableMethods.includes('email') && (
              <button
                onClick={() => handleSelectMethod('email')}
                className="w-full p-4 bg-gray-800 hover:bg-gray-700 border border-gray-700 hover:border-indigo-500 rounded-lg transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-500/20 rounded group-hover:bg-blue-500/30 transition">
                    <Mail className="text-blue-400" size={20} />
                  </div>
                  <div className="text-left flex-1">
                    <div className="font-semibold text-white">Email</div>
                    <div className="text-sm text-gray-400">Code sent to {twoFaEmailHint || 'your email'}</div>
                  </div>
                </div>
              </button>
            )}

            {twoFaAvailableMethods.includes('trusted_device') && (
              <button
                onClick={() => handleSelectMethod('trusted_device')}
                className="w-full p-4 bg-gray-800 hover:bg-gray-700 border border-gray-700 hover:border-indigo-500 rounded-lg transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-500/20 rounded group-hover:bg-green-500/30 transition">
                    <Smartphone className="text-green-400" size={20} />
                  </div>
                  <div className="text-left flex-1">
                    <div className="font-semibold text-white">Trusted Device</div>
                    <div className="text-sm text-gray-400">Use a trusted device token</div>
                  </div>
                </div>
              </button>
            )}
          </div>

          {/* Back button */}
          <button
            onClick={handleBack}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 text-gray-400 hover:text-white transition"
          >
            <ArrowLeft size={18} />
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-md space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="inline-block p-3 bg-indigo-500/20 rounded-lg mb-4">
            <Lock className="text-indigo-400" size={32} />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            {selectedMethod === 'totp' ? 'Enter Authenticator Code' : selectedMethod === 'email' ? 'Enter Email Code' : 'Enter Device Token'}
          </h1>
          <p className="text-gray-400">
            {selectedMethod === 'totp' ? 'Enter the 6-digit code from your authenticator app' : selectedMethod === 'email' ? `Code sent to ${twoFaEmailHint}` : 'Enter your device token'}
          </p>
        </div>

        {/* Error message */}
        {error && (
          <div className="p-4 bg-red-500/20 border border-red-500/50 rounded-lg flex items-start gap-3">
            <AlertCircle className="text-red-400 flex-shrink-0 mt-0.5" size={20} />
            <div>
              <div className="font-semibold text-red-400">Verification Failed</div>
              <p className="text-sm text-red-300 mt-1">{error}</p>
            </div>
          </div>
        )}

        {/* Code input */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-300">Verification Code</label>
          <input
            type={selectedMethod === 'email' ? 'text' : 'text'}
            inputMode="numeric"
            maxLength={selectedMethod === 'totp' ? 6 : 36}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder={selectedMethod === 'totp' ? '000000' : 'Enter your code'}
            className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-center tracking-widest"
            disabled={loading}
          />
        </div>

        {/* Time left for email */}
        {selectedMethod === 'email' && emailSent && (
          <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg text-center">
            <p className="text-sm text-blue-300">Code expires in {formatTime(timeLeft)}</p>
          </div>
        )}

        {/* Resend button for email */}
        {selectedMethod === 'email' && (
          <button
            onClick={() => handleSelectMethod('email')}
            disabled={loading || emailSent}
            className="w-full px-4 py-2 text-sm text-indigo-400 hover:text-indigo-300 disabled:text-gray-500 transition"
          >
            {emailSent ? `Resend code (${formatTime(timeLeft)})` : 'Send code again'}
          </button>
        )}

        {/* Verify button */}
        <button
          onClick={handleVerify}
          disabled={loading || code.length === 0}
          className="w-full px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              Verifying...
            </>
          ) : (
            <>
              <Send size={18} />
              Verify
            </>
          )}
        </button>

        {/* Back button */}
        <button
          onClick={() => setSelectedMethod(null)}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 text-gray-400 hover:text-white transition"
        >
          <ArrowLeft size={18} />
          Back to Methods
        </button>
      </div>
    </div>
  );
}
