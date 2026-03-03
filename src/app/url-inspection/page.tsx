'use client';

import { useState, useEffect } from 'react';
import { useData } from '@/contexts/DataContext';
import { Button } from '@/components/ui/button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMagnifyingGlass, faSpinner, faCheckCircle, faExclamationTriangle, faInfoCircle } from '@fortawesome/free-solid-svg-icons';

interface UrlInspectionResult {
  inspectionResult?: {
    indexStatusResult?: {
      verdict?: string;
      coverageState?: string;
      indexingState?: string;
      lastCrawlTime?: string;
      pageFetchState?: string;
      googleCanonical?: string;
      userCanonical?: string;
      referringUrls?: string[];
      crawledAs?: string;
      robotsTxtState?: string;
      sitemap?: string[];
    };
    ampResult?: {
      verdict?: string;
      issues?: Array<{
        severity?: string;
        issueMessage?: string;
      }>;
      ampIndexable?: boolean;
    };
    mobileUsabilityResult?: {
      verdict?: string;
      issues?: Array<{
        severity?: string;
        issueMessage?: string;
      }>;
    };
    richResultsResult?: {
      verdict?: string;
      detectedItems?: Array<{
        richResultType?: string;
        items?: Array<{
          name?: string;
          value?: string;
        }>;
      }>;
    };
  };
  error?: string;
}

