'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

interface DebugContextType {
  debugMode: boolean;
  toggleDebugMode: () => void;
  useCachedRun: boolean;
  setUseCachedRun: (value: boolean) => void;
}

const DebugContext = createContext<DebugContextType | null>(null);

export function DebugProvider({ children }: { children: ReactNode }) {
  const [debugMode, setDebugMode] = useState(false);
  const [useCachedRun, setUseCachedRun] = useState(false);

  const toggleDebugMode = useCallback(() => {
    setDebugMode(prev => !prev);
  }, []);

  // Secret keyboard shortcut: Ctrl+Shift+D (or Cmd+Shift+D on Mac)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'D') {
        e.preventDefault();
        toggleDebugMode();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleDebugMode]);

  // Log debug mode state changes
  useEffect(() => {
    if (debugMode) {
      console.log('%c🔧 Debug Mode Enabled', 'background: #8ace00; color: black; padding: 4px 8px; border-radius: 4px; font-weight: bold;');
      console.log('Press Ctrl+Shift+D (Cmd+Shift+D on Mac) to toggle off');
    }
  }, [debugMode]);

  return (
    <DebugContext.Provider value={{ debugMode, toggleDebugMode, useCachedRun, setUseCachedRun }}>
      {children}
    </DebugContext.Provider>
  );
}

export function useDebug() {
  const context = useContext(DebugContext);
  if (!context) {
    throw new Error('useDebug must be used within a DebugProvider');
  }
  return context;
}


