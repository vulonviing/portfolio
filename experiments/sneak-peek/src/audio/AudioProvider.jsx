import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { createEngine } from './engine';

const AudioCtx = createContext(null);

export function AudioProvider({ children }) {
  const engineRef = useRef(null);
  const [enabled, setEnabled] = useState(false);
  const [starting, setStarting] = useState(false);

  const toggle = useCallback(async () => {
    if (!engineRef.current) {
      engineRef.current = createEngine();
    }
    if (enabled) {
      engineRef.current.stop();
      setEnabled(false);
      return;
    }
    try {
      setStarting(true);
      await engineRef.current.start();
      setEnabled(true);
    } finally {
      setStarting(false);
    }
  }, [enabled]);

  const pushScenario = useCallback((id) => {
    engineRef.current?.setScenario(id);
  }, []);

  useEffect(() => {
    return () => {
      engineRef.current?.stop();
    };
  }, []);

  return (
    <AudioCtx.Provider value={{ enabled, starting, toggle, pushScenario }}>
      {children}
    </AudioCtx.Provider>
  );
}

export function useAudio() {
  const ctx = useContext(AudioCtx);
  if (!ctx) throw new Error('useAudio must be used within AudioProvider');
  return ctx;
}
