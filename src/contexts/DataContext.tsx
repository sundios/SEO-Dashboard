'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Types
interface GSCRow {
  keys?: string[];
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

interface GSCData {
  rows: GSCRow[];
  totalClicks: number;
  totalImpressions: number;
  avgCtr: number;
  avgPosition: number;
}

interface TimeSeriesData {
  date: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

interface SiteOverviewData {
  site: string;
  data: GSCData | null;
  timeSeriesData: TimeSeriesData[];
}

interface PerformanceData {
  site: string;
  startDate: string;
  endDate: string;
  dimensions: string;
  device?: string;
  data: GSCData | null;
  timeSeriesData: TimeSeriesData[];
}

interface WinnerLoserItem {
  name: string;
  firstHalfClicks: number;
  secondHalfClicks: number;
  change: number;
  changePercent: number;
}

interface WinnersLosersData {
  queries: {
    winners: WinnerLoserItem[];
    losers: WinnerLoserItem[];
  };
  pages: {
    winners: WinnerLoserItem[];
    losers: WinnerLoserItem[];
  };
}

interface DataContextType {
  // Sites
  sites: string[];
  setSites: (sites: string[]) => void;
  
  // Performance data
  performanceData: PerformanceData | null;
  setPerformanceData: (data: PerformanceData | null) => void;
  
  // Overview data
  overviewData: SiteOverviewData[];
  setOverviewData: (data: SiteOverviewData[]) => void;
  topSites: string[];
  setTopSites: (sites: string[]) => void;
  
  // Overview settings
  overviewPeriod: string;
  setOverviewPeriod: (period: string) => void;
  overviewDevice: string;
  setOverviewDevice: (device: string) => void;
  overviewSecondaryMetric: 'none' | 'ctr' | 'position';
  setOverviewSecondaryMetric: (metric: 'none' | 'ctr' | 'position') => void;
  
  // Performance settings
  selectedSite: string;
  setSelectedSite: (site: string) => void;
  startDate: string;
  setStartDate: (date: string) => void;
  endDate: string;
  setEndDate: (date: string) => void;
  dimensions: string;
  setDimensions: (dimensions: string) => void;
  device: string;
  setDevice: (device: string) => void;
  
  // Loading states
  sitesLoading: boolean;
  setSitesLoading: (loading: boolean) => void;
  performanceLoading: boolean;
  setPerformanceLoading: (loading: boolean) => void;
  overviewLoading: boolean;
  setOverviewLoading: (loading: boolean) => void;
  
  // Error state
  error: string;
  setError: (error: string) => void;
  
  // Insights state
  insights: {
    daily: string;
    queries: string;
  };
  setInsights: (insights: { daily: string; queries: string }) => void;
  showInsights: {
    daily: boolean;
    queries: boolean;
  };
  setShowInsights: (show: { daily: boolean; queries: boolean }) => void;
  insightsLoading: {
    daily: boolean;
    queries: boolean;
  };
  setInsightsLoading: (loading: { daily: boolean; queries: boolean }) => void;
  
  // Winners/Losers data
  winnersLosersData: WinnersLosersData | null;
  setWinnersLosersData: (data: WinnersLosersData | null) => void;
  winnersLosersLoading: boolean;
  setWinnersLosersLoading: (loading: boolean) => void;
  
