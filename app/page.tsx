'use client';

import { useState } from 'react';
import Navbar from '@/components/Navbar';

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

export default function Home() {
  const [symbol, setSymbol] = useState('');
  const [stockData, setStockData] = useState<StockData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchStockData = async () => {
    if (!symbol.trim()) {
      setError('Please enter a stock symbol');
      return;
    }

    setLoading(true);
    setError('');
    setStockData(null);

    try {
      const response = await fetch(`/api/stock?symbol=${symbol}`);
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to fetch stock data');
        return;
      }

      setStockData(data);
    } catch (err) {
      setError('Failed to fetch stock data');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      fetchStockData();
    }
  };

  return (
    <div>
      <Navbar />

      <div className="container">
        <div className="search-box">
          <input
            type="text"
            placeholder="Enter stock symbol (ex - AAPL, GOOGL, MSFT)"
            value={symbol}
            onChange={(e) => setSymbol(e.target.value)}
            onKeyPress={handleKeyPress}
          />
          <button onClick={fetchStockData}>Search</button>
        </div>

        {error && <div className="error">{error}</div>}

        {loading && <div className="loading">Loading...</div>}

        {stockData && (
          <div className="stock-info">
            <h2>{stockData.companyName} ({stockData.symbol})</h2>
            
            <div className="row">
              <span className="label">Current Price</span>
              <span className="value">${stockData.currentPrice.toFixed(2)}</span>
            </div>
            
            <div className="row">
              <span className="label">Change</span>
              <span className={`value ${stockData.change >= 0 ? 'positive' : 'negative'}`}>
                {stockData.change >= 0 ? '+' : ''}{stockData.change.toFixed(2)} ({stockData.changePercent.toFixed(2)}%)
              </span>
            </div>
            
            <div className="row">
              <span className="label">Open</span>
              <span className="value">${stockData.openPrice.toFixed(2)}</span>
            </div>
            
            <div className="row">
              <span className="label">High</span>
              <span className="value">${stockData.highPrice.toFixed(2)}</span>
            </div>
            
            <div className="row">
              <span className="label">Low</span>
              <span className="value">${stockData.lowPrice.toFixed(2)}</span>
            </div>
            
            <div className="row">
              <span className="label">Previous Close</span>
              <span className="value">${stockData.previousClose.toFixed(2)}</span>
            </div>
            
            <div className="row">
              <span className="label">Industry</span>
              <span className="value">{stockData.industry}</span>
            </div>
            
            <div className="row">
              <span className="label">Country</span>
              <span className="value">{stockData.country}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
