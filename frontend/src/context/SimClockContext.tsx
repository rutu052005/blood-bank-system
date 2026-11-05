import React, { createContext, useContext, useState, useEffect } from 'react';
import { api, API_BASE } from '../services/api.js';

interface SimClockContextType {
  simTime: string;
  offsetHours: number;
  sseConnected: boolean;
  advanceTime: (hours: number) => Promise<void>;
  resetTime: () => Promise<void>;
  refreshClock: () => void;
}

const SimClockContext = createContext<SimClockContextType>({
  simTime: new Date().toISOString(),
  offsetHours: 0,
  sseConnected: false,
  advanceTime: async () => {},
  resetTime: async () => {},
  refreshClock: () => {},
});

export const SimClockProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [simTime, setSimTime] = useState<string>(new Date().toISOString());
  const [offsetHours, setOffsetHours] = useState<number>(0);
  const [sseConnected, setSseConnected] = useState<boolean>(false);

  const fetchClock = () => {
    api.getEngineStatus()
      .then(res => {
        if (res.clock) {
          setSimTime(res.clock.now);
          setOffsetHours(res.clock.offsetHours);
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    fetchClock();

    // Setup SSE listener
    const eventSource = new EventSource(`${API_BASE}/stream`);

    eventSource.onopen = () => {
      setSseConnected(true);
    };

    eventSource.addEventListener('clock.sync', (e: MessageEvent) => {
      try {
        const data = JSON.parse(e.data);
        setSimTime(data.now);
        setOffsetHours(data.offsetHours);
      } catch (err) {}
    });

    eventSource.addEventListener('inventory.changed', () => {
      fetchClock();
    });

    eventSource.onerror = () => {
      setSseConnected(false);
    };

    return () => {
      eventSource.close();
    };
  }, []);

  const advanceTime = async (hours: number) => {
    const res = await api.advanceSimTime(hours);
    if (res.clock) {
      setSimTime(res.clock.current);
      setOffsetHours(offsetHours + hours);
    }
  };

  const resetTime = async () => {
    await api.resetSim();
    fetchClock();
  };

  return (
    <SimClockContext.Provider value={{ simTime, offsetHours, sseConnected, advanceTime, resetTime, refreshClock: fetchClock }}>
      {children}
    </SimClockContext.Provider>
  );
};

export const useSimClock = () => useContext(SimClockContext);
