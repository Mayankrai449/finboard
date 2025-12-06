'use client';

import { useState, useEffect, useRef } from 'react';
import Navbar from '@/components/Navbar';
import StockCard from '@/components/StockCard';
import AddWidgetForm from '@/components/AddWidgetForm';

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

interface Widget {
  symbol: string;
  refreshRate: number;
  data: StockData | null;
}

export default function Home() {
  const [widget, setWidget] = useState<Widget | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchStockData = async (symbol: string) => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/stock?symbol=${symbol}`);
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to fetch stock data');
        setWidget(null);
        return;
      }

      setWidget(prev => prev ? { ...prev, data } : null);
    } catch (err) {
      setError('Failed to fetch stock data');
      setWidget(null);
    } finally {
      setLoading(false);
    }
  };

  const handleAddWidget = (symbol: string, refreshRate: number) => {
    // Clear any existing interval
    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current);
    }

    // Create new widget
    setWidget({
      symbol,
      refreshRate,
      data: null,
    });

    setShowForm(false);
    
    // Fetch initial data
    fetchStockData(symbol);

    // Set up refresh interval
    refreshIntervalRef.current = setInterval(() => {
      fetchStockData(symbol);
    }, refreshRate * 1000);
  };

  const handleRemoveWidget = () => {
    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current);
    }
    setWidget(null);
    setError('');
  };

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, []);

  return (
    <div>
      <Navbar />
      
      <div className="container" style={{ paddingTop: '2rem' }}>
        {/* Title */}
        <div className="text-center" style={{ marginBottom: '3rem' }}>
          <h1 className="text-5xl font-bold bg-linear-to-r from-[#00d4ff] to-[#00b8e6] bg-clip-text text-transparent" style={{ marginBottom: '0' }}>
            Financial Dashboard
          </h1>
        </div>

        {/* Add Widget Button */}
        {!widget && (
          <div className="flex justify-center mb-8">
            <button
              onClick={() => setShowForm(true)}
              className="group relative px-8 py-4 bg-linear-to-r from-[#00d4ff] to-[#0066ff] text-[#0f0f1a] rounded-xl font-bold text-lg hover:from-[#00b8e6] hover:to-[#0055cc] transition-all shadow-lg shadow-[#00d4ff]/30 hover:shadow-[#00d4ff]/50 hover:scale-105 cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Stock Widget
              </span>
            </button>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="max-w-2xl mx-auto mb-6 bg-[#2a1a1a] border border-[#ff4d4d] rounded-lg p-4 text-[#ff4d4d] text-center">
            {error}
          </div>
        )}

        {/* Widget Display */}
        {widget && widget.data && (
          <div className="relative">
            <StockCard stockData={widget.data} />
            
            {/* Remove Widget Button */}
            <div className="flex justify-center mt-6">
              <button
                onClick={handleRemoveWidget}
                className="text-sm text-gray-400 hover:text-[#ff4d4d] transition-colors underline cursor-pointer"
              >
                Remove Widget
              </button>
            </div>
          </div>
        )}

      </div>

      {/* Add Widget Form Modal */}
      {showForm && (
        <AddWidgetForm
          onAddWidget={handleAddWidget}
          onClose={() => setShowForm(false)}
        />
      )}
    </div>
  );
}
