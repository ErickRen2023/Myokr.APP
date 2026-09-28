import { useCallback, useEffect, useState } from 'react';
import { reactivateCycle } from '../../api/cycles';
import { listHistoryCycles, listHistoryObjectives } from '../../api/history';
import { OkrReferenceText } from '../../components/common/OkrReference';
import { useCycles } from '../../contexts/CycleContext';
import { useToast } from '../../contexts/ToastContext';
import type { Cycle, CycleReview, KeyResult, Objective } from '../../types';
import styles from './style.module.css';

interface HistoryCycle extends Cycle {
  objectives?: Objective[];
  loading?: boolean;
  expanded?: boolean;
  objectivesLoaded?: boolean;
  review?: CycleReview | null;
}

const reviewFields: Array<{ key: keyof Pick<CycleReview, 'summary' | 'highlights' | 'blockers' | 'learnings' | 'next_steps'>; label: string }> = [
  { key: 'summary', label: '阶段结论' },
  { key: 'highlights', label: '关键进展' },
  { key: 'blockers', label: '未完成项与阻碍' },
  { key: 'learnings', label: '经验与反思' },
  { key: 'next_steps', label: '下一阶段行动' },
];

export function HistoryPage() {
  const [cycles, setCycles] = useState<HistoryCycle[]>([]);
  const [loading, setLoading] = useState(true);
  const [reactivatingId, setReactivatingId] = useState<number | null>(null);
  const { refreshCycles } = useCycles();
  const { showToast } = useToast();

  const loadHistory = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listHistoryCycles();
      if (res.code === 0) {
        setCycles(res.data.cycles.map(c => ({ ...c, objectives: [], loading: false, expanded: false, objectivesLoaded: false })));
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadHistory(); }, [loadHistory]);

  const handleReactivate = async (cycleId: number) => {
    setReactivatingId(cycleId);
    try {
      const res = await reactivateCycle(cycleId);
      if (res.code !== 0) {
        showToast(res.message || '解除归档失败');
        return;
      }
      showToast('周期已解除归档，可在仪表盘继续编辑');
      await Promise.all([loadHistory(), refreshCycles()]);
    } catch {
      showToast('解除归档失败');
    } finally {
      setReactivatingId(null);
    }
  };

  const toggleCycle = async (cycleId: number) => {
    const cycle = cycles.find(c => c.id === cycleId);
    if (!cycle) return;
    if (cycle.expanded) {
      setCycles(current => current.map(c => c.id === cycleId ? { ...c, expanded: false } : c));
      return;
    }
    setCycles(current => current.map(c => c.id === cycleId ? { ...c, expanded: true } : c));
    if (cycle.objectivesLoaded) return;

    setCycles(current => current.map(c => c.id === cycleId ? { ...c, loading: true } : c));
    try {
      const res = await listHistoryObjectives(cycleId);
      if (res.code === 0) {
        setCycles(current => current.map(c => c.id === cycleId
          ? { ...c, objectives: res.data.objectives, loading: false, objectivesLoaded: true }
          : c));
      } else {
        setCycles(current => current.map(c => c.id === cycleId ? { ...c, loading: false, expanded: false } : c));
      }
    } catch {
      setCycles(current => current.map(c => c.id === cycleId ? { ...c, loading: false, expanded: false } : c));
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
            <div className={styles.cardHeader}>
              <button className={styles.cardToggle} type="button" onClick={() => toggleCycle(cycle.id)} aria-expanded={Boolean(cycle.expanded)}>
                <span className={styles.cardTitle}>{cycle.name} · {cycle.start_date}–{cycle.end_date}</span>
                <span className={styles.headerMeta}>
                  <span className={styles.badge}>已归档</span>
                  <svg className={`${styles.chevron} ${cycle.expanded ? styles.chevronOpen : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
                </span>
              </button>
              <button className={styles.restoreButton} type="button" onClick={() => handleReactivate(cycle.id)} disabled={reactivatingId !== null}>
                {reactivatingId === cycle.id ? '处理中…' : '解除归档'}
              </button>
            </div>
            {cycle.expanded && cycle.loading && <div className={styles.cardBody}><p>加载中...</p></div>}
            {cycle.expanded && !cycle.loading && (
              <div className={styles.cardBody}>
                <section className={styles.reviewSection}>
                  <h3 className={styles.sectionTitle}>阶段复盘</h3>
                  {cycle.review ? (
                    reviewFields.filter(field => cycle.review?.[field.key].trim()).map(field => (
                      <div key={field.key} className={styles.reviewField}>
                        <h4>{field.label}</h4>
                        <p><OkrReferenceText value={cycle.review?.[field.key] ?? ''} objectives={cycle.objectives ?? []} /></p>
                      </div>
                    ))
                  ) : (
                    <p className={styles.noReview}>该周期没有保存阶段复盘。</p>
                  )}
                </section>
                <section>
                  <h3 className={styles.sectionTitle}>归档的 OKR</h3>
                  {cycle.objectives && cycle.objectives.length > 0 ? cycle.objectives.map(obj => (
                    <div key={obj.id} className={styles.objItem}>
                      <div className={styles.objHeader}>
                        <div className={styles.objNameGroup}>
                          <span className={styles.objDot} />
                          <div>
                            <div className={styles.objTitle}>{obj.title} <span className={styles.readBadge}>只读</span></div>
                            {obj.description && <div className={styles.objDescription}>{obj.description}</div>}
                          </div>
                        </div>
                        <span className={styles.objBadge}>{obj.key_results.filter(kr => kr.progress >= 100).length}/{obj.key_results.length} ({obj.progress}%)</span>
                      </div>
                      <div className={styles.krList}>
                        {obj.key_results.map(kr => <HistoryKeyResult key={kr.id} kr={kr} />)}
                        {obj.key_results.length === 0 && <p className={styles.noReview}>这个目标还没有关键结果。</p>}
                      </div>
                    </div>
                  )) : <p className={styles.noReview}>这个周期没有目标。</p>}
                </section>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function HistoryKeyResult({ kr }: { kr: KeyResult }) {
  const color = kr.progress >= 80 ? 'green' : kr.progress >= 50 ? 'blue' : kr.progress >= 25 ? 'orange' : 'red';
  const value = kr.type === 1
    ? `${kr.current_value ?? 0} / ${kr.target.value ?? '?'} ${kr.target.unit ?? ''}`
    : kr.type === 2
      ? `${kr.milestones?.filter(milestone => milestone.completed).length ?? 0}/${kr.milestones?.length ?? 0} 节点`
      : kr.is_achieved ? '已达成' : '未达成';

  return (
    <div className={styles.krItem}>
      <div className={styles.krHeader}>
        <span className={styles.krTitle}>{kr.title}</span>
        <span className={styles.krValue}>{value} ({kr.progress}%)</span>
      </div>
      {kr.description && <div className={styles.krDescription}>{kr.description}</div>}
      <div className={styles.krBar}>
        <div className={`${styles.krBarFill} ${styles[color]}`} style={{ width: `${Math.min(kr.progress, 100)}%` }} />
      </div>
      {kr.type === 2 && kr.milestones && kr.milestones.length > 0 && (
        <div className={styles.milestoneList}>
          {kr.milestones.map(milestone => (
            <div key={milestone.id} className={`${styles.milestone} ${milestone.completed ? styles.milestoneDone : ''}`}>
              <span className={styles.milestoneCheck}>{milestone.completed ? '✓' : ''}</span>
              <span>{milestone.description}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
