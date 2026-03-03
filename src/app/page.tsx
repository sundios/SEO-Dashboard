'use client';

import React, { useState, useEffect, useRef } from 'react';
import MetricCard from '@/components/ui/MetricCard';
import DashboardControls from '@/components/dashboard/DashboardControls';
import { useData } from '@/contexts/DataContext';
import ReactMarkdown from 'react-markdown';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDownload, faBrain, faRefresh, faExclamationTriangle, faMouse, faEye, faChartLine, faMapPin, faMagnifyingGlass, faGlobe, faTrophy, faCode } from '@fortawesome/free-solid-svg-icons';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import { queryColumns, pageColumns, countryColumns, GSCDataRow } from '@/components/dashboard/columns';

// Annotation plugin will be loaded via script tag to match Chart.js CDN loading
declare global {
  interface Window {
    Chart: any;
    annotationPlugin: any;
  }
}

// TypeScript interfaces
interface DailyData {
  date: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

interface QueryData {
  keys: string[];
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

interface PageData {
  keys: string[];
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

interface GSCData {
  rows: QueryData[];
  totalClicks: number;
  totalImpressions: number;
  avgCtr: number;
  avgPosition: number;
  dailyData: DailyData[];
  topQueries: QueryData[];
  topPages: PageData[];
}

interface CachedGSCData extends GSCData {
  site: string;
  startDate: string;
  endDate: string;
  device: string;
}

// Add Chart.js types
declare global {
  interface Window {
    Chart: any;
  }
}


export default function Dashboard() {
  const {
    sites,
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
    performanceData,
    setPerformanceData,
    performanceLoading,
    setPerformanceLoading,
    error,
    setError,
    insights,
    setInsights,
    showInsights,
    setShowInsights,
    insightsLoading,
    setInsightsLoading
  } = useData();

  const [data, setData] = useState<GSCData | null>(null);
  const [cachedQueriesData, setCachedQueriesData] = useState<CachedGSCData | null>(null);
  const [cachedPagesData, setCachedPagesData] = useState<CachedGSCData | null>(null);
  const [cachedCountryData, setCachedCountryData] = useState<CachedGSCData | null>(null);
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<any>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [queriesPerPage, setQueriesPerPage] = useState(20);

  // Sorting state
  const [sortBy, setSortBy] = useState<'clicks' | 'impressions' | 'ctr' | 'position'>('clicks');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Filtering state
  const [filters, setFilters] = useState({
    queryText: '',
    queryFilter: 'contains' as 'contains' | 'not-contains' | 'exact',
    clicksValue: '',
    clicksOperator: 'greater-than' as 'less-than' | 'greater-than' | 'equals' | 'not-equals'
  });


  // Date range presets
  const [selectedPreset, setSelectedPreset] = useState<string>('30-days');

  // Fetch all toggle
  const [fetchAll, setFetchAll] = useState<boolean>(false);

  // New state for tab system and advanced filtering
  const [activeTab, setActiveTab] = useState<'queries' | 'pages' | 'country'>('queries');
  const [advancedFilter, setAdvancedFilter] = useState({
    dimension: '' as '' | 'query' | 'page' | 'country' | 'device',
    type: 'contains' as 'exact' | 'contains' | 'not-contains',
    value: ''
  });

  // Algorithm updates toggle state
  const [showAlgorithmUpdates, setShowAlgorithmUpdates] = useState(false);

  // Google Algorithm Updates 2024-2025
  const algorithmUpdates = [
    { date: '2025-12-11', name: 'December 2025 core update', duration: '18 days, 2 hours' },
    { date: '2025-08-26', name: 'August 2025 spam update', duration: '26 days, 15 hours' },
    { date: '2025-06-30', name: 'June 2025 core update', duration: '16 days, 18 hours' },
    { date: '2025-03-13', name: 'March 2025 core update', duration: '13 days, 21 hours' },
    { date: '2024-12-19', name: 'December 2024 spam update', duration: '7 days, 2 hours' },
    { date: '2024-12-12', name: 'December 2024 core update', duration: '6 days, 4 hours' },
    { date: '2024-11-11', name: 'November 2024 core update', duration: '23 days, 13 hours' }
  ];



  const dateRangePresets = [
    { label: '7 Days', value: '7-days', days: 7 },
    { label: '30 Days', value: '30-days', days: 30 },
    { label: '3 Months', value: '3-months', days: 90 },
    { label: '6 Months', value: '6-months', days: 180 },
    { label: '12 Months', value: '12-months', days: 365 },
    { label: '16 Months', value: '16-months', days: 485 }
  ];

  const applyDatePreset = (preset: string) => {
    const today = new Date();
    const presetData = dateRangePresets.find(p => p.value === preset);
    
    if (presetData) {
      const startDate = new Date(today.getTime() - (presetData.days - 1) * 24 * 60 * 60 * 1000);
      setStartDate(startDate.toISOString().split('T')[0]);
      setEndDate(today.toISOString().split('T')[0]);
      setSelectedPreset(preset);
    }
  };

  // Load Chart.js and annotation plugin scripts
  useEffect(() => {
    // Load Chart.js first
    const chartScript = document.createElement('script');
    chartScript.src = 'https://cdn.jsdelivr.net/npm/chart.js@4.4.9/dist/chart.umd.min.js';
    chartScript.async = true;
    
    chartScript.onload = () => {
      console.log('Chart.js loaded');
      
      // Load annotation plugin after Chart.js is loaded
      const annotationScript = document.createElement('script');
      annotationScript.src = 'https://cdn.jsdelivr.net/npm/chartjs-plugin-annotation@3.1.0/dist/chartjs-plugin-annotation.min.js';
      annotationScript.async = true;
      
      annotationScript.onload = () => {
        console.log('Annotation plugin script loaded');
        // Register the plugin after it loads
        if (window.Chart) {
          try {
            // When loaded via script tag, the plugin is available globally
            // We need to access it and register it manually
            // The plugin might be in window.ChartAnnotation or similar
            // Check for the plugin in various possible locations
            let pluginToRegister = null;
            
            // Try different possible global locations
            if ((window as any).ChartAnnotation) {
              pluginToRegister = (window as any).ChartAnnotation;
            } else if ((window as any).annotationPlugin) {
              pluginToRegister = (window as any).annotationPlugin;
            } else if (window.Chart && (window.Chart as any).plugins) {
              // Plugin might have auto-registered
              const pluginCheck = window.Chart.registry?.getPlugin('annotation');
              if (pluginCheck) {
                console.log('Annotation plugin auto-registered');
                return;
              }
            }
            
            // If we found the plugin, register it
            if (pluginToRegister) {
              window.Chart.register(pluginToRegister);
              console.log('Annotation plugin manually registered');
            } else {
              // Plugin might auto-register when loaded via script tag
              // Wait a bit and check if it's available
              setTimeout(() => {
                if (window.Chart && window.Chart.registry) {
                  const pluginCheck = window.Chart.registry.getPlugin('annotation');
                  if (pluginCheck) {
                    console.log('Annotation plugin auto-registered and available');
                  } else {
                    console.warn('Annotation plugin script loaded but not found in registry. Plugin may need manual registration.');
                  }
                }
              }, 100);
            }
          } catch (e) {
            console.error('Error registering annotation plugin:', e);
          }
        }
      };
      
      annotationScript.onerror = () => {
        console.error('Failed to load annotation plugin script');
      };
      
      document.head.appendChild(annotationScript);
    };
    
    chartScript.onerror = () => {
      console.error('Failed to load Chart.js script');
    };
    
    document.head.appendChild(chartScript);
    
    return () => {
      if (document.head.contains(chartScript)) {
        document.head.removeChild(chartScript);
      }
      // Also clean up annotation script if it exists
      const annotationScript = document.querySelector('script[src*="chartjs-plugin-annotation"]');
      if (annotationScript && annotationScript.parentNode) {
        annotationScript.parentNode.removeChild(annotationScript);
      }
    };
  }, []);

  // Helper function to clean up old cache entries to prevent quota issues
  const cleanupOldCache = () => {
    try {
      const keys = Object.keys(localStorage);
      const cacheKeys = keys.filter(key => key.startsWith('gsc_cached_'));
      
      // Be more aggressive - only keep 5 most recent cache entries
      if (cacheKeys.length > 5) {
        // Sort by key (which includes date) and remove oldest
        const sortedKeys = cacheKeys.sort();
        const keysToRemove = sortedKeys.slice(0, cacheKeys.length - 5);
        keysToRemove.forEach(key => localStorage.removeItem(key));
        console.log(`Cleaned up ${keysToRemove.length} old cache entries`);
      }
      
      // Also check total localStorage size and clean if needed
      let totalSize = 0;
      cacheKeys.forEach(key => {
        try {
          const item = localStorage.getItem(key);
          if (item) {
            totalSize += new Blob([item]).size;
          }
        } catch (e) {
          // Ignore errors for individual items
        }
      });
      
      // If total size is over 4MB (most browsers allow ~5-10MB), remove oldest entries
      const maxSize = 4 * 1024 * 1024; // 4MB
      if (totalSize > maxSize && cacheKeys.length > 3) {
        const sortedKeys = cacheKeys.sort();
        const keysToRemove = sortedKeys.slice(0, cacheKeys.length - 3);
        keysToRemove.forEach(key => localStorage.removeItem(key));
        console.log(`Cleaned up ${keysToRemove.length} cache entries due to size limit`);
      }
    } catch (error) {
      console.error('Error cleaning up cache:', error);
    }
  };

  // Clear local data when sites are cleared (e.g., after clearing settings)
  useEffect(() => {
    if (sites.length === 0) {
      setData(null);
      setCachedQueriesData(null);
      setCachedPagesData(null);
      setInsights({ daily: '', queries: '' });
      setShowInsights({ daily: false, queries: false });
    }
  }, [sites]);

  // Load cached data from localStorage on mount or when returning to page
  useEffect(() => {
    if (selectedSite) {
      try {
        const cachedQueriesKey = `gsc_cached_queries_${selectedSite}_${startDate}_${endDate}_${device}`;
        const cachedPagesKey = `gsc_cached_pages_${selectedSite}_${startDate}_${endDate}_${device}`;
        
        const cachedQueries = localStorage.getItem(cachedQueriesKey);
        const cachedPages = localStorage.getItem(cachedPagesKey);
        
        if (cachedQueries) {
          const parsed = JSON.parse(cachedQueries) as CachedGSCData;
          if (parsed.site === selectedSite && 
              parsed.startDate === startDate && 
              parsed.endDate === endDate && 
              parsed.device === device) {
            setCachedQueriesData(parsed);
            // Restore data if it matches current tab or if no data is currently shown
            if (activeTab === 'queries' || !data) {
              setData(parsed);
            }
          }
        }
        
        if (cachedPages) {
          const parsed = JSON.parse(cachedPages) as CachedGSCData;
          if (parsed.site === selectedSite && 
              parsed.startDate === startDate && 
              parsed.endDate === endDate && 
              parsed.device === device) {
            setCachedPagesData(parsed);
            // Restore data if it matches current tab or if no data is currently shown
            if (activeTab === 'pages' || !data) {
              setData(parsed);
            }
          }
        }
      } catch (error) {
        console.error('Error loading cached data from localStorage:', error);
      }
    }
  }, [selectedSite, startDate, endDate, device, activeTab]); // Include activeTab to restore when switching tabs

  // Load cached performance data if available
  useEffect(() => {
    if (performanceData && 
        performanceData.site === selectedSite &&
        performanceData.startDate === startDate &&
        performanceData.endDate === endDate &&
        performanceData.dimensions === dimensions &&
        performanceData.device === device) {
      // Use cached data - try to infer dimension type from dimensions string
      const dimType = performanceData.dimensions.includes('country') ? 'country' : 
                     performanceData.dimensions.includes('page') ? 'pages' : 'queries';
      const processedData = processRawData(performanceData.data, dimType);
      setData(processedData);
    }
  }, [performanceData, selectedSite, startDate, endDate, dimensions, device]);

  // Check for cached data when switching tabs (from state or localStorage)
  useEffect(() => {
    if (!selectedSite) return;
    
    // Immediately restore cached data when switching tabs
    if (activeTab === 'queries' && cachedQueriesData) {
      // Check if cached data matches current parameters
      if (cachedQueriesData.site === selectedSite && 
          cachedQueriesData.startDate === startDate && 
          cachedQueriesData.endDate === endDate && 
          cachedQueriesData.device === device) {
        setData(cachedQueriesData);
        return;
      }
    } else if (activeTab === 'pages' && cachedPagesData) {
      // Check if cached data matches current parameters
      if (cachedPagesData.site === selectedSite && 
          cachedPagesData.startDate === startDate && 
          cachedPagesData.endDate === endDate && 
          cachedPagesData.device === device) {
        setData(cachedPagesData);
        return;
      }
    } else if (activeTab === 'country' && cachedCountryData) {
      // Check if cached data matches current parameters
      if (cachedCountryData.site === selectedSite && 
          cachedCountryData.startDate === startDate && 
          cachedCountryData.endDate === endDate && 
          cachedCountryData.device === device) {
        setData(cachedCountryData);
        return;
      }
    }
    
    // Try to load from localStorage if not in state
    try {
      const cacheKey = activeTab === 'queries' 
        ? `gsc_cached_queries_${selectedSite}_${startDate}_${endDate}_${device}`
        : activeTab === 'pages'
        ? `gsc_cached_pages_${selectedSite}_${startDate}_${endDate}_${device}`
        : `gsc_cached_country_${selectedSite}_${startDate}_${endDate}_${device}`;
      const stored = localStorage.getItem(cacheKey);
      if (stored) {
        const parsed = JSON.parse(stored) as CachedGSCData;
        if (parsed.site === selectedSite && 
            parsed.startDate === startDate && 
            parsed.endDate === endDate && 
            parsed.device === device) {
          setData(parsed);
          // Restore to state as well
          if (activeTab === 'queries') {
            setCachedQueriesData(parsed);
          } else if (activeTab === 'pages') {
            setCachedPagesData(parsed);
          } else {
            setCachedCountryData(parsed);
          }
        }
      }
    } catch (error) {
      console.error('Error loading from localStorage:', error);
    }
  }, [activeTab, cachedQueriesData, cachedPagesData, cachedCountryData, selectedSite, startDate, endDate, device]);

  // Clear cache when parameters change
  useEffect(() => {
    const clearCacheIfNeeded = () => {
      if (cachedQueriesData && (
        cachedQueriesData.site !== selectedSite ||
        cachedQueriesData.startDate !== startDate ||
        cachedQueriesData.endDate !== endDate ||
        cachedQueriesData.device !== device
      )) {
        setCachedQueriesData(null);
      }
      
      if (cachedPagesData && (
        cachedPagesData.site !== selectedSite ||
        cachedPagesData.startDate !== startDate ||
        cachedPagesData.endDate !== endDate ||
        cachedPagesData.device !== device
      )) {
        setCachedPagesData(null);
      }
    };
    
    clearCacheIfNeeded();
  }, [selectedSite, startDate, endDate, device, cachedQueriesData, cachedPagesData]);

  // Note: Insights persist across page navigation and site changes
  // They are only cleared when new data is explicitly fetched

  // Create/update chart when data or annotation toggle changes
  useEffect(() => {
    if (data?.dailyData && window.Chart && chartRef.current) {
      createChart();
    }
  }, [data, showAlgorithmUpdates]);

  // Manual refresh function - only this should trigger new data fetch
  const handleRefreshData = () => {
    if (selectedSite) {
      // Clear cache when manually refreshing
      setCachedQueriesData(null);
      setCachedPagesData(null);
      
      // Clear localStorage cache for current parameters
      try {
        const cachedQueriesKey = `gsc_cached_queries_${selectedSite}_${startDate}_${endDate}_${device}`;
        const cachedPagesKey = `gsc_cached_pages_${selectedSite}_${startDate}_${endDate}_${device}`;
        localStorage.removeItem(cachedQueriesKey);
        localStorage.removeItem(cachedPagesKey);
      } catch (error) {
        console.error('Error clearing localStorage:', error);
      }
      
      // Clear insights when loading new data
      setInsights({ daily: '', queries: '' });
      setShowInsights({ daily: false, queries: false });
      fetchData();
    }
  };


  const createChart = () => {
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    if (!chartRef.current || !data) return;

    const ctx = chartRef.current.getContext('2d');
    const dailyData = data.dailyData || [];
    
    // Create chart labels first to match dates properly
    const chartLabels = dailyData.map((item: DailyData) => new Date(item.date).toLocaleDateString());
    
    // Prepare annotation configuration for algorithm updates (only if toggle is on)
    const annotations: any = {};
    
    // Only create annotations if toggle is enabled
    if (showAlgorithmUpdates) {
      // Check which algorithm updates fall within the current date range
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      console.log('🔍 Checking algorithm updates for date range:', {
        startDate: start.toISOString().split('T')[0],
        endDate: end.toISOString().split('T')[0],
        totalUpdates: algorithmUpdates.length
      });
      
      let annotationIndex = 0;
      algorithmUpdates.forEach((update) => {
      const updateDate = new Date(update.date);
      
      // Only add annotation if update falls within the date range
      if (updateDate >= start && updateDate <= end) {
        console.log(`📅 Found update in range: ${update.name} on ${update.date}`);
        
        // Find the matching label in chart labels by comparing dates
        const matchingLabelIndex = dailyData.findIndex((item: DailyData) => {
          const itemDate = new Date(item.date);
          return itemDate.getFullYear() === updateDate.getFullYear() &&
                 itemDate.getMonth() === updateDate.getMonth() &&
                 itemDate.getDate() === updateDate.getDate();
        });
        
        if (matchingLabelIndex !== -1) {
          // Use the exact label from the chart to ensure matching
          const matchingLabel = chartLabels[matchingLabelIndex];
          
          console.log(`✅ Creating annotation for ${update.name} at label: ${matchingLabel} (index: ${matchingLabelIndex})`);
          
          // Create annotation with red vertical dotted line
          annotations[`update-${annotationIndex}`] = {
            type: 'line',
            xMin: matchingLabel,
            xMax: matchingLabel,
            borderColor: 'rgba(239, 68, 68, 0.8)', // Red color
            borderWidth: 2,
            borderDash: [5, 5], // Dotted line
            xScaleID: 'x',
            drawTime: 'afterDatasetsDraw', // Draw annotations on top of data lines
            label: {
              display: true,
              content: update.name,
              position: 'start',
              backgroundColor: 'rgba(239, 68, 68, 0.9)',
              color: 'white',
              font: {
                size: 11,
                weight: 'bold'
              },
              padding: {
                top: 4,
                bottom: 4,
                left: 8,
                right: 8
              },
              yAdjust: -30 - (annotationIndex * 20) // Stack labels vertically
            }
          };
          annotationIndex++;
        } else {
          console.log(`⚠️ Update ${update.name} is in date range but no matching data point found`);
        }
      }
      });
      
      console.log(`📊 Created ${Object.keys(annotations).length} annotations from ${algorithmUpdates.length} total updates`);
    } else {
      console.log('📊 Algorithm updates toggle is OFF - no annotations created');
    }
    
    // Function to update axis assignments based on visible datasets
    const updateAxisAssignments = (chart: any) => {
      const datasets = chart.data.datasets;
      const visibleDatasets = datasets.filter((dataset: any, index: number) => 
        chart.isDatasetVisible(index)
      );
      
      const visibleLabels = visibleDatasets.map((dataset: any) => dataset.label);
      
      // Reset all axis assignments
      datasets.forEach((dataset: any) => {
        dataset.yAxisID = undefined;
      });
      
      // Hide all axes initially
      chart.options.scales.y.display = false;
      chart.options.scales.y1.display = false;
      chart.options.scales.y2.display = false;
      chart.options.scales.y3.display = false;
      
      // Check if CTR or Position are visible
      const hasCTROrPosition = visibleLabels.includes('CTR (%)') || visibleLabels.includes('Position');
      
      // Assign axes based on visibility rules
      if (visibleLabels.includes('Clicks') || visibleLabels.includes('Impressions')) {
        // Primary rule: Clicks = left, Impressions = right
        if (visibleLabels.includes('Clicks')) {
          const clicksDataset = datasets.find((d: any) => d.label === 'Clicks');
          if (clicksDataset) clicksDataset.yAxisID = 'y';
          chart.options.scales.y.display = true;
          chart.options.scales.y.title.text = 'Clicks';
          
          // If CTR or Position are also visible, hide axis numbers
          if (hasCTROrPosition) {
            chart.options.scales.y.ticks.display = false;
            chart.options.scales.y.grid.display = false;
          } else {
            chart.options.scales.y.ticks.display = true;
            chart.options.scales.y.grid.display = true;
          }
        }
        
        if (visibleLabels.includes('Impressions')) {
          const impressionsDataset = datasets.find((d: any) => d.label === 'Impressions');
          if (impressionsDataset) impressionsDataset.yAxisID = 'y1';
          chart.options.scales.y1.display = true;
          chart.options.scales.y1.title.text = 'Impressions';
          
          // If CTR or Position are also visible, hide axis numbers
          if (hasCTROrPosition) {
            chart.options.scales.y1.ticks.display = false;
            chart.options.scales.y1.grid.display = false;
          } else {
            chart.options.scales.y1.ticks.display = true;
            chart.options.scales.y1.grid.display = true;
          }
        }
        
        // Allow CTR and Position to be displayed in the same view with their own scales
        if (visibleLabels.includes('CTR (%)')) {
          const ctrDataset = datasets.find((d: any) => d.label === 'CTR (%)');
          if (ctrDataset) ctrDataset.yAxisID = 'y2'; // Use separate axis for CTR
          chart.options.scales.y2.display = true;
          chart.options.scales.y2.title.text = 'CTR (%)';
          chart.options.scales.y2.ticks.display = false;
          chart.options.scales.y2.grid.display = false;
        }
        
        if (visibleLabels.includes('Position')) {
          const positionDataset = datasets.find((d: any) => d.label === 'Position');
          if (positionDataset) positionDataset.yAxisID = 'y3'; // Use separate axis for Position
          chart.options.scales.y3.display = true;
          chart.options.scales.y3.title.text = 'Position';
          chart.options.scales.y3.ticks.display = false;
          chart.options.scales.y3.grid.display = false;
        }
        
      } else {
        // Secondary rule: Only CTR and/or Position visible
        if (visibleLabels.includes('CTR (%)') && visibleLabels.includes('Position')) {
          // Both CTR and Position: CTR = left, Position = right
          const ctrDataset = datasets.find((d: any) => d.label === 'CTR (%)');
          const positionDataset = datasets.find((d: any) => d.label === 'Position');
          
          if (ctrDataset) ctrDataset.yAxisID = 'y';
          if (positionDataset) positionDataset.yAxisID = 'y1';
          
          chart.options.scales.y.display = true;
          chart.options.scales.y.title.text = 'CTR (%)';
          chart.options.scales.y1.display = true;
          chart.options.scales.y1.title.text = 'Position';
          
          // Show axis numbers when only CTR and Position are visible
          chart.options.scales.y.ticks.display = true;
          chart.options.scales.y.grid.display = true;
          chart.options.scales.y1.ticks.display = true;
          chart.options.scales.y1.grid.display = true;
          
        } else if (visibleLabels.includes('CTR (%)')) {
          // Only CTR: use left axis
          const ctrDataset = datasets.find((d: any) => d.label === 'CTR (%)');
          if (ctrDataset) ctrDataset.yAxisID = 'y';
          chart.options.scales.y.display = true;
          chart.options.scales.y.title.text = 'CTR (%)';
          
          // Show axis numbers when only CTR is visible
          chart.options.scales.y.ticks.display = true;
          chart.options.scales.y.grid.display = true;
          
        } else if (visibleLabels.includes('Position')) {
          // Only Position: use left axis
          const positionDataset = datasets.find((d: any) => d.label === 'Position');
          if (positionDataset) positionDataset.yAxisID = 'y';
          chart.options.scales.y.display = true;
          chart.options.scales.y.title.text = 'Position';
          
          // Show axis numbers when only Position is visible
          chart.options.scales.y.ticks.display = true;
          chart.options.scales.y.grid.display = true;
        }
      }
    };
    
    // Check if annotation plugin is available (loaded via script tag)
    let annotationPluginAvailable = false;
    if (typeof window !== 'undefined' && window.Chart && window.Chart.registry) {
      try {
        // Check if plugin is registered (it should auto-register when loaded via script tag)
        const registeredPlugin = window.Chart.registry.getPlugin('annotation');
        annotationPluginAvailable = !!registeredPlugin;
        
        if (!annotationPluginAvailable) {
          console.warn('Annotation plugin not found in Chart.js registry');
        }
      } catch (e) {
        console.log('Error checking annotation plugin:', e.message || e);
        annotationPluginAvailable = false;
      }
    }
    
    // Build chart options
    const chartOptions: any = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: {
          display: true,
          text: 'Daily Performance Trends',
          font: {
            size: 16,
            weight: 'bold'
          }
        },
        legend: {
          position: 'top',
          onClick: (e: any, legendItem: any, legend: any) => {
            // Custom legend click handler
            const chart = legend.chart;
            const index = legendItem.datasetIndex;
            
            // Toggle dataset visibility
            if (chart.isDatasetVisible(index)) {
              chart.hide(index);
            } else {
              chart.show(index);
            }
            
            // Update axis assignments after visibility change
            updateAxisAssignments(chart);
            
            // Update the chart
            chart.update();
          }
        }
      },
      scales: {
        x: {
          display: true,
          title: {
            display: true,
            text: 'Date'
          }
        },
        y: {
          type: 'linear',
          display: true,
          position: 'left',
          title: {
            display: true,
            text: 'Clicks'
          }
        },
        y1: {
          type: 'linear',
          display: true,
          position: 'right',
          title: {
            display: true,
            text: 'Impressions'
          },
          grid: {
            drawOnChartArea: false,
          },
        },
        y2: {
          type: 'linear',
          display: false,
          position: 'left',
          title: {
            display: true,
            text: 'CTR (%)'
          },
          grid: {
            drawOnChartArea: false,
          },
        },
        y3: {
          type: 'linear',
          display: false,
          position: 'right',
          title: {
            display: true,
            text: 'Position'
          },
          grid: {
            drawOnChartArea: false,
          },
        },
        y4: {
          type: 'linear',
          display: false,
          position: 'right',
          title: {
            display: true,
            text: 'LCP (ms)'
          },
          grid: {
            drawOnChartArea: false,
          },
        },
        y5: {
          type: 'linear',
          display: false,
          position: 'right',
          title: {
            display: true,
            text: 'INP (ms)'
          },
          grid: {
            drawOnChartArea: false,
          },
        },
        y6: {
          type: 'linear',
          display: false,
          position: 'right',
          title: {
            display: true,
            text: 'CLS'
          },
          grid: {
            drawOnChartArea: false,
          },
        }
      }
    };
    
