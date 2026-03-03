'use client';

import { useState, useEffect, useRef } from 'react';
import { useData } from '@/contexts/DataContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faExclamationTriangle, faTrophy, faArrowDown } from '@fortawesome/free-solid-svg-icons';
import Chart from 'chart.js/auto';

interface WinnerLoserItem {
  name: string;
  firstHalfClicks: number;
  secondHalfClicks: number;
  change: number;
  changePercent: number;
}

export default function TrafficInsightsPage() {
  const {
    sites,
    selectedSite,
    setSelectedSite,
    device,
    error,
    setError,
    fetchSites,
    winnersLosersData,
    setWinnersLosersData,
    winnersLosersLoading,
    setWinnersLosersLoading
  } = useData();

  // Date range for winners/losers analysis
  // Default end date is 3 days ago to account for API lag
  const [winnersLosersStartDate, setWinnersLosersStartDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 33); // 30 days + 3 days buffer
    return date.toISOString().split('T')[0];
  });
  const [winnersLosersEndDate, setWinnersLosersEndDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 3); // 3 days ago to account for API lag
    return date.toISOString().split('T')[0];
  });

  const [dateRangePreset, setDateRangePreset] = useState<string>('30days');

  // Chart refs
  const contributionChartRef = useRef<HTMLCanvasElement | null>(null);
  const contributionChartInstance = useRef<Chart | null>(null);

  // Fetch sites on mount
  useEffect(() => {
    fetchSites();
  }, [fetchSites]);

  // Create contribution chart when data changes
  useEffect(() => {
    if (winnersLosersData && winnersLosersData.queries) {
      createContributionChart();
    }

    return () => {
      if (contributionChartInstance.current) {
        contributionChartInstance.current.destroy();
        contributionChartInstance.current = null;
      }
    };
  }, [winnersLosersData]);

  const createContributionChart = () => {
    if (!winnersLosersData || !contributionChartRef.current) return;

    // Destroy existing chart
    if (contributionChartInstance.current) {
      contributionChartInstance.current.destroy();
    }

    // Separate winners and losers
    const winners = winnersLosersData.queries.winners.map(item => ({ ...item, isWinner: true }));
    const losers = winnersLosersData.queries.losers.map(item => ({ ...item, isWinner: false }));

    // Sort winners by change (highest first) - these will be at the top
    const sortedWinners = winners
      .sort((a, b) => b.changePercent - a.changePercent)
      .slice(0, 20); // Top 20 winners

    // Sort losers by change (lowest first, most negative) - these will be at the bottom
    const sortedLosers = losers
      .sort((a, b) => a.changePercent - b.changePercent)
      .slice(0, 20); // Top 20 losers

    // Combine: winners first (positive values grouped at top), then losers (negative values grouped at bottom)
    // For horizontal bar chart: first item in array appears at top of chart
    // Winners are sorted descending (highest first), so highest positive will be at top
    // Losers are sorted ascending (lowest first), so lowest negative will be at bottom
    const chartData = [...sortedWinners, ...sortedLosers];

    const ctx = contributionChartRef.current.getContext('2d');
    if (!ctx) return;

    contributionChartInstance.current = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: chartData.map(item => item.name),
        datasets: [{
          label: '% Change',
          data: chartData.map(item => item.changePercent),
          backgroundColor: chartData.map(item => 
            item.changePercent >= 0 
              ? 'rgba(34, 197, 94, 0.7)' // Green for positive
              : 'rgba(239, 68, 68, 0.7)'  // Red for negative
          ),
          borderColor: chartData.map(item => 
            item.changePercent >= 0 
              ? 'rgba(34, 197, 94, 1)'
              : 'rgba(239, 68, 68, 1)'
          ),
          borderWidth: 1
        }]
      },
      options: {
        indexAxis: 'y', // Horizontal bar chart
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: 'Keyword Contribution to Click Change',
            font: {
              size: 18,
              weight: 'bold'
            },
            padding: {
              top: 10,
              bottom: 20
            }
          },
          legend: {
            display: false
          },
          tooltip: {
            callbacks: {
              label: function(context: any) {
                const item = chartData[context.dataIndex];
                return [
                  `Keyword: ${item.name}`,
                  `% Change: ${item.changePercent >= 0 ? '+' : ''}${item.changePercent.toFixed(1)}%`,
                  `Clicks Change: ${item.change >= 0 ? '+' : ''}${item.change.toLocaleString()}`,
                  `Start Date Clicks: ${item.firstHalfClicks.toLocaleString()}`,
                  `End Date Clicks: ${item.secondHalfClicks.toLocaleString()}`
                ];
              }
            }
          }
        },
        scales: {
          x: {
            title: {
              display: true,
              text: 'Click Change (%)',
              font: {
                size: 14,
                weight: 'bold'
              }
            },
            grid: {
              color: function(context: any) {
                // Highlight the zero line
                if (context.tick.value === 0) {
                  return 'rgba(0, 0, 0, 0.5)';
                }
                return 'rgba(0, 0, 0, 0.1)';
              },
              lineWidth: function(context: any) {
                return context.tick.value === 0 ? 2 : 1;
              }
            },
            ticks: {
              callback: function(value: any) {
                return value >= 0 ? `+${value}%` : `${value}%`;
              }
            }
          },
          y: {
            title: {
              display: true,
              text: 'Keywords',
              font: {
                size: 14,
                weight: 'bold'
              }
            },
            grid: {
              display: false
            },
            ticks: {
              font: {
                size: 11
              },
              maxRotation: 0,
              autoSkip: false
            }
          }
        }
      }
    });
  };

  // Function to handle date range preset selection
  const handleDateRangePreset = (preset: string) => {
    setDateRangePreset(preset);
    const today = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() - 3); // Always 3 days ago for end date (API lag)
    
    const startDate = new Date();
    
    switch (preset) {
      case '30days':
        startDate.setDate(startDate.getDate() - 33); // 30 days + 3 days buffer
        break;
      case '3months':
        startDate.setMonth(startDate.getMonth() - 3);
        startDate.setDate(startDate.getDate() - 3); // Buffer
        break;
      case '6months':
        startDate.setMonth(startDate.getMonth() - 6);
        startDate.setDate(startDate.getDate() - 3); // Buffer
        break;
      case '9months':
        startDate.setMonth(startDate.getMonth() - 9);
        startDate.setDate(startDate.getDate() - 3); // Buffer
        break;
      case '12months':
        startDate.setMonth(startDate.getMonth() - 12);
        startDate.setDate(startDate.getDate() - 3); // Buffer
        break;
      case 'custom':
        // Don't change dates for custom, let user set them manually
        return;
      default:
        startDate.setDate(startDate.getDate() - 33);
    }
    
    setWinnersLosersStartDate(startDate.toISOString().split('T')[0]);
    setWinnersLosersEndDate(endDate.toISOString().split('T')[0]);
  };

  const calculateWinnersLosers = async () => {
    if (!selectedSite) {
      alert('Please select a site first');
      return;
    }

    if (!winnersLosersStartDate || !winnersLosersEndDate) {
      alert('Please select a date range');
      return;
    }

    setWinnersLosersLoading(true);
    setError('');
    // Don't clear previous data - it will be replaced with new data when calculation completes

    try {
      console.log('=== Starting Winners/Losers Calculation ===');
      console.log('Site:', selectedSite);
      console.log('Start Date:', winnersLosersStartDate);
      console.log('End Date:', winnersLosersEndDate);

      // STEP 1: API Call for queries on first date
      const queriesFirstDateParams = new URLSearchParams({
        siteUrl: selectedSite,
        startDate: winnersLosersStartDate,
        endDate: winnersLosersStartDate,
        dimensions: 'query',
        fetchAll: 'true'
      });
      if (device && device !== 'all') {
        queriesFirstDateParams.append('device', device);
      }

      console.log('Making API call 1: Queries for first date');
      const queriesFirstRes = await fetch(`http://localhost:5001/api/data?${queriesFirstDateParams}`);
      
      if (!queriesFirstRes.ok) {
        const errorText = await queriesFirstRes.text();
        console.error('API Error (first date):', errorText);
        throw new Error(`Failed to fetch queries for first date: ${queriesFirstRes.status}`);
      }

      const queriesFirstData = await queriesFirstRes.json();
      console.log('API Response 1 (first date):', queriesFirstData);

      if (queriesFirstData.error) {
        throw new Error(queriesFirstData.error);
      }

      // STEP 2: API Call for queries on second date
      const queriesLastDateParams = new URLSearchParams({
        siteUrl: selectedSite,
        startDate: winnersLosersEndDate,
        endDate: winnersLosersEndDate,
        dimensions: 'query',
        fetchAll: 'true'
      });
      if (device && device !== 'all') {
        queriesLastDateParams.append('device', device);
      }

      console.log('Making API call 2: Queries for second date');
      const queriesLastRes = await fetch(`http://localhost:5001/api/data?${queriesLastDateParams}`);
      
      if (!queriesLastRes.ok) {
        const errorText = await queriesLastRes.text();
        console.error('API Error (second date):', errorText);
        throw new Error(`Failed to fetch queries for second date: ${queriesLastRes.status}`);
      }

      const queriesLastData = await queriesLastRes.json();
      console.log('API Response 2 (second date):', queriesLastData);

      if (queriesLastData.error) {
        throw new Error(queriesLastData.error);
      }

      // STEP 3: Process queries data
      const queriesFirstRows = queriesFirstData.rows || [];
      const queriesLastRows = queriesLastData.rows || [];
      
      console.log(`Found ${queriesFirstRows.length} queries on first date`);
      console.log(`Found ${queriesLastRows.length} queries on second date`);

      // Create a map to store clicks for each query
      const queriesMap = new Map<string, { first: number; last: number }>();
      
      // Add first date data
      queriesFirstRows.forEach((row: any) => {
        const query = row.keys?.[0] || '';
        const clicks = row.clicks || 0;
        if (query) {
          queriesMap.set(query, { first: clicks, last: 0 });
        }
      });

      // Add second date data
      queriesLastRows.forEach((row: any) => {
        const query = row.keys?.[0] || '';
        const clicks = row.clicks || 0;
        if (query) {
          const existing = queriesMap.get(query) || { first: 0, last: 0 };
          queriesMap.set(query, { ...existing, last: clicks });
        }
      });
      
      console.log(`Total unique queries found: ${queriesMap.size}`);

      // STEP 4: Calculate change for each query
      const queryItems: WinnerLoserItem[] = Array.from(queriesMap.entries())
        .map(([query, clicks]) => {
          const change = clicks.last - clicks.first;
          const changePercent = clicks.first > 0 
            ? ((change / clicks.first) * 100) 
            : (clicks.last > 0 ? 100 : 0);
          
          return {
            name: query,
            firstHalfClicks: clicks.first,
            secondHalfClicks: clicks.last,
            change,
            changePercent
          };
        })
        .filter(item => item.firstHalfClicks > 0 || item.secondHalfClicks > 0);

      console.log(`Total query items after filtering: ${queryItems.length}`);

      // STEP 5: Get top 20 winners (growth in clicks)
      const queryWinners = queryItems
        .filter(item => item.change > 0)
        .sort((a, b) => b.change - a.change)
        .slice(0, 20);

      // STEP 6: Get top 20 losers (decrease in clicks)
      const queryLosers = queryItems
        .filter(item => item.change < 0)
        .sort((a, b) => a.change - b.change)
        .slice(0, 20);

      console.log(`Winners: ${queryWinners.length} queries`);
      console.log(`Losers: ${queryLosers.length} queries`);

      // STEP 7: API Call for pages/URLs on first date
      const pagesFirstDateParams = new URLSearchParams({
        siteUrl: selectedSite,
        startDate: winnersLosersStartDate,
        endDate: winnersLosersStartDate,
        dimensions: 'page',
        fetchAll: 'true'
      });
      if (device && device !== 'all') {
        pagesFirstDateParams.append('device', device);
      }

      console.log('Making API call 3: Pages/URLs for first date');
      const pagesFirstRes = await fetch(`http://localhost:5001/api/data?${pagesFirstDateParams}`);
      
      if (!pagesFirstRes.ok) {
        const errorText = await pagesFirstRes.text();
        console.error('API Error (pages first date):', errorText);
        throw new Error(`Failed to fetch pages for first date: ${pagesFirstRes.status}`);
      }

      const pagesFirstData = await pagesFirstRes.json();
      console.log('API Response 3 (pages first date):', pagesFirstData);

      if (pagesFirstData.error) {
        throw new Error(pagesFirstData.error);
      }

      // STEP 8: API Call for pages/URLs on second date
      const pagesLastDateParams = new URLSearchParams({
        siteUrl: selectedSite,
        startDate: winnersLosersEndDate,
        endDate: winnersLosersEndDate,
        dimensions: 'page',
        fetchAll: 'true'
      });
      if (device && device !== 'all') {
        pagesLastDateParams.append('device', device);
      }

      console.log('Making API call 4: Pages/URLs for second date');
      const pagesLastRes = await fetch(`http://localhost:5001/api/data?${pagesLastDateParams}`);
      
      if (!pagesLastRes.ok) {
        const errorText = await pagesLastRes.text();
        console.error('API Error (pages second date):', errorText);
        throw new Error(`Failed to fetch pages for second date: ${pagesLastRes.status}`);
      }

      const pagesLastData = await pagesLastRes.json();
      console.log('API Response 4 (pages second date):', pagesLastData);

      if (pagesLastData.error) {
        throw new Error(pagesLastData.error);
      }

      // STEP 9: Process pages/URLs data
      const pagesFirstRows = pagesFirstData.rows || [];
      const pagesLastRows = pagesLastData.rows || [];
      
      console.log(`Found ${pagesFirstRows.length} pages/URLs on first date`);
      console.log(`Found ${pagesLastRows.length} pages/URLs on second date`);

      // Create a map to store clicks for each page/URL
      const pagesMap = new Map<string, { first: number; last: number }>();
      
      // Add first date data
      pagesFirstRows.forEach((row: any) => {
        const page = row.keys?.[0] || '';
        const clicks = row.clicks || 0;
        if (page) {
          pagesMap.set(page, { first: clicks, last: 0 });
        }
      });

      // Add second date data
      pagesLastRows.forEach((row: any) => {
        const page = row.keys?.[0] || '';
        const clicks = row.clicks || 0;
        if (page) {
          const existing = pagesMap.get(page) || { first: 0, last: 0 };
          pagesMap.set(page, { ...existing, last: clicks });
        }
      });
      
      console.log(`Total unique pages/URLs found: ${pagesMap.size}`);

      // STEP 10: Calculate change for each page/URL
      const pageItems: WinnerLoserItem[] = Array.from(pagesMap.entries())
        .map(([page, clicks]) => {
          const change = clicks.last - clicks.first;
          const changePercent = clicks.first > 0 
            ? ((change / clicks.first) * 100) 
            : (clicks.last > 0 ? 100 : 0);
          
          return {
            name: page,
            firstHalfClicks: clicks.first,
            secondHalfClicks: clicks.last,
            change,
            changePercent
          };
        })
        .filter(item => item.firstHalfClicks > 0 || item.secondHalfClicks > 0);

      console.log(`Total page items after filtering: ${pageItems.length}`);

      // STEP 11: Get top 20 winners (growth in clicks)
      const pageWinners = pageItems
        .filter(item => item.change > 0)
        .sort((a, b) => b.change - a.change)
        .slice(0, 20);

      // STEP 12: Get top 20 losers (decrease in clicks)
      const pageLosers = pageItems
        .filter(item => item.change < 0)
        .sort((a, b) => a.change - b.change)
        .slice(0, 20);

      console.log(`Page Winners: ${pageWinners.length} URLs`);
      console.log(`Page Losers: ${pageLosers.length} URLs`);

      // STEP 13: Set the final data
      const finalData = {
        queries: {
          winners: queryWinners,
          losers: queryLosers
        },
        pages: {
          winners: pageWinners,
          losers: pageLosers
        }
      };

      console.log('=== Final Data ===', finalData);
      setWinnersLosersData(finalData);
      console.log('Data set successfully!');
      
    } catch (error: any) {
      console.error('Error calculating winners/losers:', error);
      setError(`Failed to calculate winners/losers: ${error.message || error}. Make sure the backend is running.`);
      setWinnersLosersData({
        queries: { winners: [], losers: [] },
        pages: { winners: [], losers: [] }
      });
    } finally {
      setWinnersLosersLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center space-x-3">
            <FontAwesomeIcon icon={faTrophy} className="text-green-600" />
            <span>Traffic Insights</span>
          </h1>
          <p className="mt-2 text-gray-600">
            Analyze winners and losers in your Google Search Console traffic
          </p>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <FontAwesomeIcon icon={faExclamationTriangle} className="text-red-600 mt-1" />
              <div>
                <h3 className="text-red-800 font-medium">Error</h3>
                <p className="text-red-700 text-sm mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Winners & Losers Controls */}
        <div className="mb-6 bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Winners & Losers Analysis</h3>
          
          {/* Date Range Preset Selector */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date Range
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handleDateRangePreset('30days')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  dateRangePreset === '30days'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                30 Days
              </button>
              <button
                onClick={() => handleDateRangePreset('3months')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  dateRangePreset === '3months'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                3 Months
              </button>
              <button
                onClick={() => handleDateRangePreset('6months')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  dateRangePreset === '6months'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                6 Months
              </button>
              <button
                onClick={() => handleDateRangePreset('9months')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  dateRangePreset === '9months'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                9 Months
              </button>
              <button
                onClick={() => handleDateRangePreset('12months')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  dateRangePreset === '12months'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                12 Months
              </button>
              <button
                onClick={() => {
                  setDateRangePreset('custom');
                }}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  dateRangePreset === 'custom'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Custom
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Site ({sites.length} available)
              </label>
              <select
                value={selectedSite}
                onChange={(e) => setSelectedSite(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Date
              </label>
              <input
                type="date"
                value={winnersLosersStartDate}
                onChange={(e) => {
                  setWinnersLosersStartDate(e.target.value);
                  setDateRangePreset('custom');
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Date <span className="text-xs text-gray-500">(3 days ago due to API lag)</span>
              </label>
              <input
                type="date"
                value={winnersLosersEndDate}
                max={(() => {
                  const maxDate = new Date();
                  maxDate.setDate(maxDate.getDate() - 3);
                  return maxDate.toISOString().split('T')[0];
                })()}
                onChange={(e) => {
                  setWinnersLosersEndDate(e.target.value);
                  setDateRangePreset('custom');
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={calculateWinnersLosers}
                disabled={winnersLosersLoading || !selectedSite}
                className="w-full px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {winnersLosersLoading && <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>}
                <FontAwesomeIcon icon={faTrophy} />
                <span>{winnersLosersLoading ? 'Calculating...' : 'Calculate'}</span>
              </button>
            </div>
          </div>
          <p className="text-sm text-gray-500">
            Compares clicks on the start date vs end date. Winners are the top 20 keywords/URLs that grew, losers are the top 20 that didn't grow. End date defaults to 3 days ago to account for Google Search Console API data lag.
          </p>
        </div>


        {/* Debug Info */}
        {winnersLosersData && (
          <div className="mb-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-xs">
            <strong>Debug:</strong> Data loaded - Queries Winners: {winnersLosersData.queries.winners.length}, 
            Queries Losers: {winnersLosersData.queries.losers.length}, 
            Pages Winners: {winnersLosersData.pages.winners.length}, 
            Pages Losers: {winnersLosersData.pages.losers.length}
          </div>
        )}

        {/* Winners & Losers Tables */}
        {winnersLosersData && (
          <div className="space-y-6">
            {/* Keywords Section */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-2xl font-semibold text-gray-900 mb-6">Keywords Analysis</h2>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Winners - Keywords */}
                <div>
                  <h3 className="text-lg font-semibold text-green-700 mb-4 flex items-center space-x-2">
                    <FontAwesomeIcon icon={faTrophy} />
                    <span>Winners (Growth in Clicks)</span>
                  </h3>
                  {winnersLosersData.queries.winners.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Keyword</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Clicks ({winnersLosersStartDate})</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Clicks ({winnersLosersEndDate})</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Change</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">% Change</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {winnersLosersData.queries.winners.map((item, index) => (
                            <tr key={index} className="hover:bg-gray-50">
                              <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{item.name}</td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{item.firstHalfClicks.toLocaleString()}</td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{item.secondHalfClicks.toLocaleString()}</td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-green-600">+{item.change.toLocaleString()}</td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-green-600">+{item.changePercent.toFixed(1)}%</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm">No winners found</p>
                  )}
                </div>

                {/* Losers - Keywords */}
                <div>
                  <h3 className="text-lg font-semibold text-red-700 mb-4 flex items-center space-x-2">
                    <FontAwesomeIcon icon={faArrowDown} />
                    <span>Losers (Decrease in Clicks)</span>
                  </h3>
                  {winnersLosersData.queries.losers.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Keyword</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Clicks ({winnersLosersStartDate})</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Clicks ({winnersLosersEndDate})</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Change</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">% Change</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {winnersLosersData.queries.losers.map((item, index) => (
                            <tr key={index} className="hover:bg-gray-50">
                              <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{item.name}</td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{item.firstHalfClicks.toLocaleString()}</td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{item.secondHalfClicks.toLocaleString()}</td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-red-600">{item.change.toLocaleString()}</td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-red-600">{item.changePercent.toFixed(1)}%</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm">No losers found</p>
                  )}
                </div>
              </div>

              {/* Contribution Chart */}
              {winnersLosersData && (winnersLosersData.queries.winners.length > 0 || winnersLosersData.queries.losers.length > 0) && (
                <div className="mt-8">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Keyword Contribution to Click Change</h3>
                  <div className="bg-white rounded-lg p-4" style={{ height: '600px' }}>
                    <canvas ref={contributionChartRef}></canvas>
                  </div>
                </div>
              )}
            </div>

            {/* URLs Section */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-2xl font-semibold text-gray-900 mb-6">URLs Analysis</h2>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Winners - URLs */}
                <div>
                  <h3 className="text-lg font-semibold text-green-700 mb-4 flex items-center space-x-2">
                    <FontAwesomeIcon icon={faTrophy} />
                    <span>Winners (Growth in Clicks)</span>
                  </h3>
                  {winnersLosersData.pages.winners.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">URL</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Clicks ({winnersLosersStartDate})</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Clicks ({winnersLosersEndDate})</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Change</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">% Change</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {winnersLosersData.pages.winners.map((item, index) => (
                            <tr key={index} className="hover:bg-gray-50">
                              <td className="px-4 py-3 text-sm font-medium text-gray-900 break-all max-w-xs">{item.name}</td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{item.firstHalfClicks.toLocaleString()}</td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{item.secondHalfClicks.toLocaleString()}</td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-green-600">+{item.change.toLocaleString()}</td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-green-600">+{item.changePercent.toFixed(1)}%</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm">No winners found</p>
                  )}
                </div>

                {/* Losers - URLs */}
                <div>
                  <h3 className="text-lg font-semibold text-red-700 mb-4 flex items-center space-x-2">
                    <FontAwesomeIcon icon={faArrowDown} />
                    <span>Losers (Decrease in Clicks)</span>
                  </h3>
                  {winnersLosersData.pages.losers.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">URL</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Clicks ({winnersLosersStartDate})</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Clicks ({winnersLosersEndDate})</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Change</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">% Change</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {winnersLosersData.pages.losers.map((item, index) => (
                            <tr key={index} className="hover:bg-gray-50">
                              <td className="px-4 py-3 text-sm font-medium text-gray-900 break-all max-w-xs">{item.name}</td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{item.firstHalfClicks.toLocaleString()}</td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{item.secondHalfClicks.toLocaleString()}</td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-red-600">{item.change.toLocaleString()}</td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-red-600">{item.changePercent.toFixed(1)}%</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm">No losers found</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!winnersLosersData && !winnersLosersLoading && (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <FontAwesomeIcon icon={faTrophy} className="text-gray-400 text-6xl mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Analysis Yet</h3>
            <p className="text-gray-600 mb-6">
              Select a site and date range above, then click "Calculate" to see winners and losers.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

