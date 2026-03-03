'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Chart from 'chart.js/auto';
import { useData } from '@/contexts/DataContext';

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

interface SiteOverviewData {
  site: string;
  data: GSCData | null;
  timeSeriesData: Array<{
    date: string;
    clicks: number;
    impressions: number;
    ctr: number;
    position: number;
  }>;
}

export default function OverviewPage() {
  const {
    sites,
    overviewData,
    setOverviewData,
    topSites,
    setTopSites,
    overviewPeriod,
    setOverviewPeriod,
    overviewDevice,
    setOverviewDevice,
    overviewSecondaryMetric,
    setOverviewSecondaryMetric,
    overviewLoading,
    setOverviewLoading,
    error,
    setError
  } = useData();
  
  // Refs for chart canvases
  const overviewChartRefs = useRef<{[key: string]: HTMLCanvasElement | null}>({});
  const overviewChartInstances = useRef<{[key: string]: Chart}>({});

  // Date range options
  const dateRangeOptions = [
    { value: '7', label: '7 days' },
    { value: '30', label: '30 days' },
    { value: '90', label: '90 days' },
    { value: '180', label: '6 months' },
    { value: '365', label: '1 year' },
    { value: '480', label: '16 months' }
  ];

  // Device options
  const deviceOptions = [
    { value: 'all', label: 'All Devices' },
    { value: 'desktop', label: 'Desktop' },
    { value: 'mobile', label: 'Mobile' },
    { value: 'tablet', label: 'Tablet' }
  ];

  // Load overview sites from settings, don't auto-select
  useEffect(() => {
    if (sites.length > 0 && topSites.length === 0) {
      // Check if there are saved overview sites in settings
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
  }, [sites, topSites, setTopSites]);

  // Don't auto-fetch overview data - only fetch when user clicks "Refresh Data"
  // Data should persist when navigating between pages
  // Removed auto-fetch useEffect - data will only load when handleRefreshData is called

  // Update overview charts
  useEffect(() => {
    if (overviewData.length > 0) {
      createOverviewCharts();
    }
    
    return () => {
      Object.values(overviewChartInstances.current).forEach(chart => {
        if (chart) chart.destroy();
      });
      overviewChartInstances.current = {};
    };
  }, [overviewData, overviewSecondaryMetric]);

  const fetchOverviewData = async () => {
    if (topSites.length === 0) return;
    
    setOverviewLoading(true);
    const newOverviewData: any[] = [];

    try {
      for (const site of topSites) {
        const daysBack = parseInt(overviewPeriod);
        const startDateOverview = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        const endDateOverview = new Date().toISOString().split('T')[0];

        const params = new URLSearchParams({
          siteUrl: site,
          startDate: startDateOverview,
          endDate: endDateOverview,
          dimensions: 'date',
          fetchAll: 'false'
        });

        if (overviewDevice !== 'all') {
          params.append('device', overviewDevice);
        }

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
          newOverviewData.push({
            site,
            data: null,
            timeSeriesData: [],
            error: errorMessage
          });
          continue;
        }
        
        const result = await response.json();
        
        if (!result.error) {
          const gscData = result as GSCData;
          const timeSeriesData = processTimeSeriesData(gscData);
          
          newOverviewData.push({
            site,
            data: gscData,
            timeSeriesData
          });
        } else {
          newOverviewData.push({
            site,
            data: null,
            timeSeriesData: []
          });
        }
      }
      
      setOverviewData(newOverviewData);
      setError(''); // Clear any previous errors
    } catch (error) {
      console.error('Error fetching overview data:', error);
      setError('Failed to fetch data. Please check if the backend is running.');
    } finally {
      setOverviewLoading(false);
    }
  };

  const processTimeSeriesData = (gscData: GSCData) => {
    if (!gscData.rows) return [];

    const dateMap = new Map<string, any>();
    
    gscData.rows.forEach((row: GSCRow) => {
      const date = row.keys?.[0] || 'Unknown';
      
      if (dateMap.has(date)) {
        const existing = dateMap.get(date)!;
        existing.clicks += row.clicks;
        existing.impressions += row.impressions;
        const totalImpressions = existing.impressions + row.impressions;
        existing.ctr = totalImpressions > 0 ? 
          ((existing.ctr * existing.impressions) + (row.ctr * row.impressions)) / totalImpressions : 0;
        existing.position = totalImpressions > 0 ?
          ((existing.position * existing.impressions) + (row.position * row.impressions)) / totalImpressions : 0;
      } else {
        dateMap.set(date, {
          date,
          clicks: row.clicks,
          impressions: row.impressions,
          ctr: row.ctr,
          position: row.position
        });
      }
    });

    return Array.from(dateMap.values())
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  };

  const createOverviewCharts = () => {
    overviewData.forEach((siteData, index) => {
      if (!siteData.timeSeriesData.length) return;
      
      const chartKey = `overview-${index}`;
      const canvasRef = overviewChartRefs.current[chartKey];
      
      if (!canvasRef) return;

      // Destroy existing chart
      if (overviewChartInstances.current[chartKey]) {
        overviewChartInstances.current[chartKey].destroy();
      }

      const ctx = canvasRef.getContext('2d');
      if (!ctx) return;

      const labels = siteData.timeSeriesData.map((item: any) => {
        const date = new Date(item.date);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      });

      const datasets: any[] = [
        {
          label: 'Clicks',
          data: siteData.timeSeriesData.map((item: any) => item.clicks),
          borderColor: '#3B82F6',
          backgroundColor: '#3B82F620',
          borderWidth: 2,
          fill: false,
          tension: 0.4,
          pointRadius: 2,
          pointHoverRadius: 4,
          yAxisID: 'y'
        },
        {
          label: 'Impressions',
          data: siteData.timeSeriesData.map((item: any) => item.impressions),
          borderColor: '#10B981',
          backgroundColor: '#10B98120',
          borderWidth: 2,
          fill: false,
          tension: 0.4,
          pointRadius: 2,
          pointHoverRadius: 4,
          yAxisID: 'y1'
        }
      ];

      // Add secondary metric if selected
      if (overviewSecondaryMetric === 'ctr') {
        datasets.push({
          label: 'CTR (%)',
          data: siteData.timeSeriesData.map((item: any) => item.ctr * 100),
          borderColor: '#F59E0B',
          backgroundColor: '#F59E0B20',
          borderWidth: 1,
          fill: false,
          tension: 0.4,
          pointRadius: 1,
          pointHoverRadius: 3,
          borderDash: [5, 5]
        });
      } else if (overviewSecondaryMetric === 'position') {
        datasets.push({
          label: 'Position',
          data: siteData.timeSeriesData.map((item: any) => item.position),
          borderColor: '#EF4444',
          backgroundColor: '#EF444420',
          borderWidth: 1,
          fill: false,
          tension: 0.4,
          pointRadius: 1,
          pointHoverRadius: 3,
          borderDash: [5, 5]
        });
      }

      overviewChartInstances.current[chartKey] = new Chart(ctx, {
        type: 'line',
        data: {
          labels: labels,
          datasets: datasets
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: false
            },
            title: {
              display: false
            }
          },
          scales: {
            x: {
              title: {
                display: false
              },
              grid: {
                color: '#E5E7EB'
              }
            },
            y: {
              type: 'linear',
              display: true,
              position: 'left',
              title: {
                display: true,
                text: 'Clicks',
                color: '#3B82F6'
              },
              grid: {
                color: '#E5E7EB'
              }
            },
            y1: {
              type: 'linear',
              display: true,
              position: 'right',
              title: {
                display: true,
                text: 'Impressions',
                color: '#10B981'
              },
              grid: {
                drawOnChartArea: false
              }
            }
          },
          interaction: {
            intersect: false,
            mode: 'index'
          }
        }
      });
    });
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toLocaleString();
  };

  const getSiteName = (url: string): string => {
    // Return the full URL without https:// prefix, but keep the path
    return url.replace('https://', '').replace('http://', '');
  };

  // Manual refresh function
  const handleRefreshData = () => {
    fetchOverviewData();
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                📈 Sites Overview
              </h1>
              <p className="text-gray-600">
                Multi-site performance tracking and trend analysis
              </p>
            </div>
            <button
              onClick={handleRefreshData}
              disabled={overviewLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {overviewLoading ? 'Loading...' : '🔄 Refresh Data'}
            </button>
          </div>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Overview Controls</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="time-period" className="block text-sm font-medium text-gray-700 mb-2">
                Time Period
              </label>
              <select id="time-period" className="w-full" onChange={(e) => setOverviewPeriod(e.target.value)} value={overviewPeriod}>
                {dateRangeOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="device-type" className="block text-sm font-medium text-gray-700 mb-2">
                Device Type
              </label>
              <select id="device-type" className="w-full" onChange={(e) => setOverviewDevice(e.target.value)} value={overviewDevice}>
                {deviceOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="secondary-metric" className="block text-sm font-medium text-gray-700 mb-2">
                Secondary Metric
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => setOverviewSecondaryMetric('none')}
                  className={`px-3 py-2 text-sm rounded ${overviewSecondaryMetric === 'none' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
                >
                  None
                </button>
                <button
                  onClick={() => setOverviewSecondaryMetric('ctr')}
                  className={`px-3 py-2 text-sm rounded ${overviewSecondaryMetric === 'ctr' ? 'bg-orange-600 text-white' : 'bg-gray-200 text-gray-700'}`}
                >
                  CTR
                </button>
                <button
                  onClick={() => setOverviewSecondaryMetric('position')}
                  className={`px-3 py-2 text-sm rounded ${overviewSecondaryMetric === 'position' ? 'bg-red-600 text-white' : 'bg-gray-200 text-gray-700'}`}
                >
                  Position
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded p-4 mb-6">
            <h3 className="text-red-800 font-medium">Error</h3>
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {/* Loading State */}
        {overviewLoading && topSites.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded p-8 text-center mb-6">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-blue-800">Loading overview data for top {topSites.length} sites...</p>
          </div>
        )}

        {/* No Sites Selected Message */}
        {topSites.length === 0 && !overviewLoading && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-8 text-center mb-6">
            <div className="text-4xl mb-4">📋</div>
            <h3 className="text-xl font-semibold text-yellow-900 mb-2">
              No Sites Selected
            </h3>
            <p className="text-yellow-800 mb-4">
              Please select sites in Settings to view their overview data.
            </p>
            <Link 
              href="/settings"
              className="inline-flex items-center space-x-2 px-6 py-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors font-medium"
            >
              <span>Go to Settings</span>
              <span>→</span>
            </Link>
          </div>
        )}

        {/* Site Selection Info */}
        {topSites.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded p-4 mb-6">
            <h3 className="text-blue-800 font-medium mb-3">
              📊 Showing Top {topSites.length} Sites
              {overviewData.length > 0 && (
                <span className="ml-2 text-sm font-normal">(Data cached - change settings or click refresh to update)</span>
              )}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 text-sm text-blue-700">
              {topSites.map((site, index) => (
                <div key={site} className="bg-white rounded p-2 border border-blue-200">
                  <span className="font-medium">{index + 1}.</span> {getSiteName(site)}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Overview Charts - Full Width */}
        <div className="grid grid-cols-1 gap-6">
          {overviewData.map((siteData, index) => (
            <div key={index} className="bg-white rounded-lg shadow p-6">
              {/* Site Header with Stats */}
              <div className="mb-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-3" title={siteData.site}>
                  {getSiteName(siteData.site)}
                </h3>
                {siteData.data && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <div className="text-blue-600 font-medium text-sm">Total Clicks</div>
                      <div className="text-lg font-bold text-blue-800">{formatNumber(siteData.data.totalClicks)}</div>
                    </div>
                    <div className="bg-green-50 p-3 rounded-lg">
                      <div className="text-green-600 font-medium text-sm">Total Impressions</div>
                      <div className="text-lg font-bold text-green-800">{formatNumber(siteData.data.totalImpressions)}</div>
                    </div>
                    <div className="bg-orange-50 p-3 rounded-lg">
                      <div className="text-orange-600 font-medium text-sm">Average CTR</div>
                      <div className="text-lg font-bold text-orange-800">{(siteData.data.avgCtr * 100).toFixed(2)}%</div>
                    </div>
                    <div className="bg-red-50 p-3 rounded-lg">
                      <div className="text-red-600 font-medium text-sm">Average Position</div>
                      <div className="text-lg font-bold text-red-800">{siteData.data.avgPosition.toFixed(1)}</div>
                    </div>
                  </div>
                )}
              </div>

              {/* Chart - Full Width */}
              <div className="h-80">
                {siteData.timeSeriesData.length > 0 ? (
                  <canvas
                    ref={(el) => {
                      overviewChartRefs.current[`overview-${index}`] = el;
                    }}
                    className="w-full h-full"
                  />
                ) : (
                  <div className="h-full flex items-center justify-center text-gray-400">
                    <div className="text-center">
                      <div className="text-2xl mb-2">📊</div>
                      <div>No data available for this time period</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Legend and Instructions */}
        {overviewData.length > 0 && (
          <div className="mt-6 bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">📖 Chart Legend & Instructions</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Chart Elements:</h4>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li className="flex items-center gap-2">
                    <div className="w-4 h-0.5 bg-blue-500"></div>
                    <span><strong>Blue Line:</strong> Clicks (left axis)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-4 h-0.5 bg-green-500"></div>
                    <span><strong>Green Line:</strong> Impressions (right axis)</span>
                  </li>
                  {overviewSecondaryMetric === 'ctr' && (
                    <li className="flex items-center gap-2">
                      <div className="w-4 h-0.5 bg-orange-500 border-dashed border-t"></div>
                      <span><strong>Orange Dashed:</strong> CTR % (no axis)</span>
                    </li>
                  )}
                  {overviewSecondaryMetric === 'position' && (
                    <li className="flex items-center gap-2">
                      <div className="w-4 h-0.5 bg-red-500 border-dashed border-t"></div>
                      <span><strong>Red Dashed:</strong> Average Position (no axis)</span>
                    </li>
                  )}
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-3">How to Use:</h4>
                <ul className="space-y-1 text-sm text-gray-700">
                  <li>• <strong>Time Period:</strong> Adjust to view different date ranges (up to 16 months)</li>
                  <li>• <strong>Device Filter:</strong> Focus on specific device performance</li>
                  <li>• <strong>Secondary Metrics:</strong> Overlay CTR or Position trends</li>
                  <li>• <strong>Hover:</strong> See exact values at any data point</li>
                  <li>• <strong>Dual Axis:</strong> Compare clicks vs impressions with proper scaling</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 