    // Add annotations to chart options if any exist and plugin is available
    // Only add if plugin is confirmed available and Chart.js is ready
    console.log('Annotation check:', {
      pluginAvailable: annotationPluginAvailable,
      annotationsCount: Object.keys(annotations).length,
      annotations: Object.keys(annotations),
      chartReady: !!window.Chart?.registry
    });
    
    if (annotationPluginAvailable && Object.keys(annotations).length > 0 && window.Chart?.registry) {
      try {
        // Double-check plugin is registered
        const pluginCheck = window.Chart.registry.getPlugin('annotation');
        
        if (pluginCheck) {
          // Ensure plugins.annotation exists
          if (!chartOptions.plugins.annotation) {
            chartOptions.plugins.annotation = {};
          }
          chartOptions.plugins.annotation.annotations = annotations;
          console.log(`✅ Added ${Object.keys(annotations).length} algorithm update annotations:`, Object.keys(annotations));
          console.log('Annotation details:', annotations);
        } else {
          console.warn('⚠️ Annotation plugin not found in registry, skipping annotations');
        }
      } catch (e) {
        console.error('❌ Error adding annotations to chart options:', e);
      }
    } else {
      if (Object.keys(annotations).length > 0) {
        if (!annotationPluginAvailable) {
          console.warn('⚠️ Annotation plugin not available, skipping annotations. Annotations found:', Object.keys(annotations));
        } else {
          console.warn('⚠️ No annotations to add (date range may not include any algorithm updates)');
        }
      }
    }
    
