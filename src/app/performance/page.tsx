'use client';

import { useState, useEffect, useRef } from 'react';
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

interface ProcessedDataItem {
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
  query: string;
}

export default function PerformancePage() {
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
    setError
  } = useData();

  const [data, setData] = useState<GSCData | null>(null);
  
  // Refs for chart canvases
  const chartRefs = useRef<{[key: string]: HTMLCanvasElement | null}>({});
  const chartInstances = useRef<{[key: string]: Chart}>({});

  // Metrics for correlation matrix
  const metrics = ['clicks', 'impressions', 'ctr', 'position'] as const;
  const metricLabels: {[key: string]: string} = {
    clicks: 'Clicks',
    impressions: 'Impressions', 
    ctr: 'CTR (%)',
    position: 'Avg Position'
  };

  // Load cached performance data if available and matches current settings
  useEffect(() => {
    if (performanceData && 
        performanceData.site === selectedSite &&
        performanceData.startDate === startDate &&
        performanceData.endDate === endDate &&
        performanceData.dimensions === 'query' &&
        performanceData.device === device) {
      // Use cached data
      setData(performanceData.data);
    }
  }, [performanceData, selectedSite, startDate, endDate, device]);

  // Update charts when data changes
  useEffect(() => {
    if (data && data.rows) {
      createCorrelationMatrix();
    }
    
    // Cleanup function
    return () => {
      Object.values(chartInstances.current).forEach(chart => {
        if (chart) chart.destroy();
      });
      chartInstances.current = {};
    };
  }, [data]);

  const fetchData = async () => {
    if (!selectedSite) return;
    
    setPerformanceLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({
        siteUrl: selectedSite,
        startDate: startDate,
        endDate: endDate,
        dimensions: 'query',
        fetchAll: 'true'
      });

      if (device !== 'all') {
        params.append('device', device);
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
        setError(errorMessage);
        return;
      }
      
      const result = await response.json();
      
      if (result.error) {
        setError(result.error);
      } else {
        setData(result as GSCData);
        
        // Store in shared context for caching
        setPerformanceData({
          site: selectedSite,
          startDate: startDate,
          endDate: endDate,
          dimensions: 'query',
          device: device,
          data: result,
          timeSeriesData: []
        });
        
        setError(''); // Clear any previous errors
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to fetch data. Backend may not be running on port 5001.');
    } finally {
      setPerformanceLoading(false);
    }
  };

  // Manual refresh function
  const handleRefreshData = () => {
    fetchData();
  };

  const createCorrelationMatrix = () => {
    if (!data || !data.rows) return;

    // Process data for correlation analysis
    const processedData: ProcessedDataItem[] = data.rows.map((row: GSCRow) => ({
      clicks: row.clicks || 0,
      impressions: row.impressions || 0,
      ctr: (row.ctr || 0) * 100, // Convert to percentage
      position: row.position || 0,
      query: row.keys?.[0] || 'Unknown'
    }));

    // Filter out rows with zero values for better correlation visualization
    const filteredData = processedData.filter(item => 
      item.clicks > 0 || item.impressions > 0
    );

    console.log(`Processing ${filteredData.length} data points for correlation matrix`);

    // Create scatter plots for each metric pair
    metrics.forEach((xMetric, xIndex) => {
      metrics.forEach((yMetric, yIndex) => {
        const chartKey = `${xMetric}-${yMetric}`;
        const canvasRef = chartRefs.current[chartKey];
        
        if (!canvasRef) return;

        // Destroy existing chart if exists
        if (chartInstances.current[chartKey]) {
          chartInstances.current[chartKey].destroy();
        }

        const ctx = canvasRef.getContext('2d');
        if (!ctx) return;
        
        // Prepare data for scatter plot
        const chartData = filteredData.map(item => ({
          x: item[xMetric],
          y: item[yMetric]
        }));

        // Calculate correlation coefficient
        const correlation = calculateCorrelation(
          filteredData.map(item => item[xMetric]),
          filteredData.map(item => item[yMetric])
        );

        // Determine point color based on correlation strength
        const getPointColor = () => {
          const absCorr = Math.abs(correlation);
          if (absCorr >= 0.7) return correlation > 0 ? '#10B981' : '#EF4444';
          if (absCorr >= 0.4) return correlation > 0 ? '#F59E0B' : '#F97316';
          return '#6B7280';
        };

        chartInstances.current[chartKey] = new Chart(ctx, {
          type: 'scatter',
          data: {
            datasets: [{
              data: chartData,
              backgroundColor: getPointColor(),
              borderColor: getPointColor(),
              pointRadius: xMetric === yMetric ? 0 : 3,
              pointHoverRadius: 5,
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
              legend: {
                display: false
              },
              title: {
                display: true,
                text: xMetric === yMetric 
                  ? `${metricLabels[xMetric]}`
                  : `r = ${correlation.toFixed(3)}`,
                font: {
                  size: 12,
                  weight: xMetric === yMetric ? 'bold' : 'normal'
                },
                color: xMetric === yMetric ? '#1F2937' : getPointColor()
              },
              tooltip: {
                callbacks: {
                  label: function(context: any) {
                    const dataIndex = context.dataIndex;
                    const item = filteredData[dataIndex];
                    return [
                      `Query: ${item.query.substring(0, 30)}...`,
                      `${metricLabels[xMetric]}: ${context.parsed.x}`,
                      `${metricLabels[yMetric]}: ${context.parsed.y}`
                    ];
                  }
                }
              }
            },
            scales: {
              x: {
                display: xIndex === 3,
                title: {
                  display: xIndex === 3,
                  text: metricLabels[xMetric]
                },
                grid: {
                  display: false
                }
              },
              y: {
                display: yIndex === 0,
                title: {
                  display: yIndex === 0,
                  text: metricLabels[yMetric]
                },
                grid: {
                  display: false
                }
              }
            },
            interaction: {
              intersect: false
            }
          }
        });
      });
    });
  };

  // Calculate Pearson correlation coefficient
  const calculateCorrelation = (x: number[], y: number[]): number => {
    if (x.length !== y.length || x.length === 0) return 0;
    
    const n = x.length;
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);
    const sumY2 = y.reduce((sum, yi) => sum + yi * yi, 0);
    
    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
    
    return denominator === 0 ? 0 : numerator / denominator;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                📊 Performance Correlation Matrix
              </h1>
              <p className="text-gray-600">
                Analyze relationships between GSC metrics with correlation scatter plots
              </p>
              {performanceData && performanceData.dimensions === 'query' && (
                <div className="mt-2 flex items-center space-x-2 text-sm text-blue-600">
                  <span>💾</span>
                  <span>Data cached - showing results for {performanceData.site} from {performanceData.startDate} to {performanceData.endDate}</span>
                </div>
              )}
            </div>
            <button
              onClick={handleRefreshData}
              disabled={performanceLoading || !selectedSite}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center space-x-2 transition-colors"
            >
              <span>🔄</span>
              <span>{performanceLoading ? 'Loading...' : 'Refresh Data'}</span>
            </button>
          </div>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Controls</h2>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <label htmlFor="site-select" className="block text-sm font-medium text-gray-700 mb-2">
                Website ({sites.length} available)
              </label>
              <select 
                id="site-select" 
                onChange={(e) => setSelectedSite(e.target.value)} 
                value={selectedSite}
                className="w-full p-2 border rounded"
              >
                <option value="">Select a site...</option>
                {sites.map((site) => (
                  <option key={site} value={site}>
                    {site.replace('https://', '').replace('http://', '')}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="device-select" className="block text-sm font-medium text-gray-700 mb-2">
                Device Type
              </label>
              <select 
                id="device-select" 
                onChange={(e) => setDevice(e.target.value)} 
                value={device}
                className="w-full p-2 border rounded"
              >
                <option value="all">All Devices</option>
                <option value="desktop">Desktop</option>
                <option value="mobile">Mobile</option>
                <option value="tablet">Tablet</option>
              </select>
            </div>
            <div>
              <label htmlFor="start-date" className="block text-sm font-medium text-gray-700 mb-2">
                Start Date
              </label>
              <input
                type="date" 
                id="start-date" 
                value={startDate} 
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full p-2 border rounded"
              />
            </div>
            <div>
              <label htmlFor="end-date" className="block text-sm font-medium text-gray-700 mb-2">
                End Date
              </label>
              <input
                type="date" 
                id="end-date" 
                value={endDate} 
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full p-2 border rounded"
              />
            </div>
            <div className="flex items-end">
              <button 
                onClick={fetchData} 
                disabled={performanceLoading || !selectedSite}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-300"
              >
                {performanceLoading ? 'Loading...' : 'Generate Matrix'}
              </button>
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
        {performanceLoading && (
          <div className="bg-blue-50 border border-blue-200 rounded p-8 text-center mb-6">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-blue-800">Fetching comprehensive data for correlation analysis...</p>
          </div>
        )}

        {/* Correlation Matrix */}
        {data && data.rows && (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">Correlation Matrix</h2>
              <div className="text-sm text-gray-600">
                Data points: {data.rows.length.toLocaleString()}
              </div>
            </div>
            
            {/* Legend */}
            <div className="mb-6 p-4 bg-gray-50 rounded">
              <h3 className="font-medium mb-2">Correlation Strength:</h3>
              <div className="flex flex-wrap gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span>Strong Positive (≥0.7)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <span>Medium Positive (0.4-0.7)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
                  <span>Weak (-0.4 to 0.4)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                  <span>Medium Negative (-0.7 to -0.4)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <span>Strong Negative (≤-0.7)</span>
                </div>
              </div>
            </div>

            {/* 4x4 Matrix Grid */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                Correlation Matrix: How GSC Metrics Relate to Each Other
              </h3>
              <p className="text-sm text-gray-600 mb-6">
                Each chart shows the relationship between two metrics. The diagonal shows metric distributions, 
                while off-diagonal charts show correlations (r-values).
              </p>
              
              {/* Matrix with headers */}
              <div className="relative">
                {/* Column headers (X-axis) */}
                <div className="grid grid-cols-5 gap-4 mb-2">
                  <div></div>
                  {metrics.map((metric) => (
                    <div key={`col-header-${metric}`} className="text-center">
                      <div className="bg-blue-100 px-2 py-1 rounded text-sm font-medium text-blue-800">
                        {metricLabels[metric]}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">X-axis →</div>
                    </div>
                  ))}
                </div>
                
                {/* Matrix rows with row headers */}
                {metrics.map((yMetric, yIndex) => (
                  <div key={`row-${yMetric}`} className="grid grid-cols-5 gap-4 mb-4">
                    {/* Row header (Y-axis) */}
                    <div className="flex items-center justify-center">
                      <div className="bg-green-100 px-2 py-1 rounded text-sm font-medium text-green-800 text-center min-h-[48px] flex flex-col justify-center">
                        <div>{metricLabels[yMetric]}</div>
                        <div className="text-xs text-gray-500">↑ Y-axis</div>
                      </div>
                    </div>
                    
                    {/* Chart cells */}
                    {metrics.map((xMetric, xIndex) => (
                      <div key={`${xMetric}-${yMetric}`} className="relative">
                        <canvas
                          ref={(el) => {
                            chartRefs.current[`${xMetric}-${yMetric}`] = el;
                          }}
                          className="w-full h-80 border border-gray-200 rounded"
                        />
                        {/* Chart description overlay */}
                        <div className="absolute top-1 right-1 bg-white bg-opacity-90 px-1 py-0.5 rounded text-xs text-gray-600">
                          {xMetric === yMetric ? 
                            'Distribution' : 
                            `${metricLabels[yMetric]} vs ${metricLabels[xMetric]}`
                          }
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>

            {/* Insights */}
            {data && (
              <div className="mt-6 space-y-4">
                {/* How to Read This Matrix */}
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <h3 className="font-medium text-blue-900 mb-3">📖 How to Read This Matrix</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800">
                    <div>
                      <h4 className="font-medium mb-2">🔍 Chart Types:</h4>
                      <ul className="space-y-1">
                        <li>• <strong>Diagonal charts:</strong> Show individual metric distributions</li>
                        <li>• <strong>Off-diagonal charts:</strong> Show correlations between different metrics</li>
                        <li>• <strong>Scatter points:</strong> Each dot represents one search query</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">📊 Reading Correlations:</h4>
                      <ul className="space-y-1">
                        <li>• <strong>r = 1.0:</strong> Perfect positive correlation</li>
                        <li>• <strong>r = 0.0:</strong> No correlation</li>
                        <li>• <strong>r = -1.0:</strong> Perfect negative correlation</li>
                        <li>• <strong>Colors:</strong> Indicate correlation strength (see legend above)</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Quick Insights */}
                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <h3 className="font-medium text-green-900 mb-2">💡 What to Look For</h3>
                  <ul className="text-sm text-green-800 space-y-1">
                    <li>• <strong>Position correlations:</strong> Usually negative (lower position = better = more clicks/impressions)</li>
                    <li>• <strong>CTR vs Clicks:</strong> Often positive (higher CTR typically leads to more clicks)</li>
                    <li>• <strong>Impressions vs Position:</strong> Usually negative (better positions get more visibility)</li>
                    <li>• <strong>Strong correlations (|r| &gt;= 0.7):</strong> Indicate predictable relationships between metrics</li>
                    <li>• <strong>Weak correlations (|r| &lt; 0.4):</strong> Suggest metrics behave independently</li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 