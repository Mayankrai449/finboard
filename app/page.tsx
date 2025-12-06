'use client';

import { useEffect, useRef, useState } from 'react';
import Navbar from '@/components/Navbar';
import StockCard from '@/components/StockCard';
import AddWidgetForm from '@/components/AddWidgetForm';
import { useAppDispatch, useAppSelector } from '@/lib/store/hooks';
import {
  addWidget,
  removeWidget,
  updateWidgetData,
  updateWidget,
  setShowForm,
  setLoading,
  setError,
  type Widget,
  type StockData,
  type SelectedField,
} from '@/lib/store/slices/widgetsSlice';
import type { SelectedFieldItem } from '@/components/FieldSelector';

export default function Home() {
  const dispatch = useAppDispatch();
  const { widgets, showForm, loading, error } = useAppSelector((state) => state.widgets);
  const refreshIntervalRefs = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const [editingWidget, setEditingWidget] = useState<Widget | null>(null);

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

  const fetchStockDataWithFields = async (id: string, symbol: string): Promise<any> => {
    try {
      const response = await fetch(`/api/stock-explore?symbol=${symbol}`);
      const data = await response.json();

      if (!response.ok) {
        console.error(`Failed to fetch ${symbol}:`, data.error);
        return null;
      }

      // Update widget with both mapped data and raw data
      dispatch(updateWidgetData({ 
        id, 
        data: data.mapped,
        rawData: data
      }));
      
      return data;
    } catch (err) {
      console.error(`Failed to fetch ${symbol}:`, err);
      return null;
    }
  };

  const fetchCustomApiData = async (id: string, url: string): Promise<any> => {
    try {
      const response = await fetch(`/api/custom-api?url=${encodeURIComponent(url)}`);
      const data = await response.json();

      if (!response.ok) {
        console.error(`Failed to fetch from ${url}:`, data.error);
        return null;
      }

      // Update widget with raw data
      dispatch(updateWidgetData({ 
        id, 
        data: {
          symbol: url,
          companyName: 'Custom API',
          currentPrice: 0,
          highPrice: 0,
          lowPrice: 0,
          openPrice: 0,
          previousClose: 0,
          change: 0,
          changePercent: 0,
          industry: 'N/A',
          country: 'N/A',
        },
        rawData: data
      }));
      
      return data;
    } catch (err) {
      console.error(`Failed to fetch from ${url}:`, err);
      return null;
    }
  };

  const handleAddWidget = async (
    name: string,
    description: string,
    symbol: string,
    refreshRate: number,
    selectedFields: SelectedFieldItem[],
    customApiUrl?: string
  ) => {
    const id = `${symbol}-${Date.now()}`;
    
    // Create new widget with custom fields
    const newWidget: Widget = {
      id,
      name,
      description,
      symbol,
      customApiUrl,
      refreshRate,
      selectedFields: selectedFields.map(f => ({
        path: f.path,
        label: f.label,
        type: f.type
      })),
      data: null,
      rawData: null,
      lastUpdated: new Date().toISOString(),
    };

    dispatch(addWidget(newWidget));
    dispatch(setShowForm(false));
    dispatch(setLoading(true));
    dispatch(setError(''));
    
    // Fetch initial data and validate
    const fullData = customApiUrl 
      ? await fetchCustomApiData(id, customApiUrl)
      : await fetchStockDataWithFields(id, symbol);
    
    dispatch(setLoading(false));
    
    if (!fullData) {
      // Remove the widget if initial fetch failed
      dispatch(removeWidget(id));
      dispatch(setError(`Failed to add widget: ${customApiUrl ? 'Invalid API URL' : `Invalid stock symbol "${symbol}"`} or API error`));
      return;
    }

    // Set up refresh interval for this specific widget if initial fetch succeeded
    const interval = setInterval(() => {
      if (customApiUrl) {
        fetchCustomApiData(id, customApiUrl);
      } else {
        fetchStockDataWithFields(id, symbol);
      }
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

  const handleRefreshWidget = (id: string, symbol: string, customApiUrl?: string) => {
    if (customApiUrl) {
      fetchCustomApiData(id, customApiUrl);
    } else {
      fetchStockDataWithFields(id, symbol);
    }
  };

  const handleEditWidget = (widget: Widget) => {
    setEditingWidget(widget);
    dispatch(setShowForm(true));
  };

  const handleUpdateWidget = async (
    name: string,
    description: string,
    symbol: string,
    refreshRate: number,
    selectedFields: SelectedFieldItem[],
    customApiUrl?: string
  ) => {
    if (!editingWidget) return;

    const id = editingWidget.id;
    
    // Clear old interval
    const oldInterval = refreshIntervalRefs.current.get(id);
    if (oldInterval) {
      clearInterval(oldInterval);
      refreshIntervalRefs.current.delete(id);
    }

    // Update widget
    const updatedWidget: Widget = {
      ...editingWidget,
      name,
      description,
      symbol,
      customApiUrl,
      refreshRate,
      selectedFields: selectedFields.map(f => ({
        path: f.path,
        label: f.label,
        type: f.type
      })),
    };

    dispatch(updateWidget(updatedWidget));
    dispatch(setShowForm(false));
    setEditingWidget(null);
    dispatch(setLoading(true));
    dispatch(setError(''));
    
    // Fetch new data
    const fullData = customApiUrl 
      ? await fetchCustomApiData(id, customApiUrl)
      : await fetchStockDataWithFields(id, symbol);
    
    dispatch(setLoading(false));
    
    if (!fullData) {
      dispatch(setError(`Failed to update widget: ${customApiUrl ? 'Invalid API URL' : `Invalid stock symbol "${symbol}"`} or API error`));
      return;
    }

    // Set up new refresh interval
    const interval = setInterval(() => {
      if (customApiUrl) {
        fetchCustomApiData(id, customApiUrl);
      } else {
        fetchStockDataWithFields(id, symbol);
      }
    }, refreshRate * 1000);
    
    refreshIntervalRefs.current.set(id, interval);
  };

  const handleCloseForm = () => {
    dispatch(setShowForm(false));
    setEditingWidget(null);
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
        <div className="space-y-6">
          {widgets.map((widget) => (
            <div key={widget.id} className="relative">
              {widget.data ? (
                <StockCard 
                  widgetName={widget.name}
                  widgetDescription={widget.description}
                  stockData={widget.data}
                  selectedFields={widget.selectedFields}
                  rawData={widget.rawData}
                  refreshRate={widget.refreshRate}
                  lastUpdated={widget.lastUpdated || new Date().toISOString()}
                  onRefresh={() => handleRefreshWidget(widget.id, widget.symbol, widget.customApiUrl)}
                  onEdit={() => handleEditWidget(widget)}
                  onDelete={() => handleRemoveWidget(widget.id)}
                />
              ) : (
                <div className="max-w-4xl mx-auto text-center py-8 text-gray-400">
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
          onAddWidget={editingWidget ? handleUpdateWidget : handleAddWidget}
          onClose={handleCloseForm}
          initialData={editingWidget ? {
            name: editingWidget.name,
            description: editingWidget.description || '',
            symbol: editingWidget.symbol,
            apiUrl: editingWidget.customApiUrl || '',
            refreshRate: editingWidget.refreshRate.toString(),
            selectedFields: editingWidget.selectedFields.map(f => ({
              path: f.path,
              label: f.label,
              type: f.type,
            })),
            activeTab: editingWidget.customApiUrl ? 'api-url' as const : 'symbol' as const,
          } : undefined}
        />
      )}
    </div>
  );
}
