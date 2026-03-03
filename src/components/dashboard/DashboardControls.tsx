'use client';

import React, { useState } from 'react';
import Card from '../ui/card';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface DashboardControlsProps {
  sites: string[];
  selectedSite: string;
  selectedPreset: string;
  startDate: string;
  endDate: string;
  loading: boolean;
  fetchAll: boolean;
  device?: string;
  advancedFilter: {
    dimension: '' | 'query' | 'page' | 'country' | 'device';
    type: 'exact' | 'contains' | 'not-contains';
    value: string;
  };
  onSiteChange: (site: string) => void;
  onPresetChange: (preset: string) => void;
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
  onFetchAllChange: (fetchAll: boolean) => void;
  onDeviceChange?: (device: string) => void;
  onAdvancedFilterChange: (filter: any) => void;
  onFetchData: () => void;
}

const DashboardControls: React.FC<DashboardControlsProps> = ({
  sites,
  selectedSite,
  selectedPreset,
  startDate,
  endDate,
  loading,
  fetchAll,
  device = 'all',
  advancedFilter,
  onSiteChange,
  onPresetChange,
  onStartDateChange,
  onEndDateChange,
  onFetchAllChange,
  onDeviceChange,
  onAdvancedFilterChange,
  onFetchData
}) => {
  const dateRangePresets = [
    { label: '7 Days', value: '7-days' },
    { label: '30 Days', value: '30-days' },
    { label: '3 Months', value: '3-months' },
    { label: '6 Months', value: '6-months' },
    { label: '12 Months', value: '12-months' },
    { label: '16 Months', value: '16-months' }
  ];

  const deviceOptions = [
    { label: 'All Devices', value: 'all' },
    { label: 'Desktop', value: 'desktop' },
    { label: 'Mobile', value: 'mobile' },
    { label: 'Tablet', value: 'tablet' }
  ];

  const clearAdvancedFilter = () => {
    onAdvancedFilterChange({
      dimension: '',
      type: 'contains',
      value: ''
    });
  };

  const [showAdvanced, setShowAdvanced] = useState(false);

  return (
    <Card>
      <div className="space-y-6">
        {/* Site and Date Controls */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Site Selection */}
          <div className="lg:col-span-3">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Website
            </label>
            <select
              value={selectedSite}
              onChange={(e) => onSiteChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
            >
              <option value="">Select a website</option>
              {sites.map((site) => (
                <option key={site} value={site}>
                  {site}
                </option>
              ))}
            </select>
          </div>
          {/* Device Selection */}
          {onDeviceChange && (
            <div className="lg:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Device Type
              </label>
              <select
                value={device}
                onChange={(e) => onDeviceChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
              >
                {deviceOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          )}
          {/* Date Range Presets */}
          <div className={onDeviceChange ? "lg:col-span-2" : "lg:col-span-3"}>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Quick Ranges
            </label>
            <select
              value={selectedPreset}
              onChange={(e) => onPresetChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
            >
              <option value="">Custom Range</option>
              {dateRangePresets.map((preset) => (
                <option key={preset.value} value={preset.value}>
                  {preset.label}
                </option>
              ))}
            </select>
          </div>
          {/* Start Date */}
          <div className="lg:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Start Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => onStartDateChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
            />
          </div>
          {/* End Date */}
          <div className="lg:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              End Date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => onEndDateChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
            />
          </div>
          {/* Fetch All Toggle */}
          <div className="lg:col-span-1 flex items-end">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={fetchAll}
                onChange={(e) => onFetchAllChange(e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 bg-white"
              />
              <span className="text-sm text-gray-700">
                Fetch All Rows
                <div className="text-xs text-gray-500">
                  {fetchAll ? 'Get complete dataset (slower)' : 'Limit to 25k rows (faster)'}
                </div>
              </span>
            </label>
          </div>
        </div>
        {/* Advanced Filter Controls as Dropdown */}
        <div className="border-t border-gray-200 pt-4">
          <Button
            type="button"
            onClick={() => setShowAdvanced((v) => !v)}
            variant="ghost"
            className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-3 hover:text-blue-600"
            aria-expanded={showAdvanced}
          >
            <span>Advanced Filters</span>
            {showAdvanced ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </Button>
          {showAdvanced && (
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 animate-fade-in">
              {/* Filter Dimension */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Filter By
                </label>
                <select
                  value={advancedFilter.dimension}
                  onChange={(e) => onAdvancedFilterChange({
                    ...advancedFilter,
                    dimension: e.target.value as any
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
                >
                  <option value="">No Filter</option>
                  <option value="query">Query</option>
                  <option value="page">Page</option>
                  <option value="country">Country</option>
                  <option value="device">Device</option>
                </select>
              </div>
              {/* Filter Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Match Type
                </label>
                <select
                  value={advancedFilter.type}
                  onChange={(e) => onAdvancedFilterChange({
                    ...advancedFilter,
                    type: e.target.value as any
                  })}
                  disabled={!advancedFilter.dimension}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 disabled:bg-gray-100"
                >
                  <option value="contains">Contains</option>
                  <option value="exact">Exact Match</option>
                  <option value="not-contains">Does Not Contain</option>
                </select>
              </div>
              {/* Filter Value */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Filter Value
                </label>
                <input
                  type="text"
                  value={advancedFilter.value}
                  onChange={(e) => onAdvancedFilterChange({
                    ...advancedFilter,
                    value: e.target.value
                  })}
                  disabled={!advancedFilter.dimension}
                  placeholder={advancedFilter.dimension ? `Enter ${advancedFilter.dimension}...` : 'Select filter type first'}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 disabled:bg-gray-100"
                />
              </div>
              {/* Clear Filter */}
              <div className="flex items-end">
                <Button
                  type="button"
                  onClick={clearAdvancedFilter}
                  disabled={!advancedFilter.dimension}
                  variant="outline"
                  size="sm"
                  className="w-full"
                >
                  Clear Filter
                </Button>
              </div>
              {/* Fetch Data Button */}
              <div className="flex items-end">
                <Button
                  type="button"
                  onClick={onFetchData}
                  disabled={loading || !selectedSite}
                  variant="default"
                  size="sm"
                  className="w-full flex items-center justify-center space-x-2"
                >
                  {loading && <span className="animate-spin">⏳</span>}
                  <span>{loading ? 'Loading...' : 'Fetch Data'}</span>
                </Button>
              </div>
            </div>
          )}
          {/* Active Filter Display */}
          {showAdvanced && advancedFilter.dimension && advancedFilter.value && (
            <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm text-blue-800">
                  <strong>Active Filter:</strong> {advancedFilter.dimension} {advancedFilter.type.replace('-', ' ')} "{advancedFilter.value}"
                </span>
                <Button
                  type="button"
                  onClick={clearAdvancedFilter}
                  variant="ghost"
                  size="sm"
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  Remove
                </Button>
              </div>
            </div>
          )}
        </div>
        {/* Legacy Load Data Button (for backwards compatibility) */}
        <div className="border-t pt-4 lg:hidden">
          <Button
            type="button"
            onClick={onFetchData}
            disabled={loading || !selectedSite}
            variant="default"
            size="lg"
            className="w-full flex items-center justify-center space-x-2"
          >
            {loading && <span className="animate-spin">⏳</span>}
            <span>{loading ? 'Loading...' : 'Load Data'}</span>
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default DashboardControls; 