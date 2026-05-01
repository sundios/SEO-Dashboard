'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faKey, faFile, faCheckCircle, faExclamationTriangle, faSpinner, faEye, faEyeSlash, faTrash, faServer, faNetworkWired, faRefresh, faCircleXmark, faMicrochip } from '@fortawesome/free-solid-svg-icons';
import { useData } from '@/contexts/DataContext';
import ModelSelector from './model-selector';
import { LMStudioClient } from "@lmstudio/sdk";
import { Button } from "@/components/ui/button";
// import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useLocalStorage } from "@/hooks/use-local-storage";
// import { Slider } from "@/components/ui/slider";
// import { Badge } from "@/components/ui/badge";
import { Toaster, toast as toastNotification } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface SettingsData {
  openaiApiKey: string;
  credentialsPath: string;
  trendsCredentialsPath: string;
  isAuthorized: boolean;
  overviewSites: string[];
  aiProvider: 'openai' | 'local_llm';
  lmStudioHost: string;
  lmStudioModel: string;
}

interface ModelSettings {
  contextLength: number;
  temperature: number;
  ttl: number;
  gpu: number,
}

const defaultModelSettings: ModelSettings = {
  contextLength: 2048,
  temperature: 0.7,
  ttl: 300, // 5 min
  gpu: 0.5,
};

type ConnectionStatus =
  | "disconnected"
  | "connecting"
  | "disconnecting"
  | "connected"
  | "error";

interface ProcessResult {
  processId: string;
  status: "success" | "error";
  data?: any;
  error?: string;
  timestamp: string;
}

