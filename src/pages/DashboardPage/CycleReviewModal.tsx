import { useEffect, useRef, useState } from 'react';
import { Modal } from '../../components/common/Modal';
import { OkrReferenceEditor, type OkrReferenceEditorHandle } from '../../components/common/OkrReference';
import type { Cycle, CycleReview, CycleReviewDraft, Objective } from '../../types';
import styles from './CycleReviewModal.module.css';

interface CycleReviewModalProps {
  isOpen: boolean;
  cycle: Cycle | null;
  objectives: Objective[];
  review: CycleReview | null;
  loading: boolean;
  saving: boolean;
  onClose: () => void;
  onSave: (draft: CycleReviewDraft) => void;
  onSaveAndArchive: (draft: CycleReviewDraft) => void;
}

const fields: Array<{ key: keyof CycleReviewDraft; label: string; placeholder: string }> = [
  { key: 'summary', label: '阶段结论', placeholder: '这一阶段的整体结果如何？与最初的目标相比有哪些变化？' },
  { key: 'highlights', label: '关键进展', placeholder: '哪些结果值得保留或继续放大？' },
  { key: 'blockers', label: '未完成项与阻碍', placeholder: '哪些 KR 没有达成？主要原因是什么？' },
  { key: 'learnings', label: '经验与反思', placeholder: '哪些做法有效，哪些需要调整？' },
  { key: 'next_steps', label: '下一阶段行动', placeholder: '接下来要继续、停止或尝试什么？' },
];

const emptyDraft: CycleReviewDraft = {
  summary: '',
  highlights: '',
  blockers: '',
  learnings: '',
  next_steps: '',
};

