'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faKey, faFile, faCheckCircle, faExclamationTriangle, faSpinner, faEye, faEyeSlash, faTrash } from '@fortawesome/free-solid-svg-icons';
import { useData } from '@/contexts/DataContext';

interface SettingsData {
  openaiApiKey: string;
  credentialsPath: string;
  isAuthorized: boolean;
  overviewSites: string[];
}

export default function SettingsPage() {
  const router = useRouter();
  const { clearAllData } = useData();
  const [settings, setSettings] = useState<SettingsData>({
    openaiApiKey: '',
    credentialsPath: '',
    isAuthorized: false,
    overviewSites: []
  });
  const [availableSites, setAvailableSites] = useState<string[]>([]);
  const [siteSearchFilter, setSiteSearchFilter] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [authorizing, setAuthorizing] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [showApiKey, setShowApiKey] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Load settings on mount
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const [settingsResponse, sitesResponse] = await Promise.all([
        fetch('http://localhost:5001/api/settings'),
        fetch('http://localhost:5001/api/sites')
      ]);
      
      if (settingsResponse.ok) {
        const data = await settingsResponse.json();
        console.log('Loaded settings from backend:', data); // Debug log
        // Ensure all values are strings (not null/undefined) to prevent controlled/uncontrolled input warnings
        setSettings({
          openaiApiKey: String(data.openaiApiKey || ''),
          credentialsPath: String(data.credentialsPath || ''),
          isAuthorized: Boolean(data.isAuthorized || false),
          overviewSites: Array.isArray(data.overviewSites) ? data.overviewSites : []
        });
      } else {
        setMessage({ type: 'error', text: 'Failed to load settings' });
      }
      
      if (sitesResponse.ok) {
        const sitesData = await sitesResponse.json();
        setAvailableSites(sitesData.sites || []);
      } else {
        // If sites endpoint fails, still show the section with a message
        setAvailableSites([]);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      setMessage({ type: 'error', text: 'Failed to load settings. Make sure the backend is running.' });
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const response = await fetch('http://localhost:5001/api/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          openaiApiKey: settings.openaiApiKey,
          credentialsPath: settings.credentialsPath,
          overviewSites: settings.overviewSites
        })
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Save response from backend:', result); // Debug log
        console.log('Current settings before update:', settings); // Debug log
        // Update settings with the saved values returned from backend
        // Always use the values from the response if they exist, otherwise keep current settings
        // Always use the values from the backend response, ensuring they're strings
        const updatedSettings = {
          openaiApiKey: String(result.openaiApiKey !== undefined && result.openaiApiKey !== null ? result.openaiApiKey : settings.openaiApiKey || ''),
          credentialsPath: String(result.credentialsPath !== undefined && result.credentialsPath !== null ? result.credentialsPath : settings.credentialsPath || ''),
          isAuthorized: Boolean(result.isAuthorized !== undefined ? result.isAuthorized : settings.isAuthorized),
          overviewSites: Array.isArray(result.overviewSites) ? result.overviewSites : (Array.isArray(settings.overviewSites) ? settings.overviewSites : [])
        };
        console.log('Updated settings:', updatedSettings); // Debug log
        setSettings(updatedSettings);
        setMessage({ type: 'success', text: 'Settings saved successfully!' });
      } else {
        const error = await response.json();
        setMessage({ type: 'error', text: error.error || 'Failed to save settings' });
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      setMessage({ type: 'error', text: 'Failed to save settings. Make sure the backend is running.' });
    } finally {
      setSaving(false);
    }
  };

  const authorizeCredentials = async () => {
    setAuthorizing(true);
    setMessage(null);
    try {
      const response = await fetch('http://localhost:5001/api/authorize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          credentialsPath: settings.credentialsPath
        })
      });

      if (response.ok) {
        const result = await response.json();
        setSettings({ ...settings, isAuthorized: result.authorized || false });
        if (result.authorized) {
          setMessage({ type: 'success', text: 'Credentials authorized successfully! You can now use the dashboard.' });
        } else {
          setMessage({ type: 'error', text: result.message || 'Authorization failed' });
        }
      } else {
        const error = await response.json();
        setMessage({ type: 'error', text: error.error || 'Failed to authorize credentials' });
      }
    } catch (error) {
      console.error('Error authorizing credentials:', error);
      setMessage({ type: 'error', text: 'Failed to authorize credentials. Make sure the backend is running.' });
    } finally {
      setAuthorizing(false);
    }
  };

  const clearAllSettings = async () => {
    if (!confirm('Are you sure you want to clear all credentials and authentication? This will remove your API key, credentials path, and authorized credentials file.')) {
      return;
    }

    setClearing(true);
    setMessage(null);
    try {
      const response = await fetch('http://localhost:5001/api/settings/clear', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (response.ok) {
        const result = await response.json();
        setSettings({
          openaiApiKey: '',
          credentialsPath: '',
          isAuthorized: false,
          overviewSites: []
        });
        
        // Clear all data from DataContext
        clearAllData();
        
        // Clear available sites
        setAvailableSites([]);
        
        setMessage({ type: 'success', text: result.message || 'All credentials and data cleared successfully!' });
        
        // Refresh the page after a short delay to show the cleared state
        setTimeout(() => {
          router.refresh();
        }, 1000);
      } else {
        const error = await response.json();
        setMessage({ type: 'error', text: error.error || 'Failed to clear settings' });
      }
    } catch (error) {
      console.error('Error clearing settings:', error);
      setMessage({ type: 'error', text: 'Failed to clear settings. Make sure the backend is running.' });
    } finally {
      setClearing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-2">Configure your API keys and credentials</p>
      </div>

      {/* Message Display */}
      {message && (
        <div className={`p-4 rounded-lg flex items-center space-x-2 ${
          message.type === 'success' 
            ? 'bg-green-50 text-green-800 border border-green-200' 
            : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          <FontAwesomeIcon 
            icon={message.type === 'success' ? faCheckCircle : faExclamationTriangle} 
            className={message.type === 'success' ? 'text-green-600' : 'text-red-600'}
          />
          <span>{message.text}</span>
        </div>
      )}

      {/* Settings Form */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-6">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <FontAwesomeIcon icon={faSpinner} className="animate-spin text-blue-600 text-2xl" />
            <span className="ml-3 text-gray-600">Loading settings...</span>
          </div>
        ) : (
          <>
            {/* OpenAI API Key */}
            <div className="space-y-2">
              <label htmlFor="openai-key" className="flex items-center space-x-2 text-sm font-medium text-gray-700">
                <FontAwesomeIcon icon={faKey} className="text-gray-500" />
                <span>OpenAI API Key</span>
              </label>
              <div className="relative">
                <input
                  id="openai-key"
                  type={showApiKey ? "text" : "password"}
                  value={settings.openaiApiKey}
                  onChange={(e) => setSettings({ ...settings, openaiApiKey: e.target.value })}
                  placeholder="sk-proj-..."
                  className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  aria-label={showApiKey ? "Hide API key" : "Show API key"}
                >
                  <FontAwesomeIcon icon={showApiKey ? faEyeSlash : faEye} />
                </button>
              </div>
              <p className="text-xs text-gray-500">
                Your OpenAI API key is used to generate insights. Get your key from{' '}
                <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                  OpenAI Platform
                </a>
              </p>
            </div>

            {/* Credentials Path */}
            <div className="space-y-2">
              <label htmlFor="credentials-path" className="flex items-center space-x-2 text-sm font-medium text-gray-700">
                <FontAwesomeIcon icon={faFile} className="text-gray-500" />
                <span>Google Search Console Credentials Path</span>
              </label>
              <input
                id="credentials-path"
                type="text"
                value={settings.credentialsPath}
                onChange={(e) => setSettings({ ...settings, credentialsPath: e.target.value })}
                placeholder="/path/to/client_secret.json"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="text-xs text-gray-500">
                Path to your Google Search Console client_secret.json file. Download it from{' '}
                <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                  Google Cloud Console
                </a>
              </p>
            </div>

            {/* Authorization Status */}
            {settings.isAuthorized && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-center space-x-2">
                <FontAwesomeIcon icon={faCheckCircle} className="text-green-600" />
                <span className="text-green-800 text-sm font-medium">Credentials are authorized and ready to use</span>
              </div>
            )}

            {/* Overview Sites Selection */}
            <div className="space-y-2">
              <label className="flex items-center space-x-2 text-sm font-medium text-gray-700">
                <FontAwesomeIcon icon={faFile} className="text-gray-500" />
                <span>Sites Overview Selection</span>
              </label>
              <p className="text-xs text-gray-500 mb-3">
                Select up to 6 sites to display in the Sites Overview page ({settings.overviewSites.length}/6 selected)
              </p>
              {availableSites.length === 0 ? (
                <div className="border border-gray-300 rounded-lg p-4 bg-gray-50">
                  <p className="text-sm text-gray-600">
                    {settings.isAuthorized 
                      ? "Loading sites..." 
                      : "Please authorize your credentials first to see available sites."}
                  </p>
                </div>
              ) : (
                <>
                  {/* Search/Filter Input */}
                  <div className="mb-3">
                    <input
                      type="text"
                      value={siteSearchFilter}
                      onChange={(e) => setSiteSearchFilter(e.target.value)}
                      placeholder="Search sites (e.g., a.com)..."
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  
                  {/* Filtered Sites List */}
                  <div className="border border-gray-300 rounded-lg p-4 max-h-64 overflow-y-auto">
                    {availableSites
                      .filter(site => 
                        site.toLowerCase().includes(siteSearchFilter.toLowerCase())
                      )
                      .length === 0 ? (
                        <p className="text-sm text-gray-500 text-center py-4">
                          No sites found matching "{siteSearchFilter}"
                        </p>
                      ) : (
                        availableSites
                          .filter(site => 
                            site.toLowerCase().includes(siteSearchFilter.toLowerCase())
                          )
                          .map((site) => {
                            const isSelected = settings.overviewSites.includes(site);
                            const canSelect = isSelected || settings.overviewSites.length < 6;
                            
                            return (
                              <label
                                key={site}
                                className={`flex items-center space-x-2 p-2 rounded hover:bg-gray-50 cursor-pointer ${
                                  !canSelect ? 'opacity-50 cursor-not-allowed' : ''
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  disabled={!canSelect}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      if (settings.overviewSites.length < 6) {
                                        setSettings({
                                          ...settings,
                                          overviewSites: [...settings.overviewSites, site]
                                        });
                                      }
                                    } else {
                                      setSettings({
                                        ...settings,
                                        overviewSites: settings.overviewSites.filter(s => s !== site)
                                      });
                                    }
                                  }}
                                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                />
                                <span className="text-sm text-gray-700">{site}</span>
                              </label>
                            );
                          })
                      )}
                  </div>
                  {settings.overviewSites.length === 6 && (
                    <p className="text-xs text-yellow-600 mt-2">
                      Maximum of 6 sites selected. Unselect a site to choose a different one.
                    </p>
                  )}
                </>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center space-x-3 pt-4 border-t border-gray-200">
              <button
                onClick={saveSettings}
                disabled={saving}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {saving && <FontAwesomeIcon icon={faSpinner} className="animate-spin" />}
                <span>{saving ? 'Saving...' : 'Save Settings'}</span>
              </button>

              <button
                onClick={authorizeCredentials}
                disabled={authorizing || !settings.credentialsPath}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {authorizing && <FontAwesomeIcon icon={faSpinner} className="animate-spin" />}
                <span>{authorizing ? 'Authorizing...' : 'Authorize Credentials'}</span>
              </button>

              <button
                onClick={loadSettings}
                disabled={loading}
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:bg-gray-100 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {loading && <FontAwesomeIcon icon={faSpinner} className="animate-spin" />}
                <span>Refresh</span>
              </button>

              <button
                onClick={clearAllSettings}
                disabled={clearing}
                className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {clearing && <FontAwesomeIcon icon={faSpinner} className="animate-spin" />}
                <FontAwesomeIcon icon={faTrash} />
                <span>{clearing ? 'Clearing...' : 'Clear All'}</span>
              </button>
            </div>
          </>
        )}
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-blue-900 mb-3">Setup Instructions</h2>
        <ol className="list-decimal list-inside space-y-2 text-sm text-blue-800">
          <li>Get your OpenAI API key from the OpenAI Platform and paste it above</li>
          <li>Download your Google Search Console credentials (client_secret.json) from Google Cloud Console</li>
          <li>Enter the full path to your client_secret.json file</li>
          <li>Click "Save Settings" to save your configuration</li>
          <li>Click "Authorize Credentials" to authenticate with Google (this will open a browser window)</li>
          <li>Once authorized, you can start using the dashboard!</li>
        </ol>
      </div>
    </div>
  );
}

