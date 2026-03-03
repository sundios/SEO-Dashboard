'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faExclamationTriangle, faTimes, faCog, faArrowRight } from '@fortawesome/free-solid-svg-icons';
import Link from 'next/link';

export default function AuthBanner() {
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState(true);
  const [loading, setLoading] = useState(true);
  const [dismissed, setDismissed] = useState(false);

  const checkAuthStatus = async () => {
    try {
      const response = await fetch('http://localhost:5001/api/status');
      if (response.ok) {
        const data = await response.json();
        setIsAuthenticated(data.gsc_connected || false);
      } else {
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuthStatus();
    // Check every 30 seconds
    const interval = setInterval(checkAuthStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  // Re-check when pathname changes (e.g., returning from settings)
  useEffect(() => {
    if (pathname !== '/settings') {
      checkAuthStatus();
    }
  }, [pathname]);

  // Don't show if authenticated, loading, dismissed, or on settings page
  if (isAuthenticated || loading || dismissed || pathname === '/settings') {
    return null;
  }

  return (
    <div className="sticky top-0 z-50 bg-yellow-50 border-b border-yellow-200 shadow-md">
      <div className="max-w-full px-6 py-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3 flex-1">
            <FontAwesomeIcon 
              icon={faExclamationTriangle} 
              className="text-yellow-600 mt-1 flex-shrink-0"
            />
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-yellow-900 mb-1">
                Authentication Required
              </h3>
              <p className="text-sm text-yellow-800 mb-2">
                To use the dashboard, you need to authenticate with Google Search Console. 
                Please go to Settings and follow these steps:
              </p>
              <ol className="text-sm text-yellow-800 list-decimal list-inside space-y-1 mb-3">
                <li>Enter your OpenAI API key</li>
                <li>Enter the path to your Google Search Console credentials file (client_secret.json)</li>
                <li>Click "Save Settings"</li>
                <li>Click "Authorize Credentials" to authenticate with Google</li>
              </ol>
              <Link 
                href="/settings"
                className="inline-flex items-center space-x-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors text-sm font-medium"
              >
                <FontAwesomeIcon icon={faCog} />
                <span>Go to Settings</span>
                <FontAwesomeIcon icon={faArrowRight} className="text-xs" />
              </Link>
            </div>
          </div>
          <button
            onClick={() => setDismissed(true)}
            className="ml-4 text-yellow-600 hover:text-yellow-800 transition-colors flex-shrink-0"
            aria-label="Dismiss"
          >
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>
      </div>
    </div>
  );
}