    chartInstance.current = new window.Chart(ctx, {
      type: 'line',
      data: {
        labels: chartLabels,
        datasets: [
          {
            label: 'Clicks',
            data: dailyData.map((item: DailyData) => item.clicks),
            borderColor: 'rgb(59, 130, 246)',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            tension: 0.1,
            yAxisID: 'y', // Initial assignment
            hidden: false
          },
          {
            label: 'Impressions',
            data: dailyData.map((item: DailyData) => item.impressions),
            borderColor: 'rgb(34, 197, 94)',
            backgroundColor: 'rgba(34, 197, 94, 0.1)',
            tension: 0.1,
            yAxisID: 'y1', // Initial assignment
            hidden: false
          },
          {
            label: 'CTR (%)',
            data: dailyData.map((item: DailyData) => (item.ctr * 100).toFixed(2)),
            borderColor: 'rgb(147, 51, 234)',
            backgroundColor: 'rgba(147, 51, 234, 0.1)',
            tension: 0.1,
            yAxisID: undefined // Will be hidden initially
          },
          {
            label: 'Position',
            data: dailyData.map((item: DailyData) => item.position.toFixed(1)),
            borderColor: 'rgb(249, 115, 22)',
            backgroundColor: 'rgba(249, 115, 22, 0.1)',
            tension: 0.1,
            yAxisID: undefined // Will be hidden initially
          }
        ]
      },
      options: chartOptions
    });
    
