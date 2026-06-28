import { useEffect, useState, useCallback } from 'react';
import { DragDropContext, Droppable, Draggable, type DropResult } from '@hello-pangea/dnd';
import { Modal } from '../../components/common/Modal';
import { createMilestone, updateMilestone, deleteMilestone, reorderMilestones } from '../../api/milestones';
import type { KeyResult, Milestone } from '../../types';
import styles from './style.module.css';

interface Props {
  kr: KeyResult | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  showToast: (msg: string) => void;
}

export function MilestoneEditorModal({ kr, isOpen, onClose, onSave, showToast }: Props) {
  const [editMilestones, setEditMilestones] = useState<Milestone[]>([]);
  const [newMilestones, setNewMilestones] = useState<string[]>(['']);
  const [deletedIds, setDeletedIds] = useState<Set<number>>(new Set());
  const [originalDescriptions, setOriginalDescriptions] = useState<Map<number, string>>(new Map());
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen && kr?.milestones) {
      const cloned = structuredClone(kr.milestones);
      setEditMilestones(cloned);
      setNewMilestones(['']);
      setDeletedIds(new Set());
      setOriginalDescriptions(new Map(cloned.map(m => [m.id, m.description])));
      setSaving(false);
    }
  }, [isOpen, kr]);

  const handleLocalDragEnd = useCallback((result: DropResult) => {
    const { source, destination } = result;
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    const reordered = [...editMilestones];
    const [moved] = reordered.splice(source.index, 1);
    reordered.splice(destination.index, 0, moved);
    setEditMilestones(reordered);
  }, [editMilestones]);

  const visibleMilestones = editMilestones.filter(m => !deletedIds.has(m.id));

  const handleSave = async () => {
    if (!kr) return;
    setSaving(true);

    // Create new milestones
    const createdIds: number[] = [];
    for (const desc of newMilestones) {
      const trimmed = desc.trim();
      if (!trimmed) continue;
      try {
        const res = await createMilestone({ key_result_id: kr.id, description: trimmed });
        if (res.code === 0 && res.data) {
          createdIds.push(res.data.id);
        }
      } catch {
        showToast('创建节点失败');
        setSaving(false);
        return;
      }
    }

    // Update changed descriptions
    for (const m of editMilestones) {
      if (deletedIds.has(m.id)) continue;
      const original = originalDescriptions.get(m.id);
      if (original !== undefined && original !== m.description) {
        try {
          await updateMilestone({ id: m.id, description: m.description });
        } catch {
          showToast('更新节点失败');
          setSaving(false);
          return;
        }
      }
    }

    // Delete soft-deleted milestones
    for (const id of deletedIds) {
      try {
        await deleteMilestone(id);
      } catch {
        showToast('删除节点失败');
        setSaving(false);
        return;
      }
    }

    // Reorder surviving milestones in local order
    const survivingIds = editMilestones
      .filter(m => !deletedIds.has(m.id))
      .map(m => m.id);
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

    setSaving(false);
    onSave();
    onClose();
  };

  const handleClose = () => {
    if (saving) return;
    onClose();
  };

  if (!kr) return null;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={`管理里程碑节点 - ${kr.title}`}>
      <div className={styles.field}>
        <label className={styles.fLabel}>里程碑节点</label>

        {visibleMilestones.length === 0 && newMilestones.every(m => !m.trim()) ? (
          <p style={{ fontSize: 13, color: 'var(--text-muted)', padding: '8px 0' }}>暂无里程碑节点，请在下方添加</p>
        ) : (
          <DragDropContext onDragEnd={handleLocalDragEnd}>
            <Droppable droppableId={`ms-editor-${kr.id}`} type="milestone-editor">
              {(provided) => (
                <div ref={provided.innerRef} {...provided.droppableProps} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {visibleMilestones.map((m, index) => (
                    <Draggable key={m.id} draggableId={`ms-editor-${m.id}`} index={index}>
                      {(dragProvided) => (
                        <div className={styles.msItem} ref={dragProvided.innerRef as React.Ref<HTMLDivElement>} {...dragProvided.draggableProps} style={{ gap: 6, ...dragProvided.draggableProps.style }}>
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
                            onClick={() => setDeletedIds(prev => new Set([...prev, m.id]))}
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

        <button
          className={styles.editorAddBtn}
          onClick={() => setNewMilestones([...newMilestones, ''])}
        >
          + 添加节点
        </button>
      </div>

      <div className={styles.modalBtns}>
        <button className={styles.btnSec} onClick={handleClose} disabled={saving}>取消</button>
        <button className={styles.btnPri} onClick={handleSave} disabled={saving}>
          {saving ? '保存中...' : '保存'}
        </button>
      </div>
    </Modal>
  );
}
