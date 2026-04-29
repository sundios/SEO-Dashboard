'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useData } from '@/contexts/DataContext';
import ReactMarkdown from 'react-markdown';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faPlay,
  faSpinner,
  faExclamationTriangle,
  faChartArea,
  faInfoCircle,
  faBrain,
  faRefresh,
} from '@fortawesome/free-solid-svg-icons';

declare global {
  interface Window {
    Chart: any;
  }
}

interface GscPoint { date: string; clicks: number; impressions: number; }
interface TrendsPoint { date: string; value: number; }
interface TrendsResult {
  topQueries: string[];
  gscSeries: GscPoint[];
  trendsAvg: TrendsPoint[];
  trendsByKeyword: Record<string, TrendsPoint[]>;
  errors: string[];
}

interface AlgoUpdate {
  name: string;
  start_date: string;
  duration: string;
  type: string;
}

// Aligned point passed to AI — one row per chart period
interface AlignedPoint {
  date: string;
  clicks: number;
  trendsValue: number;
}

const UPDATE_COLORS: Record<string, string> = {
  core: 'rgba(230, 126, 34, 0.85)',
  spam: 'rgba(142, 68, 173, 0.85)',
  discover: 'rgba(39, 174, 96, 0.85)',
};

const today = new Date();
const maxDate = new Date(today.getTime() - 3 * 24 * 60 * 60 * 1000)
  .toISOString()
  .split('T')[0];
const defaultEnd = maxDate;
const defaultStart = new Date(today.getTime() - 180 * 24 * 60 * 60 * 1000)
  .toISOString()
  .split('T')[0];