export default function UrlInspectionPage() {
  const { sites, fetchSites } = useData();
  const [inspectionUrl, setInspectionUrl] = useState('');
  const [selectedSite, setSelectedSite] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<UrlInspectionResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSites();
    if (sites.length > 0 && !selectedSite) {
      setSelectedSite(sites[0]);
    }
  }, [sites]);

  const handleInspect = async () => {
    if (!inspectionUrl.trim()) {
      setError('Please enter a URL to inspect');
      return;
    }

    if (!selectedSite) {
      setError('Please select a site');
      return;
    }

    // Validate URL format
    try {
      new URL(inspectionUrl);
    } catch {
      setError('Please enter a valid URL (e.g., https://example.com/page)');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('http://localhost:5001/api/url-inspect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inspectionUrl: inspectionUrl.trim(),
          siteUrl: selectedSite,
          languageCode: 'en-US'
        })
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to inspect URL');
        return;
      }

      setResult(data);
    } catch (err) {
      console.error('Error inspecting URL:', err);
      setError('Failed to inspect URL. Make sure the backend is running on port 5001.');
    } finally {
      setLoading(false);
    }
  };

  const getVerdictColor = (verdict?: string) => {
    if (!verdict) return 'text-gray-600';
    const lowerVerdict = verdict.toLowerCase();
    if (lowerVerdict.includes('pass') || lowerVerdict.includes('valid')) {
      return 'text-green-600';
    }
    if (lowerVerdict.includes('fail') || lowerVerdict.includes('error')) {
      return 'text-red-600';
    }
    if (lowerVerdict.includes('warning') || lowerVerdict.includes('partial')) {
      return 'text-yellow-600';
    }
    return 'text-gray-600';
  };

  const getVerdictIcon = (verdict?: string) => {
    if (!verdict) return faInfoCircle;
    const lowerVerdict = verdict.toLowerCase();
    if (lowerVerdict.includes('pass') || lowerVerdict.includes('valid')) {
      return faCheckCircle;
    }
    if (lowerVerdict.includes('fail') || lowerVerdict.includes('error')) {
      return faExclamationTriangle;
    }
    return faInfoCircle;
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

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            🔍 URL Inspection
          </h1>
          <p className="text-gray-600">
            Inspect the index status of a URL in Google Search Console
          </p>
        </div>

        {/* Input Section */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Inspect URL</h2>
          
          <div className="space-y-4">
            <div>
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

            <div>
              <label htmlFor="url-input" className="block text-sm font-medium text-gray-700 mb-2">
                URL to Inspect
              </label>
              <input
                id="url-input"
                type="text"
                value={inspectionUrl}
                onChange={(e) => setInspectionUrl(e.target.value)}
                placeholder="https://example.com/page"
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !loading) {
                    handleInspect();
                  }
                }}
              />
            </div>

            <Button
              onClick={handleInspect}
              disabled={loading || !inspectionUrl.trim() || !selectedSite}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <FontAwesomeIcon icon={faSpinner} className="mr-2 animate-spin" />
                  Inspecting...
                </>
              ) : (
                <>
                  <FontAwesomeIcon icon={faMagnifyingGlass} className="mr-2" />
                  Inspect URL
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <FontAwesomeIcon icon={faExclamationTriangle} className="text-red-600 mr-2" />
              <p className="text-red-800">{error}</p>
            </div>
          </div>
        )}

        {/* Results Display */}
        {result && result.inspectionResult && (
          <div className="bg-white rounded-lg shadow p-6 space-y-6">
            <h2 className="text-2xl font-semibold text-gray-900">Inspection Results</h2>

            {/* Index Status Result */}
            {result.inspectionResult.indexStatusResult && (
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <FontAwesomeIcon icon={faInfoCircle} className="mr-2 text-blue-600" />
                  Index Status
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-1">Verdict</p>
                    <div className="flex items-center">
                      <FontAwesomeIcon 
                        icon={getVerdictIcon(result.inspectionResult.indexStatusResult.verdict)} 
                        className={`mr-2 ${getVerdictColor(result.inspectionResult.indexStatusResult.verdict)}`}
                      />
                      <p className={`font-semibold ${getVerdictColor(result.inspectionResult.indexStatusResult.verdict)}`}>
                        {result.inspectionResult.indexStatusResult.verdict || 'N/A'}
                      </p>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-1">Coverage State</p>
                    <p className="text-gray-900">{result.inspectionResult.indexStatusResult.coverageState || 'N/A'}</p>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-1">Indexing State</p>
                    <p className="text-gray-900">{result.inspectionResult.indexStatusResult.indexingState || 'N/A'}</p>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-1">Page Fetch State</p>
                    <p className="text-gray-900">{result.inspectionResult.indexStatusResult.pageFetchState || 'N/A'}</p>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-1">Last Crawl Time</p>
                    <p className="text-gray-900">{formatDate(result.inspectionResult.indexStatusResult.lastCrawlTime)}</p>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-1">Robots.txt State</p>
                    <p className="text-gray-900">{result.inspectionResult.indexStatusResult.robotsTxtState || 'N/A'}</p>
                  </div>

                  {result.inspectionResult.indexStatusResult.googleCanonical && (
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-1">Google Canonical</p>
                      <p className="text-gray-900 break-all">{result.inspectionResult.indexStatusResult.googleCanonical}</p>
                    </div>
                  )}

                  {result.inspectionResult.indexStatusResult.userCanonical && (
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-1">User Canonical</p>
                      <p className="text-gray-900 break-all">{result.inspectionResult.indexStatusResult.userCanonical}</p>
                    </div>
                  )}

                  {result.inspectionResult.indexStatusResult.crawledAs && (
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-1">Crawled As</p>
                      <p className="text-gray-900">{result.inspectionResult.indexStatusResult.crawledAs}</p>
                    </div>
                  )}

                  {result.inspectionResult.indexStatusResult.referringUrls && result.inspectionResult.indexStatusResult.referringUrls.length > 0 && (
                    <div className="md:col-span-2">
                      <p className="text-sm font-medium text-gray-700 mb-1">Referring URLs</p>
                      <ul className="list-disc list-inside space-y-1">
                        {result.inspectionResult.indexStatusResult.referringUrls.map((url, index) => (
                          <li key={index} className="text-gray-900 break-all">{url}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {result.inspectionResult.indexStatusResult.sitemap && result.inspectionResult.indexStatusResult.sitemap.length > 0 && (
                    <div className="md:col-span-2">
                      <p className="text-sm font-medium text-gray-700 mb-1">Sitemap</p>
                      <ul className="list-disc list-inside space-y-1">
                        {result.inspectionResult.indexStatusResult.sitemap.map((sitemap, index) => (
                          <li key={index} className="text-gray-900 break-all">{sitemap}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* AMP Result */}
            {result.inspectionResult.ampResult && (
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">AMP Result</h3>
                
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-1">Verdict</p>
                    <div className="flex items-center">
                      <FontAwesomeIcon 
                        icon={getVerdictIcon(result.inspectionResult.ampResult.verdict)} 
                        className={`mr-2 ${getVerdictColor(result.inspectionResult.ampResult.verdict)}`}
                      />
                      <p className={`font-semibold ${getVerdictColor(result.inspectionResult.ampResult.verdict)}`}>
                        {result.inspectionResult.ampResult.verdict || 'N/A'}
                      </p>
                    </div>
                  </div>

                  {result.inspectionResult.ampResult.ampIndexable !== undefined && (
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-1">AMP Indexable</p>
                      <p className="text-gray-900">{result.inspectionResult.ampResult.ampIndexable ? 'Yes' : 'No'}</p>
                    </div>
                  )}

                  {result.inspectionResult.ampResult.issues && result.inspectionResult.ampResult.issues.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-2">Issues</p>
                      <ul className="space-y-2">
                        {result.inspectionResult.ampResult.issues.map((issue, index) => (
                          <li key={index} className="bg-yellow-50 border border-yellow-200 rounded p-2">
                            <p className="text-sm font-medium text-gray-800">
                              {issue.severity || 'Issue'}: {issue.issueMessage || 'N/A'}
                            </p>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Mobile Usability Result */}
            {result.inspectionResult.mobileUsabilityResult && (
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Mobile Usability</h3>
                
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-1">Verdict</p>
                    <div className="flex items-center">
                      <FontAwesomeIcon 
                        icon={getVerdictIcon(result.inspectionResult.mobileUsabilityResult.verdict)} 
                        className={`mr-2 ${getVerdictColor(result.inspectionResult.mobileUsabilityResult.verdict)}`}
                      />
                      <p className={`font-semibold ${getVerdictColor(result.inspectionResult.mobileUsabilityResult.verdict)}`}>
                        {result.inspectionResult.mobileUsabilityResult.verdict || 'N/A'}
                      </p>
                    </div>
                  </div>

                  {result.inspectionResult.mobileUsabilityResult.issues && result.inspectionResult.mobileUsabilityResult.issues.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-2">Issues</p>
                      <ul className="space-y-2">
                        {result.inspectionResult.mobileUsabilityResult.issues.map((issue, index) => (
                          <li key={index} className="bg-yellow-50 border border-yellow-200 rounded p-2">
                            <p className="text-sm font-medium text-gray-800">
                              {issue.severity || 'Issue'}: {issue.issueMessage || 'N/A'}
                            </p>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Rich Results Result */}
            {result.inspectionResult.richResultsResult && (
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Rich Results</h3>
                
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-1">Verdict</p>
                    <div className="flex items-center">
                      <FontAwesomeIcon 
                        icon={getVerdictIcon(result.inspectionResult.richResultsResult.verdict)} 
                        className={`mr-2 ${getVerdictColor(result.inspectionResult.richResultsResult.verdict)}`}
                      />
                      <p className={`font-semibold ${getVerdictColor(result.inspectionResult.richResultsResult.verdict)}`}>
                        {result.inspectionResult.richResultsResult.verdict || 'N/A'}
                      </p>
                    </div>
                  </div>

                  {result.inspectionResult.richResultsResult.detectedItems && result.inspectionResult.richResultsResult.detectedItems.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-2">Detected Items</p>
                      <div className="space-y-4">
                        {result.inspectionResult.richResultsResult.detectedItems.map((item, index) => (
                          <div key={index} className="bg-blue-50 border border-blue-200 rounded p-3">
                            <p className="text-sm font-semibold text-gray-800 mb-2">
                              Type: {item.richResultType || 'Unknown'}
                            </p>
                            {item.items && item.items.length > 0 && (
                              <ul className="space-y-1">
                                {item.items.map((subItem, subIndex) => (
                                  <li key={subIndex} className="text-sm text-gray-700">
                                    <span className="font-medium">{subItem.name}:</span> {subItem.value}
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

