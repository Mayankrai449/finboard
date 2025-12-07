'use client';

import { useAppDispatch, useAppSelector } from '@/lib/store/hooks';
import { setShowForm } from '@/lib/store/slices/widgetsSlice';

export default function Navbar() {
  const dispatch = useAppDispatch();
  const widgets = useAppSelector((state) => state.widgets.widgets);
  const widgetCount = widgets.length;

  return (
    <nav className="bg-[#1a1a2e] border-b border-[#333] px-8 py-4">
      <div className="flex justify-between items-center">
        {/* Left Side: Logo & Title */}
        <div className="flex items-center gap-4">
          {/* Logo */}
          <div className="w-12 h-12 bg-[#00d4ff]/10 rounded-xl flex items-center justify-center border border-[#00d4ff]/20">
            <svg className="w-7 h-7 text-[#00d4ff]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>

          {/* Text Content */}
          <div>
            <div className="flex items-baseline gap-3">
              <h1 className="text-2xl font-bold text-[#00d4ff] tracking-tight">FinBoard</h1>
              <span className="text-sm font-medium text-gray-500 uppercase tracking-wider">Finance Dashboard</span>
            </div>
            
            {/* Status Text */}
            <div className="mt-1">
              {widgetCount > 0 ? (
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00ff88] opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00ff88]"></span>
                  </span>
                  <span className="text-xs text-gray-400 font-medium">
                    {widgetCount} Active Widget{widgetCount !== 1 ? 's' : ''}
                  </span>
                </div>
              ) : (
                <span className="text-xs text-gray-500 italic">
                  Connect to finance APIs for real-time updates
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right Side: Add Widget Button */}
        <button
          onClick={() => dispatch(setShowForm(true))}
          className="flex items-center gap-2 px-4 py-2 bg-[#00d4ff]/10 hover:bg-[#00d4ff]/20 text-[#00d4ff] rounded-lg border border-[#00d4ff]/30 transition-all hover:scale-105 active:scale-95"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span className="font-medium text-sm">Add Widget</span>
        </button>
      </div>
    </nav>
  );
}