export default function SettingsPage() {
    const [serverUrl, setServerUrl] = useState("http://localhost:1234");
  const [status, setStatus] = useState<ConnectionStatus>("disconnected");
  const [modelInfo, setModelInfo] = useState<{
    name: string;
    format?: string;
    size?: number;
    identifier?: string;
  } | null>(null);
  const [statusMessage, setStatusMessage] = useState(
    "Not connected to LM Studio."
  );
  const [models, setModels] = useState<any[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>("");
  const [isModelLoading, setIsModelLoading] = useState(false);
  const [activeModelName, setActiveModelName] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isDark, setIsDark] = useState(true);
  const [isUnloading, setIsUnloading] = useState(false);

  const [mounted, setMounted] = useState(false);
  const [lastResult, setLastResult] = useState<ProcessResult | null>(null);
  // const [progress, setProgress] = useState<TaskProgress | null>(null);
  const [runningProcess, setRunningProcess] = useState<string | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  const [modelSettings, setModelSettings] = useState({
    serverUrl: "http://localhost:1234",
    contextLength: 2048,
    temperature: 0.7,
    ttl: 300, // 5 min
    gpu: 0.5,
    lmStudioModel: "",
    modelSettings: { contextLength: 2048, temperature: 0.7, ttl: 300, gpu: 0.5 },
  });

  const client = new LMStudioClient();

    // useEffect(() => {
    const getModels = async () => {
      try{
        const models = await client.system.listDownloadedModels();
        return models;
      }catch(e){
        console.error(e);
        return [];
      }
    }
    // getModels();

  // }, []);
  const myModels = getModels();
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
    lmStudioModel: ''
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

  const addToLocalStorage = (key: string, value: any) => {
  localStorage.setItem(key, JSON.stringify(value));
};
const isItemInLocalStorage = (key: string) => {
  return localStorage.getItem(key) !== null;
};
const getFromLocalStorage = (key: string) => {
  const item = localStorage.getItem(key);
  return item ? JSON.parse(item) : null;
};
const removeFromLocalStorage = (key: string) => {
  localStorage.removeItem(key);
};

  // --- CONNECTION & MODEL HANDLERS ---
  const handleCheckConnection = async (url: string) => {
    setStatus("connecting");
    setStatusMessage("Pinging server...");
    try {
      const httpUrl = url
        .replace("ws://", "http://")
        .replace("wss://", "https://");
      const response = await fetch(`${httpUrl}/v1/models`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      setServerUrl(url);
      setStatus("connected");
      setStatusMessage("Server found. Checking model status...");
      await handleGetModels(url);
      await addToLocalStorage('lmStudioServerUrl', url);
    } catch (e: any) {
      console.error("Connection error:", e);
      setStatus("error");
      setStatusMessage(
        `Connection failed: ${e.message}\n\nMake sure:\n1. LM Studio is running\n2. Server is enabled in LM Studio settings\n3. The port is correct (${url})`
      );
    }
  };

  const handleGetModels = async (url: string) => {
    try {
      console.log("Fetching models from:", url);
      const httpUrl = url
        .replace("ws://", "http://")
        .replace("wss://", "https://");
      console.log("Using HTTP URL for models:", httpUrl);
      const response = await fetch(`${httpUrl}/v1/models`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      const models = Array.isArray(data) ? data : data.data || [];
      if (models.length > 0) {
        const formattedModels = models.map(
          (model: { id?: string; name?: string }, index: number) => {
            const fallbackId = `model-${index}`;
            const modelId = model.id ?? model.name ?? fallbackId;
            const modelName = model.name ?? model.id ?? `Model ${index + 1}`;
            return {
              ...model,
              id: modelId,
              name: modelName,
            };
          }
        );
        setModels(formattedModels);
        setStatus("connected");
        setStatusMessage(
          `Found ${formattedModels.length} models. Select one to load.`
        );
      } else {
        setStatus("error");
        setStatusMessage(
          "Connected but no models found. Please load a model in LM Studio."
        );
      }
    } catch (e: any) {
      console.error("Error getting models:", e);
      setStatus("error");
      setStatusMessage(`Failed to get models: ${e.message}`);
    }
  };

  const handleLoadModel = async () => {
    if (!selectedModel) {
      toastNotification.error("Please select a model first.");
      return;
    }
    setIsModelLoading(true);
    setStatus("connecting");
    const displayName = selectedModel.split(/[/\\]/).pop() || selectedModel;
    setStatusMessage(`Loading ${displayName}...`);
    try {
      const response = await addToLocalStorage("loadedModel", {
        serverUrl,
        modelName: selectedModel,
      });
      if (response !== null) {
        await addToLocalStorage('lmStudioServerUrl', serverUrl);
        await new Promise((resolve) => setTimeout(resolve, 500));
        const modelInfo = await getFromLocalStorage("loadedModel");
        if (modelInfo?.isLoaded || modelInfo?.modelName) {
          setActiveModelName(selectedModel);
          setStatus("connected");
          setStatusMessage(
            `Connected to: ${modelInfo.modelName || displayName}`
          );
          toastNotification.success("Model loaded successfully!");
        } else {
          console.warn(
            "Model loaded but status check was inconclusive:",
            modelInfo
          );
          setActiveModelName(selectedModel);
          setStatus("connected");
          setStatusMessage(`Connected to: ${displayName}`);
          toastNotification.success("Model loaded successfully!");
        }
      } else {
        throw new Error(response || "Failed to load model");
      }
    } catch (e: any) {
      console.error("handleLoadModel error:", e);
      setStatus("error");
      const errorMsg = e.message || "Failed to load model";
      setStatusMessage(`Error: ${errorMsg}`);
      toastNotification.error("Failed to load model", {
        description: errorMsg,
      });
    } finally {
      setIsModelLoading(false);
    }
  };

  // --- CLEANUP: Kept the one, working unload function ---
  const unloadCurrentModel = async () => {
    if (!activeModelName && !modelInfo?.identifier) {
      console.log("No active model to unload");
      toastNotification.error("No active model to unload");
      return;
    }
    setIsUnloading(true);
    setStatus("disconnecting");
    try {
      const response = await addToLocalStorage("unloadModel", {} as any); // Sends empty body
      if (response !== null) {
        setActiveModelName(null);
        setModelInfo(null);
        setSelectedModel("");
        setStatusMessage("Model unloaded successfully");
        toastNotification.success("Model unloaded successfully!");
        setStatus("disconnected");
        // Refresh the models list
        await handleGetModels(serverUrl);
      } else {
        throw new Error(response || "Failed to unload model");
      }
    } catch (e: any) {
      console.error("unloadCurrentModel error:", e);
      setStatus("error");
      const errorMsg = e.message || "Failed to unload model";
      setStatusMessage(`Error: ${errorMsg}`);
      toastNotification.error("Failed to unload model", {
        description: errorMsg,
      });
    } finally {
      setIsUnloading(false);
    }
  };

  // --- LOAD/UNLOAD SETTINGS MANAGEMENT ---
  const updateSettingsFromModel = (currentServerUrl: string) => {
    if (currentServerUrl) {
      const newSettings = {
        ...modelSettings,
        serverUrl: currentServerUrl,
        status: status as ConnectionStatus,
        models: models,
        selectedModel,
        statusMessage,
        activeModelName,
      };
      try {
        addToLocalStorage('modelSettings', newSettings);
        console.log("Saved model settings to sync storage");
      } catch (err) {
        console.error("Error saving model settings:", err);
      }
    }
  };

  const handleSaveModelSettings = () => {
    if (!selectedModel) {
      toastNotification.error("Please select a model to save settings for.");
      return;
    }
    const updatedSettings = {
      ...modelSettings,
      serverUrl,
      modelName: selectedModel,
    };
    addToLocalStorage('modelSettings', updatedSettings);
    toastNotification.success(
        "Model settings saved successfully! (Server: " +
          updatedSettings.serverUrl +
          ")"
      );
  };

  const handleLoadModelSettings = async () => {
    try {
      const savedData = await getFromLocalStorage("modelSettings");
      if (savedData.modelSettings) {
        const { serverUrl, modelName, contextLength, temperature, ttl, gpu } =
          savedData.modelSettings;
        if (serverUrl) {
          setServerUrl(serverUrl);
          // Don't auto-select/load model here - user should explicitly load
          if (modelName) {
            const matches = models.filter((m) => m.id === modelName);
            if (matches.length > 0) {
              setSelectedModel(modelName);
            }
          }
          // Update local state
          setModelSettings((prev) => ({
            ...prev,
            serverUrl,
            modelName: modelName || "",
            contextLength: contextLength || 2048,
            temperature: temperature || 0.7,
            ttl: ttl || 300,
            gpu: gpu || 0.5,
          }));
          toastNotification.success(
            `Settings loaded. Model: ${modelName || "None"}`
          );
        }
      }
    } catch (e) {
      console.error("Error loading model settings:", e);
    }
  };

  const handleUnloadSettings = () => {
    // We already unload the model, just clear the settings
    removeFromLocalStorage('modelSettings');
    toastNotification.success("Model settings cleared");
    // Reset local state
    setModelSettings((prev) => ({
      ...prev,
      serverUrl: "http://localhost:1234",
        modelName: "",
      }));
  };

  // Load model settings from storage on mount
  useEffect(() => {
    handleLoadModelSettings();
  }, []);

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
          lmStudioModel: String(data.lmStudioModel || '')
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

  const handleModelChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newModel = e.target.value;
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
                  options={models}
                  value={selectedModel}
                  onChange={setSelectedModel}
                  disabled={models.length === 0 || status === "connecting"}
                  placeholder={
                    models.length === 0
                      ? "No models available"
                      : "Select a model"
                  }
                  className="w-full"
                />
                {/* --- FIX: Use unloadCurrentModel --- */}
                {activeModelName ? (
                  <Button
                    onClick={unloadCurrentModel} // <-- Use the correct handler
                    disabled={isUnloading || status === "connecting"}
                    variant="destructive"
                  >
                    {isUnloading ? (
                      <FontAwesomeIcon icon={faRefresh}  className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <FontAwesomeIcon icon={faCircleXmark} className="w-4 h-4 mr-2" />
                    )}
                    Unload
                  </Button>
                ) : (
                  <Button
                    onClick={handleLoadModel}
                    disabled={
                      // !selectedModel ||
                      isModelLoading ||
                      status === "connecting"
                    }
                  >
                    {isModelLoading ? (
                      <FontAwesomeIcon icon={faRefresh} className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <FontAwesomeIcon icon={faMicrochip} className="w-4 h-4 mr-2" />
                    )}
                    Load
                  </Button>
                )}
                  <Select
                    value={activeModelName || ""}
                    onValueChange={(value) => {
                      if (value) {
                        setSelectedModel(value);
                      }
                    }}
                    // disabled={models.length === 0 || status === "connecting"}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a model..." />
                    </SelectTrigger>
                    <SelectContent>
                      {lmStudioModels.map((model) => (
                        <SelectItem key={model} value={model}>
                          {model}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                {/* <select
                        value={activeModelName || ""}
                        onChange={(e) => {
                          if (e.target.value) {
                            setSelectedModel(e.target.value);
                          }
                        }}
                        disabled={models.length === 0 || status === "connecting"}
                      >
                        <option value="">Select a model...</option>
                        {lmStudioModels.map((model) => (
                          <option key={model} value={model}>{model}</option>
                        ))}
                      </select> */}
                    </div>
                  </div>
                  {!lmStudioOnline && (
                    <p className="text-xs text-amber-600 bg-amber-50 p-2 rounded border border-amber-200">
                      Could not connect to LM Studio. Make sure it is running, the local server is started, and the Server URL is correct.
                    </p>
                  )}
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

const Loader2 = (className: string) => {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <svg width="800px" height="800px" viewBox="0 0 64 64" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" xmlSpace="preserve" style={{ fillRule: "evenodd", clipRule: "evenodd", strokeLinejoin: "round", strokeMiterlimit: 2 }}>
        <rect id="Icons" x="-1024" y="-64" width="1280" height="800" style={{ fill: "none" }} />
        <g id="Icons1"> <g id="Strike">
          </g>
          <g id="H1">
          </g>
          <g id="H2">
          </g>
          <g id="H3">
          </g>
          <g id="list-ul">
          </g>
          <g id="hamburger-1">
          </g>
          <g id="hamburger-2">
          </g>
          <g id="list-ol">
          </g>
          <g id="list-task">
          </g>
          <g id="trash">
          </g>
          <g id="vertical-menu">
          </g>
          <g id="horizontal-menu">
          </g>
          <g id="sidebar-2">
          </g>
          <g id="Pen">
          </g>
          <g id="Pen1">
          </g>
          <g id="clock">
          </g>
          <g id="external-link">
          </g>
          <g id="hr">
          </g>
          <g id="info">
          </g>
          <g id="warning">
          </g>
          <g id="plus-circle">
          </g>
          <g id="minus-circle">
          </g>
          <g id="vue">
          </g>
          <g id="cog">
          </g>
          <g id="logo">
          </g>
          <g id="radio-check">
          </g>
          <g id="eye-slash">
          </g>
          <g id="eye">
          </g>
          <g id="toggle-off">
          </g>
          <g id="shredder">
          </g>
          <g id="spinner--loading--dots">
            <path d="M46.03,32c0,-2.751 2.233,-4.985 4.985,-4.985c2.751,0 4.985,2.234 4.985,4.985c0,2.751 -2.234,4.985 -4.985,4.985c-2.752,0 -4.985,-2.234 -4.985,-4.985Z" style={{fill:"#d9d9d9"}} />
            <path d="M41.92,41.92c1.946,-1.945 5.105,-1.945 7.051,0c1.945,1.946 1.945,5.105 0,7.051c-1.946,1.945 -5.105,1.945 -7.051,0c-1.945,-1.946 -1.945,-5.105 0,-7.051Z" style={{fill:"#b3b3b3"}} />
            <circle cx="32" cy="51.015" r="4.985" style={{fill:"#8c8c8c"}} />
            <path d="M22.08,41.92c1.945,1.946 1.945,5.105 0,7.051c-1.946,1.945 -5.105,1.945 -7.051,0c-1.945,-1.946 -1.945,-5.105 0,-7.051c1.946,-1.945 5.105,-1.945 7.051,0Z" style={{fill:"#666"}} />
            <path d="M17.97,32c0,2.751 -2.233,4.985 -4.985,4.985c-2.751,0 -4.985,-2.234 -4.985,-4.985c0,-2.751 2.234,-4.985 4.985,-4.985c2.752,0 4.985,2.234 4.985,4.985Z" style={{fill:"#404040"}} />
            <path d="M22.08,22.08c-1.946,1.945 -5.105,1.945 -7.051,0c-1.945,-1.946 -1.945,-5.105 0,-7.051c1.946,-1.945 5.105,-1.945 7.051,0c1.945,1.946 1.945,5.105 0,7.051Z" style={{fill:"#404040"}} />
            <circle cx="32" cy="12.985" r="4.985" />
          </g>
          <g id="react">
          </g>
          <g id="check-selected">
          </g>
          <g id="turn-off">
          </g>
          <g id="code-block">
          </g>
          <g id="user">
          </g>
          <g id="coffee-bean">
          </g>
          <g id="coffee-beans">
            <g id="coffee-bean1">
            </g>
          </g>
          <g id="coffee-bean-filled">
          </g>
          <g id="coffee-beans-filled">
            <g id="coffee-bean2">
            </g>
          </g>
          <g id="clipboard">
          </g>
          <g id="clipboard-paste">
          </g>
          <g id="clipboard-copy">
          </g>
          <g id="Layer1">
          </g>
        </g>
      </svg>
    </div>
  );
}

const Cpu = (className: string) => {
  return (
    <div className={`text-white ${className}`}>
<svg width="800px" height="800px" viewBox="0 0 24.00 24.00" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="#000000">
<g id="SVGRepo_bgCarrier" strokeWidth="0"/>
<g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"/>
<g id="SVGRepo_iconCarrier"> <path d="M12.4286 10L11 12H13L11.5714 14" stroke="#000000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/> <path d="M4 12C4 8.22876 4 6.34315 5.17157 5.17157C6.34315 4 8.22876 4 12 4C15.7712 4 17.6569 4 18.8284 5.17157C20 6.34315 20 8.22876 20 12C20 15.7712 20 17.6569 18.8284 18.8284C17.6569 20 15.7712 20 12 20C8.22876 20 6.34315 20 5.17157 18.8284C4 17.6569 4 15.7712 4 12Z" stroke="#000000" strokeWidth="1.5"/> <path d="M4 12H2" stroke="#000000" strokeWidth="1.5" strokeLinecap="round"/> <path d="M22 12H20" stroke="#000000" strokeWidth="1.5" strokeLinecap="round"/> <path d="M4 9H2" stroke="#000000" strokeWidth="1.5" strokeLinecap="round"/> <path d="M22 9H20" stroke="#000000" strokeWidth="1.5" strokeLinecap="round"/> <path d="M4 15H2" stroke="#000000" strokeWidth="1.5" strokeLinecap="round"/> <path d="M22 15H20" stroke="#000000" strokeWidth="1.5" strokeLinecap="round"/> <path d="M12 20L12 22" stroke="#000000" strokeWidth="1.5" strokeLinecap="round"/> <path d="M12 2L12 4" stroke="#000000" strokeWidth="1.5" strokeLinecap="round"/> <path d="M9 20L9 22" stroke="#000000" strokeWidth="1.5" strokeLinecap="round"/> <path d="M9 2L9 4" stroke="#000000" strokeWidth="1.5" strokeLinecap="round"/> <path d="M15 20L15 22" stroke="#000000" strokeWidth="1.5" strokeLinecap="round"/> <path d="M15 2L15 4" stroke="#000000" strokeWidth="1.5" strokeLinecap="round"/> <path d="M17 14C17 15.4142 17 16.1213 16.5607 16.5607C16.1213 17 15.4142 17 14 17H10C8.58579 17 7.87868 17 7.43934 16.5607C7 16.1213 7 15.4142 7 14V10C7 8.58579 7 7.87868 7.43934 7.43934C7.87868 7 8.58579 7 10 7H14C15.4142 7 16.1213 7 16.5607 7.43934C17 7.87868 17 8.58579 17 10" stroke="#000000" strokeWidth="1.5" strokeLinecap="round"/> </g>
</svg>
    </div>
  )
}