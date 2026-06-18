import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCycles } from '../../contexts/CycleContext';
import { useToast } from '../../contexts/ToastContext';
import { fetchDashboard } from '../../api/dashboard';
import { createObjective } from '../../api/objectives';
import { createKeyResult } from '../../api/keyResults';
import { createCycle } from '../../api/cycles';
import { updateProgress, toggleAchieved } from '../../api/keyResults';
import { toggleMilestone } from '../../api/milestones';
import { Modal } from '../../components/common/Modal';
import { EmptyState } from '../../components/common/EmptyState';
import { DateInput } from '../../components/common/DateInput';
import type { DashboardData, Objective, KeyResult } from '../../types';
import styles from './style.module.css';

function getMonday(d: Date) {
  const date = new Date(d);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  date.setDate(diff);
  return date;
}

function formatDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

function defaultCycleDates() {
  const now = new Date();
  const start = getMonday(now);
  const end = new Date(start);
  end.setDate(end.getDate() + 90);
  return { start_date: formatDate(start), end_date: formatDate(end) };
}

export function DashboardPage() {
  const { cycles, currentCycleId, loading: cyclesLoading, setCurrentCycleId, refreshCycles } = useCycles();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  // Create O modal
  const [showCreateO, setShowCreateO] = useState(false);
  const [newOTitle, setNewOTitle] = useState('');
  const [newODesc, setNewODesc] = useState('');
  const [newOCycleId, setNewOCycleId] = useState<number | null>(null);

  // Create Cycle modal
  const [showCreateCycle, setShowCreateCycle] = useState(false);
  const [newCycleType, setNewCycleType] = useState(3);
  const [newCycleStart, setNewCycleStart] = useState('');
  const [newCycleEnd, setNewCycleEnd] = useState('');
  const [creatingCycle, setCreatingCycle] = useState(false);

  // Create KR modal
  const [showCreateKR, setShowCreateKR] = useState(false);
  const [krObjectiveId, setKrObjectiveId] = useState(0);
  const [krDesc, setKrDesc] = useState('');
  const [krType, setKrType] = useState(1);
  const [krTargetVal, setKrTargetVal] = useState('');
  const [krUnit, setKrUnit] = useState('');
  const [krMilestones, setKrMilestones] = useState<string[]>(['']);

  // Update progress modal
  const [showProgress, setShowProgress] = useState(false);
  const [editingKR, setEditingKR] = useState<KeyResult | null>(null);
  const [progressVal, setProgressVal] = useState('');
  const [toggledMsIds, setToggledMsIds] = useState<Set<number>>(new Set());

  const loadDashboard = useCallback(async () => {
    if (!currentCycleId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await fetchDashboard(String(currentCycleId));
      if (res.code === 0) setData(res.data);
    } catch {
      showToast('加载仪表盘失败');
    } finally {
      setLoading(false);
    }
  }, [currentCycleId, showToast]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  // Listen for FAB click
  useEffect(() => {
    const handler = () => {
      if (cycles.length === 0) {
        // Auto-create a default cycle
        showToast('请先创建周期');
        return;
      }
      setNewOTitle('');
      setNewODesc('');
      setNewOCycleId(currentCycleId);
      setShowCreateO(true);
    };
    window.addEventListener('open-create-objective', handler);
    return () => window.removeEventListener('open-create-objective', handler);
  }, [cycles.length, currentCycleId, showToast]);

  const handleCreateCycle = async () => {
    if (!newCycleStart || !newCycleEnd) {
      showToast('请选择开始和结束日期');
      return;
    }
    if (newCycleStart >= newCycleEnd) {
      showToast('结束日期必须晚于开始日期');
      return;
    }
    setCreatingCycle(true);
    try {
      const res = await createCycle({ type: newCycleType, start_date: newCycleStart, end_date: newCycleEnd });
      if (res.code === 0) {
        setShowCreateCycle(false);
        showToast('周期已创建');
        await refreshCycles();
      } else {
        showToast('创建周期失败');
      }
    } catch {
      showToast('创建周期失败');
    } finally {
      setCreatingCycle(false);
    }
  };

  const handleCreateO = async () => {
    if (!newOTitle.trim()) { showToast('请输入目标标题'); return; }
    try {
      await createObjective({ cycle_id: newOCycleId || currentCycleId || 0, title: newOTitle.trim(), description: newODesc.trim() || undefined });
      setShowCreateO(false);
      showToast(`目标「${newOTitle.trim()}」已创建`);
      loadDashboard();
    } catch {
      showToast('创建目标失败');
    }
  };

  const handleCreateKR = async () => {
    if (!krDesc.trim()) { showToast('请输入 KR 描述'); return; }
    if (krType === 1) {
      if (!krTargetVal.trim() || isNaN(Number(krTargetVal))) { showToast('请输入有效的目标值'); return; }
      if (!krUnit.trim()) { showToast('请输入单位'); return; }
    }
    try {
      const target: Record<string, unknown> = krType === 1 ? { value: Number(krTargetVal), unit: krUnit.trim() } : {};
      const milestones = krType === 2 ? krMilestones.filter(m => m.trim()).map((m, i) => ({ description: m, sort_order: i })) : undefined;
      await createKeyResult({ objective_id: krObjectiveId, description: krDesc.trim(), type: krType, target, milestones });
      setShowCreateKR(false);
      showToast('关键结果已创建');
      loadDashboard();
    } catch { showToast('创建关键结果失败'); }
  };

  const handleUpdateProgress = async () => {
    if (!editingKR) return;
    try {
      if (editingKR.type === 1) {
        const val = parseFloat(progressVal);
        if (isNaN(val) || val < 0) { showToast('请输入有效数值'); return; }
        await updateProgress(editingKR.id, val);
      } else if (editingKR.type === 2) {
        for (const msId of toggledMsIds) {
          await toggleMilestone(msId);
        }
      }
      setShowProgress(false);
      setToggledMsIds(new Set());
      showToast('进度已更新');
      loadDashboard();
    } catch { showToast('更新失败'); }
  };

  const handleBooleanUpdate = async (achieved: boolean) => {
    if (!editingKR) return;
    try {
      await toggleAchieved(editingKR.id, achieved ? 1 : 0);
      setShowProgress(false);
      showToast(achieved ? '已标记为达成' : '已标记为未达成');
      loadDashboard();
    } catch { showToast('更新失败'); }
  };

  const renderBody = () => {
    if (cyclesLoading) {
      return <div className={styles.loading}><p>加载中...</p></div>;
    }

    if (cycles.length === 0) {
      return (
        <EmptyState
          icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><polyline points="8 12 12 8 16 12"/><line x1="12" y1="8" x2="12" y2="16"/></svg>}
          title="还没有周期"
          description="OKR 按周期管理，请先创建一个周期再设定目标"
          action={
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
              <button className={styles.createBtn} onClick={() => {
                const d = defaultCycleDates();
                setNewCycleType(3);
                setNewCycleStart(d.start_date);
                setNewCycleEnd(d.end_date);
                setShowCreateCycle(true);
              }}>创建第一个周期</button>
              <button className={styles.btnSec} onClick={() => navigate('/settings')}>前往设置</button>
            </div>
          }
        />
      );
    }

    if (loading) {
      return <div className={styles.loading}><p>加载中...</p></div>;
    }

    if (!data || data.objectives.length === 0) {
      return (
        <>
          <div className={styles.topbar}>
            <div className={styles.topLeft}>
              <select className={styles.select} value={currentCycleId || ''} onChange={(e) => setCurrentCycleId(Number(e.target.value))}>
                {cycles.map(c => <option key={c.id} value={c.id}>{c.name} · {c.start_date}–{c.end_date}</option>)}
              </select>
            </div>
            <button className={styles.createBtn} onClick={() => {
              setNewOTitle('');
              setNewODesc('');
              setNewOCycleId(currentCycleId);
              setShowCreateO(true);
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              创建新 O
            </button>
          </div>
          <EmptyState
            icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>}
            title="还没有目标"
            description="这个周期还没有设置任何 Objective，点击下方按钮创建你的第一个目标"
            action={<button className={styles.createBtn} onClick={() => {
              setNewOTitle('');
              setNewODesc('');
              setNewOCycleId(currentCycleId);
              setShowCreateO(true);
            }}>创建第一个 O</button>}
          />
        </>
      );
    }

    return (
      <>
        <div className={styles.topbar}>
          <div className={styles.topLeft}>
            <select className={styles.select} value={currentCycleId || ''} onChange={(e) => setCurrentCycleId(Number(e.target.value))}>
              {cycles.map(c => <option key={c.id} value={c.id}>{c.name} · {c.start_date}–{c.end_date}</option>)}
            </select>
          </div>
          <button className={styles.createBtn} onClick={() => { setNewOTitle(''); setNewODesc(''); setNewOCycleId(currentCycleId); setShowCreateO(true); }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            创建新 O
          </button>
        </div>

        <div className={styles.overview}>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>完成率</div>
            <div className={`${styles.statValue} ${styles.green}`}>{data.summary.average_kr_progress}%</div>
            <div className={styles.statSub}>{data.summary.completed_objectives} / {data.summary.total_key_results} KR 已完成</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>距周期结束</div>
            <div className={`${styles.statValue} ${styles.blue}`}>{data.cycles[0]?.remaining_days || 0} 天</div>
            <div className={styles.statSub}>{data.cycles[0]?.end_date || ''} 截止</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>KR 总数</div>
            <div className={`${styles.statValue} ${styles.orange}`}>{data.summary.total_key_results}</div>
            <div className={styles.statSub}>分布在 {data.summary.total_objectives} 个目标中</div>
          </div>
        </div>

        <div className={styles.oList}>
          {data.objectives.map((obj: Objective) => (
            <OCard key={obj.id} obj={obj} onEditKR={(kr) => {
              setEditingKR(kr);
              setProgressVal(String(kr.current_value ?? ''));
              setToggledMsIds(new Set());
              setShowProgress(true);
            }} onCreateKR={(objId) => {
              setKrObjectiveId(objId);
              setKrDesc('');
              setKrType(1);
              setKrTargetVal('');
              setKrUnit('');
              setKrMilestones(['']);
              setShowCreateKR(true);
            }} />
          ))}
        </div>
      </>
    );
  };

  return (
    <div>
      {renderBody()}

      {/* Create Cycle Modal */}
      <Modal isOpen={showCreateCycle} onClose={() => setShowCreateCycle(false)} title="创建新周期">
        <div className={styles.field}>
          <label className={styles.fLabel}>周期类型</label>
          <select className={styles.fInput} value={newCycleType} onChange={e => setNewCycleType(Number(e.target.value))}>
            <option value={1}>月度（M）</option>
            <option value={2}>双月度</option>
            <option value={3}>季度（Q）</option>
            <option value={4}>半年度</option>
            <option value={5}>年度</option>
          </select>
        </div>
        <div className={styles.field}>
          <label className={styles.fLabel}>开始日期</label>
          <DateInput value={newCycleStart} onChange={setNewCycleStart} placeholder="选择开始日期" />
        </div>
        <div className={styles.field}>
          <label className={styles.fLabel}>结束日期</label>
          <DateInput value={newCycleEnd} onChange={setNewCycleEnd} placeholder="选择结束日期" />
        </div>
        <div className={styles.modalBtns}>
          <button className={styles.btnSec} onClick={() => setShowCreateCycle(false)} disabled={creatingCycle}>取消</button>
          <button className={styles.btnPri} onClick={handleCreateCycle} disabled={creatingCycle}>
            {creatingCycle ? '创建中...' : '创建'}
          </button>
        </div>
      </Modal>

      {/* Create O Modal */}
      <Modal isOpen={showCreateO} onClose={() => setShowCreateO(false)} title="创建新目标">
        <div className={styles.field}>
          <label className={styles.fLabel}>目标标题 *</label>
          <input className={styles.fInput} value={newOTitle} onChange={e => setNewOTitle(e.target.value)} placeholder="如：提升技术影响力" />
        </div>
        <div className={styles.field}>
          <label className={styles.fLabel}>描述（选填）</label>
          <textarea className={styles.fInput} rows={3} value={newODesc} onChange={e => setNewODesc(e.target.value)} placeholder="补充目标的背景与细节" style={{ resize: 'vertical' }} />
        </div>
        <div className={styles.field}>
          <label className={styles.fLabel}>所属周期</label>
          <select className={styles.fInput} value={newOCycleId || currentCycleId || ''} onChange={e => setNewOCycleId(Number(e.target.value))}>
            {cycles.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div className={styles.modalBtns}>
          <button className={styles.btnSec} onClick={() => setShowCreateO(false)}>取消</button>
          <button className={styles.btnPri} onClick={handleCreateO}>创建</button>
        </div>
      </Modal>

      {/* Create KR Modal */}
      <Modal isOpen={showCreateKR} onClose={() => setShowCreateKR(false)} title="创建关键结果">
        <div className={styles.field}>
          <label className={styles.fLabel}>KR 描述 <span style={{ color: 'var(--red)' }}>*</span></label>
          <input className={styles.fInput} value={krDesc} onChange={e => setKrDesc(e.target.value)} placeholder="如：GitHub 获得 500 Star" />
        </div>
        <div className={styles.field}>
          <label className={styles.fLabel}>类型</label>
          <select className={styles.fInput} value={krType} onChange={e => setKrType(Number(e.target.value))}>
            <option value={1}>数值型</option>
            <option value={2}>里程碑型</option>
            <option value={3}>布尔型</option>
          </select>
        </div>
        {krType === 1 && (
          <div style={{ display: 'flex', gap: 8 }}>
            <div className={styles.field} style={{ flex: 1 }}>
              <label className={styles.fLabel}>目标值 <span style={{ color: 'var(--red)' }}>*</span></label>
              <input className={styles.fInput} type="number" value={krTargetVal} onChange={e => setKrTargetVal(e.target.value)} placeholder="500" required />
            </div>
            <div className={styles.field} style={{ flex: 1 }}>
              <label className={styles.fLabel}>单位 <span style={{ color: 'var(--red)' }}>*</span></label>
              <input className={styles.fInput} value={krUnit} onChange={e => setKrUnit(e.target.value)} placeholder="Star" />
            </div>
          </div>
        )}
        {krType === 2 && (
          <div className={styles.field}>
            <label className={styles.fLabel}>里程碑节点</label>
            {krMilestones.map((m, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                <input className={styles.fInput} value={m} onChange={e => {
                  const next = [...krMilestones];
                  next[i] = e.target.value;
                  setKrMilestones(next);
                }} placeholder={`节点 ${i + 1}`} />
                {krMilestones.length > 1 && <button className={styles.btnSec} onClick={() => setKrMilestones(krMilestones.filter((_, j) => j !== i))}>✕</button>}
              </div>
            ))}
            <button className={styles.btnSec} onClick={() => setKrMilestones([...krMilestones, ''])}>+ 添加节点</button>
          </div>
        )}
        <div className={styles.modalBtns}>
          <button className={styles.btnSec} onClick={() => setShowCreateKR(false)}>取消</button>
          <button className={styles.btnPri} onClick={handleCreateKR}>创建</button>
        </div>
      </Modal>

      {/* Update Progress Modal */}
      <Modal isOpen={showProgress} onClose={() => setShowProgress(false)} title="更新 KR 进度">
        {editingKR && (
          <>
            <div className={styles.krTitle}>{editingKR.description}</div>
            {editingKR.type === 1 && (
              <div className={styles.field}>
                <label className={styles.fLabel}>当前进展</label>
                <input className={styles.fInput} type="number" step="any" value={progressVal} onChange={e => setProgressVal(e.target.value)} style={{ fontSize: 16, textAlign: 'center' }} />
              </div>
            )}
            {editingKR.type === 2 && editingKR.milestones && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {editingKR.milestones.map(m => {
                  const toggled = toggledMsIds.has(m.id);
                  const done = m.completed ? !toggled : toggled;
                  return (
                    <div key={m.id} className={`${styles.msItem} ${done ? styles.msDone : ''}`} onClick={() => {
                      setToggledMsIds(prev => {
                        const next = new Set(prev);
                        if (next.has(m.id)) next.delete(m.id); else next.add(m.id);
                        return next;
                      });
                    }} style={{ cursor: 'pointer' }}>
                      <div className={`${styles.msCheck} ${done ? styles.msCheckDone : ''}`}>{done ? '✓' : ''}</div>
                      <span>{m.description}</span>
                    </div>
                  );
                })}
              </div>
            )}
            {editingKR.type === 3 && (
              <p style={{ textAlign: 'center', padding: '16px 0', fontSize: 15 }}>
                当前状态：<strong>{editingKR.is_achieved ? '已达成 ✓' : '未达成'}</strong>
              </p>
            )}
            <div className={styles.modalBtns}>
              <button className={styles.btnSec} onClick={() => setShowProgress(false)}>取消</button>
              {editingKR?.type === 3 ? (
                <>
                  {editingKR.is_achieved ? (
                    <button className={styles.btnPri} style={{ background: 'var(--orange)' }} onClick={() => handleBooleanUpdate(false)}>标记为未达成</button>
                  ) : (
                    <button className={styles.btnPri} onClick={() => handleBooleanUpdate(true)}>标记为已达成</button>
                  )}
                </>
              ) : (
                <button className={styles.btnPri} onClick={handleUpdateProgress}>保存</button>
              )}
            </div>
          </>
        )}
      </Modal>
    </div>
  );
}

function OCard({ obj, onEditKR, onCreateKR }: {
  obj: Objective;
  onEditKR: (kr: KeyResult) => void;
  onCreateKR: (objId: number) => void;
}) {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className={`${styles.oCard} ${expanded ? styles.expanded : ''}`}>
      <div className={styles.oHeader} onClick={() => setExpanded(!expanded)}>
        <div className={styles.oLeft}>
          <div className={styles.oDot} />
          <div>
            <div className={styles.oTitle}>{obj.title}</div>
            {obj.description && <div className={styles.oMeta}>{obj.description}</div>}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div className={styles.oBadge}>{obj.progress}%</div>
          <svg className={styles.oChev} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
        </div>
      </div>
      {expanded && (
        <div className={styles.oBody}>
          <div className={styles.krList}>
            {obj.key_results.map(kr => (
              <KRItem key={kr.id} kr={kr} onEdit={() => onEditKR(kr)} />
            ))}
          </div>
          <button className={styles.addKrBtn} onClick={(e) => { e.stopPropagation(); onCreateKR(obj.id); }}>+ 添加关键结果</button>
        </div>
      )}
    </div>
  );
}

function KRItem({ kr, onEdit }: { kr: KeyResult; onEdit: () => void }) {
  const p = kr.progress;
  const color = p >= 80 ? 'green' : p >= 50 ? 'blue' : p >= 25 ? 'orange' : 'red';

  return (
    <div className={styles.krItem}>
      <div className={styles.krHeader}>
        <span className={styles.krTitle}>{kr.description}</span>
        <span className={styles.krValue}>
          {kr.type === 1 ? `${kr.current_value ?? 0} / ${(kr.target as Record<string, unknown>)?.value ?? '?'} ${(kr.target as Record<string, unknown>)?.unit ?? ''}` : ''}
          {kr.type === 2 ? `${kr.milestones?.filter(m => m.completed).length ?? 0}/${kr.milestones?.length ?? 0} 节点` : ''}
          {kr.type === 3 ? (kr.is_achieved ? '已达成' : '未达成') : ''} ({p}%)
        </span>
      </div>
      <div className={styles.krBar}>
        <div className={`${styles.krBarFill} ${styles[color]}`} style={{ width: `${Math.min(p, 100)}%` }} />
      </div>
      {kr.type === 2 && kr.milestones && (
        <div className={styles.msList}>
          {kr.milestones.map(m => (
            <div key={m.id} className={`${styles.msItem} ${m.completed ? styles.msDone : ''}`}>
              <div className={`${styles.msCheck} ${m.completed ? styles.msCheckDone : ''}`}>{m.completed ? '✓' : ''}</div>
              <span>{m.description}</span>
            </div>
          ))}
        </div>
      )}
      <button className={styles.updateBtn} onClick={onEdit}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="16 3 21 3 21 8"/><line x1="4" y1="20" x2="21" y2="3"/><path d="M21 16v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/></svg>
        更新进度
      </button>
    </div>
  );
}