    // Set initial state: hide CTR and Position datasets
    chartInstance.current.hide(2); // CTR
    chartInstance.current.hide(3); // Position
    
    updateAxisAssignments(chartInstance.current);
    chartInstance.current.update();
  };

  const fetchData = async (targetTab?: 'queries' | 'pages' | 'country') => {
    if (!selectedSite) return;
    
    // Use the provided tab or fall back to current activeTab
    const tabToUse = targetTab || activeTab;
    
    // Check if we already have cached data for this tab and parameters
    const hasCachedData = (tabToUse === 'queries' && cachedQueriesData) || 
                         (tabToUse === 'pages' && cachedPagesData) ||
                         (tabToUse === 'country' && cachedCountryData);
    
    // Check if cached data matches current parameters
    const cachedData = tabToUse === 'queries' ? cachedQueriesData : 
                      tabToUse === 'pages' ? cachedPagesData : 
                      cachedCountryData;
    const dataMatches = cachedData && 
                       cachedData.site === selectedSite &&
                       cachedData.startDate === startDate &&
                       cachedData.endDate === endDate &&
                       cachedData.device === device;
    
    // If we have matching cached data, use it instead of fetching
    // Also check localStorage as a fallback
    if (hasCachedData && dataMatches) {
      console.log(`DEBUG: Using cached ${tabToUse} data from state`);
      setData(cachedData);
      return;
    }
    
    // Check localStorage as well
    try {
      const cacheKey = tabToUse === 'queries' 
        ? `gsc_cached_queries_${selectedSite}_${startDate}_${endDate}_${device}`
        : tabToUse === 'pages'
        ? `gsc_cached_pages_${selectedSite}_${startDate}_${endDate}_${device}`
        : `gsc_cached_country_${selectedSite}_${startDate}_${endDate}_${device}`;
      const stored = localStorage.getItem(cacheKey);
      if (stored) {
        const parsed = JSON.parse(stored) as CachedGSCData;
        if (parsed.site === selectedSite && 
            parsed.startDate === startDate && 
            parsed.endDate === endDate && 
            parsed.device === device) {
          console.log(`DEBUG: Using cached ${tabToUse} data from localStorage`);
          setData(parsed);
          // Restore to state as well
          if (tabToUse === 'queries') {
            setCachedQueriesData(parsed);
          } else if (tabToUse === 'pages') {
            setCachedPagesData(parsed);
          } else {
            setCachedCountryData(parsed);
          }
          return;
        }
      }
    } catch (error) {
      console.error('Error reading from localStorage:', error);
    }
    
    setPerformanceLoading(true);
    setError('');
    
    console.log(`DEBUG: fetchData called with fetchAll = ${fetchAll}, tab = ${tabToUse}`);
    
    try {
      // Determine dimensions based on the target tab
      const targetDimensions = tabToUse === 'queries' ? 'date,query' : 
                               tabToUse === 'country' ? 'date,country' : 
                               'date,page';
      
      const params = new URLSearchParams({
        siteUrl: selectedSite,
        startDate: startDate,
        endDate: endDate,
        dimensions: targetDimensions,
        fetchAll: fetchAll.toString()
      });

      // Add device filter if not 'all'
      if (device !== 'all') {
        params.append('device', device);
      }

      // Add advanced filter parameters if they exist
      if (advancedFilter.dimension && advancedFilter.value) {
        params.append('filterDimension', advancedFilter.dimension);
        params.append('filterType', advancedFilter.type);
        params.append('filterValue', advancedFilter.value);
      }

      console.log(`DEBUG: API request URL: http://localhost:5001/api/data?${params.toString()}`);
        
      const response = await fetch(`http://localhost:5001/api/data?${params}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = `HTTP ${response.status}: ${errorText}`;
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.error || errorMessage;
        } catch (e) {
          // If not JSON, use the text as is
        }
        setError(errorMessage);
        return;
      }
      
      const result = await response.json();
      
      if (result.error) {
        setError(result.error);
      } else {
        // Process and aggregate the data client-side
        // Pass the dimension type so we know what we're processing
        const processedData = processRawData(result, tabToUse);
        setData(processedData);
        
        // Cache the data for the specific tab in state
        const cachedData = {
          ...processedData,
          site: selectedSite,
          startDate: startDate,
          endDate: endDate,
          device: device
        } as CachedGSCData;
        
        if (tabToUse === 'queries') {
          setCachedQueriesData(cachedData);
        } else if (tabToUse === 'pages') {
          setCachedPagesData(cachedData);
        } else {
          setCachedCountryData(cachedData);
        }
        
        // Store in shared context for persistence across page navigation
        setPerformanceData({
          site: selectedSite,
          startDate: startDate,
          endDate: endDate,
          dimensions: targetDimensions,
          device: device,
          data: result,
          timeSeriesData: processedData.dailyData
        });
        
        // Save to localStorage for persistence across page refreshes
        // Only store essential data to avoid quota issues
        try {
          const cacheKey = tabToUse === 'queries' 
            ? `gsc_cached_queries_${selectedSite}_${startDate}_${endDate}_${device}`
            : tabToUse === 'pages'
            ? `gsc_cached_pages_${selectedSite}_${startDate}_${endDate}_${device}`
            : `gsc_cached_country_${selectedSite}_${startDate}_${endDate}_${device}`;
          
          // Clean up old cache entries BEFORE storing new one
          cleanupOldCache();
          
          // Store only essential aggregated data, not raw rows to prevent quota issues
          // Only store the top items and daily data, not all raw rows
          const limitedCachedData: CachedGSCData = {
            ...cachedData,
            // Don't store raw rows at all - they're too large
            rows: [],
            // Only keep top items for display
            topQueries: cachedData.topQueries.slice(0, 100), // Keep top 100 queries only
            topPages: cachedData.topPages.slice(0, 100), // Keep top 100 pages only
            topCountries: cachedData.topCountries?.slice(0, 50) || [], // Keep top 50 countries only
            // Keep daily data but limit to last 90 days if too much
            dailyData: cachedData.dailyData.length > 90 
              ? cachedData.dailyData.slice(-90) 
              : cachedData.dailyData
          };
          
          try {
            localStorage.setItem(cacheKey, JSON.stringify(limitedCachedData));
          } catch (error: any) {
            // If still too large, store even less
            if (error.name === 'QuotaExceededError' || error.message?.includes('quota')) {
              console.log('Still too large, storing minimal data...');
              // Clear all cache first
              try {
                const keys = Object.keys(localStorage);
                keys.forEach(key => {
                  if (key.startsWith('gsc_cached_')) {
                    localStorage.removeItem(key);
                  }
                });
              } catch (e) {
                // Ignore cleanup errors
              }
              
              // Store minimal data
              const minimalData: CachedGSCData = {
                ...cachedData,
                rows: [],
                topQueries: cachedData.topQueries.slice(0, 50),
                topPages: cachedData.topPages.slice(0, 50),
                topCountries: cachedData.topCountries?.slice(0, 25) || [],
                dailyData: cachedData.dailyData.slice(-30) // Last 30 days only
              };
              
              try {
                localStorage.setItem(cacheKey, JSON.stringify(minimalData));
              } catch (retryError) {
                console.error('Failed to save even minimal cache. Data will work for this session only.');
                // Data is still in state/context, so it will work for this session
              }
            } else {
              throw error;
            }
          }
        } catch (error: any) {
          console.error('Error saving to localStorage:', error);
          // Error is already handled in the inner try-catch above
        }
        
        setError(''); // Clear any previous errors
        // Clear insights when new data is loaded
        setInsights({ daily: '', queries: '' });
        setShowInsights({ daily: false, queries: false });
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to fetch data. Backend may not be running on port 5001.');
    } finally {
      setPerformanceLoading(false);
    }
  };

  const processRawData = (rawData: any, dimensionType?: 'queries' | 'pages' | 'country'): GSCData => {
    const rows = rawData.rows || [];
    
    console.log(`DEBUG: Processing ${rows.length} rows from backend, dimensionType: ${dimensionType}`);
    
    // Aggregate queries (sum by query across all dates)
    const queryAggregation: { [key: string]: { clicks: number; impressions: number; ctr: number; position: number; count: number } } = {};
    
    // Aggregate pages (sum by page across all dates)
    const pageAggregation: { [key: string]: { clicks: number; impressions: number; ctr: number; position: number; count: number } } = {};
    
    // Aggregate countries (sum by country across all dates)
    const countryAggregation: { [key: string]: { clicks: number; impressions: number; ctr: number; position: number; count: number } } = {};
    
    // Aggregate by date (sum by date across all queries/pages/countries)
    const dailyAggregation: { [key: string]: { clicks: number; impressions: number; ctr: number; position: number; count: number } } = {};
    
    // Determine the data type - use explicit dimensionType if provided, otherwise auto-detect
    let isQueryData = false;
    let isPageData = false;
    let isCountryData = false;
    
    if (dimensionType) {
      // Explicit dimension type provided
      if (dimensionType === 'queries') {
        isQueryData = true;
      } else if (dimensionType === 'pages') {
        isPageData = true;
      } else if (dimensionType === 'country') {
        isCountryData = true;
      }
      console.log(`DEBUG: Using explicit dimension type: ${dimensionType}`);
    } else if (rows.length > 0 && rows[0].keys && rows[0].keys.length >= 2) {
      // Auto-detect from data
      const secondDimensionSample = rows[0].keys[1];
      // Check if it's country data (country codes are typically 2 letters like 'us', 'gb', etc.)
      // Also check for uppercase codes like 'US', 'GB'
      if (secondDimensionSample.length === 2 && secondDimensionSample.match(/^[a-zA-Z]{2}$/)) {
        isCountryData = true;
        console.log('DEBUG: Detected country data based on country code pattern');
      } else if (secondDimensionSample.startsWith('http') || secondDimensionSample.includes('/')) {
        isPageData = true;
        console.log('DEBUG: Detected page data based on URL pattern');
      } else {
        isQueryData = true;
        console.log('DEBUG: Detected query data based on text pattern');
      }
    }
    
    rows.forEach((row: any) => {
      if (row.keys && row.keys.length >= 2) {
        const date = row.keys[0];
        const secondDimension = row.keys[1]; // Could be query or page
        const clicks = row.clicks || 0;
        const impressions = row.impressions || 0;
        const ctr = row.ctr || 0;
        const position = row.position || 0;
        
        // Aggregate by the detected dimension type
        if (isQueryData) {
          // Aggregate by query
          if (!queryAggregation[secondDimension]) {
            queryAggregation[secondDimension] = { clicks: 0, impressions: 0, ctr: 0, position: 0, count: 0 };
          }
          queryAggregation[secondDimension].clicks += clicks;
          queryAggregation[secondDimension].impressions += impressions;
          queryAggregation[secondDimension].ctr += ctr;
          queryAggregation[secondDimension].position += position;
          queryAggregation[secondDimension].count += 1;
        }
        
        if (isPageData) {
          // Aggregate by page
          if (!pageAggregation[secondDimension]) {
            pageAggregation[secondDimension] = { clicks: 0, impressions: 0, ctr: 0, position: 0, count: 0 };
          }
          pageAggregation[secondDimension].clicks += clicks;
          pageAggregation[secondDimension].impressions += impressions;
          pageAggregation[secondDimension].ctr += ctr;
          pageAggregation[secondDimension].position += position;
          pageAggregation[secondDimension].count += 1;
        }
        
        if (isCountryData) {
          // Aggregate by country
          if (!countryAggregation[secondDimension]) {
            countryAggregation[secondDimension] = { clicks: 0, impressions: 0, ctr: 0, position: 0, count: 0 };
          }
          countryAggregation[secondDimension].clicks += clicks;
          countryAggregation[secondDimension].impressions += impressions;
          countryAggregation[secondDimension].ctr += ctr;
          countryAggregation[secondDimension].position += position;
          countryAggregation[secondDimension].count += 1;
        }
        
        // Always aggregate by date regardless of dimension type
        if (!dailyAggregation[date]) {
          dailyAggregation[date] = { clicks: 0, impressions: 0, ctr: 0, position: 0, count: 0 };
        }
        dailyAggregation[date].clicks += clicks;
        dailyAggregation[date].impressions += impressions;
        dailyAggregation[date].ctr += ctr;
        dailyAggregation[date].position += position;
        dailyAggregation[date].count += 1;
      }
    });
    
    // Convert query aggregation to array and sort by clicks
    const topQueries: QueryData[] = Object.entries(queryAggregation)
      .map(([query, data]) => ({
        keys: [query],
        clicks: data.clicks,
        impressions: data.impressions,
        ctr: data.ctr / data.count,
        position: data.position / data.count
      }))
      .sort((a, b) => b.clicks - a.clicks);
    
    // Convert page aggregation to array and sort by clicks
    const topPages: PageData[] = Object.entries(pageAggregation)
      .map(([page, data]) => ({
        keys: [page],
        clicks: data.clicks,
        impressions: data.impressions,
        ctr: data.ctr / data.count,
        position: data.position / data.count
      }))
      .sort((a, b) => b.clicks - a.clicks);
    
    // Convert country aggregation to array and sort by clicks
    const topCountries: CountryData[] = Object.entries(countryAggregation)
      .map(([country, data]) => ({
        keys: [country],
        clicks: data.clicks,
        impressions: data.impressions,
        ctr: data.ctr / data.count,
        position: data.position / data.count
      }))
      .sort((a, b) => b.clicks - a.clicks);
    
    console.log(`DEBUG: Processed ${topQueries.length} unique queries, ${topPages.length} unique pages, and ${topCountries.length} unique countries`);
    
    // Convert daily aggregation to array and sort by date
    const dailyData: DailyData[] = Object.entries(dailyAggregation)
      .map(([date, data]) => ({
        date,
        clicks: data.clicks,
        impressions: data.impressions,
        ctr: data.ctr / data.count,
        position: data.position / data.count
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
    
    console.log(`DEBUG: Processed ${dailyData.length} days of data`);
    
    // Reset pagination when new data is loaded
    setCurrentPage(1);
    
    return {
      rows: rawData.rows,
      totalClicks: rawData.totalClicks,
      totalImpressions: rawData.totalImpressions,
      avgCtr: rawData.avgCtr,
      avgPosition: rawData.avgPosition,
      dailyData,
      topQueries,
      topPages,
      topCountries: topCountries.length > 0 ? topCountries : undefined
    };
  };

  // Extract data arrays with safe defaults
  const topQueries: QueryData[] = data?.topQueries || [];
  const topPages: PageData[] = data?.topPages || [];
  const topCountries: CountryData[] = data?.topCountries || [];
  
  // Get current table data based on active tab
  const currentTableData = activeTab === 'queries' ? topQueries : activeTab === 'pages' ? topPages : topCountries;
  
  // Sorting function
  const handleSort = (column: 'clicks' | 'impressions' | 'ctr' | 'position') => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
    setCurrentPage(1); // Reset to first page when sorting
  };

  // Filtering function
  const applyFilters = (queries: QueryData[]): QueryData[] => {
    return queries.filter(query => {
      const queryText = query.keys?.[0]?.toLowerCase() || '';
      const clicks = query.clicks || 0;
      
      // Query text filter
      let passesQueryFilter = true;
      if (filters.queryText) {
        const filterText = filters.queryText.toLowerCase();
        switch (filters.queryFilter) {
          case 'contains':
            passesQueryFilter = queryText.includes(filterText);
            break;
          case 'not-contains':
            passesQueryFilter = !queryText.includes(filterText);
            break;
          case 'exact':
            passesQueryFilter = queryText === filterText;
            break;
        }
      }
      
      // Clicks filter
      let passesClicksFilter = true;
      if (filters.clicksValue) {
        const filterValue = parseInt(filters.clicksValue);
        if (!isNaN(filterValue)) {
          switch (filters.clicksOperator) {
            case 'less-than':
              passesClicksFilter = clicks < filterValue;
              break;
            case 'greater-than':
              passesClicksFilter = clicks > filterValue;
              break;
            case 'equals':
              passesClicksFilter = clicks === filterValue;
              break;
            case 'not-equals':
              passesClicksFilter = clicks !== filterValue;
              break;
          }
        }
      }
      
      return passesQueryFilter && passesClicksFilter;
    });
  };

  // Apply sorting function
  const applySorting = (queries: QueryData[]): QueryData[] => {
    return [...queries].sort((a, b) => {
      let aValue: number, bValue: number;
      
      switch (sortBy) {
        case 'clicks':
          aValue = a.clicks || 0;
          bValue = b.clicks || 0;
          break;
        case 'impressions':
          aValue = a.impressions || 0;
          bValue = b.impressions || 0;
          break;
        case 'ctr':
          aValue = a.ctr || 0;
          bValue = b.ctr || 0;
          break;
        case 'position':
          aValue = a.position || 0;
          bValue = b.position || 0;
          break;
        default:
          return 0;
      }
      
      if (sortOrder === 'asc') {
        return aValue - bValue;
      } else {
        return bValue - aValue;
      }
    });
  };

  // Process queries: filter -> sort -> paginate
  const filteredQueries = applyFilters(currentTableData);
  const sortedQueries = applySorting(filteredQueries);
  
  // Update pagination logic
  const totalQueries = sortedQueries.length;
  const totalPages = Math.ceil(totalQueries / queriesPerPage);
  const startIndex = (currentPage - 1) * queriesPerPage;
  const endIndex = startIndex + queriesPerPage;
  const paginatedQueries = sortedQueries.slice(startIndex, endIndex);
  
  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  // Reset filters function
  const resetFilters = () => {
    setFilters({
      queryText: '',
      queryFilter: 'contains',
      clicksValue: '',
      clicksOperator: 'greater-than'
    });
    setCurrentPage(1);
  };

  // Download utility functions
  const downloadCSV = (data: any[], filename: string) => {
    if (!data || data.length === 0) {
      alert('No data to download');
      return;
    }

    // Convert data to CSV
    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header];
          // Handle values that might contain commas or quotes
          if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        }).join(',')
      )
    ].join('\n');

    // Create and trigger download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Download daily data
  const downloadDailyData = () => {
    if (!data?.dailyData) {
      alert('No daily data available to download');
      return;
    }

    const csvData = data.dailyData.map(item => ({
      Date: item.date,
      Clicks: item.clicks,
      Impressions: item.impressions,
      'CTR (%)': (item.ctr * 100).toFixed(2),
      'Avg Position': item.position.toFixed(1)
    }));

    const siteName = selectedSite.replace('https://', '').replace('http://', '').replace(/[^a-zA-Z0-9]/g, '_');
    const filename = `GSC_Daily_Data_${siteName}_${startDate}_to_${endDate}.csv`;
    downloadCSV(csvData, filename);
  };

  // Download query data (filtered and sorted)
  const downloadQueryData = () => {
    if (!filteredQueries || filteredQueries.length === 0) {
      alert('No query data available to download');
      return;
    }

    const csvData = sortedQueries.map((query, index) => ({
      Rank: index + 1,
      Query: query.keys?.[0] || 'Unknown',
      Clicks: query.clicks || 0,
      Impressions: query.impressions || 0,
      'CTR (%)': query.ctr ? (query.ctr * 100).toFixed(2) : '0.00',
      'Avg Position': query.position ? query.position.toFixed(1) : 'N/A'
    }));

    const siteName = selectedSite.replace('https://', '').replace('http://', '').replace(/[^a-zA-Z0-9]/g, '_');
    const filterInfo = filters.queryText ? `_filtered_${filters.queryText.replace(/[^a-zA-Z0-9]/g, '_')}` : '';
    const filename = `GSC_Query_Data_${siteName}_${startDate}_to_${endDate}${filterInfo}.csv`;
    downloadCSV(csvData, filename);
  };

  // Get insights for daily chart data
  const getDailyInsights = async () => {
    if (!data?.dailyData || data.dailyData.length === 0) {
      alert('No daily data available for analysis');
      return;
    }

    console.log('DEBUG: Daily data being sent to insights:', data.dailyData.slice(0, 3)); // Log first 3 items
    console.log('DEBUG: Daily data length:', data.dailyData.length);

    setInsightsLoading({...insightsLoading, daily: true});
    
    try {
      const response = await fetch('http://localhost:5001/api/insights/daily', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dailyData: data.dailyData
        })
      });

      const result = await response.json();
      
      if (result.error) {
        alert('Error getting insights: ' + result.error);
      } else {
        setInsights({...insights, daily: result.insights});
        setShowInsights({...showInsights, daily: true});
      }
    } catch (error) {
      console.error('Error getting daily insights:', error);
      alert('Failed to get insights. Make sure the backend is running.');
    } finally {
      setInsightsLoading({...insightsLoading, daily: false});
    }
  };

  // Get insights for currently visible queries
  const getQueryInsights = async () => {
    if (paginatedQueries.length === 0) {
      alert('No queries available for analysis');
      return;
    }

    console.log('DEBUG: Query data being sent to insights:', paginatedQueries.slice(0, 3)); // Log first 3 items
    console.log('DEBUG: Query data length:', paginatedQueries.length);

    setInsightsLoading({...insightsLoading, queries: true});
    
    try {
      const response = await fetch('http://localhost:5001/api/insights/queries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          queries: paginatedQueries
        })
      });

      const result = await response.json();
      
      if (result.error) {
        alert('Error getting insights: ' + result.error);
      } else {
        setInsights({...insights, queries: result.insights});
        setShowInsights({...showInsights, queries: true});
      }
    } catch (error) {
      console.error('Error getting query insights:', error);
      alert('Failed to get insights. Make sure the backend is running.');
    } finally {
      setInsightsLoading({...insightsLoading, queries: false});
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Traffic Performance</h1>
          <p className="text-gray-600 mt-2">Monitor your website's search performance with real-time insights</p>
          {performanceData && (
            <div className="mt-2 flex items-center space-x-2 text-sm text-blue-600">
              <FontAwesomeIcon icon={faDownload} />
              <span>Data cached - showing results for {performanceData.site} from {performanceData.startDate} to {performanceData.endDate}</span>
            </div>
          )}
        </div>
        <div className="flex items-center space-x-3">
          <Button
            onClick={handleRefreshData}
            disabled={performanceLoading || !selectedSite}
            variant="default"
            className="flex items-center space-x-2"
          >
            <FontAwesomeIcon icon={faRefresh} />
            <span>{performanceLoading ? 'Loading...' : 'Load Data'}</span>
          </Button>
        </div>
      </div>

      {/* Controls */}
      <DashboardControls
        sites={sites}
        selectedSite={selectedSite}
        selectedPreset={selectedPreset}
        startDate={startDate}
        endDate={endDate}
        loading={performanceLoading}
        fetchAll={fetchAll}
        device={device}
        advancedFilter={advancedFilter}
        onSiteChange={setSelectedSite}
        onPresetChange={applyDatePreset}
        onStartDateChange={(date) => {
          setStartDate(date);
          setSelectedPreset('');
        }}
        onEndDateChange={(date) => {
          setEndDate(date);
          setSelectedPreset('');
        }}
        onFetchAllChange={setFetchAll}
        onDeviceChange={setDevice}
        onAdvancedFilterChange={setAdvancedFilter}
        onFetchData={() => fetchData()}
      />

      {/* Error Display */}
      {error && (
        <div className="border-red-200 bg-red-50 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <span className="text-red-500"><FontAwesomeIcon icon={faExclamationTriangle} /></span>
            <div>
              <h3 className="text-red-800 font-medium">Error</h3>
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Metrics Cards */}
      {data && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            title="Clicks"
            value={data.totalClicks?.toLocaleString() || '0'}
            icon={<FontAwesomeIcon icon={faMouse} />}
          />
          <MetricCard
            title="Impressions"
            value={data.totalImpressions?.toLocaleString() || '0'}
            icon={<FontAwesomeIcon icon={faEye} />}
          />
          <MetricCard
            title="CTR"
            value={data.avgCtr ? (data.avgCtr * 100).toFixed(2) + '%' : '0%'}
            icon={<FontAwesomeIcon icon={faChartLine} />}
          />
          <MetricCard
            title="Avg. Ranking"
            value={data.avgPosition ? data.avgPosition.toFixed(1) : '0'}
            icon={<FontAwesomeIcon icon={faTrophy} />}
          />
        </div>
      )}

      {/* Chart Section */}
      {data?.dailyData && data.dailyData.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-xl font-semibold text-gray-900">Daily Performance Trends</h3>
              <p className="text-gray-600">
                Showing {data.dailyData.length} days of data from {startDate} to {endDate}
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <Button
                onClick={() => setShowAlgorithmUpdates(!showAlgorithmUpdates)}
                variant={showAlgorithmUpdates ? "default" : "outline"}
                className={`flex items-center space-x-2 ${showAlgorithmUpdates ? 'bg-red-600 hover:bg-red-700 text-white' : ''}`}
              >
                <FontAwesomeIcon icon={faCode} />
                <span>{showAlgorithmUpdates ? 'Hide' : 'Show'} Algorithm Updates</span>
              </Button>
              <Button
                onClick={downloadDailyData}
                variant="default"
                className="flex items-center space-x-2"
              >
                <FontAwesomeIcon icon={faDownload} />
                <span>Download CSV</span>
              </Button>
              <Button
                onClick={getDailyInsights}
                disabled={insightsLoading.daily}
                variant="default"
                className="flex items-center space-x-2 bg-green-600 hover:bg-green-700"
              >
                {insightsLoading.daily && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>}
                <FontAwesomeIcon icon={faBrain} />
                <span>{insightsLoading.daily ? 'Analyzing...' : 'Get Daily Insights'}</span>
              </Button>
            </div>
          </div>

          <div className="h-96">
            <canvas ref={chartRef}></canvas>
          </div>
          
          {/* Daily Insights Display */}
          {showInsights.daily && insights.daily && (
            <div className="mt-6 bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-200">
              <div className="flex justify-between items-start mb-4">
                <h4 className="text-lg font-medium text-blue-900">AI Performance Analysis</h4>
                <Button
                  onClick={() => setShowInsights({...showInsights, daily: false})}
                  variant="ghost"
                  size="icon"
                  className="text-blue-600 hover:text-blue-800"
                >
                  ×
                </Button>
              </div>
              <div className="prose prose-blue max-w-none text-blue-800">
                <ReactMarkdown
                  components={{
                    h1: ({children}) => <h1 className="text-xl font-bold mb-3 text-blue-900">{children}</h1>,
                    h2: ({children}) => <h2 className="text-lg font-semibold mb-2 text-blue-900">{children}</h2>,
                    h3: ({children}) => <h3 className="text-base font-medium mb-2 text-blue-800">{children}</h3>,
                    p: ({children}) => <p className="mb-3 text-blue-800">{children}</p>,
                    ul: ({children}) => <ul className="list-disc list-inside mb-3 space-y-1">{children}</ul>,
                    ol: ({children}) => <ol className="list-decimal list-inside mb-3 space-y-1">{children}</ol>,
                    li: ({children}) => <li className="text-blue-800">{children}</li>,
                    strong: ({children}) => <strong className="font-semibold text-blue-900">{children}</strong>,
                    em: ({children}) => <em className="italic">{children}</em>,
                  }}
                >
                  {insights.daily}
                </ReactMarkdown>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Queries Table Section */}
      {data && (topQueries.length > 0 || topPages.length > 0 || topCountries.length > 0) && (
        <div className="space-y-4">
          {/* Tab Navigation */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center space-x-1 border-b border-gray-200">
              <button
                onClick={() => {
                  setActiveTab('queries');
                  // Restore cached data immediately if available
                  if (cachedQueriesData && 
                      cachedQueriesData.site === selectedSite &&
                      cachedQueriesData.startDate === startDate &&
                      cachedQueriesData.endDate === endDate &&
                      cachedQueriesData.device === device) {
                    setData(cachedQueriesData);
                  } else {
                    // Try localStorage
                    try {
                      const cacheKey = `gsc_cached_queries_${selectedSite}_${startDate}_${endDate}_${device}`;
                      const stored = localStorage.getItem(cacheKey);
                      if (stored) {
                        const parsed = JSON.parse(stored) as CachedGSCData;
                        if (parsed.site === selectedSite && 
                            parsed.startDate === startDate && 
                            parsed.endDate === endDate && 
                            parsed.device === device) {
                          setData(parsed);
                          setCachedQueriesData(parsed);
                        }
                      }
                    } catch (error) {
                      console.error('Error loading cached queries:', error);
                    }
                  }
                  // Don't auto-fetch - only fetch when Load Data is clicked
                }}
                className={`px-4 py-3 text-sm font-medium transition-colors flex items-center space-x-2 ${
                  activeTab === 'queries'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <FontAwesomeIcon icon={faMagnifyingGlass} />
                <span>Keywords ({topQueries.length})</span>
              </button>
              <button
                onClick={() => {
                  setActiveTab('pages');
                  // Restore cached data immediately if available
                  if (cachedPagesData && 
                      cachedPagesData.site === selectedSite &&
                      cachedPagesData.startDate === startDate &&
                      cachedPagesData.endDate === endDate &&
                      cachedPagesData.device === device) {
                    setData(cachedPagesData);
                  } else {
                    // Try localStorage
                    try {
                      const cacheKey = `gsc_cached_pages_${selectedSite}_${startDate}_${endDate}_${device}`;
                      const stored = localStorage.getItem(cacheKey);
                      if (stored) {
                        const parsed = JSON.parse(stored) as CachedGSCData;
                        if (parsed.site === selectedSite && 
                            parsed.startDate === startDate && 
                            parsed.endDate === endDate && 
                            parsed.device === device) {
                          setData(parsed);
                          setCachedPagesData(parsed);
                        }
                      }
                    } catch (error) {
                      console.error('Error loading cached pages:', error);
                    }
                  }
                  // Don't auto-fetch - only fetch when Load Data is clicked
                }}
                className={`px-4 py-3 text-sm font-medium transition-colors flex items-center space-x-2 ${
                  activeTab === 'pages'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <FontAwesomeIcon icon={faMapPin} />
                <span>Pages ({topPages.length})</span>
              </button>
              <button
                onClick={() => {
                  setActiveTab('country');
                  // Restore cached data immediately if available
                  if (cachedCountryData && 
                      cachedCountryData.site === selectedSite &&
                      cachedCountryData.startDate === startDate &&
                      cachedCountryData.endDate === endDate &&
                      cachedCountryData.device === device) {
                    setData(cachedCountryData);
                  } else {
                    // Try localStorage
                    try {
                      const cacheKey = `gsc_cached_country_${selectedSite}_${startDate}_${endDate}_${device}`;
                      const stored = localStorage.getItem(cacheKey);
                      if (stored) {
                        const parsed = JSON.parse(stored) as CachedGSCData;
                        if (parsed.site === selectedSite && 
                            parsed.startDate === startDate && 
                            parsed.endDate === endDate && 
                            parsed.device === device) {
                          setData(parsed);
                          setCachedCountryData(parsed);
                        }
                      }
                    } catch (error) {
                      console.error('Error loading cached country:', error);
                    }
                  }
                  // Don't auto-fetch - only fetch when Load Data is clicked
                }}
                className={`px-4 py-3 text-sm font-medium transition-colors flex items-center space-x-2 ${
                  activeTab === 'country'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <FontAwesomeIcon icon={faGlobe} />
                <span>Countries ({topCountries.length})</span>
              </button>
            </div>
          </div>

          {/* Table Component */}
          {currentTableData.length > 0 ? (
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between px-4 pt-4 mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  {activeTab === 'queries' ? 'Top Keywords' : 'Top Pages'}
                </h3>
                <div className="flex items-center space-x-3">
                  <Button
                    onClick={downloadQueryData}
                    variant="default"
                    size="sm"
                    className="flex items-center space-x-2"
                  >
                    <FontAwesomeIcon icon={faDownload} />
                    <span>Download CSV</span>
                  </Button>
                  <Button
                    onClick={getQueryInsights}
                    disabled={insightsLoading.queries}
                    variant="default"
                    size="sm"
                    className="flex items-center space-x-2 bg-green-600 hover:bg-green-700"
                  >
                    {insightsLoading.queries && <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>}
                    <FontAwesomeIcon icon={faBrain} />
                    <span>{insightsLoading.queries ? 'Analyzing...' : 'Get Insights'}</span>
                  </Button>
                </div>
              </div>
              
              <DataTable
                columns={activeTab === 'queries' ? queryColumns : activeTab === 'pages' ? pageColumns : countryColumns}
                data={currentTableData as GSCDataRow[]}
                showColumnToggle={true}
                showPagination={true}
                showSearch={false}
                showAdvancedFilters={true}
                pageSize={20}
                className="bg-white"
              />
              
              {/* Query Insights Display */}
              {showInsights.queries && insights.queries && (
                <div className="mt-6 bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-lg border border-green-200">
                  <div className="flex justify-between items-start mb-4">
                    <h4 className="text-lg font-medium text-green-900">AI Analysis</h4>
                    <Button
                      onClick={() => setShowInsights({...showInsights, queries: false})}
                      variant="ghost"
                      size="icon"
                      className="text-green-600 hover:text-green-800"
                    >
                      ×
                    </Button>
                  </div>
                  <div className="prose prose-green max-w-none text-green-800">
                    <ReactMarkdown
                      components={{
                        h1: ({children}) => <h1 className="text-xl font-bold mb-3 text-green-900">{children}</h1>,
                        h2: ({children}) => <h2 className="text-lg font-semibold mb-2 text-green-900">{children}</h2>,
                        h3: ({children}) => <h3 className="text-base font-medium mb-2 text-green-800">{children}</h3>,
                        p: ({children}) => <p className="mb-3 text-green-800">{children}</p>,
                        ul: ({children}) => <ul className="list-disc list-inside mb-3 space-y-1">{children}</ul>,
                        ol: ({children}) => <ol className="list-decimal list-inside mb-3 space-y-1">{children}</ol>,
                        li: ({children}) => <li className="text-green-800">{children}</li>,
                        strong: ({children}) => <strong className="font-semibold text-green-900">{children}</strong>,
                        em: ({children}) => <em className="italic">{children}</em>,
                      }}
                    >
                      {insights.queries}
                    </ReactMarkdown>
                  </div>
                </div>
              )}
              
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-center py-8">
                <div className="text-4xl mb-4 text-gray-400">
                  <FontAwesomeIcon icon={activeTab === 'queries' ? faMagnifyingGlass : faMapPin} />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No {activeTab === 'queries' ? 'Queries' : 'Pages'} Data
                </h3>
                <p className="text-gray-600">
                  {activeTab === 'queries' 
                    ? 'No query data available for the selected period or filters.'
                    : 'No page data available for the selected period or filters.'}
                </p>
                <Button
                  onClick={() => {
                    setCachedQueriesData(null);
                    setCachedPagesData(null);
                    fetchData();
                  }}
                  disabled={!selectedSite}
                  variant="default"
                  className="mt-4"
                >
                  Refresh Data
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Empty State */}
      {!data && !performanceLoading && !error && (
        <div className="bg-white rounded-lg shadow p-6 text-center py-12">
          <div className="text-6xl mb-4 text-gray-400">
            <FontAwesomeIcon icon={faChartLine} />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Ready to Analyze!</h3>
          <p className="text-gray-600 mb-6">
            Select a website and date range to view your GSC analytics with daily trends
          </p>
          <Button 
            onClick={() => fetchData()} 
            disabled={!selectedSite}
            variant="default"
            size="lg"
          >
            Load Data
          </Button>
        </div>
      )}
    </div>
  );
}
