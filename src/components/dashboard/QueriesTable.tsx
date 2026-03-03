'use client';

import React from 'react';
import Card from '../ui/card';
import { ArrowUp, ArrowDown } from 'lucide-react';

interface QueriesTableProps {
  data: any[];
  loading: boolean;
  onSort: (field: string) => void;
  sortField: string;
  sortOrder: 'asc' | 'desc';
  filter: string;
  onFilterChange: (val: string) => void;
}

const columns = [
  { label: 'Query', field: 'query' },
  { label: 'Clicks', field: 'clicks' },
  { label: 'Impressions', field: 'impressions' },
  { label: 'CTR', field: 'ctr' },
  { label: 'Position', field: 'position' },
];

const QueriesTable: React.FC<QueriesTableProps> = ({ data, loading, onSort, sortField, sortOrder, filter, onFilterChange }) => {
  return (
    <Card className="mt-6">
      <div className="flex items-center justify-between px-4 pt-4">
        <input
          placeholder="Filter queries..."
          value={filter}
          onChange={(e) => onFilterChange(e.target.value)}
          className="w-64 px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
        />
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.field}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer select-none"
                  onClick={() => onSort(col.field)}
                >
                  <span className="flex items-center gap-1">
                    {col.label}
                    {sortField === col.field && (
                      sortOrder === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />
                    )}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={columns.length} className="px-6 py-4 text-center">
                  Loading...
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-6 py-4 text-center">
                  No queries found.
                </td>
              </tr>
            ) : (
              data.map((row, idx) => (
                <tr key={idx} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.query}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.clicks}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.impressions}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.ctr}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.position}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
};

export default QueriesTable; 