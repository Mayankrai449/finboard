'use client';

import { useState, useEffect, useRef } from 'react';
import FieldSelector, { type SelectedFieldItem } from '@/components/FieldSelector';
import { hasValidOHLCData, mapToOHLC } from '@/lib/utils/ohlcMapper';

interface AddWidgetFormProps {
  onAddWidget: (
    name: string,
    description: string,
    apiUrl: string,
    refreshRate: number,
    selectedFields: SelectedFieldItem[],
    displayMode: 'card' | 'table' | 'chart',
    chartType?: 'candlestick' | 'linear'
  ) => void;
  onClose: () => void;
  initialData?: {
    name: string;
    description: string;
    apiUrl: string;
    refreshRate: string;
    selectedFields: SelectedFieldItem[];
    displayMode: 'card' | 'table' | 'chart';
    chartType?: 'candlestick' | 'linear';
  };
}

export default function AddWidgetForm({ onAddWidget, onClose, initialData }: AddWidgetFormProps) {
  const formRef = useRef<HTMLDivElement>(null);
  const lastConnectedUrl = useRef(initialData?.apiUrl || '');
  const [name, setName] = useState(initialData?.name || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [apiUrl, setApiUrl] = useState(initialData?.apiUrl || '');
  const [refreshRate, setRefreshRate] = useState(initialData?.refreshRate || '30');
  const [displayMode, setDisplayMode] = useState<'card' | 'table' | 'chart'>(initialData?.displayMode || 'card');
  const [chartType, setChartType] = useState<'candlestick' | 'linear'>(initialData?.chartType || 'candlestick');
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(!!initialData);
  const [apiResponse, setApiResponse] = useState<any>(null);
  const [selectedFields, setSelectedFields] = useState<SelectedFieldItem[]>(initialData?.selectedFields || []);
  const [error, setError] = useState('');
  const [ohlcValidationMessage, setOhlcValidationMessage] = useState<string>('');

  const isValidUrl = (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  // Auto-fetch API data when editing widget
  useEffect(() => {
    if (initialData) {
      handleConnect();
    }
  }, []);

  // Scroll form into view when it expands after connection
  useEffect(() => {
    if (isConnected && formRef.current) {
      formRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [isConnected]);

  const handleConnect = async () => {
    setIsConnecting(true);
    setError('');

    try {
      if (!apiUrl.trim()) {
        setError('Please enter an API URL');
        return;
      }

      if (!isValidUrl(apiUrl.trim())) {
        setError('Please enter a valid URL');
        return;
      }

      const response = await fetch(`/api/custom-api?url=${encodeURIComponent(apiUrl.trim())}`);
      const data = await response.json();

      if (!response.ok) {
        const statusCode = response.status;
        let friendlyMessage = 'Failed to fetch data from the API';
        
        if (statusCode === 404) {
          friendlyMessage = 'The API endpoint was not found (404). Please check the URL.';
        } else if (statusCode === 403) {
          friendlyMessage = 'Access denied (403). The API may require authentication.';
        } else if (statusCode === 500) {
          friendlyMessage = 'The API server encountered an error (500).';
        } else if (statusCode >= 400 && statusCode < 500) {
          friendlyMessage = `The API returned an error (${statusCode}). Please check the URL and try again.`;
        } else if (statusCode >= 500) {
          friendlyMessage = `The API server is experiencing issues (${statusCode}). Please try again later.`;
        }
        
        setError(friendlyMessage);
        return;
      }

      setApiResponse(data);
      setIsConnected(true);
      
      // Reset selected fields only when connecting to a different URL
      if (apiUrl.trim() !== lastConnectedUrl.current) {
        setSelectedFields([]);
        lastConnectedUrl.current = apiUrl.trim();
      }
      
      // Validate OHLC data for chart mode
      if (hasValidOHLCData(data)) {
        setOhlcValidationMessage('OHLC Data available for Charts');
      } else {
        setOhlcValidationMessage('OHLC Data not available for Charts');
      }
    } catch (err) {
      setError('Failed to connect to API');
      console.error(err);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      setError('Please enter a widget name');
      return;
    }

    if (!apiUrl.trim()) {
      setError('Please enter an API URL');
      return;
    }

    const rate = parseInt(refreshRate);
    if (isNaN(rate) || rate < 1 || rate > 600) {
      setError('Refresh rate must be between 1 and 600 seconds');
      return;
    }

    if (!isConnected) {
      setError('Please connect to the API first');
      return;
    }

    // For chart mode, field selection is not required
    if (displayMode !== 'chart' && selectedFields.length === 0) {
      setError('Please select at least one field to display');
      return;
    }

    // Validate table mode requirements
    if (displayMode === 'table') {
      const hasArrayField = selectedFields.some(f => f.type === 'array');
      const isRootArray = Array.isArray(apiResponse);
      
      if (!hasArrayField && !isRootArray) {
        setError('Table widget requires an array data source. Please select an array field.');
        return;
      }

      // Check if any columns are selected (non-array fields)
      const hasColumns = selectedFields.some(f => f.type !== 'array');
      if (!hasColumns) {
         setError('Please select at least one column to display in the table.');
         return;
      }
    }

    // Validate OHLC data for chart mode
    if (displayMode === 'chart' && !hasValidOHLCData(apiResponse)) {
      setError('Chart mode requires valid OHLC data format');
      return;
    }

    onAddWidget(
      name.trim(),
      description.trim(),
      apiUrl.trim(),
      rate,
      selectedFields,
      displayMode,
      displayMode === 'chart' ? chartType : undefined
    );
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-start justify-center z-50 p-4 overflow-y-auto">
      <div ref={formRef} className="relative max-w-2xl w-full my-8">
        {/* Glow effect */}
        <div className="absolute -inset-1 bg-linear-to-r from-primary via-blue-600 to-primary rounded-2xl blur-lg opacity-20"></div>
        
        {/* Form container */}
        <div className="relative bg-card rounded-2xl border border-primary/20 p-6 shadow-2xl transition-colors duration-300">
          {/* Header */}
          <div className="mb-6">
            <h2 className="text-2xl font-bold bg-linear-to-r from-primary to-blue-400 bg-clip-text text-transparent mb-1">
              {initialData ? 'Edit Widget' : 'Add Stock Widget'}
            </h2>
            <p className="text-muted-foreground text-sm">{initialData ? 'Update your widget settings' : 'Configure your custom stock widget'}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Widget Name Input */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-foreground mb-2">
                Widget Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Apple Stock Tracker"
                className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                autoFocus
                disabled={isConnecting}
              />
            </div>

            {/* Description Input */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-foreground mb-2">
                Description <span className="text-muted-foreground text-xs">(optional)</span>
              </label>
              <input
                type="text"
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g., Real-time Apple stock monitoring"
                className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                disabled={isConnecting}
              />
            </div>

            {/* API URL Input */}
            <div>
              <label htmlFor="apiUrl" className="block text-sm font-medium text-foreground mb-2">
                API URL <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="url"
                  id="apiUrl"
                  value={apiUrl}
                  onChange={(e) => setApiUrl(e.target.value)}
                  placeholder="e.g., https://api.coinbase.com/v2/exchange-rates?currency=BTC"
                  className="flex-1 px-4 py-3 bg-background border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                  disabled={isConnecting}
                />
                {isConnected && (
                  <button
                    type="button"
                    onClick={handleConnect}
                    disabled={isConnecting || !apiUrl.trim()}
                    className="px-4 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Reconnect with updated URL"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </button>
                )}
              </div>
              <div className="mt-2">
                <details className="mt-2">
                  <summary className="text-xs text-primary cursor-pointer hover:text-primary/80 transition-colors">
                    Supported APIs
                  </summary>
                  <div className="mt-2 p-3 bg-background rounded-lg border border-border space-y-2 text-xs text-muted-foreground">
                    <div>
                      <span className="text-primary font-medium">Twelve Data:</span>
                      <code className="block mt-1 text-[10px] text-muted-foreground">api.twelvedata.com/...</code>
                    </div>
                    <div>
                      <span className="text-primary font-medium">Alpha Vantage:</span>
                      <code className="block mt-1 text-[10px] text-muted-foreground">alphavantage.co/query?...</code>
                    </div>
                    <div>
                      <span className="text-primary font-medium">Finnhub:</span>
                      <code className="block mt-1 text-[10px] text-muted-foreground">finnhub.io/api/v1/...</code>
                    </div>
                    <div>
                      <span className="text-primary font-medium">Indian Stock API:</span>
                      <code className="block mt-1 text-[10px] text-muted-foreground">stock.indianapi.in/...</code>
                    </div>
                  </div>
                </details>
              </div>
            </div>

            {/* Refresh Rate Input */}
            <div>
              <label htmlFor="refreshRate" className="block text-sm font-medium text-foreground mb-2">
                Refresh Interval (seconds) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                id="refreshRate"
                value={refreshRate}
                onChange={(e) => setRefreshRate(e.target.value)}
                min="1"
                max="600"
                step="1"
                className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                disabled={isConnecting}
              />
              <p className="text-xs text-muted-foreground mt-1">Range: 1-600 seconds (1s - 10min)</p>
            </div>

            {/* Display Mode Selection */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-3">
                Display Mode <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setDisplayMode('card');
                    // Filter out array fields when switching to card mode
                    if (selectedFields.some(f => f.type === 'array')) {
                      setSelectedFields(selectedFields.filter(f => f.type !== 'array'));
                    }
                  }}
                  disabled={isConnecting}
                  className={`px-4 py-3 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
                    displayMode === 'card'
                      ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                      : 'bg-background text-muted-foreground hover:bg-muted border border-border'
                  } ${isConnecting ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                  </svg>
                  Card
                </button>
                <button
                  type="button"
                  onClick={() => setDisplayMode('table')}
                  disabled={isConnecting}
                  className={`px-4 py-3 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
                    displayMode === 'table'
                      ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                      : 'bg-background text-muted-foreground hover:bg-muted border border-border'
                  } ${isConnecting ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Table
                </button>
                <button
                  type="button"
                  onClick={() => setDisplayMode('chart')}
                  disabled={isConnecting || (isConnected && !hasValidOHLCData(apiResponse))}
                  className={`px-4 py-3 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
                    displayMode === 'chart'
                      ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                      : 'bg-background text-muted-foreground hover:bg-muted border border-border'
                  } ${(isConnecting || (isConnected && !hasValidOHLCData(apiResponse))) ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  Chart
                </button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {displayMode === 'card' 
                  ? 'Card view displays individual fields. Best for simple data structures.'
                  : displayMode === 'table'
                  ? 'Table view displays array data in rows. Requires API response with array fields.'
                  : 'Chart view displays OHLC financial data. Requires valid candlestick data format.'}
              </p>
              
              {/* OHLC Validation Message */}
              {isConnected && ohlcValidationMessage && (
                <div className={`mt-2 text-xs p-2 rounded ${
                  ohlcValidationMessage === 'OHLC Data available for Charts'
                    ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-500/30' 
                    : 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-500/30'
                }`}>
                  {ohlcValidationMessage}
                </div>
              )}
              
              {/* Chart Type Selection - Only show for chart mode */}
              {displayMode === 'chart' && (
                <div className="mt-3">
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Chart Type
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setChartType('candlestick')}
                      className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all ${
                        chartType === 'candlestick'
                          ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                          : 'bg-background text-muted-foreground hover:bg-muted border border-border'
                      } cursor-pointer`}
                    >
                      Candlestick
                    </button>
                    <button
                      type="button"
                      onClick={() => setChartType('linear')}
                      className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all ${
                        chartType === 'linear'
                          ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                          : 'bg-background text-muted-foreground hover:bg-muted border border-border'
                      } cursor-pointer`}
                    >
                      Linear
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Connect Button */}
            {!isConnected && (
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleConnect}
                  disabled={isConnecting || !apiUrl.trim()}
                  className="w-full px-4 py-3 bg-linear-to-r from-primary to-blue-600 text-primary-foreground rounded-lg font-bold hover:from-primary/90 hover:to-blue-700 transition-all shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {isConnecting ? 'Connecting...' : 'Connect'}
                </button>
              </div>
            )}

            {/* Field Selector - Shows after successful connection (not for chart mode) */}
            {isConnected && apiResponse && displayMode !== 'chart' && (
              <div className="pt-4 border-t border-border animate-slideDown">
                <FieldSelector
                  apiResponse={apiResponse}
                  selectedFields={selectedFields}
                  onFieldsChange={setSelectedFields}
                  displayMode={displayMode}
                />
              </div>
            )}
            
            {/* Chart Mode Info/Error */}
            {isConnected && apiResponse && displayMode === 'chart' && (
              <div className="pt-4 border-t border-border animate-slideDown">
                {hasValidOHLCData(apiResponse) ? (
                  <div className="bg-background/50 rounded-lg p-4 border border-primary/20">
                    <div className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-primary mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div>
                        <h4 className="text-sm font-medium text-foreground mb-1">Chart Mode Enabled</h4>
                        <p className="text-xs text-muted-foreground">
                          Charts automatically display OHLC (Open, High, Low, Close) data from the API response. 
                          No field selection is required. The chart will display all available time series data.
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-red-900/20 rounded-lg p-4 border border-red-500/50">
                    <div className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-red-500 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      <div>
                        <h4 className="text-sm font-medium text-red-500 mb-1">Valid Format Not Found</h4>
                        <p className="text-xs text-muted-foreground">
                          Charts display mode is not available. The API response does not contain valid OHLC (Open, High, Low, Close) time series data required for chart visualization.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="bg-red-900/20 border border-red-500 rounded-lg p-3 text-red-500 text-sm">
                {error}
              </div>
            )}

            {/* Bottom Buttons */}
            <div className="flex flex-col gap-2 pt-2">
              {isConnecting && !isConnected && (
                <div className="text-sm text-muted-foreground text-center py-2">
                  Loading fields...
                </div>
              )}
              {isConnected && (
                <button
                  type="button"
                  onClick={() => setIsConnected(false)}
                  className="px-4 py-2 text-sm text-muted-foreground hover:text-primary transition-colors text-left cursor-pointer"
                >
                  ← Reconnect to modify fields
                </button>
              )}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-4 py-3 bg-background border border-border text-muted-foreground rounded-lg font-medium hover:bg-muted hover:border-foreground/20 transition-all cursor-pointer"
                  disabled={isConnecting}
                >
                  Cancel
                </button>
                
                {isConnected && (
                  <button
                    type="submit"
                    className="flex-1 px-4 py-3 bg-linear-to-r from-green-500 to-green-600 text-white rounded-lg font-bold hover:from-green-600 hover:to-green-700 transition-all shadow-lg shadow-green-500/20 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {initialData ? 'Update Widget' : 'Add Widget'}
                  </button>
                )}
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
