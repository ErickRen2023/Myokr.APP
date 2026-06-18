import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { listCycles } from '../api/cycles';
import type { Cycle } from '../types';
import { useAuth } from './AuthContext';

interface CycleState {
  cycles: Cycle[];
  currentCycleId: number | null;
  loading: boolean;
  setCurrentCycleId: (id: number) => void;
  refreshCycles: () => Promise<void>;
}

const CycleContext = createContext<CycleState>({
  cycles: [],
  currentCycleId: null,
  loading: true,
  setCurrentCycleId: () => {},
  refreshCycles: async () => {},
});

export function useCycles() {
  return useContext(CycleContext);
}

export function CycleProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [cycles, setCycles] = useState<Cycle[]>([]);
  const [currentCycleId, setCurrentCycleId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshCycles = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    try {
      const res = await listCycles(0);
      if (res.code === 0) {
        const list = res.data.cycles;
        setCycles(list);
        if (!currentCycleId && list.length > 0) {
          setCurrentCycleId(list[0].id);
        }
      }
    } catch (e) {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, currentCycleId]);

  useEffect(() => {
    if (isAuthenticated) {
      refreshCycles();
    }
  }, [isAuthenticated]);

  return (
    <CycleContext.Provider value={{ cycles, currentCycleId, loading, setCurrentCycleId, refreshCycles }}>
      {children}
    </CycleContext.Provider>
  );
}
