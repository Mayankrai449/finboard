'use client';

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

interface StockCardProps {
  stockData: StockData;
}

export default function StockCard({ stockData }: StockCardProps) {
  return (
    <div className="relative max-w-6xl mx-auto">
      <div className="absolute -inset-1 bg-linear-to-r from-[#00d4ff] via-[#0066ff] to-[#00d4ff] rounded-2xl blur-lg opacity-15"></div>
      
      {/* Main Card */}
      <div className="relative bg-linear-to-br from-[#1a1a2e] to-[#16213e] rounded-2xl shadow-2xl border border-[#00d4ff]/20 overflow-hidden">
        
        {/* Top Bar */}
        <div className="h-px bg-linear-to-r from-transparent via-[#00d4ff]/40 to-transparent"></div>
        
        <div className="p-6">
          {/* Header Section */}
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-4xl font-bold bg-linear-to-r from-[#00d4ff] to-[#00b8e6] bg-clip-text text-transparent mb-1">
                {stockData.companyName}
              </h2>
              <span className="text-gray-400 text-lg font-medium">({stockData.symbol})</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#0f0f1a] border border-[#00d4ff]/30">
              <div className="w-2 h-2 rounded-full bg-[#00ff88]"></div>
              <span className="text-xs text-gray-400 uppercase tracking-wider">Live</span>
            </div>
          </div>

          {/* Price Section */}
          <div className="mb-6 pb-6 border-b border-[#333]/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 mb-2 uppercase tracking-widest font-semibold">Current Price</p>
                <p className="text-5xl font-bold text-white">
                  ${stockData.currentPrice.toFixed(2)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500 mb-2 uppercase tracking-widest font-semibold">Change</p>
                <div className="flex items-baseline justify-end gap-3">
                  <p className={`text-3xl font-bold ${
                    stockData.change >= 0 ? 'text-[#00ff88]' : 'text-[#ff4d4d]'
                  }`}>
                    {stockData.change >= 0 ? '↗' : '↘'} {stockData.change >= 0 ? '+' : ''}{stockData.change.toFixed(2)}
                  </p>
                  <p className={`text-xl font-semibold ${
                    stockData.change >= 0 ? 'text-[#00ff88]/80' : 'text-[#ff4d4d]/80'
                  }`}>
                    ({stockData.changePercent.toFixed(2)}%)
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Section */}
          <div className="space-y-0 mb-6">
            {[
              { label: 'Open', value: `$${stockData.openPrice.toFixed(2)}` },
              { label: 'High', value: `$${stockData.highPrice.toFixed(2)}` },
              { label: 'Low', value: `$${stockData.lowPrice.toFixed(2)}` },
              { label: 'Previous Close', value: `$${stockData.previousClose.toFixed(2)}` },
            ].map((item, index) => (
              <div key={item.label}>
                <div className="flex items-center justify-between py-4">
                  <span className="text-sm text-gray-400 font-medium">
                    {item.label}
                  </span>
                  <span className="text-xl font-bold text-white">
                    {item.value}
                  </span>
                </div>
                {index < 3 && <div className="h-px bg-[#333]/30"></div>}
              </div>
            ))}
          </div>

          {/* Info Section */}
          <div className="space-y-0 pt-6 border-t border-[#333]/30">
            {[
              { label: 'Industry', value: stockData.industry },
              { label: 'Country', value: stockData.country },
            ].map((item, index) => (
              <div key={item.label}>
                <div className="flex items-center justify-between py-4">
                  <span className="text-sm text-gray-400 font-medium">
                    {item.label}
                  </span>
                  <span className="text-lg font-medium text-white">
                    {item.value}
                  </span>
                </div>
                {index < 1 && <div className="h-px bg-[#333]/30"></div>}
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Accent */}
        <div className="h-px bg-linear-to-r from-transparent via-[#00d4ff]/20 to-transparent"></div>
      </div>
    </div>
  );
}
