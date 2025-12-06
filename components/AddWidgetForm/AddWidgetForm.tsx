'use client';

import { useState } from 'react';

interface AddWidgetFormProps {
  onAddWidget: (symbol: string, refreshRate: number) => void;
  onClose: () => void;
}

export default function AddWidgetForm({ onAddWidget, onClose }: AddWidgetFormProps) {
  const [symbol, setSymbol] = useState('');
  const [refreshRate, setRefreshRate] = useState('30');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!symbol.trim()) {
      alert('Please enter a stock symbol');
      return;
    }

    const rate = parseInt(refreshRate);
    if (isNaN(rate) || rate < 1 || rate > 60) {
      alert('Refresh rate must be between 1 and 60 seconds');
      return;
    }

    onAddWidget(symbol.trim().toUpperCase(), rate);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="relative max-w-md w-full">
        {/* Glow effect */}
        <div className="absolute -inset-1 bg-linear-to-r from-[#00d4ff] via-[#0066ff] to-[#00d4ff] rounded-2xl blur-lg opacity-20"></div>
        
        {/* Form container */}
        <div className="relative bg-linear-to-br from-[#1a1a2e] to-[#16213e] rounded-2xl border border-[#00d4ff]/20 p-6 shadow-2xl">
          {/* Header */}
          <div className="mb-6">
            <h2 className="text-2xl font-bold bg-linear-to-r from-[#00d4ff] to-[#00b8e6] bg-clip-text text-transparent mb-1">
              Add Stock Widget
            </h2>
            <p className="text-gray-400 text-sm">Track your favorite stock in real-time</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Stock Symbol Input */}
            <div>
              <label htmlFor="symbol" className="block text-sm font-medium text-gray-300 mb-2">
                Stock Symbol
              </label>
              <input
                type="text"
                id="symbol"
                value={symbol}
                onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                placeholder="e.g., AAPL, GOOGL, MSFT"
                className="w-full px-4 py-3 bg-[#0f0f1a] border border-[#333] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#00d4ff] focus:ring-1 focus:ring-[#00d4ff] transition-all"
                autoFocus
              />
            </div>

            {/* Refresh Rate Input */}
            <div>
              <label htmlFor="refreshRate" className="block text-sm font-medium text-gray-300 mb-2">
                Refresh Rate (seconds)
              </label>
              <input
                type="number"
                id="refreshRate"
                value={refreshRate}
                onChange={(e) => setRefreshRate(e.target.value)}
                min="1"
                max="60"
                step="1"
                className="w-full px-4 py-3 bg-[#0f0f1a] border border-[#333] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#00d4ff] focus:ring-1 focus:ring-[#00d4ff] transition-all"
              />
              <p className="text-xs text-gray-500 mt-1">Range: 1-60 seconds</p>
            </div>

            {/* Buttons */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-3 bg-[#0f0f1a] border border-[#333] text-gray-300 rounded-lg font-medium hover:bg-[#1a1a2e] hover:border-[#444] transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-3 bg-linear-to-r from-[#00d4ff] to-[#0066ff] text-[#0f0f1a] rounded-lg font-bold hover:from-[#00b8e6] hover:to-[#0055cc] transition-all shadow-lg shadow-[#00d4ff]/20 cursor-pointer"
              >
                Add Widget
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
