'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faKey, faFile, faCheckCircle, faExclamationTriangle, faSpinner, faEye, faEyeSlash, faTrash, faServer, faNetworkWired, faRefresh, faQuestionCircle, faUndo, faChevronDown } from '@fortawesome/free-solid-svg-icons';
import { useData } from '@/contexts/DataContext';
import ModelSelector from './model-selector';

interface SettingsData {
  openaiApiKey: string;
  credentialsPath: string;
  trendsCredentialsPath: string;
  isAuthorized: boolean;
  overviewSites: string[];
  aiProvider: 'openai' | 'local_llm';
  lmStudioHost: string;
  lmStudioModel: string;
  // Expert Settings
  systemPrompt?: string;
  contextLength?: number;
  gpuOffload?: string;
  temperature?: number;
  topK?: number;
  topP?: number;
  minP?: number;
  repeatPenalty?: number;
  presencePenalty?: number;
}

export default function SettingsPage() {
  //   const client = new LMStudioClient();

  //   useEffect(() => {
  //   const getModels = async () => {
  //     try{
  //       const models = await client.system.listDownloadedModels();
  //       return models;
  //     }catch(e){
  //       console.error(e);
  //       return [];
  //     }
  //   }
  //   getModels();
  // }, []);
// const handleModelChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
//   const model = e.target.value;
//   setSettings({ ...settings, lmStudioModel: model });
// };
  const router = useRouter();
  const { clearAllData } = useData();
  const [settings, setSettings] = useState<SettingsData>({
    openaiApiKey: '',
    credentialsPath: '',
    trendsCredentialsPath: '',
    isAuthorized: false,
    overviewSites: [],
    aiProvider: 'openai',
    lmStudioHost: 'http://localhost:1234',
    lmStudioModel: '',
    systemPrompt: '',
    contextLength: 8192,
    gpuOffload: 'max',
    temperature: 0.8,
    topK: 40,
    topP: 0.95,
    minP: 0.05,
    repeatPenalty: 1.1,
    presencePenalty: 0.0
  });

  const [availableSites, setAvailableSites] = useState<string[]>([]);
  const [lmStudioModels, setLmStudioModels] = useState<string[]>([]);
  const [lmStudioOnline, setLmStudioOnline] = useState<boolean>(false);
  const [loadingModels, setLoadingModels] = useState<boolean>(false);
  
  type ModelLoadStatus = 'idle' | 'unloading' | 'loading' | 'loaded' | 'error';
  const [modelLoadStatus, setModelLoadStatus] = useState<ModelLoadStatus>('idle');
  
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
          trendsCredentialsPath: String(data.trendsCredentialsPath || ''),
          isAuthorized: Boolean(data.isAuthorized || false),
          overviewSites: Array.isArray(data.overviewSites) ? data.overviewSites : [],
          aiProvider: data.aiProvider === 'local_llm' ? 'local_llm' : 'openai',
          lmStudioHost: String(data.lmStudioHost || 'http://localhost:1234'),
          lmStudioModel: String(data.lmStudioModel || ''),
          systemPrompt: String(data.systemPrompt || ''),
          contextLength: Number(data.contextLength || 8192),
          gpuOffload: String(data.gpuOffload || 'max'),
          temperature: Number(data.temperature ?? 0.8),
          topK: Number(data.topK || 40),
          topP: Number(data.topP ?? 0.95),
          minP: Number(data.minP ?? 0.05),
          repeatPenalty: Number(data.repeatPenalty ?? 1.1),
          presencePenalty: Number(data.presencePenalty ?? 0.0)
        });
        
        // Load LM Studio models if local_llm is configured or selected
        fetchLMStudioModels();
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

  const resetExpertSettings = () => {
    if (confirm('Are you sure you want to reset all expert settings back to their defaults?')) {
      setSettings(prev => ({
        ...prev,
        systemPrompt: '',
        contextLength: 8192,
        gpuOffload: 'max',
        temperature: 0.8,
        topK: 40,
        topP: 0.95,
        minP: 0.05,
        repeatPenalty: 1.1,
        presencePenalty: 0.0
      }));
    }
  };

  const fetchLMStudioModels = async () => {
    setLoadingModels(true);
    try {
      const response = await fetch('http://localhost:5001/api/lmstudio/models');
      if (response.ok) {
        const data = await response.json();
        setLmStudioOnline(data.online || false);
        setLmStudioModels(data.models || []);
      }
    } catch (error) {
      console.error('Error fetching LM Studio models:', error);
      setLmStudioOnline(false);
    } finally {
      setLoadingModels(false);
    }
  };

  const handleModelChange = async (newModel: string) => {
    const oldModel = settings.lmStudioModel;
    
    // Update local state immediately so UI feels responsive
    setSettings({ ...settings, lmStudioModel: newModel });
    
    if (!newModel) {
      setModelLoadStatus('idle');
      return;
    }

    // Attempt to unload the previous model
    if (oldModel && oldModel !== newModel) {
      setModelLoadStatus('unloading');
      try {
        await fetch('http://localhost:5001/api/lmstudio/unload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ model: oldModel })
        });
      } catch (err) {
        console.error("Failed to unload previous model", err);
      }
    }

    // Attempt to load the new model
    setModelLoadStatus('loading');
    try {
      const resp = await fetch('http://localhost:5001/api/lmstudio/load', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: newModel })
      });
      if (resp.ok) {
        setModelLoadStatus('loaded');
      } else {
        setModelLoadStatus('error');
      }
    } catch (err) {
      console.error("Failed to load new model", err);
      setModelLoadStatus('error');
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
          trendsCredentialsPath: settings.trendsCredentialsPath,
          overviewSites: settings.overviewSites,
          aiProvider: settings.aiProvider,
          lmStudioHost: settings.lmStudioHost,
          lmStudioModel: settings.lmStudioModel
        })
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Save response from backend:', result); // Debug log
        console.log('Current settings before update:', settings); // Debug log
        // Update settings with the saved values returned from backend
        // Always use the values from the response if they exist, otherwise keep current settings
        // Always use the values from the backend response, ensuring they're strings
        const updatedSettings: SettingsData = {
          openaiApiKey: String(result.openaiApiKey !== undefined && result.openaiApiKey !== null ? result.openaiApiKey : settings.openaiApiKey || ''),
          credentialsPath: String(result.credentialsPath !== undefined && result.credentialsPath !== null ? result.credentialsPath : settings.credentialsPath || ''),
          trendsCredentialsPath: String(result.trendsCredentialsPath !== undefined && result.trendsCredentialsPath !== null ? result.trendsCredentialsPath : settings.trendsCredentialsPath || ''),
          isAuthorized: Boolean(result.isAuthorized !== undefined ? result.isAuthorized : settings.isAuthorized),
          overviewSites: Array.isArray(result.overviewSites) ? result.overviewSites : (Array.isArray(settings.overviewSites) ? settings.overviewSites : []),
          aiProvider: result.aiProvider === 'local_llm' ? 'local_llm' : 'openai',
          lmStudioHost: String(result.lmStudioHost !== undefined && result.lmStudioHost !== null ? result.lmStudioHost : settings.lmStudioHost || 'http://localhost:1234'),
          lmStudioModel: String(result.lmStudioModel !== undefined && result.lmStudioModel !== null ? result.lmStudioModel : settings.lmStudioModel || '')
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
          trendsCredentialsPath: '',
          isAuthorized: false,
          overviewSites: [],
          aiProvider: 'openai',
          lmStudioHost: 'http://localhost:1234',
          lmStudioModel: ''
        });
        
        // Clear all data from DataContext
        clearAllData();
        
        // Clear available sites
        setAvailableSites([]);
        setLmStudioModels([]);
        setLmStudioOnline(false);
        
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
            {/* AI Provider Selection */}
            <div className="space-y-4 border border-gray-200 rounded-lg p-4 bg-gray-50">
              <div className="space-y-2">
                <label className="flex items-center space-x-2 text-sm font-medium text-gray-700">
                  <FontAwesomeIcon icon={faServer} className="text-gray-500" />
                  <span>AI Analysis Provider</span>
                </label>
                <select
                  value={settings.aiProvider}
                  onChange={(e) => setSettings({ ...settings, aiProvider: e.target.value as 'openai' | 'local_llm' })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                >
                  <option value="openai">OpenAI (Cloud)</option>
                  <option value="local_llm">Local LLM (LM Studio)</option>
                </select>
                <p className="text-xs text-gray-500">
                  Choose which AI provider to use for generating insights across the dashboard.
                </p>
              </div>

              {/* Local LLM Settings */}
              {settings.aiProvider === 'local_llm' && (
                <div className="space-y-4 pt-3 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium text-gray-900 flex items-center space-x-2">
                      <FontAwesomeIcon icon={faNetworkWired} className="text-blue-500" />
                      <span>LM Studio Configuration</span>
                    </h3>
                    {lmStudioOnline ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <span className="w-2 h-2 mr-1.5 bg-green-500 rounded-full"></span>
                        Online
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        <span className="w-2 h-2 mr-1.5 bg-red-500 rounded-full"></span>
                        Offline
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-gray-700">Server URL</label>
                      <input
                        type="text"
                        value={settings.lmStudioHost}
                        onChange={(e) => setSettings({ ...settings, lmStudioHost: e.target.value })}
                        placeholder="http://localhost:1234"
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <label className="text-xs font-medium text-gray-700">Model Selection</label>
                          {modelLoadStatus === 'unloading' && (
                            <span className="flex items-center text-[10px] text-red-600 font-medium">
                              <span className="w-2 h-2 mr-1 bg-red-500 rounded-full animate-pulse"></span>
                              <FontAwesomeIcon icon={faRefresh} className="animate-spin mr-1" /> Unloading...
                            </span>
                          )}
                          {modelLoadStatus === 'loading' && (
                            <span className="flex items-center text-[10px] text-yellow-600 font-medium">
                              <span className="w-2 h-2 mr-1 bg-yellow-500 rounded-full animate-pulse"></span>
                              <FontAwesomeIcon icon={faRefresh} className="animate-spin mr-1" /> Loading...
                            </span>
                          )}
                          {modelLoadStatus === 'loaded' && (
                            <span className="flex items-center text-[10px] text-green-600 font-medium">
                              <span className="w-2 h-2 mr-1 bg-green-500 rounded-full"></span>
                              <FontAwesomeIcon icon={faCheckCircle} className="mr-1" /> Loaded
                            </span>
                          )}
                          {modelLoadStatus === 'error' && (
                            <span className="flex items-center text-[10px] text-red-600 font-medium" title="Failed to load model. Check LM Studio logs.">
                              <FontAwesomeIcon icon={faExclamationTriangle} className="mr-1" /> Error
                            </span>
                          )}
                        </div>
                        <button 
                          onClick={fetchLMStudioModels}
                          type="button"
                          disabled={loadingModels}
                          className="text-xs text-blue-600 hover:text-blue-800 flex items-center space-x-1"
                        >
                          <FontAwesomeIcon icon={faRefresh} className={loadingModels ? "animate-spin" : ""} />
                          <span>Refresh List</span>
                        </button>
                      </div>
                      <ModelSelector
                        options={lmStudioModels.map(model => ({ id: model, name: model, object: 'model', owned_by: 'LM Studio' }))}
                        value={settings.lmStudioModel}
                        onChange={(value) => handleModelChange(value)}
                        disabled={!lmStudioOnline && lmStudioModels.length === 0}
                        className="w-full"
                      />
                    </div>
                  </div>
                  {!lmStudioOnline && (
                    <p className="text-xs text-amber-600 bg-amber-50 p-2 rounded border border-amber-200">
                      Could not connect to LM Studio. Make sure it is running, the local server is started, and the Server URL is correct.
                    </p>
                  )}

                  {/* Expert Level Settings Accordion */}
                  <details className="mt-6 group border border-gray-200 rounded-lg overflow-hidden bg-white">
                    <summary className="px-4 py-3 bg-gray-50 text-sm font-medium text-gray-700 cursor-pointer hover:bg-gray-100 flex items-center justify-between select-none">
                      <div className="flex items-center space-x-2">
                        <FontAwesomeIcon icon={faServer} className="text-gray-400" />
                        <span>Expert Level Settings</span>
                      </div>
                      <FontAwesomeIcon icon={faChevronDown} className="text-gray-400 group-open:rotate-180 transition-transform duration-200" />
                    </summary>
                    <div className="p-4 border-t border-gray-200 space-y-6">
                      <div className="bg-amber-50 border border-amber-200 rounded p-3 text-xs text-amber-800 flex items-start">
                        <FontAwesomeIcon icon={faExclamationTriangle} className="text-amber-500 mt-0.5 mr-2" />
                        <p>
                          <strong>Warning:</strong> Modifying these settings can drastically alter the AI's behavior, performance, and output quality. 
                          Only adjust these if you are familiar with LLM inference parameters.
                        </p>
                      </div>

                      <div className="space-y-4">
                        {/* System Prompt */}
                        <div className="space-y-1">
                          <label className="flex items-center text-xs font-medium text-gray-700">
                            Custom System Prompt Persona
                            <FontAwesomeIcon icon={faQuestionCircle} className="ml-1.5 text-gray-400 cursor-help" title="This prompt is injected before the dashboard's built-in SEO instructions to act as a persona or strictly enforce formatting rules." />
                          </label>
                          <textarea
                            value={settings.systemPrompt}
                            onChange={(e) => setSettings({ ...settings, systemPrompt: e.target.value })}
                            placeholder="e.g. Act as a ruthless marketing executive..."
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white min-h-[80px]"
                          />
                        </div>

                        {/* Grid for Hardware / Load params */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <label className="flex items-center text-xs font-medium text-gray-700">
                              Context Length
                              <FontAwesomeIcon icon={faQuestionCircle} className="ml-1.5 text-gray-400 cursor-help" title="Maximum number of tokens the model can process at once (input + output). Higher values use more RAM." />
                            </label>
                            <input
                              type="number"
                              min="512"
                              step="512"
                              value={settings.contextLength}
                              onChange={(e) => setSettings({ ...settings, contextLength: parseInt(e.target.value) || 8192 })}
                              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="flex items-center text-xs font-medium text-gray-700">
                              GPU Offload
                              <FontAwesomeIcon icon={faQuestionCircle} className="ml-1.5 text-gray-400 cursor-help" title="Number of layers to offload to GPU, or 'max' to offload all possible layers. Use 'max' for best performance." />
                            </label>
                            <input
                              type="text"
                              value={settings.gpuOffload}
                              onChange={(e) => setSettings({ ...settings, gpuOffload: e.target.value })}
                              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white"
                            />
                          </div>
                        </div>

                        <hr className="border-gray-200" />

                        {/* Sliders for Inference */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                          {/* Temperature */}
                          <div className="space-y-2">
                            <div className="flex justify-between items-center">
                              <label className="flex items-center text-xs font-medium text-gray-700">
                                Temperature
                                <FontAwesomeIcon icon={faQuestionCircle} className="ml-1.5 text-gray-400 cursor-help" title="Controls randomness. Lower values make output more focused and deterministic, higher values make it more creative." />
                              </label>
                              <span className="text-xs text-gray-500 font-mono">{settings.temperature}</span>
                            </div>
                            <input
                              type="range"
                              min="0" max="2" step="0.05"
                              value={settings.temperature}
                              onChange={(e) => setSettings({ ...settings, temperature: parseFloat(e.target.value) })}
                              className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                            />
                          </div>

                          {/* Top P */}
                          <div className="space-y-2">
                            <div className="flex justify-between items-center">
                              <label className="flex items-center text-xs font-medium text-gray-700">
                                Top P Sampling
                                <FontAwesomeIcon icon={faQuestionCircle} className="ml-1.5 text-gray-400 cursor-help" title="Nucleus sampling. Limits token choices to a percentage of total probability mass. 1.0 means no limit." />
                              </label>
                              <span className="text-xs text-gray-500 font-mono">{settings.topP}</span>
                            </div>
                            <input
                              type="range"
                              min="0" max="1" step="0.01"
                              value={settings.topP}
                              onChange={(e) => setSettings({ ...settings, topP: parseFloat(e.target.value) })}
                              className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                            />
                          </div>

                          {/* Min P */}
                          <div className="space-y-2">
                            <div className="flex justify-between items-center">
                              <label className="flex items-center text-xs font-medium text-gray-700">
                                Min P Sampling
                                <FontAwesomeIcon icon={faQuestionCircle} className="ml-1.5 text-gray-400 cursor-help" title="Sets a minimum probability threshold relative to the most likely token. Helps prevent outputting nonsense tokens." />
                              </label>
                              <span className="text-xs text-gray-500 font-mono">{settings.minP}</span>
                            </div>
                            <input
                              type="range"
                              min="0" max="1" step="0.01"
                              value={settings.minP}
                              onChange={(e) => setSettings({ ...settings, minP: parseFloat(e.target.value) })}
                              className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                            />
                          </div>

                          {/* Top K */}
                          <div className="space-y-2">
                            <div className="flex justify-between items-center">
                              <label className="flex items-center text-xs font-medium text-gray-700">
                                Top K Sampling
                                <FontAwesomeIcon icon={faQuestionCircle} className="ml-1.5 text-gray-400 cursor-help" title="Limits token choices to the top K most likely tokens. A value of 0 or -1 typically disables it." />
                              </label>
                              <input
                                type="number"
                                min="-1"
                                value={settings.topK}
                                onChange={(e) => setSettings({ ...settings, topK: parseInt(e.target.value) })}
                                className="w-20 px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 bg-white"
                              />
                            </div>
                          </div>

                          {/* Repeat Penalty */}
                          <div className="space-y-2">
                            <div className="flex justify-between items-center">
                              <label className="flex items-center text-xs font-medium text-gray-700">
                                Repeat Penalty
                                <FontAwesomeIcon icon={faQuestionCircle} className="ml-1.5 text-gray-400 cursor-help" title="Penalizes tokens that have already appeared. 1.0 means no penalty. Higher values reduce repetition." />
                              </label>
                              <span className="text-xs text-gray-500 font-mono">{settings.repeatPenalty}</span>
                            </div>
                            <input
                              type="range"
                              min="1" max="2" step="0.05"
                              value={settings.repeatPenalty}
                              onChange={(e) => setSettings({ ...settings, repeatPenalty: parseFloat(e.target.value) })}
                              className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                            />
                          </div>

                          {/* Presence Penalty */}
                          <div className="space-y-2">
                            <div className="flex justify-between items-center">
                              <label className="flex items-center text-xs font-medium text-gray-700">
                                Presence Penalty
                                <FontAwesomeIcon icon={faQuestionCircle} className="ml-1.5 text-gray-400 cursor-help" title="Penalizes tokens based on whether they've appeared at all. Increases likelihood of bringing up new topics." />
                              </label>
                              <span className="text-xs text-gray-500 font-mono">{settings.presencePenalty}</span>
                            </div>
                            <input
                              type="range"
                              min="-2" max="2" step="0.1"
                              value={settings.presencePenalty}
                              onChange={(e) => setSettings({ ...settings, presencePenalty: parseFloat(e.target.value) })}
                              className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-end pt-4 border-t border-gray-100 mt-6">
                        <button
                          type="button"
                          onClick={resetExpertSettings}
                          className="flex items-center text-xs font-medium text-gray-500 hover:text-gray-700 bg-white border border-gray-200 px-3 py-1.5 rounded-md hover:bg-gray-50 transition-colors"
                        >
                          <FontAwesomeIcon icon={faUndo} className="mr-1.5" />
                          Reset to Defaults
                        </button>
                      </div>
                    </div>
                  </details>
                </div>
              )}
            </div>

            {/* OpenAI API Key */}
            <div className={`space-y-2 transition-opacity duration-200 ${settings.aiProvider === 'local_llm' ? 'opacity-50' : ''}`}>
              <label htmlFor="openai-key" className="flex items-center space-x-2 text-sm font-medium text-gray-700">
                <FontAwesomeIcon icon={faKey} className="text-gray-500" />
                <span>OpenAI API Key {settings.aiProvider === 'local_llm' && <span className="text-xs font-normal text-gray-500">(Not required for Local LLM)</span>}</span>
              </label>
              <div className="relative">
                <input
                  id="openai-key"
                  type={showApiKey ? "text" : "password"}
                  value={settings.openaiApiKey}
                  onChange={(e) => setSettings({ ...settings, openaiApiKey: e.target.value })}
                  placeholder="sk-proj-..."
                  disabled={settings.aiProvider === 'local_llm'}
                  className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
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

            {/* Google Trends Credentials Path */}
            <div className="space-y-2">
              <label htmlFor="trends-credentials-path" className="flex items-center space-x-2 text-sm font-medium text-gray-700">
                <FontAwesomeIcon icon={faFile} className="text-gray-500" />
                <span>Google Trends Credentials Path</span>
              </label>
              <input
                id="trends-credentials-path"
                type="text"
                value={settings.trendsCredentialsPath}
                onChange={(e) => setSettings({ ...settings, trendsCredentialsPath: e.target.value })}
                placeholder="/path/to/trends_client_secret.json"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="text-xs text-gray-500">
                Path to your Google Trends OAuth client_secret.json. Must have the <code>searchtrends</code> scope enabled in Google Cloud Console.
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
          <li>Choose your AI Provider: OpenAI or Local LLM (LM Studio).</li>
          <li>If using OpenAI, enter your API key. If using LM Studio, ensure the server is running and a model is loaded.</li>
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

