import React from 'react';

/**
 * @desc    Premium Loading Spinner Component
 * @param   {string} text - Optional loading text
 * @returns {JSX.Element}
 */
export const LoadingScreen = ({ text = 'Loading' }) => {
  return (
    <div className="min-h-screen bg-bg-dark flex items-center justify-center" role="status" aria-live="polite" aria-busy="true">
      <div className="text-center">
        <div className="relative w-14 h-14 mx-auto mb-5" aria-hidden="true">
          <div className="absolute inset-0 rounded-2xl border-2 border-primary/20 animate-pulse" />
          <div className="absolute inset-0 rounded-2xl border-2 border-transparent border-t-primary animate-spin" style={{ animationDuration: '0.8s' }} />
          <div className="absolute inset-0 flex items-center justify-center text-xl">
            🗳️
          </div>
        </div>
        <p className="text-text-muted text-sm font-medium">{text}</p>
        <div className="flex items-center justify-center gap-1 mt-2" aria-hidden="true">
          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '150ms' }} />
          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
        <span className="sr-only">{text}, please wait...</span>
      </div>
    </div>
  );
};

/**
 * @desc    Lightweight Page/Section Loader
 * @returns {JSX.Element}
 */
export const PageLoader = () => {
  return (
    <div className="flex items-center justify-center h-full min-h-[50vh]">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-3" />
        <p className="text-text-muted text-xs">Loading content</p>
      </div>
    </div>
  );
};

export default PageLoader;
