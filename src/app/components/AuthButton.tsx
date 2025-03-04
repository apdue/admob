import { useState, useEffect } from 'react';

export default function AuthButton() {
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authStatus, setAuthStatus] = useState<'unauthenticated' | 'need_code' | 'authenticated' | 'error'>('unauthenticated');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [authUrl, setAuthUrl] = useState<string | null>(null);
  const [authCode, setAuthCode] = useState<string>('');

  // Check authentication status on component mount
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const response = await fetch('/api/admob/auth/status');
      const data = await response.json();
      
      if (data.isAuthenticated) {
        setAuthStatus('authenticated');
      } else {
        setAuthStatus('unauthenticated');
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
      setAuthStatus('unauthenticated');
    }
  };

  const handleAuthentication = async () => {
    try {
      setIsAuthenticating(true);
      setErrorMessage(null);
      
      const response = await fetch('/api/admob/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code: null })
      });
      
      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || 'Authentication failed');
      }
      
      const result = await response.json();
      
      if (result.status === 'need_code') {
        setAuthStatus('need_code');
        setAuthUrl(result.authUrl);
        window.open(result.authUrl, '_blank');
      } else {
        setAuthStatus('authenticated');
        localStorage.setItem('gcloudAuthStatus', 'authenticated');
        window.location.reload();
      }
    } catch (error) {
      setAuthStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Authentication failed');
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleCodeSubmit = async () => {
    try {
      setIsAuthenticating(true);
      setErrorMessage(null);
      
      const response = await fetch('/api/admob/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code: authCode })
      });
      
      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || 'Authentication failed');
      }
      
      const result = await response.json();
      setAuthStatus('authenticated');
      localStorage.setItem('gcloudAuthStatus', 'authenticated');
      
      window.location.reload();
    } catch (error) {
      setAuthStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Authentication failed');
    } finally {
      setIsAuthenticating(false);
    }
  };

  return (
    <div className="flex items-center gap-4">
      {authStatus === 'need_code' ? (
        <div className="flex flex-col gap-2">
          <input
            type="text"
            value={authCode}
            onChange={(e) => setAuthCode(e.target.value)}
            placeholder="Enter authentication code"
            className="px-4 py-2 border rounded-md"
          />
          <div className="flex gap-2">
            <button
              onClick={handleCodeSubmit}
              disabled={isAuthenticating || !authCode}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50"
            >
              Submit Code
            </button>
            <button
              onClick={() => window.open(authUrl!, '_blank')}
              className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
            >
              Open Auth URL Again
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={handleAuthentication}
          disabled={isAuthenticating}
          className={`px-4 py-2 rounded-md font-medium flex items-center gap-2 ${
            authStatus === 'authenticated'
              ? 'bg-green-500 text-white'
              : authStatus === 'error'
              ? 'bg-red-500 text-white'
              : 'bg-blue-500 text-white hover:bg-blue-600'
          }`}
        >
          {isAuthenticating ? (
            <>
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Starting Auth...
            </>
          ) : authStatus === 'authenticated' ? (
            'Authenticated'
          ) : (
            'Authenticate with Google Cloud'
          )}
        </button>
      )}
      
      {errorMessage && (
        <p className="text-red-500 text-sm">{errorMessage}</p>
      )}
    </div>
  );
} 