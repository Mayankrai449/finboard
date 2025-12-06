'use client';

import { useEffect, useRef } from 'react';
import Navbar from '@/components/Navbar';
import StockCard from '@/components/StockCard';
import AddWidgetForm from '@/components/AddWidgetForm';
import { useAppDispatch, useAppSelector } from '@/lib/store/hooks';
import {
  addWidget,
  removeWidget,
  updateWidgetData,
  setShowForm,
  setLoading,
  setError,
  type Widget,
  type StockData,
} from '@/lib/store/slices/widgetsSlice';

export default function Home() {
  const dispatch = useAppDispatch();
  const { widgets, showForm, loading, error } = useAppSelector((state) => state.widgets);
  const refreshIntervalRefs = useRef<Map<string, NodeJS.Timeout>>(new Map());

  const fetchStockData = async (id: string, symbol: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/stock?symbol=${symbol}`);
      const data = await response.json();

      if (!response.ok) {
        console.error(`Failed to fetch ${symbol}:`, data.error);
        return false;
      }

      dispatch(updateWidgetData({ id, data }));
      return true;
    } catch (err) {
      console.error(`Failed to fetch ${symbol}:`, err);
      return false;
    }
  };

  const handleAddWidget = async (symbol: string, refreshRate: number) => {
    const id = `${symbol}-${Date.now()}`;
    
    // Create new widget
    const newWidget: Widget = {
      id,
      symbol,
      refreshRate,
      data: null,
    };

    dispatch(addWidget(newWidget));
    dispatch(setShowForm(false));
    dispatch(setLoading(true));
    dispatch(setError(''));
    
    // Fetch initial data and validate symbol
    const success = await fetchStockData(id, symbol);
    dispatch(setLoading(false));
    
    if (!success) {
      // Remove the widget if initial fetch failed
      dispatch(removeWidget(id));
      dispatch(setError(`Failed to add widget: Invalid stock symbol "${symbol}" or API error`));
      return;
    }

    // Set up refresh interval for this specific widget if initial fetch succeeded
    const interval = setInterval(() => {
      fetchStockData(id, symbol);
    }, refreshRate * 1000);
    
    refreshIntervalRefs.current.set(id, interval);
  };

  const handleRemoveWidget = (id: string) => {
    // Clear interval for this widget
    const interval = refreshIntervalRefs.current.get(id);
    if (interval) {
      clearInterval(interval);
      refreshIntervalRefs.current.delete(id);
    }
    
    // Remove widget from state
    dispatch(removeWidget(id));
  };

  // Cleanup all intervals on unmount
  useEffect(() => {
    return () => {
      refreshIntervalRefs.current.forEach(interval => clearInterval(interval));
      refreshIntervalRefs.current.clear();
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

        {/* Error Message */}
        {error && (
          <div className="max-w-6xl mx-auto mb-6 bg-[#2a1a1a] border border-[#ff4d4d] rounded-lg p-4 text-[#ff4d4d] text-center">
            {error}
          </div>
        )}

        {/* Widgets Display */}
        <div className="space-y-8">
          {widgets.map((widget) => (
            <div key={widget.id} className="relative">
              {widget.data ? (
                <>
                  <StockCard stockData={widget.data} />
                  
                  {/* Remove Widget Button */}
                  <div className="flex justify-center mt-6">
                    <button
                      onClick={() => handleRemoveWidget(widget.id)}
                      className="text-sm text-gray-400 hover:text-[#ff4d4d] transition-colors underline cursor-pointer"
                    >
                      Remove Widget
                    </button>
                  </div>
                </>
              ) : (
                <div className="max-w-6xl mx-auto text-center py-8 text-gray-400">
                  Loading {widget.symbol}...
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Add Widget Button - Always visible */}
        <div className="flex justify-center mt-8">
          <button
            onClick={() => dispatch(setShowForm(true))}
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

      </div>

      {/* Add Widget Form Modal */}
      {showForm && (
        <AddWidgetForm
          onAddWidget={handleAddWidget}
          onClose={() => dispatch(setShowForm(false))}
        />
      )}
    </div>
  );
}
