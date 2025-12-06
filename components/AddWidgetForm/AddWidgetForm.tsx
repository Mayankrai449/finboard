'use client';

import { useState, useEffect, useRef } from 'react';
import FieldSelector, { type SelectedFieldItem } from '@/components/FieldSelector';

interface AddWidgetFormProps {
  onAddWidget: (
    name: string,
    description: string,
    symbol: string,
    refreshRate: number,
    selectedFields: SelectedFieldItem[],
    customApiUrl?: string
  ) => void;
  onClose: () => void;
  initialData?: {
    name: string;
    description: string;
    symbol: string;
    apiUrl: string;
    refreshRate: string;
    selectedFields: SelectedFieldItem[];
    activeTab: TabType;
  };
}

type TabType = 'symbol' | 'api-url';

export default function AddWidgetForm({ onAddWidget, onClose, initialData }: AddWidgetFormProps) {
  const formRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<TabType>(initialData?.activeTab || 'symbol');
  const [name, setName] = useState(initialData?.name || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [symbol, setSymbol] = useState(initialData?.symbol || '');
  const [apiUrl, setApiUrl] = useState(initialData?.apiUrl || '');
  const [refreshRate, setRefreshRate] = useState(initialData?.refreshRate || '30');
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(!!initialData);
  const [apiResponse, setApiResponse] = useState<any>(null);
  const [selectedFields, setSelectedFields] = useState<SelectedFieldItem[]>(initialData?.selectedFields || []);
  const [error, setError] = useState('');

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
      let response;
      let data;

      if (activeTab === 'symbol') {
        if (!symbol.trim()) {
          setError('Please enter a stock symbol');
          return;
        }

        response = await fetch(`/api/stock-explore?symbol=${symbol.trim().toUpperCase()}`);
        data = await response.json();

        if (!response.ok) {
          setError(data.error || 'Failed to fetch stock data');
          return;
        }

        // Auto-fill widget name if empty
        if (!name && data.profile?.name) {
          setName(data.profile.name);
        }
      } else {
        // API URL tab
        if (!apiUrl.trim()) {
          setError('Please enter an API URL');
          return;
        }

        if (!isValidUrl(apiUrl.trim())) {
          setError('Please enter a valid URL');
          return;
        }

        response = await fetch(`/api/custom-api?url=${encodeURIComponent(apiUrl.trim())}`);
        data = await response.json();

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
      }

      setApiResponse(data);
      setIsConnected(true);
    } catch (err) {
      setError('Failed to connect to API');
      console.error(err);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleTabChange = (tab: TabType) => {
    if (!isConnected) {
      setActiveTab(tab);
      setError('');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      setError('Please enter a widget name');
      return;
    }

    if (activeTab === 'symbol' && !symbol.trim()) {
      setError('Please enter a stock symbol');
      return;
    }

    if (activeTab === 'api-url' && !apiUrl.trim()) {
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

    if (selectedFields.length === 0) {
      setError('Please select at least one field to display');
      return;
    }

    onAddWidget(
      name.trim(),
      description.trim(),
      activeTab === 'symbol' ? symbol.trim().toUpperCase() : apiUrl.trim(),
      rate,
      selectedFields,
      activeTab === 'api-url' ? apiUrl.trim() : undefined
    );
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-start justify-center z-50 p-4 overflow-y-auto">
      <div ref={formRef} className="relative max-w-2xl w-full my-8">
        {/* Glow effect */}
        <div className="absolute -inset-1 bg-linear-to-r from-[#00d4ff] via-[#0066ff] to-[#00d4ff] rounded-2xl blur-lg opacity-20"></div>
        
        {/* Form container */}
        <div className="relative bg-linear-to-br from-[#1a1a2e] to-[#16213e] rounded-2xl border border-[#00d4ff]/20 p-6 shadow-2xl">
          {/* Header */}
          <div className="mb-6">
            <h2 className="text-2xl font-bold bg-linear-to-r from-[#00d4ff] to-[#00b8e6] bg-clip-text text-transparent mb-1">
              {initialData ? 'Edit Widget' : 'Add Stock Widget'}
            </h2>
            <p className="text-gray-400 text-sm">{initialData ? 'Update your widget settings' : 'Configure your custom stock widget'}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Widget Name Input */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
                Widget Name <span className="text-[#ff4d4d]">*</span>
              </label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Apple Stock Tracker"
                className="w-full px-4 py-3 bg-[#0f0f1a] border border-[#333] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#00d4ff] focus:ring-1 focus:ring-[#00d4ff] transition-all"
                autoFocus
                disabled={isConnecting}
              />
            </div>

            {/* Description Input */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-2">
                Description <span className="text-gray-500 text-xs">(optional)</span>
              </label>
              <input
                type="text"
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g., Real-time Apple stock monitoring"
                className="w-full px-4 py-3 bg-[#0f0f1a] border border-[#333] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#00d4ff] focus:ring-1 focus:ring-[#00d4ff] transition-all"
                disabled={isConnecting}
              />
            </div>

            {/* Tabs for Symbol vs API URL */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-3">
                Data Source <span className="text-[#ff4d4d]">*</span>
              </label>
              
              {/* Tab Headers */}
              <div className="flex gap-2 mb-3">
                <button
                  type="button"
                  onClick={() => handleTabChange('symbol')}
                  disabled={isConnected || isConnecting}
                  className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all ${
                    activeTab === 'symbol'
                      ? 'bg-[#00d4ff] text-[#0f0f1a] shadow-lg shadow-[#00d4ff]/20'
                      : 'bg-[#0f0f1a] text-gray-400 hover:bg-[#1a1a2e] border border-[#333]'
                  } ${isConnected || isConnecting ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  Symbol
                </button>
                <button
                  type="button"
                  onClick={() => handleTabChange('api-url')}
                  disabled={isConnected || isConnecting}
                  className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all ${
                    activeTab === 'api-url'
                      ? 'bg-[#00d4ff] text-[#0f0f1a] shadow-lg shadow-[#00d4ff]/20'
                      : 'bg-[#0f0f1a] text-gray-400 hover:bg-[#1a1a2e] border border-[#333]'
                  } ${isConnected || isConnecting ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  API URL
                </button>
              </div>

              {/* Tab Content */}
              {activeTab === 'symbol' ? (
                <div>
                  <input
                    type="text"
                    id="symbol"
                    value={symbol}
                    onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                    placeholder="e.g., AAPL, GOOGL, MSFT"
                    className="w-full px-4 py-3 bg-[#0f0f1a] border border-[#333] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#00d4ff] focus:ring-1 focus:ring-[#00d4ff] transition-all"
                    disabled={isConnected || isConnecting}
                  />
                  <p className="text-xs text-gray-500 mt-1">Stock symbol for Finnhub API</p>
                </div>
              ) : (
                <div>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      id="apiUrl"
                      value={apiUrl}
                      onChange={(e) => setApiUrl(e.target.value)}
                      placeholder="e.g., https://api.coinbase.com/v2/exchange-rates?currency=BTC"
                      className="flex-1 px-4 py-3 bg-[#0f0f1a] border border-[#333] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#00d4ff] focus:ring-1 focus:ring-[#00d4ff] transition-all"
                      disabled={isConnecting}
                    />
                    {isConnected && (
                      <button
                        type="button"
                        onClick={handleConnect}
                        disabled={isConnecting || !apiUrl.trim()}
                        className="px-4 py-3 bg-[#00d4ff] text-[#0f0f1a] rounded-lg font-medium hover:bg-[#00b8e6] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Reconnect with updated URL"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Full URL to a JSON API endpoint</p>
                </div>
              )}
            </div>

            {/* Refresh Rate Input */}
            <div>
              <label htmlFor="refreshRate" className="block text-sm font-medium text-gray-300 mb-2">
                Refresh Interval (seconds) <span className="text-[#ff4d4d]">*</span>
              </label>
              <input
                type="number"
                id="refreshRate"
                value={refreshRate}
                onChange={(e) => setRefreshRate(e.target.value)}
                min="1"
                max="600"
                step="1"
                className="w-full px-4 py-3 bg-[#0f0f1a] border border-[#333] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#00d4ff] focus:ring-1 focus:ring-[#00d4ff] transition-all"
                disabled={isConnecting}
              />
              <p className="text-xs text-gray-500 mt-1">Range: 1-600 seconds (1s - 10min)</p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-[#2a1a1a] border border-[#ff4d4d] rounded-lg p-3 text-[#ff4d4d] text-sm">
                {error}
              </div>
            )}

            {/* Connect Button */}
            {!isConnected && (
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleConnect}
                  disabled={
                    isConnecting || 
                    (activeTab === 'symbol' && !symbol.trim()) ||
                    (activeTab === 'api-url' && !apiUrl.trim())
                  }
                  className="w-full px-4 py-3 bg-linear-to-r from-[#00d4ff] to-[#0066ff] text-[#0f0f1a] rounded-lg font-bold hover:from-[#00b8e6] hover:to-[#0055cc] transition-all shadow-lg shadow-[#00d4ff]/20 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {isConnecting ? 'Connecting...' : 'Connect'}
                </button>
              </div>
            )}

            {/* Field Selector - Shows after successful connection */}
            {isConnected && apiResponse && (
              <div className="pt-4 border-t border-[#333]/30 animate-slideDown">
                <FieldSelector
                  apiResponse={apiResponse}
                  selectedFields={selectedFields}
                  onFieldsChange={setSelectedFields}
                />
              </div>
            )}

            {/* Bottom Buttons */}
            <div className="flex flex-col gap-2 pt-2">
              {isConnecting && !isConnected && (
                <div className="text-sm text-gray-400 text-center py-2">
                  Loading fields...
                </div>
              )}
              {isConnected && (
                <button
                  type="button"
                  onClick={() => setIsConnected(false)}
                  className="px-4 py-2 text-sm text-gray-400 hover:text-[#00d4ff] transition-colors text-left cursor-pointer"
                >
                  ← Reconnect to modify fields
                </button>
              )}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-4 py-3 bg-[#0f0f1a] border border-[#333] text-gray-300 rounded-lg font-medium hover:bg-[#1a1a2e] hover:border-[#444] transition-all cursor-pointer"
                  disabled={isConnecting}
                >
                  Cancel
                </button>
                
                {isConnected && (
                  <button
                    type="submit"
                    className="flex-1 px-4 py-3 bg-linear-to-r from-[#00ff88] to-[#00cc6a] text-[#0f0f1a] rounded-lg font-bold hover:from-[#00dd77] hover:to-[#00bb5e] transition-all shadow-lg shadow-[#00ff88]/20 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={selectedFields.length === 0}
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