export default function TrendsAnalysisPage() {
  const { sites, selectedSite, setSelectedSite } = useData();

  const [config, setConfig] = useState({
    siteUrl: '',
    startDate: defaultStart,
    endDate: defaultEnd,
    urlFilter: '',
    queryFilter: '',
    device: '',
    country: '',
    topNQueries: 15,
    trendsGeoCode: 'US',
    timeResolution: 'WEEK' as 'DAY' | 'WEEK' | 'MONTH',
  });

  const [algorithmUpdates, setAlgorithmUpdates] = useState<AlgoUpdate[]>([]);
  const [showAlgoUpdates, setShowAlgoUpdates] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<TrendsResult | null>(null);

  // Aligned series stored so AI can read it without re-computing
  const [alignedSeries, setAlignedSeries] = useState<AlignedPoint[]>([]);

  // AI insights state
  const [insights, setInsights] = useState<string>('');
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [showInsights, setShowInsights] = useState(false);

  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<any>(null);

  useEffect(() => {
    fetch('http://localhost:5001/api/algo-updates')
      .then(r => r.json())
      .then(d => setAlgorithmUpdates(d.algo_updates || []))
      .catch(() => {});
  }, []);

  // Sync selected site from global context
  useEffect(() => {
    if (selectedSite && !config.siteUrl) {
      setConfig(c => ({ ...c, siteUrl: selectedSite }));
    }
  }, [selectedSite]);

  // Load Chart.js + annotation plugin once
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const ensureAnnotationRegistered = () => {
      if (!window.Chart) return;
      try {
        const already = window.Chart.registry?.getPlugin('annotation');
        if (already) return;
        const candidate =
          (window as any).ChartAnnotation ??
          (window as any).annotationPlugin ??
          null;
        if (candidate) window.Chart.register(candidate);
      } catch (_) {}
    };

    if (window.Chart) { ensureAnnotationRegistered(); return; }

    const chartScript = document.createElement('script');
    chartScript.src = 'https://cdn.jsdelivr.net/npm/chart.js@4.4.9/dist/chart.umd.min.js';
    chartScript.async = true;
    chartScript.onload = () => {
      const annotScript = document.createElement('script');
      annotScript.src =
        'https://cdn.jsdelivr.net/npm/chartjs-plugin-annotation@3.1.0/dist/chartjs-plugin-annotation.min.js';
      annotScript.async = true;
      annotScript.onload = () => ensureAnnotationRegistered();
      document.head.appendChild(annotScript);
    };
    document.head.appendChild(chartScript);
  }, []);

  // Rebuild chart whenever result, toggle, or updates list changes
  useEffect(() => {
    if (result) buildChart(result);
  }, [result, showAlgoUpdates, algorithmUpdates]);

  const runAnalysis = async () => {
    if (!config.siteUrl) { setError('Please select a site.'); return; }
    setLoading(true);
    setError(null);
    setResult(null);
    setInsights('');
    setShowInsights(false);
    if (chartInstance.current) { chartInstance.current.destroy(); chartInstance.current = null; }

    try {
      const resp = await fetch('http://localhost:5001/api/trends/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          siteUrl: config.siteUrl,
          startDate: config.startDate,
          endDate: config.endDate,
          urlFilter: config.urlFilter || null,
          queryFilter: config.queryFilter || null,
          device: config.device || null,
          country: config.country || null,
          topNQueries: config.topNQueries,
          trendsGeoCode: config.trendsGeoCode,
          timeResolution: config.timeResolution,
        }),
      });
      const data = await resp.json();
      if (!resp.ok) { setError(data.error || 'Analysis failed.'); return; }
      setResult(data);
      if (config.siteUrl !== selectedSite) setSelectedSite(config.siteUrl);
    } catch (e: any) {
      setError(e.message || 'Network error.');
    } finally {
      setLoading(false);
    }
  };

  const buildChart = (data: TrendsResult) => {
    if (!chartRef.current || !window.Chart) return;
    if (chartInstance.current) chartInstance.current.destroy();

    const gscSorted = [...data.gscSeries].sort((a, b) => a.date.localeCompare(b.date));
    const trendsSorted = [...data.trendsAvg].sort((a, b) => a.date.localeCompare(b.date));

    // Trim GSC tail beyond last Trends date (Trends has ~3-day lag)
    const lastTrendsDate = trendsSorted.length
      ? trendsSorted[trendsSorted.length - 1].date
      : null;
    const gscTrimmed = lastTrendsDate
      ? gscSorted.filter(p => p.date <= lastTrendsDate)
      : gscSorted;

    const allDates = gscTrimmed.map(p => p.date);
    const labels = allDates.map(d => new Date(d).toLocaleDateString());
    const gscValues = gscTrimmed.map(p => p.clicks);

    const snapTrends = (d: string) => {
      if (trendsSorted.length === 0) return null;
      let best = trendsSorted[0];
      let bestDiff = Math.abs(new Date(best.date).getTime() - new Date(d).getTime());
      for (const t of trendsSorted) {
        const diff = Math.abs(new Date(t.date).getTime() - new Date(d).getTime());
        if (diff < bestDiff) { best = t; bestDiff = diff; }
      }
      return best.value;
    };

    const trendsValues = allDates.map(snapTrends);

    // Save aligned series for AI
    const aligned: AlignedPoint[] = allDates.map((d, i) => ({
      date: d,
      clicks: gscValues[i],
      trendsValue: trendsValues[i] ?? 0,
    }));
    setAlignedSeries(aligned);

    // Algo update annotations
    const annotations: Record<string, any> = {};
    if (showAlgoUpdates) {
      const start = new Date(config.startDate);
      const end = new Date(config.endDate);
      let idx = 0;
      algorithmUpdates.forEach(upd => {
        const updDate = new Date(upd.start_date);
        if (updDate < start || updDate > end) return;

        let closestIdx = -1;
        let closestDiff = Infinity;
        allDates.forEach((d, i) => {
          const diff = Math.abs(new Date(d).getTime() - updDate.getTime());
          if (diff < closestDiff) { closestDiff = diff; closestIdx = i; }
        });
        if (closestIdx === -1) return;

        const color = UPDATE_COLORS[upd.type] ?? UPDATE_COLORS.core;
        annotations[`upd-${idx}`] = {
          type: 'line',
          xMin: labels[closestIdx],
          xMax: labels[closestIdx],
          borderColor: color,
          borderWidth: 2,
          borderDash: [5, 5],
          xScaleID: 'x',
          drawTime: 'afterDatasetsDraw',
          label: {
            display: true,
            content: upd.name,
            position: 'start',
            backgroundColor: color,
            color: 'white',
            font: { size: 10, weight: 'bold' },
            padding: { top: 3, bottom: 3, left: 6, right: 6 },
            yAdjust: -28 - idx * 22,
          },
        };
        idx++;
      });
    }

    const ctx = chartRef.current.getContext('2d');
    chartInstance.current = new window.Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'GSC Clicks',
            data: gscValues,
            borderColor: '#1d4ed8',
            backgroundColor: 'rgba(29,78,216,0.08)',
            borderWidth: 2.5,
            pointRadius: 3,
            pointHoverRadius: 5,
            fill: true,
            tension: 0.3,
            spanGaps: true,
            yAxisID: 'y',
          },
          {
            label: 'Google Trends (avg)',
            data: trendsValues,
            borderColor: '#dc2626',
            backgroundColor: 'rgba(220,38,38,0.06)',
            borderWidth: 2.5,
            pointRadius: 3,
            pointHoverRadius: 5,
            borderDash: [6, 3],
            fill: true,
            tension: 0.3,
            spanGaps: true,
            yAxisID: 'y1',
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: { position: 'top' },
          tooltip: {
            callbacks: {
              label: (ctx: any) =>
                `${ctx.dataset.label}: ${ctx.parsed.y !== null ? ctx.parsed.y.toLocaleString() : 'N/A'}`,
            },
          },
          annotation: { annotations },
        },
        scales: {
          x: {
            grid: { color: 'rgba(0,0,0,0.04)' },
            ticks: { maxRotation: 45, font: { size: 11 } },
          },
          y: {
            type: 'linear',
            position: 'left',
            title: { display: true, text: 'GSC Clicks', color: '#1d4ed8', font: { size: 12 } },
            grid: { color: 'rgba(0,0,0,0.06)' },
            ticks: { color: '#1d4ed8' },
          },
          y1: {
            type: 'linear',
            position: 'right',
            title: { display: true, text: 'Trends (scaled interest)', color: '#dc2626', font: { size: 12 } },
            grid: { drawOnChartArea: false },
            ticks: { color: '#dc2626' },
          },
        },
      },
    });
  };

  const getInsights = async () => {
    if (!result || alignedSeries.length === 0) return;
    setInsightsLoading(true);
    setShowInsights(true);
    setInsights('');

    // Algo updates that fall within the selected date range
    const start = new Date(config.startDate);
    const end = new Date(config.endDate);
    const algoUpdatesInRange = algorithmUpdates.filter(u => {
      const d = new Date(u.start_date);
      return d >= start && d <= end;
    });

    try {
      const resp = await fetch('http://localhost:5001/api/trends/insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          siteUrl: config.siteUrl,
          startDate: config.startDate,
          endDate: config.endDate,
          timeResolution: config.timeResolution,
          topQueries: result.topQueries,
          gscSeries: alignedSeries,
          algoUpdatesInRange,
        }),
      });
      const data = await resp.json();
      if (!resp.ok) { setInsights(`Error: ${data.error}`); return; }
      setInsights(data.insights);
    } catch (e: any) {
      setInsights(`Error: ${e.message}`);
    } finally {
      setInsightsLoading(false);
    }
  };

  const updateConfig = (key: keyof typeof config, value: any) =>
    setConfig(c => ({ ...c, [key]: value }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <FontAwesomeIcon icon={faChartArea} className="text-blue-600" />
          Trends Analysis
        </h1>
        <p className="text-gray-500 mt-1 text-sm">
          Overlay GSC traffic with Google Trends search interest to distinguish seasonal demand from structural SEO issues.
        </p>
      </div>

      {/* Config panel */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 space-y-5">
        <h2 className="font-semibold text-gray-800 text-base">Configuration</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">Site</label>
            <select
              value={config.siteUrl}
              onChange={e => updateConfig('siteUrl', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
            >
              <option value="">Select a site…</option>
              {sites.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">Start Date</label>
            <input type="date" value={config.startDate} max={maxDate}
              onChange={e => updateConfig('startDate', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500" />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">End Date</label>
            <input type="date" value={config.endDate} max={maxDate}
              onChange={e => updateConfig('endDate', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500" />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">URL Filter (contains)</label>
            <input type="text" placeholder="e.g. /blog/" value={config.urlFilter}
              onChange={e => updateConfig('urlFilter', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500" />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">Query Filter (contains)</label>
            <input type="text" placeholder="e.g. figma" value={config.queryFilter}
              onChange={e => updateConfig('queryFilter', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500" />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">Device</label>
            <select value={config.device} onChange={e => updateConfig('device', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 bg-white">
              <option value="">All Devices</option>
              <option value="desktop">Desktop</option>
              <option value="mobile">Mobile</option>
              <option value="tablet">Tablet</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">Country (GSC 3-letter code)</label>
            <input type="text" placeholder="e.g. usa" value={config.country}
              onChange={e => updateConfig('country', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500" />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">Top N Queries</label>
            <input type="number" min={1} max={50} value={config.topNQueries}
              onChange={e => updateConfig('topNQueries', parseInt(e.target.value) || 15)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500" />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">Trends Geo (2-letter ISO)</label>
            <input type="text" placeholder="e.g. US" value={config.trendsGeoCode}
              onChange={e => updateConfig('trendsGeoCode', e.target.value.toUpperCase())}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500" />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">Time Resolution</label>
            <select value={config.timeResolution} onChange={e => updateConfig('timeResolution', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 bg-white">
              <option value="DAY">Day</option>
              <option value="WEEK">Week</option>
              <option value="MONTH">Month</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-4 pt-2 border-t border-gray-100">
          <button onClick={runAnalysis} disabled={loading || !config.siteUrl}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed font-medium text-sm transition-colors">
            {loading ? <FontAwesomeIcon icon={faSpinner} className="animate-spin" /> : <FontAwesomeIcon icon={faPlay} />}
            {loading ? 'Running…' : 'Run Analysis'}
          </button>

          <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer select-none">
            <input type="checkbox" checked={showAlgoUpdates}
              onChange={e => setShowAlgoUpdates(e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded" />
            Show Algorithm Updates
          </label>

          {loading && (
            <span className="text-sm text-gray-500 italic">
              Fetching GSC data &amp; Google Trends — this may take 30–60 s…
            </span>
          )}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
          <FontAwesomeIcon icon={faExclamationTriangle} className="text-red-500 mt-0.5 shrink-0" />
          <div>
            <p className="font-medium">Analysis failed</p>
            <p className="mt-1 text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="space-y-6">
          {result.errors.length > 0 && (
            <div className="flex items-start gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800 text-sm">
              <FontAwesomeIcon icon={faInfoCircle} className="text-yellow-500 mt-0.5 shrink-0" />
              <div>
                <p className="font-medium">Some queries could not fetch Trends data</p>
                <ul className="mt-1 list-disc list-inside text-yellow-700 space-y-0.5">
                  {result.errors.map((e, i) => <li key={i}>{e}</li>)}
                </ul>
              </div>
            </div>
          )}

          {/* Chart card */}
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="font-semibold text-gray-800">GSC Clicks vs Google Trends</h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Blue = GSC clicks (left axis) · Red dashed = Trends scaled interest (right axis)
                </p>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex gap-4 text-xs text-gray-500">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="w-3 h-0.5 bg-orange-400 inline-block"></span>Core
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="w-3 h-0.5 bg-purple-500 inline-block"></span>Spam
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="w-3 h-0.5 bg-green-500 inline-block"></span>Discover
                  </span>
                </div>
                <button
                  onClick={getInsights}
                  disabled={insightsLoading || alignedSeries.length === 0}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-sm font-medium transition-colors"
                >
                  {insightsLoading
                    ? <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
                    : <FontAwesomeIcon icon={faBrain} />}
                  {insightsLoading ? 'Analyzing…' : 'AI Insights'}
                </button>
              </div>
            </div>

            <div className="relative" style={{ height: '420px' }}>
              <canvas ref={chartRef} />
            </div>
            <p className="text-xs text-gray-400 mt-3 italic">
              Lines tracking together → seasonal / demand-driven.
              Lines diverging (traffic down, Trends flat) → possible structural SEO issue.
            </p>
          </div>

          {/* AI Insights panel */}
          {showInsights && (
            <div className="bg-white border border-purple-200 rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-gray-800 flex items-center gap-2">
                  <FontAwesomeIcon icon={faBrain} className="text-purple-600" />
                  AI Diagnosis
                </h2>
                <button
                  onClick={getInsights}
                  disabled={insightsLoading}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40"
                >
                  <FontAwesomeIcon icon={faRefresh} className={insightsLoading ? 'animate-spin' : ''} />
                  Regenerate
                </button>
              </div>

              {insightsLoading ? (
                <div className="flex items-center gap-3 text-gray-500 py-8 justify-center">
                  <FontAwesomeIcon icon={faSpinner} className="animate-spin text-purple-500 text-xl" />
                  <span>Analyzing GSC vs Trends patterns…</span>
                </div>
              ) : insights ? (
                <div className="prose prose-sm max-w-none text-gray-700
                  prose-headings:text-gray-900 prose-headings:font-semibold
                  prose-strong:text-gray-900
                  prose-ul:my-1 prose-li:my-0.5">
                  <ReactMarkdown>{insights}</ReactMarkdown>
                </div>
              ) : null}
            </div>
          )}

          {/* Top Queries table */}
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
            <h2 className="font-semibold text-gray-800 mb-4">
              Top {result.topQueries.length} Queries Used in Analysis
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="border-b border-gray-200 text-xs uppercase text-gray-500">
                    <th className="pb-2 pr-4">#</th>
                    <th className="pb-2 pr-4">Query</th>
                    <th className="pb-2 text-right">Trends data points</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {result.topQueries.map((q, i) => (
                    <tr key={q} className="hover:bg-gray-50">
                      <td className="py-2 pr-4 text-gray-400">{i + 1}</td>
                      <td className="py-2 pr-4 text-gray-800 font-medium">{q}</td>
                      <td className="py-2 text-right text-gray-500">
                        {result.trendsByKeyword[q]?.length ?? '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!result && !loading && !error && (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <FontAwesomeIcon icon={faChartArea} className="text-5xl mb-4 opacity-30" />
          <p className="text-base">Configure the parameters above and click <strong>Run Analysis</strong>.</p>
          <p className="text-sm mt-1 opacity-70">
            Make sure your Google Trends credentials path is set in{' '}
            <a href="/settings" className="text-blue-500 hover:underline">Settings</a>.
          </p>
        </div>
      )}
    </div>
  );
}
