'use client';

import StatRow from './StatRow';

interface StockData {
  symbol: string;
  companyName: string;
  currentPrice: number;
  highPrice: number;
  lowPrice: number;
  openPrice: number;
  previousClose: number;
  change: number;
  changePercent: number;
  industry: string;
  country: string;
}

interface SelectedField {
  path: string;
  label: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'null';
}

interface StockCardProps {
  widgetName?: string;
  widgetDescription?: string;
  stockData: StockData;
  selectedFields?: SelectedField[];
  rawData?: any;
  refreshRate: number;
  lastUpdated: string;
  onRefresh: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

// Function to get nested value from object using path
function getValueByPath(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => current?.[key], obj);
}

// Function to format values based on type
function formatValue(value: any, type: string): string {
  if (value === null || value === undefined) return 'N/A';
  
  switch (type) {
    case 'number':
      return Number(value).toLocaleString();
    case 'boolean':
      return value ? 'Yes' : 'No';
    case 'array':
      return JSON.stringify(value);
    case 'string':
    default:
      return String(value);
  }
}

export default function StockCard({ 
  widgetName,
  widgetDescription,
  stockData, 
  selectedFields,
  rawData,
  refreshRate,
  lastUpdated,
  onRefresh,
  onEdit,
  onDelete
}: StockCardProps) {
  // Use custom fields if provided, otherwise fall back to default display
  const useCustomFields = selectedFields && selectedFields.length > 0 && rawData;

  const formatLastUpdated = (isoString: string) => {
    const date = new Date(isoString);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
  };

  const formatRefreshRate = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    return `${Math.floor(seconds / 60)}m`;
  };

  if (useCustomFields) {
    return (
      <div className="relative max-w-4xl mx-auto">
        <div className="absolute -inset-0.5 bg-linear-to-r from-[#00d4ff] via-[#0066ff] to-[#00d4ff] rounded-xl blur opacity-10"></div>
        
        {/* Main Card */}
        <div className="relative bg-linear-to-br from-[#1a1a2e] to-[#16213e] rounded-xl shadow-xl border border-[#00d4ff]/20 overflow-hidden">
          
          {/* Top Bar */}
          <div className="h-px bg-linear-to-r from-transparent via-[#00d4ff]/40 to-transparent"></div>
          
          <div className="p-4">
            {/* Header Section */}
            <div className="mb-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h2 className="text-2xl font-bold bg-linear-to-r from-[#00d4ff] to-[#00b8e6] bg-clip-text text-transparent mb-1 truncate">
                    {widgetName || stockData.companyName}
                  </h2>
                  {widgetDescription && (
                    <p className="text-gray-400 text-xs mt-1 line-clamp-1">{widgetDescription}</p>
                  )}
                </div>
                
                {/* Action Icons */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={onRefresh}
                    className="p-2 hover:bg-[#00d4ff]/10 rounded-lg transition-colors group"
                    title="Refresh now"
                  >
                    <svg className="w-4 h-4 text-gray-400 group-hover:text-[#00d4ff]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </button>
                  <button
                    onClick={onEdit}
                    className="p-2 hover:bg-[#00d4ff]/10 rounded-lg transition-colors group"
                    title="Edit widget"
                  >
                    <svg className="w-4 h-4 text-gray-400 group-hover:text-[#00d4ff]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </button>
                  <button
                    onClick={onDelete}
                    className="p-2 hover:bg-[#ff4d4d]/10 rounded-lg transition-colors group"
                    title="Delete widget"
                  >
                    <svg className="w-4 h-4 text-gray-400 group-hover:text-[#ff4d4d]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            {/* Custom Fields Section */}
            <div className="space-y-0">
              {selectedFields!.map((field, index) => {
                const value = getValueByPath(rawData, field.path);
                const formattedValue = formatValue(value, field.type);
                const isLast = index === selectedFields!.length - 1;
                
                return (
                  <div key={field.path}>
                    <StatRow 
                      label={field.label} 
                      value={formattedValue}
                      showDivider={!isLast}
                    />
                  </div>
                );
              })}
            </div>

            {/* Footer Info */}
            <div className="flex gap-4 text-xs text-gray-500 mt-4 pt-3 border-t border-[#333]/30">
              <span>Last updated: {formatLastUpdated(lastUpdated)}</span>
              <span>Refresh: {formatRefreshRate(refreshRate)}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Default display
  return (
    <div className="relative max-w-4xl mx-auto">
      <div className="absolute -inset-0.5 bg-linear-to-r from-[#00d4ff] via-[#0066ff] to-[#00d4ff] rounded-xl blur opacity-10"></div>
      
      {/* Main Card */}
      <div className="relative bg-linear-to-br from-[#1a1a2e] to-[#16213e] rounded-xl shadow-xl border border-[#00d4ff]/20 overflow-hidden">
        
        {/* Top Bar */}
        <div className="h-px bg-linear-to-r from-transparent via-[#00d4ff]/40 to-transparent"></div>
        
        <div className="p-4">
          {/* Header Section */}
          <div className="mb-4 flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h2 className="text-2xl font-bold bg-linear-to-r from-[#00d4ff] to-[#00b8e6] bg-clip-text text-transparent mb-1 truncate">
                {stockData.companyName}
              </h2>
            </div>
            
            {/* Action Icons */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={onRefresh}
                className="p-2 hover:bg-[#00d4ff]/10 rounded-lg transition-colors group"
                title="Refresh now"
              >
                <svg className="w-4 h-4 text-gray-400 group-hover:text-[#00d4ff]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
              <button
                onClick={onEdit}
                className="p-2 hover:bg-[#00d4ff]/10 rounded-lg transition-colors group"
                title="Edit widget"
              >
                <svg className="w-4 h-4 text-gray-400 group-hover:text-[#00d4ff]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
              <button
                onClick={onDelete}
                className="p-2 hover:bg-[#ff4d4d]/10 rounded-lg transition-colors group"
                title="Delete widget"
              >
                <svg className="w-4 h-4 text-gray-400 group-hover:text-[#ff4d4d]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>

          {/* Price Section */}
          <div className="mb-4 pb-4 border-b border-[#333]/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 mb-1 uppercase tracking-wide font-semibold">Current Price</p>
                <p className="text-3xl font-bold text-white">
                  ${stockData.currentPrice.toFixed(2)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500 mb-1 uppercase tracking-wide font-semibold">Change</p>
                <div className="flex items-baseline justify-end gap-2">
                  <p className={`text-xl font-bold ${
                    stockData.change >= 0 ? 'text-[#00ff88]' : 'text-[#ff4d4d]'
                  }`}>
                    {stockData.change >= 0 ? '↗' : '↘'} {stockData.change >= 0 ? '+' : ''}{stockData.change.toFixed(2)}
                  </p>
                  <p className={`text-sm font-semibold ${
                    stockData.change >= 0 ? 'text-[#00ff88]/80' : 'text-[#ff4d4d]/80'
                  }`}>
                    ({stockData.changePercent.toFixed(2)}%)
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Section */}
          <div className="space-y-0 mb-4">
            <StatRow label="Open" value={`$${stockData.openPrice.toFixed(2)}`} showDivider />
            <StatRow label="High" value={`$${stockData.highPrice.toFixed(2)}`} showDivider />
            <StatRow label="Low" value={`$${stockData.lowPrice.toFixed(2)}`} showDivider />
            <StatRow label="Previous Close" value={`$${stockData.previousClose.toFixed(2)}`} />
          </div>

          {/* Info Section */}
          <div className="space-y-0 pt-4 border-t border-[#333]/30">
            <div>
              <div className="flex items-center justify-between py-3">
                <span className="text-xs text-gray-400 font-medium">Industry</span>
                <span className="text-sm font-medium text-white">{stockData.industry}</span>
              </div>
              <div className="h-px bg-[#333]/30"></div>
            </div>
            <div>
              <div className="flex items-center justify-between py-3">
                <span className="text-xs text-gray-400 font-medium">Country</span>
                <span className="text-sm font-medium text-white">{stockData.country}</span>
              </div>
            </div>
          </div>

          {/* Footer Info */}
          <div className="flex gap-4 text-xs text-gray-500 mt-4 pt-3 border-t border-[#333]/30">
            <span>Last updated: {formatLastUpdated(lastUpdated)}</span>
            <span>Refresh: {formatRefreshRate(refreshRate)}</span>
          </div>
        </div>

        {/* Bottom Accent */}
        <div className="h-px bg-linear-to-r from-transparent via-[#00d4ff]/20 to-transparent"></div>
      </div>
    </div>
  );
}
