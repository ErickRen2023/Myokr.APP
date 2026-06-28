import { useEffect, useState, useCallback } from 'react';
import { DragDropContext, Droppable, Draggable, type DropResult } from '@hello-pangea/dnd';
import { Modal } from '../../components/common/Modal';
import { updateKeyResult, archiveKeyResult } from '../../api/keyResults';
import { createMilestone, updateMilestone, deleteMilestone, reorderMilestones } from '../../api/milestones';
import type { KeyResult, Milestone } from '../../types';
import styles from './style.module.css';

const TYPE_LABELS: Record<number, string> = { 1: '数值型', 2: '里程碑型', 3: '布尔型' };

interface Props {
  isOpen: boolean;
  onClose: () => void;
  keyResult: KeyResult | null;
  onSaved: () => void;
  showToast: (msg: string) => void;
}

export function EditKeyResultModal({ isOpen, onClose, keyResult, onSaved, showToast }: Props) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [targetVal, setTargetVal] = useState('');
  const [unit, setUnit] = useState('');
  const [saving, setSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Milestone editor state (type 2 only)
  const [editMilestones, setEditMilestones] = useState<Milestone[]>([]);
  const [newMilestones, setNewMilestones] = useState<string[]>(['']);
  const [deletedMsIds, setDeletedMsIds] = useState<Set<number>>(new Set());
  const [originalDescs, setOriginalDescs] = useState<Map<number, string>>(new Map());

  useEffect(() => {
    if (isOpen && keyResult) {
      setTitle(keyResult.title);
      setDescription(keyResult.description || '');
      setShowDeleteConfirm(false);
      setSaving(false);

      if (keyResult.type === 1) {
        setTargetVal(String((keyResult.target as Record<string, unknown>)?.value ?? ''));
        setUnit(String((keyResult.target as Record<string, unknown>)?.unit ?? ''));
      }

      if (keyResult.type === 2 && keyResult.milestones) {
        const cloned = structuredClone(keyResult.milestones);
        setEditMilestones(cloned);
        setNewMilestones(['']);
        setDeletedMsIds(new Set());
        setOriginalDescs(new Map(cloned.map(m => [m.id, m.description])));
      }
    }
  }, [isOpen, keyResult]);

  const handleMsDragEnd = useCallback((result: DropResult) => {
    const { source, destination } = result;
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;
    const reordered = [...editMilestones];
    const [moved] = reordered.splice(source.index, 1);
    reordered.splice(destination.index, 0, moved);
    setEditMilestones(reordered);
  }, [editMilestones]);

  const visibleMs = editMilestones.filter(m => !deletedMsIds.has(m.id));

  const handleSave = async () => {
    if (!title.trim()) {
      showToast('请输入 KR 标题');
      return;
    }

    let target: Record<string, unknown> | undefined;
    if (keyResult!.type === 1) {
      if (!targetVal.trim() || isNaN(Number(targetVal))) {
        showToast('请输入有效的目标值');
        return;
      }
      if (!unit.trim()) {
        showToast('请输入单位');
        return;
      }
      target = { value: Number(targetVal), unit: unit.trim() };
    }

    setSaving(true);

    // Save KR fields
    try {
      await updateKeyResult({
        id: keyResult!.id,
        title: title.trim(),
        description: description.trim() || undefined,
        target,
      });
    } catch {
      showToast('更新失败');
      setSaving(false);
      return;
    }

    // Save milestone changes (type 2 only)
    if (keyResult!.type === 2) {
      const createdIds: number[] = [];
      for (const desc of newMilestones) {
        const trimmed = desc.trim();
        if (!trimmed) continue;
        try {
          const res = await createMilestone({ key_result_id: keyResult!.id, description: trimmed });
          if (res.code === 0 && res.data) createdIds.push(res.data.id);
        } catch {
          showToast('创建节点失败');
          setSaving(false);
          return;
        }
      }

      for (const m of editMilestones) {
        if (deletedMsIds.has(m.id)) continue;
        if (originalDescs.get(m.id) !== m.description) {
          try {
            await updateMilestone({ id: m.id, description: m.description });
          } catch {
            showToast('更新节点失败');
            setSaving(false);
            return;
          }
        }
      }

      for (const id of deletedMsIds) {
        try {
          await deleteMilestone(id);
        } catch {
          showToast('删除节点失败');
          setSaving(false);
          return;
        }
      }

      const survivingIds = editMilestones.filter(m => !deletedMsIds.has(m.id)).map(m => m.id);
      const allIds = [...survivingIds, ...createdIds];
      if (allIds.length > 0) {
        try {
          await reorderMilestones(allIds.map((id, i) => ({ id, sort_order: i })));
        } catch {
          showToast('排序更新失败');
          setSaving(false);
          return;
        }
      }
    }

    setSaving(false);
    showToast('关键结果已更新');
    onSaved();
    onClose();
  };

  const handleDelete = async () => {
    setSaving(true);
    try {
      await archiveKeyResult(keyResult!.id);
      showToast('关键结果已删除');
      setShowDeleteConfirm(false);
      onSaved();
      onClose();
    } catch {
      showToast('删除失败');
    } finally {
      setSaving(false);
    }
  };

  const krType = keyResult?.type ?? 1;

  return (
    <>
    <Modal isOpen={isOpen} onClose={onClose} title="编辑关键结果">
      <div className={styles.field}>
        <label className={styles.fLabel}>类型</label>
        <div className={styles.krTypeReadonly}>{TYPE_LABELS[krType] || krType}</div>
      </div>
      <div className={styles.field}>
        <label className={styles.fLabel}>KR 标题 *</label>
        <input
          className={styles.fInput}
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="如：GitHub 获得 500 Star"
        />
      </div>
      <div className={styles.field}>
        <label className={styles.fLabel}>描述（选填）</label>
        <textarea
          className={styles.fInput}
          rows={2}
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder="补充 KR 的背景与细节"
          style={{ resize: 'vertical' }}
        />
      </div>
      {krType === 1 && (
        <div style={{ display: 'flex', gap: 8 }}>
          <div className={styles.field} style={{ flex: 1 }}>
            <label className={styles.fLabel}>目标值 *</label>
            <input
              className={styles.fInput}
              type="number"
              value={targetVal}
              onChange={e => setTargetVal(e.target.value)}
              placeholder="500"
            />
          </div>
          <div className={styles.field} style={{ flex: 1 }}>
            <label className={styles.fLabel}>单位 *</label>
            <input
              className={styles.fInput}
              value={unit}
              onChange={e => setUnit(e.target.value)}
              placeholder="Star"
            />
          </div>
        </div>
      )}
      {krType === 2 && (
        <div className={styles.field}>
          <label className={styles.fLabel}>里程碑节点</label>

          {visibleMs.length === 0 && newMilestones.every(m => !m.trim()) ? (
            <p style={{ fontSize: 13, color: 'var(--text-muted)', padding: '8px 0' }}>暂无里程碑节点，请在下方添加</p>
          ) : (
            <DragDropContext onDragEnd={handleMsDragEnd}>
              <Droppable droppableId={`ms-editor-${keyResult?.id ?? 0}`} type="milestone-editor">
                {(provided) => (
                  <div ref={provided.innerRef} {...provided.droppableProps} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {visibleMs.map((m, index) => (
                      <Draggable key={m.id} draggableId={`ms-editor-${m.id}`} index={index}>
                        {(dragProvided) => (
                          <div
                            className={styles.msItem}
                            ref={dragProvided.innerRef as React.Ref<HTMLDivElement>}
                            {...dragProvided.draggableProps}
                            style={{ gap: 6, ...dragProvided.draggableProps.style }}
                          >
                            <div className={styles.dragHandle} {...dragProvided.dragHandleProps}>
                              <svg width="10" height="10" viewBox="0 0 12 12" fill="currentColor" opacity="0.3">
                                <circle cx="3" cy="2" r="1"/><circle cx="9" cy="2" r="1"/>
                                <circle cx="3" cy="6" r="1"/><circle cx="9" cy="6" r="1"/>
                                <circle cx="3" cy="10" r="1"/><circle cx="9" cy="10" r="1"/>
                              </svg>
                            </div>
                            <input
                              className={styles.fInput}
                              value={m.description}
                              onChange={e => {
                                const next = editMilestones.map(x => x.id === m.id ? { ...x, description: e.target.value } : x);
                                setEditMilestones(next);
                              }}
                              style={{ flex: 1 }}
                            />
                            <button
                              className={styles.editorDelBtn}
                              onClick={() => setDeletedMsIds(prev => new Set([...prev, m.id]))}
                              title="删除此节点"
                            >
                              ✕
                            </button>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          )}

          {newMilestones.map((desc, i) => (
            <div key={`new-${i}`} className={styles.msItem} style={{ gap: 6, marginTop: 8 }}>
              <div style={{ width: 22, flexShrink: 0 }} />
              <input
                className={styles.fInput}
                value={desc}
                onChange={e => {
                  const next = [...newMilestones];
                  next[i] = e.target.value;
                  setNewMilestones(next);
                }}
                placeholder={`新节点 ${i + 1}`}
                style={{ flex: 1 }}
              />
              <button
                className={styles.editorDelBtn}
                onClick={() => setNewMilestones(newMilestones.filter((_, j) => j !== i))}
                title="移除此新节点"
              >
                ✕
              </button>
            </div>
          ))}

          <button className={styles.editorAddBtn} onClick={() => setNewMilestones([...newMilestones, ''])}>
            + 添加节点
          </button>
        </div>
      )}
      <div className={styles.modalBtnsDual}>
        <button className={styles.btnSec} onClick={() => setShowDeleteConfirm(true)} disabled={saving}>
          删除
        </button>
        <div className={styles.modalBtnsGroup}>
          <button className={styles.btnSec} onClick={onClose} disabled={saving}>
            取消
          </button>
          <button className={styles.btnPri} onClick={handleSave} disabled={saving || !title.trim()}>
            {saving ? '保存中...' : '保存'}
          </button>
        </div>
      </div>
    </Modal>

    <Modal isOpen={showDeleteConfirm} onClose={() => setShowDeleteConfirm(false)} title="确认删除">
      <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 8 }}>
        确定要删除关键结果「{keyResult?.title}」吗？
      </p>
      <div className={styles.modalBtns}>
        <button className={styles.btnSec} onClick={() => setShowDeleteConfirm(false)} disabled={saving}>
          取消
        </button>
        <button className={styles.btnDanger} onClick={handleDelete} disabled={saving}>
          {saving ? '删除中...' : '确认删除'}
        </button>
      </div>
    </Modal>
  </>
  );
}
