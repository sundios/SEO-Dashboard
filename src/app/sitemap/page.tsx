'use client';

import { useState, useEffect } from 'react';
import { useData } from '@/contexts/DataContext';
import { Button } from '@/components/ui/button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSitemap, faSpinner, faPlus, faTrash, faRefresh, faExclamationTriangle, faCheckCircle, faInfoCircle, faEye, faTimes } from '@fortawesome/free-solid-svg-icons';

interface SitemapContent {
  type: string;
  submitted: number;
  indexed?: number;
}

interface Sitemap {
  path: string;
  lastSubmitted?: string;
  isPending?: boolean;
  isSitemapsIndex?: boolean;
  type?: string;
  lastDownloaded?: string;
  warnings?: number;
  errors?: number;
  contents?: SitemapContent[];
}

export default function SitemapPage() {
  const { sites, fetchSites } = useData();
  const [selectedSite, setSelectedSite] = useState('');
  const [sitemaps, setSitemaps] = useState<Sitemap[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showSubmitForm, setShowSubmitForm] = useState(false);
  const [newSitemapPath, setNewSitemapPath] = useState('');
  const [selectedSitemapDetail, setSelectedSitemapDetail] = useState<Sitemap | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  useEffect(() => {
    fetchSites();
    if (sites.length > 0 && !selectedSite) {
      setSelectedSite(sites[0]);
    }
  }, [sites]);

  useEffect(() => {
    if (selectedSite) {
      loadSitemaps();
    }
  }, [selectedSite]);

  const loadSitemaps = async () => {
    if (!selectedSite) return;

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const url = `http://localhost:5001/api/sitemaps?siteUrl=${encodeURIComponent(selectedSite)}`;
      console.log('[FRONTEND] Loading sitemaps for:', selectedSite);
      console.log('[FRONTEND] Request URL:', url);
      
      const response = await fetch(url);
      console.log('[FRONTEND] Response status:', response.status, response.statusText);

      const data = await response.json();
      console.log('[FRONTEND] Response data:', data);

      if (!response.ok) {
        console.error('[FRONTEND] Error response:', data);
        setError(data.error || 'Failed to load sitemaps');
        setSitemaps([]);
        return;
      }

      // The API returns sitemap array (singular, not sitemapEntry)
      if (data.sitemap) {
        console.log('[FRONTEND] Found sitemap with', data.sitemap.length, 'items');
        setSitemaps(data.sitemap);
      } else if (data.sitemapEntry) {
        // Fallback for sitemapEntry (in case API format changes)
        console.log('[FRONTEND] Found sitemapEntry with', data.sitemapEntry.length, 'items');
        setSitemaps(data.sitemapEntry);
      } else {
        console.log('[FRONTEND] No sitemap or sitemapEntry in response. Response keys:', Object.keys(data));
        setSitemaps([]);
      }
    } catch (err) {
      console.error('[FRONTEND] Error loading sitemaps:', err);
      setError('Failed to load sitemaps. Make sure the backend is running on port 5001.');
      setSitemaps([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!newSitemapPath.trim()) {
      setError('Please enter a sitemap path');
      return;
    }

    if (!selectedSite) {
      setError('Please select a site');
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('http://localhost:5001/api/sitemaps/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          siteUrl: selectedSite,
          feedpath: newSitemapPath.trim()
        })
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to submit sitemap');
        return;
      }

      setSuccess('Sitemap submitted successfully!');
      setNewSitemapPath('');
      setShowSubmitForm(false);
      // Reload sitemaps list
      await loadSitemaps();
    } catch (err) {
      console.error('Error submitting sitemap:', err);
      setError('Failed to submit sitemap. Make sure the backend is running on port 5001.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (feedpath: string) => {
    if (!selectedSite) {
      setError('Please select a site');
      return;
    }

    if (!confirm(`Are you sure you want to delete the sitemap "${feedpath}"?`)) {
      return;
    }

    setDeleting(feedpath);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('http://localhost:5001/api/sitemaps/delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          siteUrl: selectedSite,
          feedpath: feedpath
        })
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to delete sitemap');
        return;
      }

      setSuccess('Sitemap deleted successfully!');
      // Reload sitemaps list
      await loadSitemaps();
    } catch (err) {
      console.error('Error deleting sitemap:', err);
      setError('Failed to delete sitemap. Make sure the backend is running on port 5001.');
    } finally {
      setDeleting(null);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleString();
    } catch {
      return dateString;
    }
  };

  const handleViewDetails = async (sitemap: Sitemap) => {
    if (!selectedSite) {
      setDetailError('Please select a site');
      return;
    }

    setDetailLoading(true);
    setDetailError(null);
    setSelectedSitemapDetail(null);

    try {
      const response = await fetch(
        `http://localhost:5001/api/sitemaps/get?siteUrl=${encodeURIComponent(selectedSite)}&feedpath=${encodeURIComponent(sitemap.path)}`
      );

      const data = await response.json();

      if (!response.ok) {
        setDetailError(data.error || 'Failed to load sitemap details');
        return;
      }

      setSelectedSitemapDetail(data);
    } catch (err) {
      console.error('Error loading sitemap details:', err);
      setDetailError('Failed to load sitemap details. Make sure the backend is running on port 5001.');
    } finally {
      setDetailLoading(false);
    }
  };

  const getStatusColor = (sitemap: Sitemap) => {
    if (sitemap.isPending) return 'text-yellow-600';
    const errors = sitemap.errors ? parseInt(String(sitemap.errors)) : 0;
    const warnings = sitemap.warnings ? parseInt(String(sitemap.warnings)) : 0;
    if (errors > 0) return 'text-red-600';
    if (warnings > 0) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getStatusText = (sitemap: Sitemap) => {
    if (sitemap.isPending) return 'Pending';
    const errors = sitemap.errors ? parseInt(String(sitemap.errors)) : 0;
    const warnings = sitemap.warnings ? parseInt(String(sitemap.warnings)) : 0;
    if (errors > 0) return `Errors: ${errors}`;
    if (warnings > 0) return `Warnings: ${warnings}`;
    return 'OK';
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                🗺️ Sitemap Management
              </h1>
              <p className="text-gray-600">
                View, submit, and manage sitemaps for your Google Search Console properties
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                onClick={() => setShowSubmitForm(!showSubmitForm)}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <FontAwesomeIcon icon={faPlus} className="mr-2" />
                Submit Sitemap
              </Button>
              <Button
                onClick={loadSitemaps}
                disabled={loading || !selectedSite}
                className="bg-blue-600 hover:bg-blue-700 text-white disabled:bg-gray-400"
              >
                <FontAwesomeIcon icon={faRefresh} className={`mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
        </div>

        {/* Site Selector */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <label htmlFor="site-select" className="block text-sm font-medium text-gray-700 mb-2">
            Site ({sites.length} available)
          </label>
          <select
            id="site-select"
            value={selectedSite}
            onChange={(e) => setSelectedSite(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Select a site...</option>
            {sites.map((site) => (
              <option key={site} value={site}>
                {site.replace('https://', '').replace('http://', '')}
              </option>
            ))}
          </select>
        </div>

        {/* Submit Form */}
        {showSubmitForm && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Submit New Sitemap</h2>
            <div className="space-y-4">
              <div>
                <label htmlFor="sitemap-path" className="block text-sm font-medium text-gray-700 mb-2">
                  Sitemap Path
                </label>
                <input
                  id="sitemap-path"
                  type="text"
                  value={newSitemapPath}
                  onChange={(e) => setNewSitemapPath(e.target.value)}
                  placeholder="sitemap.xml or https://example.com/sitemap.xml"
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !submitting) {
                      handleSubmit();
                    }
                  }}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Enter the path relative to your site URL (e.g., "sitemap.xml") or the full URL
                </p>
              </div>
              <div className="flex gap-3">
                <Button
                  onClick={handleSubmit}
                  disabled={submitting || !newSitemapPath.trim() || !selectedSite}
                  className="bg-blue-600 hover:bg-blue-700 text-white disabled:bg-gray-400"
                >
                  {submitting ? (
                    <>
                      <FontAwesomeIcon icon={faSpinner} className="mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <FontAwesomeIcon icon={faCheckCircle} className="mr-2" />
                      Submit
                    </>
                  )}
                </Button>
                <Button
                  onClick={() => {
                    setShowSubmitForm(false);
                    setNewSitemapPath('');
                    setError(null);
                  }}
                  variant="outline"
                  className="border-gray-300"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <FontAwesomeIcon icon={faExclamationTriangle} className="text-red-600 mr-2" />
              <p className="text-red-800">{error}</p>
            </div>
          </div>
        )}

        {/* Success Display */}
        {success && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <FontAwesomeIcon icon={faCheckCircle} className="text-green-600 mr-2" />
              <p className="text-green-800">{success}</p>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-8 text-center mb-6">
            <FontAwesomeIcon icon={faSpinner} className="animate-spin text-blue-600 text-2xl mb-4" />
            <p className="text-blue-800">Loading sitemaps...</p>
          </div>
        )}

        {/* Sitemaps List */}
        {!loading && selectedSite && (
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                Sitemaps ({sitemaps.length})
              </h2>
            </div>

            {sitemaps.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <FontAwesomeIcon icon={faSitemap} className="text-4xl mb-4 text-gray-300" />
                <p>No sitemaps found for this site.</p>
                <p className="text-sm mt-2">Click "Submit Sitemap" to add one.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full table-fixed">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-1/3">
                        Sitemap Path
                      </th>
                      <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-16">
                        Type
                      </th>
                      <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-24">
                        Status
                      </th>
                      <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-32">
                        Submitted
                      </th>
                      <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-32">
                        Downloaded
                      </th>
                      <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-28">
                        Contents
                      </th>
                      <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-20">
                        Issues
                      </th>
                      <th className="px-3 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider w-24">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {sitemaps.map((sitemap, index) => (
                      <tr key={index} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-start gap-2 min-w-0">
                            <span className="text-sm font-medium text-gray-900 break-words truncate">
                              {sitemap.path}
                            </span>
                            {sitemap.isSitemapsIndex && (
                              <span className="px-1.5 py-0.5 text-xs font-medium bg-blue-100 text-blue-800 rounded flex-shrink-0">
                                Index
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-3 py-3">
                          <span className="text-sm text-gray-900">{sitemap.type || 'N/A'}</span>
                        </td>
                        <td className="px-3 py-3">
                          <div className="flex flex-col gap-1">
                            <span className={`text-xs font-medium ${getStatusColor(sitemap)}`}>
                              {getStatusText(sitemap)}
                            </span>
                            {sitemap.isPending && (
                              <span className="px-1.5 py-0.5 text-xs font-medium bg-yellow-100 text-yellow-800 rounded w-fit">
                                Pending
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-3 py-3">
                          <span className="text-xs text-gray-900">{formatDate(sitemap.lastSubmitted)}</span>
                        </td>
                        <td className="px-3 py-3">
                          <span className="text-xs text-gray-900">{formatDate(sitemap.lastDownloaded)}</span>
                        </td>
                        <td className="px-3 py-3">
                          {sitemap.contents && sitemap.contents.length > 0 ? (
                            <div className="flex flex-col gap-1">
                              {sitemap.contents.map((content, contentIndex) => (
                                <span
                                  key={contentIndex}
                                  className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 w-fit"
                                >
                                  {content.type}: {parseInt(String(content.submitted)).toLocaleString()}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400">N/A</span>
                          )}
                        </td>
                        <td className="px-3 py-3">
                          <div className="flex flex-col gap-1 text-xs">
                            {sitemap.errors !== undefined && parseInt(String(sitemap.errors)) > 0 && (
                              <div className="flex items-center text-red-600">
                                <FontAwesomeIcon icon={faExclamationTriangle} className="mr-1 text-xs" />
                                <span className="font-medium">{sitemap.errors}</span>
                              </div>
                            )}
                            {sitemap.warnings !== undefined && parseInt(String(sitemap.warnings)) > 0 && (
                              <div className="flex items-center text-yellow-600">
                                <FontAwesomeIcon icon={faInfoCircle} className="mr-1 text-xs" />
                                <span className="font-medium">{sitemap.warnings}</span>
                              </div>
                            )}
                            {(!sitemap.errors || parseInt(String(sitemap.errors)) === 0) && 
                             (!sitemap.warnings || parseInt(String(sitemap.warnings)) === 0) && (
                              <span className="text-gray-400">None</span>
                            )}
                          </div>
                        </td>
                        <td className="px-3 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              onClick={() => handleViewDetails(sitemap)}
                              disabled={detailLoading}
                              variant="outline"
                              size="sm"
                              className="text-blue-600 border-blue-300 hover:bg-blue-50 disabled:opacity-50 text-xs px-2 py-1"
                            >
                              {detailLoading && selectedSitemapDetail?.path === sitemap.path ? (
                                <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
                              ) : (
                                <>
                                  <FontAwesomeIcon icon={faEye} className="mr-1" />
                                  View
                                </>
                              )}
                            </Button>
                            <Button
                              onClick={() => handleDelete(sitemap.path)}
                              disabled={deleting === sitemap.path}
                              variant="outline"
                              size="sm"
                              className="text-red-600 border-red-300 hover:bg-red-50 disabled:opacity-50 text-xs px-2 py-1"
                            >
                              {deleting === sitemap.path ? (
                                <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
                              ) : (
                                <>
                                  <FontAwesomeIcon icon={faTrash} className="mr-1" />
                                  Delete
                                </>
                              )}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {!selectedSite && !loading && (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <FontAwesomeIcon icon={faSitemap} className="text-4xl mb-4 text-gray-300" />
            <p className="text-gray-500">Please select a site to view sitemaps</p>
          </div>
        )}

        {/* Sitemap Detail Modal */}
        {selectedSitemapDetail && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
                <h2 className="text-2xl font-semibold text-gray-900">Sitemap Details</h2>
                <Button
                  onClick={() => {
                    setSelectedSitemapDetail(null);
                    setDetailError(null);
                  }}
                  variant="ghost"
                  size="icon"
                  className="text-gray-500 hover:text-gray-700"
                >
                  <FontAwesomeIcon icon={faTimes} />
                </Button>
              </div>

              <div className="p-6 space-y-6">
                {detailError && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-center">
                      <FontAwesomeIcon icon={faExclamationTriangle} className="text-red-600 mr-2" />
                      <p className="text-red-800">{detailError}</p>
                    </div>
                  </div>
                )}

                {!detailError && (
                  <>
                    {/* Basic Information */}
                    <div className="border border-gray-200 rounded-lg p-4">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm font-medium text-gray-700 mb-1">Path</p>
                          <p className="text-sm text-gray-900 break-all">{selectedSitemapDetail.path}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-700 mb-1">Type</p>
                          <p className="text-sm text-gray-900">{selectedSitemapDetail.type || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-700 mb-1">Status</p>
                          <div className="flex items-center gap-2">
                            <span className={`text-sm font-medium ${getStatusColor(selectedSitemapDetail)}`}>
                              {getStatusText(selectedSitemapDetail)}
                            </span>
                            {selectedSitemapDetail.isPending && (
                              <span className="px-2 py-0.5 text-xs font-medium bg-yellow-100 text-yellow-800 rounded">
                                Pending
                              </span>
                            )}
                            {selectedSitemapDetail.isSitemapsIndex && (
                              <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                                Index
                              </span>
                            )}
                          </div>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-700 mb-1">Last Submitted</p>
                          <p className="text-sm text-gray-900">{formatDate(selectedSitemapDetail.lastSubmitted)}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-700 mb-1">Last Downloaded</p>
                          <p className="text-sm text-gray-900">{formatDate(selectedSitemapDetail.lastDownloaded)}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-700 mb-1">Errors</p>
                          <p className="text-sm text-gray-900">
                            {selectedSitemapDetail.errors !== undefined ? selectedSitemapDetail.errors : '0'}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-700 mb-1">Warnings</p>
                          <p className="text-sm text-gray-900">
                            {selectedSitemapDetail.warnings !== undefined ? selectedSitemapDetail.warnings : '0'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Contents */}
                    {selectedSitemapDetail.contents && selectedSitemapDetail.contents.length > 0 && (
                      <div className="border border-gray-200 rounded-lg p-4">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Contents</h3>
                        <div className="space-y-3">
                          {selectedSitemapDetail.contents.map((content, index) => (
                            <div key={index} className="bg-gray-50 rounded p-3">
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-gray-900">{content.type}</span>
                                <div className="flex gap-4 text-sm">
                                  <div>
                                    <span className="text-gray-600">Submitted: </span>
                                    <span className="font-medium text-gray-900">
                                      {parseInt(String(content.submitted)).toLocaleString()}
                                    </span>
                                  </div>
                                  {content.indexed !== undefined && (
                                    <div>
                                      <span className="text-gray-600">Indexed: </span>
                                      <span className="font-medium text-gray-900">
                                        {parseInt(String(content.indexed)).toLocaleString()}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Raw Data (for debugging) */}
                    <div className="border border-gray-200 rounded-lg p-4">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Raw Data</h3>
                      <pre className="bg-gray-50 rounded p-3 text-xs overflow-x-auto">
                        {JSON.stringify(selectedSitemapDetail, null, 2)}
                      </pre>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