  // Utility functions
  fetchSites: () => Promise<void>;
  clearPerformanceData: () => void;
  clearOverviewData: () => void;
  clearAllData: () => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};

interface DataProviderProps {
  children: ReactNode;
}

export const DataProvider: React.FC<DataProviderProps> = ({ children }) => {
  // Sites
  const [sites, setSites] = useState<string[]>([]);
  
  // Performance data
  const [performanceData, setPerformanceData] = useState<PerformanceData | null>(null);
  
  // Overview data
  const [overviewData, setOverviewData] = useState<SiteOverviewData[]>([]);
  const [topSites, setTopSites] = useState<string[]>([]);
  
  // Overview settings
  const [overviewPeriod, setOverviewPeriod] = useState('30');
  const [overviewDevice, setOverviewDevice] = useState('all');
  const [overviewSecondaryMetric, setOverviewSecondaryMetric] = useState<'none' | 'ctr' | 'position'>('none');
  
  // Performance settings
  const [selectedSite, setSelectedSite] = useState('');
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [dimensions, setDimensions] = useState('query');
  const [device, setDevice] = useState('all');
  
  // Loading states
  const [sitesLoading, setSitesLoading] = useState(false);
  const [performanceLoading, setPerformanceLoading] = useState(false);
  const [overviewLoading, setOverviewLoading] = useState(false);
  
  // Error state
  const [error, setError] = useState('');
  
  // Insights state
  const [insights, setInsights] = useState({
    daily: '',
    queries: ''
  });
  const [showInsights, setShowInsights] = useState({
    daily: false,
    queries: false
  });
  const [insightsLoading, setInsightsLoading] = useState({
    daily: false,
    queries: false
  });
  
  // Winners/Losers data
  const [winnersLosersData, setWinnersLosersData] = useState<WinnersLosersData | null>(null);
  const [winnersLosersLoading, setWinnersLosersLoading] = useState(false);
  
  // Fetch sites function
  const fetchSites = async () => {
    if (sites.length > 0) return; // Don't refetch if already have sites
    
    setSitesLoading(true);
    setError('');
    
    try {
      const response = await fetch('http://localhost:5001/api/sites');
      const result = await response.json();
      if (result.sites) {
        setSites(result.sites);
        // Set default selected site if none selected
        if (!selectedSite && result.sites.length > 0) {
          setSelectedSite(result.sites[0]);
        }
        // Set top sites for overview - check if saved in settings first
        if (topSites.length === 0) {
          // Try to load from settings
          fetch('http://localhost:5001/api/settings')
            .then(res => res.json())
            .then(settingsData => {
              if (settingsData.overviewSites && settingsData.overviewSites.length > 0) {
                // Use saved overview sites from settings
                setTopSites(settingsData.overviewSites);
              }
              // If no sites in settings, don't auto-select - show message instead
            })
            .catch(() => {
              // If settings fetch fails, don't auto-select
            });
        }
      }
    } catch (error) {
      console.error('Error fetching sites:', error);
      setError('Failed to fetch sites. Backend may not be running on port 5001.');
    } finally {
      setSitesLoading(false);
    }
  };
  
  // Clear functions
  const clearPerformanceData = () => {
    setPerformanceData(null);
    // Clear insights when performance data is cleared
    setInsights({ daily: '', queries: '' });
    setShowInsights({ daily: false, queries: false });
  };
  
  const clearOverviewData = () => {
    setOverviewData([]);
  };

  const clearAllData = () => {
    // Clear all data
    setSites([]);
    setPerformanceData(null);
    setOverviewData([]);
    setTopSites([]);
    setSelectedSite('');
    setError('');
    // Reset to default dates
    const date = new Date();
    date.setDate(date.getDate() - 30);
    setStartDate(date.toISOString().split('T')[0]);
    setEndDate(new Date().toISOString().split('T')[0]);
  };
  
  // Fetch sites on mount
  useEffect(() => {
    fetchSites();
  }, []);
  
  const value: DataContextType = {
    // Sites
    sites,
    setSites,
    
    // Performance data
    performanceData,
    setPerformanceData,
    
    // Overview data
    overviewData,
    setOverviewData,
    topSites,
    setTopSites,
    
    // Overview settings
    overviewPeriod,
    setOverviewPeriod,
    overviewDevice,
    setOverviewDevice,
    overviewSecondaryMetric,
    setOverviewSecondaryMetric,
    
    // Performance settings
    selectedSite,
    setSelectedSite,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    dimensions,
    setDimensions,
    device,
    setDevice,
    
    // Loading states
    sitesLoading,
    setSitesLoading,
    performanceLoading,
    setPerformanceLoading,
    overviewLoading,
    setOverviewLoading,
    
    // Error state
    error,
    setError,
    
    // Insights state
    insights,
    setInsights,
    showInsights,
    setShowInsights,
    insightsLoading,
    setInsightsLoading,
    
    // Winners/Losers data
    winnersLosersData,
    setWinnersLosersData,
    winnersLosersLoading,
    setWinnersLosersLoading,
    
    // Utility functions
    fetchSites,
    clearPerformanceData,
    clearOverviewData,
    clearAllData,
  };
  
  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
}; 