export function CycleReviewModal({
  isOpen,
  cycle,
  objectives,
  review,
  loading,
  saving,
  onClose,
  onSave,
  onSaveAndArchive,
}: CycleReviewModalProps) {
  const [draft, setDraft] = useState<CycleReviewDraft>(emptyDraft);
  const [currentStep, setCurrentStep] = useState(0);
  const [showReferencePicker, setShowReferencePicker] = useState(false);
  const editorRef = useRef<OkrReferenceEditorHandle>(null);

  useEffect(() => {
    if (isOpen) {
      setCurrentStep(0);
      setShowReferencePicker(false);
    }
  }, [isOpen, cycle?.id]);

  useEffect(() => {
    setShowReferencePicker(false);
  }, [currentStep]);

  useEffect(() => {
    if (!isOpen) return;
    setDraft(review ? {
      summary: review.summary,
      highlights: review.highlights,
      blockers: review.blockers,
      learnings: review.learnings,
      next_steps: review.next_steps,
    } : emptyDraft);
  }, [isOpen, review, cycle?.id]);

  if (!cycle) return null;

  const canSubmit = fields.some(field => draft[field.key].trim().length > 0);
  const keyResults = objectives.flatMap(objective => objective.key_results);
  const keyResultCount = keyResults.length;
  const averageProgress = keyResultCount
    ? Math.round(keyResults.reduce((total, keyResult) => total + keyResult.progress, 0) / keyResultCount)
    : 0;

  const updateField = (key: keyof CycleReviewDraft, value: string) => {
    setDraft(current => ({ ...current, [key]: value }));
  };
  const currentField = fields[currentStep];
  const isLastStep = currentStep === fields.length - 1;
  const isBusy = saving || loading;
  const insertReference = (kind: 'o' | 'kr', id: number) => {
    editorRef.current?.insertReference(kind, id);
    setShowReferencePicker(false);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="阶段复盘">
      <div className={styles.cycleInfo}>
        <strong>{cycle.name}</strong>
        <span>{cycle.start_date} 至 {cycle.end_date}</span>
      </div>

      <details className={styles.progressDetails}>
        <summary className={styles.progressSummary}>
          <span>查看本周期进展</span>
          <span>{objectives.length} 个目标 · {keyResultCount} 个 KR · 平均完成 {averageProgress}%</span>
        </summary>
        {loading ? (
          <p className={styles.progressEmpty}>正在加载已保存的复盘…</p>
        ) : objectives.length === 0 ? (
          <p className={styles.progressEmpty}>这个周期还没有目标，仍可先记录阶段复盘。</p>
        ) : (
          <ul className={styles.objectiveList}>
            {objectives.map(objective => (
              <li key={objective.id}>
                <div className={styles.objectiveHeading}>
                  <span>{objective.title}</span>
                  <strong>{objective.progress}%</strong>
                </div>
                {objective.key_results.length > 0 && (
                  <ul className={styles.keyResultList}>
                    {objective.key_results.map(keyResult => (
                      <li key={keyResult.id}>
                        <span>{keyResult.title}</span>
                        <span>{keyResult.progress}%</span>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        )}
      </details>

      <section className={styles.step} aria-label={`第 ${currentStep + 1} 项，共 ${fields.length} 项`}>
        <div className={styles.stepMeta}>
          <span>第 {currentStep + 1} / {fields.length} 项</span>
          <span>可留空</span>
        </div>
        <div className={styles.stepProgress} role="progressbar" aria-label="复盘填写进度" aria-valuemin={1} aria-valuemax={fields.length} aria-valuenow={currentStep + 1}>
          <span style={{ width: `${((currentStep + 1) / fields.length) * 100}%` }} />
        </div>
        <label className={styles.stepLabel} htmlFor={`review-${currentField.key}`}>{currentField.label}</label>
        <OkrReferenceEditor
          className={styles.stepTextarea}
          id={`review-${currentField.key}`}
          ref={editorRef}
          value={draft[currentField.key]}
          objectives={objectives}
          onChange={value => updateField(currentField.key, value)}
          placeholder={currentField.placeholder}
          maxLength={5000}
          disabled={isBusy}
        />
        <div className={styles.referenceToolbar}>
          <button
            className={styles.referenceToggle}
            type="button"
            aria-expanded={showReferencePicker}
            onMouseDown={event => event.preventDefault()}
            onClick={() => setShowReferencePicker(open => !open)}
            disabled={isBusy}
          >
            {showReferencePicker ? '收起引用' : '＋ 引用 O / KR'}
          </button>
          <span>引用会高亮显示，标题与进度动态更新</span>
        </div>
        {showReferencePicker && (
          <div className={styles.referencePicker}>
            <div className={styles.referencePickerHeading}>
              <strong>选择本周期的 O 或 KR</strong>
              <span>引用保存为 O / KR 占位符</span>
            </div>
            {loading ? (
              <p className={styles.referenceEmpty}>正在加载…</p>
            ) : objectives.length === 0 ? (
              <p className={styles.referenceEmpty}>当前周期还没有可引用的 O 或 KR。</p>
            ) : (
              <div className={styles.referenceList}>
                {objectives.map(objective => (
                  <div className={styles.referenceGroup} key={objective.id}>
                    <button
                      className={`${styles.referenceItem} ${styles.referenceObjective}`}
                      type="button"
                      onMouseDown={event => event.preventDefault()}
                      onClick={() => insertReference('o', objective.id)}
                      disabled={isBusy}
                    >
                      <span className={styles.referenceBadge}>O</span>
                      <span className={styles.referenceTitle}>{objective.title}</span>
                      <span className={styles.referenceProgress}>{objective.progress}%</span>
                    </button>
                    {objective.key_results.map(keyResult => (
                      <button
                        className={`${styles.referenceItem} ${styles.referenceKeyResult}`}
                        type="button"
                        key={keyResult.id}
                        onMouseDown={event => event.preventDefault()}
                        onClick={() => insertReference('kr', keyResult.id)}
                        disabled={isBusy}
                      >
                        <span className={styles.referenceBadge}>KR</span>
                        <span className={styles.referenceTextGroup}>
                          <span className={styles.referenceTitle}>{keyResult.title}</span>
                          <span className={styles.referenceMeta}>{objective.title}</span>
                        </span>
                        <span className={styles.referenceProgress}>{keyResult.progress}%</span>
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </section>

      {isLastStep && <p className={styles.archiveHint}>归档后，本周期的目标和关键结果会转入历史记录并设为只读。</p>}
      <div className={styles.actions}>
        <button className={styles.cancelButton} onClick={onClose} disabled={saving}>取消</button>
        <div className={styles.actionGroup}>
          {currentStep > 0 && (
            <button className={styles.secondaryButton} onClick={() => setCurrentStep(step => step - 1)} disabled={isBusy}>
              上一步
            </button>
          )}
          <button className={styles.secondaryButton} onClick={() => onSave(draft)} disabled={!canSubmit || isBusy}>
            {saving ? '保存中…' : '保存复盘'}
          </button>
          {isLastStep ? (
            <button className={styles.archiveButton} onClick={() => onSaveAndArchive(draft)} disabled={!canSubmit || isBusy}>
              {saving ? '处理中…' : '保存并归档'}
            </button>
          ) : (
            <button className={styles.archiveButton} onClick={() => setCurrentStep(step => step + 1)} disabled={isBusy}>
              下一步
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
}
