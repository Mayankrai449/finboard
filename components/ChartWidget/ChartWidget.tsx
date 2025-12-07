'use client';

import { useEffect, useRef } from 'react';
import { Chart, ChartConfiguration, registerables } from 'chart.js';
import { CandlestickController, CandlestickElement } from 'chartjs-chart-financial';
import 'chartjs-adapter-date-fns';
import { mapToOHLC, type OHLCDataPoint, type DataSourceFormat } from '@/lib/utils/ohlcMapper';

// Register Chart.js components
Chart.register(...registerables, CandlestickController, CandlestickElement);

interface ChartWidgetProps {
  widgetName?: string;
  widgetDescription?: string;
  rawData?: any;
  chartType: 'candlestick' | 'linear';
  refreshRate: number;
  lastUpdated: string;
  onRefresh: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export default function ChartWidget({
  widgetName,
  widgetDescription,
  rawData,
  chartType,
  refreshRate,
  lastUpdated,
  onRefresh,
  onEdit,
  onDelete,
}: ChartWidgetProps) {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstanceRef = useRef<Chart | null>(null);

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

  useEffect(() => {
    if (!chartRef.current || !rawData) return;

    // Map the data to OHLC format
    const mappingResult = mapToOHLC(rawData);

    if (mappingResult.format === 'unknown' || mappingResult.data.length === 0) {
      return; // Error state will be rendered
    }

    // Destroy existing chart
    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy();
    }

    const ctx = chartRef.current.getContext('2d');
    if (!ctx) return;

    // Prepare data based on chart type
    let chartConfig: ChartConfiguration;

    if (chartType === 'candlestick') {
      // Candlestick chart configuration
      const candlestickData = mappingResult.data.map((point: OHLCDataPoint) => ({
        x: typeof point.timestamp === 'number' 
          ? point.timestamp * 1000 // Convert Unix timestamp to milliseconds
          : new Date(point.timestamp).getTime(),
        o: point.open,
        h: point.high,
        l: point.low,
        c: point.close,
      }));

      chartConfig = {
        type: 'candlestick',
        data: {
          datasets: [
            {
              label: widgetName || 'OHLC Data',
              data: candlestickData as any,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: false,
            },
            tooltip: {
              enabled: true,
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
              titleColor: '#00d4ff',
              bodyColor: '#ffffff',
              borderColor: '#00d4ff',
              borderWidth: 1,
              padding: 12,
              displayColors: false,
            },
          },
          scales: {
            x: {
              type: 'time',
              time: {
                unit: 'minute',
              },
              grid: {
                color: 'rgba(0, 212, 255, 0.1)',
              },
              ticks: {
                color: '#888',
              },
            },
            y: {
              grid: {
                color: 'rgba(0, 212, 255, 0.1)',
              },
              ticks: {
                color: '#888',
              },
            },
          },
        },
      };
    } else {
      // Linear chart configuration (close prices)
      const linearData = mappingResult.data.map((point: OHLCDataPoint) => ({
        x: typeof point.timestamp === 'number'
          ? point.timestamp * 1000
          : new Date(point.timestamp).getTime(),
        y: point.close,
      }));

      chartConfig = {
        type: 'line',
        data: {
          datasets: [
            {
              label: widgetName || 'Close Price',
              data: linearData,
              borderColor: '#00d4ff',
              backgroundColor: 'rgba(0, 212, 255, 0.1)',
              borderWidth: 2,
              fill: true,
              tension: 0.4,
              pointRadius: 3,
              pointBackgroundColor: '#00d4ff',
              pointBorderColor: '#fff',
              pointBorderWidth: 1,
              pointHoverRadius: 5,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: false,
            },
            tooltip: {
              enabled: true,
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
              titleColor: '#00d4ff',
              bodyColor: '#ffffff',
              borderColor: '#00d4ff',
              borderWidth: 1,
              padding: 12,
              displayColors: false,
            },
          },
          scales: {
            x: {
              type: 'time',
              time: {
                unit: 'minute',
              },
              grid: {
                display: true,
                color: 'rgba(0, 212, 255, 0.1)',
              },
              ticks: {
                color: '#888',
              },
            },
            y: {
              type: 'linear',
              grid: {
                display: true,
                color: 'rgba(0, 212, 255, 0.1)',
              },
              ticks: {
                color: '#888',
              },
            },
          },
        },
      };
    }

    // Create the chart
    chartInstanceRef.current = new Chart(ctx, chartConfig);

    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
      }
    };
  }, [rawData, chartType, widgetName]);

  // Check if data is valid
  const mappingResult = rawData ? mapToOHLC(rawData) : null;
  const isValidData = mappingResult && mappingResult.format !== 'unknown' && mappingResult.data.length > 0;

  return (
    <div className="relative max-w-6xl mx-auto">
      <div className="absolute -inset-0.5 bg-linear-to-r from-[#00d4ff] via-[#0066ff] to-[#00d4ff] rounded-xl blur opacity-10"></div>

      {/* Main Card */}
      <div className="relative bg-linear-to-br from-[#1a1a2e] to-[#16213e] rounded-xl shadow-xl border border-[#00d4ff]/20 overflow-hidden">
        {/* Top Bar */}
        <div className="h-px bg-linear-to-r from-transparent via-[#00d4ff]/40 to-transparent"></div>

        <div className="p-4">
          {/* Header Section */}
          <div className="flex justify-between items-start mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="text-xl font-bold text-white">{widgetName || 'Chart Widget'}</h3>
                <span className="px-2 py-1 bg-[#00d4ff]/10 border border-[#00d4ff]/30 rounded text-xs text-[#00d4ff] font-medium">
                  {chartType === 'candlestick' ? 'Candlestick' : 'Linear'}
                </span>
              </div>
              {widgetDescription && (
                <p className="text-sm text-gray-400">{widgetDescription}</p>
              )}
              {mappingResult && mappingResult.format !== 'unknown' && (
                <div className="flex gap-3 mt-2 text-xs text-gray-500">
                  <span>Source: {mappingResult.format}</span>
                  {mappingResult.symbol && <span>Symbol: {mappingResult.symbol}</span>}
                  {mappingResult.interval && <span>Interval: {mappingResult.interval}</span>}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
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

          {/* Chart or Error Message */}
          {isValidData ? (
            <div className="relative h-[400px] bg-[#0f0f1a]/50 rounded-lg p-4">
              <canvas ref={chartRef}></canvas>
            </div>
          ) : (
            <div className="relative h-[400px] bg-[#0f0f1a]/50 rounded-lg p-8 flex items-center justify-center">
              <div className="text-center">
                <svg
                  className="w-16 h-16 text-gray-600 mx-auto mb-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
                <p className="text-gray-400 text-lg font-medium mb-2">
                  {mappingResult?.message || 'Unable to display chart'}
                </p>
                <p className="text-gray-500 text-sm">
                  The API response does not match any supported OHLC format.
                </p>
                <p className="text-gray-500 text-xs mt-2">
                  Supported formats: Alpha Vantage, Twelve Data, Finnhub, Groww
                </p>
              </div>
            </div>
          )}

          {/* Footer Info */}
          <div className="flex justify-between items-center mt-4 pt-3 border-t border-[#333]/30">
            <div className="flex gap-4 text-xs text-gray-500">
              <span>Last updated: {formatLastUpdated(lastUpdated)}</span>
              <span>Refresh: {formatRefreshRate(refreshRate)}</span>
            </div>
            {isValidData && mappingResult && (
              <span className="text-xs text-gray-500">{mappingResult.data.length} data points</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
