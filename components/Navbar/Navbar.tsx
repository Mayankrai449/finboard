'use client';

import { useAppDispatch, useAppSelector } from '@/lib/store/hooks';
import { setShowForm } from '@/lib/store/slices/widgetsSlice';
import ThemeToggle from '../ThemeToggle';

export default function Navbar() {
  const dispatch = useAppDispatch();
  const widgets = useAppSelector((state) => state.widgets.widgets);
  const widgetCount = widgets.length;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-card border-b border-border px-8 py-4 transition-colors duration-300">
      <div className="flex justify-between items-center">
        {/* Left Side: Logo & Title */}
        <div className="flex items-center gap-4">
          {/* Logo */}
          <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center border border-primary/20">
            <svg className="w-7 h-7 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>

          {/* Text Content */}
          <div>
            <div className="flex items-baseline gap-3">
              <h1 className="text-2xl font-bold text-primary tracking-tight">FinBoard</h1>
              <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Finance Dashboard</span>
            </div>
            
            {/* Status Text */}
            <div className="mt-1">
              {widgetCount > 0 ? (
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                  </span>
                  <span className="text-xs text-muted-foreground font-medium">
                    {widgetCount} Active Widget{widgetCount !== 1 ? 's' : ''}
                  </span>
                </div>
              ) : (
                <span className="text-xs text-muted-foreground italic">
                  Connect to finance APIs for real-time updates
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right Side: Theme Toggle & Add Widget Button */}
        <div className="flex items-center gap-4">
          <ThemeToggle />
          <button
            onClick={() => dispatch(setShowForm(true))}
            className="cursor-pointer flex items-center gap-2 px-4 py-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg border border-primary/30 transition-all hover:scale-105 active:scale-95"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span className="font-medium text-sm">Add Widget</span>
          </button>
        </div>
      </div>
    </nav>
  );
}
