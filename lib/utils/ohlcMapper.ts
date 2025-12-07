/**
 * OHLC Data Mapper Utility
 * Maps various financial API formats to a standardized OHLC format
 */

export interface OHLCDataPoint {
  timestamp: string | number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

export type DataSourceFormat = 
  | 'alpha-vantage' 
  | 'twelve-data' 
  | 'finnhub' 
  | 'groww' 
  | 'unknown';

export interface MappingResult {
  format: DataSourceFormat;
  data: OHLCDataPoint[];
  symbol?: string;
  interval?: string;
  message?: string; // For error or informational messages
}

/**
 * Detect the format of the API response
 */
export function detectDataFormat(response: any): DataSourceFormat {
  if (!response || typeof response !== 'object') {
    return 'unknown';
  }

  // Alpha Vantage detection
  if (response['Meta Data'] && response['Time Series (5min)']) {
    return 'alpha-vantage';
  }
  if (response['Meta Data'] && response['Time Series (1min)']) {
    return 'alpha-vantage';
  }
  if (response['Meta Data'] && response['Time Series (15min)']) {
    return 'alpha-vantage';
  }
  if (response['Meta Data'] && response['Time Series (30min)']) {
    return 'alpha-vantage';
  }
  if (response['Meta Data'] && response['Time Series (60min)']) {
    return 'alpha-vantage';
  }
  if (response['Meta Data'] && (
    response['Time Series (Daily)'] || 
    response['Weekly Time Series'] || 
    response['Monthly Time Series']
  )) {
    return 'alpha-vantage';
  }

  // Twelve Data detection
  if (response.meta && Array.isArray(response.values)) {
    return 'twelve-data';
  }

  // Finnhub detection (arrays with o, h, l, c, t, v)
  if (
    Array.isArray(response.c) &&
    Array.isArray(response.h) &&
    Array.isArray(response.l) &&
    Array.isArray(response.o) &&
    Array.isArray(response.t)
  ) {
    return 'finnhub';
  }

  // Groww detection
  if (response.status === 'SUCCESS' && response.payload) {
    const payload = response.payload;
    const keys = Object.keys(payload);
    if (keys.length > 0) {
      const firstValue = payload[keys[0]];
      if (typeof firstValue === 'string' && 
          firstValue.includes('open:') && 
          firstValue.includes('high:') && 
          firstValue.includes('low:') && 
          firstValue.includes('close:')) {
        return 'groww';
      }
    }
  }

  return 'unknown';
}

/**
 * Map Alpha Vantage format to OHLC
 */
function mapAlphaVantage(response: any): OHLCDataPoint[] {
  const data: OHLCDataPoint[] = [];
  
  // Find the time series key
  let timeSeriesKey: string | null = null;
  for (const key of Object.keys(response)) {
    if (key.startsWith('Time Series')) {
      timeSeriesKey = key;
      break;
    }
  }

  if (!timeSeriesKey) {
    return [];
  }

  const timeSeries = response[timeSeriesKey];
  
  for (const [timestamp, values] of Object.entries(timeSeries as Record<string, any>)) {
    data.push({
      timestamp,
      open: parseFloat(values['1. open']),
      high: parseFloat(values['2. high']),
      low: parseFloat(values['3. low']),
      close: parseFloat(values['4. close']),
      volume: parseInt(values['5. volume']) || 0,
    });
  }

  // Alpha Vantage returns newest first, so reverse for chronological order
  return data.reverse();
}

/**
 * Map Twelve Data format to OHLC
 */
function mapTwelveData(response: any): OHLCDataPoint[] {
  const data: OHLCDataPoint[] = [];
  
  if (!Array.isArray(response.values)) {
    return [];
  }

  for (const value of response.values) {
    data.push({
      timestamp: value.datetime,
      open: parseFloat(value.open),
      high: parseFloat(value.high),
      low: parseFloat(value.low),
      close: parseFloat(value.close),
      volume: parseInt(value.volume) || 0,
    });
  }

  // Twelve Data returns newest first, so reverse for chronological order
  return data.reverse();
}

/**
 * Map Finnhub format to OHLC
 */
function mapFinnhub(response: any): OHLCDataPoint[] {
  const data: OHLCDataPoint[] = [];
  
  const { c, h, l, o, t, v } = response;
  
  if (!Array.isArray(c) || c.length === 0) {
    return [];
  }

  for (let i = 0; i < c.length; i++) {
    data.push({
      timestamp: t[i], // Unix timestamp
      open: o[i],
      high: h[i],
      low: l[i],
      close: c[i],
      volume: v?.[i] || 0,
    });
  }

  return data;
}

/**
 * Map Groww format to OHLC
 */
function mapGroww(response: any): OHLCDataPoint[] {
  const data: OHLCDataPoint[] = [];
  
  if (!response.payload) {
    return [];
  }

  for (const [symbol, valueStr] of Object.entries(response.payload as Record<string, string>)) {
    // Parse the string format: "{open: 149.50,high: 150.50,low: 148.50,close: 149.50}"
    const cleaned = valueStr.replace(/[{}]/g, '').trim();
    const parts = cleaned.split(',');
    
    const ohlcValues: any = {};
    for (const part of parts) {
      const [key, value] = part.split(':').map(s => s.trim());
      ohlcValues[key] = parseFloat(value);
    }

    data.push({
      timestamp: symbol, // Using symbol as identifier since Groww doesn't provide timestamp
      open: ohlcValues.open || 0,
      high: ohlcValues.high || 0,
      low: ohlcValues.low || 0,
      close: ohlcValues.close || 0,
    });
  }

  return data;
}

/**
 * Main function to map any supported format to OHLC
 */
export function mapToOHLC(response: any): MappingResult {
  const format = detectDataFormat(response);
  
  if (format === 'unknown') {
    return {
      format: 'unknown',
      data: [],
      message: 'Unable to detect OHLC data format. Response does not match Alpha Vantage, Twelve Data, Finnhub, or Groww formats.',
    };
  }

  let data: OHLCDataPoint[] = [];
  let symbol: string | undefined;
  let interval: string | undefined;

  try {
    switch (format) {
      case 'alpha-vantage':
        data = mapAlphaVantage(response);
        symbol = response['Meta Data']?.['2. Symbol'];
        interval = response['Meta Data']?.['4. Interval'];
        break;
      
      case 'twelve-data':
        data = mapTwelveData(response);
        symbol = response.meta?.symbol;
        interval = response.meta?.interval;
        break;
      
      case 'finnhub':
        data = mapFinnhub(response);
        break;
      
      case 'groww':
        data = mapGroww(response);
        break;
    }

    if (data.length === 0) {
      return {
        format,
        data: [],
        symbol,
        interval,
        message: 'No OHLC data found in the response.',
      };
    }

    return {
      format,
      data,
      symbol,
      interval,
    };
  } catch (error) {
    return {
      format,
      data: [],
      symbol,
      interval,
      message: `Error mapping ${format} data: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Validate if response contains valid OHLC data
 */
export function hasValidOHLCData(response: any): boolean {
  const format = detectDataFormat(response);
  return format !== 'unknown';
}
