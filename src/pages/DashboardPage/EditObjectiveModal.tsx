import { useEffect, useState } from 'react';
import { Modal } from '../../components/common/Modal';
import { updateObjective, archiveObjective } from '../../api/objectives';
import type { Objective } from '../../types';
import styles from './style.module.css';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  objective: Objective | null;
  onSaved: () => void;
  showToast: (msg: string) => void;
}

export function EditObjectiveModal({ isOpen, onClose, objective, onSaved, showToast }: Props) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (isOpen && objective) {
      setTitle(objective.title);
      setDescription(objective.description || '');
      setShowDeleteConfirm(false);
      setSaving(false);
    }
  }, [isOpen, objective]);

  const handleSave = async () => {
    if (!title.trim()) {
      showToast('请输入目标标题');
      return;
    }
    setSaving(true);
    try {
      await updateObjective({
        id: objective!.id,
        title: title.trim(),
        description: description.trim() || undefined,
      });
      showToast('目标已更新');
      onSaved();
      onClose();
    } catch {
      showToast('更新失败');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setSaving(true);
    try {
      await archiveObjective(objective!.id);
      showToast('目标已删除');
      setShowDeleteConfirm(false);
      onSaved();
      onClose();
    } catch {
      showToast('删除失败');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title="编辑目标">
        <div className={styles.field}>
          <label className={styles.fLabel}>目标标题 *</label>
          <input
            className={styles.fInput}
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="如：提升技术影响力"
          />
        </div>
        <div className={styles.field}>
          <label className={styles.fLabel}>描述（选填）</label>
          <textarea
            className={styles.fInput}
            rows={3}
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="补充目标的背景与细节"
            style={{ resize: 'vertical' }}
          />
        </div>
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
          确定要删除目标「{objective?.title}」吗？其下的所有关键结果也将一并删除。
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
