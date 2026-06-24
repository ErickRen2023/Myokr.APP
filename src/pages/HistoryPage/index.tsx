import { useCallback, useEffect, useState } from 'react';
import { listHistoryCycles, listHistoryObjectives } from '../../api/history';
import type { Cycle, Objective } from '../../types';
import styles from './style.module.css';

interface HistoryCycle extends Cycle {
  objectives?: Objective[];
  loading?: boolean;
}

export function HistoryPage() {
  const [cycles, setCycles] = useState<HistoryCycle[]>([]);
  const [loading, setLoading] = useState(true);

  const loadHistory = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listHistoryCycles();
      if (res.code === 0) {
        setCycles(res.data.cycles.map(c => ({ ...c, objectives: [], loading: false })));
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadHistory(); }, [loadHistory]);

  const toggleCycle = async (cycleId: number) => {
    const cycle = cycles.find(c => c.id === cycleId);
    if (!cycle) return;
    if (cycle.objectives && cycle.objectives.length > 0) {
      setCycles(cycles.map(c => c.id === cycleId ? { ...c, objectives: [] } : c));
      return;
    }
    setCycles(cycles.map(c => c.id === cycleId ? { ...c, loading: true } : c));
    try {
      const res = await listHistoryObjectives(cycleId);
      if (res.code === 0) {
        setCycles(prev => prev.map(c => c.id === cycleId ? { ...c, objectives: res.data.objectives, loading: false } : c));
      }
    } catch {
      setCycles(prev => prev.map(c => c.id === cycleId ? { ...c, loading: false } : c));
    }
  };

  if (loading) {
    return <div className={styles.loading}><p>加载中...</p></div>;
  }

  if (cycles.length === 0) {
    return (
      <div>
        <h2 className={styles.title}>历史 OKR</h2>
        <p className={styles.empty}>暂无历史记录</p>
      </div>
    );
  }

  return (
    <div>
      <h2 className={styles.title}>历史 OKR</h2>
      <div className={styles.list}>
        {cycles.map(cycle => (
          <div key={cycle.id} className={styles.card}>
            <div className={styles.cardHeader} onClick={() => toggleCycle(cycle.id)}>
              <span className={styles.cardTitle}>{cycle.name} · {cycle.start_date}–{cycle.end_date}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className={styles.badge}>已归档</span>
                <svg style={{ width: 20, height: 20, color: 'var(--text-muted)' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
              </div>
            </div>
            {cycle.loading && <div className={styles.cardBody}><p>加载中...</p></div>}
            {cycle.objectives && cycle.objectives.length > 0 && (
              <div className={styles.cardBody}>
                {cycle.objectives.map(obj => (
                  <div key={obj.id} className={styles.objItem}>
                    <div className={styles.objTitle}>{obj.title} <span className={styles.readBadge}>只读</span></div>
                    {obj.key_results.map(kr => (
                      <div key={kr.id} className={styles.krItem}>• {kr.title} — {kr.progress}% 完成{kr.description && <span className={styles.krDesc}> — {kr.description}</span>}</div>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
