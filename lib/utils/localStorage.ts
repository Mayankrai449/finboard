// Local Storage utility for widget persistence

import { Widget } from '@/lib/store/slices/widgetsSlice';

const STORAGE_KEY = 'finboard_widget_configs';

export interface WidgetConfig {
  id: string;
  name: string;
  description?: string;
  symbol: string;
  customApiUrl?: string;
  refreshRate: number;
  selectedFields: any[];
  displayMode?: 'card' | 'table' | 'chart';
  chartType?: 'candlestick' | 'linear';
  layout?: {
    i: string;
    x: number;
    y: number;
    w: number;
    h: number;
  };
}

// Extract config from widget
export function extractWidgetConfig(widget: Widget): WidgetConfig {
  return {
    id: widget.id,
    name: widget.name,
    description: widget.description,
    symbol: widget.symbol,
    customApiUrl: widget.customApiUrl,
    refreshRate: widget.refreshRate,
    selectedFields: widget.selectedFields,
    displayMode: widget.displayMode,
    chartType: widget.chartType,
    layout: widget.layout,
  };
}

// Save widget configs to local storage
export function saveWidgetConfigs(widgets: Widget[]): void {
  try {
    const configs = widgets.map(extractWidgetConfig);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(configs));
  } catch (error) {
    console.error('Failed to save widget configs to localStorage:', error);
  }
}

// Load widget configs from local storage
export function loadWidgetConfigs(): WidgetConfig[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    return JSON.parse(stored);
  } catch (error) {
    console.error('Failed to load widget configs from localStorage:', error);
    return [];
  }
}

// Clear all widget configs
export function clearWidgetConfigs(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear widget configs from localStorage:', error);
  }
}
